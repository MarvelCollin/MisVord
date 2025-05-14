// --- WebRTC/ICE/Socket.IO Best Practice Implementation ---
// 1. Add adapter.js for cross-browser support (add to your HTML):
// <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
//
// 2. Use secure Socket.IO connection to your production signaling server:
const socket = io('https://marvelcollin.my.id', {
  path: '/socket.io/',
  transports: ['websocket'],
  secure: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000
});
//
// 3. ICE server config: Use Google STUN and a placeholder for your own TURN server for production.
//    For testing, you can uncomment openrelay.metered.ca, but do NOT use it in production.
// --- End of Best Practice Implementation ---

// WebRTC video chat functionality
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
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    // Global variables - MOVED TO TOP
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
    
    // Control buttons
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    const pingBtn = document.getElementById('pingBtn');
    const hangupBtn = document.getElementById('hangupBtn');
    
    // Enable debugging
    let debugMode = true; // Enable detailed debugging
    
    // Run compatibility check immediately
    console.log('Running browser compatibility check...');
    // Use the WebRTCCompat module
    const browserCompat = window.WebRTCCompat.check();
    console.log('Browser compatibility check:', browserCompat);
    
    // Test connectivity to marvelcollin.my.id
    testServerConnectivity();
    
    // Function to test connectivity to marvelcollin.my.id
    function testServerConnectivity() {
        // Skip direct fetch test which would be blocked by CORS
        addLogEntry('Testing connectivity to marvelcollin.my.id...', 'info');
        
        // Connect directly to marvelcollin.my.id
        connectToSignalingServer();
    }
    
    // Add direct event listener for retry permission button to fix clicking issue
    retryPermissionBtn.addEventListener('click', () => {
        console.log("Retry permission button clicked");
        permissionStatus.textContent = 'Requesting permission again...';
        
        // Force requesting media permissions again
        initLocalStream().then(success => {
            if (success) {
                permissionRequest.style.display = 'none';
                connectToSignalingServer();
            } else {
                permissionStatus.textContent = 'Permission denied. Please check your browser settings and try again.';
                permissionStatus.classList.add('text-red-500');
            }
        }).catch(error => {
            console.error('Error accessing media:', error);
            permissionStatus.textContent = 'Error: ' + error.message;
            permissionStatus.classList.add('text-red-500');
        });
    });
    
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
        // Create new connection directly to marvelcollin.my.id
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
    
    // Add ping button event listener
    pingBtn.addEventListener('click', () => {
        if (socket && socket.connected) {
            console.log('Pinging all users in the room');
            socket.emit('ping-all-users', {
                roomId: GLOBAL_ROOM,
                message: `Ping from ${userName}`,
                fromUserName: userName
            });
            
            // Show a toast notification for the sender
            showToast(`You pinged all users in the room`, 'info');
        } else {
            showToast('Cannot ping - not connected to server', 'error');
        }
    });
    
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
        
        // Connect directly to marvelcollin.my.id instead of trying local server first
        const remoteUrl = 'https://marvelcollin.my.id';
        logConnectionDebug(`Attempting to connect to signaling server at ${remoteUrl}...`);
        
        addLogEntry(`Connecting to server: ${remoteUrl}`, 'info');
        console.log(`Attempting connection to: ${remoteUrl}`);
        
        // Initialize socket with a direct connection to marvelcollin.my.id
        socket = io(remoteUrl, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            transports: ['polling', 'websocket'],
            forceNew: true,
            withCredentials: false,
            path: '/socket.io/',
            query: {
                username: userName,
                room: GLOBAL_ROOM,
                timestamp: Date.now()
            }
        });
        
        // Handle connection errors
        socket.on('connect_error', (error) => {
            logConnectionDebug(`Connection error: ${error.message}`);
            updateConnectionStatus('disconnected');
            addLogEntry(`Connection error: ${error.message}`, 'error');
            
            // Show a detailed error message to the user
            const errorMsg = document.createElement('div');
            errorMsg.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-center p-4';
            errorMsg.innerHTML = `
                Connection to signaling server failed.<br>
                <span class="text-sm">Could not connect to server: ${error.message}</span><br>
                <span class="text-sm mt-2">WebRTC functionality will not work.</span>
            `;
            document.body.appendChild(errorMsg);
            
            // Add a reload button
            const reloadBtn = document.createElement('button');
            reloadBtn.className = 'ml-4 px-4 py-1 bg-white text-red-600 rounded';
            reloadBtn.textContent = 'Reload Page';
            reloadBtn.onclick = () => window.location.reload();
            errorMsg.appendChild(reloadBtn);
        });
        
        // Set up all socket event handlers
        setupSocketEventHandlers();
    }
    
    // Set up all socket event handlers - separated to avoid duplication when switching servers
    function setupSocketEventHandlers() {
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
            
            // Clear existing participants before reconnecting to avoid duplicates
            Array.from(document.querySelectorAll('.participant-item')).forEach(item => {
                participantsList.removeChild(item);
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
            addLogEntry(`🔴 DISCONNECTED from signaling server. Reason: ${reason}`, 'error');
            
            // Attempt reconnection if not intentionally disconnected
            if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
                // The server has disconnected us, we need to manually reconnect
                addLogEntry('Server forced disconnect. Attempting manual reconnection to signaling server...', 'info');
                setTimeout(() => {
                    // Create a completely new connection rather than using socket.connect()
                    socket = null;
                    connectToSignalingServer();
                }, 2000);
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
        
        // Handle ping-sent confirmation from server
        socket.on('ping-sent', (data) => {
            const { success, recipients } = data;
            if (success) {
                const message = recipients === 1 
                    ? `Ping sent to 1 participant` 
                    : `Ping sent to ${recipients} participants`;
                
                showToast(message, 'success');
            }
        });
        
        // Add ping event handler
        socket.on('user-ping', (data) => {
            const { from, userName, fromUserName, message } = data;
            
            // Skip our own pings
            if (from === socketId) return;
            
            // Log the ping
            logConnectionDebug(`Received ping from: ${fromUserName || userName || from}`);
            addLogEntry(`🔔 Ping received from: ${fromUserName || userName || from}`, 'received');
            
            // Show toast notification
            showToast(`${fromUserName || userName || from} pinged the room`, 'ping');
            
            // Create visual ping effect for the user's video
            const userContainer = document.getElementById(`container-${from}`);
            if (userContainer) {
                // Create ping animation element
                const pingEffect = document.createElement('div');
                pingEffect.className = 'absolute inset-0 bg-blue-500 bg-opacity-30 z-5 animate-pulse';
                userContainer.appendChild(pingEffect);
                
                // Remove ping effect after animation
                setTimeout(() => {
                    if (pingEffect.parentNode) {
                        pingEffect.parentNode.removeChild(pingEffect);
                    }
                }, 2000);
            }
            
            // Send acknowledgment back
            socket.emit('ping-ack', {
                to: from,
                from: socketId,
                userName: userName
            });
        });
        
        // Handle ping acknowledgment
        socket.on('ping-ack', (data) => {
            const { from, userName } = data;
            logConnectionDebug(`Ping acknowledged by: ${userName || from}`);
            addLogEntry(`✅ Ping acknowledged by: ${userName || from}`, 'received');
            
            // Highlight the user who acknowledged
            const userItem = document.getElementById(`participant-${from}`);
            if (userItem) {
                userItem.classList.add('bg-green-700');
                setTimeout(() => {
                    userItem.classList.remove('bg-green-700');
                }, 2000);
            }
        });
        
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
            
            // Just refresh the global users list when someone joins
            // Don't add the user directly here - let handleGlobalUsers manage the user list
            socket.emit('get-global-users', { 
                roomId: GLOBAL_ROOM 
            });
            
            // We don't need to call handleUserJoined directly - the global-users event will handle it
        });
        
        socket.on('user-left', (data) => {
            logConnectionDebug(`User left: ${data.userId}`);
            
            // Process user leaving immediately, before we get updated global list
            handleUserLeft(data);
            
            // Refresh global users list to ensure UI is synchronized
            socket.emit('get-global-users', { 
                roomId: GLOBAL_ROOM 
            });
        });
        
        socket.on('global-users', (data) => {
            logConnectionDebug(`Received global users list with ${data.users ? data.users.length : 0} users`);
            handleGlobalUsers(data);
        });
        
        socket.on('error', (data) => {
            logConnectionDebug(`Server error: ${data.message}`);
            addLogEntry(`Server error: ${data.message}`, 'error');
            handleError(data);
        });
    }
    
    // Initialize media stream
    async function initLocalStream() {
        try {
            console.log('Requesting media permissions...');
            
            // Request with constraints that prefer performance over quality
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 }, // Reduced from 1280 for better performance
                    height: { ideal: 480 }, // Reduced from 720 for better performance
                    frameRate: { ideal: 24 } // Reduced from 30 for better performance
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Log information about the tracks
            const videoTrack = localStream.getVideoTracks()[0];
            const audioTrack = localStream.getAudioTracks()[0];
            
            if (videoTrack) {
                console.log('Video track obtained:', videoTrack.label);
                console.log('Video track settings:', videoTrack.getSettings());
                
                // Monitor video track for ending
                videoTrack.onended = () => {
                    console.warn('Video track ended unexpectedly');
                    addLogEntry('Camera track ended. Try reloading the page.', 'error');
                };
            } else {
                console.warn('No video track obtained');
            }
            
            if (audioTrack) {
                console.log('Audio track obtained:', audioTrack.label);
            } else {
                console.warn('No audio track obtained');
            }
            
            console.log('Local stream obtained with tracks:', localStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
            addLogEntry(`Local media stream obtained with ${localStream.getTracks().length} tracks`, 'info');
            
            // Set the stream on the video element
            localVideo.srcObject = localStream;
            
            // Monitor for any changes in the local stream
            localStream.onaddtrack = (event) => {
                console.log('Track added to local stream:', event.track);
            };
            
            localStream.onremovetrack = (event) => {
                console.log('Track removed from local stream:', event.track);
            };
            
            // Use a timeout to let the video element stabilize before playing
            setTimeout(() => {
                localVideo.play()
                    .then(() => {
                        console.log('Local video playback started successfully');
                        // Update existing connections with our local stream
                        Object.keys(peers).forEach(userId => {
                            const peerConnection = peers[userId];
                            
                            // Add all tracks from local stream to peer connection
                            localStream.getTracks().forEach(track => {
                                // Check if track is already added to this connection
                                const senders = peerConnection.getSenders();
                                const trackAlreadyAdded = senders.some(sender => 
                                    sender.track && sender.track.id === track.id
                                );
                                
                                if (!trackAlreadyAdded) {
                                    console.log(`Adding ${track.kind} track to existing peer ${userId}`);
                                    peerConnection.addTrack(track, localStream);
                                }
                            });
                        });
                    })
                    .catch(e => {
                        console.error('Error playing local video:', e);
                        // Add a manual play button if autoplay fails
                        addPlayButtonToLocalVideo();
                    });
            }, 500);
            
            return true;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            addLogEntry(`Error accessing media: ${error.message}`, 'error');
            
            // More user-friendly error display
            let errorMessage = 'Could not access camera or microphone. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'You denied permission to use your camera/microphone. Please allow access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera or microphone found on your device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Your camera or microphone is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            return false;
        }
    }
    
    // Add a play button to the local video if autoplay fails
    function addPlayButtonToLocalVideo() {
        const container = document.querySelector('.local-video-container');
        if (!container) return;
        
        // Check if button already exists
        if (container.querySelector('.local-play-button')) return;
        
        const playButton = document.createElement('button');
        playButton.className = 'local-play-button absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-10';
        playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
        
        container.appendChild(playButton);
        
        playButton.addEventListener('click', () => {
            localVideo.play()
                .then(() => {
                    playButton.remove();
                })
                .catch(e => {
                    console.error('Manual play attempt failed:', e);
                    addLogEntry('Manual play attempt failed. Please reload the page.', 'error');
                });
        });
    }
    
    // Add a play button to the remote video if autoplay fails
    function addPlayButtonToRemoteVideo(userId, videoElement) {
        // Use our improved version instead
        addImprovedPlayButton(videoElement, userId);
    }
    
    // Add a participant to the list
    function addParticipantItem(userId, userName) {
        // Prevent duplicate participants by userId
        if (document.getElementById(`participant-${userId}`)) {
            // Already exists, do not add again
            return;
        }
        // Check if participant already exists by ID
        const existingItem = document.getElementById(`participant-${userId}`);
        if (existingItem) {
            // Update if already exists
            existingItem.querySelector('.participant-name').textContent = userName;
            return;
        }
        
        // Also check for duplicate usernames (excluding the (You) part)
        const cleanUserName = userName.replace(' (You)', '');
        const duplicateByName = Array.from(document.querySelectorAll('.participant-item'))
            .find(item => {
                const nameEl = item.querySelector('.participant-name');
                return nameEl && nameEl.textContent.replace(' (You)', '') === cleanUserName;
            });
        
        // If we found a duplicate by username but with a different ID
        if (duplicateByName && duplicateByName.id !== `participant-${userId}`) {
            // If the current user has (You) suffix, this is the one we want to keep
            if (userName.includes('(You)')) {
                // Remove the duplicate
                const duplicateId = duplicateByName.id.replace('participant-', '');
                console.log(`Removing duplicate participant ${duplicateId} with same username as current user`);
                removeParticipantItem(duplicateId);
            } else {
                // Otherwise, this is probably a stale entry from reconnection
                console.log(`Skipping adding duplicate participant ${userId} with name ${userName}`);
                return;
            }
        }
        
        // Create new participant item
        const item = document.createElement('div');
        item.id = `participant-${userId}`;
        item.className = 'participant-item p-2 mb-1 rounded bg-gray-700 text-white flex items-center justify-between';
        
        // Create user info section
        const userInfo = document.createElement('div');
        userInfo.className = 'flex items-center';
        
        const userIcon = document.createElement('div');
        userIcon.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
        
        const userName_elem = document.createElement('span');
        userName_elem.className = 'participant-name';
        userName_elem.textContent = userName;
        
        userInfo.appendChild(userIcon);
        userInfo.appendChild(userName_elem);
        
        // Create action buttons
        const actions = document.createElement('div');
        
        // Ping button
        const pingButton = document.createElement('button');
        pingButton.className = 'text-xs bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 text-white';
        pingButton.textContent = 'Ping';
        pingButton.onclick = () => pingUser(userId);
        
        actions.appendChild(pingButton);
        
        // Add to item
        item.appendChild(userInfo);
        item.appendChild(actions);
        
        // Add to participants list
        participantsList.appendChild(item);
        
        console.log(`Added participant: ${userName} (${userId})`);
    }
    
    // Remove a participant from the list
    function removeParticipantItem(userId) {
        const item = document.getElementById(`participant-${userId}`);
        if (item) {
            participantsList.removeChild(item);
            console.log(`Removed participant: ${userId}`);
        }
    }
    
    // Handle user joined event
    function handleUserJoined(data) {
        const { userId, userName } = data;
        console.log(`User joined: ${userName || userId}`);
        
        // Skip if it's our own connection
        if (userId === socketId) return;
        
        // Prevent duplicate participants and connections
        if (document.getElementById(`participant-${userId}`)) {
            console.log(`User ${userId} is already in the participant list, skipping duplicate join event`);
            return;
        }
        
        // Check if this user is already in our list
        const existingItem = document.getElementById(`participant-${userId}`);
        const existingPeer = peers[userId];
        const existingVideo = document.getElementById(`container-${userId}`);
        
        if (existingItem && existingPeer && existingVideo) {
            console.log(`User ${userId} is already in the participant list, skipping duplicate join event`);
            return;
        }
        
        // Add user to participants list if not already present
        if (!existingItem) {
            addParticipantItem(userId, userName || `User_${userId.substring(0, 4)}`);
        }
        
        // Create peer connection if doesn't exist
        if (!existingPeer) {
            console.log(`Creating new peer connection for joined user ${userId}`);
            const peerConnection = createPeerConnection(userId, userName);
        }
        
        // Create video container if doesn't exist
        if (!existingVideo) {
            updateRemoteVideo(userId, null, userName || `User_${userId.substring(0, 4)}`);
        }
    }
    
    // Handle user left event
    function handleUserLeft(data) {
        const { userId, userName } = data;
        console.log(`User left: ${userName || userId}`);
        // Remove from participants list
        removeParticipantItem(userId);
        // Remove video element
        const container = document.getElementById(`container-${userId}`);
        if (container) {
            videoGrid.removeChild(container);
        }
        // Close and clean up peer connection
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
            logConnectionDebug(`Cleaned up peer connection for ${userId} on leave`);
        }
    }
    
    // Handle global users list
    function handleGlobalUsers(data) {
        const { users } = data;
        console.log(`Received global users: ${users.length}`);
        
        // Track username mapping to avoid duplicates
        const usernameMap = new Map();
        
        // Add myself to username map first
        usernameMap.set(userName.replace(' (You)', ''), socketId);
        
        // Get all current participant items and IDs
        const currentParticipants = Array.from(document.querySelectorAll('.participant-item'))
            .map(el => el.id.replace('participant-', ''));
        
        // Get list of valid user IDs from the server and map usernames
        const validUserIds = [];
        
        // Process server users to detect duplicates by username
        users.forEach(user => {
            // Add to valid users
            validUserIds.push(user.userId);
            
            // Clean username for comparison
            const cleanUsername = (user.userName || '').replace(' (You)', '');
            
            // If this is a duplicate of our own username, skip it
            if (cleanUsername === userName.replace(' (You)', '') && user.userId !== socketId) {
                console.log(`Found duplicate user with our username: ${cleanUsername}, ID: ${user.userId}`);
                // Don't add to username map, so it gets removed
                return;
            }
            
            // Otherwise track this username
            usernameMap.set(cleanUsername, user.userId);
        });
        
        // Make sure myself is in valid list
        if (!validUserIds.includes(socketId)) {
            validUserIds.push(socketId);
        }
        
        console.log(`Current participants: ${currentParticipants.length}, Valid users: ${validUserIds.length}`);
        
        // Remove any participants that are not in the valid list (no longer connected)
        currentParticipants.forEach(id => {
            if (!validUserIds.includes(id)) {
                console.log(`Removing stale participant: ${id}`);
                removeParticipantItem(id);
                // Also clean up peer connection and video if they exist
                if (peers[id]) {
                    peers[id].close();
                    delete peers[id];
                    logConnectionDebug(`Cleaned up peer connection for ${id} (stale)`);
                }
                const container = document.getElementById(`container-${id}`);
                if (container) {
                    videoGrid.removeChild(container);
                }
            }
        });
        
        // Remove duplicate entries with the same username
        const userEls = document.querySelectorAll('.participant-item');
        userEls.forEach(el => {
            const id = el.id.replace('participant-', '');
            const nameEl = el.querySelector('.participant-name');
            if (nameEl) {
                // Clean username for comparison
                const displayedName = nameEl.textContent.replace(' (You)', '');
                const expectedId = usernameMap.get(displayedName);
                
                // If this item has a username that belongs to a different ID, remove it
                if (expectedId && expectedId !== id) {
                    console.log(`Removing duplicate participant with username ${displayedName}`);
                    removeParticipantItem(id);
                }
            }
        });
        
        // Make sure I'm in the participants list
        if (!document.getElementById(`participant-${socketId}`)) {
            addParticipantItem(socketId, userName + ' (You)');
        }
        
        // Process each user from the server
        users.forEach(user => {
            // Skip our own connection or duplicates with our username
            if (user.userId === socketId || 
                (user.userName && user.userName.replace(' (You)', '') === userName.replace(' (You)', ''))) {
                return;
            }
            
            // Add to participants list (addParticipantItem will update if already exists)
            addParticipantItem(user.userId, user.userName || `User_${user.userId.substring(0, 4)}`);
            
            // Create peer connection if doesn't exist
            if (!peers[user.userId]) {
                console.log(`Creating new peer connection for ${user.userId}`);
                const peerConnection = createPeerConnection(user.userId, user.userName);
                
                // Create video container
                updateRemoteVideo(user.userId, null, user.userName || `User_${user.userId.substring(0, 4)}`);
            }
        });
    }
    
    // Handle error events
    function handleError(data) {
        console.error(`Server error: ${data.message}`);
        addLogEntry(`Server error: ${data.message}`, 'error');
    }
    
    // Function to update remote video element
    function updateRemoteVideo(userId, stream, userName) {
        // Check if container already exists
        let container = document.getElementById(`container-${userId}`);
        let video;
        
        if (!container) {
            // Create video container
            container = document.createElement('div');
            container.id = `container-${userId}`;
            container.className = 'remote-video-container relative rounded overflow-hidden bg-gray-800';
            
            // Create video element with improved attributes for autoplay
            video = document.createElement('video');
            video.id = `video-${userId}`;
            video.className = 'w-full h-full object-cover';
            video.autoplay = true;
            video.playsInline = true;
            video.muted = false; // Ensure not muted by default
            video.setAttribute('playsinline', ''); // For iOS Safari
            video.setAttribute('webkit-playsinline', ''); // For older iOS
            
            // Add debug indicator for black screen
            const debugIndicator = document.createElement('div');
            debugIndicator.className = 'absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 transition-opacity duration-300';
            debugIndicator.id = `video-debug-${userId}`;
            debugIndicator.textContent = 'No video';
            
            // Create username overlay
            const usernameOverlay = document.createElement('div');
            usernameOverlay.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-sm';
            usernameOverlay.innerHTML = `<span class="username">${userName || 'Connecting...'}</span>`;
            
            // Add to container
            container.appendChild(video);
            container.appendChild(debugIndicator);
            container.appendChild(usernameOverlay);
            
            // Add connection status indicator
            const connectionStatusIndicator = document.createElement('div');
            connectionStatusIndicator.className = 'absolute top-0 left-0 p-1 z-10';
            connectionStatusIndicator.innerHTML = `
                <div class="px-2 py-1 bg-yellow-500 text-white text-xs rounded-br-md">
                    <span id="connection-status-${userId}">Connecting...</span>
                </div>
            `;
            container.appendChild(connectionStatusIndicator);
            
            // Add action buttons for troubleshooting
            const actionButtons = document.createElement('div');
            actionButtons.className = 'absolute top-0 right-0 p-1 flex gap-1 z-10';
            actionButtons.innerHTML = `
                <button class="refresh-video-btn p-1 bg-blue-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Refresh Video">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
                <button class="resubscribe-btn p-1 bg-green-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Resubscribe">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
            `;
            container.appendChild(actionButtons);
            
            // Add event listeners for action buttons
            setTimeout(() => {
                const refreshBtn = container.querySelector('.refresh-video-btn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', () => {
                        const videoEl = document.getElementById(`video-${userId}`);
                        if (videoEl) {
                            showVideoDebugOverlay(userId, "Manual refresh triggered", "info");
                            triggerVideoRefresh(videoEl, userId);
                        }
                    });
                }
                
                const resubscribeBtn = container.querySelector('.resubscribe-btn');
                if (resubscribeBtn) {
                    resubscribeBtn.addEventListener('click', () => {
                        showVideoDebugOverlay(userId, "Manual resubscribe triggered", "info");
                        // Recreate peer connection
                        if (peers[userId]) {
                            showVideoDebugOverlay(userId, "Closing existing peer connection", "info");
                            peers[userId].close();
                            delete peers[userId];
                            
                            // Create new connection
                            showVideoDebugOverlay(userId, "Creating new peer connection", "info");
                            createPeerConnection(userId, userName);
                        }
                    });
                }
            }, 100);
            
            // Add to video grid
            videoGrid.appendChild(container);
            
            // Add video event listeners for debugging
            video.addEventListener('canplay', () => {
                console.log(`Video can play for ${userId}`);
                debugIndicator.style.opacity = '0';
                
                // Update connection status
                const statusEl = document.getElementById(`connection-status-${userId}`);
                if (statusEl) {
                    statusEl.textContent = 'Connected';
                    statusEl.parentElement.classList.remove('bg-yellow-500');
                    statusEl.parentElement.classList.add('bg-green-500');
                    
                    // Hide status after 5 seconds
                    setTimeout(() => {
                        statusEl.parentElement.style.opacity = '0';
                    }, 5000);
                }
            });
            
            video.addEventListener('playing', () => {
                console.log(`Video is playing for ${userId}`);
                debugIndicator.style.opacity = '0';
                
                // Start video analyzer for black screen detection
                setupVideoAnalyzer(video, userId);
            });
            
            video.addEventListener('stalled', () => {
                console.log(`Video stalled for ${userId}`);
                debugIndicator.style.opacity = '1';
                debugIndicator.textContent = 'Stalled';
                showVideoDebugOverlay(userId, "Video playback stalled", "error");
            });
            
            video.addEventListener('error', (e) => {
                console.error(`Video error for ${userId}:`, e);
                debugIndicator.style.opacity = '1';
                debugIndicator.textContent = 'Error';
                showVideoDebugOverlay(userId, `Video error: ${e.target.error ? e.target.error.message : 'Unknown'}`, "error");
            });
        } else {
            video = document.getElementById(`video-${userId}`);
        }
        
        // Set stream if provided
        if (stream && video) {
            showVideoDebugOverlay(userId, `Setting new stream with ${stream.getTracks().length} tracks`, "info");
            
            // Log track details
            stream.getTracks().forEach(track => {
                showVideoDebugOverlay(userId, `Track: ${track.kind}, state: ${track.readyState}, enabled: ${track.enabled}`, "info");
            });
            
            video.srcObject = stream;
            
            // Use the temporary mute technique for better autoplay success
            playWithUnmuteSequence(video, userId);
        } else if (video && !video.srcObject) {
            showVideoDebugOverlay(userId, "No stream available yet", "warning");
            // Add improved play button as a placeholder
            addImprovedPlayButton(video, userId);
        }
        
        return container;
    }
    
    // Function to ping a specific user
    function pingUser(userId) {
        if (!socket || !socket.connected) {
            addLogEntry('Cannot ping - not connected to server', 'error');
            return;
        }
        
        console.log(`Pinging all users`);
        addLogEntry(`Pinging all users`, 'info');
        
        // Send ping to all users
        socket.emit('ping-all-users', {
            roomId: GLOBAL_ROOM,
            message: `Ping from ${userName}`,
            fromUserName: userName
        });
        
        // Show toast notification for the sender as well
        showToast(`You pinged all users in the room`, 'info');
    }
    
    // Toast notification system
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-message p-3 rounded shadow-lg flex items-center gap-2 transition-all transform translate-x-full opacity-0`;
        
        // Set toast type styling
        switch(type) {
            case 'info':
                toast.classList.add('bg-blue-500', 'text-white');
                break;
            case 'success':
                toast.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                toast.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500', 'text-white');
                break;
            case 'ping':
                toast.classList.add('bg-purple-500', 'text-white');
                break;
        }
        
        // Add icon based on type
        const icon = document.createElement('div');
        if (type === 'ping') {
            // Ping icon (bell)
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>`;
        } else if (type === 'error') {
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        } else {
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        }
        
        // Add message
        const messageText = document.createElement('div');
        messageText.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ml-auto text-white hover:text-gray-200';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
            toast.classList.remove('translate-x-0', 'opacity-100');
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        };
        
        // Add elements to toast
        toast.appendChild(icon);
        toast.appendChild(messageText);
        toast.appendChild(closeBtn);
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
            
            // Play notification sound for ping
            if (type === 'ping') {
                try {
                    const pingSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
                    pingSound.volume = 0.3;
                    pingSound.play().catch(() => {});
                } catch (e) {
                    // Ignore errors with audio playback
                }
            }
        }, 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('translate-x-0', 'opacity-100');
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
        
        return toast;
    }
    
    // Add CSS for toast animations to the document
    function addToastStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #toast-container {
                pointer-events: none;
            }
            .toast-message {
                pointer-events: auto;
                min-width: 250px;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    addToastStyles();
    
    // Handle offer from remote peer
    async function handleOffer(data) {
        const { from, offer, userName } = data;
        console.log(`Received offer from ${userName || from}`);
        addLogEntry(`Received offer from ${userName || from}`, 'received');
        
        // Create peer connection if it doesn't exist
        if (!peers[from]) {
            createPeerConnection(from, userName);
        }
        
        const peerConnection = peers[from];
        
        try {
            // Check connection state before processing
            if (peerConnection.signalingState === 'closed') {
                console.error(`Peer connection with ${from} is closed, cannot process offer`);
                return;
            }
            
            // Set remote description (the offer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log(`Set remote description (offer) from ${from}`);
            
            // Create answer
            const answer = await peerConnection.createAnswer();
            
            // Set local description (our answer)
            await peerConnection.setLocalDescription(answer);
            console.log(`Created and set local description (answer) for ${from}`);
            
            // Send answer to the peer who sent the offer
            socket.emit('answer', {
                answer: peerConnection.localDescription,
                to: from,
                from: socketId,
                userName: userName
            });
            
            console.log(`Sent answer to ${from}`);
            addLogEntry(`Sent answer to ${userName || from}`, 'sent');
            
        } catch (error) {
            console.error(`Error handling offer from ${from}:`, error);
            addLogEntry(`Error handling offer: ${error.message}`, 'error');
        }
    }
    
    // Handle answer from remote peer
    async function handleAnswer(data) {
        const { from, answer } = data;
        console.log(`Received answer from ${from}`);
        
        // Get peer connection
        const peerConnection = peers[from];
        
        if (!peerConnection) {
            console.error(`No peer connection for ${from}`);
            return;
        }
        
        try {
            // Only set remote answer if in the correct state
            const sessionDescription = new RTCSessionDescription(answer);
            if (peerConnection.signalingState === 'have-local-offer') {
                await peerConnection.setRemoteDescription(sessionDescription);
                console.log(`Successfully set remote description (answer) from ${from}`);
                // Log current connection state after setting remote description
                console.log(`Current signaling state after setting answer: ${peerConnection.signalingState}`);
                console.log(`Current connection state: ${peerConnection.connectionState}`);
                console.log(`Current ICE connection state: ${peerConnection.iceConnectionState}`);
                return;
            } else if (peerConnection.signalingState === 'stable') {
                console.warn(`Connection with ${from} is already in 'stable' state, ignoring duplicate answer`);
                return;
            } else {
                console.warn(`Cannot set remote answer in '${peerConnection.signalingState}' state for ${from}. Expected 'have-local-offer' state.`);
                return;
            }
        } catch (error) {
            console.error(`Error handling answer from ${from}:`, error);
            addLogEntry(`Error handling answer: ${error.message}`, 'error');
        }
    }
    
    // Handle ICE candidate from remote peer
    async function handleIceCandidate(data) {
        const { from, candidate, endOfCandidates } = data;
        
        // Get peer connection
        const peerConnection = peers[from];
        
        if (!peerConnection) {
            console.log(`No peer connection for ${from}, ignoring ICE candidate`);
            return;
        }
        
        try {
            // Handle end-of-candidates signal
            if (endOfCandidates) {
                console.log(`Received end-of-candidates signal from ${from}`);
                return;
            }
            
            if (!candidate) {
                console.log(`Null ICE candidate received from ${from}`);
                return;
            }
            
            // Add ICE candidate
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(`Added ICE candidate from ${from}`);
            
        } catch (error) {
            console.error(`Error handling ICE candidate from ${from}:`, error);
        }
    }
    
    // Update debug info in video container
    function updateDebugInfo(userId, message) {
        const debugElement = document.getElementById(`debug-${userId}`);
        if (debugElement) {
            debugElement.textContent = message;
        }
    }
    
    // Create a new WebRTC peer connection with enhanced configuration
    function createPeerConnection(userId, remoteUserName) {
        // Step 1: Clean up any existing peer connection for this user
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
            logConnectionDebug(`Cleaned up old peer connection for ${userId}`);
        }
        
        logConnectionDebug(`Creating peer connection for ${userId} (${remoteUserName})`);
        showVideoDebugOverlay(userId, "Creating new peer connection", "info");
        
        // Show debug information in video container
        const existingContainer = document.getElementById(`container-${userId}`);
        if (existingContainer) {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'absolute top-0 left-0 bg-black bg-opacity-50 text-xs text-white p-1 z-10';
            debugInfo.id = `debug-${userId}`;
            debugInfo.textContent = 'Connecting...';
            existingContainer.appendChild(debugInfo);
        }
        
        // --- PRODUCTION ICE SERVERS ---
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                    urls: [
                        'turn:marvelcollin.my.id:3478?transport=udp',
                        'turn:marvelcollin.my.id:3478?transport=tcp'
                    ],
                    username: 'kolin',
                    credential: 'kolin123'
                }
            ],
            iceCandidatePoolSize: 10,
            sdpSemantics: 'unified-plan',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all'
        });
        
        // Add SDP modification for better video compatibility
        const originalCreateOffer = peerConnection.createOffer;
        peerConnection.createOffer = async function(options) {
            const offer = await originalCreateOffer.apply(this, arguments);
            
            // Modify SDP to prioritize VP8 codec and ensure video compatibility
            if (offer.sdp) {
                let sdp = offer.sdp;
                
                // Increase bandwidth for video
                sdp = sdp.replace(/(m=video.*\r\n)/g, '$1b=AS:2000\r\n');
                
                // Ensure VP8 is first in the list of video codecs
                const videoSection = sdp.match(/(m=video.*)((?:\r\n(?=.))(?:.(?!\r\n\r\n))*)/s);
                if (videoSection) {
                    const section = videoSection[0];
                    const lines = section.split('\r\n');
                    
                    // Find VP8-related payload types
                    const vp8PayloadTypes = [];
                    const allPayloadTypes = [];
                    const rtpmapLines = [];
                    
                    // Collect all payload types and rtpmap lines
                    lines.forEach(line => {
                        if (line.startsWith('a=rtpmap:')) {
                            rtpmapLines.push(line);
                            const [, pt, codec] = line.match(/a=rtpmap:(\d+) (.*)/);
                            allPayloadTypes.push(pt);
                            if (codec.toLowerCase().includes('vp8')) {
                                vp8PayloadTypes.push(pt);
                            }
                        }
                    });
                    
                    // If we found VP8, reorder the payload types in the m= line
                    if (vp8PayloadTypes.length > 0) {
                        // Find the m=video line
                        const mLineIndex = lines.findIndex(line => line.startsWith('m=video'));
                        if (mLineIndex >= 0) {
                            const mLine = lines[mLineIndex];
                            const parts = mLine.split(' ');
                            
                            // Remove payload types from the parts array
                            const nonPayloadParts = parts.slice(0, 3); // m=video, port, protocol
                            const otherPayloadTypes = allPayloadTypes.filter(pt => !vp8PayloadTypes.includes(pt));
                            
                            // Create new m= line with VP8 first
                            const newMLine = [...nonPayloadParts, ...vp8PayloadTypes, ...otherPayloadTypes].join(' ');
                            lines[mLineIndex] = newMLine;
                            
                            // Rebuild the modified section
                            const newSection = lines.join('\r\n');
                            sdp = sdp.replace(section, newSection);
                        }
                    }
                }
                
                offer.sdp = sdp;
            }
            
            return offer;
        };
        
        // Track ICE gathering state for better debugging
        let iceCandidatesComplete = false;
        let iceCandidatesGathered = 0;
        
        // Connection timer to detect stalled connections
        peerConnection._connectionTimer = setTimeout(() => {
            if (peerConnection.iceConnectionState !== 'connected' && 
                peerConnection.iceConnectionState !== 'completed') {
                console.log(`Connection to ${userId} is taking too long, attempting ICE restart`);
                updateDebugInfo(userId, 'Connection timeout, restarting...');
                
                // Force ICE restart if supported
                if (peerConnection.restartIce) {
                    peerConnection.restartIce();
                } else if (peerConnection.onnegotiationneeded) {
                    // Trigger renegotiation
                    peerConnection._isNegotiating = false;
                    peerConnection.onnegotiationneeded();
                }
            }
        }, 15000); // 15 second timeout
        
        // Debug ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState;
            updateDebugInfo(userId, `ICE: ${state}`);
            console.log(`ICE connection state for ${userId}: ${state}`);
            
            if (state === 'connected' || state === 'completed') {
                // Clear connection timer when connected
                if (peerConnection._connectionTimer) {
                    clearTimeout(peerConnection._connectionTimer);
                    peerConnection._connectionTimer = null;
                }
                
                // Update UI to show successful connection
                if (existingContainer) {
                    existingContainer.classList.add('connected');
                }
            }
            
            // Handle ICE restart if needed
            if (state === 'failed' || state === 'disconnected') {
                console.log(`ICE connection failed for ${userId}, attempting restart...`);
                updateDebugInfo(userId, `ICE failed, restarting...`);
                
                // Clear any existing timer
                if (peerConnection._connectionTimer) {
                    clearTimeout(peerConnection._connectionTimer);
                }
                
                // Try to restart ICE connection
                if (peerConnection.restartIce) {
                    peerConnection.restartIce();
                    
                    // Set a new connection timeout
                    peerConnection._connectionTimer = setTimeout(() => {
                        // If still failed after restart timeout, recreate the connection
                        if (peerConnection.iceConnectionState === 'failed' || 
                            peerConnection.iceConnectionState === 'disconnected') {
                            updateDebugInfo(userId, 'Recreating connection...');
                            
                            // Cleanup and recreate connection
                            if (peers[userId]) {
                                peers[userId].close();
                                delete peers[userId];
                                
                                // Try reconnecting after a short delay
                                setTimeout(() => {
                                    handleUserJoined({ 
                                        userId: userId, 
                                        userName: remoteUserName 
                                    });
                                }, 1000);
                            }
                        }
                    }, 10000); // 10 second timeout after restart
                }
            }
        };
        
        // Track ICE gathering state for better debugging
        peerConnection.onicegatheringstatechange = () => {
            const state = peerConnection.iceGatheringState;
            console.log(`ICE gathering state for ${userId}: ${state}`);
            
            if (state === 'complete') {
                iceCandidatesComplete = true;
                console.log(`ICE gathering complete for ${userId}, gathered ${iceCandidatesGathered} candidates`);
                updateDebugInfo(userId, `Gathered ${iceCandidatesGathered} candidates`);
            }
        };
        
        // Debug connection state changes and implement reconnection
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            updateDebugInfo(userId, `Connection: ${state}`);
            console.log(`Connection state for ${userId}: ${state}`);
            
            if (state === 'connected') {
                // Update the username element to remove "Connecting..." text
                const usernameElement = document.querySelector(`#container-${userId} .username`);
                if (usernameElement) {
                    usernameElement.textContent = remoteUserName || userId;
                }
                
                // Hide debug info once connected to reduce visual clutter
                setTimeout(() => {
                    const debugElement = document.getElementById(`debug-${userId}`);
                    if (debugElement) {
                        debugElement.style.opacity = '0';
                        setTimeout(() => {
                            if (debugElement && debugElement.parentNode) {
                                debugElement.parentNode.removeChild(debugElement);
                            }
                        }, 1000);
                    }
                }, 3000);
            }
            
            if (state === 'failed' || state === 'disconnected') {
                console.log(`Connection to ${userId} has failed or disconnected. Attempting to reconnect...`);
                
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
            // Debounce negotiation to prevent too frequent renegotiation
            if (peerConnection._isNegotiating) return;
            peerConnection._isNegotiating = true;
            
            try {
                // Check signaling state before creating offer
                if (peerConnection.signalingState === 'stable') {
                    updateDebugInfo(userId, 'Negotiating...');
                    
                    // Create offer with proper options for better compatibility
                    const offerOptions = {
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                        iceRestart: peerConnection.iceConnectionState === 'failed'
                    };
                    
                    const offer = await peerConnection.createOffer(offerOptions);
                    
                    // For better reliability, check state again before setting local description
                    if (peerConnection.signalingState === 'stable') {
                        await peerConnection.setLocalDescription(offer);
                        
                        // Only send the offer after ICE gathering is complete or after a timeout
                        const sendOffer = () => {
                            socket.emit('offer', {
                                offer: peerConnection.localDescription,
                                to: userId,
                                from: socketId,
                                userName: userName
                            });
                        };
                        
                        // Either wait for ICE gathering to complete or timeout after 1 second
                        if (peerConnection.iceGatheringState === 'complete') {
                            sendOffer();
                        } else {
                            // Set a timeout to send the offer even if gathering isn't complete
                            const gatheringTimeout = setTimeout(() => {
                                sendOffer();
                            }, 1000);
                            
                            // But if gathering completes before timeout, send it immediately
                            const checkGatheringState = () => {
                                if (peerConnection.iceGatheringState === 'complete') {
                                    clearTimeout(gatheringTimeout);
                                    sendOffer();
                                    return true;
                                }
                                return false;
                            };
                            
                            // If not already complete, set up a listener
                            if (!checkGatheringState()) {
                                const originalHandler = peerConnection.onicegatheringstatechange;
                                peerConnection.onicegatheringstatechange = () => {
                                    if (originalHandler) originalHandler.apply(peerConnection, arguments);
                                    if (checkGatheringState()) {
                                        peerConnection.onicegatheringstatechange = originalHandler;
                                    }
                                };
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Error during negotiation with ${userId}:`, err);
            } finally {
                // Reset negotiation flag after a short delay
                setTimeout(() => {
                    peerConnection._isNegotiating = false;
                }, 3000);
            }
        };
        
        // Handle incoming streams more efficiently
        peerConnection.ontrack = (event) => {
            updateDebugInfo(userId, `Received ${event.track.kind} track`);
            console.log(`Track received from ${userId}: `, event.track);
            
            // Log important track details to help debug black screen issues
            console.log(`Track details - kind: ${event.track.kind}, enabled: ${event.track.enabled}, muted: ${event.track.muted}, readyState: ${event.track.readyState}`);
            
            // Ensure we log when the track actually starts flowing
            event.track.onunmute = () => {
                console.log(`Track ${event.track.kind} from ${userId} is now unmuted and should be visible`);
                updateDebugInfo(userId, `${event.track.kind} active`);
                
                // Actively trigger UI update when video is unmuted
                if (event.track.kind === 'video') {
                    // Get existing video element
                    const existingVideo = document.getElementById(`video-${userId}`);
                    if (existingVideo) {
                        // If video is paused, try to play it
                        if (existingVideo.paused) {
                            playWithUnmuteSequence(existingVideo, userId);
                        }
                        
                        // Hide any debug indicators
                        const debugIndicator = document.getElementById(`video-debug-${userId}`);
                        if (debugIndicator) {
                            debugIndicator.style.opacity = '0';
                        }
                    }
                }
            };
            
            // Track when the track ends
            event.track.onended = () => {
                console.log(`Track ${event.track.kind} from ${userId} has ended`);
                
                // Show indicator if video track ended
                if (event.track.kind === 'video') {
                    const debugIndicator = document.getElementById(`video-debug-${userId}`);
                    if (debugIndicator) {
                        debugIndicator.style.opacity = '1';
                        debugIndicator.textContent = 'Video ended';
                    }
                }
            };
            
            // Always ensure we have a valid stream to work with
            let remoteStream = event.streams && event.streams.length > 0 ? event.streams[0] : null;
            
            if (!remoteStream) {
                // Create a synthetic stream if one wasn't provided
                console.log(`Creating synthetic stream for ${userId} as no stream was provided with the track`);
                remoteStream = new MediaStream();
                remoteStream.addTrack(event.track);
            }
            
            // Log received streams and tracks for debugging black screen issues
            console.log(`Remote stream for ${userId} has ${remoteStream.getTracks().length} tracks`);
            
            // Get existing video element if it exists
            const existingVideo = document.getElementById(`video-${userId}`);
            
            if (existingVideo) {
                // Check if we need to replace the stream or add track to existing stream
                const currentStream = existingVideo.srcObject;
                
                if (currentStream instanceof MediaStream) {
                    // If we already have a stream, add this track to it
                    const trackExists = currentStream.getTracks().some(t => 
                        t.id === event.track.id || t.kind === event.track.kind
                    );
                    
                    if (!trackExists) {
                        // Remove any existing tracks of the same kind
                        const existingTracksOfSameKind = currentStream.getTracks()
                            .filter(t => t.kind === event.track.kind);
                        
                        existingTracksOfSameKind.forEach(t => currentStream.removeTrack(t));
                        
                        // Add the new track
                        currentStream.addTrack(event.track);
                        console.log(`Added ${event.track.kind} track to existing stream for ${userId}`);
                        
                        // For video tracks, verify the video element actually updates
                        if (event.track.kind === 'video') {
                            // Set a timeout to verify video dimensions
                            setTimeout(() => {
                                if (existingVideo.videoWidth === 0 || existingVideo.videoHeight === 0) {
                                    console.warn(`Video track added but dimensions still zero for ${userId}`);
                                    
                                    // Try replacing the entire stream as a fallback
                                    console.log(`Trying to replace entire stream for ${userId}`);
                                    existingVideo.srcObject = remoteStream;
                                    
                                    playWithUnmuteSequence(existingVideo, userId);
                                }
                            }, 2000);
                        }
                    }
                    
                    // Debug video element state
                    console.log(`Video element state for ${userId}: readyState=${existingVideo.readyState}, paused=${existingVideo.paused}, videoWidth=${existingVideo.videoWidth}, videoHeight=${existingVideo.videoHeight}`);
                    
                    // Add stats monitoring for video tracks to debug black screens
                    if (event.track.kind === 'video') {
                        // Save track reference to prevent "no sender or receiver for the track" errors
                        const trackRef = event.track;
                        
                        // Monitor video stats periodically
                        const statsInterval = setInterval(async () => {
                            // First check if connection still exists
                            if (!peers[userId] || peers[userId].connectionState === 'closed') {
                                console.log(`Clearing stats interval for ${userId} - peer connection gone or closed`);
                                clearInterval(statsInterval);
                                return;
                            }
                            
                            try {
                                // Get stats without specifying track (more reliable)
                                const stats = await peers[userId].getStats(null);
                                let hasVideoData = false;
                                
                                // Process all stats
                                stats.forEach(stat => {
                                    if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                                        hasVideoData = true;
                                        console.log(`${userId} video stats: framesReceived=${stat.framesReceived}, framesDecoded=${stat.framesDecoded}, packetsLost=${stat.packetsLost}`);
                                        
                                        // Check for potential black screen indicators
                                        if (stat.framesReceived > 0 && stat.framesDecoded === 0) {
                                            console.warn(`Potential black screen issue detected: frames received but not decoded`);
                                            
                                            // Show the debug indicator
                                            const debugIndicator = document.getElementById(`video-debug-${userId}`);
                                            if (debugIndicator) {
                                                debugIndicator.style.opacity = '1';
                                                debugIndicator.textContent = 'Not decoding frames';
                                            }
                                            
                                            // Try to fix by replacing the stream
                                            console.log(`Attempting to fix black screen by replacing stream for ${userId}`);
                                            existingVideo.srcObject = new MediaStream([trackRef]);
                                            playWithUnmuteSequence(existingVideo, userId);
                                        } else if (stat.framesReceived > 0 && stat.framesDecoded > 0) {
                                            // Frames are being decoded, hide any error indicators
                                            const debugIndicator = document.getElementById(`video-debug-${userId}`);
                                            if (debugIndicator) {
                                                debugIndicator.style.opacity = '0';
                                            }
                                        }
                                    }
                                });
                                
                                if (!hasVideoData) {
                                    // Try to check if we have any video tracks
                                    const videoTracks = currentStream.getVideoTracks();
                                    if (videoTracks.length > 0) {
                                        console.warn(`No video statistics available for ${userId} despite having ${videoTracks.length} video tracks`);
                                    } else {
                                        console.log(`No video tracks currently available for ${userId}`);
                                    }
                                }
                            } catch (e) {
                                // Log but don't break if stats gathering fails
                                console.warn(`Error getting stats for ${userId}: ${e.message}`);
                                
                                // If this error occurs repeatedly, stop trying
                                if (e.message.includes('no sender or receiver')) {
                                    console.log(`Track no longer available, stopping stats monitoring for ${userId}`);
                                    clearInterval(statsInterval);
                                }
                            }
                        }, 5000); // Check every 5 seconds
                    }
                    
                    // Ensure video is playing if it has video tracks
                    if (currentStream.getVideoTracks().length > 0) {
                        if (existingVideo.paused) {
                            console.log(`Video is paused for ${userId}, attempting to play...`);
                            playWithUnmuteSequence(existingVideo, userId);
                        }
                    }
                } else {
                    // If current stream is invalid, replace it with the new one
                    console.log(`Replacing invalid stream for ${userId} with new stream`);
                    existingVideo.srcObject = remoteStream;
                    
                    // Try to play the video with our auto-unmute technique
                    playWithUnmuteSequence(existingVideo, userId);
                }
            } else {
                // Create a new video element if one doesn't exist
                console.log(`Creating new video element for ${userId}`);
                updateRemoteVideo(userId, remoteStream, remoteUserName);
            }
        };
        
        // Add all tracks from local stream to peer connection
        if (localStream) {
            try {
                // Log current track status before adding
                console.log(`Adding ${localStream.getTracks().length} local tracks to peer connection for ${userId}`);
                
                localStream.getTracks().forEach(track => {
                    // Track details
                    console.log(`Adding track to peer: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`);
                    
                    // Add track to peer connection
                    const sender = peerConnection.addTrack(track, localStream);
                    
                    // Log success
                    console.log(`Track ${track.kind} added to peer ${userId}, RTCRtpSender created:`, sender ? 'yes' : 'no');
                    
                    // Monitor track status changes
                    track.onended = () => {
                        console.log(`Local ${track.kind} track ended, may cause black screen for remote peer`);
                    };
                    
                    track.onmute = () => {
                        console.log(`Local ${track.kind} track muted`);
                    };
                    
                    track.onunmute = () => {
                        console.log(`Local ${track.kind} track unmuted`);
                    };
                });
            } catch(e) {
                console.error(`Error adding tracks to peer ${userId}:`, e);
                addLogEntry(`Failed to add media tracks to peer connection: ${e.message}`, 'error');
                // Try to continue without tracks, could still receive remote video
            }
        } else {
            console.warn(`Cannot add tracks to peer ${userId} - local stream not initialized`);
            addLogEntry(`Warning: Local media not available, can receive but not send video`, 'warning');
        }
        
        peers[userId] = peerConnection;
        return peerConnection;
    }
    
    // Helper function to play video with temporary mute to bypass autoplay restrictions
    function playWithUnmuteSequence(videoElement, userId) {
        // Use the function from WebRTCPlayer module
        if (window.WebRTCPlayer && typeof window.WebRTCPlayer.playWithUnmuteSequence === 'function') {
            window.WebRTCPlayer.playWithUnmuteSequence(videoElement, userId);
        } else {
            console.error('WebRTCPlayer module function not available');
        }
    }
    
    // Simulate a user gesture to help with autoplay
    function simulateUserGesture(callback) {
        // Use the function from WebRTCPlayer module
        if (window.WebRTCPlayer && typeof window.WebRTCPlayer.simulateUserGesture === 'function') {
            window.WebRTCPlayer.simulateUserGesture(callback);
        } else {
            console.error('WebRTCPlayer simulateUserGesture function not available');
        }
    }
    
    // Monitor video playback to detect issues
    function monitorVideoPlayback(videoElement, userId) {
        if (!videoElement) return;
        
        let blackFrameCount = 0;
        let lastWidth = videoElement.videoWidth;
        let lastHeight = videoElement.videoHeight;
        
        const monitor = setInterval(() => {
            // Check if video element still exists
            if (!document.contains(videoElement)) {
                clearInterval(monitor);
                return;
            }
            
            // Check if paused
            if (videoElement.paused) {
                showVideoDebugOverlay(userId, "Video playback paused unexpectedly", "error");
                
                // Try to resume
                videoElement.play().catch(e => {
                    showVideoDebugOverlay(userId, `Cannot resume: ${e.message}`, "error");
                });
            }
            
            // Check for dimension changes (might indicate stream started/stopped)
            if (lastWidth !== videoElement.videoWidth || lastHeight !== videoElement.videoHeight) {
                if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                    showVideoDebugOverlay(userId, "Video dimensions changed to 0x0", "error");
                } else {
                    showVideoDebugOverlay(userId, `Video dimensions changed to ${videoElement.videoWidth}x${videoElement.videoHeight}`, "info");
                }
                
                lastWidth = videoElement.videoWidth;
                lastHeight = videoElement.videoHeight;
            }
            
            // Check if stream still has tracks
            const stream = videoElement.srcObject;
            if (stream) {
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length === 0) {
                    showVideoDebugOverlay(userId, "Video tracks have been removed", "error");
                } else {
                    // Check track status
                    videoTracks.forEach(track => {
                        if (track.readyState !== 'live') {
                            showVideoDebugOverlay(userId, `Track state changed to ${track.readyState}`, "error");
                        }
                    });
                }
            } else {
                showVideoDebugOverlay(userId, "Video srcObject has been removed", "error");
            }
            
            // Stop monitoring after 30 seconds to save resources
            if (++blackFrameCount > 10) {
                clearInterval(monitor);
            }
        }, 3000);
    }
    
    // Comment indicating we're using the debugMode from earlier in the file
    
    // Add this function after addLogEntry
    function showVideoDebugOverlay(userId, message, type = 'warning') {
        if (!debugMode) return;
        
        const container = document.getElementById(`container-${userId}`);
        if (!container) return;
        
        let overlay = document.getElementById(`video-debug-overlay-${userId}`);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = `video-debug-overlay-${userId}`;
            overlay.className = 'absolute top-0 left-0 right-0 p-2 text-white text-xs z-20 text-center';
            container.appendChild(overlay);
        }
        
        // Set color based on type
        let bgColor = 'bg-yellow-600';
        if (type === 'error') bgColor = 'bg-red-600';
        if (type === 'info') bgColor = 'bg-blue-600';
        if (type === 'success') bgColor = 'bg-green-600';
        
        // Create new message element
        const msgElement = document.createElement('div');
        msgElement.className = `${bgColor} bg-opacity-90 mb-1 p-1 rounded`;
        msgElement.textContent = message;
        
        // Add to overlay
        overlay.appendChild(msgElement);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (msgElement.parentNode) {
                msgElement.parentNode.removeChild(msgElement);
            }
        }, 10000);
        
        // Also log to console
        console.log(`[VIDEO DEBUG] ${userId}: ${message}`);
    }
    
    // Setup video analyzer to detect black screens
    function setupVideoAnalyzer(videoElement, userId) {
        // Use the function from WebRTCDebug module
        if (window.WebRTCDebug && typeof window.WebRTCDebug.setupAnalyzer === 'function') {
            window.WebRTCDebug.setupAnalyzer(videoElement, userId);
        } else {
            console.error('WebRTCDebug setupAnalyzer function not available');
        }
    }
    
    // Add enhanced play button with more information
    function addImprovedPlayButton(videoElement, userId) {
        // Use the function from WebRTCPlayer module
        if (window.WebRTCPlayer && typeof window.WebRTCPlayer.addImprovedPlayButton === 'function') {
            window.WebRTCPlayer.addImprovedPlayButton(videoElement, userId);
        } else {
            console.error('WebRTCPlayer addImprovedPlayButton function not available');
        }
    }
});
