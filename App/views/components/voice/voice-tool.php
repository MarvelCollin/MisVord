<?php
$userName = $_SESSION['username'] ?? 'User';
$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<div class="flex items-center justify-between h-13 bg-[#232428] px-3 w-full border-t border-[#1a1b1e]">
    <div class="flex items-center space-x-1">
        <button id="micBtn" class="mic-btn flex items-center justify-center h-8 w-8 rounded-md bg-transparent text-[#b5bac1] hover:bg-[#393c41] transition-colors" title="Mute">
            <i class="fas fa-microphone text-sm"></i>
        </button>
        <button id="deafenBtn" class="deafen-btn flex items-center justify-center h-8 w-8 rounded-md bg-transparent text-[#b5bac1] hover:bg-[#393c41] transition-colors" title="Deafen">
            <i class="fas fa-headphones text-sm"></i>
            </button>
        <button id="settingsBtn" class="flex items-center justify-center h-8 w-8 rounded-md bg-transparent text-[#b5bac1] hover:bg-[#393c41] transition-colors" title="Voice Settings">
            <i class="fas fa-cog text-sm"></i>
            </button>
        </div>

    <div class="flex items-center space-x-1">
        <button id="joinVideoBtn" class="video-btn flex items-center justify-center h-8 w-8 rounded-md bg-transparent text-[#b5bac1] hover:bg-[#393c41] transition-colors" title="Turn On Camera">
            <i class="fas fa-video-slash text-sm"></i>
            </button>
        <button id="screenBtn" class="screen-btn flex items-center justify-center h-8 w-8 rounded-md bg-transparent text-[#b5bac1] hover:bg-[#393c41] transition-colors" title="Share Your Screen">
            <i class="fas fa-desktop text-sm"></i>
            </button>
        <button id="leaveBtn" class="flex items-center justify-center h-8 w-8 rounded-md bg-[#ED4245] text-white hover:bg-[#a12d2f] transition-colors" title="Disconnect">
            <i class="fas fa-phone-slash text-sm"></i>
        </button>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log("Voice tools DOM loaded, initializing...");
    initializeVoiceTools();
});

function initializeVoiceTools(retryCount = 0) {
    console.log(`Initializing voice tools (attempt ${retryCount + 1})`);
    
    // Check if voice state manager exists
    if (!window.voiceStateManager) {
        console.log("Voice state manager not found, waiting...");
        
        // Retry up to 5 times
        if (retryCount < 5) {
            setTimeout(() => initializeVoiceTools(retryCount + 1), 500);
            return;
        } else {
            console.warn("Failed to initialize voice tools - voiceStateManager not available");
            return;
        }
    }

    try {
        console.log("Setting up voice tool controls");
        
        const controls = {
            micBtn: { id: 'micBtn', handler: () => window.voiceStateManager.toggleMic() },
            joinVideoBtn: { id: 'joinVideoBtn', handler: () => window.voiceStateManager.toggleVideo() },
            screenBtn: { id: 'screenBtn', handler: () => window.voiceStateManager.toggleScreenShare() },
            deafenBtn: { id: 'deafenBtn', handler: () => window.voiceStateManager.toggleDeafen() },
            leaveBtn: { id: 'leaveBtn', handler: () => window.voiceStateManager.disconnectVoice() }
        };

        // Remove any existing event listeners by cloning and replacing
        Object.values(controls).forEach(control => {
            const btn = document.getElementById(control.id);
            
            if (btn) {
                console.log(`Setting up ${control.id} button`);
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        control.handler();
                    } catch (error) {
                        console.error(`Error handling ${control.id} click:`, error);
                    }
                });
            } else {
                console.warn(`Button ${control.id} not found`);
            }
        });

        // Update control states after setup
        if (window.voiceStateManager) {
            try {
                window.voiceStateManager.updateAllControls();
                console.log("Voice tools initialized successfully");
            } catch (e) {
                console.error("Error updating voice controls:", e);
            }
        }
    } catch (error) {
        console.error("Error setting up voice tools:", error);
    }
}

// Expose the function to the global scope
window.initializeVoiceTools = initializeVoiceTools;
</script>