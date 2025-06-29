<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice State Sync Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-white p-8">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">Voice State Sync Test</h1>
        
        <div id="test-controls" class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Test Controls</h2>
            <div class="flex flex-wrap gap-4">
                <button id="toggle-mic" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                    Toggle Mic
                </button>
                <button id="toggle-deafen" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                    Toggle Deafen
                </button>
                <button id="reset-all" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                    Reset All
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Global Indicator Style</h3>
                <div class="grid grid-cols-2 gap-2">
                    <button id="global-mic" class="mic-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-md">
                        <i class="fas fa-microphone text-[#b9bbbe]"></i>
                    </button>
                    <button id="global-deafen" class="deafen-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-md">
                        <i class="fas fa-headphones text-[#b9bbbe]"></i>
                    </button>
                </div>
            </div>

            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Voice Channel Style</h3>
                <div class="flex space-x-4">
                    <button id="voice-mic" class="mic-btn w-14 h-14 rounded-full bg-[#2f3136] text-[#b9bbbe]">
                        <i class="fas fa-microphone text-xl"></i>
                    </button>
                    <button id="voice-deafen" class="deafen-btn w-14 h-14 rounded-full bg-[#2f3136] text-[#b9bbbe]">
                        <i class="fas fa-headphones text-xl"></i>
                    </button>
                </div>
            </div>

            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">User Profile Style</h3>
                <div class="flex space-x-4">
                    <button id="profile-mic" class="mic-btn text-discord-lighter">
                        <i class="fas fa-microphone text-lg"></i>
                    </button>
                    <button id="profile-deafen" class="deafen-btn text-discord-lighter">
                        <i class="fas fa-headphones text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script type="module">
        import { LocalStorageManager } from '/public/js/utils/local-storage-manager.js';
        
        const storageManager = new LocalStorageManager();
        window.localStorageManager = storageManager;

        function updateControls() {
            const state = storageManager.getVoiceState();
            console.log('Updating controls with state:', state);
            
            const allMicBtns = document.querySelectorAll('#global-mic, #voice-mic, #profile-mic');
            const allDeafenBtns = document.querySelectorAll('#global-deafen, #voice-deafen, #profile-deafen');

            allMicBtns.forEach(btn => {
                const icon = btn.querySelector('i');
                if (state.isMuted || state.isDeafened) {
                    icon.className = icon.className.replace('fa-microphone', 'fa-microphone-slash');
                    btn.classList.add('bg-[#ed4245]', 'text-[#ed4245]');
                    btn.classList.remove('bg-[#2f3136]', 'text-discord-lighter');
                } else {
                    icon.className = icon.className.replace('fa-microphone-slash', 'fa-microphone');
                    btn.classList.remove('bg-[#ed4245]', 'text-[#ed4245]');
                    btn.classList.add('bg-[#2f3136]', 'text-discord-lighter');
                }
            });

            allDeafenBtns.forEach(btn => {
                const icon = btn.querySelector('i');
                if (state.isDeafened) {
                    icon.className = icon.className.replace('fa-headphones', 'fa-volume-xmark');
                    btn.classList.add('bg-[#ed4245]', 'text-[#ed4245]');
                    btn.classList.remove('bg-[#2f3136]', 'text-discord-lighter');
                } else {
                    icon.className = icon.className.replace('fa-volume-xmark', 'fa-headphones');
                    btn.classList.remove('bg-[#ed4245]', 'text-[#ed4245]');
                    btn.classList.add('bg-[#2f3136]', 'text-discord-lighter');
                }
            });
        }

        document.getElementById('toggle-mic').addEventListener('click', () => {
            storageManager.toggleVoiceMute();
        });

        document.getElementById('toggle-deafen').addEventListener('click', () => {
            storageManager.toggleVoiceDeafen();
        });

        document.getElementById('reset-all').addEventListener('click', () => {
            storageManager.setVoiceState({
                isMuted: false,
                isDeafened: false,
                isVideoOn: false,
                isScreenSharing: false,
                volume: 100
            });
        });

        window.addEventListener('voiceStateChanged', updateControls);

        document.addEventListener('DOMContentLoaded', () => {
            updateControls();
            console.log('Test page ready');
        });
    </script>
</body>
</html> 