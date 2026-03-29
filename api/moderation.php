<?php
/**
 * Tangle-me - Content Moderation (PHP Backend)
 * Add to: /public_html/api/moderation.php
 * Then include in post-ad.php and send-message.php
 */

// Comprehensive blocked words list
$BLOCKED_WORDS = [
    // Profanity
    'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker',
    'shit', 'shitting', 'bullshit', 'shitty',
    'bitch', 'bitches', 'bitchy',
    'asshole', 'arsehole', 'ass', 'arse',
    'bastard', 'damn', 'goddamn', 'crap',
    'piss', 'pissed', 'cock', 'cocks', 'cocksucker',
    'dick', 'dicks', 'dickhead',
    'pussy', 'pussies', 'cunt', 'cunts',
    'whore', 'whores', 'slut', 'sluts',
    'twat', 'wanker', 'tosser', 'prick',
    
    // Racial slurs
    'nigger', 'nigga', 'niggers', 'niggas',
    'spic', 'wetback', 'beaner', 'chink', 'gook',
    'kike', 'wop', 'dago', 'polack', 'paki',
    'raghead', 'towelhead', 'coon', 'darkie',
    
    // Homophobic
    'faggot', 'faggots', 'fag', 'fags',
    'dyke', 'homo', 'tranny',
    
    // Ableist
    'retard', 'retarded', 'spaz', 'spastic',
    
    // Sexual/Pornographic
    'porn', 'porno', 'pornography', 'xxx',
    'escort service', 'prostitute', 'hooker',
    'stripper', 'nude', 'nudes', 'naked',
    'blowjob', 'handjob', 'cumshot', 'gangbang',
    'masturbate', 'dildo', 'vibrator',
    'onlyfans', 'webcam girl', 'adult content',
    'erotic massage', 'happy ending', 'sugar daddy',
    
    // Drugs
    'cocaine', 'heroin', 'meth', 'methamphetamine',
    'mdma', 'ecstasy', 'molly', 'lsd', 'acid',
    'weed', 'marijuana', 'cannabis', '420',
    'drug dealer', 'crack', 'fentanyl', 'ketamine',
    'buy drugs', 'sell drugs',
    
    // Violence
    'killer', 'killers', 'hitman', 'assassin',
    'murder', 'rape', 'rapist', 'molest',
    'torture', 'kidnap', 'bomb making',
    'terrorist', 'kill someone',
    
    // Scams
    'nigerian prince', 'money laundering', 'pyramid scheme',
    'get rich quick', 'phishing', 'identity theft',
    
    // Child safety
    'child porn', 'pedo', 'pedophile', 'underage'
];

/**
 * Check if text contains blocked content
 * @param string $text Text to check
 * @return array ['clean' => bool, 'blocked' => array]
 */
function moderateContentPHP($text) {
    global $BLOCKED_WORDS;
    
    if (empty($text) || !is_string($text)) {
        return ['clean' => true, 'blocked' => []];
    }
    
    $lowerText = strtolower($text);
    $foundBlocked = [];
    
    foreach ($BLOCKED_WORDS as $word) {
        // Word boundary matching
        $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
        if (preg_match($pattern, $lowerText)) {
            $foundBlocked[] = $word;
        }
    }
    
    // Check for l33t speak bypass attempts
    $leetText = str_replace(
        ['0', '1', '3', '4', '5', '7', '8', '@', '$'],
        ['o', 'i', 'e', 'a', 's', 't', 'b', 'a', 's'],
        $lowerText
    );
    
    if ($leetText !== $lowerText) {
        foreach ($BLOCKED_WORDS as $word) {
            $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
            if (preg_match($pattern, $leetText) && !in_array($word, $foundBlocked)) {
                $foundBlocked[] = $word . ' (disguised)';
            }
        }
    }
    
    return [
        'clean' => count($foundBlocked) === 0,
        'blocked' => array_unique($foundBlocked)
    ];
}

/**
 * Validate content - returns error message or null if clean
 * @param string $text Text to validate
 * @param string $fieldName Field name for error message
 * @return string|null Error message or null
 */
function validateContentPHP($text, $fieldName = 'content') {
    $result = moderateContentPHP($text);
    
    if (!$result['clean']) {
        error_log('[CONTENT-MODERATION] Blocked in ' . $fieldName . ': ' . implode(', ', $result['blocked']));
        return "Your {$fieldName} contains prohibited content that violates our Terms of Service.";
    }
    
    return null;
}
