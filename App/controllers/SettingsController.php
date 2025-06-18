<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/BaseController.php';

class SettingsController extends BaseController
{
    private $serverRepository;
    private $channelRepository;

    public function __construct() {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->channelRepository = new ChannelRepository();
    }
    public function prepareSettingsData()
    {
        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit;
        }

        $serverId = $_GET['server_id'] ?? null;
        $channelId = $_GET['channel_id'] ?? null;
        $section = $_GET['section'] ?? 'overview';

        $server = null;
        $channel = null;        if ($serverId) {
            $server = $this->serverRepository->find($serverId);
        }

        if ($channelId) {
            $channel = $this->channelRepository->find($channelId);
        }

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
