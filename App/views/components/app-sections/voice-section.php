<?php
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

echo '<div class="voice-container flex flex-col h-full w-full bg-[#313338] overflow-hidden">';

echo '<div id="voice-not-join-container" class="flex-1 h-full w-full">';
include __DIR__ . '/../voice/voice-not-join.php';
echo '</div>';
echo '<div id="voice-call-container" class="hidden flex-1 h-full w-full">';
include __DIR__ . '/../voice/voice-call-section.php';
echo '</div>';
echo '</div>';
echo '<script src="/public/js/utils/voice-presence-debug.js"></script>';
echo '<script>
    document.addEventListener("DOMContentLoaded", function() {
        console.log("[Voice Section] DOM loaded, setting up voice section");
        
        window.addEventListener("voiceConnect", function() {
            console.log("[Voice Section] Voice connect event received");
            document.getElementById("voice-not-join-container")?.classList.add("hidden");
            document.getElementById("voice-call-container")?.classList.remove("hidden");
        });
        
        window.addEventListener("voiceDisconnect", function() {
            console.log("[Voice Section] Voice disconnect event received");
            document.getElementById("voice-not-join-container")?.classList.remove("hidden");
            document.getElementById("voice-call-container")?.classList.add("hidden");
        });
        
        if (typeof window.initializeVoiceSection === "function") {
            console.log("[Voice Section] Calling voice section initializer");
            window.initializeVoiceSection();
        }
        
        setTimeout(() => {
            if (window.voiceManager && typeof window.voiceManager.setupVoice === "function") {
                const channelId = "' . htmlspecialchars($activeChannelId) . '";
                if (channelId) {
                    console.log("[Voice Section] Setting up voice manager for channel:", channelId);
                    window.voiceManager.setupVoice(channelId);
                }
            }
            
            if (window.VoiceSection && !window.voiceSection) {
                console.log("[Voice Section] Creating voice section instance");
                window.voiceSection = new window.VoiceSection();
            }
        }, 100);
    });
    
    if (document.readyState === "complete") {
        console.log("[Voice Section] Document already loaded, running initialization immediately");
        setTimeout(() => {
            if (typeof window.initializeVoiceSection === "function") {
                window.initializeVoiceSection();
            }
            
            if (window.voiceManager && typeof window.voiceManager.setupVoice === "function") {
                const channelId = "' . htmlspecialchars($activeChannelId) . '";
                if (channelId) {
                    window.voiceManager.setupVoice(channelId);
                }
            }
        }, 50);
    }
</script>';
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