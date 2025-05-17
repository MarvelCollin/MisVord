<?php

class WebSocketClient {
    
    private $serverUrl;
    private $apiKey;
    
    public function __construct($serverUrl = null, $apiKey = null) {
        $this->serverUrl = $serverUrl ?: (getenv('SOCKET_SERVER') ?: 'http://socket-server:3000');
        $this->apiKey = $apiKey ?: (getenv('SOCKET_API_KEY') ?: 'kolin123');
    }
    
    public function broadcast($event, $data) {
        $ch = curl_init($this->serverUrl . '/broadcast');
        
        if (!$ch) {
            throw new Exception('Failed to initialize cURL');
        }
        
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'event' => $event,
            'data' => $data
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-Api-Key: ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3); 
        
        $response = curl_exec($ch);
        
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('cURL error: ' . $error);
        }
        
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        error_log("WebSocket broadcast response ($httpCode): " . substr($response, 0, 100));
        
        return $httpCode >= 200 && $httpCode < 300;
    }
    
    public function sendMessage($channelId, $content, $user) {
        return $this->broadcast('message', [
            'channelId' => $channelId,
            'content' => $content,
            'sent_at' => date('Y-m-d H:i:s'),
            'user' => $user
        ]);
    }
    
    public function sendTypingIndicator($channelId, $user) {
        return $this->broadcast('user_typing', [
            'channelId' => $channelId,
            'user' => $user
        ]);
    }
} 