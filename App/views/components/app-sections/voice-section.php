<?php
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

// Add a container div that ensures full coverage of the main content area
echo '<div class="voice-container flex flex-col h-full w-full bg-[#313338] overflow-hidden">';

// Container for voice-not-join component (shown first)
echo '<div id="voice-not-join-container" class="flex-1 h-full w-full">';
include __DIR__ . '/../voice/voice-not-join.php';
echo '</div>';

// Container for voice-call-section component (hidden initially)
echo '<div id="voice-call-container" class="hidden flex-1 h-full w-full">';
include __DIR__ . '/../voice/voice-call-section.php';
echo '</div>';

// Close the main container
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

// Add additional CSS to ensure proper sizing
echo '<style>
    .voice-container {
        position: relative;
        min-height: 100%;
        height: 100vh;
    }
    
    #voice-not-join-container,
    #voice-call-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>';