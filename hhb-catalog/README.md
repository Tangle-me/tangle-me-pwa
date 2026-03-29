# HHB Catalog v3 — Deployment Guide

## What's New in v3
1. **Scroll bug FIXED** — Adding qty no longer resets your position
2. **Admin lock button** — 🔒 icon bottom-left, tap → PIN → admin mode
3. **Photo carousel** — Products can show multiple photos (kits, shared images)
4. **Admin dashboard** — Monthly price updates, discontinue products, photo mapping
5. **Separated data** — catalog-data.js loads separately from app code
6. **PIN changed to: 1320**

## Files in This Package
- `app.html` — Main catalog PWA (replaces old app.html)
- `catalog-data.js` — Product data (7,517 products, 541KB)
- `photo_map.json` — Photo-to-code mappings
- `admin.html` — Admin dashboard for managing catalog
- `update-catalog.php` — Backend for price updates & product management
- `config.php` — Database config (EDIT THIS)
- `save-order.php` — Order submission endpoint
- `get-orders.php` — Order retrieval endpoint
- `update-order.php` — Order status update endpoint
- `setup.sql` — Database table creation script

## Deployment Steps

### 1. Edit config.php
Open `config.php` and set your MySQL password:
```
define('DB_PASS', 'YOUR_DB_PASSWORD');
```

### 2. Upload to Hostinger
1. Open Hostinger File Manager
2. Navigate to `/public_html/hhb-catalog/`
3. Upload `hhb-catalog-v3.zip`
4. Extract → tick "Overwrite existing files"
5. Delete the zip file after extraction

### 3. Create Database Table (first time only)
1. Open phpMyAdmin
2. Select `u143213086_tangleme` database
3. Go to SQL tab
4. Paste contents of `setup.sql`
5. Click Go

## Monthly Price Update Workflow
1. Receive new Excel price list from HHB
2. Go to `tangle-me.com/hhb-catalog/admin.html`
3. Enter PIN: 1320
4. Click "Update Prices" tab
5. Upload the Excel file
6. Review changes → click "Apply"
7. Done — catalog prices update instantly

## Photo Mapping for Kits
Example: P999 is a kit containing P997 + 6005 + P996

1. Go to admin.html → Photos tab
2. Photo filename: `P999.jpg`
3. Codes: `P999, P997, 6005, P996`
4. Click "Add Mapping" → "Save"
5. Now tapping any of those 4 codes shows P999.jpg

## Admin Mode in Catalog
- Tap 🔒 (bottom-left) → enter PIN 1320
- Prices become visible, Orders button appears
- Tap red "ADMIN ✕" badge to exit
