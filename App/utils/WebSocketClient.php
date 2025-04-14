<?php

/**
 * WebSocketClient - A simple utility class for broadcasting events to a WebSocket server
 */
class WebSocketClient {
    /**
     * @var string The WebSocket server URL
     */
    private $serverUrl;
    
    /**
     * @var string API key for authorization
     */
    private $apiKey;
    
    /**
     * Constructor
     * 
     * @param string $serverUrl The WebSocket server URL
     * @param string $apiKey Optional API key for authorization
     */
    public function __construct($serverUrl = null, $apiKey = null) {
        $this->serverUrl = $serverUrl ?: ($_ENV['SOCKET_SERVER'] ?? 'http://localhost:3000');
        $this->apiKey = $apiKey ?: ($_ENV['SOCKET_API_KEY'] ?? 'miscvord-secret');
    }
    
    /**
     * Broadcast an event to the WebSocket server
     * 
     * @param string $event Event name
     * @param array $data Event data
     * @return bool Success status
     * @throws Exception If the request fails
     */
    public function broadcast($event, $data) {
        // Simple HTTP POST to Socket.IO server
        $ch = curl_init($this->serverUrl . '/broadcast');
        
        if (!$ch) {
            throw new Exception('Failed to initialize cURL');
        }
        
        // Set request options
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 3); // Short timeout to avoid blocking
        
        // Execute request
        $response = curl_exec($ch);
        
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('cURL error: ' . $error);
        }
        
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Log result
        error_log("WebSocket broadcast response ($httpCode): " . substr($response, 0, 100));
        
        return $httpCode >= 200 && $httpCode < 300;
    }
    
    /**
     * Send a message to a specific channel
     * 
     * @param string $channelId Channel ID
     * @param string $content Message content
     * @param array $user User data
     * @return bool Success status
     */
    public function sendMessage($channelId, $content, $user) {
        return $this->broadcast('message', [
            'channelId' => $channelId,
            'content' => $content,
            'sent_at' => date('Y-m-d H:i:s'),
            'user' => $user
        ]);
    }
    
    /**
     * Send a typing indicator to a channel
     * 
     * @param string $channelId Channel ID
     * @param array $user User data
     * @return bool Success status
     */
    public function sendTypingIndicator($channelId, $user) {
        return $this->broadcast('user_typing', [
            'channelId' => $channelId,
            'user' => $user
        ]);
    }
}
