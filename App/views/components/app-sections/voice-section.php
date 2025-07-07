<?php
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

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
    let voicePreloadStarted = false;
    
    async function preloadVoiceResources() {
        if (voicePreloadStarted) return;
        voicePreloadStarted = true;
        
        try {
            if (window.ensureVoiceReady) {
                await window.ensureVoiceReady();
            }
            
            if (window.voiceManager && typeof window.voiceManager.preloadResources === "function") {
                await window.voiceManager.preloadResources();
            }
        } catch (error) {
            console.warn("[VOICE-SECTION] Preload failed:", error);
        }
    }
    
    document.addEventListener("DOMContentLoaded", function() {
        preloadVoiceResources();
        
        window.addEventListener("voiceConnect", function() {
            console.log("[VOICE-SECTION] Switching to call UI");
            document.getElementById("voice-not-join-container")?.classList.add("hidden");
            document.getElementById("voice-call-container")?.classList.remove("hidden");
        });
        
        window.addEventListener("voiceDisconnect", function() {
            console.log("[VOICE-SECTION] Switching to join UI");
            document.getElementById("voice-not-join-container")?.classList.remove("hidden");
            document.getElementById("voice-call-container")?.classList.add("hidden");
        });
        
        if (typeof window.initializeVoiceUI === "function") {
            window.initializeVoiceUI();
        }
        
        setTimeout(() => {
            if (window.voiceManager && typeof window.voiceManager.setupVoice === "function") {
                const channelId = "' . htmlspecialchars($activeChannelId ?: '') . '";
                if (channelId) {
                    window.voiceManager.setupVoice(channelId);
                }
            }
            
            if (window.VoiceSection && !window.voiceSection) {
                window.voiceSection = new window.VoiceSection();
            }
        }, 100);
    });
    
    if (document.readyState === "complete") {
        preloadVoiceResources();
        
        setTimeout(() => {
            if (typeof window.initializeVoiceUI === "function") {
                window.initializeVoiceUI();
            }
            
            if (window.voiceManager && typeof window.voiceManager.setupVoice === "function") {
                const channelId = "' . htmlspecialchars($activeChannelId ?: '') . '";
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