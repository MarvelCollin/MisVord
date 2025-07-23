<?php
require_once __DIR__ . '/../../components/common/tooltip.php';

$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$userName = $_SESSION['username'] ?? 'Anonymous';
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$meetingId = 'voice_channel_' . $activeChannelId;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<link rel="stylesheet" href="/public/css/voice-call-section.css?v=<?php echo time(); ?>">
<link rel="stylesheet" href="/public/css/tic-tac-toe.css?v=<?php echo time(); ?>">

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>">
<meta name="user-avatar" content="<?php echo htmlspecialchars($_SESSION['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="server-id" content="<?php echo htmlspecialchars($currentServer->id ?? ''); ?>">

<div class="voice-call-app w-full h-screen bg-[#2f3136] flex flex-col relative overflow-hidden">
    <div class="voice-header bg-[#36393f] border-b border-[#202225] px-4 py-3 flex items-center shadow-md">
        <div class="flex items-center space-x-3">
            <div class="w-6 h-6 text-[#72767d]">
                <i class="fas fa-volume-up"></i>
            </div>
            <div class="flex items-center space-x-2">
                <h1 class="text-white font-semibold text-base"><?php echo htmlspecialchars($channelName); ?></h1>
                <div class="flex hidden items-center space-x-1 text-[#b9bbbe] text-xs">
                    <div class="w-2 h-2 bg-[#3ba55c] rounded-full"></div>
                    <span id="voiceParticipantCount">0</span>
                </div>
            </div>
        </div>
    </div>

    <div class="flex-1 flex flex-col relative overflow-hidden">
        <div id="unifiedGridView" class="flex-1 p-4">
            <div id="participantGrid" class="w-full h-full grid gap-3 auto-rows-fr">
            </div>
        </div>
    </div>

    <div class="voice-controls bg-[#36393f] border-t border-[#202225] p-2">
        <div class="flex items-center justify-center space-x-4">
            <?php echo tooltip(
                '<button id="micBtn" class="voice-control-btn mic-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#ed4245] text-white transition-all duration-150 flex items-center justify-center">
                    <i class="fas fa-microphone text-sm"></i>
                </button>',
                'Mute',
                'top'
            ); ?>

            <?php echo tooltip(
                '<button id="deafenBtn" class="voice-control-btn deafen-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#ed4245] text-white transition-all duration-150 flex items-center justify-center">
                    <i class="fas fa-headphones text-sm"></i>
                </button>',
                'Deafen',
                'top'
            ); ?>

            <?php echo tooltip(
                '<button id="videoBtn" class="voice-control-btn video-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#3ba55c] text-white transition-all duration-150 flex items-center justify-center">
                    <i class="fas fa-video-slash text-sm"></i>
                </button>',
                'Turn On Camera',
                'top'
            ); ?>

            <?php echo tooltip(
                '<button id="screenBtn" class="voice-control-btn screen-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#5865f2] text-white transition-all duration-150 flex items-center justify-center">
                    <i class="fas fa-desktop text-sm"></i>
                </button>',
                'Share Screen',
                'top'
            ); ?>

            <?php echo tooltip(
                '<button id="ticTacToeBtn" class="voice-control-btn tic-tac-toe-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#8b5cf6] text-white transition-all duration-150 flex items-center justify-center">
                    <i class="fas fa-chess-board text-sm"></i>
                </button>',
                'Play Tic Mac Voe',
                'top'
            ); ?>

            <div class="w-px h-6 bg-[#4f545c]"></div>

            <?php echo tooltip(
                '<button id="disconnectBtn" class="voice-control-btn disconnect-btn w-10 h-10 rounded-full bg-[#ed4245] hover:bg-[#da373c] text-white transition-all duration-150 flex items-center justify-center">
                    <i class="fas fa-phone-slash text-sm"></i>
                </button>',
                'Leave',
                'top'
            ); ?>
        </div>
    </div>

    <div id="loadingOverlay" class="hidden absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-[#2f3136] rounded-2xl p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#5865f2]/30 border-t-[#5865f2] mx-auto mb-4"></div>
            <p class="text-white font-medium">Connecting to voice...</p>
        </div>
    </div>
</div>

<script src="/public/js/components/bot/bot.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/components/messaging/chat-bot.js?v=<?php echo time(); ?>" type="module"></script>

<script src="/public/js/components/activity/tic-tac-toe.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/utils/music-loader-static.js?v=<?php echo time(); ?>" type="module"></script>
<script src="/public/js/components/voice/voice-button-debug.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/components/voice/voice-call-section.js?v=<?php echo time(); ?>" type="module"></script>

<script type="module">
import ChatBot from '/public/js/components/messaging/chat-bot.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatBot && window.globalSocketManager?.io) {
        const mockChatSection = {
            messageInput: null,
            addSystemMessage: (content) => {}
        };
        
        window.chatBot = new ChatBot(mockChatSection);
    }
});
</script>