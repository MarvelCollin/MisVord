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

$isVoiceChannel = ($channelType === 'voice' || $channelType === 'vc' || $channelType === 2);
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

    <?php include dirname(__DIR__) . '/app-sections/server-sidebar.php'; ?>

    <div class="flex flex-1 overflow-hidden">
        <?php if ($contentType === 'home' || $contentType === 'dm'): ?>
            <?php include dirname(__DIR__) . '/app-sections/direct-messages-sidebar.php'; ?>
        <?php elseif ($contentType === 'server'): ?>
            <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
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
                    $channelType = isset($_GET['type']) ? $_GET['type'] : 'text';

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
                    ?>
                    
                    <div class="chat-section <?php echo $isTextChannel ? '' : 'hidden'; ?>" data-channel-id="<?php echo $activeChannelId; ?>" data-channel-type="text">
                        <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
                    </div>
                    <div class="voice-section <?php echo $isVoiceChannel ? '' : 'hidden'; ?>" data-channel-id="<?php echo $activeChannelId; ?>" data-channel-type="voice">
                        <?php include dirname(__DIR__) . '/app-sections/voice-section.php'; ?>
                    </div>
                </div>
            <?php elseif ($contentType === 'dm'): ?>
                <div class="chat-section">
                    <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
                </div>
            <?php endif; ?>
        </div>

        <?php 
        $showActiveNow = in_array($contentType, ['home', 'dm']);
        $currentPath = $_SERVER['REQUEST_URI'] ?? '';
        $isSettingsPage = strpos($currentPath, '/settings/') === 0;
        
        if ($showActiveNow && !$isSettingsPage): 
        ?>
            <?php include dirname(__DIR__) . '/app-sections/active-now-section.php'; ?>
        <?php elseif ($contentType === 'server' && $isSettingsPage): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php elseif ($contentType === 'dm' && $isSettingsPage): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php endif; ?>
    </div>
</div>

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

.chat-section:not(.hidden), .voice-section:not(.hidden) {
    display: flex !important;
}

#main-content {
    position: relative;
    height: 100vh;
    overflow: hidden;
}
</style>