<?php

/**
 * VideoSDK Configuration and Helper Functions
 * Provides secure access to VideoSDK credentials and utilities
 */

class VideoSDKConfig {
    private static $apiKey = null;
    private static $secretKey = null;
    
    /**
     * Initialize VideoSDK configuration
     */
    public static function init() {
        // Try multiple ways to load environment variables
        
        // Method 1: Load from EnvLoader if available
        if (class_exists('EnvLoader')) {
            $envVars = EnvLoader::getEnv();
            self::$apiKey = $envVars['VIDEOSDK_API_KEY'] ?? null;
            self::$secretKey = $envVars['VIDEOSDK_SECRET_KEY'] ?? null;
        }
        
        // Method 2: Try getenv() function
        if (!self::$apiKey) {
            self::$apiKey = getenv('VIDEOSDK_API_KEY');
        }
        if (!self::$secretKey) {
            self::$secretKey = getenv('VIDEOSDK_SECRET_KEY');
        }
        
        // Method 3: Try $_ENV superglobal
        if (!self::$apiKey) {
            self::$apiKey = $_ENV['VIDEOSDK_API_KEY'] ?? null;
        }
        if (!self::$secretKey) {
            self::$secretKey = $_ENV['VIDEOSDK_SECRET_KEY'] ?? null;
        }
        
        // Method 4: Load directly from .env file as fallback
        if (!self::$apiKey || !self::$secretKey) {
            self::loadFromEnvFile();
        }
        
        if (!self::$apiKey || !self::$secretKey) {
            throw new Exception('VideoSDK credentials not found. API Key: ' . (self::$apiKey ? 'Found' : 'Missing') . ', Secret Key: ' . (self::$secretKey ? 'Found' : 'Missing'));
        }
    }
    
    /**
     * Load environment variables directly from .env file
     */
    private static function loadFromEnvFile() {
        $envFile = dirname(__DIR__) . '/.env';
        
        if (!file_exists($envFile)) {
            return false;
        }
        
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0 || strpos(trim($line), '//') === 0) {
                continue;
            }
            
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
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
    
    /**
     * Get API Key
     */
    public static function getApiKey() {
        if (!self::$apiKey) {
            self::init();
        }
        return self::$apiKey;
    }
    
    /**
     * Get Secret Key (for server-side operations only)
     */
    public static function getSecretKey() {
        if (!self::$secretKey) {
            self::init();
        }
        return self::$secretKey;
    }
    
    /**
     * Generate JWT token for VideoSDK authentication
     */
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
    
    /**
     * Generate meeting ID
     */
    public static function generateMeetingId() {
        return 'meeting_' . uniqid() . '_' . time();
    }
    
    /**
     * Get VideoSDK configuration for frontend
     */
    public static function getFrontendConfig() {
        return [
            'apiKey' => self::getApiKey(),
            'token' => self::generateToken(),
            'isProduction' => getenv('APP_ENV') === 'production',
            'domain' => getenv('DOMAIN') ?: 'localhost'
        ];
    }
}
