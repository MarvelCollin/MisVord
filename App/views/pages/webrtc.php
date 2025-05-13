<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebRTC Communication</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Socket.IO client library -->
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .video-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
        }
        .video-box {
            position: relative;
            background-color: #000;
            border-radius: 8px;
            overflow: hidden;
        }
        #localVideo {
            width: 350px;
            height: 262px;
            background-color: #222;
        }
        #remoteVideo {
            width: 700px;
            height: 525px;
            background-color: #222;
        }
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        button {
            padding: 10px 15px;
            background-color: #0078d4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #005a9e;
        }
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        button.active {
            background-color: #e74c3c;
        }
        .connection-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        #roomInfo {
            font-weight: bold;
            color: #0078d4;
        }
        #statusMessage {
            margin-top: 10px;
            padding: 8px;
            background-color: #e3f2fd;
            border-radius: 4px;
        }
        .video-active {
            border: 3px solid #22c55e !important;
            box-shadow: 0 0 8px #22c55e;
        }
        
        .participants-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        @media (max-width: 640px) {
            .participants-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body class="bg-gray-100 text-gray-800">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <h1 class="text-3xl font-bold mb-6 text-center"></h1>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex flex-wrap gap-4 mb-4">
                <div class="flex-1 min-w-[250px]">
                    <label for="serverUrl" class="block text-sm font-medium mb-1">Server URL:</label>
                    <input type="text" id="serverUrl" placeholder="WebSocket server URL" value="https://marvelcollin.my.id" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                </div>
            </div>
            
            <div class="flex flex-wrap gap-4">
                <button id="shareBtn" disabled class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Copy Room Link</button>
                <button id="hangupBtn" disabled class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Leave Room</button>
            </div>
            
            <div id="roomInfo" class="mt-4 text-blue-600 font-medium"></div>
            <div id="statusMessage" class="mt-2 p-2 bg-blue-50 rounded-md"></div>
            
            <!-- Debug Console -->
            <div class="mt-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium">Debug Console</h3>
                    <button id="clearDebugBtn" class="text-sm text-gray-500 hover:text-gray-700">Clear</button>
                </div>
                <div id="debugConsole" class="mt-2 p-3 bg-gray-800 text-green-400 font-mono text-sm rounded h-40 overflow-y-auto"></div>
            </div>
        </div>
        
        <div class="mb-6">
            <h2 class="text-xl font-semibold mb-4">Your Video</h2>
            <div class="relative bg-black rounded-lg overflow-hidden w-full max-w-md mx-auto aspect-video">
                <video id="localVideo" autoplay muted playsinline class="w-full h-full object-cover"></video>
                <div class="absolute bottom-2 right-2 flex gap-2">
                    <button id="toggleAudioBtn" class="bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700/70">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                    <button id="toggleVideoBtn" class="bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700/70">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button id="screenShareBtn" class="bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700/70">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <div>
            <h2 class="text-xl font-semibold mb-4">Participants</h2>
            <div id="participantsGrid" class="participants-grid"></div>
        </div>
    </div>

    <script>
        // WebRTC configuration
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.stunprotocol.org:3478' },
                { 
                    urls: 'turn:numb.viagenie.ca',
                    username: 'webrtc@live.com',
                    credential: 'muazkh'
                }
            ],
            iceCandidatePoolSize: 10
        };

        // Socket.IO connection
        let socket;
        let localStream;
        let screenStream;
        let isScreenSharing = false;
        
        // Store multiple peer connections
        const peerConnections = {};
        // Store participant data
        const participants = {};
        let roomId;
        
        // DOM elements
        const localVideo = document.getElementById('localVideo');
        const participantsGrid = document.getElementById('participantsGrid');
        const shareBtn = document.getElementById('shareBtn');
        const serverUrlInput = document.getElementById('serverUrl');
        const roomInfoDiv = document.getElementById('roomInfo');
        const statusMessageDiv = document.getElementById('statusMessage');
        const toggleAudioBtn = document.getElementById('toggleAudioBtn');
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');
        const screenShareBtn = document.getElementById('screenShareBtn');
        const hangupBtn = document.getElementById('hangupBtn');
        
        // Global room ID
        const GLOBAL_ROOM_ID = 'global-room';

        // Helper function to handle leaving a WebRTC room
        function leaveWebRTCRoom(socketId, roomId) {
            console.log(`User ${socketId} leaving WebRTC room: ${roomId}`);
            
            // Notify others in the room
            io.to(`webrtc_${roomId}`).emit('user_disconnected', { userId: socketId });
            
            // Remove from participants array
            if (webrtcRooms[roomId]) {
                webrtcRooms[roomId].participants = webrtcRooms[roomId].participants.filter(id => id !== socketId);
                
                // Delete room if empty
                if (webrtcRooms[roomId].participants.length === 0) {
                    delete webrtcRooms[roomId];
                    console.log(`Deleted empty WebRTC room: ${roomId}`);
                }
            }
        }
        
        // Debug console functions
        const debugConsole = document.getElementById('debugConsole');
        const clearDebugBtn = document.getElementById('clearDebugBtn');
        
        function logDebug(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logItem = document.createElement('div');
            
            // Set color based on message type
            let color = 'text-green-400'; // info
            if (type === 'error') color = 'text-red-400';
            if (type === 'warning') color = 'text-yellow-400';
            if (type === 'success') color = 'text-cyan-400';
            
            logItem.className = color;
            logItem.textContent = `[${timestamp}] ${message}`;
            debugConsole.appendChild(logItem);
            
            // Auto-scroll to bottom
            debugConsole.scrollTop = debugConsole.scrollHeight;
            
            // Also log to browser console
            console.log(`[WebRTC Debug] ${message}`);
        }
        
        clearDebugBtn.addEventListener('click', () => {
            debugConsole.innerHTML = '';
        });
        
        // Enhance connect function with debugging
        function connectSocketIO() {
            const customServerUrl = serverUrlInput.value.trim();
            let serverUrl = customServerUrl || `${window.location.protocol}//${window.location.hostname}:3000`;
            
            logDebug(`Connecting to server: ${serverUrl}`);
            updateStatus('Connecting to signaling server at ' + serverUrl + '...');
            
            // Get the current page protocol
            const pageProtocol = window.location.protocol;
            
            // Match WebSocket protocol with page protocol
            if (pageProtocol === 'https:' && serverUrl.startsWith('http:')) {
                logDebug('Warning: Page loaded over HTTPS but WebSocket uses HTTP. This may cause connection issues.', 'warning');
                updateStatus('Warning: Page loaded over HTTPS but WebSocket uses HTTP. This may cause connection issues due to mixed content security policies.');
            }
            
            let connected = false;
            
            try {
                // Set connection options with a timeout
                const socket1 = io(serverUrl, {
                    reconnectionAttempts: 2,
                    timeout: 5000
                });
                
                socket = socket1;
                
                socket.on('connect', () => {
                    connected = true;
                    logDebug('Socket connected successfully! ✅', 'success');
                    logDebug(`Socket ID: ${socket.id}`);
                    updateStatus('Connected to signaling server');
                    enableConnectionControls(true);
                });
                
                socket.on('connect_error', (error) => {
                    logDebug(`Connection error: ${error.message}`, 'error');
                    console.error('Connection error:', error);
                    // If this is an IPv6 address and it fails, try the IPv4 fallback
                    if (!connected) {
                        logDebug('Connection failed, trying fallback...', 'warning');
                        updateStatus('Connection failed, trying fallback...');
                        // Try the IPv4 fallback with HTTP
                        const fallbackUrl = 'http://82.25.105.60:3000';
                        socket.close();
                        socket = io(fallbackUrl);
                        
                        // Set event handlers for the new socket
                        setupSocketEvents(socket);
                    }
                });
                
                // Setup all event handlers
                setupSocketEvents(socket);
                
            } catch (error) {
                logDebug(`Error creating socket: ${error.message}`, 'error');
                updateStatus('Error creating socket: ' + error.message);
            }
        }
        
        // Enhance socket events with debugging
        function setupSocketEvents(socket) {
            socket.on('connect', () => {
                logDebug('Connected to signaling server', 'success');
                updateStatus('Connected to signaling server');
                enableConnectionControls(true);
                
                // Auto-join global room on connect
                autoJoinGlobalRoom();
            });
            
            socket.on('room_created', (data) => {
                roomId = data.roomId;
                logDebug(`Room created: ${roomId}`, 'success');
                roomInfoDiv.textContent = `Room created: ${roomId}`;
                updateStatus('Room created. Waiting for participants to join...');
                shareBtn.disabled = false;
                hangupBtn.disabled = false;
            });
            
            socket.on('room_joined', async (data) => {
                roomId = data.roomId;
                logDebug(`Joined room: ${roomId}`, 'success');
                roomInfoDiv.textContent = `Joined room: ${roomId}`;
                updateStatus('Joined room successfully. Connecting to other participants...');
                shareBtn.disabled = false;
                hangupBtn.disabled = false;
            });
            
            socket.on('user_joined', async (data) => {
                const peerId = data.userId;
                logDebug(`New participant joined: ${peerId}`, 'info');
                updateStatus(`New participant joined: ${peerId.substring(0, 8)}...`);
                
                // Create a new peer connection for this user
                await createPeerConnection(peerId);
                
                // Create and send offer
                const offer = await peerConnections[peerId].createOffer();
                await peerConnections[peerId].setLocalDescription(offer);
                
                socket.emit('offer', {
                    type: 'offer',
                    offer: peerConnections[peerId].localDescription,
                    roomId: roomId,
                    to: peerId,
                    from: socket.id
                });
            });
            
            socket.on('offer', async (data) => {
                const peerId = data.from;
                
                logDebug(`Received connection offer from: ${peerId}`, 'info');
                updateStatus(`Received connection offer from: ${peerId.substring(0, 8)}...`);
                
                // Create peer connection if it doesn't exist
                if (!peerConnections[peerId]) {
                    await createPeerConnection(peerId);
                }
                
                // Set remote description from the offer
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
                
                // Create and send answer
                const answer = await peerConnections[peerId].createAnswer();
                await peerConnections[peerId].setLocalDescription(answer);
                
                socket.emit('answer', {
                    type: 'answer',
                    answer: peerConnections[peerId].localDescription,
                    roomId: roomId,
                    to: peerId,
                    from: socket.id
                });
            });
            
            socket.on('answer', async (data) => {
                const peerId = data.from;
                logDebug(`Received connection answer from: ${peerId}`, 'info');
                updateStatus(`Received connection answer from: ${peerId.substring(0, 8)}...`);
                
                if (peerConnections[peerId]) {
                    await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.answer));
                }
            });
            
            socket.on('ice_candidate', async (data) => {
                const peerId = data.from;
                
                if (peerConnections[peerId] && data.candidate) {
                    logDebug(`Received ICE candidate from: ${peerId}`, 'info');
                    await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });
            
            socket.on('user_disconnected', (data) => {
                const peerId = data.userId;
                logDebug(`Participant disconnected: ${peerId}`, 'warning');
                updateStatus(`Participant disconnected: ${peerId.substring(0, 8)}...`);
                
                // Close and remove the peer connection
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
                
                // Remove the video element
                removeParticipantVideo(peerId);
                
                // Remove from participants list
                if (participants[peerId]) {
                    delete participants[peerId];
                }
            });
            
            socket.on('error', (data) => {
                logDebug(`Error: ${data.message}`, 'error');
                updateStatus('Error: ' + data.message);
            });
            
            socket.on('disconnect', () => {
                logDebug('Disconnected from signaling server', 'error');
                updateStatus('Disconnected from signaling server');
                enableConnectionControls(false);
            });
        }

        // Create peer connection
        async function createPeerConnection(peerId) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
            }
            
            peerConnections[peerId] = new RTCPeerConnection(configuration);
            
            // Add local stream tracks to peer connection
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peerConnections[peerId].addTrack(track, localStream);
                });
            }
            
            // Handle ICE candidates
            peerConnections[peerId].onicecandidate = (event) => {
                if (event.candidate) {
                    logDebug(`Generated ICE candidate for peer ${peerId.substring(0, 8)}`, 'info');
                    socket.emit('ice_candidate', {
                        type: 'ice_candidate',
                        candidate: event.candidate,
                        roomId: roomId,
                        to: peerId,
                        from: socket.id
                    });
                }
            };
            
            // Handle ICE connection state changes
            peerConnections[peerId].oniceconnectionstatechange = () => {
                const state = peerConnections[peerId].iceConnectionState;
                logDebug(`ICE connection state for peer ${peerId.substring(0, 8)}: ${state}`, 
                    state === 'connected' || state === 'completed' ? 'success' : 
                    state === 'failed' || state === 'disconnected' ? 'error' : 'info'
                );
                
                if (state === 'failed') {
                    logDebug('Connection failed. Try restarting ICE...', 'warning');
                    peerConnections[peerId].restartIce();
                }
            };
            
            // Handle connection state changes
            peerConnections[peerId].onconnectionstatechange = () => {
                const state = peerConnections[peerId].connectionState;
                logDebug(`Connection state for peer ${peerId.substring(0, 8)}: ${state}`,
                    state === 'connected' ? 'success' : 
                    state === 'failed' || state === 'disconnected' || state === 'closed' ? 'error' : 'info'
                );
                
                updateStatus('Connection state for peer ' + peerId.substring(0, 8) + ': ' + state);
                if (state === 'connected') {
                    hangupBtn.disabled = false;
                } else if (['disconnected', 'failed', 'closed'].includes(state)) {
                    // Maybe don't disable hangup if there are other connections
                    if (Object.keys(peerConnections).length <= 1) {
                        hangupBtn.disabled = true;
                    }
                }
            };
            
            // Handle remote stream
            peerConnections[peerId].ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    logDebug(`Received media track from peer ${peerId.substring(0, 8)}`, 'success');
                    // Create or update participant video
                    addParticipantVideo(peerId, event.streams[0]);
                    
                    // Store participant
                    participants[peerId] = {
                        stream: event.streams[0],
                        audioLevel: 0
                    };
                    
                    // Setup audio level detection
                    setupAudioLevelDetection(peerId, event.streams[0]);
                }
            };
            
            updateStatus('Peer connection initialized for: ' + peerId.substring(0, 8));
            logDebug(`Peer connection initialized for: ${peerId.substring(0, 8)}`, 'info');
        }

        // Get user media (camera and microphone)
        async function getUserMedia() {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                
                localVideo.srcObject = localStream;
                updateStatus('Camera and microphone accessed');
                
                // Setup audio visualization for local stream
                setupLocalAudioVisualization();
                
                return true;
                
            } catch (error) {
                updateStatus('Error accessing media devices: ' + error.message);
                return false;
            }
        }

        // Share screen
        async function startScreenShare() {
            if (isScreenSharing) {
                return;
            }
            
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                // Replace video track with screen share track
                const videoTrack = screenStream.getVideoTracks()[0];
                
                // Replace track in all peer connections
                for (const peerId in peerConnections) {
                    // Find the video sender in the peer connection
                    const videoSender = peerConnections[peerId].getSenders().find(sender => 
                        sender.track?.kind === 'video'
                    );
                    
                    if (videoSender) {
                        videoSender.replaceTrack(videoTrack);
                    }
                }
                
                // Show screen share in local video
                const oldStream = localVideo.srcObject;
                localVideo.srcObject = screenStream;
                
                // Handle screen share ending
                videoTrack.onended = () => {
                    stopScreenShare(oldStream);
                };
                
                isScreenSharing = true;
                screenShareBtn.textContent = 'Stop Sharing';
                screenShareBtn.classList.add('active');
                updateStatus('Screen sharing started');
                
            } catch (error) {
                updateStatus('Error sharing screen: ' + error.message);
            }
        }

        // Stop screen sharing
        function stopScreenShare(oldStream) {
            if (!isScreenSharing) {
                return;
            }
            
            // Restore camera video track
            const videoTrack = oldStream.getVideoTracks()[0];
            
            // Replace track in all peer connections
            for (const peerId in peerConnections) {
                // Find the video sender in the peer connection
                const videoSender = peerConnections[peerId].getSenders().find(sender => 
                    sender.track?.kind === 'video'
                );
                
                if (videoSender && videoTrack) {
                    videoSender.replaceTrack(videoTrack);
                }
            }
            
            // Stop all screen share tracks
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            
            // Restore local video
            localVideo.srcObject = oldStream;
            
            isScreenSharing = false;
            screenShareBtn.textContent = 'Share Screen';
            screenShareBtn.classList.remove('active');
            updateStatus('Screen sharing stopped');
        }

        // Toggle audio mute
        function toggleAudio() {
            if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = !audioTrack.enabled;
                    toggleAudioBtn.textContent = audioTrack.enabled ? 'Mute Audio' : 'Unmute Audio';
                    toggleAudioBtn.classList.toggle('active', !audioTrack.enabled);
                    updateStatus(audioTrack.enabled ? 'Audio unmuted' : 'Audio muted');
                }
            }
        }

        // Toggle video
        function toggleVideo() {
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.enabled = !videoTrack.enabled;
                    toggleVideoBtn.textContent = videoTrack.enabled ? 'Turn Off Video' : 'Turn On Video';
                    toggleVideoBtn.classList.toggle('active', !videoTrack.enabled);
                    updateStatus(videoTrack.enabled ? 'Video turned on' : 'Video turned off');
                }
            }
        }

        // Hangup call
        function hangup() {
            // Close all peer connections
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                }
            }
            
            // Clear peer connections object
            for (const key in peerConnections) {
                delete peerConnections[key];
            }
            
            // Clear participants grid
            participantsGrid.innerHTML = '';
            
            // Clear participants object
            for (const key in participants) {
                // Close any audio contexts
                if (participants[key].audioContext) {
                    participants[key].audioContext.close();
                }
                delete participants[key];
            }
            
            if (isScreenSharing && screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                isScreenSharing = false;
            }
            
            if (socket && roomId) {
                socket.emit('disconnect_room', { roomId });
            }
            
            roomId = null;
            roomInfoDiv.textContent = '';
            shareBtn.disabled = true;
            hangupBtn.disabled = true;
            screenShareBtn.textContent = 'Share Screen';
            screenShareBtn.classList.remove('active');
            
            updateStatus('Left room');
        }

        // Update status message
        function updateStatus(message) {
            statusMessageDiv.textContent = message;
            console.log(message);
        }

        // Enable/disable connection controls
        function enableConnectionControls(enabled) {
            shareBtn.disabled = !enabled;
            hangupBtn.disabled = !enabled;
        }

        // Event listeners
        shareBtn.addEventListener('click', shareRoomLink);
        
        hangupBtn.addEventListener('click', hangup);

        // Initialize on page load
        window.addEventListener('load', () => {
            connectSocketIO();
            // Auto-join will happen after connection
        });

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            if (roomId) {
                socket.emit('disconnect_room', { roomId });
            }
            
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            
            for (const peerId in peerConnections) {
                peerConnections[peerId].close();
            }
            
            if (socket) {
                socket.disconnect();
            }
        });

        // Share room link
        function shareRoomLink() {
            if (!roomId) return;
            
            // Create a shareable link with room ID as URL parameter
            const url = new URL(window.location.href);
            url.searchParams.set('room', roomId);
            
            // Copy to clipboard
            navigator.clipboard.writeText(url.toString())
                .then(() => {
                    updateStatus('Room link copied to clipboard!');
                })
                .catch(err => {
                    updateStatus('Failed to copy: ' + err);
                    // Fallback - show the URL for manual copy
                    alert('Copy this link to share the room: ' + url.toString());
                });
        }
        
        // Check URL for room parameter
        function checkUrlForRoom() {
            const urlParams = new URLSearchParams(window.location.search);
            const roomParam = urlParams.get('room');
            
            if (roomParam) {
                // We use the room ID directly in autoJoinGlobalRoom
                updateStatus('Room ID detected in URL: ' + roomParam);
                return roomParam;
            }
            return null;
        }

        // Create and add participant video element
        function addParticipantVideo(peerId, stream) {
            // Check if this participant's video already exists
            let participantDiv = document.getElementById(`participant-${peerId}`);
            
            if (!participantDiv) {
                // Create new participant div
                participantDiv = document.createElement('div');
                participantDiv.id = `participant-${peerId}`;
                participantDiv.className = 'relative bg-black rounded-lg overflow-hidden aspect-video';
                
                // Create video element
                const video = document.createElement('video');
                video.id = `video-${peerId}`;
                video.autoplay = true;
                video.playsInline = true;
                video.className = 'w-full h-full object-cover';
                
                // Create participant label
                const label = document.createElement('div');
                label.className = 'absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm';
                label.textContent = `Participant ${peerId.substring(0, 8)}`;
                
                // Add everything to the participant div
                participantDiv.appendChild(video);
                participantDiv.appendChild(label);
                
                // Add to the grid
                participantsGrid.appendChild(participantDiv);
            }
            
            // Set/update the stream
            const video = document.getElementById(`video-${peerId}`);
            if (video) {
                video.srcObject = stream;
            }
        }
        
        // Remove participant video
        function removeParticipantVideo(peerId) {
            const participantDiv = document.getElementById(`participant-${peerId}`);
            if (participantDiv) {
                participantsGrid.removeChild(participantDiv);
            }
        }
        
        // Setup audio level detection for speaking visualization
        function setupAudioLevelDetection(peerId, stream) {
            if (!stream) return;
            
            const audioTracks = stream.getAudioTracks();
            if (!audioTracks.length) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
            
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;
            
            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);
            
            javascriptNode.onaudioprocess = function() {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;
                
                for (let i = 0; i < array.length; i++) {
                    values += array[i];
                }
                
                const average = values / array.length;
                
                // Store audio level
                if (participants[peerId]) {
                    participants[peerId].audioLevel = average;
                }
                
                // Apply visual indicator for speaking
                const participantDiv = document.getElementById(`participant-${peerId}`);
                if (participantDiv) {
                    // Use a threshold to determine if speaking
                    if (average > 20) {
                        participantDiv.classList.add('video-active');
                    } else {
                        participantDiv.classList.remove('video-active');
                    }
                }
            };
            
            if (participants[peerId]) {
                participants[peerId].audioContext = audioContext;
                participants[peerId].javascriptNode = javascriptNode;
            }
        }
        
        // Setup local audio visualization
        function setupLocalAudioVisualization() {
            if (!localStream) return;
            
            const audioTracks = localStream.getAudioTracks();
            if (!audioTracks.length) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(localStream);
            const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
            
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;
            
            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);
            
            javascriptNode.onaudioprocess = function() {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;
                
                for (let i = 0; i < array.length; i++) {
                    values += array[i];
                }
                
                const average = values / array.length;
                
                // Apply visual indicator for speaking
                const localVideoContainer = localVideo.parentElement;
                if (localVideoContainer) {
                    // Use a threshold to determine if speaking
                    if (average > 20) {
                        localVideoContainer.classList.add('video-active');
                    } else {
                        localVideoContainer.classList.remove('video-active');
                    }
                }
            };
        }

        // Auto join the global room on connection
        async function autoJoinGlobalRoom() {
            const mediaReady = await getUserMedia();
            if (mediaReady && socket && socket.connected) {
                // Check for room ID in URL
                const urlParams = new URLSearchParams(window.location.search);
                const roomParam = urlParams.get('room');
                
                // Use room ID from URL or default global room
                roomId = roomParam || GLOBAL_ROOM_ID;
                
                updateStatus(`Automatically joining room: ${roomId}`);
                
                // Try joining first, if it fails, create the room
                socket.emit('join_room', {
                    roomId: roomId
                });
                
                // In case of error, we'll need to create the room
                socket.once('error', (data) => {
                    if (data.message === 'Room not found') {
                        updateStatus(`Room not found, creating new room: ${roomId}`);
                        socket.emit('create_room', { 
                            roomId: roomId 
                        });
                    }
                });
            } else if (!socket || !socket.connected) {
                updateStatus('Waiting for server connection before joining room...');
            }
        }
    </script>
</body>
</html>
