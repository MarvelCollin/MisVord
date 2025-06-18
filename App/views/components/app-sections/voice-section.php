<?php
require_once dirname(__DIR__, 3) . '/config/videosdk.php';

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';
$authToken = VideoSDKConfig::getAuthToken();

$additional_js[] = 'components/voice/voice-manager';
?>

<meta name="videosdk-token" content="<?php echo htmlspecialchars($authToken); ?>">
<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">

<div class="min-h-screen bg-discord-background flex flex-col">
    <header class="h-16 flex items-center px-6 bg-discord-dark shadow">
        <h1 class="text-white text-2xl font-bold"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h1>
    </header>
    
    <main class="flex-1 p-6">
        <!-- Video Container -->
        <div id="videoContainer" class="w-full h-96 bg-gray-900 rounded-lg mb-4 p-4">
            <div id="videosContainer" class="grid grid-cols-2 gap-4 h-full"></div>
        </div>
        
        <!-- Controls -->
        <div class="flex justify-center space-x-4 mb-4">
            <button id="joinBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md">
                Join Call
            </button>
            <button id="leaveBtn" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md" disabled>
                Leave Call
            </button>
            <button id="micBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md" disabled>
                🎤 Mic
            </button>
            <button id="camBtn" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md" disabled>
                📹 Camera
            </button>
            <button id="screenBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md" disabled>
                🖥️ Screen
            </button>
        </div>
        
        <div id="participantsList" class="bg-gray-800 rounded-lg p-4">
            <h3 class="text-white text-lg mb-2">Participants</h3>
            <div id="participants" class="text-gray-300"></div>
        </div>
    </main>
</div>

<script src="https://sdk.videosdk.live/js-sdk/0.0.82/videosdk.js"></script>
