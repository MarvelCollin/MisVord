<?php
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$channelName = $activeChannel ? (is_array($activeChannel) ? $activeChannel['name'] : $activeChannel->name) : 'Voice Channel';
?>

<div id="joinView" class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
    <div id="interactive-glow" class="absolute w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,transparent_70%)] blur-2xl opacity-0 transition-all duration-300 pointer-events-none"></div>
    
    <div class="absolute inset-8">
        <div class="absolute top-[10%] left-[15%] w-1 h-1 bg-white rounded-full animate-twinkle-star opacity-80"></div>
        <div class="absolute top-[20%] right-[20%] w-0.5 h-0.5 bg-blue-200 rounded-full animate-twinkle-star-2 opacity-70"></div>
        <div class="absolute top-[35%] left-[25%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-twinkle-star-3 opacity-90"></div>
        <div class="absolute top-[45%] right-[30%] w-0.5 h-0.5 bg-cyan-200 rounded-full animate-twinkle-star opacity-60"></div>
        <div class="absolute bottom-[40%] left-[15%] w-1 h-1 bg-indigo-200 rounded-full animate-twinkle-star-2 opacity-75"></div>
        <div class="absolute bottom-[30%] right-[20%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-star-3 opacity-85"></div>
        <div class="absolute top-[15%] left-[50%] w-1 h-1 bg-blue-100 rounded-full animate-twinkle-star opacity-70"></div>
        <div class="absolute bottom-[20%] left-[40%] w-0.5 h-0.5 bg-purple-100 rounded-full animate-twinkle-star-2 opacity-65"></div>
        <div class="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-100 rounded-full animate-twinkle-star-3 opacity-80"></div>
        <div class="absolute top-[55%] left-[10%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-star opacity-75"></div>
        <div class="absolute bottom-[15%] right-[25%] w-1 h-1 bg-blue-200 rounded-full animate-twinkle-star-2 opacity-70"></div>
        <div class="absolute top-[8%] left-[60%] w-0.5 h-0.5 bg-indigo-100 rounded-full animate-twinkle-star-3 opacity-60"></div>
    </div>
    
    <div class="absolute top-[25%] left-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-[#8b5cf6]/25 via-[#6366f1]/15 to-transparent animate-cosmic-drift-1 blur-xl"></div>
    <div class="absolute bottom-[35%] right-[12%] w-20 h-20 rounded-full bg-gradient-to-tl from-[#06b6d4]/20 via-[#3b82f6]/12 to-transparent animate-cosmic-drift-2 blur-lg"></div>
    <div class="absolute bottom-[15%] left-[12%] w-16 h-16 rounded-full bg-gradient-to-r from-[#4f46e5]/15 to-transparent animate-cosmic-drift-3 blur-md"></div>
    <div class="absolute top-[12%] right-[18%] w-14 h-14 rounded-full bg-gradient-to-bl from-[#8b5cf6]/12 to-transparent animate-cosmic-drift-4 blur-lg"></div>
    
    <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]/30"></div>
    
    <div class="absolute inset-0">
        <div class="absolute animate-meteor-1">
            <div class="w-1 h-1 bg-white rounded-full shadow-lg shadow-white/50"></div>
            <div class="absolute inset-0 w-8 h-0.5 bg-gradient-to-r from-white/80 to-transparent transform -translate-y-0.5 blur-sm"></div>
        </div>
        <div class="absolute animate-meteor-2">
            <div class="w-0.5 h-0.5 bg-cyan-200 rounded-full shadow-md shadow-cyan-300/50"></div>
            <div class="absolute inset-0 w-6 h-0.5 bg-gradient-to-r from-cyan-200/60 to-transparent transform -translate-y-0.25 blur-sm"></div>
        </div>
    </div>
    
    <div class="relative z-10 text-center space-y-8 animate-fade-in-cosmic">
        <div class="relative">
            <h2 class="text-4xl font-bold text-white mb-2 drop-shadow-2xl tracking-wide bg-gradient-to-r from-white via-blue-100 via-purple-100 to-cyan-100 bg-clip-text text-transparent animate-cosmic-shimmer">
                <?php echo htmlspecialchars($channelName); ?>
            </h2>
        </div>
        
        <p class="text-blue-100/90 text-lg drop-shadow-lg font-light tracking-wide">No one is currently exploring this space</p>
        
        <div class="space-y-4">
            <div id="loadingContainer" class="w-full max-w-md mx-auto">
                <div id="loadingBar" class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-blue-100/80 font-medium">Initializing voice connection...</span>
                        <span id="loadingPercent" class="text-sm text-cyan-300 font-mono">0%</span>
                    </div>
                    <div class="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/10">
                        <div id="loadingProgress" class="h-full bg-gradient-to-r from-[#8b5cf6] via-[#06b6d4] to-[#6366f1] rounded-full transition-all duration-100 ease-out shadow-lg shadow-purple-500/50" style="width: 0%"></div>
                    </div>
                    <div class="flex items-center justify-center mt-3">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-purple-400 rounded-full animate-loading-dot-1"></div>
                            <div class="w-2 h-2 bg-blue-400 rounded-full animate-loading-dot-2"></div>
                            <div class="w-2 h-2 bg-cyan-400 rounded-full animate-loading-dot-3"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button id="joinBtn" class="relative transition-all duration-300 bg-gradient-to-r from-gray-600/20 to-gray-500/20 border border-gray-500/30 text-gray-400 font-semibold py-4 px-12 rounded-xl cursor-not-allowed z-50 opacity-50" disabled onclick="joinVoiceChannel()">
                <span class="relative z-10 flex items-center gap-3">
                    <i class="fas fa-microphone text-xl"></i>
                    <span id="btnText">Preparing...</span>
                </span>
            </button>
        </div>
    </div>
    
    <div class="absolute top-[10%] left-[8%] w-2.5 h-2.5 bg-gradient-to-br from-white to-blue-200 rounded-full animate-distant-star opacity-60 shadow-lg shadow-blue-300/50"></div>
    <div class="absolute top-[30%] right-[10%] w-2 h-2 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full animate-distant-star-2 opacity-70 shadow-md shadow-purple-300/40"></div>
    <div class="absolute bottom-[20%] right-[12%] w-2.5 h-2.5 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full animate-distant-star-3 opacity-75 shadow-lg shadow-cyan-300/50"></div>
</div>

<div id="connectingView" class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] hidden relative overflow-hidden">
    <div class="relative z-10 text-center space-y-6">
        <div class="relative">
            <div class="animate-spin rounded-full h-16 w-16 border-2 border-transparent bg-gradient-to-r from-[#8b5cf6] via-[#06b6d4] to-[#6366f1] shadow-2xl shadow-purple-500/30"></div>
            <div class="absolute inset-3 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] rounded-full"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-cosmic-scan"></div>
        </div>
        <p class="text-white text-xl font-light tracking-wide drop-shadow-lg animate-pulse-cosmic">Entering the cosmic void...</p>
    </div>
</div>

<style>
@keyframes loading-dot-1 {
    0%, 80%, 100% { 
        opacity: 0.3;
        transform: scale(0.8);
    }
    40% { 
        opacity: 1;
        transform: scale(1.2);
    }
}

@keyframes loading-dot-2 {
    0%, 80%, 100% { 
        opacity: 0.3;
        transform: scale(0.8);
    }
    40% { 
        opacity: 1;
        transform: scale(1.2);
    }
}

@keyframes loading-dot-3 {
    0%, 80%, 100% { 
        opacity: 0.3;
        transform: scale(0.8);
    }
    40% { 
        opacity: 1;
        transform: scale(1.2);
    }
}

.animate-loading-dot-1 {
    animation: loading-dot-1 1.4s infinite ease-in-out;
    animation-delay: 0s;
}

.animate-loading-dot-2 {
    animation: loading-dot-2 1.4s infinite ease-in-out;
    animation-delay: 0.2s;
}

.animate-loading-dot-3 {
    animation: loading-dot-3 1.4s infinite ease-in-out;
    animation-delay: 0.4s;
}

.voice-loading-shimmer {
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(139, 92, 246, 0.3) 50%, 
        transparent 100%);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
</style>

<script>
function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const interactiveGlow = document.getElementById('interactive-glow');
    if (interactiveGlow) {
        interactiveGlow.style.left = (x - 192) + 'px';
        interactiveGlow.style.top = (y - 192) + 'px';
        interactiveGlow.style.opacity = '0.6';
    }
    
    const driftElements = document.querySelectorAll('[class*="animate-cosmic-drift"]');
    driftElements.forEach((element, index) => {
        if (element) {
            const speed = (index + 1) * 0.02;
            const moveX = (x - rect.width / 2) * speed;
            const moveY = (y - rect.height / 2) * speed;
            element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });
}



async function ensureVoiceScriptsLoaded() {
    
    
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkComponents = () => {
            attempts++;
            
            const components = {
                VideoSDK: typeof VideoSDK !== 'undefined',
                videoSDKManager: !!window.videoSDKManager && window.videoSDKManager.initialized,
                VoiceManager: !!window.VoiceManager,
                voiceManager: !!window.voiceManager,
                VoiceSection: !!window.VoiceSection,
                GlobalVoiceIndicator: !!window.GlobalVoiceIndicator
            };
            
            const readyComponents = Object.values(components).filter(Boolean).length;
            const totalComponents = Object.keys(components).length;
            
            
            
            if (readyComponents >= totalComponents - 1 || attempts >= maxAttempts) {

                
                if (!window.voiceManager && window.VoiceManager) {

                    try {
                        window.voiceManager = new window.VoiceManager();

                    } catch (error) {
                        console.error('[Voice Not Join] Error creating VoiceManager:', error);
                    }
                }
                
                resolve(true);
            } else {

                setTimeout(checkComponents, 300);
            }
        };
        
        checkComponents();
    });
}



function resetJoinState() {
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    
    if (joinBtn) joinBtn.disabled = false;
    if (joinView) joinView.classList.remove('hidden');
    if (connectingView) connectingView.classList.add('hidden');
}

async function joinVoiceChannel() {
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    

    
    if (joinBtn) joinBtn.disabled = true;
    if (joinView) joinView.classList.add('hidden');
    if (connectingView) connectingView.classList.remove('hidden');
    
    if (window.MusicLoaderStatic?.playCallSound) {
        window.MusicLoaderStatic.playCallSound();
    }
    
    let joinSuccessful = false;
    
    try {

        const scriptsLoaded = await ensureVoiceScriptsLoaded();
        
        if (!scriptsLoaded) {
            throw new Error('Failed to load voice scripts');
        }
        
        if (!window.voiceManager) {
            throw new Error('Voice manager not available after script loading');
        }
        


        await window.voiceManager.joinVoice(); // This will prepare meeting ID and registration
        

        if (!window.videoSDKManager) {
            throw new Error('VideoSDK manager not available');
        }
        

        const meetingId = window.voiceManager.currentMeetingId;
        const channelId = document.querySelector('meta[name="channel-id"]')?.content;
        const userName = document.querySelector('meta[name="username"]')?.content || 'Anonymous';
        const userId = document.querySelector('meta[name="user-id"]')?.content || window.currentUserId || '';
        const channelName = document.querySelector('h2')?.textContent || 'Voice Channel';
        

        const participantName = userId ? `${userName}_${userId}` : userName;
        
        if (!meetingId) {
            throw new Error('Meeting ID not available from voice manager');
        }
            await window.videoSDKManager.externalInitMeeting(meetingId, participantName, true, false);
        await window.videoSDKManager.externalJoinMeeting();
        
        await waitForJoinConfirmation();
        
        window.videoSDKManager.markExternalJoinSuccess();
        joinSuccessful = true;
        
        // Fire the voice connect event to switch UI
        console.log('[VOICE-JOIN] Firing voiceConnect event to switch UI');
        window.dispatchEvent(new CustomEvent('voiceConnect', {
            detail: { 
                meetingId: window.voiceManager.currentMeetingId,
                channelId: channelId,
                channelName: channelName
            }
        }));
        
        if (window.waitForVideoSDKReady) {

            await window.waitForVideoSDKReady();
        }
              await waitForVoiceCallSectionReady();
        
        // Success - the voiceConnect event will handle UI switching
        
    } catch (error) {
        console.error('[VOICE] Error joining voice:', error);
        
        if (!joinSuccessful && !window.voiceJoinErrorShown) {
            if (window.showToast) {
                window.showToast('Failed to join voice channel. Please try again.', 'error');
            } else {
                alert('Failed to join voice channel. Please try again.');
            }
            window.voiceJoinErrorShown = true;
            setTimeout(() => {
                window.voiceJoinErrorShown = false;
            }, 3000);
        }
        

        setTimeout(() => {

            const voiceCallContainer = document.getElementById('voice-call-container');
            const isVoiceCallVisible = voiceCallContainer && !voiceCallContainer.classList.contains('hidden');
            
            if (!isVoiceCallVisible) {
                if (joinBtn) joinBtn.disabled = false;
                if (joinView) joinView.classList.remove('hidden');
                if (connectingView) connectingView.classList.add('hidden');
            }
        }, 1000);
        
        if (!joinSuccessful) {
            setTimeout(() => {
                resetJoinState();
            }, 1000);
        }
    }
}

async function waitForJoinConfirmation(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkJoinStatus = () => {
            if (window.videoSDKManager && 
                window.videoSDKManager.isConnected && 
                window.videoSDKManager.isMeetingJoined &&
                window.videoSDKManager.meeting) {
                resolve(true);
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error('Join confirmation timeout'));
                return;
            }
            
            setTimeout(checkJoinStatus, 200);
        };
        
        checkJoinStatus();
    });
}

async function waitForVoiceCallSectionReady(timeout = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkReady = () => {

            const voiceCallContainer = document.getElementById('voice-call-container');
            const participantGrid = document.getElementById('participantGrid');
            const voiceControls = document.querySelector('.voice-controls');
            
            const isVoiceCallContainerVisible = voiceCallContainer && !voiceCallContainer.classList.contains('hidden');
            const hasParticipantGrid = participantGrid !== null;
            const hasVoiceControls = voiceControls !== null;
            const isVoiceCallSectionReady = window.voiceCallSection && window.voiceCallSection.initialized;
            
            if (isVoiceCallContainerVisible && hasParticipantGrid && hasVoiceControls && isVoiceCallSectionReady) {

                resolve(true);
                return;
            }
            
            const elapsed = Date.now() - startTime;
            if (elapsed >= timeout) {
                console.warn('[Voice Not Join] Timeout waiting for voice call section to be ready');
                resolve(false);
                return;
            }
            

            setTimeout(checkReady, 100);
        };
        
        checkReady();
    });
}



function startVoiceLoadingSequence() {
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingPercent = document.getElementById('loadingPercent');
    const joinBtn = document.getElementById('joinBtn');
    const btnText = document.getElementById('btnText');
    
    if (!loadingProgress || !loadingPercent || !joinBtn) {
        return;
    }
    
    const loadingDuration = Math.floor(Math.random() * 1000) + 3000;
    let currentProgress = 0;
    const progressInterval = 50;
    const progressStep = (100 / (loadingDuration / progressInterval));
    
    const loadingMessages = [
        'Initializing voice connection...',
        'Checking audio permissions...',
        'Connecting to voice server...',
        'Preparing audio systems...',
        'Almost ready...'
    ];
    
    let messageIndex = 0;
    const loadingText = document.querySelector('#loadingBar .text-blue-100\\/80');
    
    const updateProgress = () => {
        if (!loadingProgress || !loadingPercent) {
            clearInterval(progressTimer);
            return;
        }
        
        currentProgress += progressStep;
        
        if (currentProgress > 100) {
            currentProgress = 100;
        }
        
        loadingProgress.style.width = currentProgress + '%';
        loadingPercent.textContent = Math.floor(currentProgress) + '%';
        
        if (currentProgress >= 20 && messageIndex < loadingMessages.length - 1) {
            const messageThreshold = (messageIndex + 1) * (100 / loadingMessages.length);
            if (currentProgress >= messageThreshold) {
                messageIndex++;
                if (loadingText) {
                    loadingText.textContent = loadingMessages[messageIndex];
                }
            }
        }
        
        if (currentProgress >= 100) {
            clearInterval(progressTimer);
            setTimeout(() => {
                completeLoading();
            }, 300);
        }
    };
    
    const progressTimer = setInterval(updateProgress, progressInterval);
    
    function completeLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        
        if (loadingContainer) {
            loadingContainer.style.opacity = '0';
            loadingContainer.style.transform = 'translateY(-20px)';
            loadingContainer.style.transition = 'all 0.5s ease-out';
            
            setTimeout(() => {
                loadingContainer.style.display = 'none';
            }, 500);
        }
        
        if (joinBtn && btnText) {
            joinBtn.disabled = false;
            joinBtn.style.pointerEvents = 'auto';
            joinBtn.style.cursor = 'pointer';
            joinBtn.className = 'relative transition-all duration-300 bg-gradient-to-r from-[#8b5cf6]/20 to-[#06b6d4]/20 border border-white/30 text-white font-semibold py-4 px-12 rounded-xl hover:scale-110 cursor-pointer z-50';
            
            btnText.textContent = 'Enter the voice channel';
            
            joinBtn.style.opacity = '0';
            joinBtn.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                joinBtn.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                joinBtn.style.opacity = '1';
                joinBtn.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                    const icon = joinBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-microphone text-xl transition-transform group-hover:scale-110';
                    }
                }, 300);
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const joinView = document.getElementById('joinView');
    if (joinView) {
        joinView.addEventListener('mousemove', handleMouseMove);
        
        joinView.addEventListener('mouseleave', function() {
            const interactiveGlow = document.getElementById('interactive-glow');
            if (interactiveGlow) {
                interactiveGlow.style.opacity = '0';
            }
            
            const driftElements = document.querySelectorAll('[class*="animate-cosmic-drift"]');
            driftElements.forEach(element => {
                if (element) {
                    element.style.transform = '';
                }
            });
        });
    }
    
    const joinBtn = document.getElementById('joinBtn');
    
    if (joinBtn && !joinBtn.hasAttribute('data-voice-listener-attached')) {
        joinBtn.setAttribute('data-voice-listener-attached', 'true');
        joinBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            try {
                await joinVoiceChannel();
            } catch (error) {
                resetJoinState();
            }
        });

    }
    
    setTimeout(() => {
        const voiceElements = document.getElementById('joinView');
        if (voiceElements) {
            startVoiceLoadingSequence();
        }
    }, 500);
    
    window.dispatchEvent(new CustomEvent('voiceUIReady'));
});
</script>
