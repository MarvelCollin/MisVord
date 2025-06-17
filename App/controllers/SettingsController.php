<?php

class SettingsController extends BaseController
{
    public function prepareSettingsData()
    {
        // Check authentication
        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit;
        }

        // Get parameters from URL
        $serverId = $_GET['server_id'] ?? null;
        $channelId = $_GET['channel_id'] ?? null;
        $section = $_GET['section'] ?? 'overview';

        // Load server and channel data if IDs are provided
        $server = null;
        $channel = null;

        if ($serverId) {
            require_once dirname(__DIR__) . '/database/models/Server.php';
            $server = Server::find($serverId);
        }

        if ($channelId) {
            require_once dirname(__DIR__) . '/database/models/Channel.php';
            $channel = Channel::find($channelId);
        }

        // Redirect if server or channel not found
        if (!$server || ($channelId && !$channel)) {
            header('Location: /home');
            exit;
        }

        return [
            'server' => $server,
            'channel' => $channel,
            'serverId' => $serverId,
            'channelId' => $channelId,
            'section' => $section
        ];
    }
}
