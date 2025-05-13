<?php
// Read configuration from .env file
$envFile = __DIR__ . '/../../../.env';
$config = [];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '//') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $config[trim($key)] = trim($value);
        }
    }
}

// Socket.IO server config
$socketServer = $config['SOCKET_SERVER'] ?? 'http://localhost:3000';

// Get current user info (assuming authentication is implemented elsewhere)
$currentUser = [
    'id' => $_SESSION['user_id'] ?? uniqid(), // Fallback to generate an ID if not logged in
    'username' => $_SESSION['username'] ?? 'Guest_' . substr(uniqid(), -5)
];

// Get available channels (in a real app, fetch from database)
$channels = [
    ['id' => 'general', 'name' => 'General Voice'],
    ['id' => 'gaming', 'name' => 'Gaming Voice'],
    ['id' => 'music', 'name' => 'Music Voice']
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Channel - MiscVord</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Socket.IO client -->
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold mb-6">MiscVord Voice Channels</h1>
          <!-- Permission and Connection Status -->
        <div id="connection-area" class="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold mb-4">Voice Connection Status</h2>
            
            <!-- Connection Status Display -->
            <div id="connection-status-display" class="p-3 bg-gray-700 rounded mb-4">
                <div class="flex items-center mb-2">
                    <div id="status-indicator" class="w-3 h-3 rounded-full mr-2 bg-yellow-400"></div>
                    <span id="status-text" class="font-medium">Connecting to voice servers...</span>
                </div>
                <div id="permission-status" class="text-sm text-gray-300 hidden">
                    Please grant microphone access when prompted by your browser.
                </div>
            </div>
            
            <!-- Microphone Test Section -->
            <div class="mt-6 pt-3">
                <h3 class="text-lg font-medium mb-4">Test Your Microphone</h3>
                <div class="flex flex-wrap items-center gap-4">
                    <button id="mic-test-btn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition duration-200">
                        <i class="fas fa-microphone mr-2"></i> Start Microphone Test
                    </button>
                    <div id="mic-status" class="text-gray-400 hidden">Listening...</div>
                </div>
                <div class="mt-4 flex items-center gap-4 hidden" id="mic-test-results">
                    <div class="relative w-full max-w-md h-8 bg-gray-700 rounded overflow-hidden">
                        <div id="volume-meter" class="absolute top-0 left-0 h-full bg-green-500" style="width: 0%"></div>
                    </div>
                    <span id="volume-value" class="text-sm">0%</span>
                </div>
                <div id="mic-feedback" class="mt-2 text-sm hidden"></div>
            </div>
            
            <div id="connection-error" class="mt-3 text-red-400 hidden"></div>
            
            <!-- Reconnection button (hidden by default, shown when connection fails) -->
            <div class="mt-4 hidden" id="reconnect-container">
                <button id="reconnect-btn" class="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded font-medium transition duration-200">
                    <i class="fas fa-refresh mr-2"></i> Reconnect
                </button>
            </div>
        </div>

        <div id="voice-channel" class="hidden">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Channel List -->
                <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 flex items-center">
                        <i class="fas fa-volume-high mr-2"></i> Voice Channels
                    </h2>
                    <div id="channels" class="space-y-2">
                        <?php foreach ($channels as $channel): ?>
                        <div class="channel-item flex justify-between items-center p-3 rounded hover:bg-gray-700 transition duration-200" data-channel-id="<?php echo $channel['id']; ?>">
                            <div class="flex items-center">
                                <i class="fas fa-hashtag text-gray-400 mr-2"></i>
                                <span><?php echo htmlspecialchars($channel['name']); ?></span>
                            </div>
                            <button class="join-channel-btn bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition duration-200">
                                Join
                            </button>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Active Channel -->
                <div class="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2">
                    <div id="no-channel" class="text-center py-10">
                        <i class="fas fa-headset text-5xl mb-4 text-gray-600"></i>
                        <h3 class="text-xl font-medium text-gray-400">Join a voice channel to start talking</h3>
                    </div>
                    
                    <div id="active-channel" class="hidden">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-xl font-semibold flex items-center">
                                <i class="fas fa-volume-high mr-2"></i>
                                <span id="active-channel-name">Channel Name</span>
                            </h2>
                            <button id="leave-channel-btn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition duration-200">
                                Leave Channel
                            </button>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-medium mb-3">Connected Users</h3>
                            <div id="users" class="space-y-2 max-h-96 overflow-y-auto p-2">
                                <!-- Users will be populated here -->
                            </div>
                        </div>
                        
                        <div id="audio-controls" class="bg-gray-700 p-4 rounded-lg flex justify-center items-center gap-4">
                            <button id="mute-btn" class="w-12 h-12 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500 transition duration-200">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button id="deafen-btn" class="w-12 h-12 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500 transition duration-200">
                                <i class="fas fa-headphones"></i>
                            </button>
                            <div class="text-sm ml-4">
                                <p class="mb-1">Status: <span id="connection-status" class="font-semibold text-green-400">Connected</span></p>
                                <p>Quality: <span id="connection-quality" class="font-semibold text-green-400">Excellent</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Audio elements container (hidden) -->
    <div class="hidden">
        <audio id="local-audio" autoplay muted></audio>
        <div id="remote-audios"></div>
        <audio id="echo-audio" autoplay></audio>
    </div>

<script>
// User data from PHP
const currentUser = {
    id: "<?php echo $currentUser['id']; ?>",
    username: "<?php echo $currentUser['username']; ?>"
};

// Socket.IO server from PHP config
const socketServer = "<?php echo $socketServer; ?>";

class VoiceChannel {
    constructor() {
        this.localStream = null;
        this.peerConnections = {};
        this.currentChannel = null;
        this.socket = null;
        this.isMuted = false;
        this.isDeafened = false;
        this.microphoneTestActive = false;
        this.audioContext = null;
        this.microphoneTestInterval = null;
        this.echoEnabled = false;
        
        this.initElements();
        this.setupEventListeners();
    }

    initElements() {
        // Connection elements
        this.usernameInput = document.getElementById('username');
        this.connectBtn = document.getElementById('connect-btn');
        this.connectionArea = document.getElementById('connection-area');
        this.connectionError = document.getElementById('connection-error');
        
        // Channel elements
        this.voiceChannelEl = document.getElementById('voice-channel');
        this.channelsEl = document.getElementById('channels');
        this.noChannelEl = document.getElementById('no-channel');
        this.activeChannelEl = document.getElementById('active-channel');
        this.activeChannelNameEl = document.getElementById('active-channel-name');
        this.usersEl = document.getElementById('users');
        this.leaveChannelBtn = document.getElementById('leave-channel-btn');
        
        // Audio elements
        this.localAudio = document.getElementById('local-audio');
        this.remoteAudiosEl = document.getElementById('remote-audios');
        this.muteBtn = document.getElementById('mute-btn');
        this.deafenBtn = document.getElementById('deafen-btn');
        this.connectionStatusEl = document.getElementById('connection-status');
        this.connectionQualityEl = document.getElementById('connection-quality');
        
        // Microphone test elements
        this.micTestBtn = document.getElementById('mic-test-btn');
        this.micStatus = document.getElementById('mic-status');
        this.micTestResults = document.getElementById('mic-test-results');
        this.volumeMeter = document.getElementById('volume-meter');
        this.volumeValue = document.getElementById('volume-value');
        this.micFeedback = document.getElementById('mic-feedback');
        this.echoAudio = document.getElementById('echo-audio');
    }    setupEventListeners() {
        // Auto connect to voice on page load
        this.connect();
        
        // Microphone test button
        this.micTestBtn.addEventListener('click', () => this.toggleMicrophoneTest());
        
        // Channel join buttons
        const joinButtons = document.querySelectorAll('.join-channel-btn');
        joinButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const channelItem = e.target.closest('.channel-item');
                const channelId = channelItem.dataset.channelId;
                const channelName = channelItem.querySelector('span').textContent;
                this.joinChannel(channelId, channelName);
            });
        });
        
        this.leaveChannelBtn.addEventListener('click', () => this.leaveChannel());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.deafenBtn.addEventListener('click', () => this.toggleDeafen());
        
        // Add event listener to reconnect button if it exists
        const reconnectBtn = document.getElementById('reconnect-btn');
        if (reconnectBtn) {
            reconnectBtn.addEventListener('click', () => this.connect());
        }
    }

    async toggleMicrophoneTest() {
        if (this.microphoneTestActive) {
            this.stopMicrophoneTest();
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false, // Turn off echo cancellation for echo test
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.startMicrophoneTest(stream);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.micFeedback.textContent = 'Unable to access microphone. Please check permissions.';
            this.micFeedback.classList.remove('hidden');
            this.micFeedback.classList.add('text-red-400');
        }
    }
    
    startMicrophoneTest(stream) {
        this.microphoneTestActive = true;
        this.micTestBtn.innerHTML = '<i class="fas fa-stop mr-2"></i> Stop Microphone Test';
        this.micTestBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        this.micTestBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        
        this.micStatus.classList.remove('hidden');
        this.micTestResults.classList.remove('hidden');
        this.micFeedback.classList.add('hidden');
        
        // Store the stream for later cleanup
        this.testStream = stream;
        
        // Setup Echo - Connect microphone input to speakers for immediate feedback
        this.echoAudio.srcObject = stream;
        this.echoAudio.volume = 0.5; // Set a reasonable echo volume
        
        // Update microphone test UI with an echo notice
        const echoNotice = document.createElement('div');
        echoNotice.id = 'echo-notice';
        echoNotice.className = 'mt-2 text-sm text-blue-400';
        echoNotice.innerHTML = '<i class="fas fa-volume-up mr-1"></i> You should hear your voice echoing back. If not, check your speakers/headphones.';
        
        // Add echo control button
        const echoControlDiv = document.createElement('div');
        echoControlDiv.id = 'echo-control';
        echoControlDiv.className = 'mt-3 flex items-center';
        
        const echoVolumeLabel = document.createElement('label');
        echoVolumeLabel.className = 'text-sm text-gray-400 mr-2';
        echoVolumeLabel.textContent = 'Echo Volume:';
        
        const echoVolumeSlider = document.createElement('input');
        echoVolumeSlider.type = 'range';
        echoVolumeSlider.min = '0';
        echoVolumeSlider.max = '1';
        echoVolumeSlider.step = '0.1';
        echoVolumeSlider.value = '0.5';
        echoVolumeSlider.className = 'w-32';
        
        echoVolumeSlider.addEventListener('input', (e) => {
            this.echoAudio.volume = parseFloat(e.target.value);
        });
        
        const echoMuteBtn = document.createElement('button');
        echoMuteBtn.className = 'ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs';
        echoMuteBtn.textContent = 'Mute Echo';
        
        echoMuteBtn.addEventListener('click', () => {
            this.echoAudio.muted = !this.echoAudio.muted;
            echoMuteBtn.textContent = this.echoAudio.muted ? 'Unmute Echo' : 'Mute Echo';
        });
        
        echoControlDiv.appendChild(echoVolumeLabel);
        echoControlDiv.appendChild(echoVolumeSlider);
        echoControlDiv.appendChild(echoMuteBtn);
        
        // Add elements to the test results area
        const testResultsContainer = document.getElementById('mic-test-results').parentNode;
        testResultsContainer.appendChild(echoNotice);
        testResultsContainer.appendChild(echoControlDiv);
        
        // Initialize audio context for volume analysis
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const microphone = this.audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Update volume meter at intervals
        this.microphoneTestInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate volume level (0-100)
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const volumeLevel = Math.min(100, Math.round((average / 128) * 100));
            
            // Update UI
            this.volumeMeter.style.width = `${volumeLevel}%`;
            this.volumeValue.textContent = `${volumeLevel}%`;
            
            // Change color based on volume level
            if (volumeLevel < 10) {
                this.volumeMeter.classList.remove('bg-yellow-500', 'bg-red-500');
                this.volumeMeter.classList.add('bg-green-500');
                this.micFeedback.textContent = 'Your microphone volume is very low. Try speaking louder or increasing your microphone volume.';
                this.micFeedback.classList.remove('hidden', 'text-green-400', 'text-red-400');
                this.micFeedback.classList.add('text-yellow-400');
            } else if (volumeLevel > 80) {
                this.volumeMeter.classList.remove('bg-green-500', 'bg-yellow-500');
                this.volumeMeter.classList.add('bg-red-500');
                this.micFeedback.textContent = 'Your microphone volume is too high. Try speaking more quietly or decreasing your microphone volume.';
                this.micFeedback.classList.remove('hidden', 'text-green-400', 'text-yellow-400');
                this.micFeedback.classList.add('text-red-400');
            } else if (volumeLevel > 30) {
                this.volumeMeter.classList.remove('bg-green-500', 'bg-red-500');
                this.volumeMeter.classList.add('bg-yellow-500');
                this.micFeedback.textContent = 'Your microphone is working well!';
                this.micFeedback.classList.remove('hidden', 'text-yellow-400', 'text-red-400');
                this.micFeedback.classList.add('text-green-400');
            } else {
                this.volumeMeter.classList.remove('bg-yellow-500', 'bg-red-500');
                this.volumeMeter.classList.add('bg-green-500');
                this.micFeedback.textContent = 'Your microphone is working. Try speaking a bit louder for optimal performance.';
                this.micFeedback.classList.remove('hidden', 'text-red-400');
                this.micFeedback.classList.add('text-yellow-400');
            }
        }, 100);
    }
    
    stopMicrophoneTest() {
        if (!this.microphoneTestActive) return;
        
        this.microphoneTestActive = false;
        this.micTestBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i> Start Microphone Test';
        this.micTestBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        this.micTestBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        
        this.micStatus.classList.add('hidden');
        this.micTestResults.classList.add('hidden');
        
        // Remove echo notice and controls
        const echoNotice = document.getElementById('echo-notice');
        if (echoNotice) echoNotice.remove();
        
        const echoControl = document.getElementById('echo-control');
        if (echoControl) echoControl.remove();
        
        // Stop echoing audio
        this.echoAudio.srcObject = null;
        this.echoAudio.muted = true;
        
        // Clean up resources
        clearInterval(this.microphoneTestInterval);
        
        if (this.testStream) {
            this.testStream.getTracks().forEach(track => track.stop());
            this.testStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }    async connect() {
        // Stop any ongoing microphone test when connecting
        this.stopMicrophoneTest();
        
        // Update status
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const permissionStatus = document.getElementById('permission-status');
        
        statusIndicator.className = 'w-3 h-3 rounded-full mr-2 bg-yellow-400';
        statusText.textContent = 'Requesting microphone access...';
        permissionStatus.classList.remove('hidden');
        
        try {
            // Request audio permissions
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            
            // Update status
            statusIndicator.className = 'w-3 h-3 rounded-full mr-2 bg-green-400';
            statusText.textContent = 'Microphone connected';
            permissionStatus.classList.add('hidden');
            
            // Show local audio stream
            this.localAudio.srcObject = this.localStream;
            
            // Connect to Socket.IO server
            this.connectToSignalingServer();
            
            // Hide connection area, show voice channel
            this.connectionArea.classList.remove('hidden');
            this.voiceChannelEl.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            statusIndicator.className = 'w-3 h-3 rounded-full mr-2 bg-red-400';
            statusText.textContent = 'Microphone access denied';
            permissionStatus.textContent = 'Please allow microphone access in your browser settings and refresh the page.';
            permissionStatus.classList.remove('hidden');
            
            // Show reconnect button
            document.getElementById('reconnect-container').classList.remove('hidden');
            
            // Add event listener to reconnect button
            document.getElementById('reconnect-btn').addEventListener('click', () => {
                window.location.reload();
            });
        }
    }

    showError(message) {
        this.connectionError.textContent = message;
        this.connectionError.classList.remove('hidden');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            this.connectionError.classList.add('hidden');
        }, 5000);
    }

    cleanup() {
        this.stopMicrophoneTest();
        this.leaveChannel();
        
        // Close all peer connections
        Object.keys(this.peerConnections).forEach(peerId => {
            this.closePeerConnection(peerId);
        });
        
        // Stop local stream if any
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Initialize the voice channel when the page loads
let voiceChannel;
document.addEventListener('DOMContentLoaded', () => {
    voiceChannel = new VoiceChannel();
    
    // Clean up resources when leaving the page
    window.addEventListener('beforeunload', () => {
        if (voiceChannel) {
            voiceChannel.cleanup();
        }
    });
});
</script>
</body>
</html>