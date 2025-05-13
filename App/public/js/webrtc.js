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
    
    // Test connectivity to marvelcollin.my.id
    testServerConnectivity();
    
    // Function to test connectivity to marvelcollin.my.id
    function testServerConnectivity() {
        // Skip direct fetch test which would be blocked by CORS
        addLogEntry('Testing connectivity to signaling server...', 'info');
        
        // Try connecting to the local server first
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
        
        // Try connecting to local server first
        const localUrl = window.location.origin;
        logConnectionDebug(`Attempting to connect to local signaling server at ${localUrl}...`);
        
        addLogEntry(`Connecting to local server: ${localUrl}`, 'info');
        console.log(`Attempting connection to: ${localUrl}`);
        
        // Initialize socket first with a new connection
        socket = io(localUrl, {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 5000, // Shorter timeout for local server
            transports: ['polling', 'websocket'],
            forceNew: true,
            path: '/socket.io/',
            query: {
                username: userName,
                room: GLOBAL_ROOM,
                timestamp: Date.now()
            }
        });
        
        // Then check and disconnect if needed - now socket is defined
        // We don't need this check anymore since we're creating a new socket
        
        // Handle connection errors from local server - try remote server
        socket.on('connect_error', (error) => {
            logConnectionDebug(`Local connection error: ${error.message}`);
            addLogEntry(`Local connection failed, trying remote server...`, 'info');
            
            // Disconnect from local server
            socket.disconnect();
            
            // Try remote server
            const remoteUrl = 'https://marvelcollin.my.id';
            logConnectionDebug(`Attempting to connect to remote signaling server at ${remoteUrl}...`);
            
            addLogEntry(`Connecting to remote server: ${remoteUrl}`, 'info');
            
            // Connect to remote server
            socket = io(remoteUrl, {
                reconnectionAttempts: 3,
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
            
            // Set up event handlers for the new socket
            setupSocketEventHandlers();
            
            // Handle remote connection errors
            socket.on('connect_error', (remoteError) => {
                logConnectionDebug(`Remote connection error: ${remoteError.message}`);
                updateConnectionStatus('disconnected');
                addLogEntry(`Remote connection error: ${remoteError.message}`, 'error');
                
                // Show a detailed error message to the user
                const errorMsg = document.createElement('div');
                errorMsg.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-center p-4';
                errorMsg.innerHTML = `
                    Connection to signaling server failed.<br>
                    <span class="text-sm">Could not connect to local or remote server.</span><br>
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
    }
    
    // Initialize media stream
    async function initLocalStream() {
        try {
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
            
            console.log('Local stream obtained with tracks:', localStream.getTracks().map(t => t.kind));
            addLogEntry(`Local media stream obtained with ${localStream.getTracks().length} tracks`, 'info');
            
            // Set the stream on the video element
            localVideo.srcObject = localStream;
            
            // Use a timeout to let the video element stabilize before playing
            setTimeout(() => {
                localVideo.play()
                    .then(() => console.log('Local video playback started successfully'))
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
            alert('Could not access camera or microphone. Please check permissions: ' + error.message);
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
    
    // Add a participant to the list
    function addParticipantItem(userId, userName) {
        // Check if participant already exists
        const existingItem = document.getElementById(`participant-${userId}`);
        if (existingItem) {
            // Update if already exists
            existingItem.querySelector('.participant-name').textContent = userName;
            return;
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
        
        // Add user to participants list
        addParticipantItem(userId, userName || `User_${userId.substring(0, 4)}`);
        
        // Create peer connection
        if (!peers[userId]) {
            const peerConnection = createPeerConnection(userId, userName);
            
            // Create video container
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
        
        // Close peer connection
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
        }
    }
    
    // Handle global users list
    function handleGlobalUsers(data) {
        const { users } = data;
        console.log(`Received global users: ${users.length}`);
        
        // Process each user
        users.forEach(user => {
            // Skip our own connection
            if (user.userId === socketId) return;
            
            // Add to participants list
            addParticipantItem(user.userId, user.userName || `User_${user.userId.substring(0, 4)}`);
            
            // Create peer connection if doesn't exist
            if (!peers[user.userId]) {
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
            
            // Create video element
            video = document.createElement('video');
            video.id = `video-${userId}`;
            video.className = 'w-full h-full object-cover';
            video.autoplay = true;
            video.playsInline = true;
            
            // Create username overlay
            const usernameOverlay = document.createElement('div');
            usernameOverlay.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-sm';
            usernameOverlay.innerHTML = `<span class="username">${userName || 'Connecting...'}</span>`;
            
            // Add to container
            container.appendChild(video);
            container.appendChild(usernameOverlay);
            
            // Add to video grid
            videoGrid.appendChild(container);
        } else {
            video = document.getElementById(`video-${userId}`);
        }
        
        // Set stream if provided
        if (stream && video) {
            video.srcObject = stream;
            
            // Try to play the video
            video.play().catch(e => {
                console.error(`Error playing video for ${userId}:`, e);
                
                // Try again with a delay
                setTimeout(() => {
                    video.play().catch(() => {
                        console.error(`Still cannot play video for ${userId}`);
                    });
                }, 1000);
            });
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
            // Check connection state before processing
            if (peerConnection.signalingState === 'closed') {
                console.error(`Peer connection with ${from} is closed, cannot process answer`);
                return;
            }
            
            // Set remote description (the answer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`Set remote description (answer) from ${from}`);
            
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
        logConnectionDebug(`Creating peer connection for ${userId} (${remoteUserName})`);
        
        // Show debug information in video container
        const existingContainer = document.getElementById(`container-${userId}`);
        if (existingContainer) {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'absolute top-0 left-0 bg-black bg-opacity-50 text-xs text-white p-1 z-10';
            debugInfo.id = `debug-${userId}`;
            debugInfo.textContent = 'Connecting...';
            existingContainer.appendChild(debugInfo);
        }
        
        // Improved ICE servers configuration based on best practices
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // TURN servers with proper credentials for fallback
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            iceCandidatePoolSize: 5,
            sdpSemantics: 'unified-plan',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            // ICE restart parameters
            iceTransportPolicy: 'all'
        });
        
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
        
        // Add all tracks from local stream to peer connection
        if (localStream) {
            try {
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            } catch(e) {
                console.error(`Error adding tracks:`, e);
            }
        }
        
        // Handle incoming streams more efficiently
        peerConnection.ontrack = (event) => {
            updateDebugInfo(userId, `Received ${event.track.kind} track`);
            
            // Always ensure we have a valid stream to work with
            let remoteStream = event.streams && event.streams.length > 0 ? event.streams[0] : null;
            
            if (!remoteStream) {
                // Create a synthetic stream if one wasn't provided
                remoteStream = new MediaStream();
                remoteStream.addTrack(event.track);
            }
            
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
                    }
                    
                    // Ensure video is playing if it has video tracks
                    if (currentStream.getVideoTracks().length > 0 && existingVideo.paused) {
                        existingVideo.play().catch(() => {});
                    }
                } else {
                    // If current stream is invalid, replace it with the new one
                    existingVideo.srcObject = remoteStream;
                    
                    // Try to play the video
                    existingVideo.play().catch(() => {});
                }
            } else {
                // Create a new video element if one doesn't exist
                updateRemoteVideo(userId, remoteStream, remoteUserName);
            }
        };
        
        // Handle ICE candidates with improved error handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Increment our counter of gathered candidates
                iceCandidatesGathered++;
                
                // Only send candidates that are truly useful
                // Avoid sending candidates that are unlikely to work
                const candidateString = event.candidate.candidate;
                
                // Don't send candidates that are reflexive but have invalid ports
                if (candidateString.indexOf('srflx') !== -1 && 
                    candidateString.indexOf('port 0') !== -1) {
                    console.log(`Skipping invalid srflx candidate`);
                    return;
                }
                
                console.log(`Sending ICE candidate #${iceCandidatesGathered} to ${userId}`);
                
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: userId,
                    from: socketId
                });
            } else {
                console.log(`ICE candidate gathering complete for ${userId}, sending end-of-candidates`);
                
                // Explicitly signal end-of-candidates to help connection establishment
                socket.emit('ice-candidate', {
                    endOfCandidates: true,
                    to: userId,
                    from: socketId
                });
            }
        };
        
        peers[userId] = peerConnection;
        return peerConnection;
    }
});
