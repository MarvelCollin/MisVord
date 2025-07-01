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
        <?php elseif ($contentType === 'server'): ?>
            <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
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

        <?php if ($contentType === 'home'): ?>
            <?php include dirname(__DIR__) . '/app-sections/active-now-section.php'; ?>
        <?php elseif ($contentType === 'server'): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php elseif ($contentType === 'dm'): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php endif; ?>
    </div>
</div>

<style>
.chat-section, .voice-section {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
}

.chat-section.hidden, .voice-section.hidden {
    display: none;
}

#main-content {
    position: relative;
}
</style>