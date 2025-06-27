<?php

class SocketBroadcaster {
    private static $socketServerUrl = null;
    
    public static function init() {
        self::$socketServerUrl = $_ENV['SOCKET_SERVER_URL'] ?? 'http://localhost:1002';
    }
    
    public static function broadcast($event, $data, $room = null) {
        self::init();
        
        $payload = [
            'event' => $event,
            'payload' => $data
        ];
        
        if ($room) {
            $payload['room'] = $room;
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::$socketServerUrl . '/api/socket/broadcast');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
            'Connection: keep-alive'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
        curl_setopt($ch, CURLOPT_TCP_NODELAY, true);
        curl_setopt($ch, CURLOPT_FRESH_CONNECT, false);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            error_log("Socket broadcast failed: $error");
            return false;
        }
        
        if ($httpCode !== 200) {
            error_log("Socket broadcast failed with HTTP $httpCode: $result");
            return false;
        }
        
        return true;
    }
    
    public static function broadcastToChannel($channelId, $event, $data) {
        return self::broadcast($event, $data, "channel-{$channelId}");
    }
    
    public static function broadcastToDM($roomId, $event, $data) {
        return self::broadcast($event, $data, "dm-room-{$roomId}");
    }
    
    public static function broadcastMessage($targetType, $targetId, $event, $data) {
        if ($targetType === 'channel') {
            return self::broadcastToChannel($targetId, $event, $data);
        } elseif ($targetType === 'dm' || $targetType === 'direct') {
            return self::broadcastToDM($targetId, $event, $data);
        }
        return false;
    }
} 