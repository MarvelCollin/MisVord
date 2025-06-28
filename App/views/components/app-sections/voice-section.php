<?php


$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$serverChannels = $GLOBALS['serverChannels'] ?? [];
?>

<link rel="stylesheet" href="/public/css/voice-section.css">

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="server-id" content="<?php echo htmlspecialchars($currentServer->id ?? ''); ?>">

<div class="flex flex-col h-screen bg-[#313338] text-white voice-ui-element" id="voice-container">
    <!-- Header -->
    <div class="h-12 border-b border-[#1f2024] flex items-center px-4 bg-[#313338]">
        <div class="flex items-center space-x-2">
            <i class="fas fa-volume-high text-[#b5bac1]"></i>
            <span class="text-[#f2f3f5] font-medium">Voice Channel</span>
        </div>
        <div class="ml-auto flex items-center space-x-4">
            <button class="text-[#b5bac1] hover:text-[#dbdee1]">
                <i class="fas fa-user-friends"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-[#dbdee1]">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative">
        <div id="mainContent" class="flex-1 flex flex-col">
            <?php include __DIR__ . '/../voice/voice-not-join.php'; ?>
            <!-- Video Grid (Hidden by default) -->
            <div id="videoGrid" class="hidden grid grid-cols-2 gap-4 mb-4"></div>
        </div>
        
        <!-- Voice Controls -->
        <div id="voiceControls" class="hidden">
            <?php include __DIR__ . '/../voice/voice-tool.php'; ?>
        </div>
    </div>
</div>

<script src="/public/js/components/voice/voice-section.js"></script>
<script src="/public/js/components/videosdk/videosdk.js"></script>
<script src="/public/js/components/voice/video-handler.js"></script>


</script>