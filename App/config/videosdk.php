<?php

class VideoSDKConfig {
    private static $apiKey = null;
    private static $secretKey = null;

    public static function init() {

        if (class_exists('EnvLoader')) {
            $envVars = EnvLoader::getEnv();
            self::$apiKey = $envVars['VIDEOSDK_API_KEY'] ?? null;
            self::$secretKey = $envVars['VIDEOSDK_SECRET_KEY'] ?? null;
        }

        if (!self::$apiKey) {
            self::$apiKey = getenv('VIDEOSDK_API_KEY');
        }
        if (!self::$secretKey) {
            self::$secretKey = getenv('VIDEOSDK_SECRET_KEY');
        }

        if (!self::$apiKey) {
            self::$apiKey = $_ENV['VIDEOSDK_API_KEY'] ?? null;
        }
        if (!self::$secretKey) {
            self::$secretKey = $_ENV['VIDEOSDK_SECRET_KEY'] ?? null;
        }

        if (!self::$apiKey || !self::$secretKey) {
            self::loadFromEnvFile();
        }

        if (!self::$apiKey || !self::$secretKey) {
            throw new Exception('VideoSDK credentials not found. API Key: ' . (self::$apiKey ? 'Found' : 'Missing') . ', Secret Key: ' . (self::$secretKey ? 'Found' : 'Missing'));
        }
    }

    private static function loadFromEnvFile() {
        $envFile = dirname(__DIR__) . '/.env';

        if (!file_exists($envFile)) {
            return false;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {

            if (strpos(trim($line), '#') === 0 || strpos(trim($line), '//') === 0) {
                continue;
            }

            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                    $value = $matches[1];
                }

                if ($key === 'VIDEOSDK_API_KEY' && !self::$apiKey) {
                    self::$apiKey = $value;
                }
                if ($key === 'VIDEOSDK_SECRET_KEY' && !self::$secretKey) {
                    self::$secretKey = $value;
                }
            }
        }
    }

    public static function getApiKey() {
        if (!self::$apiKey) {
            self::init();
        }
        return self::$apiKey;
    }

    public static function getSecretKey() {
        if (!self::$secretKey) {
            self::init();
        }
        return self::$secretKey;
    }

    public static function generateToken($expiresIn = 3600) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'apikey' => self::getApiKey(),
            'permissions' => ['allow_join', 'allow_mod'],
            'version' => 2,
            'exp' => time() + $expiresIn
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::getSecretKey(), true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function generateMeetingId() {
        return 'meeting_' . uniqid() . '_' . time();
    }

    public static function getFrontendConfig() {
        return [
            'apiKey' => self::getApiKey(),
            'token' => self::generateToken(),
            'isProduction' => getenv('APP_ENV') === 'production',
            'domain' => getenv('DOMAIN') ?: 'localhost'
        ];
    }

    public static function createMeeting() {
        $url = 'https://api.videosdk.live/v2/rooms';
        $token = self::generateToken();

        $headers = [
            'Authorization: ' . $token,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            return json_decode($response, true);
        }

        throw new Exception('Failed to create meeting: ' . $response);
    }

    public static function validateMeeting($meetingId) {
        $url = 'https://api.videosdk.live/v2/rooms/validate/' . $meetingId;
        $token = self::generateToken();

        $headers = [
            'Authorization: ' . $token,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }
}