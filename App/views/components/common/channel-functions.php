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
        
        echo '<div class="channel-item flex items-center py-2 px-3 rounded cursor-pointer ' . $textClass . ' ' . $bgClass . ' ' . $activeClass . ' group" 
                  data-channel-id="' . $channel['id'] . '" 
                  data-channel-name="' . htmlspecialchars($channel['name']) . '"
                  data-channel-type="' . htmlspecialchars($type) . '"
                  data-server-id="' . htmlspecialchars($serverId) . '">';
        echo '  <i class="fas fa-' . $icon . ' text-xs mr-3 ' . $iconClass . '"></i>';
        echo '  <span class="channel-name text-sm flex-1">' . htmlspecialchars($channel['name']) . '</span>';
        
        if ($type === 'voice') {
            $countClass = $isActive ? 'text-white/70' : 'text-gray-500';
            echo '  <span class="ml-auto text-xs ' . $countClass . ' voice-user-count">0</span>';
        }
        
        echo '  <div class="channel-menu relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">';
        echo '    <button class="channel-menu-btn text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center rounded hover:bg-gray-600" data-channel-id="' . $channel['id'] . '">';
        echo '      <i class="fas fa-ellipsis-v text-xs"></i>';
        echo '    </button>';
        echo '    <div class="channel-dropdown hidden absolute right-0 top-6 w-32 bg-[#18191c] rounded-md shadow-lg z-50 py-1 text-sm">';
        echo '      <button class="edit-channel-btn flex items-center w-full px-3 py-2 text-gray-300 hover:bg-[#5865f2] hover:text-white" data-channel-id="' . $channel['id'] . '">';
        echo '        <i class="fas fa-edit w-4 text-center mr-2"></i>';
        echo '        <span>Edit</span>';
        echo '      </button>';
        echo '      <button class="delete-channel-btn flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-600 hover:text-white" data-channel-id="' . $channel['id'] . '" data-channel-name="' . htmlspecialchars($channel['name']) . '">';
        echo '        <i class="fas fa-trash w-4 text-center mr-2"></i>';
        echo '        <span>Delete</span>';
        echo '      </button>';
        echo '    </div>';
        echo '  </div>';
        echo '</div>';
        
        if ($type === 'voice') {
            echo '<div class="voice-participants ml-6" data-channel-id="' . $channel['id'] . '">';
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