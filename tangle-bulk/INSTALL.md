# Tangle-me Universal Bulk Upload — Installation Guide

## Files in this package

| File | Purpose |
|------|---------|
| `bulk_upload.php` | Main API endpoint (POST) |
| `config.php` | All settings — edit this first |
| `ClaudeMapper.php` | Claude AI schema mapping engine |
| `FileProcessor.php` | ZIP extraction + CSV/XLSX/TXT/JSON parsing |
| `AdImporter.php` | Writes rows + photos to your database |
| `bulk_upload_ui.html` | Drop-in frontend (rename to .php and include) |

---

## Step 1 — Set your Claude API key

In Hostinger hPanel → Advanced → PHP Configuration → Environment Variables, add:

```
CLAUDE_API_KEY = sk-ant-api03-xxxxxxxxxxxxxxxx
```

Or in your `.htaccess`:
```
SetEnv CLAUDE_API_KEY sk-ant-api03-xxxxxxxxxxxxxxxx
```

Get a key at: https://console.anthropic.com/

Cost: ~$0.004 per bulk upload (uses Claude Haiku 4.5).

---

## Step 2 — Upload all files

Via Hostinger File Manager, upload all 5 PHP files to:
```
public_html/
```
Or into a subfolder, e.g. `public_html/bulk/`

---

## Step 3 — Edit config.php

Open `config.php` and confirm these paths match your setup:

```php
define('PHOTOS_DIR', __DIR__ . '/../uploads/photos/');  // where photos are stored
define('PHOTOS_URL', '/uploads/photos/');               // public URL prefix
```

Also update the DB credentials if you're not using environment variables:
```php
$dbHost = 'localhost';
$dbName = 'your_database_name';
$dbUser = 'your_db_user';
$dbPass = 'your_db_password';
```

---

## Step 4 — Add the upload button to your dashboard

Rename `bulk_upload_ui.html` to `bulk_upload_ui.php` and add this line
wherever you want the "Bulk Upload" button to appear:

```php
<?php include 'bulk_upload_ui.php'; ?>
```

If `bulk_upload.php` is in a subfolder, update the fetch URL in the
`<script>` section of the UI file:
```js
xhr.open('POST', '/bulk/bulk_upload.php', true);
// and
fetch('/bulk/bulk_upload.php', ...
```

---

## Step 5 — Check your ads table

`AdImporter.php` inserts into a table called `ads` with these columns.
If your table uses different names, edit the INSERT query in `AdImporter.php`:

```
user_id, username, title, description, category, subcategory,
price, currency, condition, make, model, year, mileage_km,
fuel_type, transmission, color, doors, engine_cc,
bedrooms, bathrooms, size_sqm, property_type, erf_size_sqm,
city, province, country, address, latitude, longitude,
seller_name, seller_phone, seller_email, seller_type,
reference_no, is_demo, status, created_at
```

Photos are inserted into `ad_photos (ad_id, photo_url, photo_order, created_at)`.

---

## How it works

1. User clicks "Bulk Upload Ads" button
2. Drops or selects a file (ZIP, CSV, Excel, TXT, JSON, or images)
3. PHP extracts + parses the file
4. Claude API reads the column headers + 5 sample rows (~800 tokens in, ~600 out)
5. Claude returns: detected platform, column mapping, any transforms needed
6. User sees a preview of first 3 listings + the mapping table
7. User clicks "Import" — rows written to DB, photos converted to WebP

---

## Accepted source formats

- **ZIP** containing a CSV/XLSX + images → photos matched to listings by filename prefix
- **CSV** with any delimiter (auto-detected: comma, semicolon, tab, pipe)
- **Excel** (.xlsx, .xls) — no external library needed, uses built-in ZipArchive + SimpleXML
- **JSON** — flat array or wrapped in `{ "listings": [...] }` etc.
- **TXT** — tab/pipe/comma separated
- **Images** — direct upload, attached to next imported ad or as standalone

---

## Security

- ZIP bomb protection: max 200MB unzipped
- Path traversal prevention: all filenames sanitised with `basename()`
- Image MIME validation: checks actual file bytes, not just extension
- All DB writes use PDO prepared statements
- Session-based import tokens (30 min expiry)
- Max 500 rows per import, 10MB per image, 100MB ZIP

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Claude API key not set" | Add CLAUDE_API_KEY to environment variables in hPanel |
| "ZipArchive not available" | Enable zip extension in hPanel → PHP extensions |
| Photos not showing | Check PHOTOS_DIR path and folder write permissions (755) |
| Import works but no ads appear | Check `status` column — should be 'active'. Also check your category filter. |
| Excel file not parsing | Ensure file is .xlsx not .xls (old format). Open and re-save as .xlsx |
