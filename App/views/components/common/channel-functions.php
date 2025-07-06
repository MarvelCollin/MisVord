<?php

if (!function_exists('getChannelIcon')) {
    function getChannelIcon($type) {
        return match(strtolower($type ?? 'text')) {
            'voice' => 'volume-high',
            'announcement' => 'bullhorn', 
            'forum' => 'users',
            default => 'hashtag'
        };
    }
}

if (!function_exists('renderChannel')) {
    function renderChannel($channel, $activeChannelId) {
        $type = $channel['type'] ?? 'text';
        $icon = getChannelIcon($type);
        $isActive = $activeChannelId == $channel['id'];
        
        $textClass = $isActive ? 'text-white hover:text-white' : 'text-gray-400 hover:text-gray-300';
        $bgClass = $isActive ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'hover:bg-gray-700/30';
        $iconClass = $isActive ? 'text-white' : 'text-gray-500';
        $activeClass = $isActive ? 'active' : '';
        
        $serverId = $GLOBALS['currentServer']->id ?? ($GLOBALS['server']->id ?? '');
        $position = $channel['position'] ?? 0;
        $categoryId = $channel['category_id'] ?? '';
        
        echo '<div class="channel-item flex items-center py-2 px-3 rounded cursor-pointer ' . $textClass . ' ' . $bgClass . ' ' . $activeClass . ' group transition-all duration-200" 
                  data-channel-id="' . $channel['id'] . '" 
                  data-channel-name="' . htmlspecialchars($channel['name']) . '"
                  data-channel-type="' . htmlspecialchars($type) . '"
                  data-channel-position="' . $position . '"
                  data-category-id="' . $categoryId . '"
                  data-server-id="' . htmlspecialchars($serverId) . '">';
        echo '  <i class="fas fa-' . $icon . ' text-xs mr-3 ' . $iconClass . '"></i>';
        echo '  <span class="channel-name text-sm flex-1">' . htmlspecialchars($channel['name']) . '</span>';
        
        if ($type === 'voice') {
            $countClass = $isActive ? 'text-white/70' : 'text-gray-500';
            echo '  <span class="ml-auto text-xs ' . $countClass . ' voice-user-count hidden"></span>';
        }
        
        echo '</div>';
        
        if ($type === 'voice') {
            echo '<div class="voice-participants ml-6 hidden" data-channel-id="' . $channel['id'] . '">';
            echo '</div>';
        }
    }
}

if (!function_exists('renderChannelSkeleton')) {
    function renderChannelSkeleton($count = 1, $extraClass = '') {
        for ($i = 0; $i < $count; $i++) {
            echo '<div class="flex items-center py-2 px-3 ' . $extraClass . '">';
            echo '  <div class="h-3 w-3 bg-gray-700 rounded-sm mr-3 animate-pulse"></div>';
            echo '  <div class="h-4 bg-gray-700 rounded w-' . rand(16, 32) . ' animate-pulse"></div>';
            echo '</div>';
        }
    }
}

if (!function_exists('renderCategorySkeleton')) {
    function renderCategorySkeleton($count = 1) {
        for ($i = 0; $i < $count; $i++) {
            echo '<div class="mb-3">';
            echo '  <div class="flex items-center px-3 py-1 mb-1">';
            echo '    <div class="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>';
            echo '    <div class="ml-auto h-3 w-3 bg-gray-700 rounded-sm animate-pulse"></div>';
            echo '  </div>';
            renderChannelSkeleton(rand(2, 4), 'ml-2');
            echo '</div>';
        }
    }
} 