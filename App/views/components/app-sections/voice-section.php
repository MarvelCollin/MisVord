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

<div class="flex flex-col h-screen bg-[#313338] text-white" id="voice-container">
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338] z-20">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($activeChannel->name ?? 'Voice Channel'); ?></span>
        </div>
        <div class="ml-auto">
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <div class="flex-1 flex">
        <div class="flex-1 flex flex-col">
            <?php include __DIR__ . '/../voice/voice-not-join.php'; ?>
            <?php include __DIR__ . '/../voice/voice-connected.php'; ?>
        </div>
    </div>
</div>

<script src="/public/js/components/voice/voice-section.js"></script>


</script>