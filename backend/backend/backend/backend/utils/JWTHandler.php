<?php
/**
 * JWT Helper Functions
 * Simple JWT implementation without external dependencies
 */

require_once __DIR__ . '/../config/jwt.php';

class JWT
{
    public static $lastError = 'No token found';

    /**
     * Generate JWT token
     * @param array $payload
     * @return string
     */
    public static function encode($payload)
    {
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);

        // Add issued at and expiration
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRATION;
        $payload['iss'] = JWT_ISSUER;

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            JWT_SECRET,
            true
        );

        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Decode and verify JWT token
     * @param string $token
     * @return array|false
     */
    public static function decode($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            error_log("JWT Decode Failed: Token does not have 3 parts");
            return false;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        // Verify signature
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            JWT_SECRET,
            true
        );

        if (!hash_equals($signature, $expectedSignature)) {
            error_log("JWT Decode Failed: Signature mismatch");
            return false;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            error_log("JWT Decode Failed: Token expired");
            return false;
        }

        return $payload;
    }

    /**
     * Get token from Authorization header
     * @return string|null
     */
    public static function getTokenFromHeader()
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = null;

        // 1. Try getallheaders()
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }

        // 2. Try $_SERVER['HTTP_AUTHORIZATION'] (Apache fallback)
        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }

        // 3. Try $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if ($authHeader) {
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            } else {
                error_log("JWT Handler: Auth header found but Bearer format invalid: " . $authHeader);
            }
        } else {
            error_log("JWT Handler: No Authorization header found in request. Headers: " . json_encode($headers));
        }

        return null;
    }

    /**
     * Verify token and return payload
     * @return array|false
     */
    public static function verifyRequest()
    {
        $token = self::getTokenFromHeader();

        if (!$token) {
            error_log("JWT verifyRequest: No token found in header");
            return false;
        }

        $decoded = self::decode($token);
        if (!$decoded) {
            error_log("JWT verifyRequest: Token decoding failed");
        }
        return $decoded;
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>