<?php
/**
 * Placeholder image for ads without photos
 * Returns a simple SVG placeholder
 */

header('Content-Type: image/svg+xml');
header('Cache-Control: public, max-age=86400');

echo '<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f0f4ff"/>
  <text x="200" y="140" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#cbd5e0">📷</text>
  <text x="200" y="180" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#a0aec0">No photo</text>
</svg>';
