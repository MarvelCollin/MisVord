<?php
if (!isset($contentType)) {
    $contentType = 'home';
}

$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$serverChannels = $GLOBALS['serverChannels'] ?? [];
$serverCategories = $GLOBALS['serverCategories'] ?? [];
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$channelType = 'text';

if ($activeChannel) {
    $channelType = is_array($activeChannel) ? ($activeChannel['type'] ?? 'text') : ($activeChannel->type ?? 'text');
}

$isVoiceChannel = ($channelType === 'voice' || $channelType === 'vc');
$isTextChannel = !$isVoiceChannel;

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

$page_css = $page_css ?? 'app';
$additional_css = $additional_css ?? [];
$body_class = $body_class ?? 'bg-discord-dark text-white';
$page_js = $page_js ?? 'pages/app';
$additional_js = $additional_js ?? [];

$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$isHomePage = strpos($currentPath, '/home') === 0;

if ($isHomePage) {
    if (!in_array('utils/friends-manager', $additional_js)) {
        $additional_js[] = 'utils/friends-manager';
    }
    if (!in_array('components/home/friends-tabs', $additional_js)) {
        $additional_js[] = 'components/home/friends-tabs';
    }
    if (!in_array('components/home/direct-message-nav', $additional_js)) {
        $additional_js[] = 'components/home/direct-message-nav';
    }
}

$additional_js[] = 'components/app-layout';

$showVoiceIndicator = ($contentType === 'server' || $contentType === 'home' || $contentType === 'explore');

$servers = $GLOBALS['servers'] ?? [];
$userServers = $GLOBALS['userServers'] ?? [];
$currentServer = $GLOBALS['server'] ?? $GLOBALS['currentServer'] ?? null;
$currentChannel = $GLOBALS['channel'] ?? $GLOBALS['currentChannel'] ?? null;
$featuredServers = $GLOBALS['featuredServers'] ?? [];
$categories = $GLOBALS['categories'] ?? [];
$friends = $GLOBALS['friends'] ?? [];
$pendingRequests = $GLOBALS['pendingRequests'] ?? [];
$sentRequests = $GLOBALS['sentRequests'] ?? [];
$activeTab = $GLOBALS['activeTab'] ?? 'online';

?>

<div class="flex h-screen" 
     data-user-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>" 
     data-username="<?php echo htmlspecialchars($_SESSION['username']); ?>"
     data-discriminator="<?php echo htmlspecialchars($_SESSION['discriminator'] ?? '0000'); ?>"
     id="app-container">

    <div id="mobile-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden"></div>
    
    <?php include dirname(__DIR__) . '/app-sections/server-sidebar.php'; ?>

    <div class="flex flex-1 overflow-hidden">
        <?php if ($contentType === 'home' || $contentType === 'dm'): ?>
            <?php include dirname(__DIR__) . '/app-sections/direct-messages-sidebar.php'; ?>
        <?php elseif ($contentType === 'server'): ?>
            <div id="channel-sidebar" class="hidden md:flex">
                <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
            </div>
        <?php elseif ($contentType === 'explore'): ?>
            <?php include dirname(__DIR__) . '/app-sections/explore-sidebar.php'; ?>
        <?php endif; ?>

        <div class="flex flex-col flex-1" id="main-content">
            <?php if ($contentType === 'home'): ?>
                <?php include dirname(__DIR__) . '/app-sections/home-main-content.php'; ?>
            <?php elseif ($contentType === 'explore'): ?>
                <?php include dirname(__DIR__) . '/app-sections/explore-main-content.php'; ?>
            <?php elseif ($contentType === 'server'): ?>
                <div class="main-content-area flex-1">
                    <?php
                    $activeChannelId = $GLOBALS['activeChannelId'] ?? null;
                    $channels = $GLOBALS['serverChannels'] ?? [];
                    $activeChannel = null;
                    

                    $channelType = isset($_GET['type']) ? $_GET['type'] : null;
                    
                    if ($activeChannelId) {
                        foreach ($channels as $channel) {
                            if ($channel['id'] == $activeChannelId) {
                                $activeChannel = $channel;
                                

                                if (!$channelType) {
                                    if (isset($channel['type_name']) && $channel['type_name'] === 'voice') {
                                        $channelType = 'voice';
                                    } elseif (isset($channel['type']) && $channel['type'] === 'voice') {
                                        $channelType = 'voice';
                                    } else {
                                        $channelType = 'text';
                                    }
                                }
                                $GLOBALS['activeChannel'] = $activeChannel;
                                break;
                            }
                        }
                    }
                    

                    if (!$channelType) {
                        $channelType = 'text';
                    }
                    

                    $finalIsVoiceChannel = ($channelType === 'voice');
                    $finalIsTextChannel = !$finalIsVoiceChannel;
                    ?>
                    
                    <div class="chat-section <?php echo $finalIsTextChannel ? '' : 'hidden'; ?>" data-channel-id="<?php echo $activeChannelId; ?>" data-channel-type="text">
                        <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
                    </div>
                    <div class="voice-section <?php echo $finalIsVoiceChannel ? '' : 'hidden'; ?>" data-channel-id="<?php echo $activeChannelId; ?>" data-channel-type="voice">
                        <?php include dirname(__DIR__) . '/app-sections/voice-section.php'; ?>
                    </div>
                </div>
            <?php elseif ($contentType === 'dm'): ?>
                <div class="chat-section dm-chat-visible">
                    <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
                </div>
            <?php endif; ?>
        </div>

        <?php if ($contentType === 'home'): ?>
            <div id="active-now-sidebar" class="hidden lg:flex">
                <?php include dirname(__DIR__) . '/app-sections/active-now-section.php'; ?>
            </div>
        <?php elseif ($contentType === 'server'): ?>
            <div id="participant-sidebar" class="hidden xl:flex">
                <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
            </div>
        <?php elseif ($contentType === 'dm'): ?>
            <?php 
            $chatType = $GLOBALS['chatType'] ?? 'direct';
            $targetId = $GLOBALS['targetId'] ?? 0;
            $isGroupChat = false;
            
            if ($chatType === 'direct' && $targetId) {
                require_once dirname(dirname(dirname(__DIR__))) . '/database/repositories/ChatRoomRepository.php';
                $chatRoomRepo = new ChatRoomRepository();
                $chatRoom = $chatRoomRepo->find($targetId);
                $isGroupChat = ($chatRoom && $chatRoom->type === 'group');
            }
            
            if ($isGroupChat):
            ?>
                <div id="group-participant-sidebar" class="hidden lg:flex">
                    <?php include dirname(__DIR__) . '/app-sections/group-chat-participant-section.php'; ?>
                </div>
            <?php else: ?>
                <div id="dm-participant-sidebar" class="hidden lg:flex">
                    <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const mobileOverlay = document.getElementById('mobile-overlay');
    const channelSidebar = document.getElementById('channel-sidebar');
    const participantSidebar = document.getElementById('participant-sidebar');
    
    function showChannelSidebar() {
        if (channelSidebar) {
            channelSidebar.classList.remove('hidden');
            channelSidebar.classList.add('fixed', 'inset-y-0', 'left-16', 'z-50', 'md:relative', 'md:left-0', 'md:z-auto');
            mobileOverlay.classList.remove('hidden');
            
            setTimeout(() => {
                channelSidebar.classList.add('sidebar-open');
                mobileOverlay.classList.add('overlay-open');
            }, 10);
        }
    }
    
    function hideChannelSidebar() {
        if (channelSidebar) {
            channelSidebar.classList.remove('sidebar-open');
            mobileOverlay.classList.remove('overlay-open');
            
            setTimeout(() => {
                channelSidebar.classList.add('hidden');
                channelSidebar.classList.remove('fixed', 'inset-y-0', 'left-16', 'z-50');
                mobileOverlay.classList.add('hidden');
            }, 300);
        }
    }
    
    function showParticipantSidebar() {
        if (participantSidebar) {
            participantSidebar.classList.remove('hidden');
            participantSidebar.classList.add('fixed', 'inset-y-0', 'right-0', 'z-50', 'xl:relative', 'xl:z-auto');
            mobileOverlay.classList.remove('hidden');
            
            setTimeout(() => {
                participantSidebar.classList.add('sidebar-open');
                mobileOverlay.classList.add('overlay-open');
            }, 10);
        }
    }
    
    function hideParticipantSidebar() {
        if (participantSidebar) {
            participantSidebar.classList.remove('sidebar-open');
            mobileOverlay.classList.remove('overlay-open');
            
            setTimeout(() => {
                participantSidebar.classList.add('hidden');
                participantSidebar.classList.remove('fixed', 'inset-y-0', 'right-0', 'z-50');
                mobileOverlay.classList.add('hidden');
            }, 300);
        }
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
            hideChannelSidebar();
            hideParticipantSidebar();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideChannelSidebar();
            hideParticipantSidebar();
        }
    });
    
    window.toggleChannelSidebar = function() {
        if (channelSidebar) {
            const isHidden = channelSidebar.classList.contains('hidden') || 
                           (!channelSidebar.classList.contains('fixed') && window.innerWidth < 768);
            if (isHidden) {
                hideParticipantSidebar();
                showChannelSidebar();
            } else {
                hideChannelSidebar();
            }
        }
    };
    
    window.toggleParticipantSidebar = function() {
        if (participantSidebar) {
            const isHidden = participantSidebar.classList.contains('hidden') || 
                           (!participantSidebar.classList.contains('fixed') && window.innerWidth < 1280);
            if (isHidden) {
                hideChannelSidebar();
                showParticipantSidebar();
            } else {
                hideParticipantSidebar();
            }
        }
    };
    
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            hideChannelSidebar();
            if (channelSidebar) {
                channelSidebar.classList.remove('hidden');
                channelSidebar.classList.add('md:flex');
            }
        }
        if (window.innerWidth >= 1280) {
            hideParticipantSidebar();
            if (participantSidebar) {
                participantSidebar.classList.remove('hidden');
                participantSidebar.classList.add('xl:flex');
            }
        }
    });
});
</script>

<style>
.main-content-area {
    position: relative;
    height: 100%;
    width: 100%;
}

.chat-section, .voice-section {
    width: 100%;
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.chat-section.hidden, .voice-section.hidden {
    display: none !important;
}

.chat-section:not(.hidden), .voice-section:not(.hidden), .chat-section.dm-chat-visible {
    display: flex !important;
}

#main-content {
    position: relative;
    height: 100vh;
    overflow: hidden;
}

@media (max-width: 767px) {
    #channel-sidebar.fixed {
        width: 240px;
        background-color: #2f3136;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
    }
    
    #participant-sidebar.fixed {
        width: 240px;
        background-color: #2f3136;
        box-shadow: -8px 0 16px rgba(0, 0, 0, 0.24);
    }
}

@media (min-width: 768px) {
    #channel-sidebar {
        display: flex !important;
        position: relative !important;
        left: auto !important;
        z-index: auto !important;
    }
}

@media (min-width: 1280px) {
    #participant-sidebar {
        display: flex !important;
        position: relative !important;
        right: auto !important;
        z-index: auto !important;
    }
}

#mobile-overlay {
    backdrop-filter: blur(4px);
}
</style>