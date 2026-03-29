<?php
/**
 * ClaudeMapper.php
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends file headers + sample rows to Claude API.
 * Claude returns:
 *   - Which platform the data came from (AutoTrader, Zillow, OLX, etc.)
 *   - Column mapping: source_col → tangle_col
 *   - Any transforms needed (miles→km, strip currency symbols, etc.)
 *   - Data quality warnings
 */

class ClaudeMapper
{
    private string $apiKey;
    private string $endpoint = 'https://api.anthropic.com/v1/messages';

    public function __construct(string $apiKey)
    {
        if (empty($apiKey) || $apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
            throw new RuntimeException(
                'Claude API key not set. Add CLAUDE_API_KEY to your environment variables in hPanel.'
            );
        }
        $this->apiKey = $apiKey;
    }

    // ── Main public method ────────────────────────────────────────────────────
    /**
     * Map source rows to Tangle-me schema using Claude.
     *
     * @param  array[] $rawRows     All parsed rows from the uploaded file
     * @param  int     $imageCount  Number of images found in the upload
     * @return array {
     *   detected_platform: string,
     *   mapping:           array<string,string|null>,
     *   transforms:        array<string,string>,
     *   preview_rows:      array[],   // first 3 rows already mapped
     *   warnings:          string[]
     * }
     */
    public function mapSchema(array $rawRows, int $imageCount = 0): array
    {
        if (empty($rawRows)) {
            throw new RuntimeException('No data rows to map.');
        }

        $headers    = array_keys($rawRows[0]);
        $sampleRows = array_slice($rawRows, 0, 5);

        // Call Claude
        $prompt   = $this->buildPrompt($headers, $sampleRows, $imageCount);
        $rawReply = $this->callClaude($prompt);
        $parsed   = $this->parseReply($rawReply);

        // Apply the mapping to produce preview rows
        $previewRows = [];
        foreach (array_slice($rawRows, 0, 3) as $row) {
            $previewRows[] = $this->applyMapping($row, $parsed['mapping'], $parsed['transforms']);
        }

        return [
            'detected_platform' => $parsed['detected_platform'],
            'mapping'           => $parsed['mapping'],
            'transforms'        => $parsed['transforms'],
            'preview_rows'      => $previewRows,
            'warnings'          => $parsed['warnings'],
        ];
    }

    // ── Apply mapping to one row ──────────────────────────────────────────────
    /**
     * Used both during preview and during the actual import.
     */
    public function applyMapping(array $sourceRow, array $mapping, array $transforms = []): array
    {
        // Start with all target fields = null
        $out = array_fill_keys(array_keys(TANGLE_SCHEMA), null);

        foreach ($mapping as $srcCol => $tgtCol) {
            if (!$tgtCol || $tgtCol === 'skip' || $tgtCol === 'null') continue;
            if (!array_key_exists($srcCol, $sourceRow))               continue;
            if (!array_key_exists($tgtCol, $out))                     continue;

            $val = trim((string) ($sourceRow[$srcCol] ?? ''));

            // Apply transform if Claude specified one
            $key = "{$srcCol}=>{$tgtCol}";
            if (!empty($transforms[$key])) {
                $val = $this->runTransform($val, $transforms[$key]);
            }

            $out[$tgtCol] = $val === '' ? null : $val;
        }

        // Auto-infer category when not mapped
        if (empty($out['category'])) {
            $out['category'] = $this->inferCategory($out);
        }

        // Clean price to numeric
        if (!empty($out['price'])) {
            $out['price'] = $this->cleanNumeric($out['price']);
        }

        return $out;
    }

    // ── Build the Claude prompt ───────────────────────────────────────────────
    private function buildPrompt(array $headers, array $sampleRows, int $imageCount): string
    {
        $schemaLines = '';
        foreach (TANGLE_SCHEMA as $col => $desc) {
            $schemaLines .= "  {$col}: {$desc}\n";
        }

        $headersJson = json_encode($headers, JSON_PRETTY_PRINT);
        $samplesJson = json_encode($sampleRows, JSON_PRETTY_PRINT);

        return <<<PROMPT
You are a data mapping engine for Tangle-me, a global classifieds platform.

A user uploaded a data file. Analyse it and return a JSON mapping.

SOURCE COLUMN HEADERS:
{$headersJson}

SAMPLE DATA (first 5 rows):
{$samplesJson}

IMAGES IN UPLOAD: {$imageCount}

TANGLE-ME TARGET SCHEMA:
{$schemaLines}

RULES:
- Map every source column to the single best matching target column, or null to skip it.
- Detect the source platform by name (AutoTrader, Gumtree, OLX, Zillow, Property24, Rightmove, Cars.com, etc.) or say "Unknown platform".
- If data has make/model/mileage fields → category = "Vehicles".
- If data has bedrooms/bathrooms/sqft fields → category = "Real Estate".
- If price includes currency symbols (R, $, €, £) note a "strip currency symbol" transform.
- If mileage appears to be in miles, note a "multiply by 1.60934 to convert to km" transform.
- If area appears to be in sqft, note a "multiply by 0.0929 to convert to sqm" transform.
- Transforms key format: "sourceCol=>targetCol".
- List any data quality warnings.

RESPOND WITH VALID JSON ONLY — no markdown fences, no explanation text:
{
  "detected_platform": "string",
  "mapping": {
    "source_col": "target_col_or_null"
  },
  "transforms": {
    "sourceCol=>targetCol": "description"
  },
  "warnings": ["string"]
}
PROMPT;
    }

    // ── Call Claude API ───────────────────────────────────────────────────────
    private function callClaude(string $prompt): string
    {
        $payload = json_encode([
            'model'      => CLAUDE_MODEL,
            'max_tokens' => CLAUDE_MAX_TOKENS,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        $ch = curl_init($this->endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->apiKey,
                'anthropic-version: 2023-06-01',
            ],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            throw new RuntimeException('Claude API connection failed: ' . $curlErr);
        }
        if ($httpCode !== 200) {
            $body = json_decode($response, true);
            $msg  = $body['error']['message'] ?? "HTTP {$httpCode}";
            throw new RuntimeException('Claude API error: ' . $msg);
        }

        $body = json_decode($response, true);
        if (empty($body['content'][0]['text'])) {
            throw new RuntimeException('Empty response from Claude API.');
        }

        return $body['content'][0]['text'];
    }

    // ── Parse Claude's JSON response ──────────────────────────────────────────
    private function parseReply(string $raw): array
    {
        // Strip accidental markdown code fences
        $clean = preg_replace('/^```(?:json)?\s*/m', '', $raw);
        $clean = preg_replace('/\s*```\s*$/m', '', $clean);
        $clean = trim($clean);

        $data = json_decode($clean, true);

        // Fallback: try to extract the first JSON object from a mixed response
        if (!is_array($data) && preg_match('/\{.*\}/s', $clean, $m)) {
            $data = json_decode($m[0], true);
        }

        if (empty($data['mapping'])) {
            throw new RuntimeException(
                'Claude returned an unparseable response. Check your API key and try again.'
            );
        }

        return [
            'detected_platform' => $data['detected_platform'] ?? 'Unknown platform',
            'mapping'           => $data['mapping']           ?? [],
            'transforms'        => $data['transforms']        ?? [],
            'warnings'          => $data['warnings']          ?? [],
        ];
    }

    // ── Apply one transform to a value ────────────────────────────────────────
    private function runTransform(string $value, string $desc): string
    {
        $d = strtolower($desc);

        if (str_contains($d, '1.60934') || str_contains($d, 'miles to km') || str_contains($d, 'miles to kilo')) {
            $n = (float) preg_replace('/[^0-9.]/', '', $value);
            return (string) (int) round($n * 1.60934);
        }

        if (str_contains($d, '0.0929') || str_contains($d, 'sqft') || str_contains($d, 'square feet')) {
            $n = (float) preg_replace('/[^0-9.]/', '', $value);
            return (string) round($n * 0.0929, 1);
        }

        if (str_contains($d, 'strip') || str_contains($d, 'currency') || str_contains($d, 'numeric only')) {
            return $this->cleanNumeric($value);
        }

        return $value;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function inferCategory(array $row): string
    {
        foreach (['make', 'model', 'mileage_km', 'fuel_type', 'engine_cc'] as $f) {
            if (!empty($row[$f])) return 'Vehicles';
        }
        foreach (['bedrooms', 'bathrooms', 'size_sqm', 'property_type', 'erf_size_sqm'] as $f) {
            if (!empty($row[$f])) return 'Real Estate';
        }
        return 'General';
    }

    private function cleanNumeric(string $value): string
    {
        $clean = preg_replace('/[^0-9.]/', '', $value);
        return $clean === '' ? '0' : $clean;
    }
}
