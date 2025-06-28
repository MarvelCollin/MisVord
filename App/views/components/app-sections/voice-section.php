<?php
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

// Check if user is already connected to voice
$isConnectedToVoice = false;
$savedVoiceState = isset($_COOKIE['voiceConnectionState']) ? json_decode($_COOKIE['voiceConnectionState'], true) : null;

// If there's localStorage data available, check it through JS
echo '<script>
    document.addEventListener("DOMContentLoaded", function() {
        const savedState = localStorage.getItem("voiceConnectionState");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const currentChannelId = "' . $activeChannelId . '";
                if (state.isConnected && state.currentChannelId === currentChannelId && window.videosdkMeeting) {
                    document.getElementById("voice-not-join-container")?.classList.add("hidden");
                    document.getElementById("voice-call-container")?.classList.remove("hidden");
                }
            } catch(e) {
                console.error("Error parsing voice state:", e);
            }
        }
    });
</script>';

// Container for voice-not-join component (shown first)
echo '<div id="voice-not-join-container">';
include __DIR__ . '/../voice/voice-not-join.php';
echo '</div>';

// Container for voice-call-section component (hidden initially)
echo '<div id="voice-call-container" class="hidden">';
include __DIR__ . '/../voice/voice-call-section.php';
echo '</div>';

// Add listener to switch views when voice connects
echo '<script>
    window.addEventListener("voiceConnect", function() {
        document.getElementById("voice-not-join-container")?.classList.add("hidden");
        document.getElementById("voice-call-container")?.classList.remove("hidden");
    });
    
    window.addEventListener("voiceDisconnect", function() {
        document.getElementById("voice-not-join-container")?.classList.remove("hidden");
        document.getElementById("voice-call-container")?.classList.add("hidden");
    });
</script>';