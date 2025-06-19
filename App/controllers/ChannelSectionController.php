<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/CategoryRepository.php';

class ChannelSectionController extends BaseController
{
    private $channelRepository;
    private $categoryRepository;

    public function __construct()
    {
        parent::__construct();
        $this->channelRepository = new ChannelRepository();
        $this->categoryRepository = new CategoryRepository();
    }

    public function getServerChannels($serverId)
    {
        if (!$serverId) {
            return [
                'channels' => [],
                'categories' => [],
                'activeChannelId' => null
            ];
        }
        
        $channels = $this->channelRepository->getByServerId($serverId);
        $categories = $this->categoryRepository->getForServer($serverId);
        $activeChannelId = $_GET['channel'] ?? null;
        
        $GLOBALS['serverChannels'] = $channels;
        $GLOBALS['serverCategories'] = $categories;
        $GLOBALS['activeChannelId'] = $activeChannelId;
        
        return [
            'channels' => $channels,
            'categories' => $categories,
            'activeChannelId' => $activeChannelId
        ];
    }
} 