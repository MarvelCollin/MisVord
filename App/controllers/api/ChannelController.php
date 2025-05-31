<?php

class ChannelController {

    /**
     * Delete a channel
     */
    public function deleteChannel() {
        // Get JSON data
        $jsonData = json_decode(file_get_contents('php://input'), true);
        
        // Check for required data
        if (!isset($jsonData['channel_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing channel ID']);
            return;
        }
        
        $channelId = $jsonData['channel_id'];
        
        // Check user permissions (only server owner or admins can delete channels)
        $channel = $this->channelModel->getChannelById($channelId);
        if (!$channel) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Channel not found']);
            return;
        }
        
        $serverId = $channel['server_id'];
        $userId = $_SESSION['user_id'] ?? 0;
        
        $serverModel = new Server();
        $server = $serverModel->getServerById($serverId);
        
        if ($server['owner_id'] != $userId) {
            // Check if user is admin
            $memberModel = new ServerMember();
            $member = $memberModel->getMember($serverId, $userId);
            
            if (!$member || $member['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this channel']);
                return;
            }
        }
        
        // Delete the channel
        $result = $this->channelModel->deleteChannel($channelId);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete channel']);
        }
    }

    // Additional methods...
} 