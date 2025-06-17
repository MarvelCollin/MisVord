<?php

class WebSocketClient {
    
    private $serverUrl;
    private $socketPort;
    private $debug;
    
    public function __construct() {
        $this->socketPort = $_ENV['SOCKET_PORT'] ?? 1002;
        $this->serverUrl = "http://localhost:{$this->socketPort}";
        $this->debug = $_ENV['DEBUG'] ?? false;
    }
    
    /**
     * Send a message to a channel via WebSocket
     */
    public function sendMessage($channelId, $content, $userInfo = []) {
        try {
            $data = [
                'event' => 'new-channel-message',
                'data' => [
                    'channelId' => $channelId,
                    'content' => $content,
                    'user_id' => $userInfo['userId'] ?? null,
                    'username' => $userInfo['username'] ?? 'Unknown',
                    'avatar_url' => $userInfo['avatar_url'] ?? null,
                    'timestamp' => date('Y-m-d H:i:s'),
                    'sent_at' => date('Y-m-d H:i:s'),
                    'message_type' => 'text'
                ]
            ];
            
            return $this->broadcast($data['event'], $data['data']);
        } catch (Exception $e) {
            log_error("WebSocketClient::sendMessage error", ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Broadcast an event to WebSocket server
     */
    public function broadcast($event, $data) {
        try {
            $postData = json_encode([
                'event' => $event,
                'data' => $data
            ]);
            
            $ch = curl_init($this->serverUrl . '/broadcast');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($postData)
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($this->debug) {
                log_debug("WebSocket broadcast response", [
                    'response' => $response,
                    'http_code' => $httpCode
                ]);
            }
            
            return $httpCode === 200;
        } catch (Exception $e) {
            log_error("WebSocket broadcast error", ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Test WebSocket connection
     */
    public function testConnection() {
        try {
            $ch = curl_init($this->serverUrl . '/health');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            return $httpCode === 200;
        } catch (Exception $e) {
            log_error("WebSocket test connection error", ['error' => $e->getMessage()]);
            return false;
        }
    }
}