<?php
/**
 * FileProcessor.php
 * Handles ZIP extraction, CSV/XLSX/TXT/JSON parsing.
 */

class FileProcessor
{
    private array  $uploadedFile;
    private string $workDir;

    public function __construct(array $uploadedFile)
    {
        $this->uploadedFile = $uploadedFile;
        $this->workDir      = TEMP_DIR . bin2hex(random_bytes(8)) . '/';
        mkdir($this->workDir, 0755, true);
    }

    public function extract(): array
    {
        $tmp  = $this->uploadedFile['tmp_name'];
        $name = $this->uploadedFile['name'];
        $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $mime = $this->sniffMime($tmp);

        $dataFile = null;
        $images   = [];

        if ($ext === 'zip' || in_array($mime, ['application/zip','application/x-zip-compressed'], true)) {
            [$dataFile, $images] = $this->extractZip($tmp);
        } elseif (in_array($mime, ALLOWED_IMAGE_MIMES, true)) {
            $dest = $this->workDir . $this->safeName($name);
            move_uploaded_file($tmp, $dest);
            $images[] = $dest;
        } elseif (in_array($ext, ALLOWED_DATA_EXT, true)) {
            $dest = $this->workDir . $this->safeName($name);
            move_uploaded_file($tmp, $dest);
            $dataFile = $dest;
        } else {
            throw new RuntimeException("Unsupported file type: .{$ext}");
        }

        return [
            'data_file'  => $dataFile,
            'images'     => $images,
            'temp_token' => basename(rtrim($this->workDir, '/')),
        ];
    }

    public function parseDataFile(string $path): array
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return match ($ext) {
            'csv'         => $this->parseCsv($path),
            'txt'         => $this->parseTxt($path),
            'json'        => $this->parseJson($path),
            'xlsx','xls'  => $this->parseXlsx($path),
            default       => throw new RuntimeException("Cannot parse .{$ext} files."),
        };
    }

    public function cleanup(?string $dataFile, array $images): void
    {
        foreach (array_filter(array_merge([$dataFile], $images)) as $f) {
            if (is_file($f)) unlink($f);
        }
        if (is_dir($this->workDir) && count(scandir($this->workDir)) === 2) {
            rmdir($this->workDir);
        }
    }

    private function extractZip(string $zipPath): array
    {
        if (!class_exists('ZipArchive')) {
            throw new RuntimeException('ZipArchive extension not enabled on this server.');
        }
        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new RuntimeException('Cannot open ZIP - file may be corrupt or password-protected.');
        }

        // ZIP bomb protection
        $totalSize = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $totalSize += $zip->statIndex($i)['size'];
            if ($totalSize > MAX_UNZIPPED_BYTES) {
                $zip->close();
                throw new RuntimeException('ZIP contents exceed ' . (MAX_UNZIPPED_BYTES / 1024 / 1024) . 'MB limit.');
            }
        }

        $dataFile = null;
        $images   = [];
        $seen     = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $origName = $zip->getNameIndex($i);
            if (substr($origName, -1) === '/'
                || str_starts_with(basename($origName), '.')
                || str_contains($origName, '__MACOSX')) {
                continue;
            }

            $base = strtolower(basename($origName));
            $ext  = pathinfo($base, PATHINFO_EXTENSION);
            if (isset($seen[$base])) continue;
            $seen[$base] = true;

            $safeDest = $this->workDir . $this->safeName(basename($origName));
            $content  = $zip->getFromIndex($i);
            if ($content === false) continue;
            file_put_contents($safeDest, $content);

            if (in_array($ext, ALLOWED_DATA_EXT, true) && $dataFile === null) {
                $dataFile = $safeDest;
            } elseif (in_array($ext, ALLOWED_IMAGE_EXT, true)) {
                $mime = $this->sniffMime($safeDest);
                if (!in_array($mime, ALLOWED_IMAGE_MIMES, true) || filesize($safeDest) > MAX_IMAGE_BYTES) {
                    unlink($safeDest);
                    continue;
                }
                $images[] = $safeDest;
            } else {
                unlink($safeDest);
            }
        }

        $zip->close();
        return [$dataFile, $images];
    }

    private function parseCsv(string $path): array
    {
        $sample    = file_get_contents($path, false, null, 0, 4096);
        $delimiter = $this->guessDelimiter($sample);
        $rows      = [];
        $headers   = null;
        $handle    = fopen($path, 'r');
        if (!$handle) throw new RuntimeException('Cannot open CSV file.');

        $n = 0;
        while (($cols = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (++$n > MAX_ROWS_PER_IMPORT + 1) break;
            if ($headers === null) {
                $headers = array_map(fn($h) => trim((string) $h), $cols);
                continue;
            }
            $cols = array_slice(array_pad($cols, count($headers), ''), 0, count($headers));
            $row  = array_combine($headers, array_map('trim', $cols));
            if ($row && !$this->isBlankRow($row)) $rows[] = $row;
        }
        fclose($handle);
        return $rows;
    }

    private function parseTxt(string $path): array
    {
        $peek = trim(file_get_contents($path, false, null, 0, 100));
        if (isset($peek[0]) && ($peek[0] === '[' || $peek[0] === '{')) return $this->parseJson($path);
        return $this->parseCsv($path);
    }

    private function parseJson(string $path): array
    {
        $data = json_decode(file_get_contents($path), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Invalid JSON: ' . json_last_error_msg());
        }
        if (is_array($data) && !isset($data[0])) {
            foreach (['listings','data','ads','items','results','properties','vehicles','records'] as $k) {
                if (isset($data[$k]) && is_array($data[$k])) { $data = $data[$k]; break; }
            }
        }
        if (!is_array($data) || empty($data)) {
            throw new RuntimeException('JSON does not contain a recognisable array of records.');
        }
        return array_map(fn($row) => $this->flattenRow($row), array_slice($data, 0, MAX_ROWS_PER_IMPORT));
    }

    private function parseXlsx(string $path): array
    {
        if (!class_exists('ZipArchive')) throw new RuntimeException('ZipArchive required for XLSX.');
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) throw new RuntimeException('Cannot open XLSX file.');

        $sharedStrings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml !== false) {
            $ss = simplexml_load_string($ssXml);
            foreach ($ss->si as $si) {
                $text = '';
                if (isset($si->t)) $text = (string) $si->t;
                elseif (isset($si->r)) foreach ($si->r as $r) $text .= (string) $r->t;
                $sharedStrings[] = $text;
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();
        if (!$sheetXml) throw new RuntimeException('Cannot read sheet1 from XLSX.');

        $sheet   = simplexml_load_string($sheetXml);
        $rows    = [];
        $headers = null;

        foreach ($sheet->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $cell) {
                $type  = (string) $cell['t'];
                $value = (string) $cell->v;
                if ($type === 's') $value = $sharedStrings[(int) $value] ?? '';
                $cells[] = trim($value);
            }
            if ($headers === null) { $headers = $cells; continue; }
            $cells   = array_slice(array_pad($cells, count($headers), ''), 0, count($headers));
            $rowData = array_combine($headers, $cells);
            if (!$this->isBlankRow($rowData)) $rows[] = $rowData;
            if (count($rows) >= MAX_ROWS_PER_IMPORT) break;
        }
        return $rows;
    }

    private function sniffMime(string $path): string
    {
        return (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
    }

    private function guessDelimiter(string $sample): string
    {
        $firstLine = strtok($sample, "\n");
        $counts    = [',' => substr_count($firstLine, ','), ';' => substr_count($firstLine, ';'),
                      "\t" => substr_count($firstLine, "\t"), '|' => substr_count($firstLine, '|')];
        arsort($counts);
        return (string) array_key_first($counts);
    }

    private function isBlankRow(array $row): bool
    {
        foreach ($row as $v) if (trim((string) $v) !== '') return false;
        return true;
    }

    private function safeName(string $name): string
    {
        return preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($name));
    }

    private function flattenRow(array $row, string $prefix = ''): array
    {
        $out = [];
        foreach ($row as $k => $v) {
            $key = $prefix ? "{$prefix}_{$k}" : (string) $k;
            if (is_array($v) && array_keys($v) !== range(0, count($v) - 1)) {
                $out = array_merge($out, $this->flattenRow($v, $key));
            } else {
                $out[$key] = is_array($v) ? implode(', ', $v) : (string) $v;
            }
        }
        return $out;
    }
}
