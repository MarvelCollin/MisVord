<?php
// Start the session if it hasn't been started already
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Set variables for the main layout
$page_title = 'MiscVord - Global Video Chat';
$body_class = 'bg-gray-900 text-white overflow-hidden';

// Custom CSS and JS for this page
$additional_head = '
<style>
    .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .video-container {
        position: relative;
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: #2D3748;
    }
    
    .video-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .video-container .username {
        position: absolute;
        bottom: 0.5rem;
        left: 0.5rem;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }
    
    .controls {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 1rem;
        background-color: #1A202C;
        border-radius: 0.5rem;
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
    }
    
    .control-btn {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .control-btn:hover {
        opacity: 0.8;
    }
    
    .control-btn.active {
        background-color: #48BB78;
    }
    
    .control-btn.inactive {
        background-color: #718096;
    }
    
    .control-btn.danger {
        background-color: #F56565;
    }
    
    .local-video-container {
        position: fixed;
        bottom: 5rem;
        right: 1rem;
        width: 200px;
        height: 150px;
        border-radius: 0.5rem;
        overflow: hidden;
        z-index: 40;
        border: 2px solid #4A5568;
    }
    
    .local-video-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1); /* Mirror local video */
    }
    
    .participants-panel {
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        width: 250px;
        background-color: #1A202C;
        border-left: 1px solid #2D3748;
        padding: 1rem;
        overflow-y: auto;
    }
    
    .participant-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border-radius: 0.25rem;
        background-color: #2D3748;
    }
    
    .participant-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background-color: #4A5568;
        margin-right: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .main-content {
        margin-right: 250px;
        height: 100vh;
        padding: 1rem;
    }
    
    .username-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 100;
    }
    
    .connection-status {
        padding: 0.5rem 1rem;
        background-color: #2D3748;
        border-radius: 0.25rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }
    
    .status-indicator.connected {
        background-color: #48BB78;
    }
    
    .status-indicator.connecting {
        background-color: #ECC94B;
    }
    
    .status-indicator.disconnected {
        background-color: #F56565;
    }
    
    @media (max-width: 768px) {
        .participants-panel {
            display: none;
        }
        
        .main-content {
            margin-right: 0;
        }
    }
    
    /* Socket Log Styles */
    .socket-logs {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: 5rem;
        width: 90%;
        max-width: 800px;
        height: 200px;
        background-color: rgba(0, 0, 0, 0.8);
        color: #48BB78;
        font-family: monospace;
        font-size: 0.75rem;
        padding: 0.5rem;
        border-radius: 0.25rem;
        overflow-y: auto;
        z-index: 35;
        display: none;
    }
    
    .socket-logs.visible {
        display: block;
    }
    
    .log-entry {
        margin-bottom: 0.25rem;
        border-bottom: 1px solid #4A5568;
        padding-bottom: 0.25rem;
    }
    
    .log-entry.sent {
        color: #4299E1;
    }
    
    .log-entry.received {
        color: #48BB78;
    }
    
    .log-entry.error {
        color: #F56565;
    }
    
    .log-controls {
        position: fixed;
        bottom: 0.5rem;
        left: 1rem;
        z-index: 36;
    }
</style>';
?>

<!-- Define the content for the main layout -->
<?php ob_start(); ?>

<!-- Permission Request Notification -->
<div id="permissionRequest" class="username-modal">
    <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Camera & Microphone Access</h3>
        <p class="mb-4 text-gray-300">Please allow access to your camera and microphone when prompted by your browser.</p>
        <div id="permissionStatus" class="p-3 bg-gray-700 rounded mb-4 text-center">
            Waiting for permission...
        </div>
        <button id="retryPermissionBtn" class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Retry</button>
    </div>
</div>

<div class="flex h-screen">
    <div class="main-content flex-1 flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-xl font-bold">Global Video Chat</h1>
            <div id="connectionStatus" class="connection-status">
                <div class="status-indicator disconnected" id="statusIndicator"></div>
                <span id="statusText">Disconnected</span>
                <button id="retryConnection" class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Retry
                </button>
            </div>
        </div>
        
        <div class="video-grid flex-1" id="videoGrid"></div>
        
        <div class="local-video-container">
            <video id="localVideo" autoplay muted playsinline></video>
        </div>
        
        <div class="controls">
            <div class="control-btn active" id="toggleVideoBtn" title="Toggle Video">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="control-btn active" id="toggleAudioBtn" title="Toggle Audio">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <div class="control-btn inactive" id="toggleScreenBtn" title="Share Screen">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="control-btn danger" id="hangupBtn" title="Leave Chat">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
            </div>
        </div>
    </div>
    
    <div class="participants-panel">
        <h2 class="text-lg font-bold mb-4">Participants</h2>
        <div id="participantsList"></div>
    </div>
</div>

<!-- Socket Logs Panel -->
<div id="socketLogs" class="socket-logs">
    <div id="logEntries"></div>
</div>

<!-- Log Controls -->
<div class="log-controls">
    <button id="toggleLogs" class="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600">
        Show Socket Logs
    </button>
    <button id="clearLogs" class="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 ml-2">
        Clear Logs
    </button>
</div>

<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const permissionRequest = document.getElementById('permissionRequest');
    const permissionStatus = document.getElementById('permissionStatus');
    const retryPermissionBtn = document.getElementById('retryPermissionBtn');
    const retryConnection = document.getElementById('retryConnection');
    const videoGrid = document.getElementById('videoGrid');
    const localVideo = document.getElementById('localVideo');
    const participantsList = document.getElementById('participantsList');
    const connectionStatus = document.getElementById('connectionStatus');
    const socketLogs = document.getElementById('socketLogs');
    const logEntries = document.getElementById('logEntries');
    const toggleLogs = document.getElementById('toggleLogs');
    const clearLogs = document.getElementById('clearLogs');
    
    // Socket Log functionality
    let logsVisible = false;
    
    toggleLogs.addEventListener('click', () => {
        logsVisible = !logsVisible;
        socketLogs.classList.toggle('visible', logsVisible);
        toggleLogs.textContent = logsVisible ? 'Hide Socket Logs' : 'Show Socket Logs';
    });
    
    clearLogs.addEventListener('click', () => {
        logEntries.innerHTML = '';
        console.clear();
        addLogEntry('Logs cleared', 'system');
    });
    
    // Add retry connection button
    retryConnection.addEventListener('click', () => {
        addLogEntry('Manual reconnection requested', 'info');
        if (socket) {
            // Disconnect existing socket
            if (socket.connected) {
                socket.disconnect();
            }
            // Clear existing socket
            socket = null;
        }
        // Create new connection
        connectToSignalingServer();
    });
    
    // Function to add entries to the socket log
    function addLogEntry(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        logEntries.appendChild(entry);
        
        // Auto-scroll to bottom
        socketLogs.scrollTop = socketLogs.scrollHeight;
        
        // Keep only the last 100 entries
        const entries = logEntries.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            logEntries.removeChild(entries[0]);
        }
    }
    
    // Control buttons
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    const hangupBtn = document.getElementById('hangupBtn');
    
    // Global variables
    let localStream = null;
    let screenStream = null;
    let isScreenSharing = false;
    let isVideoEnabled = true;
    let isAudioEnabled = true;
    let userName = 'User_' + Math.floor(Math.random() * 10000); // Generate random username
    let socket = null;
    let socketId = null;
    const peers = {};
    
    // Global room constants
    const GLOBAL_ROOM = 'global-video-chat';
      // Set connection status
    function updateConnectionStatus(status) {
        statusIndicator.className = 'status-indicator ' + status;
        
        switch(status) {
            case 'connected':
                statusText.textContent = 'Connected';
                // Log that we're connected successfully
                console.log('✅ Connected to signaling server');
                addLogEntry('✅ Connected to signaling server', 'received');
                break;
            case 'connecting':
                statusText.textContent = 'Connecting...';
                console.log('⏳ Connecting to signaling server...');
                addLogEntry('⏳ Connecting to signaling server...', 'info');
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected';
                console.log('❌ Disconnected from signaling server');
                addLogEntry('❌ Disconnected from signaling server', 'error');
                break;
        }
    }
    
    // Enhanced connection debugging function
    function logConnectionDebug(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
        addLogEntry(message, 'info');
        
        // Add debugging info to UI for better visibility
        const debugContainer = document.createElement('div');
        debugContainer.className = 'text-xs text-gray-500 hidden';
        debugContainer.textContent = `[${timestamp.split('T')[1].split('.')[0]}] ${message}`;
        
        // We'll keep this hidden by default but it will be in the DOM for inspection
        const debugArea = document.querySelector('#connectionStatus');
        if (debugArea) {
            debugArea.appendChild(debugContainer);
            
            // Only keep the last 10 debug messages
            const debugMessages = debugArea.querySelectorAll('.text-gray-500');
            if (debugMessages.length > 10) {
                debugArea.removeChild(debugMessages[0]);
            }
        }
    }
      // Connect to Socket.io server
    function connectToSignalingServer() {
        updateConnectionStatus('connecting');
        
        logConnectionDebug('Attempting to connect to signaling server...');
        
        // Determine the best server URL using the current page's protocol
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const serverUrl = 'https://marvelcollin.my.id';
        
        addLogEntry(`Connecting to server: ${serverUrl}`, 'info');
        console.log(`Attempting connection to: ${serverUrl}`);
        
        // Clear any existing socket to prevent multiple connections
        if (socket) {
            try {
                socket.disconnect();
                socket.close();
            } catch(e) {
                console.error("Error closing existing socket:", e);
            }
        }
        
        // Try to connect to the server with explicit configuration
        socket = io(serverUrl, {
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
            forceNew: true, // Force a new connection
            path: '/socket.io/', // Make explicit path to socket.io
            query: {
                username: userName, // Add username as query parameter
                room: GLOBAL_ROOM,
                timestamp: Date.now() // Add timestamp to prevent caching issues
            }
        });

        // Debug all socket events
        const originalEmit = socket.emit;
        socket.emit = function() {
            const args = Array.prototype.slice.call(arguments);
            const eventName = args[0];
            const eventData = args.length > 1 ? JSON.stringify(args[1]) : '';
            
            console.log(`[SOCKET OUTGOING] ${eventName}:`, args.length > 1 ? args[1] : '');
            addLogEntry(`[SENT] ${eventName}: ${eventData}`, 'sent');
            
            return originalEmit.apply(this, arguments);
        };
        
        // Intercept all socket events for logging
        const onevent = socket.onevent;
        socket.onevent = function(packet) {
            const args = packet.data || [];
            const eventName = args[0];
            const eventData = args.length > 1 ? JSON.stringify(args[1]) : '';
            
            console.log(`[SOCKET INCOMING] ${eventName}:`, args.length > 1 ? args[1] : '');
            addLogEntry(`[RECEIVED] ${eventName}: ${eventData}`, 'received');
            
            onevent.call(this, packet);
        };
        
        // Check connection status immediately after creating socket
        addLogEntry(`Initial socket state: ${socket.connected ? 'connected' : 'disconnected'}`, 'info');
        
        socket.on('connect', () => {
            logConnectionDebug(`Connected to signaling server with ID: ${socket.id}`);
            socketId = socket.id;
            updateConnectionStatus('connected');
            
            // Show connection in logs visibly
            addLogEntry(`🟢 CONNECTED with ID: ${socket.id}`, 'received');
            
            // Log socket details for debugging
            addLogEntry(`Socket Details - Transport: ${socket.io.engine.transport.name}`, 'info');
            console.log('Socket Connection Details:', {
                id: socket.id,
                connected: socket.connected,
                transport: socket.io.engine.transport.name
            });
            
            // Explicitly join global room with both socketId and userName for proper identification
            socket.emit('join-global-room', {
                roomId: GLOBAL_ROOM,
                userId: socket.id,
                userName: userName
            });
            
            // Add myself to the participants list
            addParticipantItem(socket.id, userName + ' (You)');
            
            // Wait a moment before requesting the user list to ensure the server has processed our join
            setTimeout(() => {
                logConnectionDebug('Requesting global users list...');
                socket.emit('get-global-users', { 
                    roomId: GLOBAL_ROOM 
                });
            }, 1500); // Increased delay to ensure server processes
        });
        
        socket.on('disconnect', (reason) => {
            logConnectionDebug(`Disconnected from signaling server. Reason: ${reason}`);
            updateConnectionStatus('disconnected');
            
            // Add detailed disconnect information
            addLogEntry(`🔴 DISCONNECTED. Reason: ${reason}`, 'error');
            
            // Attempt reconnection if not intentionally disconnected
            if (reason === 'io server disconnect' || reason === 'transport close') {
                // The server has disconnected us, we need to manually reconnect
                addLogEntry('Server forced disconnect. Attempting manual reconnection...', 'info');
                setTimeout(() => {
                    socket.connect();
                }, 2000);
            }
        });
        
        socket.on('connect_error', (error) => {
            logConnectionDebug(`Connection error: ${error.message}`);
            updateConnectionStatus('disconnected');
            addLogEntry(`Connection error: ${error.message}`, 'error');
            
            // Log additional error details
            console.error('Socket connection error details:', error);
            
            // Try alternative connection if first attempt fails
            if (!socket.hasTriedAlternative) {
                socket.hasTriedAlternative = true;
                addLogEntry('Trying alternative connection method...', 'info');
                
                // Change to polling only as a fallback
                socket.io.opts.transports = ['polling'];
                setTimeout(() => {
                    socket.connect();
                }, 2000);
            } else {
                // Provide user feedback
                addLogEntry('Multiple connection attempts failed. Check network or try refreshing.', 'error');
            }
        });
        
        // Actively check the socket status
        setTimeout(() => {
            if (!socket.connected) {
                logConnectionDebug('Socket failed to connect after timeout. Trying again...');
                addLogEntry('Connection timeout. Retrying...', 'info');
                
                // Force reconnect
                socket.io.reconnection(true);
                socket.connect();
            }
        }, 7000);

        // Handle signaling messages
        socket.on('offer', (data) => {
            logConnectionDebug(`Received offer from ${data.from} (${data.userName || 'Unknown'})`);
            handleOffer(data);
        });
        
        socket.on('answer', (data) => {
            logConnectionDebug(`Received answer from ${data.from} (${data.userName || 'Unknown'})`);
            handleAnswer(data);
        });
        
        socket.on('ice-candidate', (data) => {
            logConnectionDebug(`Received ICE candidate from ${data.from}`);
            handleIceCandidate(data);
        });
        
        socket.on('user-joined', (data) => {
            logConnectionDebug(`User joined: ${data.userId} (${data.userName || 'Unknown'})`);
            
            // Always refresh the global users list when someone joins
            console.log("User joined event received, requesting updated users list");
            socket.emit('get-global-users', { 
                roomId: GLOBAL_ROOM 
            });
            
            handleUserJoined(data);
        });
        
        socket.on('user-left', (data) => {
            logConnectionDebug(`User left: ${data.userId}`);
            handleUserLeft(data);
        });
        
        socket.on('global-users', (data) => {
            logConnectionDebug(`Received global users list: ${JSON.stringify(data.users)}`);
            handleGlobalUsers(data);
        });
        
        socket.on('error', (data) => {
            logConnectionDebug(`Server error: ${data.message}`);
            addLogEntry(`Server error: ${data.message}`, 'error');
            handleError(data);
        });
        
        // Debug events
        socket.on('connect_timeout', () => {
            addLogEntry('Connection timeout', 'error');
        });
        
        socket.on('reconnect', (attemptNumber) => {
            addLogEntry(`Reconnected after ${attemptNumber} attempts`, 'info');
        });
        
        socket.on('reconnect_attempt', (attemptNumber) => {
            addLogEntry(`Reconnect attempt #${attemptNumber}`, 'info');
        });
        
        socket.on('reconnect_error', (error) => {
            addLogEntry(`Reconnect error: ${error.message}`, 'error');
        });
        
        socket.on('reconnect_failed', () => {
            addLogEntry('Failed to reconnect after all attempts', 'error');
        });
    }
    
    // Initialize media stream
    async function initLocalStream() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            console.log('Local stream obtained with tracks:', localStream.getTracks().map(t => t.kind));
            addLogEntry(`Local media stream obtained with ${localStream.getTracks().length} tracks`, 'info');
            
            // Check each track to confirm it's working
            localStream.getTracks().forEach(track => {
                addLogEntry(`Local ${track.kind} track ready: ${track.readyState}`, 'info');
                console.log(`Track details:`, track);
                
                // Listen for track ended event
                track.onended = () => {
                    console.log(`Local ${track.kind} track ended`);
                    addLogEntry(`Local ${track.kind} track ended`, 'error');
                };
            });
            
            localVideo.srcObject = localStream;
            
            // Ensure local video plays
            localVideo.play().catch(e => {
                console.error('Error playing local video:', e);
                addLogEntry(`Error playing local video: ${e.message}`, 'error');
            });
            
            return true;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            addLogEntry(`Error accessing media: ${error.message}`, 'error');
            alert('Could not access camera or microphone. Please check permissions: ' + error.message);
            return false;
        }
    }
    
    // Create a new WebRTC peer connection with enhanced configuration
    function createPeerConnection(userId, remoteUserName) {
        logConnectionDebug(`Creating peer connection for ${userId} (${remoteUserName})`);
        addLogEntry(`Creating new peer connection for ${userId} (${remoteUserName})`, 'info');
        
        // Show debug information in video container
        const existingContainer = document.getElementById(`container-${userId}`);
        if (existingContainer) {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'absolute top-0 left-0 bg-black bg-opacity-50 text-xs text-white p-1 z-10';
            debugInfo.id = `debug-${userId}`;
            debugInfo.textContent = 'Connecting...';
            existingContainer.appendChild(debugInfo);
        }
        
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // Free TURN server for testing - replace with your own for production
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            iceCandidatePoolSize: 10,
        });
        
        // Debug ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState;
            logConnectionDebug(`ICE connection state for ${userId}: ${state}`);
            addLogEntry(`ICE connection state for ${userId}: ${state}`, 'info');
            
            // Update debug info
            updateDebugInfo(userId, `ICE: ${state}`);
            
            // Handle ICE restart if needed
            if (state === 'failed') {
                logConnectionDebug(`ICE connection failed for ${userId}, attempting restart...`);
                // Try to restart ICE connection
                if (peerConnection.restartIce) {
                    peerConnection.restartIce();
                }
            }
        };
        
        // Debug ICE gathering state
        peerConnection.onicegatheringstatechange = () => {
            const state = peerConnection.iceGatheringState;
            logConnectionDebug(`ICE gathering state for ${userId}: ${state}`);
            updateDebugInfo(userId, `ICE Gathering: ${state}`);
        };
        
        // Debug signaling state changes
        peerConnection.onsignalingstatechange = () => {
            const state = peerConnection.signalingState;
            logConnectionDebug(`Signaling state change for ${userId}: ${state}`);
            addLogEntry(`Signaling state for ${userId}: ${state}`, 'info');
            updateDebugInfo(userId, `Signaling: ${state}`);
            
            // If connection is closed, clean up
            if (state === 'closed') {
                addLogEntry(`Connection with ${userId} was closed`, 'info');
                delete peers[userId];
            }
        };
        
        // Debug connection state changes and implement reconnection
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            logConnectionDebug(`Connection state for ${userId}: ${state}`);
            addLogEntry(`Connection state for ${userId}: ${state}`, 'info');
            updateDebugInfo(userId, `Connection: ${state}`);
            
            if (state === 'connected') {
                // Update the username element to remove "Connecting..." text
                const usernameElement = document.querySelector(`#container-${userId} .username`);
                if (usernameElement) {
                    usernameElement.textContent = remoteUserName || userId;
                }
                addLogEntry(`Connection established with ${userId}`, 'received');
                
                // Check if we have video tracks
                const videoTracks = peerConnection.getReceivers()
                    .filter(receiver => receiver.track && receiver.track.kind === 'video')
                    .map(receiver => receiver.track);
                
                addLogEntry(`Connected with ${videoTracks.length} video tracks`, 'info');
                
                if (videoTracks.length === 0) {
                    // No video tracks, try requesting them
                    addLogEntry(`No video tracks from ${userId}, requesting renegotiation`, 'info');
                    setTimeout(() => {
                        if (peerConnection.signalingState === 'stable') {
                            peerConnection.onnegotiationneeded();
                        }
                    }, 1000);
                }
            }
            
            if (state === 'failed' || state === 'disconnected') {
                logConnectionDebug(`Connection to ${userId} has failed or disconnected. Attempting to reconnect...`);
                addLogEntry(`Connection to ${userId} has failed. Attempting to reconnect...`, 'error');
                
                // Cleanup failed connection
                if (peers[userId]) {
                    peers[userId].close();
                    delete peers[userId];
                }
                
                // Try reconnecting after a short delay
                setTimeout(() => {
                    if (!peers[userId]) {
                        handleUserJoined({ 
                            userId: userId, 
                            userName: remoteUserName 
                        });
                    }
                }, 2000);
            }
        };
        
        // Handle negotiation needed - important for reliable connections
        peerConnection.onnegotiationneeded = async () => {
            logConnectionDebug(`Negotiation needed for connection with ${userId}`);
            addLogEntry(`Negotiation needed for connection with ${userId}`, 'info');
            updateDebugInfo(userId, 'Negotiating...');
            
            try {
                // Check signaling state before creating offer
                if (peerConnection.signalingState === 'stable') {
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    
                    logConnectionDebug(`Sending new offer to ${userId} after negotiation needed`);
                    socket.emit('offer', {
                        offer: peerConnection.localDescription,
                        to: userId,
                        from: socketId, // Make sure we include our ID
                        userName: userName
                    });
                } else {
                    addLogEntry(`Skipping negotiation - unstable state: ${peerConnection.signalingState}`, 'info');
                }
            } catch (err) {
                logConnectionDebug(`Error during negotiation with ${userId}: ${err.message}`);
                addLogEntry(`Error during negotiation with ${userId}: ${err.message}`, 'error');
            }
        };
        
        // Add all tracks from local stream to peer connection
        if (localStream) {
            console.log(`Adding ${localStream.getTracks().length} local tracks to connection for ${userId}`);
            addLogEntry(`Adding ${localStream.getTracks().length} local tracks (${localStream.getTracks().map(t => t.kind).join(', ')})`, 'sent');
            
            localStream.getTracks().forEach(track => {
                console.log(`Adding ${track.kind} track to connection for ${userId}`, track);
                try {
                    const sender = peerConnection.addTrack(track, localStream);
                    console.log(`Added ${track.kind} track to connection via sender:`, sender);
                } catch(e) {
                    console.error(`Error adding ${track.kind} track:`, e);
                    addLogEntry(`Error adding track: ${e.message}`, 'error');
                }
            });
            
            // Verify tracks were added
            const senders = peerConnection.getSenders();
            console.log(`Connection now has ${senders.length} senders:`, senders);
            addLogEntry(`Connection has ${senders.length} senders`, 'info');
        } else {
            console.warn(`No local stream available when creating peer connection for ${userId}`);
            addLogEntry(`Warning: No local stream available for ${userId}`, 'error');
        }
        
        // Handle incoming streams
        peerConnection.ontrack = (event) => {
            console.log('Received remote track from', userId, event.streams);
            addLogEntry(`📹 Received ${event.track.kind} track from ${userId}`, 'received');
            updateDebugInfo(userId, `Received ${event.track.kind} track`);
            
            // Log detailed track information
            console.log('Track details:', {
                kind: event.track.kind,
                enabled: event.track.enabled,
                muted: event.track.muted,
                readyState: event.track.readyState,
                streamId: event.streams[0]?.id
            });
            
            if (event.streams && event.streams[0]) {
                const remoteStream = event.streams[0];
                addLogEntry(`Stream ID: ${remoteStream.id} with ${remoteStream.getTracks().length} tracks`, 'info');
                
                // Update video element with stream
                updateRemoteVideo(userId, remoteStream, remoteUserName);
                
                // Add track ended handler
                event.track.onended = () => {
                    addLogEntry(`Track ${event.track.kind} ended from ${userId}`, 'info');
                };
                
                // Add track mute handler
                event.track.onmute = () => {
                    addLogEntry(`Track ${event.track.kind} muted from ${userId}`, 'info');
                };
                
                // Add track unmute handler
                event.track.onunmute = () => {
                    addLogEntry(`Track ${event.track.kind} unmuted from ${userId}`, 'info');
                };
            } else {
                addLogEntry(`Received track without stream from ${userId}`, 'error');
                
                // Create a new MediaStream if one doesn't exist
                let stream = document.getElementById(`video-${userId}`)?.srcObject;
                
                if (!stream || !(stream instanceof MediaStream)) {
                    addLogEntry(`Creating new MediaStream for ${userId}`, 'info');
                    stream = new MediaStream();
                }
                
                // Add the track to the stream
                stream.addTrack(event.track);
                console.log(`Added track to synthetic stream:`, stream);
                
                // Update video with the synthetic stream
                updateRemoteVideo(userId, stream, remoteUserName);
            }
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Generated ICE candidate for', userId);
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: userId
                });
            } else {
                console.log('All ICE candidates sent to', userId);
            }
        };
        
        peers[userId] = peerConnection;
        return peerConnection;
    }
    
    // Helper function to update debug info
    function updateDebugInfo(userId, message) {
        const debugElement = document.getElementById(`debug-${userId}`);
        if (debugElement) {
            debugElement.textContent = message;
        }
    }
    
    // Helper function to update remote video elements
    function updateRemoteVideo(userId, stream, displayName) {
        const remoteVideo = document.getElementById(`video-${userId}`);
        
        if (!remoteVideo) {
            addLogEntry(`Creating new video element for ${userId}`, 'info');
            addVideoElement(userId, stream, displayName || userId);
        } else {
            addLogEntry(`Updating existing video element for ${userId}`, 'info');
            
            // Check if the stream is different
            if (remoteVideo.srcObject !== stream) {
                console.log(`Updating video element with new stream for ${userId}`);
                
                // Set the stream without immediate play attempt to avoid conflicts
                remoteVideo.srcObject = stream;
                
                // Let the loadedmetadata event handler handle playback
                addLogEntry(`Stream updated for ${userId} - waiting for metadata`, 'info');
                
                // Force a play after a short delay (needed for some browsers)
                setTimeout(() => {
                    if (remoteVideo.paused && stream.getVideoTracks().length > 0) {
                        console.log(`Trying delayed play for ${userId}`);
                        remoteVideo.play().catch(e => {
                            console.log(`Could not autoplay: ${e.message}`);
                            // Only add play button for genuine autoplay prevention
                            if (e.name === 'NotAllowedError') {
                                const container = document.getElementById(`container-${userId}`);
                                if (container) {
                                    addPlayButton(container, remoteVideo);
                                }
                            }
                        });
                    }
                }, 1000);
            } else {
                console.log(`Stream is the same for ${userId}, no update needed`);
            }
            
            // Monitor track additions for this stream - but don't call play directly
            stream.onaddtrack = (event) => {
                addLogEntry(`New ${event.track.kind} track added to stream for ${userId}`, 'info');
                updateDebugInfo(userId, `Added ${event.track.kind} track`);
            };
            
            // Update the UI to show this user is connected
            const usernameElement = document.querySelector(`#container-${userId} .username`);
            if (usernameElement && usernameElement.textContent.includes('Connecting')) {
                usernameElement.textContent = displayName || userId;
            }
        }
    }
    
    // Add a video element for a remote peer
    function addVideoElement(userId, stream, displayName) {
        console.log(`Adding video element for ${userId} (${displayName})`, stream);
        addLogEntry(`Adding video element for ${userId} (${displayName})`, 'info');
        
        const existingContainer = document.getElementById(`container-${userId}`);
        if (existingContainer) {
            console.log(`Video container for ${userId} already exists, updating stream`);
            const existingVideo = document.getElementById(`video-${userId}`);
            if (existingVideo) {
                existingVideo.srcObject = stream;
                // Don't try to force play here, let event handlers handle it
                return;
            }
        }
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.id = `container-${userId}`;
        
        const videoElement = document.createElement('video');
        videoElement.id = `video-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        
        // Remove controls - this is causing issues
        videoElement.controls = false;
        videoElement.muted = false; // Make sure remote videos aren't muted
        
        videoElement.srcObject = stream;
        
        // Add debug info display
        const debugInfo = document.createElement('div');
        debugInfo.className = 'absolute top-0 left-0 bg-black bg-opacity-50 text-xs text-white p-1 z-10';
        debugInfo.id = `debug-${userId}`;
        debugInfo.textContent = 'New video element';
        
        // Status indicator for video tracks
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'absolute top-0 right-0 p-1 z-10';
        statusIndicator.id = `status-${userId}`;
        
        const videoStatus = document.createElement('span');
        videoStatus.className = 'inline-block w-3 h-3 rounded-full bg-red-500 mr-1';
        videoStatus.id = `video-status-${userId}`;
        
        const audioStatus = document.createElement('span');
        audioStatus.className = 'inline-block w-3 h-3 rounded-full bg-red-500';
        audioStatus.id = `audio-status-${userId}`;
        
        statusIndicator.appendChild(videoStatus);
        statusIndicator.appendChild(audioStatus);
        
        // Update status indicators when tracks are available
        const updateTrackStatus = () => {
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            
            if (videoTracks.length > 0) {
                videoStatus.className = `inline-block w-3 h-3 rounded-full ${videoTracks[0].enabled ? 'bg-green-500' : 'bg-red-500'} mr-1`;
            }
            
            if (audioTracks.length > 0) {
                audioStatus.className = `inline-block w-3 h-3 rounded-full ${audioTracks[0].enabled ? 'bg-green-500' : 'bg-red-500'}`;
            }
        };
        
        // Initial status update
        updateTrackStatus();
        
        // Set up track change monitoring
        stream.onaddtrack = () => {
            updateTrackStatus();
            debugInfo.textContent = `Tracks: ${stream.getTracks().length}`;
        };
        
        stream.onremovetrack = () => {
            updateTrackStatus();
            debugInfo.textContent = `Tracks: ${stream.getTracks().length}`;
        };
        
        // Add video loading event listener - only try to play once
        videoElement.addEventListener('loadedmetadata', () => {
            addLogEntry(`Video metadata loaded for ${userId}`, 'info');
            debugInfo.textContent = 'Metadata loaded';
            
            // Try to play just once on metadata loaded
            if (videoElement.paused) {
                videoElement.play().catch(e => {
                    console.error('Error playing video after metadata loaded:', e);
                    addLogEntry(`Error playing video: ${e.message}`, 'error');
                    debugInfo.textContent = `Play error: ${e.name}`;
                    
                    // Only if autoplay is genuinely rejected, add a play button
                    if (e.name === 'NotAllowedError') {
                        addPlayButton(videoContainer, videoElement);
                    }
                });
            }
        });
        
        videoElement.addEventListener('playing', () => {
            debugInfo.textContent = 'Video playing';
            addLogEntry(`Video is now playing for ${userId}`, 'info');
        });
        
        videoElement.addEventListener('error', (e) => {
            console.error('Video element error:', e);
            debugInfo.textContent = `Error: ${videoElement.error?.message || 'Unknown'}`;
            addLogEntry(`Video element error for ${userId}: ${videoElement.error?.message || 'Unknown error'}`, 'error');
        });
        
        const usernameElement = document.createElement('div');
        usernameElement.className = 'username';
        usernameElement.textContent = displayName;
        
        videoContainer.appendChild(videoElement);
        videoContainer.appendChild(usernameElement);
        videoContainer.appendChild(debugInfo);
        videoContainer.appendChild(statusIndicator);
        videoGrid.appendChild(videoContainer);
        
        // Log that we've added a new video element
        console.log(`Added video element for ${userId}`, videoElement);
        
        // Add to participants list
        addParticipantItem(userId, displayName);
    }
    
    // Create a play button only when absolutely necessary (autoplay blocked)
    function addPlayButton(container, videoElement) {
        // Check if a play button already exists
        if (container.querySelector('.play-button')) {
            return;
        }
        
        const playButton = document.createElement('button');
        playButton.textContent = 'Tap to Play';
        playButton.className = 'play-button absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-10';
        container.appendChild(playButton);
        
        // One-time click handler
        playButton.addEventListener('click', () => {
            videoElement.play().then(() => {
                playButton.remove();
            }).catch(e => {
                addLogEntry(`Still couldn't play video: ${e.message}`, 'error');
            });
        });
    }
    
    // Add a participant to the list
    function addParticipantItem(userId, displayName) {
        const existingItem = document.getElementById(`participant-${userId}`);
        if (existingItem) {
            return;
        }
        
        console.log(`Adding participant to list: ${userId} (${displayName})`);
        
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.id = `participant-${userId}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'participant-avatar';
        avatar.textContent = displayName.charAt(0).toUpperCase();
        
        const name = document.createElement('div');
        name.textContent = displayName;
        
        participantItem.appendChild(avatar);
        participantItem.appendChild(name);
        participantsList.appendChild(participantItem);
    }
    
    // Remove a participant from the list
    function removeParticipantItem(userId) {
        const participantItem = document.getElementById(`participant-${userId}`);
        if (participantItem) {
            participantItem.remove();
        }
    }
    
    // Remove a video element for a remote peer
    function removeVideoElement(userId) {
        const videoContainer = document.getElementById(`container-${userId}`);
        if (videoContainer) {
            videoContainer.remove();
        }
        removeParticipantItem(userId);
    }
      // Handle an answer from a remote peer
    async function handleAnswer(data) {
        const { from, answer, userName: remoteUserName } = data;
        console.log('Received answer from', from, remoteUserName);
        addLogEntry(`Processing answer from ${from} (${remoteUserName || 'Unknown'})`, 'info');
        
        const peerConnection = peers[from];
        if (peerConnection) {
            try {
                // Check current signaling state before applying answer
                const currentState = peerConnection.signalingState;
                addLogEntry(`Current signaling state for ${from}: ${currentState}`, 'info');
                
                // Only apply answer if we're in have-local-offer state
                if (currentState === 'have-local-offer') {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('Set remote description from answer for', from);
                    addLogEntry(`✅ Successfully set remote description for ${from}`, 'received');
                } else if (currentState === 'stable') {
                    // We're already in stable state, meaning we might have already processed this answer
                    // or there's a race condition. Log it but don't throw an error.
                    console.warn(`Ignoring answer from ${from} - connection already in stable state`);
                    addLogEntry(`⚠️ Ignoring duplicate answer - connection already in stable state`, 'error');
                } else {
                    console.warn(`Cannot process answer from ${from} - unexpected signaling state: ${currentState}`);
                    addLogEntry(`⚠️ Cannot process answer - unexpected state: ${currentState}`, 'error');
                }
            } catch (error) {
                console.error('Error handling answer:', error);
                addLogEntry(`❌ Error processing answer: ${error.message}`, 'error');
                
                // If this is a state error, we should try to recover the connection
                if (error.name === 'InvalidStateError') {
                    addLogEntry(`Attempting to recover connection with ${from}...`, 'info');
                    
                    // Close the problematic connection
                    peerConnection.close();
                    delete peers[from];
                    
                    // Wait a moment and try to establish a new connection
                    setTimeout(() => {
                        handleUserJoined({ 
                            userId: from, 
                            userName: remoteUserName || from
                        });
                    }, 2000);
                }
            }
        } else {
            console.warn('Received answer from unknown peer', from);
            addLogEntry(`Received answer from unknown peer ${from}`, 'error');
            
            // Try to establish connection since we received an answer but don't have the peer
            setTimeout(() => {
                handleUserJoined({ 
                    userId: from, 
                    userName: remoteUserName || from
                });
            }, 1000);
        }
    }

    // Handle an offer from a remote peer
    async function handleOffer(data) {
        const { from, offer, userName: remoteUserName } = data;
        console.log('Received offer from', from, remoteUserName);
        addLogEntry(`Processing offer from ${from} (${remoteUserName || 'Unknown'})`, 'info');
        
        // Check if we already have a connection with this peer
        let peerConnection = peers[from];
        
        // If we have an existing connection, check its state
        if (peerConnection) {
            const currentState = peerConnection.signalingState;
            addLogEntry(`Existing connection state: ${currentState}`, 'info');
            
            // If connection is not stable, we need to reset it to avoid state conflicts
            if (currentState !== 'stable') {
                addLogEntry(`Resetting unstable connection (${currentState}) with ${from}`, 'info');
                peerConnection.close();
                delete peers[from];
                peerConnection = null;
            }
        }
        
        // Create new peer connection if needed
        if (!peerConnection) {
            peerConnection = createPeerConnection(from, remoteUserName);
        }
        
        try {
            // Check if the offer is valid
            if (!offer) {
                console.error('Received invalid offer from', from);
                addLogEntry(`Received invalid offer from ${from}`, 'error');
                return;
            }
            
            // Log the signaling state before setting remote description
            addLogEntry(`Signaling state before processing offer: ${peerConnection.signalingState}`, 'info');
            
            // Set remote description
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Set remote description from offer for', from);
            addLogEntry(`✅ Set remote description from offer for ${from}`, 'received');
            
            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log('Created and set local description answer for', from);
            addLogEntry(`Created and set local description answer for ${from}`, 'sent');
            
            // Send answer
            socket.emit('answer', {
                answer,
                to: from,
                from: socketId, // Make sure we include our ID
                userName: userName
            });
        } catch (error) {
            console.error('Error handling offer:', error);
            addLogEntry(`❌ Error handling offer: ${error.message}`, 'error');
            
            // Don't show an alert as it might be disruptive, just log it
            console.error(`Error connecting with peer ${remoteUserName || from}: ${error.message}`);
            
            // Clean up failed connection
            if (peers[from]) {
                peers[from].close();
                delete peers[from];
            }
            
            // Try to restart the connection after a delay
            setTimeout(() => {
                addLogEntry(`Attempting to reconnect with ${from} after error`, 'info');
                handleUserJoined({ 
                    userId: from, 
                    userName: remoteUserName || from
                });
            }, 3000);
        }
    }

    // Handle an ICE candidate from a remote peer
    async function handleIceCandidate(data) {
        const { from, candidate } = data;
        console.log('Received ICE candidate from', from);
        
        const peerConnection = peers[from];
        if (peerConnection) {
            try {
                if (peerConnection.signalingState !== 'closed') {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('Added ICE candidate from', from);
                } else {
                    console.warn(`Cannot add ICE candidate - connection is closed for ${from}`);
                    addLogEntry(`Cannot add ICE candidate - connection is closed`, 'error');
                }
            } catch (e) {
                console.error('Error adding ICE candidate:', e);
                addLogEntry(`Error adding ICE candidate: ${e.message}`, 'error');
            }
        } else {
            console.warn('Received ICE candidate from unknown peer', from);
            addLogEntry(`Received ICE candidate from unknown peer ${from}`, 'error');
        }
    }
      // Handle a new user joining
    async function handleUserJoined(data) {
        const { userId, userName: remoteUserName } = data;
        console.log('User joined:', userId, remoteUserName);
        
        // Skip if it's our own ID
        if (userId === socketId) {
            console.log('This is our own ID, skipping peer creation');
            return;
        }
        
        // Add to participants list first, regardless of peer connection
        addParticipantItem(userId, remoteUserName || userId);
        
        // Create placeholder video container to show user is connecting
        if (!document.getElementById(`container-${userId}`)) {
            const placeholderStream = new MediaStream();
            addVideoElement(userId, placeholderStream, `${remoteUserName || userId} (Connecting...)`);
            addLogEntry(`Created placeholder for ${userId} while connecting`, 'info');
        }
        
        // Skip if we already have a peer connection for this user
        if (peers[userId]) {
            console.log(`Already have a peer connection for ${userId}`);
            return;
        }
        
        try {
            // Create peer connection
            const peerConnection = createPeerConnection(userId, remoteUserName);
            
            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log('Created and set local description offer for', userId);
            
            socket.emit('offer', {
                offer,
                to: userId,
                from: socketId, // Make sure we include our ID
                userName: userName
            });
        } catch (error) {
            console.error('Error creating offer:', error);
            console.log(`Error connecting with new peer ${remoteUserName || userId}: ${error.message}`);
            
            // Remove the peer connection if it was created
            if (peers[userId]) {
                peers[userId].close();
                delete peers[userId];
            }
        }
    }
    
    // Handle a user leaving
    function handleUserLeft(data) {
        const { userId } = data;
        console.log('User left:', userId);
        
        // Close and remove peer connection
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
        }
        
        // Remove video element
        removeVideoElement(userId);
    }
      // Handle list of users in global room
    function handleGlobalUsers(data) {
        const { users } = data;
        logConnectionDebug(`Processing global users: ${JSON.stringify(users)}`);
        
        // Clear any previous status
        const roomStatus = document.getElementById('connectionStatus');
        if (roomStatus) {
            // Remove any previous user count display
            const existingCount = roomStatus.querySelector('.user-count');
            if (existingCount) existingCount.remove();
            
            // Add updated user count
            roomStatus.innerHTML += `<div class="text-xs text-gray-400 mt-1 user-count">Users in room: ${users ? users.length : 0}</div>`;
        }
        
        // Connect to all existing users
        if (users && users.length) {
            users.forEach(user => {
                // Debug what we received
                console.log("User from global users:", user);
                
                // Make sure we're dealing with both object format and string format
                const userId = typeof user === 'object' ? (user.userId || user.id) : user;
                const userNameValue = typeof user === 'object' ? (user.userName || user.username || 'Unknown User') : 'Unknown User';
                
                // Skip if this is our own ID or the user ID is invalid
                if (!userId || userId === socketId) {
                    return;
                }
                
                logConnectionDebug(`Processing user: ${userId} (${userNameValue})`);
                
                if (!peers[userId]) {
                    logConnectionDebug(`Creating new peer connection for ${userId}`);
                    handleUserJoined({ 
                        userId: userId, 
                        userName: userNameValue
                    });
                }
            });
        } else {
            logConnectionDebug('No other users in the room');
        }
    }
    
    // Handle errors
    function handleError(data) {
        const { message } = data;
        alert(`Error: ${message}`);
    }
    
    // Toggle video
    function toggleVideo() {
        isVideoEnabled = !isVideoEnabled;
        
        localStream.getVideoTracks().forEach(track => {
            track.enabled = isVideoEnabled;
        });
        
        toggleVideoBtn.className = isVideoEnabled ? 'control-btn active' : 'control-btn inactive';
    }
    
    // Toggle audio
    function toggleAudio() {
        isAudioEnabled = !isAudioEnabled;
        
        localStream.getAudioTracks().forEach(track => {
            track.enabled = isAudioEnabled;
        });
        
        toggleAudioBtn.className = isAudioEnabled ? 'control-btn active' : 'control-btn inactive';
    }
    
    // Toggle screen sharing
    async function toggleScreenSharing() {
        if (isScreenSharing) {
            // Stop screen sharing
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;
            }
            
            // Replace screen track with camera track
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    for (const peerId in peers) {
                        const sender = peers[peerId].getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack);
                        }
                    }
                    localVideo.srcObject = localStream;
                }
            }
            
            toggleScreenBtn.className = 'control-btn inactive';
        } else {
            try {
                // Get screen stream
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });
                
                // Replace camera track with screen track
                const screenTrack = screenStream.getVideoTracks()[0];
                
                if (screenTrack) {
                    for (const peerId in peers) {
                        const sender = peers[peerId].getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(screenTrack);
                        }
                    }
                    
                    // Display screen in local video
                    const newStream = new MediaStream([screenTrack]);
                    localVideo.srcObject = newStream;
                    
                    // Handle screen sharing stop event
                    screenTrack.onended = () => {
                        toggleScreenSharing();
                    };
                }
                
                toggleScreenBtn.className = 'control-btn active';
            } catch (error) {
                console.error('Error sharing screen:', error);
                alert('Could not share screen. Please try again.');
                return;
            }
        }
        
        isScreenSharing = !isScreenSharing;
    }
      // Leave global chat
    function leaveGlobalChat() {
        // Close all peer connections
        for (const peerId in peers) {
            peers[peerId].close();
        }
        
        // Clear peers
        Object.keys(peers).forEach(key => delete peers[key]);
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Stop screen stream
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        
        // Clear video grid
        videoGrid.innerHTML = '';
        participantsList.innerHTML = '';
        
        // Leave room
        if (socket) {
            socket.emit('leave-global-room', { roomId: GLOBAL_ROOM });
            socket.disconnect();
        }
        
        // Reset UI
        isVideoEnabled = true;
        isAudioEnabled = true;
        isScreenSharing = false;
        toggleVideoBtn.className = 'control-btn active';
        toggleAudioBtn.className = 'control-btn active';
        toggleScreenBtn.className = 'control-btn inactive';
        
        // Show permission request again
        permissionRequest.style.display = 'flex';
        permissionStatus.textContent = 'Waiting for permission...';
        permissionStatus.classList.remove('text-red-500');
        
        // Request permissions again
        requestMediaPermissions();
    }
      // Automatically connect to chat and handle reconnection
    function autoConnectAndMonitor() {
        // Try to ensure camera/mic access before connecting
        if (!localStream) {
            logConnectionDebug('Local stream not initialized, attempting to initialize again');
            initLocalStream().then(success => {
                if (success) {
                    connectToSignalingServer();
                } else {
                    permissionRequest.style.display = 'flex';
                    permissionStatus.textContent = 'Could not access camera or microphone. Please check device permissions.';
                    permissionStatus.classList.add('text-red-500');
                }
            });
        } else {
            connectToSignalingServer();
        }
        
        // Periodically check connection status and reconnect if needed
        const connectionMonitor = setInterval(() => {
            if (socket) {
                // Log current connection state
                const connectionState = socket.connected ? 'connected' : 'disconnected';
                console.log(`Connection monitor check: ${connectionState}`);
                
                if (!socket.connected) {
                    logConnectionDebug('Socket disconnected, attempting to reconnect...');
                    addLogEntry('Connection monitor detected disconnect. Reconnecting...', 'info');
                    
                    // Update UI to show reconnection attempt
                    updateConnectionStatus('connecting');
                    
                    // Force new connection
                    socket.connect();
                }
            } else {
                // Socket object doesn't exist, create a new connection
                addLogEntry('Socket object not found. Creating new connection...', 'info');
                connectToSignalingServer();
            }
            
            // Check peer connections, but don't try to force play videos
            // as this can cause the abort errors
            for (const peerId in peers) {
                const peerConnection = peers[peerId];
                
                // Only check connection state, not video playback
                if (peerConnection.connectionState === 'failed' || 
                    peerConnection.connectionState === 'disconnected') {
                    
                    addLogEntry(`Connection failed for ${peerId}, attempting reconnection`, 'info');
                    
                    // Clean up and reconnect
                    peerConnection.close();
                    delete peers[peerId];
                    
                    const peerName = document.querySelector(`#container-${peerId} .username`)?.textContent || peerId;
                    setTimeout(() => {
                        handleUserJoined({
                            userId: peerId,
                            userName: peerName
                        });
                    }, 1000);
                }
            }
        }, 10000);
        
        // Periodically refresh the global users list to ensure we have everyone
        setInterval(() => {
            if (socket && socket.connected) {
                console.log("Periodic refresh of global users list...");
                socket.emit('get-global-users', { 
                    roomId: GLOBAL_ROOM 
                });
            }
        }, 15000);
        
        // Return the interval ID in case we need to clear it
        return connectionMonitor;
    }
      // Initialize with verification of browser WebRTC support
    async function init() {
        if (!navigator.mediaDevices || !window.RTCPeerConnection) {
            alert('Your browser does not support WebRTC. Please use the latest version of Chrome, Firefox, Safari, or Edge.');
            return;
        }
        
        logConnectionDebug('Initializing WebRTC application');
        
        // Show socket logs by default to help with debugging
        logsVisible = true;
        socketLogs.classList.add('visible');
        toggleLogs.textContent = 'Hide Socket Logs';
        
        // Show permission dialog
        permissionRequest.style.display = 'flex';
        
        // Setup retry button
        retryPermissionBtn.addEventListener('click', () => {
            permissionStatus.textContent = 'Requesting permission again...';
            requestMediaPermissions();
        });
        
        // Request permissions
        await requestMediaPermissions();
        
        // Event listeners
        toggleVideoBtn.addEventListener('click', toggleVideo);
        toggleAudioBtn.addEventListener('click', toggleAudio);
        toggleScreenBtn.addEventListener('click', toggleScreenSharing);
        hangupBtn.addEventListener('click', leaveGlobalChat);
    }
    
    // Request media permissions with better error handling
    async function requestMediaPermissions() {
        try {
            permissionStatus.textContent = 'Requesting camera and microphone access...';
            
            // Initialize media stream
            const streamInitialized = await initLocalStream();
            if (!streamInitialized) {
                permissionStatus.textContent = 'Permission denied. Please check your browser settings and try again.';
                permissionStatus.classList.add('text-red-500');
                return;
            }
            
            // Hide permission modal
            permissionRequest.style.display = 'none';
            
            // Auto-connect to server
            connectToSignalingServer();
            
            // Force refresh participants after 3 seconds to ensure we have everyone
            setTimeout(() => {
                console.log("Forcing refresh of participants list...");
                socket.emit('get-global-users', { 
                    roomId: GLOBAL_ROOM 
                });
            }, 3000);
            
        } catch (error) {
            console.error('Error during permission request:', error);
            permissionStatus.textContent = 'Error: ' + error.message;
            permissionStatus.classList.add('text-red-500');
        }
    }
    
    // Start the application
    init();
    
    // Set up periodic monitoring
    autoConnectAndMonitor();
});
</script>

<?php 
// Get the content and clean the buffer
$content = ob_get_clean(); 

// Include the main layout with our content
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
