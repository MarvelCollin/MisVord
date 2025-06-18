<?php

if (file_exists(__DIR__ . '/../utils/AppLogger.php')) {
    require_once __DIR__ . '/../utils/AppLogger.php';
}

if (!function_exists('getenv') || !getenv('VIDEOSDK_API_KEY')) {
    $envPath = dirname(__DIR__) . '/.env';
    if (file_exists($envPath)) {
        if (function_exists('logger')) {
            logger()->debug("Loading VideoSDK environment from .env file");
        }
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
        }
    } else {
        if (function_exists('logger')) {
            logger()->warning("VideoSDK .env file not found, using fallback values");
        }
    }
}

class VideoSDKConfig {
    const API_KEY = '8ad2dbcd-638d-4fbb-999c-9a48a83caa15';
    const SECRET_KEY = '2894abac68603be19aa80b781cad6683eebfb922f496c22cc46b19ad91647d4e';
    const API_BASE_URL = 'https://api.videosdk.live';
    const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI4YWQyZGJjZC02MzhkLTRmYmItOTk5Yy05YTQ4YTgzY2FhMTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc0ODkxMzI5NywiZXhwIjoxNzY0NDY1Mjk3fQ.16_7vBmTkjKz8plb9eiRPAcKwmIxHqCgIb1OqSeB5vQ';

    public static function getAuthToken() {

        $token = $_ENV['VIDEOSDK_TOKEN'] ?? self::AUTH_TOKEN;

        if (function_exists('logger')) {
            $source = isset($_ENV['VIDEOSDK_TOKEN']) ? 'environment' : 'fallback';
            logger()->debug("VideoSDK token retrieved", [
                'source' => $source,
                'token_length' => strlen($token)
            ]);
        }

        return $token;
    }

    public static function getApiKey() {
        $apiKey = $_ENV['VIDEOSDK_API_KEY'] ?? self::API_KEY;

        if (function_exists('logger')) {
            $source = isset($_ENV['VIDEOSDK_API_KEY']) ? 'environment' : 'fallback';
            logger()->debug("VideoSDK API key retrieved", [
                'source' => $source,
                'key_length' => strlen($apiKey)
            ]);
        }

        return $apiKey;
    }

    public static function getSecretKey() {
        return $_ENV['VIDEOSDK_SECRET_KEY'] ?? self::SECRET_KEY;
    }

    public static function createMeeting($customId = null) {
        $curl = curl_init();

        $postData = [];
        if ($customId) {
            $postData['customRoomId'] = $customId;
        }

        curl_setopt_array($curl, array(
            CURLOPT_URL => self::API_BASE_URL . '/v2/rooms',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => empty($postData) ? '{}' : json_encode($postData),
            CURLOPT_HTTPHEADER => array(
                'Authorization: ' . self::getAuthToken(),
                'Content-Type: application/json'
            ),
        ));

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);          if ($error) {
            if (function_exists('log_error')) {
                log_error("VideoSDK CURL Error", ['error' => $error]);            } else {
                log_error("VideoSDK CURL Error", ['error' => $error]);
            }
            return false;
        }

        if ($httpCode !== 200 && $httpCode !== 201) {            if (function_exists('log_error')) {
                log_error("VideoSDK API Error", [
                    'http_code' => $httpCode,
                    'response' => $response
                ]);            } else {
                log_error("VideoSDK API Error", [
                    'http_code' => $httpCode,
                    'response' => $response
                ]);
            }
            return false;
        }

        $result = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {            if (function_exists('log_error')) {
                log_error("VideoSDK JSON decode error", [
                    'error' => json_last_error_msg(),
                    'response' => $response
                ]);            } else {
                log_error("VideoSDK JSON decode error", [
                    'error' => json_last_error_msg(),
                    'response' => $response
                ]);
            }
            return false;
        }

        return $result;
    }

    public static function validateMeeting($meetingId) {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => self::API_BASE_URL . '/v2/rooms/validate/' . $meetingId,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => array(
                'Authorization: ' . self::getAuthToken(),
            ),
        ));

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        return $httpCode === 200;
    }

    public static function getMeetingInfo($meetingId) {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => self::API_BASE_URL . '/v2/rooms/' . $meetingId,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => array(
                'Authorization: ' . self::getAuthToken(),
            ),
        ));

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($httpCode === 200) {
            return json_decode($response, true);
        }

        return false;
    }
}
?>