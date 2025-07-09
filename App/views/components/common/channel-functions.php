<?php

function getChannelIcon($type) {
    return match(strtolower($type ?? 'text')) {
        'voice' => 'volume-high',
        'announcement' => 'bullhorn', 
        'forum' => 'users',
        default => 'hashtag'
    };
}

function renderChannel($channel, $activeChannelId) {
    $type = $channel['type'] ?? 'text';
    $icon = getChannelIcon($type);
    $isActive = $activeChannelId == $channel['id'];
    
    $baseClass = 'channel-item group flex items-center py-1 px-2 rounded-md cursor-pointer mb-0.5 select-none transition-all duration-150';
    $activeClass = $isActive ? 'active bg-[#5865f2] text-white' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30';
    $iconClass = $isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300';
    
    echo '<div class="' . $baseClass . ' ' . $activeClass . '" 
              data-channel-id="' . $channel['id'] . '" 
              data-channel-name="' . htmlspecialchars($channel['name']) . '"
              data-channel-type="' . htmlspecialchars($type) . '">';
    
    echo '  <div class="flex items-center flex-1 min-w-0">';
    echo '    <i class="fas fa-' . $icon . ' text-[0.8rem] mr-2 ' . $iconClass . '"></i>';
    echo '    <span class="channel-name text-sm truncate flex-1">' . htmlspecialchars($channel['name']) . '</span>';
    echo '  </div>';
    
    if ($type === 'voice') {
        $countClass = $isActive ? 'text-white/80' : 'text-gray-400 group-hover:text-gray-300';
        echo '  <div class="voice-user-count hidden items-center ml-2 text-xs ' . $countClass . '"></div>';
        echo '</div>';
        echo '<div class="voice-participants ml-4 hidden rounded-md overflow-hidden" data-channel-id="' . $channel['id'] . '"></div>';
    } else {
        echo '</div>';
    }
}