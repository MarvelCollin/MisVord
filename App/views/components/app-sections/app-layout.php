<?php
if (!isset($contentType)) {
    $contentType = 'home';
}

$currentServer = $currentServer ?? $GLOBALS['currentServer'] ?? null;

$serverIdFromUrl = null;
if (isset($_SERVER['REQUEST_URI']) && preg_match('/\/server\/(\d+)/', $_SERVER['REQUEST_URI'], $matches)) {
    $serverIdFromUrl = $matches[1];
    
    if ($serverIdFromUrl && !$currentServer) {
        require_once dirname(dirname(dirname(__DIR__))) . '/controllers/ServerController.php';
        $tempServerController = new ServerController();
        $tempServerController->show($serverIdFromUrl);
        $currentServer = $GLOBALS['currentServer'] ?? null;
        $contentType = 'server';
    }
}

$additional_js[] = 'components/app-layout';
?>

<div class="flex h-screen" 
     data-user-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>" 
     data-username="<?php echo htmlspecialchars($_SESSION['username']); ?>"
     data-discriminator="<?php echo htmlspecialchars($_SESSION['discriminator'] ?? '0000'); ?>"
     id="app-container">

    <?php include dirname(__DIR__) . '/app-sections/server-sidebar.php'; ?>

    <div class="flex flex-1 overflow-hidden">
        <?php if ($contentType === 'home' || $contentType === 'dm'): ?>
            <?php include dirname(__DIR__) . '/app-sections/direct-messages-sidebar.php'; ?>
        <?php endif; ?>

        <div class="flex flex-col flex-1">
            <?php if ($contentType === 'home'): ?>
                <div class="flex-1 bg-discord-background flex flex-col">
                    <div class="h-12 bg-discord-background border-b border-gray-800 flex items-center px-4">
                        <div class="flex items-center">
                            <i class="fa-solid fa-user-group text-[18px] text-gray-400 mr-2"></i>
                            <span class="font-semibold text-white">Friends</span>
                        </div>
                        <div class="border-l border-gray-800 h-6 mx-4"></div>
                        <div class="flex space-x-4 text-sm">
                            <?php
                            $activeTab = $GLOBALS['activeTab'] ?? 'online';
                            $tabs = [
                                'online' => 'Online',
                                'all' => 'All',
                                'pending' => 'Pending',
                                'blocked' => 'Blocked'
                            ];
                            
                            foreach ($tabs as $tab => $label) {
                                $activeClass = ($activeTab === $tab) 
                                    ? 'text-white bg-discord-primary hover:bg-discord-primary/90' 
                                    : 'text-gray-300 hover:text-white hover:bg-discord-light';
                                echo "<a href='/app/friends?tab={$tab}' class='{$activeClass} px-2 py-0.5 rounded' data-tab='{$tab}'>{$label}</a>";
                            }
                            
                            $addFriendClass = ($activeTab === 'add-friend') 
                                ? 'bg-discord-green hover:bg-discord-green/90' 
                                : 'bg-discord-green hover:bg-discord-green/90';
                            ?>
                            <a href='/app/friends?tab=add-friend' class="<?php echo $addFriendClass; ?> text-white px-3 py-1 rounded" data-tab="add-friend">Add Friend</a>
                        </div>
                    </div>

                    <?php
                    $activeTab = $GLOBALS['activeTab'] ?? 'online';
                    ?>
                    <div class="tab-content <?php echo $activeTab === 'online' ? '' : 'hidden'; ?>" id="online-tab">
                        <?php include dirname(__DIR__) . '/app-sections/home-content.php'; ?>
                    </div>
                    
                    <div class="tab-content <?php echo $activeTab === 'all' ? '' : 'hidden'; ?>" id="all-tab">
                        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-gray-400 font-bold text-xs uppercase">All Friends</h2>
                                <div class="relative w-60">
                                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
                                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                                </div>
                            </div>
                            <div class="space-y-1" id="all-friends-container"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content <?php echo $activeTab === 'pending' ? '' : 'hidden'; ?>" id="pending-tab">
                        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-gray-400 font-bold text-xs uppercase">Pending</h2>
                                <div class="relative w-60">
                                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
                                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                                </div>
                            </div>
                            <div class="space-y-4" id="pending-requests"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content <?php echo $activeTab === 'blocked' ? '' : 'hidden'; ?>" id="blocked-tab">
                        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-gray-400 font-bold text-xs uppercase">Blocked</h2>
                                <div class="relative w-60">
                                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
                                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                                </div>
                            </div>
                            <div class="space-y-1" id="blocked-users-container"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content <?php echo $activeTab === 'add-friend' ? '' : 'hidden'; ?>" id="add-friend-tab">
                        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">                            <h2 class="text-white font-bold text-lg mb-2">Add Friend</h2>
                            <p class="text-gray-400 text-sm mb-4">You can add friends with their MisVord username or full username#discriminator.</p>
                            
                            <div class="bg-discord-dark p-3 rounded">
                                <div class="border-b border-gray-700 pb-4">
                                    <label class="text-gray-400 text-sm uppercase font-medium">Add Friend</label>
                                    <div class="flex mt-2">                                        <input type="text" class="flex-1 bg-discord-dark text-white px-3 py-2 rounded-l border border-gray-700 focus:outline-none focus:ring-1 focus:ring-discord-primary" 
                                               placeholder="Username#XXXX" id="friend-username-input">
                                        <button class="bg-discord-primary text-white px-4 py-2 rounded-r font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled id="send-friend-request">
                                            Send Friend Request
                                        </button>
                                    </div>
                                    <div class="text-discord-red text-sm mt-1 hidden" id="friend-request-error"></div>
                                    <div class="text-discord-green text-sm mt-1 hidden" id="friend-request-success"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            <?php elseif ($contentType === 'server'): ?>
                <?php

                $activeChannelId = $GLOBALS['activeChannelId'] ?? null;
                $channels = $GLOBALS['serverChannels'] ?? [];
                $activeChannel = null;
                $channelType = 'text'; 

                foreach ($channels as $channel) {
                    if ($channel['id'] == $activeChannelId) {
                        $activeChannel = $channel;

                        if (isset($channel['type_name']) && $channel['type_name'] === 'voice') {
                            $channelType = 'voice';
                        } elseif (isset($channel['type']) && ($channel['type'] === 'voice' || $channel['type'] === 2)) {
                            $channelType = 'voice';
                        }

                        $GLOBALS['activeChannel'] = $activeChannel;
                        break;
                    }
                }

                if (isset($_GET['type']) && $_GET['type'] === 'voice') {
                    $channelType = 'voice';
                }

                if ($channelType === 'voice') {
                    include dirname(__DIR__) . '/app-sections/voice-section.php';
                } else {
                    include dirname(__DIR__) . '/app-sections/chat-section.php';
                }
                ?>
            <?php elseif ($contentType === 'dm'): ?>
                <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
            <?php endif; ?>
        </div>

        <?php if ($contentType === 'home'): ?>
            <?php include dirname(__DIR__) . '/app-sections/active-now-section.php'; ?>
        <?php elseif ($contentType === 'server'): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php elseif ($contentType === 'dm'): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php endif; ?>
    </div>
</div>

<?php include dirname(__DIR__) . '/app-sections/create-server-modal.php'; ?>