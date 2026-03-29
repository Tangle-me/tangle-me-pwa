<?php
/**
 * AdImporter.php
 * ─────────────────────────────────────────────────────────────────────────────
 * Writes mapped rows to the ACTUAL Tangle-me `ads` table.
 *
 * The ads table uses: keywords, description, contact, location_lat/lng/address,
 * photos (JSON), premium_tier, country_code/name/flag, expires_at, status.
 *
 * NOT the extended schema (title, make, model, bedrooms, etc.) — those columns
 * don't exist. This importer converts Claude-mapped fields INTO the real schema.
 */

class AdImporter
{
    private PDO    $pdo;
    private int    $userId;
    private string $username;
    private string $countryCode;
    private string $countryName;
    private string $countryFlag;
    private ?float $locationLat;
    private ?float $locationLng;
    private string $locationAddress;

    public function __construct(
        PDO    $pdo,
        int    $userId,
        string $username,
        string $countryCode     = '',
        string $countryName     = '',
        string $countryFlag     = '',
        ?float $locationLat     = null,
        ?float $locationLng     = null,
        string $locationAddress = ''
    ) {
        $this->pdo             = $pdo;
        $this->userId          = $userId;
        $this->username        = $username;
        $this->countryCode     = $countryCode;
        $this->countryName     = $countryName;
        $this->countryFlag     = $countryFlag;
        $this->locationLat     = $locationLat;
        $this->locationLng     = $locationLng;
        $this->locationAddress = $locationAddress;
    }

    /**
     * Import all rows as individual ads.
     * @return array { created, skipped, photos, errors }
     */
    public function importRows(array $rawRows, array $mapping, array $imagePaths): array
    {
        $mapper      = new ClaudeMapper(CLAUDE_API_KEY);
        $created     = 0;
        $skipped     = 0;
        $photosSaved = 0;
        $errors      = [];

        // Group images by reference prefix: EU2001_photo_1.jpg -> "EU2001"
        $imageIndex = $this->indexImages($imagePaths);

        $this->pdo->beginTransaction();
        try {
            foreach ($rawRows as $i => $raw) {
                try {
                    $mapped = $mapper->applyMapping($raw, $mapping);

                    // Build the keywords line (searchable title)
                    $keywords = $this->buildKeywords($mapped);
                    if (empty(trim($keywords))) {
                        $skipped++;
                        continue;
                    }

                    // Build description, contact, address
                    $description = $this->buildDescription($mapped);
                    $contact     = $this->buildContact($mapped);
                    $lat         = $this->getFloat($mapped['latitude'])  ?? $this->locationLat;
                    $lng         = $this->getFloat($mapped['longitude']) ?? $this->locationLng;
                    $address     = trim($this->buildAddress($mapped)) ?: $this->locationAddress;

                    // Find and process photos
                    $refNo     = trim((string) ($mapped['reference_no'] ?? ''));
                    $adImages  = $this->findImages($refNo, $i, $imageIndex);
                    $photosJson = $this->processAndSavePhotos($adImages);
                    $photosSaved += count($adImages);

                    // INSERT into actual ads table
                    $adId = $this->insertAd($keywords, $description, $contact, $lat, $lng, $address, $photosJson);

                    $created++;
                    error_log("[AdImporter] Created ad #{$adId}: " . mb_substr($keywords, 0, 60));

                } catch (Throwable $e) {
                    $errors[] = "Row " . ($i + 1) . ": " . $e->getMessage();
                    error_log("[AdImporter] Row " . ($i + 1) . " failed: " . $e->getMessage());
                    $skipped++;
                }
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return ['created' => $created, 'skipped' => $skipped, 'photos' => $photosSaved, 'errors' => $errors];
    }

    // =========================================================================
    // INSERT — matches the REAL ads table used by post-ad.php
    // =========================================================================
    private function insertAd(string $keywords, string $description, string $contact,
                              ?float $lat, ?float $lng, string $address, string $photosJson): int
    {
        // Detect which columns exist (cached per request)
        static $columns = null;
        if ($columns === null) {
            $columns = [];
            $result = $this->pdo->query("SHOW COLUMNS FROM ads");
            while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = $row['Field'];
            }
        }

        $now       = date('Y-m-d H:i:s');
        $expiresAt = date('Y-m-d H:i:s', strtotime('+90 days')); // Pro = 90 days

        $data = [
            'user_id'          => $this->userId,
            'username'         => $this->username,
            'keywords'         => mb_substr($keywords, 0, 2000),
            'description'      => mb_substr($description, 0, 5000),
            'contact'          => mb_substr($contact, 0, 500),
            'location_lat'     => $lat,
            'location_lng'     => $lng,
            'location_address' => mb_substr($address, 0, 500),
            'photos'           => $photosJson,
            'premium_tier'     => 'pro',
            'country_code'     => $this->countryCode,
            'country_name'     => $this->countryName,
            'country_flag'     => $this->countryFlag,
            'created_at'       => $now,
            'updated_at'       => $now,
            'expires_at'       => $expiresAt,
            'status'           => 'active',
        ];

        // Only include columns that actually exist in the table
        $filteredData = [];
        foreach ($data as $col => $val) {
            if (in_array($col, $columns, true)) {
                $filteredData[$col] = $val;
            }
        }

        $cols   = implode(', ', array_keys($filteredData));
        $places = implode(', ', array_map(fn($c) => ":$c", array_keys($filteredData)));
        $sql    = "INSERT INTO ads ({$cols}) VALUES ({$places})";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($filteredData);

        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // BUILD FIELDS: Claude-mapped data -> Tangle-me format
    // =========================================================================

    /**
     * Build keywords = the searchable title shown on ad cards.
     * Example: "2023 BMW M3 Competition > Mineral Grey > 12,000km > Automatic"
     */
    private function buildKeywords(array $r): string
    {
        $title = trim((string) ($r['title'] ?? ''));

        // Auto-build from make/model/year
        if (empty($title) && !empty($r['make'])) {
            $title = trim(implode(' ', array_filter([
                $r['year'] ?? '', $r['make'] ?? '', $r['model'] ?? '',
            ])));
        }

        // Try property fields
        if (empty($title) && !empty($r['property_type'])) {
            $title = trim(implode(' ', array_filter([
                $r['property_type'] ?? '',
                !empty($r['bedrooms']) ? $r['bedrooms'] . ' Bed' : '',
                $r['city'] ?? '',
            ])));
        }

        // Append key details
        $details = [];
        if (!empty($r['condition']))    $details[] = $r['condition'];
        if (!empty($r['color']))        $details[] = $r['color'];
        if (!empty($r['mileage_km']))   $details[] = number_format((float)$r['mileage_km']) . 'km';
        if (!empty($r['transmission'])) $details[] = $r['transmission'];
        if (!empty($r['fuel_type']))    $details[] = $r['fuel_type'];
        if (!empty($r['bedrooms']))     $details[] = $r['bedrooms'] . ' bed';
        if (!empty($r['bathrooms']))    $details[] = $r['bathrooms'] . ' bath';
        if (!empty($r['size_sqm']))     $details[] = $r['size_sqm'] . ' sqm';

        $keywords = $title;
        if (!empty($details)) {
            $keywords .= ' > ' . implode(' > ', array_slice($details, 0, 5));
        }

        if (!empty($r['price'])) {
            $currency = $r['currency'] ?? '';
            $keywords .= ' > ' . trim($currency . ' ' . number_format((float)$r['price']));
        }

        return trim($keywords);
    }

    private function buildDescription(array $r): string
    {
        $parts = [];
        if (!empty($r['description'])) $parts[] = trim($r['description']);

        $specs = [];
        $labels = [
            'category' => 'Category', 'subcategory' => 'Type', 'condition' => 'Condition',
            'make' => 'Make', 'model' => 'Model', 'year' => 'Year',
            'mileage_km' => 'Mileage', 'fuel_type' => 'Fuel', 'transmission' => 'Transmission',
            'color' => 'Colour', 'doors' => 'Doors', 'engine_cc' => 'Engine',
            'bedrooms' => 'Bedrooms', 'bathrooms' => 'Bathrooms', 'size_sqm' => 'Size (sqm)',
            'property_type' => 'Property Type', 'erf_size_sqm' => 'Erf Size (sqm)',
            'reference_no' => 'Ref',
        ];
        foreach ($labels as $field => $label) {
            $val = trim((string) ($r[$field] ?? ''));
            if ($val !== '' && $val !== '0') {
                if ($field === 'mileage_km') $val = number_format((float)$val) . ' km';
                if ($field === 'engine_cc')  $val .= ' cc';
                $specs[] = "{$label}: {$val}";
            }
        }
        if (!empty($specs)) $parts[] = implode("\n", $specs);

        return implode("\n\n", $parts);
    }

    private function buildContact(array $r): string
    {
        $parts = [];
        if (!empty($r['seller_name']))  $parts[] = $r['seller_name'];
        if (!empty($r['seller_phone'])) $parts[] = $r['seller_phone'];
        if (!empty($r['seller_email'])) $parts[] = $r['seller_email'];
        return implode(' | ', $parts);
    }

    private function buildAddress(array $r): string
    {
        return implode(', ', array_filter([
            trim((string)($r['address']  ?? '')),
            trim((string)($r['city']     ?? '')),
            trim((string)($r['province'] ?? '')),
            trim((string)($r['country']  ?? '')),
        ]));
    }

    // =========================================================================
    // PHOTO HANDLING — matches main app JSON format [{thumb, full}, ...]
    // =========================================================================

    private function indexImages(array $paths): array
    {
        $index = [];
        foreach ($paths as $path) {
            $base = pathinfo($path, PATHINFO_FILENAME);
            if (preg_match('/^([A-Za-z0-9]+?)(?:_photo|_img|_image|_pic|_[0-9]|$)/i', $base, $m)) {
                $ref = $m[1];
            } else {
                $ref = $base;
            }
            $index[$ref][] = $path;
        }
        return $index;
    }

    private function findImages(string $refNo, int $rowIndex, array $index): array
    {
        if (!empty($refNo) && isset($index[$refNo])) return $index[$refNo];
        $groups = array_values($index);
        if (isset($groups[$rowIndex])) return $groups[$rowIndex];
        return [];
    }

    /**
     * Process images -> WebP, save to /uploads/photos/, return JSON string.
     */
    private function processAndSavePhotos(array $imagePaths): string
    {
        if (empty($imagePaths)) return '[]';

        $photos   = [];
        $destDir  = rtrim(PHOTOS_DIR, '/') . '/';
        $thumbDir = $destDir . 'thumbs/';
        if (!is_dir($destDir))  mkdir($destDir, 0755, true);
        if (!is_dir($thumbDir)) mkdir($thumbDir, 0755, true);

        foreach (array_slice($imagePaths, 0, MAX_IMAGES_PER_AD) as $src) {
            try {
                $unique    = 'bulk_' . bin2hex(random_bytes(8));
                $fullName  = $unique . '.webp';
                $fullPath  = $destDir  . $fullName;
                $thumbPath = $thumbDir . $fullName;

                $this->convertToWebP($src, $fullPath, 1200, 82);
                $this->convertToWebP($src, $thumbPath, 400, 75);

                $photos[] = [
                    'thumb' => 'uploads/photos/thumbs/' . $fullName,
                    'full'  => 'uploads/photos/' . $fullName,
                ];
            } catch (Throwable $e) {
                error_log("[AdImporter] Photo failed: " . $e->getMessage());
                try {
                    $ext  = pathinfo($src, PATHINFO_EXTENSION) ?: 'jpg';
                    $name = 'bulk_' . bin2hex(random_bytes(8)) . '.' . $ext;
                    copy($src, $destDir . $name);
                    $photos[] = ['thumb' => 'uploads/photos/' . $name, 'full' => 'uploads/photos/' . $name];
                } catch (Throwable $e2) {
                    error_log("[AdImporter] Photo fallback also failed: " . $e2->getMessage());
                }
            }
        }

        return json_encode($photos, JSON_UNESCAPED_SLASHES);
    }

    private function convertToWebP(string $src, string $dest, int $maxWidth, int $quality): void
    {
        if (!extension_loaded('gd')) { copy($src, $dest); return; }

        $ext = strtolower(pathinfo($src, PATHINFO_EXTENSION));
        $img = match ($ext) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($src),
            'png'         => @imagecreatefrompng($src),
            'gif'         => @imagecreatefromgif($src),
            'webp'        => @imagecreatefromwebp($src),
            default       => false,
        };
        if (!$img) { copy($src, $dest); return; }

        $w = imagesx($img);
        $h = imagesy($img);
        if ($w > $maxWidth) {
            $img = imagescale($img, $maxWidth, (int) round($h * $maxWidth / $w));
        }
        imagewebp($img, $dest, $quality);
        imagedestroy($img);
    }

    private function getFloat(mixed $v): ?float
    {
        if ($v === null || $v === '') return null;
        $clean = preg_replace('/[^0-9.\-]/', '', (string) $v);
        return $clean !== '' ? (float) $clean : null;
    }
}
