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
        
        $textClass = $isActive 
            ? 'text-white group-hover:text-white' 
            : 'text-gray-400 group-hover:text-gray-100';
        $bgClass = $isActive 
            ? 'bg-[#5865f2] hover:bg-[#4752c4]' 
            : 'hover:bg-gray-700/40 active:bg-gray-700/50';
        $iconClass = $isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300';
        $activeClass = $isActive ? 'active' : '';
        
        $serverId = $GLOBALS['currentServer']->id ?? ($GLOBALS['server']->id ?? '');
        $position = $channel['position'] ?? 0;
        $categoryId = $channel['category_id'] ?? '';
        
        echo '<div class="channel-item group flex items-center py-1.5 px-2 rounded-md cursor-pointer mb-0.5 select-none ' . 
             $textClass . ' ' . $bgClass . ' ' . $activeClass . ' transition-all duration-150" 
                  data-channel-id="' . $channel['id'] . '" 
                  data-channel-name="' . htmlspecialchars($channel['name']) . '"
                  data-channel-type="' . htmlspecialchars($type) . '"
                  data-channel-position="' . $position . '"
                  data-category-id="' . $categoryId . '"
                  data-server-id="' . htmlspecialchars($serverId) . '">';
        
        echo '  <div class="flex items-center flex-1 min-w-0">';
        echo '    <i class="fas fa-' . $icon . ' text-[0.8rem] mr-2 ' . $iconClass . ' transition-colors duration-150"></i>';
        echo '    <span class="channel-name text-sm truncate flex-1">' . htmlspecialchars($channel['name']) . '</span>';
        echo '  </div>';
        
        if ($type === 'voice') {
            $countClass = $isActive ? 'text-white/80' : 'text-gray-400 group-hover:text-gray-300';
            echo '  <div class="voice-user-count hidden items-center ml-2 text-xs ' . $countClass . ' transition-colors duration-150"></div>';
        }
        
        echo '</div>';
        
        if ($type === 'voice') {
            echo '<div class="voice-participants ml-4 hidden rounded-md overflow-hidden transition-all duration-200" 
                       data-channel-id="' . $channel['id'] . '">';
            echo '</div>';
        }
    }
}

if (!function_exists('renderChannelSkeleton')) {
    function renderChannelSkeleton($count = 1, $extraClass = '') {
        for ($i = 0; $i < $count; $i++) {
            echo '<div class="flex items-center py-1.5 px-2 ' . $extraClass . '">';
            echo '  <div class="h-2.5 w-2.5 bg-gray-700 rounded-sm mr-2 flex-shrink-0 simple-pulse"></div>';
            echo '  <div class="h-3.5 bg-gray-700 rounded w-' . rand(16, 32) . ' flex-1 simple-pulse"></div>';
            echo '</div>';
        }
    }
}

if (!function_exists('renderCategorySkeleton')) {
    function renderCategorySkeleton($count = 1) {
        for ($i = 0; $i < $count; $i++) {
            echo '<div class="mb-3">';
            echo '  <div class="flex items-center px-2 py-1 mb-1">';
            echo '    <div class="h-3.5 bg-gray-700 rounded w-24 flex-1 simple-pulse"></div>';
            echo '    <div class="ml-2 h-2.5 w-2.5 bg-gray-700 rounded-sm flex-shrink-0 simple-pulse"></div>';
            echo '  </div>';
            renderChannelSkeleton(rand(2, 4), 'ml-2');
            echo '</div>';
        }
    }
} 