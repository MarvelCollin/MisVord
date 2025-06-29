<?php
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Control Sync Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-white p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Voice Control Sync Test</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- User Profile Controls -->
            <div class="bg-gray-800 p-6 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">User Profile Controls</h2>
                <div class="flex space-x-4">
                    <button class="mic-btn bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-microphone text-lg"></i>
                    </button>
                    <button class="deafen-btn bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-headphones text-lg"></i>
                    </button>
                </div>
            </div>
            
            <!-- Global Voice Indicator Controls -->
            <div class="bg-gray-800 p-6 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">Global Voice Indicator</h2>
                <div class="flex space-x-4">
                    <button class="mic-btn bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-microphone text-lg"></i>
                    </button>
                    <button class="deafen-btn bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-headphones text-lg"></i>
                    </button>
                    <button class="screen-btn bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-desktop text-lg"></i>
                    </button>
                </div>
            </div>
            
            <!-- Voice Call Section Controls -->
            <div class="bg-gray-800 p-6 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">Voice Call Section</h2>
                <div class="flex space-x-4">
                    <button id="voiceMicBtn" class="bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-microphone text-lg"></i>
                    </button>
                    <button id="voiceDeafenBtn" class="bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-headphones text-lg"></i>
                    </button>
                    <button id="voiceScreenBtn" class="bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
                        <i class="fas fa-desktop text-lg"></i>
                    </button>
                </div>
            </div>
            
            <!-- State Display -->
            <div class="bg-gray-800 p-6 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">Current State</h2>
                <div id="stateDisplay" class="text-sm font-mono"></div>
            </div>
            
            <!-- Debug Info -->
            <div class="bg-gray-800 p-6 rounded-lg col-span-full">
                <h2 class="text-xl font-semibold mb-4">Debug Information</h2>
                <div id="debugInfo" class="text-xs font-mono space-y-1"></div>
                <button id="refreshDebug" class="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                    Refresh Debug Info
                </button>
            </div>
        </div>
        
        <div class="mt-8 bg-blue-900 p-4 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Instructions</h3>
            <p class="text-sm">Click any control button and observe that all corresponding buttons update across all sections.</p>
            <p class="text-xs mt-2 text-blue-200">Note: VideoSDK functions will only work when connected to a voice channel. Without VideoSDK, only local state management will work.</p>
        </div>
    </div>

    <script type="module">
        import { LocalStorageManager } from '/public/js/utils/local-storage-manager.js';
        
        const storageManager = new LocalStorageManager();
        window.localStorageManager = storageManager;
        
        function updateStateDisplay() {
            const state = storageManager.getVoiceState();
            const display = document.getElementById('stateDisplay');
            display.innerHTML = `
                <div>isMuted: <span class="${state.isMuted ? 'text-red-400' : 'text-green-400'}">${state.isMuted}</span></div>
                <div>isDeafened: <span class="${state.isDeafened ? 'text-red-400' : 'text-green-400'}">${state.isDeafened}</span></div>
                <div>isScreenSharing: <span class="${state.isScreenSharing ? 'text-blue-400' : 'text-gray-400'}">${state.isScreenSharing}</span></div>
                <div>volume: ${state.volume}</div>
                <div>channelId: ${state.channelId || 'null'}</div>
                <div>channelName: ${state.channelName || 'null'}</div>
            `;
        }
        
        function updateDebugInfo() {
            const debugDisplay = document.getElementById('debugInfo');
            const videoSDKReady = window.videoSDKManager && window.videoSDKManager.isReady && window.videoSDKManager.isReady();
            const videoSDKExists = !!window.videoSDKManager;
            const meetingExists = !!window.videosdkMeeting;
            const localStorageExists = !!window.localStorageManager;
            
            let videoSDKState = 'Not available';
            if (videoSDKExists && window.videoSDKManager.getConnectionState) {
                try {
                    const connState = window.videoSDKManager.getConnectionState();
                    videoSDKState = JSON.stringify(connState, null, 2);
                } catch (e) {
                    videoSDKState = 'Error getting state: ' + e.message;
                }
            }
            
            debugDisplay.innerHTML = `
                <div>LocalStorageManager: <span class="${localStorageExists ? 'text-green-400' : 'text-red-400'}">${localStorageExists}</span></div>
                <div>VideoSDK Manager: <span class="${videoSDKExists ? 'text-green-400' : 'text-red-400'}">${videoSDKExists}</span></div>
                <div>VideoSDK Meeting: <span class="${meetingExists ? 'text-green-400' : 'text-red-400'}">${meetingExists}</span></div>
                <div>VideoSDK Ready: <span class="${videoSDKReady ? 'text-green-400' : 'text-red-400'}">${videoSDKReady}</span></div>
                <div class="mt-2">VideoSDK State:</div>
                <pre class="text-xs text-gray-300 mt-1 whitespace-pre-wrap">${videoSDKState}</pre>
            `;
        }
        
        function setupControls() {
            const allMicBtns = document.querySelectorAll('.mic-btn, #voiceMicBtn');
            const allDeafenBtns = document.querySelectorAll('.deafen-btn, #voiceDeafenBtn');
            const allScreenBtns = document.querySelectorAll('.screen-btn, #voiceScreenBtn');
            
            allMicBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    storageManager.toggleVoiceMute();
                });
            });
            
            allDeafenBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    storageManager.toggleVoiceDeafen();
                });
            });
            
            allScreenBtns.forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (btn.disabled) return;
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    
                    setTimeout(() => {
                        const state = storageManager.getVoiceState();
                        storageManager.setVoiceState({ isScreenSharing: !state.isScreenSharing });
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }, 1000);
                });
            });
        }
        
        storageManager.addVoiceStateListener((state) => {
            updateStateDisplay();
            updateAllControls(state);
        });
        
        function updateAllControls(state) {
            const allMicBtns = document.querySelectorAll('.mic-btn, #voiceMicBtn');
            const allDeafenBtns = document.querySelectorAll('.deafen-btn, #voiceDeafenBtn');
            const allScreenBtns = document.querySelectorAll('.screen-btn, #voiceScreenBtn');
            
            allMicBtns.forEach(btn => {
                const icon = btn.querySelector('i');
                if (state.isMuted || state.isDeafened) {
                    icon.className = 'fas fa-microphone-slash text-lg';
                    btn.classList.add('bg-red-600', 'text-white');
                    btn.classList.remove('bg-gray-700', 'text-gray-300');
                } else {
                    icon.className = 'fas fa-microphone text-lg';
                    btn.classList.remove('bg-red-600', 'text-white');
                    btn.classList.add('bg-gray-700', 'text-gray-300');
                }
            });

            allDeafenBtns.forEach(btn => {
                const icon = btn.querySelector('i');
                if (state.isDeafened) {
                    icon.className = 'fas fa-volume-xmark text-lg';
                    btn.classList.add('bg-red-600', 'text-white');
                    btn.classList.remove('bg-gray-700', 'text-gray-300');
                } else {
                    icon.className = 'fas fa-headphones text-lg';
                    btn.classList.remove('bg-red-600', 'text-white');
                    btn.classList.add('bg-gray-700', 'text-gray-300');
                }
            });
            
            allScreenBtns.forEach(btn => {
                const icon = btn.querySelector('i');
                if (state.isScreenSharing) {
                    icon.className = 'fas fa-desktop text-lg';
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-gray-700', 'text-gray-300');
                } else {
                    icon.className = 'fas fa-desktop text-lg';
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('bg-gray-700', 'text-gray-300');
                }
            });
        }
        
        window.addEventListener('voiceStateChanged', (e) => {
            updateStateDisplay();
            updateAllControls(e.detail);
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            setupControls();
            updateStateDisplay();
            updateAllControls(storageManager.getVoiceState());
            updateDebugInfo();
            
            document.getElementById('refreshDebug').addEventListener('click', () => {
                updateDebugInfo();
                console.log('Debug info refreshed');
            });
        });
    </script>
</body>
</html> 