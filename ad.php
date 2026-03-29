<?php
/**
 * Tangle-me Ad Landing Page
 * Standalone Ad View for Social Sharing (OG tags + photo gallery)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// Get ad ID from URL
$adId = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Default values
$title = 'Tangle-me - Global Classifieds';
$description = 'Free classified ads worldwide. Post and find ads near you.';
$imageUrl = 'https://tangle-me.com/icons/icon-512x512.png';
$url = 'https://tangle-me.com';
$siteName = 'Tangle-me';

// Ad data
$ad = null;
$photos = [];

if ($adId > 0) {
    try {
        $pdo = new PDO(
            "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
            "u143213086_tangleme",
            "fake.name.forever@3eLNma",
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $stmt = $pdo->prepare("
            SELECT a.*, u.username
            FROM ads a 
            LEFT JOIN users u ON a.user_id = u.id 
            WHERE a.id = ? AND (a.status IS NULL OR a.status != 'deleted')
        ");
        $stmt->execute([$adId]);
        $ad = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($ad) {
            $title = htmlspecialchars($ad['keywords']) . ' - Tangle-me';
            $description = htmlspecialchars($ad['description'] ?: $ad['keywords']);
            $url = "https://tangle-me.com/ad.php?id={$adId}";
            
            // Parse photos
            if (!empty($ad['photos'])) {
                $photos = json_decode($ad['photos'], true) ?: [];
                if (!empty($photos) && isset($photos[0])) {
                    $photoPath = $photos[0]['full'] ?? $photos[0]['thumb'] ?? null;
                    if ($photoPath) {
                        $imageUrl = "https://tangle-me.com/" . ltrim($photoPath, '/');
                    }
                }
            }
            
            // Enhance description for OG
            if (!empty($ad['location_address'])) {
                $description .= " | 📍 " . htmlspecialchars($ad['location_address']);
            }
        }
        
    } catch (PDOException $e) {
        error_log("Ad page error: " . $e->getMessage());
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title><?php echo $title; ?></title>
    <meta name="title" content="<?php echo $title; ?>">
    <meta name="description" content="<?php echo $description; ?>">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo $url; ?>">
    <meta property="og:title" content="<?php echo $title; ?>">
    <meta property="og:description" content="<?php echo $description; ?>">
    <meta property="og:image" content="<?php echo $imageUrl; ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="<?php echo $siteName; ?>">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?php echo $url; ?>">
    <meta property="twitter:title" content="<?php echo $title; ?>">
    <meta property="twitter:description" content="<?php echo $description; ?>">
    <meta property="twitter:image" content="<?php echo $imageUrl; ?>">
    
    <!-- WhatsApp -->
    <meta property="og:image:secure_url" content="<?php echo $imageUrl; ?>">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/icons/icon-192x192.png">
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    
    <!-- PWA -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#667eea">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    
    <!-- Flag Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 1rem;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 1rem 0 1.5rem;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.5rem;
            font-size: 1.5rem;
        }
        
        .brand {
            color: white;
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .tagline {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        
        /* Ad Card */
        .ad-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        .ad-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ad-id {
            font-weight: 600;
        }
        
        .ad-via {
            opacity: 0.8;
            font-size: 0.75rem;
        }
        
        /* Photo */
        .ad-photo {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
            display: block;
        }
        
        .ad-photo-placeholder {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #718096;
            font-size: 3rem;
        }
        
        .photo-count {
            background: rgba(0,0,0,0.6);
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            position: absolute;
            top: 10px;
            right: 10px;
        }
        
        .photo-container {
            position: relative;
        }
        
        /* Thumbnails */
        .photo-thumbs {
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            overflow-x: auto;
            background: #f7fafc;
        }
        
        .photo-thumb {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            flex-shrink: 0;
        }
        
        .photo-thumb.active {
            border-color: #667eea;
        }
        
        /* Content */
        .ad-content {
            padding: 1.25rem;
        }
        
        .ad-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 0.75rem;
            line-height: 1.3;
        }
        
        .ad-description {
            color: #4a5568;
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .ad-meta {
            background: #f0f9ff;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .meta-item {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .meta-item:last-child {
            margin-bottom: 0;
        }
        
        .meta-icon {
            font-size: 1.1rem;
            flex-shrink: 0;
        }
        
        .meta-label {
            font-weight: 600;
            color: #2d3748;
            flex-shrink: 0;
        }
        
        .meta-value {
            color: #3182ce;
            word-break: break-word;
        }
        
        /* Posted By */
        .posted-by {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: #f7fafc;
            border-top: 1px solid #e2e8f0;
        }
        
        .poster-avatar {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .poster-info {
            flex: 1;
        }
        
        .poster-name {
            font-weight: 600;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .poster-country {
            font-size: 0.85rem;
            color: #718096;
        }
        
        /* CTA Buttons */
        .cta-section {
            padding: 1.25rem;
            background: #f7fafc;
            border-top: 1px solid #e2e8f0;
        }
        
        .cta-primary {
            display: block;
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            margin-bottom: 0.75rem;
        }
        
        .cta-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
        }
        
        .cta-secondary {
            display: block;
            width: 100%;
            padding: 0.875rem;
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 1.5rem;
            color: rgba(255,255,255,0.8);
            font-size: 0.85rem;
        }
        
        .footer a {
            color: white;
            text-decoration: none;
            font-weight: 600;
        }
        
        /* Not Found */
        .not-found {
            text-align: center;
            padding: 3rem 1rem;
            background: white;
            border-radius: 16px;
        }
        
        .not-found-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        .not-found-title {
            font-size: 1.5rem;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .not-found-text {
            color: #718096;
            margin-bottom: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🌐</div>
            <div class="brand">Tangle-me</div>
            <div class="tagline">Global Classifieds</div>
        </div>
        
        <?php if ($ad): ?>
        <!-- Ad Card -->
        <div class="ad-card">
            <div class="ad-badge">
                <span class="ad-id">Ad #<?php echo $ad['id']; ?></span>
                <span class="ad-via">Shared via Tangle-me</span>
            </div>
            
            <!-- Photo -->
            <?php if (!empty($photos)): ?>
            <div class="photo-container">
                <img class="ad-photo" id="mainPhoto" 
                     src="/<?php echo htmlspecialchars($photos[0]['full'] ?? $photos[0]['thumb'] ?? ''); ?>" 
                     alt="<?php echo htmlspecialchars($ad['keywords']); ?>"
                     onerror="this.parentElement.innerHTML='<div class=\'ad-photo-placeholder\'>📷</div>'">
                <?php if (count($photos) > 1): ?>
                <span class="photo-count">📷 <?php echo count($photos); ?></span>
                <?php endif; ?>
            </div>
            
            <?php if (count($photos) > 1): ?>
            <div class="photo-thumbs">
                <?php foreach ($photos as $idx => $photo): ?>
                <img class="photo-thumb <?php echo $idx === 0 ? 'active' : ''; ?>" 
                     src="/<?php echo htmlspecialchars($photo['thumb'] ?? $photo['full'] ?? ''); ?>"
                     onclick="switchPhoto(<?php echo $idx; ?>, '<?php echo htmlspecialchars($photo['full'] ?? $photo['thumb'] ?? ''); ?>')"
                     alt="Thumbnail <?php echo $idx + 1; ?>">
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
            
            <?php else: ?>
            <div class="ad-photo-placeholder">📷</div>
            <?php endif; ?>
            
            <!-- Content -->
            <div class="ad-content">
                <h1 class="ad-title"><?php echo htmlspecialchars($ad['keywords']); ?></h1>
                
                <?php if (!empty($ad['description'])): ?>
                <p class="ad-description"><?php echo nl2br(htmlspecialchars($ad['description'])); ?></p>
                <?php endif; ?>
                
                <div class="ad-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span class="meta-label">Location:</span>
                        <span class="meta-value"><?php echo htmlspecialchars($ad['location_address'] ?: 'Not specified'); ?></span>
                    </div>
                    
                    <?php if (!empty($ad['contact'])): ?>
                    <div class="meta-item">
                        <span class="meta-icon">📞</span>
                        <span class="meta-label">Contact:</span>
                        <span class="meta-value"><?php echo htmlspecialchars($ad['contact']); ?></span>
                    </div>
                    <?php endif; ?>
                    
                    <div class="meta-item">
                        <span class="meta-icon">🕐</span>
                        <span class="meta-label">Posted:</span>
                        <span class="meta-value"><?php echo date('j M Y', strtotime($ad['created_at'])); ?></span>
                    </div>
                </div>
            </div>
            
            <!-- Posted By -->
            <?php if (!empty($ad['username'])): ?>
            <div class="posted-by">
                <div class="poster-avatar">
                    <?php echo strtoupper(substr($ad['username'], 0, 1)); ?>
                </div>
                <div class="poster-info">
                    <div class="poster-name">
                        <?php echo htmlspecialchars($ad['username']); ?>
                        <?php if (!empty($ad['country_code'])): ?>
                        <span class="fi fi-<?php echo strtolower($ad['country_code']); ?>"></span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- CTA -->
            <div class="cta-section">
                <a href="https://tangle-me.com/?contact=<?php echo $ad['user_id']; ?>&ad=<?php echo $ad['id']; ?>" class="cta-primary">
                    💬 Contact Advertiser
                </a>
                <a href="https://tangle-me.com/" class="cta-secondary">
                    🌐 Browse More Ads on Tangle-me
                </a>
            </div>
        </div>
        
        <?php else: ?>
        <!-- Not Found -->
        <div class="not-found">
            <div class="not-found-icon">🔍</div>
            <h2 class="not-found-title">Ad Not Found</h2>
            <p class="not-found-text">This ad may have been removed or is no longer available.</p>
            <a href="https://tangle-me.com/" class="cta-primary" style="display: inline-block; width: auto; padding: 1rem 2rem;">
                Browse Ads on Tangle-me
            </a>
        </div>
        <?php endif; ?>
        
        <!-- Footer -->
        <div class="footer">
            <p>Free global classifieds • Post & find ads anywhere</p>
            <p style="margin-top: 0.5rem;">
                <a href="https://tangle-me.com/">Join Tangle-me</a> - It's free!
            </p>
        </div>
    </div>
    
    <script>
        function switchPhoto(index, fullPath) {
            const mainPhoto = document.getElementById('mainPhoto');
            if (mainPhoto) {
                mainPhoto.src = '/' + fullPath;
            }
            
            // Update active thumbnail
            document.querySelectorAll('.photo-thumb').forEach((thumb, idx) => {
                thumb.classList.toggle('active', idx === index);
            });
        }
    </script>
    <script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/service-worker.js');}</script>
</body>
</html>
