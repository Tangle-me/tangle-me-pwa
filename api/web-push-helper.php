<?php
/**
 * Tangle-me - Web Push Notification Helper
 * Build 015 - Self-contained, no composer dependencies
 * 
 * Requires PHP 7.3+ with openssl extension
 * 
 * Usage:
 *   require_once 'push-config.php';
 *   require_once 'web-push-helper.php';
 *   $result = sendWebPush($endpoint, $p256dh, $auth, $payload);
 */

/**
 * Send a Web Push notification to a single subscription
 * 
 * @param string $endpoint Push endpoint URL
 * @param string $p256dh Subscription public key (base64url)
 * @param string $auth Subscription auth secret (base64url)
 * @param string $payload JSON string payload
 * @return array ['success' => bool, 'statusCode' => int, 'reason' => string]
 */
function sendWebPush($endpoint, $p256dh, $auth, $payload) {
    try {
        // 1. Create VAPID authorization header
        $vapidHeaders = createVapidAuth($endpoint);
        
        // 2. Encrypt the payload
        $encrypted = encryptPushPayload($p256dh, $auth, $payload);
        if (!$encrypted) {
            return ['success' => false, 'statusCode' => 0, 'reason' => 'Encryption failed'];
        }
        
        // 3. Send to push service via cURL
        $headers = [
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'Content-Length: ' . strlen($encrypted['ciphertext']),
            'TTL: 3600',
            'Urgency: high',
            'Authorization: vapid t=' . $vapidHeaders['jwt'] . ', k=' . $vapidHeaders['publicKey'],
        ];
        
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $encrypted['ciphertext'],
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'statusCode' => 0, 'reason' => 'cURL error: ' . $error];
        }
        
        $success = ($statusCode >= 200 && $statusCode < 300);
        return [
            'success' => $success,
            'statusCode' => $statusCode,
            'reason' => $success ? 'OK' : 'HTTP ' . $statusCode . ': ' . substr($response, 0, 200)
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'statusCode' => 0, 'reason' => $e->getMessage()];
    }
}

/**
 * Send push notifications to all subscriptions for a user
 */
function sendPushToUser($pdo, $recipientId, $title, $body, $extraData = []) {
    try {
        $stmt = $pdo->prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?");
        $stmt->execute([$recipientId]);
        $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($subscriptions)) return 0;
        
        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'tag' => 'tangle-msg-' . time(),
            'data' => array_merge(['url' => '/?action=open_messages'], $extraData)
        ]);
        
        $sent = 0;
        $expiredEndpoints = [];
        
        foreach ($subscriptions as $sub) {
            $result = sendWebPush($sub['endpoint'], $sub['p256dh'], $sub['auth'], $payload);
            
            if ($result['success']) {
                $sent++;
            } else {
                error_log('[PUSH] Failed for endpoint ' . substr($sub['endpoint'], 0, 60) . ': ' . $result['reason']);
                if (in_array($result['statusCode'], [404, 410])) {
                    $expiredEndpoints[] = $sub['endpoint'];
                }
            }
        }
        
        // Clean up expired subscriptions
        if (!empty($expiredEndpoints)) {
            $placeholders = implode(',', array_fill(0, count($expiredEndpoints), '?'));
            $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint IN ($placeholders)");
            $stmt->execute($expiredEndpoints);
            error_log('[PUSH] Cleaned up ' . count($expiredEndpoints) . ' expired subscriptions');
        }
        
        return $sent;
        
    } catch (Exception $e) {
        error_log('[PUSH] sendPushToUser error: ' . $e->getMessage());
        return 0;
    }
}

// ============================================================
// VAPID JWT AUTHENTICATION
// ============================================================

function createVapidAuth($endpoint) {
    $audience = parse_url($endpoint, PHP_URL_SCHEME) . '://' . parse_url($endpoint, PHP_URL_HOST);
    
    // JWT Header
    $header = base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    
    // JWT Payload
    $payload = base64url_encode(json_encode([
        'aud' => $audience,
        'exp' => time() + 86400,
        'sub' => VAPID_SUBJECT
    ]));
    
    $signingInput = $header . '.' . $payload;
    
    // Sign with ES256 using VAPID private key
    $privatePem = vapidPrivateKeyToPem(VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY);
    $privateKey = openssl_pkey_get_private($privatePem);
    
    if (!$privateKey) {
        throw new Exception('Failed to load VAPID private key');
    }
    
    openssl_sign($signingInput, $derSignature, $privateKey, OPENSSL_ALGO_SHA256);
    
    // Convert DER signature to raw R||S (64 bytes)
    $rawSignature = derSignatureToRaw($derSignature);
    
    $jwt = $signingInput . '.' . base64url_encode($rawSignature);
    
    return [
        'jwt' => $jwt,
        'publicKey' => VAPID_PUBLIC_KEY
    ];
}

// ============================================================
// PAYLOAD ENCRYPTION (RFC 8291 - aes128gcm)
// ============================================================

function encryptPushPayload($subscriberPublicKey, $subscriberAuth, $payload) {
    // Decode subscription keys from base64url
    $userPublicKeyRaw = base64url_decode($subscriberPublicKey);  // 65 bytes
    $userAuth = base64url_decode($subscriberAuth);  // 16 bytes
    
    if (strlen($userPublicKeyRaw) !== 65 || strlen($userAuth) !== 16) {
        error_log('[PUSH] Invalid subscription key lengths: pub=' . strlen($userPublicKeyRaw) . ' auth=' . strlen($userAuth));
        return null;
    }
    
    // Generate ephemeral ECDH key pair
    $localKey = openssl_pkey_new([
        'curve_name' => 'prime256v1',
        'private_key_type' => OPENSSL_KEYTYPE_EC
    ]);
    
    if (!$localKey) {
        error_log('[PUSH] Failed to generate ephemeral key');
        return null;
    }
    
    $localKeyDetails = openssl_pkey_get_details($localKey);
    $localPublicKeyRaw = getUncompressedPublicKey($localKeyDetails);
    
    // Create subscriber's public key as PEM for ECDH
    $subscriberPem = rawPublicKeyToPem($userPublicKeyRaw);
    $subscriberKey = openssl_pkey_get_public($subscriberPem);
    
    if (!$subscriberKey) {
        error_log('[PUSH] Failed to load subscriber public key');
        return null;
    }
    
    // ECDH: derive shared secret
    $sharedSecret = openssl_pkey_derive($subscriberKey, $localKey, 256);
    
    if ($sharedSecret === false) {
        error_log('[PUSH] ECDH derivation failed');
        return null;
    }
    
    // HKDF to derive PRK (pseudo-random key)
    // IKM = shared_secret, salt = auth_secret
    // info for PRK: "WebPush: info\0" + subscriber_public + local_public
    $ikm = $sharedSecret;
    
    // info = "WebPush: info\0" + ua_public(65) + as_public(65)
    $authInfo = "WebPush: info\0" . $userPublicKeyRaw . $localPublicKeyRaw;
    
    // PRK = HKDF-Extract(salt=auth, ikm=shared_secret)
    // Then derive IKM for final keys
    $prk = hash_hmac('sha256', $ikm, $userAuth, true);
    $ikm2 = hkdf_expand($prk, $authInfo, 32);
    
    // Generate 16-byte salt
    $salt = openssl_random_pseudo_bytes(16);
    
    // Derive content encryption key (CEK) and nonce
    $prk2 = hash_hmac('sha256', $ikm2, $salt, true);
    
    $cekInfo = "Content-Encoding: aes128gcm\0";
    $nonceInfo = "Content-Encoding: nonce\0";
    
    $cek = hkdf_expand($prk2, $cekInfo, 16);
    $nonce = hkdf_expand($prk2, $nonceInfo, 12);
    
    // Pad the payload (add delimiter byte 0x02 for final record)
    $paddedPayload = $payload . "\x02";
    
    // Encrypt with AES-128-GCM
    $tag = '';
    $encrypted = openssl_encrypt(
        $paddedPayload,
        'aes-128-gcm',
        $cek,
        OPENSSL_RAW_DATA,
        $nonce,
        $tag,
        '',
        16  // tag length
    );
    
    if ($encrypted === false) {
        error_log('[PUSH] AES-GCM encryption failed');
        return null;
    }
    
    // Build aes128gcm content encoding header:
    // salt(16) + rs(4 bytes, uint32 big-endian) + idlen(1) + keyid(65) + ciphertext + tag
    $recordSize = 4096;
    $header = $salt                                   // 16 bytes salt
        . pack('N', $recordSize)                      // 4 bytes record size
        . chr(strlen($localPublicKeyRaw))             // 1 byte key ID length
        . $localPublicKeyRaw;                         // 65 bytes key ID (server public key)
    
    $body = $header . $encrypted . $tag;
    
    return ['ciphertext' => $body];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $data = strtr($data, '-_', '+/');
    $padding = strlen($data) % 4;
    if ($padding) {
        $data .= str_repeat('=', 4 - $padding);
    }
    return base64_decode($data);
}

/**
 * Convert DER-encoded ECDSA signature to raw R||S format (64 bytes)
 */
function derSignatureToRaw($der) {
    $pos = 0;
    // SEQUENCE
    if (ord($der[$pos++]) !== 0x30) throw new Exception('Invalid DER signature');
    $pos++; // skip length
    
    // INTEGER r
    if (ord($der[$pos++]) !== 0x02) throw new Exception('Invalid DER: expected INTEGER for r');
    $rLen = ord($der[$pos++]);
    $r = substr($der, $pos, $rLen);
    $pos += $rLen;
    
    // INTEGER s
    if (ord($der[$pos++]) !== 0x02) throw new Exception('Invalid DER: expected INTEGER for s');
    $sLen = ord($der[$pos++]);
    $s = substr($der, $pos, $sLen);
    
    // Ensure R and S are exactly 32 bytes (pad or trim leading zeros)
    $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
    $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
    
    return $r . $s;
}

/**
 * Get uncompressed public key (65 bytes) from openssl key details
 */
function getUncompressedPublicKey($keyDetails) {
    $x = str_pad($keyDetails['ec']['x'], 32, "\x00", STR_PAD_LEFT);
    $y = str_pad($keyDetails['ec']['y'], 32, "\x00", STR_PAD_LEFT);
    return "\x04" . $x . $y;
}

/**
 * Convert raw uncompressed EC public key (65 bytes) to PEM format
 */
function rawPublicKeyToPem($rawKey) {
    // ASN.1 DER encoding for EC public key on prime256v1
    // SEQUENCE { SEQUENCE { OID ecPublicKey, OID prime256v1 }, BIT STRING { raw_key } }
    $oidEc = "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01";  // OID 1.2.840.10045.2.1 (ecPublicKey)
    $oidP256 = "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07";  // OID 1.2.840.10045.3.1.7 (prime256v1)
    
    $algorithmSeq = "\x30" . chr(strlen($oidEc) + strlen($oidP256)) . $oidEc . $oidP256;
    $bitString = "\x03" . chr(strlen($rawKey) + 1) . "\x00" . $rawKey;
    $outerSeq = "\x30" . chr(strlen($algorithmSeq) + strlen($bitString)) . $algorithmSeq . $bitString;
    
    $pem = "-----BEGIN PUBLIC KEY-----\n"
        . chunk_split(base64_encode($outerSeq), 64, "\n")
        . "-----END PUBLIC KEY-----\n";
    
    return $pem;
}

/**
 * Convert VAPID base64url private key to PEM format
 */
function vapidPrivateKeyToPem($privateKeyB64, $publicKeyB64) {
    $privateKeyRaw = base64url_decode($privateKeyB64);
    $publicKeyRaw = base64url_decode($publicKeyB64);
    
    // Build ASN.1 DER for EC private key (SEC 1 format)
    // ECPrivateKey ::= SEQUENCE {
    //   version INTEGER (1),
    //   privateKey OCTET STRING,
    //   parameters [0] EXPLICIT OID,
    //   publicKey [1] EXPLICIT BIT STRING
    // }
    $version = "\x02\x01\x01"; // INTEGER 1
    $privOctet = "\x04" . chr(strlen($privateKeyRaw)) . $privateKeyRaw;
    
    $oidP256 = "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07";
    $parameters = "\xa0" . chr(strlen($oidP256)) . $oidP256;
    
    $pubBitString = "\x03" . chr(strlen($publicKeyRaw) + 1) . "\x00" . $publicKeyRaw;
    $pubContext = "\xa1" . chr(strlen($pubBitString)) . $pubBitString;
    
    $ecKeySeq = $version . $privOctet . $parameters . $pubContext;
    $ecKeyDer = "\x30" . asn1_length($ecKeySeq) . $ecKeySeq;
    
    $pem = "-----BEGIN EC PRIVATE KEY-----\n"
        . chunk_split(base64_encode($ecKeyDer), 64, "\n")
        . "-----END EC PRIVATE KEY-----\n";
    
    return $pem;
}

/**
 * ASN.1 DER length encoding
 */
function asn1_length($data) {
    $len = strlen($data);
    if ($len < 128) {
        return chr($len);
    } elseif ($len < 256) {
        return "\x81" . chr($len);
    } else {
        return "\x82" . pack('n', $len);
    }
}

/**
 * HKDF-Expand (RFC 5869)
 */
function hkdf_expand($prk, $info, $length) {
    $hash = '';
    $output = '';
    $counter = 1;
    
    while (strlen($output) < $length) {
        $hash = hash_hmac('sha256', $hash . $info . chr($counter), $prk, true);
        $output .= $hash;
        $counter++;
    }
    
    return substr($output, 0, $length);
}
