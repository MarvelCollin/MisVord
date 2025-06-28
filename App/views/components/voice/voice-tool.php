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
    initializeVoiceTools();
});

function initializeVoiceTools() {
    if (!window.voiceStateManager) return;

    const controls = {
        micBtn: { id: 'micBtn', handler: () => window.voiceStateManager.toggleMic() },
        joinVideoBtn: { id: 'joinVideoBtn', handler: () => window.voiceStateManager.toggleVideo() },
        screenBtn: { id: 'screenBtn', handler: () => window.voiceStateManager.toggleScreenShare() },
        deafenBtn: { id: 'deafenBtn', handler: () => window.voiceStateManager.toggleDeafen() },
        leaveBtn: { id: 'leaveBtn', handler: () => window.voiceStateManager.disconnectVoice() }
    };

    Object.values(controls).forEach(control => {
        const btn = document.getElementById(control.id);
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                control.handler();
            });
        }
    });

    if (window.voiceStateManager) {
        window.voiceStateManager.updateAllControls();
    }
}

window.initializeVoiceTools = initializeVoiceTools;
</script>