<?php

class VideoSDKConfig {
    private static $apiKey = null;
    private static $secretKey = null;
    private static $token = null;
    private static $initialized = false;    public static function init() {
        if (self::$initialized) {
            return; // Prevent double initialization
        }
        
        // Enhanced Docker detection
        $isDocker = (
            getenv('IS_DOCKER') === 'true' || 
            isset($_SERVER['IS_DOCKER']) || 
            getenv('CONTAINER') !== false ||
            isset($_SERVER['CONTAINER']) ||
            file_exists('/.dockerenv')
        );
        
        error_log('VideoSDK Debug - Docker Detection: ' . ($isDocker ? 'YES' : 'NO'));
        
        // In Docker context, try to get environment variables directly first
        if ($isDocker) {
            error_log('VideoSDK Debug - Attempting Docker direct environment access');
            
            // Try to get values directly from Docker environment
            $dockerToken = $_SERVER['VIDEOSDK_TOKEN'] ?? getenv('VIDEOSDK_TOKEN') ?? $_ENV['VIDEOSDK_TOKEN'] ?? null;
            $dockerApiKey = $_SERVER['VIDEOSDK_API_KEY'] ?? getenv('VIDEOSDK_API_KEY') ?? $_ENV['VIDEOSDK_API_KEY'] ?? null;
            $dockerSecretKey = $_SERVER['VIDEOSDK_SECRET_KEY'] ?? getenv('VIDEOSDK_SECRET_KEY') ?? $_ENV['VIDEOSDK_SECRET_KEY'] ?? null;
            
            if ($dockerToken && $dockerApiKey) {
                error_log('VideoSDK Debug - Found Docker environment variables directly');
                self::$apiKey = $dockerApiKey;
                self::$secretKey = $dockerSecretKey;
                self::$token = $dockerToken;
                self::$initialized = true;
                error_log('✅ VideoSDK initialized successfully from Docker environment');
                return;
            }
            
            error_log('VideoSDK Debug - Docker environment variables not found directly, falling back to EnvLoader');
        }
        
        // Multiple strategies to load environment variables
        $envConfigPath = null;
        $possibleEnvPaths = [
            __DIR__ . '/env.php',
            dirname(__DIR__) . '/config/env.php',
            (defined('APP_ROOT') ? APP_ROOT : '') . '/config/env.php',
        ];
        
        foreach ($possibleEnvPaths as $path) {
            if (!empty($path) && file_exists($path)) {
                $envConfigPath = $path;
                break;
            }
        }
        
        if (!$envConfigPath) {
            throw new Exception('Environment configuration file not found. Attempted paths: ' . implode(', ', array_filter($possibleEnvPaths)));
        }
        
        // Load environment variables using the centralized loader
        require_once $envConfigPath;
        
        // Force reload of environment variables if not already loaded
        if (!EnvLoader::isLoaded()) {
            EnvLoader::load();
        }
        
        self::$apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
        self::$secretKey = EnvLoader::get('VIDEOSDK_SECRET_KEY');
        self::$token = EnvLoader::get('VIDEOSDK_TOKEN');
          // Debug logging
        error_log('VideoSDK Debug - API Key: ' . (self::$apiKey ? 'SET (' . substr(self::$apiKey, 0, 8) . '...)' : 'NOT SET'));
        error_log('VideoSDK Debug - Token: ' . (self::$token ? 'SET (' . substr(self::$token, 0, 20) . '...)' : 'NOT SET'));
        error_log('VideoSDK Debug - Environment loaded from: ' . $envConfigPath);
        error_log('VideoSDK Debug - Current working directory: ' . getcwd());
        
        // Additional debugging for Docker environment
        if ($isDocker) {
            error_log('VideoSDK Debug - Docker ENV VIDEOSDK_TOKEN: ' . (isset($_SERVER['VIDEOSDK_TOKEN']) ? 'SET' : 'NOT SET'));
            error_log('VideoSDK Debug - Docker ENV VIDEOSDK_API_KEY: ' . (isset($_SERVER['VIDEOSDK_API_KEY']) ? 'SET' : 'NOT SET'));
            error_log('VideoSDK Debug - Docker getenv VIDEOSDK_TOKEN: ' . (getenv('VIDEOSDK_TOKEN') ? 'SET' : 'NOT SET'));
            error_log('VideoSDK Debug - Docker getenv VIDEOSDK_API_KEY: ' . (getenv('VIDEOSDK_API_KEY') ? 'SET' : 'NOT SET'));
        }
        
        if (empty(self::$apiKey)) {
            $errorMsg = 'VideoSDK API key must be set in environment variables (VIDEOSDK_API_KEY). Check your .env file.';
            if ($isDocker) {
                $errorMsg .= ' Running in Docker - ensure environment variables are properly passed to container.';
            }
            throw new Exception($errorMsg);
        }
        
        if (empty(self::$token)) {
            $errorMsg = 'VideoSDK token must be set in environment variables (VIDEOSDK_TOKEN). Check your .env file.';
            if ($isDocker) {
                $errorMsg .= ' Running in Docker - ensure environment variables are properly passed to container.';
            }
            throw new Exception($errorMsg);
        }
        
        self::$initialized = true;
        error_log('✅ VideoSDK initialized successfully');
    }

    public static function getApiKey() {
        if (!self::$initialized) {
            self::init();
        }
        return self::$apiKey;
    }

    public static function getSecretKey() {
        if (!self::$initialized) {
            self::init();
        }
        return self::$secretKey;
    }

    public static function getToken() {
        if (!self::$initialized) {
            self::init();
        }
        return self::$token;
    }

    // Keep this method for backward compatibility, but use static token
    public static function generateToken($expiresIn = 3600) {
        return self::getToken();
    }    public static function getFrontendConfig() {
        require_once __DIR__ . '/env.php';
        return [
            'apiKey' => self::getApiKey(),
            'token' => self::getToken(),
            'isProduction' => EnvLoader::get('APP_ENV') === 'production'
        ];
    }

    public static function createMeeting() {
        $url = 'https://api.videosdk.live/v2/rooms';
        $token = self::getToken();

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
        $token = self::getToken();

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