<?php

class WebSocketClient {
    private $host;
    private $port;
    private $path;
    private $timeout;
    private $debug;
      public function __construct($host = null, $port = null, $path = '/socket.io', $timeout = 5, $debug = false) {
        $this->host = $host ?: ($_ENV['SOCKET_HOST'] ?? 'localhost');
        $this->port = $port ?: ($_ENV['SOCKET_PORT'] ?? 1002);
        $this->path = $path;
        $this->timeout = $timeout;
        $this->debug = $debug;
    }
    
    public function emit($event, $data) {
        $payload = json_encode([
            'event' => $event,
            'data' => $data,
            'timestamp' => time(),
            'source' => 'php-server'
        ]);
        
        return $this->sendRequest('/emit', $payload);
    }
    
    public function notifyUser($userId, $event, $data) {
        return $this->emit('notify-user', [
            'userId' => $userId,
            'event' => $event,
            'data' => $data
        ]);
    }
    
    public function broadcast($event, $data) {
        return $this->emit('broadcast', [
            'event' => $event,
            'data' => $data
        ]);
    }
    
    public function broadcastToRoom($room, $event, $data) {
        return $this->emit('broadcast-to-room', [
            'room' => $room,
            'event' => $event,
            'data' => $data
        ]);
    }    public function updateUserPresence($userId, $status, $activityDetails = null) {
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
        
        $options = [
            'http' => [
                'header' => "Content-type: application/json\r\n",
                'method' => 'POST',
                'content' => $payload,
                'timeout' => $this->timeout
            ]
        ];
        
        return $this->executeRequest($url, $options);
    }

    private function sendGetRequest($endpoint) {
        $url = "http://{$this->host}:{$this->port}/api{$endpoint}";
        
        $options = [
            'http' => [
                'method' => 'GET',
                'timeout' => $this->timeout
            ]
        ];
        
        return $this->executeRequest($url, $options);
    }

    private function executeRequest($url, $options) {
        $context = stream_context_create($options);
        
        try {
            $result = @file_get_contents($url, false, $context);
            
            if ($result === false) {
                $this->log("Socket request failed: " . error_get_last()['message']);
                return false;
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