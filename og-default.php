<?php
/**
 * og-default.php - Dynamic OG Image Generator
 * 
 * Generates a branded image for social media previews when ads have no photos.
 * Can be customized per ad or show generic branding.
 * 
 * Usage: 
 *   - /icons/og-default.php (generic)
 *   - /icons/og-default.php?ad=23 (customized for ad)
 */

header('Content-Type: image/svg+xml');
header('Cache-Control: public, max-age=86400'); // Cache for 24 hours

// Get ad ID if provided
$adId = isset($_GET['ad']) ? intval($_GET['ad']) : 0;
$title = 'Tangle-me';
$subtitle = 'Global Classifieds';
$keywords = '';

// If ad ID provided, fetch ad title
if ($adId > 0) {
    try {
        $pdo = new PDO(
            "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
            'u143213086_tangleme',
            'fake.name.forever@3eLNma'
        );
        $stmt = $pdo->prepare('SELECT keywords FROM ads WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$adId]);
        $ad = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($ad) {
            $keywords = htmlspecialchars($ad['keywords']);
            // Truncate if too long
            if (strlen($keywords) > 60) {
                $keywords = substr($keywords, 0, 57) . '...';
            }
        }
    } catch (Exception $e) {
        // Silently fail - use default
    }
}

// Output SVG
echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e"/>
            <stop offset="50%" style="stop-color:#16213e"/>
            <stop offset="100%" style="stop-color:#0f3460"/>
        </linearGradient>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4ade80"/>
            <stop offset="100%" style="stop-color:#22d3ee"/>
        </linearGradient>
        <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#667eea"/>
            <stop offset="100%" style="stop-color:#764ba2"/>
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bgGradient)"/>
    
    <!-- Decorative circles -->
    <circle cx="100" cy="530" r="200" fill="rgba(102, 126, 234, 0.1)"/>
    <circle cx="1100" cy="100" r="250" fill="rgba(74, 222, 128, 0.08)"/>
    
    <!-- Logo -->
    <g transform="translate(500, 150)">
        <!-- Two heads -->
        <circle cx="70" cy="40" r="25" fill="#4ade80"/>
        <circle cx="130" cy="40" r="25" fill="#22d3ee"/>
        <!-- Body/connection -->
        <path d="M100 80 C60 80 40 130 40 170 C40 190 55 205 85 205 C105 205 100 160 100 160 C100 160 95 205 115 205 C145 205 160 190 160 170 C160 130 140 80 100 80Z" fill="url(#logoGradient)" opacity="0.9"/>
    </g>
    
    <!-- Brand name -->
    <text x="600" y="340" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="700" fill="white">
        Tangle-me
    </text>
    
    <!-- Tagline or Ad Title -->
    <?php if ($keywords): ?>
    <text x="600" y="400" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" fill="rgba(255,255,255,0.9)">
        <?= $keywords ?>
    </text>
    <?php else: ?>
    <text x="600" y="400" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)">
        Global Classifieds · Free to Post
    </text>
    <?php endif; ?>
    
    <!-- CTA Button -->
    <rect x="450" y="450" width="300" height="60" rx="30" fill="url(#buttonGradient)"/>
    <text x="600" y="490" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" fill="white">
        View on Tangle-me
    </text>
    
    <!-- Domain -->
    <text x="600" y="580" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" fill="rgba(255,255,255,0.5)">
        tangle-me.com
    </text>
</svg>
