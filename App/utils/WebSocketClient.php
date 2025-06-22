<?php

class WebSocketClient {
    private $host;
    private $port;
    private $path;
    private $timeout;
    private $debug;
    
    public function __construct($host = null, $port = null, $path = '/socket.io', $timeout = 5, $debug = true) {
        $this->host = $host ?: ($_ENV['SOCKET_HOST'] ?? 'misvord_node');
        $this->port = $port ?: ($_ENV['SOCKET_PORT'] ?? 1002);
        $this->path = $path;
        $this->timeout = $timeout;
        $this->debug = $debug;
        
        // Log connection details on initialization
        $this->log("Initializing WebSocketClient with host: {$this->host}, port: {$this->port}");
    }
    
    public function emit($event, $data) {
        $payload = json_encode([
            'event' => $event,
            'data' => $data,
            'timestamp' => time(),
            'source' => 'php-server'
        ]);
        
        $this->log("Emitting event: {$event} with data: " . json_encode($data));
        return $this->sendRequest('/emit', $payload);
    }
    
    public function notifyUser($userId, $event, $data) {
        $this->log("Notifying user {$userId} with event: {$event}");
        return $this->emit('notify-user', [
            'userId' => $userId,
            'event' => $event,
            'data' => $data
        ]);
    }
    
    public function broadcast($event, $data) {
        $this->log("Broadcasting event: {$event}");
        return $this->emit('broadcast', [
            'event' => $event,
            'data' => $data
        ]);
    }
    
    public function broadcastToRoom($room, $event, $data) {
        $this->log("Broadcasting to room: {$room}, event: {$event}");
        return $this->emit('broadcast-to-room', [
            'room' => $room,
            'event' => $event,
            'data' => $data
        ]);
    }
    
    public function updateUserPresence($userId, $status, $activityDetails = null) {
        $payload = json_encode([
            'userId' => $userId,
            'status' => $status,
            'activityDetails' => $activityDetails
        ]);
        
        return $this->sendRequest('/update-presence', $payload);
    }

    public function getOnlineUsers() {
        return $this->sendGetRequest('/online-users');
    }

    public function getUserPresence($userId) {
        return $this->sendGetRequest('/user-presence/' . $userId);
    }
    
    private function sendRequest($endpoint, $payload) {
        $url = "http://{$this->host}:{$this->port}/api{$endpoint}";
        
        $this->log("Sending request to: {$url}");
        
        $options = [
            'http' => [
                'header' => "Content-type: application/json\r\n",
                'method' => 'POST',
                'content' => $payload,
                'timeout' => $this->timeout,
                'ignore_errors' => true
            ]
        ];
        
        return $this->executeRequest($url, $options);
    }

    private function sendGetRequest($endpoint) {
        $url = "http://{$this->host}:{$this->port}/api{$endpoint}";
        
        $options = [
            'http' => [
                'method' => 'GET',
                'timeout' => $this->timeout,
                'ignore_errors' => true
            ]
        ];
        
        return $this->executeRequest($url, $options);
    }

    private function executeRequest($url, $options) {
        $context = stream_context_create($options);
        
        try {
            $result = @file_get_contents($url, false, $context);
            
            if ($result === false) {
                $error = error_get_last();
                $this->log("Socket request failed: " . ($error ? $error['message'] : 'Unknown error'));
                
                // Try cURL as fallback if file_get_contents fails
                return $this->curlFallback($url, $options);
            }
            
            $response = json_decode($result, true);
            
            if ($response && isset($response['success']) && $response['success']) {
                $this->log("Socket request successful: " . json_encode($response));
                return $response;
            } else {
                $this->log("Socket request failed with response: " . json_encode($response));
                return false;
            }
        } catch (Exception $e) {
            $this->log("Socket request exception: " . $e->getMessage());
            return $this->curlFallback($url, $options);
        }
    }
    
    private function curlFallback($url, $options) {
        $this->log("Attempting cURL fallback for: {$url}");
        
        if (!function_exists('curl_init')) {
            $this->log("cURL not available for fallback");
            return false;
        }
        
        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
            
            if ($options['http']['method'] === 'POST') {
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $options['http']['content']);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            }
            
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($result === false) {
                $this->log("cURL fallback failed: {$error}");
                return false;
            }
            
            $response = json_decode($result, true);
            $this->log("cURL fallback response: " . json_encode($response) . " (HTTP code: {$httpCode})");
            
            return $response;
        } catch (Exception $e) {
            $this->log("cURL fallback exception: " . $e->getMessage());
            return false;
        }
    }
    
    private function log($message) {
        if ($this->debug) {
            if (function_exists('logger')) {
                logger()->debug("[WebSocketClient] " . $message);
            } else {
                error_log("[WebSocketClient] " . $message);
            }
        }
    }
    
    public function setDebug($debug) {
        $this->debug = $debug;
        return $this;
    }
}