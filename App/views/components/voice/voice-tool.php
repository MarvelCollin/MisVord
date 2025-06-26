<?php

$isMuted = true; // Set to true to initially show muted state like in the image
$isVideoOn = false; // Set to false to initially show video off state like in the image
$isScreenSharing = false; // Set to false, but we'll add a visual indicator if active
$userName = $_SESSION['username'] ?? 'User';
$userStatus = 'online';
$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<div class="flex items-center h-14 bg-[#232428] px-4 w-full justify-between">
    <div class="flex items-center space-x-2">
        </div>

    <div class="flex items-center space-x-2">
        <div class="flex rounded-lg bg-[#2f3136] p-1">
            <button id="micBtn" class="flex items-center justify-center h-8 w-11 rounded-md transition-colors
                <?php echo $isMuted ? 'bg-[#ED4245] text-white' : 'bg-transparent text-gray-300 hover:bg-[#36373d]'; ?>"
                title="<?php echo $isMuted ? 'Unmute' : 'Mute'; ?>">
                <i class="fas <?php echo $isMuted ? 'fa-microphone-slash' : 'fa-microphone'; ?> text-lg"></i>
                <?php if ($isMuted): ?>
                <span class="absolute right-0 top-0 w-2 h-2 bg-[#ED4245] rounded-full translate-x-1 -translate-y-1"></span>
                <?php endif; ?>
            </button>
            <button id="videoBtn" class="flex items-center justify-center h-8 w-11 rounded-md transition-colors
                <?php echo $isVideoOn ? 'bg-white text-[#232428]' : 'bg-transparent text-gray-300 hover:bg-[#36373d]'; ?>"
                title="<?php echo $isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'; ?>">
                <i class="fas <?php echo $isVideoOn ? 'fa-video' : 'fa-video-slash'; ?> text-lg"></i>
            </button>
        </div>

        <div class="flex rounded-lg bg-[#2f3136] p-1 relative">
            <button id="screenShareBtn" class="relative flex items-center justify-center h-8 w-11 rounded-md transition-colors
                <?php echo $isScreenSharing ? 'bg-white text-[#232428]' : 'bg-transparent text-gray-300 hover:bg-[#36373d]'; ?>"
                title="Share Your Screen">
                <i class="fas fa-desktop text-lg"></i>
                <?php if ($isScreenSharing): ?>
                    <span class="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full"></span>
                <?php endif; ?>
            </button>
            <button id="gameBtn" class="flex items-center justify-center h-8 w-11 rounded-md bg-transparent text-gray-300 hover:bg-[#36373d] transition-colors" title="Activity">
                <i class="fas fa-gamepad text-lg"></i>
            </button>
            <button id="lightBtn" class="flex items-center justify-center h-8 w-11 rounded-md bg-transparent text-gray-300 hover:bg-[#36373d] transition-colors" title="Open Activities">
                <i class="fas fa-lightbulb text-lg"></i>
            </button>
            <button id="moreBtn" class="flex items-center justify-center h-8 w-11 rounded-md bg-transparent text-gray-300 hover:bg-[#36373d] transition-colors" title="More">
                <i class="fas fa-ellipsis-h text-lg"></i>
            </button>
        </div>

        <button id="leaveBtn" class="flex items-center justify-center h-9 w-12 rounded-md bg-[#ED4245] text-white hover:bg-[#c93b3f] transition-colors" title="Disconnect">
            <i class="fas fa-phone-slash text-lg"></i>
        </button>
    </div>
</div>

<script>
    // This is client-side JavaScript to simulate the button states
    // In a real application, these states would be managed by your backend
    // and potentially updated via WebSockets or AJAX calls.

    const micBtn = document.getElementById('micBtn');
    const videoBtn = document.getElementById('videoBtn');
    const screenShareBtn = document.getElementById('screenShareBtn');
    const leaveBtn = document.getElementById('leaveBtn');

    let isMuted = <?php echo json_encode($isMuted); ?>;
    let isVideoOn = <?php echo json_encode($isVideoOn); ?>;
    let isScreenSharing = <?php echo json_encode($isScreenSharing); ?>;

    function updateMicButton() {
        micBtn.classList.toggle('bg-[#ED4245]', isMuted);
        micBtn.classList.toggle('text-white', isMuted);
        micBtn.classList.toggle('bg-transparent', !isMuted);
        micBtn.classList.toggle('text-gray-300', !isMuted);
        micBtn.classList.toggle('hover:bg-[#36373d]', !isMuted);
        micBtn.querySelector('i').classList.toggle('fa-microphone-slash', isMuted);
        micBtn.querySelector('i').classList.toggle('fa-microphone', !isMuted);
        micBtn.title = isMuted ? 'Unmute' : 'Mute';

        let slashIndicator = micBtn.querySelector('.absolute');
        if (isMuted && !slashIndicator) {
            slashIndicator = document.createElement('span');
            slashIndicator.className = 'absolute right-0 top-0 w-2 h-2 bg-[#ED4245] rounded-full translate-x-1 -translate-y-1';
            micBtn.appendChild(slashIndicator);
        } else if (!isMuted && slashIndicator) {
            slashIndicator.remove();
        }
    }

    function updateVideoButton() {
        videoBtn.classList.toggle('bg-white', isVideoOn);
        videoBtn.classList.toggle('text-[#232428]', isVideoOn);
        videoBtn.classList.toggle('bg-transparent', !isVideoOn);
        videoBtn.classList.toggle('text-gray-300', !isVideoOn);
        videoBtn.classList.toggle('hover:bg-[#36373d]', !isVideoOn);
        videoBtn.querySelector('i').classList.toggle('fa-video', isVideoOn);
        videoBtn.querySelector('i').classList.toggle('fa-video-slash', !isVideoOn);
        videoBtn.title = isVideoOn ? 'Turn Off Camera' : 'Turn On Camera';
    }

    function updateScreenShareButton() {
        screenShareBtn.classList.toggle('bg-white', isScreenSharing);
        screenShareBtn.classList.toggle('text-[#232428]', isScreenSharing);
        screenShareBtn.classList.toggle('bg-transparent', !isScreenSharing);
        screenShareBtn.classList.toggle('text-gray-300', !isScreenSharing);
        screenShareBtn.classList.toggle('hover:bg-[#36373d]', !isScreenSharing);

        let activeIndicator = screenShareBtn.querySelector('.absolute');
        if (isScreenSharing && !activeIndicator) {
            activeIndicator = document.createElement('span');
            activeIndicator.className = 'absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full';
            screenShareBtn.appendChild(activeIndicator);
        } else if (!isScreenSharing && activeIndicator) {
            activeIndicator.remove();
        }
    }

    micBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        updateMicButton();
    });

    videoBtn.addEventListener('click', () => {
        isVideoOn = !isVideoOn;
        updateVideoButton();
    });

    screenShareBtn.addEventListener('click', () => {
        isScreenSharing = !isScreenSharing;
        updateScreenShareButton();
    });

    leaveBtn.addEventListener('click', () => {
        alert('Disconnected from voice channel!');
        // In a real application, you would handle the actual disconnection here
    });

    // Initial updates based on PHP values
    updateMicButton();
    updateVideoButton();
    updateScreenShareButton();
</script>