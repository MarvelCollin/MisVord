let socket = null;
let socketId = null;

document.addEventListener('DOMContentLoaded', () => {
    
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
    
    
    let localStream = null;
    let screenStream = null;
    let isScreenSharing = false;
    let isVideoEnabled = true;
    let isAudioEnabled = true;
    let userName = 'User_' + Math.floor(Math.random() * 10000); 
    const peers = {};
    
    
    const GLOBAL_ROOM = 'global-video-chat';
    
    
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    const pingBtn = document.getElementById('pingBtn');
    const hangupBtn = document.getElementById('hangupBtn');
    
    
    let debugMode = true; 
    
    
    console.log('Running browser compatibility check...');
    
    // Make sure WebRTCCompat exists before using it
    if (window.WebRTCCompat && typeof window.WebRTCCompat.check === 'function') {
        const browserCompat = window.WebRTCCompat.check();
        console.log('Browser compatibility check:', browserCompat);
    } else {
        console.warn('Browser compatibility module not loaded or not available');
    }
    
    
    testServerConnectivity();
    
    
    function testServerConnectivity() {
        
        addLogEntry('Testing connectivity to localhost:1002...', 'info');
        
        
        connectToSignalingServer();
    }
    
    
    retryPermissionBtn.addEventListener('click', () => {
        console.log("Retry permission button clicked");
        permissionStatus.textContent = 'Requesting permission again...';
        
        
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
    
    
    let logsVisible = false;
    
    if (toggleLogs) {
        toggleLogs.addEventListener('click', () => {
            logsVisible = !logsVisible;
            if (socketLogs) {
                socketLogs.classList.toggle('visible', logsVisible);
            }
            toggleLogs.textContent = logsVisible ? 'Hide Socket Logs' : 'Show Socket Logs';
        });
    }
    
    if (clearLogs) {
        clearLogs.addEventListener('click', () => {
            if (logEntries) {
                logEntries.innerHTML = '';
            }
            console.clear();
            addLogEntry('Logs cleared', 'system');
        });
    }
    
    
    retryConnection.addEventListener('click', () => {
        addLogEntry('Manual reconnection requested', 'info');
        if (socket) {
            
            if (socket.connected) {
                socket.disconnect();
            }
            
            socket = null;
        }
        
        connectToSignalingServer();
    });
    
    
    function addLogEntry(message, type = 'info') {
        // Log to console regardless
        console.log(`[LOG] ${type.toUpperCase()}: ${message}`);
        
        // Only try to append to DOM if the elements exist
        if (!logEntries) return;
        
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        logEntries.appendChild(entry);
        
        if (socketLogs) {
            socketLogs.scrollTop = socketLogs.scrollHeight;
        }
        
        const entries = logEntries.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            logEntries.removeChild(entries[0]);
        }
    }
    
    
    pingBtn.addEventListener('click', () => {
        if (socket && socket.connected) {
            console.log('Pinging all users in the room');
            socket.emit('ping-all-users', {
                roomId: GLOBAL_ROOM,
                message: `Ping from ${userName}`,
                fromUserName: userName
            });
            
            
            showToast(`You pinged all users in the room`, 'info');
        } else {
            showToast('Cannot ping - not connected to server', 'error');
        }
    });
    
    
    function updateConnectionStatus(status) {
        statusIndicator.className = 'status-indicator ' + status;
        
        switch(status) {
            case 'connected':
                statusText.textContent = 'Connected';
                
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
    
    
    function logConnectionDebug(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
        addLogEntry(message, 'info');
        
        // Only add debug info to DOM if we have the connection status element
        const debugArea = document.querySelector('#connectionStatus');
        if (debugArea) {
            const debugContainer = document.createElement('div');
            debugContainer.className = 'text-xs text-gray-500 hidden';
            debugContainer.textContent = `[${timestamp.split('T')[1].split('.')[0]}] ${message}`;
            
            debugArea.appendChild(debugContainer);
            
            const debugMessages = debugArea.querySelectorAll('.text-gray-500');
            if (debugMessages.length > 10) {
                debugArea.removeChild(debugMessages[0]);
            }
        }
    }
    
    
    function connectToSignalingServer() {
        updateConnectionStatus('connecting');
        
        
        const remoteUrl = 'http://localhost:1002';
        logConnectionDebug(`Attempting to connect to local signaling server at ${remoteUrl}...`);
        
        addLogEntry(`Connecting to server: ${remoteUrl}`, 'info');
        console.log(`Attempting connection to: ${remoteUrl}`);
        
        
        socket = io(remoteUrl, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            transports: ['polling', 'websocket'],
            forceNew: true,
            withCredentials: false,
            // Use default socket.io path
            query: {
                username: userName,
                room: GLOBAL_ROOM,
                timestamp: Date.now()
            }
        });
        
        
        socket.on('connect_error', (error) => {
            logConnectionDebug(`Connection error: ${error.message}`);
            updateConnectionStatus('disconnected');
            addLogEntry(`Connection error: ${error.message}`, 'error');
            
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-center p-4';
            errorMsg.innerHTML = `
                Connection to signaling server failed.<br>
                <span class="text-sm">Could not connect to server: ${error.message}</span><br>
                <span class="text-sm mt-2">WebRTC functionality will not work.</span>
            `;
            document.body.appendChild(errorMsg);
            
            
            const reloadBtn = document.createElement('button');
            reloadBtn.className = 'ml-4 px-4 py-1 bg-white text-red-600 rounded';
            reloadBtn.textContent = 'Reload Page';
            reloadBtn.onclick = () => window.location.reload();
            errorMsg.appendChild(reloadBtn);
        });
        
        
        // Set up the socket event handlers if socket was created
        if (socket) {
            setupSocketEventHandlers();
        } else {
            console.error("Failed to create socket connection.");
        }
    }
    
    
    function setupSocketEventHandlers() {
        if (!socket) {
            console.error("Cannot set up socket event handlers: socket is null");
            return;
        }
        
        const originalEmit = socket.emit;
        socket.emit = function() {
            const args = Array.prototype.slice.call(arguments);
            const eventName = args[0];
            const eventData = args.length > 1 ? JSON.stringify(args[1]) : '';
            
            console.log(`[SOCKET OUTGOING] ${eventName}:`, args.length > 1 ? args[1] : '');
            addLogEntry(`[SENT] ${eventName}: ${eventData}`, 'sent');
            
            return originalEmit.apply(this, arguments);
        };
        
        
        const onevent = socket.onevent;
        socket.onevent = function(packet) {
            const args = packet.data || [];
            const eventName = args[0];
            const eventData = args.length > 1 ? JSON.stringify(args[1]) : '';
            
            console.log(`[SOCKET INCOMING] ${eventName}:`, args.length > 1 ? args[1] : '');
            addLogEntry(`[RECEIVED] ${eventName}: ${eventData}`, 'received');
            
            onevent.call(this, packet);
        };
        
        
        addLogEntry(`Initial socket state: ${socket.connected ? 'connected' : 'disconnected'}`, 'info');
        
        socket.on('connect', () => {
            logConnectionDebug(`Connected to signaling server with ID: ${socket.id}`);
            socketId = socket.id;
            updateConnectionStatus('connected');
            
            
            addLogEntry(`🟢 CONNECTED with ID: ${socket.id}`, 'received');
            
            
            // Check if it appears to be a mock socket
            const isMockSocket = socket.id.indexOf('mock-socket') > -1 || 
                                 (socket.io && socket.io.engine && socket.io.engine.transport.name === 'mock-transport');
            
            if (isMockSocket) {
                addLogEntry(`Using mock socket.io implementation`, 'warning');
                
                showToast('Using mock socket implementation - WebRTC calls will be simulated', 'warning');
            }
            
            addLogEntry(`Socket Details - Transport: ${socket.io.engine.transport.name}`, 'info');
            console.log('Socket Connection Details:', {
                id: socket.id,
                connected: socket.connected,
                isMock: isMockSocket,
                transport: socket.io.engine.transport.name
            });
            
            
            socket.emit('join-global-room', {
                roomId: GLOBAL_ROOM,
                userId: socket.id,
                userName: userName
            });
            
            
            Array.from(document.querySelectorAll('.participant-item')).forEach(item => {
                participantsList.removeChild(item);
            });
            
            
            addParticipantItem(socket.id, userName + ' (You)');
            
            
            setTimeout(() => {
                logConnectionDebug('Requesting global users list...');
                socket.emit('get-global-users', { 
                    roomId: GLOBAL_ROOM 
                });
            }, 1500); 
        });
        
        socket.on('disconnect', (reason) => {
            logConnectionDebug(`Disconnected from signaling server. Reason: ${reason}`);
            updateConnectionStatus('disconnected');
            
            
            addLogEntry(`🔴 DISCONNECTED from signaling server. Reason: ${reason}`, 'error');
            
            
            if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
                
                addLogEntry('Server forced disconnect. Attempting manual reconnection to signaling server...', 'info');
                setTimeout(() => {
                    
                    socket = null;
                    connectToSignalingServer();
                }, 2000);
            }
        });
        
        
        setTimeout(() => {
            if (!socket.connected) {
                logConnectionDebug('Socket failed to connect after timeout. Trying again...');
                addLogEntry('Connection timeout. Retrying...', 'info');
                
                
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
        
        
        socket.on('ping-sent', (data) => {
            const { success, recipients } = data;
            if (success) {
                const message = recipients === 1 
                    ? `Ping sent to 1 participant` 
                    : `Ping sent to ${recipients} participants`;
                
                showToast(message, 'success');
            }
        });
        
        
        socket.on('user-ping', (data) => {
            const { from, userName, fromUserName, message } = data;
            
            
            if (from === socketId) return;
            
            
            logConnectionDebug(`Received ping from: ${fromUserName || userName || from}`);
            addLogEntry(`🔔 Ping received from: ${fromUserName || userName || from}`, 'received');
            
            
            showToast(`${fromUserName || userName || from} pinged the room`, 'ping');
            
            
            const userContainer = document.getElementById(`container-${from}`);
            if (userContainer) {
                
                const pingEffect = document.createElement('div');
                pingEffect.className = 'absolute inset-0 bg-blue-500 bg-opacity-30 z-5 animate-pulse';
                userContainer.appendChild(pingEffect);
                
                
                setTimeout(() => {
                    if (pingEffect.parentNode) {
                        pingEffect.parentNode.removeChild(pingEffect);
                    }
                }, 2000);
            }
            
            
            socket.emit('ping-ack', {
                to: from,
                from: socketId,
                userName: userName
            });
        });
        
        
        socket.on('ping-ack', (data) => {
            const { from, userName } = data;
            logConnectionDebug(`Ping acknowledged by: ${userName || from}`);
            addLogEntry(`✅ Ping acknowledged by: ${userName || from}`, 'received');
            
            
            const userItem = document.getElementById(`participant-${from}`);
            if (userItem) {
                userItem.classList.add('bg-green-700');
                setTimeout(() => {
                    userItem.classList.remove('bg-green-700');
                }, 2000);
            }
        });
        
        
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
            
            
            
            socket.emit('get-global-users', { 
                roomId: GLOBAL_ROOM 
            });
            
            
        });
        
        socket.on('user-left', (data) => {
            logConnectionDebug(`User left: ${data.userId}`);
            
            
            handleUserLeft(data);
            
            
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
    
    
    async function initLocalStream() {
        try {
            console.log('Requesting media permissions...');
            
            
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 }, 
                    height: { ideal: 480 }, 
                    frameRate: { ideal: 24 } 
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            
            const videoTrack = localStream.getVideoTracks()[0];
            const audioTrack = localStream.getAudioTracks()[0];
            
            if (videoTrack) {
                console.log('Video track obtained:', videoTrack.label);
                console.log('Video track settings:', videoTrack.getSettings());
                
                
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
            
            
            localVideo.srcObject = localStream;
            
            
            localStream.onaddtrack = (event) => {
                console.log('Track added to local stream:', event.track);
            };
            
            localStream.onremovetrack = (event) => {
                console.log('Track removed from local stream:', event.track);
            };
            
            
            setTimeout(() => {
                localVideo.play()
                    .then(() => {
                        console.log('Local video playback started successfully');
                        
                        Object.keys(peers).forEach(userId => {
                            const peerConnection = peers[userId];
                            
                            
                            localStream.getTracks().forEach(track => {
                                
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
                        
                        addPlayButtonToLocalVideo();
                    });
            }, 500);
            
            return true;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            addLogEntry(`Error accessing media: ${error.message}`, 'error');
            
            
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
    
    
    function addPlayButtonToLocalVideo() {
        const container = document.querySelector('.local-video-container');
        if (!container) return;
        
        
        if (container.querySelector('.local-play-button')) return;
        
        const playButton = document.createElement('button');
        playButton.className = 'local-play-button absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-10';
        playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
        
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
    
    
    function addPlayButtonToRemoteVideo(userId, videoElement) {
        
        addImprovedPlayButton(videoElement, userId);
    }
    
    
    function addParticipantItem(userId, userName) {
        
        if (document.getElementById(`participant-${userId}`)) {
            
            return;
        }
        
        const existingItem = document.getElementById(`participant-${userId}`);
        if (existingItem) {
            
            existingItem.querySelector('.participant-name').textContent = userName;
            return;
        }
        
        
        const cleanUserName = userName.replace(' (You)', '');
        const duplicateByName = Array.from(document.querySelectorAll('.participant-item'))
            .find(item => {
                const nameEl = item.querySelector('.participant-name');
                return nameEl && nameEl.textContent.replace(' (You)', '') === cleanUserName;
            });
        
        
        if (duplicateByName && duplicateByName.id !== `participant-${userId}`) {
            
            if (userName.includes('(You)')) {
                
                const duplicateId = duplicateByName.id.replace('participant-', '');
                console.log(`Removing duplicate participant ${duplicateId} with same username as current user`);
                removeParticipantItem(duplicateId);
            } else {
                
                console.log(`Skipping adding duplicate participant ${userId} with name ${userName}`);
                return;
            }
        }
        
        
        const item = document.createElement('div');
        item.id = `participant-${userId}`;
        item.className = 'participant-item p-2 mb-1 rounded bg-gray-700 text-white flex items-center justify-between';
        
        
        const userInfo = document.createElement('div');
        userInfo.className = 'flex items-center';
        
        const userIcon = document.createElement('div');
        userIcon.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
        
        const userName_elem = document.createElement('span');
        userName_elem.className = 'participant-name';
        userName_elem.textContent = userName;
        
        userInfo.appendChild(userIcon);
        userInfo.appendChild(userName_elem);
        
        
        const actions = document.createElement('div');
        
        
        const pingButton = document.createElement('button');
        pingButton.className = 'text-xs bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 text-white';
        pingButton.textContent = 'Ping';
        pingButton.onclick = () => pingUser(userId);
        
        actions.appendChild(pingButton);
        
        
        item.appendChild(userInfo);
        item.appendChild(actions);
        
        
        participantsList.appendChild(item);
        
        console.log(`Added participant: ${userName} (${userId})`);
    }
    
    
    function removeParticipantItem(userId) {
        const item = document.getElementById(`participant-${userId}`);
        if (item) {
            participantsList.removeChild(item);
            console.log(`Removed participant: ${userId}`);
        }
    }
    
    
    function handleUserJoined(data) {
        const { userId, userName } = data;
        console.log(`User joined: ${userName || userId}`);
        
        
        if (userId === socketId) return;
        
        
        if (document.getElementById(`participant-${userId}`)) {
            console.log(`User ${userId} is already in the participant list, skipping duplicate join event`);
            return;
        }
        
        
        const existingItem = document.getElementById(`participant-${userId}`);
        const existingPeer = peers[userId];
        const existingVideo = document.getElementById(`container-${userId}`);
        
        if (existingItem && existingPeer && existingVideo) {
            console.log(`User ${userId} is already in the participant list, skipping duplicate join event`);
            return;
        }
        
        
        if (!existingItem) {
            addParticipantItem(userId, userName || `User_${userId.substring(0, 4)}`);
        }
        
        
        if (!existingPeer) {
            console.log(`Creating new peer connection for joined user ${userId}`);
            const peerConnection = createPeerConnection(userId, userName);
        }
        
        
        if (!existingVideo) {
            updateRemoteVideo(userId, null, userName || `User_${userId.substring(0, 4)}`);
        }
    }
    
    
    function handleUserLeft(data) {
        const { userId, userName } = data;
        console.log(`User left: ${userName || userId}`);
        
        removeParticipantItem(userId);
        
        const container = document.getElementById(`container-${userId}`);
        if (container) {
            videoGrid.removeChild(container);
        }
        
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
            logConnectionDebug(`Cleaned up peer connection for ${userId} on leave`);
        }
    }
    
    
    function handleGlobalUsers(data) {
        const { users } = data;
        // Convert object to array if it's not already an array
        const userList = Array.isArray(users) ? users : Object.values(users);
        
        console.log(`Received global users: ${userList.length}`);
        
        const usernameMap = new Map();
        
        // Add our own username to the map
        usernameMap.set(userName.replace(' (You)', ''), socketId);
        
        // Get current participants
        const currentParticipants = Array.from(document.querySelectorAll('.participant-item'))
            .map(el => el.id.replace('participant-', ''));
        
        // Keep track of valid user IDs
        const validUserIds = [];
        
        // Process users
        userList.forEach(user => {
            // Add to valid IDs
            validUserIds.push(user.userId);
            
            // Extract username without "(You)" suffix
            const cleanUsername = (user.userName || '').replace(' (You)', '');
            
            // Skip if this is a duplicate of our username
            if (cleanUsername === userName.replace(' (You)', '') && user.userId !== socketId) {
                console.log(`Found duplicate user with our username: ${cleanUsername}, ID: ${user.userId}`);
                return;
            }
            
            // Add to username map
            usernameMap.set(cleanUsername, user.userId);
        });
        
        // Make sure our ID is included
        if (!validUserIds.includes(socketId)) {
            validUserIds.push(socketId);
        }
        
        console.log(`Current participants: ${currentParticipants.length}, Valid users: ${validUserIds.length}`);
        
        // Remove stale participants
        currentParticipants.forEach(id => {
            if (!validUserIds.includes(id)) {
                console.log(`Removing stale participant: ${id}`);
                removeParticipantItem(id);
                
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
        
        // Check for duplicate usernames
        const userEls = document.querySelectorAll('.participant-item');
        userEls.forEach(el => {
            const id = el.id.replace('participant-', '');
            const nameEl = el.querySelector('.participant-name');
            if (nameEl) {
                // Check if this username matches another ID
                const displayedName = nameEl.textContent.replace(' (You)', '');
                const expectedId = usernameMap.get(displayedName);
                
                // If so, remove the duplicate (keep the one that matches the map)
                if (expectedId && expectedId !== id) {
                    console.log(`Removing duplicate participant with username ${displayedName}`);
                    removeParticipantItem(id);
                }
            }
        });
        
        // Make sure we're in the list
        if (!document.getElementById(`participant-${socketId}`)) {
            addParticipantItem(socketId, userName + ' (You)');
        }
        
        // Add remote users
        userList.forEach(user => {
            // Skip if this is us or a duplicate username
            if (user.userId === socketId || 
                (user.userName && user.userName.replace(' (You)', '') === userName.replace(' (You)', ''))) {
                return;
            }
            
            // Add participant to the list
            addParticipantItem(user.userId, user.userName || `User_${user.userId.substring(0, 4)}`);
            
            // Create peer connection if needed
            if (!peers[user.userId]) {
                console.log(`Creating new peer connection for ${user.userId}`);
                const peerConnection = createPeerConnection(user.userId, user.userName);
                
                // Add placeholder video
                updateRemoteVideo(user.userId, null, user.userName || `User_${user.userId.substring(0, 4)}`);
            }
        });
    }
    
    
    function handleError(data) {
        console.error(`Server error: ${data.message}`);
        addLogEntry(`Server error: ${data.message}`, 'error');
    }
    
    
    function updateRemoteVideo(userId, stream, userName) {
        // Find existing container or create a new one
        let container = document.getElementById(`container-${userId}`);
        let video;
        
        if (!container) {
            // Create container for the video
            container = document.createElement('div');
            container.id = `container-${userId}`;
            container.className = 'remote-video-container relative rounded overflow-hidden bg-gray-800';
            
            // Create the video element
            video = document.createElement('video');
            video.id = `video-${userId}`;
            video.className = 'w-full h-full object-cover';
            video.autoplay = true;
            video.playsInline = true;
            video.muted = false; 
            video.setAttribute('playsinline', ''); 
            video.setAttribute('webkit-playsinline', ''); 
            
            // Set explicit size for iOS Safari
            video.width = 640;
            video.height = 480;
            
            // Debug indicator
            const debugIndicator = document.createElement('div');
            debugIndicator.className = 'absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 transition-opacity duration-300';
            debugIndicator.id = `video-debug-${userId}`;
            debugIndicator.textContent = 'No video';
            
            // Username overlay
            const usernameOverlay = document.createElement('div');
            usernameOverlay.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-sm';
            usernameOverlay.innerHTML = `<span class="username">${userName || 'Connecting...'}</span>`;
            
            // Add elements to container
            container.appendChild(video);
            container.appendChild(debugIndicator);
            container.appendChild(usernameOverlay);
            
            // Connection status indicator
            const connectionStatusIndicator = document.createElement('div');
            connectionStatusIndicator.className = 'absolute top-0 left-0 p-1 z-10';
            connectionStatusIndicator.innerHTML = `
                <div class="px-2 py-1 bg-yellow-500 text-white text-xs rounded-br-md">
                    <span id="connection-status-${userId}">Connecting...</span>
                </div>
            `;
            container.appendChild(connectionStatusIndicator);
            
            // Action buttons
            const actionButtons = document.createElement('div');
            actionButtons.className = 'absolute top-0 right-0 p-1 flex gap-1 z-10';
            actionButtons.innerHTML = `
                <button class="refresh-video-btn p-1 bg-blue-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Refresh Video">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />                    </svg>
                </button>
                <button class="resubscribe-btn p-1 bg-green-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Resubscribe">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />                    </svg>
                </button>
            `;
            container.appendChild(actionButtons);
            
            // Set up action button handlers
            setTimeout(() => {
                const refreshBtn = container.querySelector('.refresh-video-btn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', () => {
                        const videoEl = document.getElementById(`video-${userId}`);
                        if (videoEl) {
                            showVideoDebugOverlay(userId, "Manual refresh triggered", "info");
                            // Trigger a refresh by temporarily nulling the source
                            const currentStream = videoEl.srcObject;
                            videoEl.srcObject = null;
                            setTimeout(() => {
                                videoEl.srcObject = currentStream;
                                playWithUnmuteSequence(videoEl, userId);
                            }, 100);
                        }
                    });
                }
                
                const resubscribeBtn = container.querySelector('.resubscribe-btn');
                if (resubscribeBtn) {
                    resubscribeBtn.addEventListener('click', () => {
                        showVideoDebugOverlay(userId, "Manual resubscribe triggered", "info");
                        
                        if (peers[userId]) {
                            showVideoDebugOverlay(userId, "Closing existing peer connection", "info");
                            peers[userId].close();
                            delete peers[userId];
                            
                            // Create a new peer connection
                            showVideoDebugOverlay(userId, "Creating new peer connection", "info");
                            createPeerConnection(userId, userName);
                        }
                    });
                }
            }, 100);
            
            // Add to page
            videoGrid.appendChild(container);
            
            // Add event handlers for video element
            video.addEventListener('canplay', () => {
                console.log(`Video can play for ${userId}`);
                debugIndicator.style.opacity = '0';
                
                // Update status indicator
                const statusEl = document.getElementById(`connection-status-${userId}`);
                if (statusEl) {
                    statusEl.textContent = 'Connected';
                    statusEl.parentElement.classList.remove('bg-yellow-500');
                    statusEl.parentElement.classList.add('bg-green-500');
                    
                    // Hide after a delay
                    setTimeout(() => {
                        statusEl.parentElement.style.opacity = '0';
                    }, 5000);
                }
                
                // For Safari support, make an additional play attempt
                if (video.paused) {
                    console.log(`Video can play but is paused for ${userId}, triggering play()`);
                    video.play().catch(err => console.log(`Auto-play failed: ${err.message}`));
                }
            });
            
            video.addEventListener('playing', () => {
                console.log(`Video is playing for ${userId}`);
                debugIndicator.style.opacity = '0';
                
                // Update UI to show video is playing
                showVideoDebugOverlay(userId, "Video playing successfully", "success");
                
                // Set up video monitoring
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
            
            // Add stats collector to monitor video quality
            let statsInterval;
            if (peers[userId]) {
                statsInterval = setInterval(async () => {
                    if (!peers[userId] || !document.contains(video)) {
                        clearInterval(statsInterval);
                        return;
                    }
                    
                    try {
                        const stats = await peers[userId].getStats(null);
                        let videoStats = null;
                        
                        stats.forEach(stat => {
                            if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                                videoStats = stat;
                                // If frames are being received but not showing, try to refresh
                                if (stat.framesReceived > 10 && 
                                    (video.videoWidth === 0 || video.videoHeight === 0)) {
                                    console.log(`Video data arriving but not showing (${stat.framesReceived} frames) - triggering refresh`);
                                    
                                    // Reset srcObject to force refresh
                                    const stream = video.srcObject;
                                    video.srcObject = null;
                                    setTimeout(() => {
                                        video.srcObject = stream;
                                        video.play().catch(e => console.log(`Play error: ${e}`));
                                    }, 100);
                                }
                            }
                        });
                        
                        if (videoStats) {
                            if (video.videoWidth > 0 && video.videoHeight > 0) {
                                console.log(`Video stats for ${userId}: ${video.videoWidth}x${video.videoHeight}px, ${videoStats.framesReceived} received, ${videoStats.framesDecoded} decoded`);
                            }
                        }
                    } catch (e) {
                        // Ignore errors, they're expected when connections change
                    }
                }, 3000);
            }
        } else {
            video = document.getElementById(`video-${userId}`);
        }
        
        // If we have a stream, attach it to the video element
        if (stream && video) {
            showVideoDebugOverlay(userId, `Setting new stream with ${stream.getTracks().length} tracks`, "info");
            
            // Log track details for debugging
            stream.getTracks().forEach(track => {
                showVideoDebugOverlay(userId, `Track: ${track.kind}, state: ${track.readyState}, enabled: ${track.enabled}`, "info");
            });
            
            // Set the stream and play
            video.srcObject = stream;
            
            // Try to play the video
            setTimeout(() => {
                playWithUnmuteSequence(video, userId);
            }, 100);
        } else if (video && !video.srcObject) {
            showVideoDebugOverlay(userId, "No stream available yet", "warning");
            
            // Add a play button as fallback
            addImprovedPlayButton(video, userId);
        }
        
        return container;
    }
    
    
    function pingUser(userId) {
        if (!socket || !socket.connected) {
            addLogEntry('Cannot ping - not connected to server', 'error');
            return;
        }
        
        console.log(`Pinging all users`);
        addLogEntry(`Pinging all users`, 'info');
        
        
        socket.emit('ping-all-users', {
            roomId: GLOBAL_ROOM,
            message: `Ping from ${userName}`,
            fromUserName: userName
        });
        
        
        showToast(`You pinged all users in the room`, 'info');
    }
    
    
    function showToast(message, type = 'info') {
        
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(toastContainer);
        }
        
        
        const toast = document.createElement('div');
        toast.className = `toast-message p-3 rounded shadow-lg flex items-center gap-2 transition-all transform translate-x-full opacity-0`;
        
        
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
        
        
        const icon = document.createElement('div');
        if (type === 'ping') {
            
            icon.innerHTML = `                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />            </svg>`;
        } else if (type === 'error') {
                        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />            </svg>`;
        } else {
                        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />            </svg>`;
        }
        
        
        const messageText = document.createElement('div');
        messageText.textContent = message;
        
        
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
        
        
        toast.appendChild(icon);
        toast.appendChild(messageText);
        toast.appendChild(closeBtn);
        
        
        toastContainer.appendChild(toast);
        
        
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
            
            
            if (type === 'ping') {
                try {
                    const pingSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
                    pingSound.volume = 0.3;
                    pingSound.play().catch(() => {});
                } catch (e) {
                    
                }
            }
        }, 10);
        
        
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
    
    
    async function handleOffer(data) {
        const { from, offer, userName } = data;
        console.log(`Received offer from ${userName || from}`);
        addLogEntry(`Received offer from ${userName || from}`, 'received');
        
        
        if (!peers[from]) {
            createPeerConnection(from, userName);
        }
        
        const peerConnection = peers[from];
        
        try {
            
            if (peerConnection.signalingState === 'closed') {
                console.error(`Peer connection with ${from} is closed, cannot process offer`);
                return;
            }
            
            
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log(`Set remote description (offer) from ${from}`);
            
            
            const answer = await peerConnection.createAnswer();
            
            
            await peerConnection.setLocalDescription(answer);
            console.log(`Created and set local description (answer) for ${from}`);
            
            
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
    
    
    async function handleAnswer(data) {
        const { from, answer } = data;
        console.log(`Received answer from ${from}`);
        
        
        const peerConnection = peers[from];
        
        if (!peerConnection) {
            console.error(`No peer connection for ${from}`);
            return;
        }
        
        try {
            
            const sessionDescription = new RTCSessionDescription(answer);
            if (peerConnection.signalingState === 'have-local-offer') {
                await peerConnection.setRemoteDescription(sessionDescription);
                console.log(`Successfully set remote description (answer) from ${from}`);
                
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
    
    
    async function handleIceCandidate(data) {
        const { from, candidate, endOfCandidates } = data;
        
        
        const peerConnection = peers[from];
        
        if (!peerConnection) {
            console.log(`No peer connection for ${from}, ignoring ICE candidate`);
            return;
        }
        
        try {
            
            if (endOfCandidates) {
                console.log(`Received end-of-candidates signal from ${from}`);
                return;
            }
            
            if (!candidate) {
                console.log(`Null ICE candidate received from ${from}`);
                return;
            }
            
            
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(`Added ICE candidate from ${from}`);
            
        } catch (error) {
            console.error(`Error handling ICE candidate from ${from}:`, error);
        }
    }
    
    
    function updateDebugInfo(userId, message) {
        const debugElement = document.getElementById(`debug-${userId}`);
        if (debugElement) {
            debugElement.textContent = message;
        }
    }
    
    
    function createPeerConnection(userId, remoteUserName) {
        // Clean up old connection if it exists
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
            logConnectionDebug(`Cleaned up old peer connection for ${userId}`);
        }
        
        logConnectionDebug(`Creating peer connection for ${userId} (${remoteUserName})`);
        showVideoDebugOverlay(userId, "Creating new peer connection", "info");
        
        // Debug container
        const existingContainer = document.getElementById(`container-${userId}`);
        if (existingContainer) {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'absolute top-0 left-0 bg-black bg-opacity-50 text-xs text-white p-1 z-10';
            debugInfo.id = `debug-${userId}`;
            debugInfo.textContent = 'Connecting...';
            existingContainer.appendChild(debugInfo);
        }
        
        // Create the peer connection with STUN/TURN servers
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
        
        // Log peer connection state for debugging
        console.log(`Initial peer connection state for ${userId}:`, {
            signalingState: peerConnection.signalingState,
            connectionState: peerConnection.connectionState,
            iceConnectionState: peerConnection.iceConnectionState,
            iceGatheringState: peerConnection.iceGatheringState
        });
        
        // Modified createOffer to prioritize VP8
        const originalCreateOffer = peerConnection.createOffer;
        peerConnection.createOffer = async function(options) {
            const offer = await originalCreateOffer.apply(this, arguments);
            
            // Modify SDP if needed
            if (offer.sdp) {
                let sdp = offer.sdp;
                
                // Set bandwidth limitation for video
                sdp = sdp.replace(/(m=video.*\r\n)/g, '$1b=AS:2000\r\n');
                
                // Prioritize VP8 codec
                const videoSection = sdp.match(/(m=video.*)((?:\r\n(?=.))(?:.(?!\r\n\r\n))*)/s);
                if (videoSection) {
                    const section = videoSection[0];
                    const lines = section.split('\r\n');
                    
                    // Find VP8 payload types
                    const vp8PayloadTypes = [];
                    const allPayloadTypes = [];
                    const rtpmapLines = [];
                    
                    // Parse codec information
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
                    
                    // Reorder to prioritize VP8
                    if (vp8PayloadTypes.length > 0) {
                        // Modify the m= line to put VP8 first
                        const mLineIndex = lines.findIndex(line => line.startsWith('m=video'));
                        if (mLineIndex >= 0) {
                            const mLine = lines[mLineIndex];
                            const parts = mLine.split(' ');
                            
                            // Keep non-payload parts
                            const nonPayloadParts = parts.slice(0, 3); 
                            const otherPayloadTypes = allPayloadTypes.filter(pt => !vp8PayloadTypes.includes(pt));
                            
                            // New order: prefix + VP8 codecs + other codecs
                            const newMLine = [...nonPayloadParts, ...vp8PayloadTypes, ...otherPayloadTypes].join(' ');
                            lines[mLineIndex] = newMLine;
                            
                            // Update SDP
                            const newSection = lines.join('\r\n');
                            sdp = sdp.replace(section, newSection);
                        }
                    }
                }
                
                offer.sdp = sdp;
                console.log(`Modified SDP offer for ${userId} (set bandwidth and codec priority)`);
            }
            
            return offer;
        };
        
        let iceCandidatesComplete = false;
        let iceCandidatesGathered = 0;
        
        
        peerConnection._connectionTimer = setTimeout(() => {
            if (peerConnection.iceConnectionState !== 'connected' && 
                peerConnection.iceConnectionState !== 'completed') {
                console.log(`Connection to ${userId} is taking too long, attempting ICE restart`);
                updateDebugInfo(userId, 'Connection timeout, restarting...');
                
                
                if (peerConnection.restartIce) {
                    peerConnection.restartIce();
                } else if (peerConnection.onnegotiationneeded) {
                    
                    peerConnection._isNegotiating = false;
                    peerConnection.onnegotiationneeded();
                }
            }
        }, 15000); 
        
        
        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState;
            updateDebugInfo(userId, `ICE: ${state}`);
            console.log(`ICE connection state for ${userId}: ${state}`);
            
            if (state === 'connected' || state === 'completed') {
                
                if (peerConnection._connectionTimer) {
                    clearTimeout(peerConnection._connectionTimer);
                    peerConnection._connectionTimer = null;
                }
                
                
                if (existingContainer) {
                    existingContainer.classList.add('connected');
                }
            }
            
            
            if (state === 'failed' || state === 'disconnected') {
                console.log(`ICE connection failed for ${userId}, attempting restart...`);
                updateDebugInfo(userId, `ICE failed, restarting...`);
                
                
                if (peerConnection._connectionTimer) {
                    clearTimeout(peerConnection._connectionTimer);
                }
                
                
                if (peerConnection.restartIce) {
                    peerConnection.restartIce();
                    
                    
                    peerConnection._connectionTimer = setTimeout(() => {
                        
                        if (peerConnection.iceConnectionState === 'failed' || 
                            peerConnection.iceConnectionState === 'disconnected') {
                            updateDebugInfo(userId, 'Recreating connection...');
                            
                            
                            if (peers[userId]) {
                                peers[userId].close();
                                delete peers[userId];
                                
                                
                                setTimeout(() => {
                                    handleUserJoined({ 
                                        userId: userId, 
                                        userName: remoteUserName 
                                    });
                                }, 1000);
                            }
                        }
                    }, 10000); 
                }
            }
        };
        
        
        peerConnection.onicegatheringstatechange = () => {
            const state = peerConnection.iceGatheringState;
            console.log(`ICE gathering state for ${userId}: ${state}`);
            
            if (state === 'complete') {
                iceCandidatesComplete = true;
                console.log(`ICE gathering complete for ${userId}, gathered ${iceCandidatesGathered} candidates`);
                updateDebugInfo(userId, `Gathered ${iceCandidatesGathered} candidates`);
            }
        };
        
        
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            updateDebugInfo(userId, `Connection: ${state}`);
            console.log(`Connection state for ${userId}: ${state}`);
            
            if (state === 'connected') {
                
                const usernameElement = document.querySelector(`#container-${userId} .username`);
                if (usernameElement) {
                    usernameElement.textContent = remoteUserName || userId;
                }
                
                
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
                
                
                if (peers[userId]) {
                    peers[userId].close();
                    delete peers[userId];
                }
                
                
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
        
        
        peerConnection.onnegotiationneeded = async () => {
            
            if (peerConnection._isNegotiating) return;
            peerConnection._isNegotiating = true;
            
            try {
                
                if (peerConnection.signalingState === 'stable') {
                    updateDebugInfo(userId, 'Negotiating...');
                    
                    
                    const offerOptions = {
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                        iceRestart: peerConnection.iceConnectionState === 'failed'
                    };
                    
                    const offer = await peerConnection.createOffer(offerOptions);
                    
                    
                    if (peerConnection.signalingState === 'stable') {
                        await peerConnection.setLocalDescription(offer);
                        
                        
                        const sendOffer = () => {
                            socket.emit('offer', {
                                offer: peerConnection.localDescription,
                                to: userId,
                                from: socketId,
                                userName: userName
                            });
                        };
                        
                        
                        if (peerConnection.iceGatheringState === 'complete') {
                            sendOffer();
                        } else {
                            
                            const gatheringTimeout = setTimeout(() => {
                                sendOffer();
                            }, 1000);
                            
                            
                            const checkGatheringState = () => {
                                if (peerConnection.iceGatheringState === 'complete') {
                                    clearTimeout(gatheringTimeout);
                                    sendOffer();
                                    return true;
                                }
                                return false;
                            };
                            
                            
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
                
                setTimeout(() => {
                    peerConnection._isNegotiating = false;
                }, 3000);
            }
        };
        
        
        peerConnection.ontrack = (event) => {
            updateDebugInfo(userId, `Received ${event.track.kind} track`);
            console.log(`Track received from ${userId}: `, event.track);
            
            // Log detailed track info for debugging
            console.log(`Track details - kind: ${event.track.kind}, enabled: ${event.track.enabled}, muted: ${event.track.muted}, readyState: ${event.track.readyState}`);
            
            // Handle track state changes
            event.track.onunmute = () => {
                console.log(`Track ${event.track.kind} from ${userId} is now unmuted and should be visible`);
                updateDebugInfo(userId, `${event.track.kind} active`);
                
                // For video tracks, handle video element updates
                if (event.track.kind === 'video') {
                    // Get the video element
                    const existingVideo = document.getElementById(`video-${userId}`);
                    if (existingVideo) {
                        // Try to play if paused
                        if (existingVideo.paused) {
                            playWithUnmuteSequence(existingVideo, userId);
                        }
                        
                        // Hide debug indicator
                        const debugIndicator = document.getElementById(`video-debug-${userId}`);
                        if (debugIndicator) {
                            debugIndicator.style.opacity = '0';
                        }
                    }
                }
                
                // Force refresh the video element to stimulate rendering
                const existingVideo = document.getElementById(`video-${userId}`);
                if (existingVideo && event.track.kind === 'video') {
                    // Apply a small style change to trigger a repaint
                    existingVideo.style.opacity = '0.99';
                    setTimeout(() => {
                        existingVideo.style.opacity = '1';
                    }, 100);
                }
            };
            
            // Handle track ending
            event.track.onended = () => {
                console.log(`Track ${event.track.kind} from ${userId} has ended`);
                
                // Update debug info for video tracks
                if (event.track.kind === 'video') {
                    const debugIndicator = document.getElementById(`video-debug-${userId}`);
                    if (debugIndicator) {
                        debugIndicator.style.opacity = '1';
                        debugIndicator.textContent = 'Video ended';
                    }
                }
            };
            
            // Get the stream from the event
            let remoteStream = event.streams && event.streams.length > 0 ? event.streams[0] : null;
            
            // Create a synthetic stream if no stream was provided
            if (!remoteStream) {
                console.log(`Creating synthetic stream for ${userId} as no stream was provided with the track`);
                remoteStream = new MediaStream();
                remoteStream.addTrack(event.track);
            }
            
            console.log(`Remote stream for ${userId} has ${remoteStream.getTracks().length} tracks`);
            
            // Get or create the video element
            const existingVideo = document.getElementById(`video-${userId}`);
            
            if (existingVideo) {
                // Update existing video element with the new track
                const currentStream = existingVideo.srcObject;
                
                if (currentStream instanceof MediaStream) {
                    // Check if the track already exists
                    const trackExists = currentStream.getTracks().some(t => 
                        t.id === event.track.id || t.kind === event.track.kind
                    );
                    
                    if (!trackExists) {
                        // Remove existing tracks of the same kind to avoid conflicts
                        const existingTracksOfSameKind = currentStream.getTracks()
                            .filter(t => t.kind === event.track.kind);
                        
                        existingTracksOfSameKind.forEach(t => {
                            console.log(`Removing existing ${t.kind} track before adding new one`);
                            currentStream.removeTrack(t);
                        });
                        
                        // Add the new track
                        currentStream.addTrack(event.track);
                        console.log(`Added ${event.track.kind} track to existing stream for ${userId}`);
                        
                        // Special handling for video tracks to check dimensions
                        if (event.track.kind === 'video') {
                            // Set a timeout to check if video dimensions are valid
                            setTimeout(() => {
                                if (existingVideo.videoWidth === 0 || existingVideo.videoHeight === 0) {
                                    console.warn(`Video track added but dimensions still zero for ${userId}`);
                                    showVideoDebugOverlay(userId, "Video has zero dimensions", "warning");
                                    
                                    // Try replacing the entire stream as a fallback
                                    console.log(`Trying to replace entire stream for ${userId}`);
                                    existingVideo.srcObject = remoteStream;
                                    
                                    // Attempt to play the video
                                    playWithUnmuteSequence(existingVideo, userId);
                                } else {
                                    console.log(`Video dimensions: ${existingVideo.videoWidth}x${existingVideo.videoHeight}`);
                                    showVideoDebugOverlay(userId, `Video dimensions: ${existingVideo.videoWidth}x${existingVideo.videoHeight}`, "info");
                                }
                            }, 2000);
                        }
                    } else {
                        console.log(`Track ${event.track.kind} already exists, not adding duplicate`);
                    }
                    
                    // Log current video element state
                    console.log(`Video element state for ${userId}: readyState=${existingVideo.readyState}, paused=${existingVideo.paused}, videoWidth=${existingVideo.videoWidth}, videoHeight=${existingVideo.videoHeight}`);
                    
                    // Make extra effort to ensure video starts playing
                    if (existingVideo.paused) {
                        console.log(`Video is paused for ${userId}, attempting to play...`);
                        playWithUnmuteSequence(existingVideo, userId);
                    }
                } else {
                    // If srcObject is not a MediaStream, replace it
                    console.log(`Replacing invalid stream for ${userId} with new stream`);
                    existingVideo.srcObject = remoteStream;
                    
                    // Try to play the video
                    playWithUnmuteSequence(existingVideo, userId);
                }
            } else {
                // Create new video element if it doesn't exist
                console.log(`Creating new video element for ${userId}`);
                updateRemoteVideo(userId, remoteStream, remoteUserName);
            }
            
            // Debug message in UI to show track was received
            showVideoDebugOverlay(userId, `Received ${event.track.kind} track: ${event.track.readyState}`, "info");
        };
        
        
        if (localStream) {
            try {
                
                console.log(`Adding ${localStream.getTracks().length} local tracks to peer connection for ${userId}`);
                
                localStream.getTracks().forEach(track => {
                    
                    
                    console.log(`Adding track to peer: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`);
                    
                    
                    const sender = peerConnection.addTrack(track, localStream);
                    
                    
                    console.log(`Track ${track.kind} added to peer ${userId}, RTCRtpSender created:`, sender ? 'yes' : 'no');
                    
                    
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
                
            }
        } else {
            console.warn(`Cannot add tracks to peer ${userId} - local stream not initialized`);
            addLogEntry(`Warning: Local media not available, can receive but not send video`, 'warning');
        }
        
        peers[userId] = peerConnection;
        return peerConnection;
    }
    
    
    function playWithUnmuteSequence(videoElement, userId) {
        if (!videoElement) {
            console.error(`Cannot play video for ${userId}: video element not found`);
            return;
        }
        
        console.log(`Attempting to play video for ${userId}`);
        
        // Some browsers need a user gesture simulation
        simulateUserGesture(() => {
            // First try regular play
            videoElement.play()
                .then(() => {
                    console.log(`Video playing successfully for ${userId}`);
                    showVideoDebugOverlay(userId, "Video playing", "success");
                })
                .catch(error => {
                    console.warn(`Initial play failed for ${userId}: ${error}`);
                    showVideoDebugOverlay(userId, `Play failed: ${error.message}`, "warning");
                    
                    // Try with a timeout
                    setTimeout(() => {
                        videoElement.play()
                            .then(() => console.log(`Delayed play succeeded for ${userId}`))
                            .catch(e => {
                                console.error(`Delayed play also failed for ${userId}: ${e}`);
                                
                                // Last resort: try muting first then unmuting after playing
                                videoElement.muted = true;
                                videoElement.play()
                                    .then(() => {
                                        console.log(`Muted play succeeded for ${userId}, will unmute shortly`);
                                        // Unmute after playing starts
                                        setTimeout(() => {
                                            videoElement.muted = false;
                                            console.log(`Unmuted video for ${userId} after autoplay`);
                                        }, 1000);
                                    })
                                    .catch(finalError => {
                                        console.error(`All play attempts failed for ${userId}`);
                                        // Add a manual play button as fallback
                                        addImprovedPlayButton(videoElement, userId);
                                    });
                            });
                    }, 500);
                });
        });
        
        // Set up monitoring for the video element
        monitorVideoPlayback(videoElement, userId);
    }
    
    
    function simulateUserGesture(callback) {
        // This function simulates a user gesture to allow autoplay
        console.log("Simulating user gesture for autoplay");
        
        // Create a temporary button that we'll click programmatically
        const tempButton = document.createElement('button');
        tempButton.style.display = 'none';
        document.body.appendChild(tempButton);
        
        // Create and dispatch click events
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        
        // Listen for the click and execute callback
        tempButton.addEventListener('click', function handleClick() {
            tempButton.removeEventListener('click', handleClick);
            document.body.removeChild(tempButton);
            
            // Execute the callback after the "user gesture"
            if (typeof callback === 'function') {
                callback();
            }
        });
        
        // Dispatch the click event
        tempButton.dispatchEvent(clickEvent);
    }
    
    
    function monitorVideoPlayback(videoElement, userId) {
        if (!videoElement) return;
        
        let blackFrameCount = 0;
        let lastWidth = videoElement.videoWidth;
        let lastHeight = videoElement.videoHeight;
        
        const monitor = setInterval(() => {
            
            if (!document.contains(videoElement)) {
                clearInterval(monitor);
                return;
            }
            
            
            if (videoElement.paused) {
                showVideoDebugOverlay(userId, "Video playback paused unexpectedly", "error");
                
                
                videoElement.play().catch(e => {
                    showVideoDebugOverlay(userId, `Cannot resume: ${e.message}`, "error");
                });
            }
            
            
            if (lastWidth !== videoElement.videoWidth || lastHeight !== videoElement.videoHeight) {
                if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                    showVideoDebugOverlay(userId, "Video dimensions changed to 0x0", "error");
                } else {
                    showVideoDebugOverlay(userId, `Video dimensions changed to ${videoElement.videoWidth}x${videoElement.videoHeight}`, "info");
                }
                
                lastWidth = videoElement.videoWidth;
                lastHeight = videoElement.videoHeight;
            }
            
            
            const stream = videoElement.srcObject;
            if (stream) {
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length === 0) {
                    showVideoDebugOverlay(userId, "Video tracks have been removed", "error");
                } else {
                    
                    videoTracks.forEach(track => {
                        if (track.readyState !== 'live') {
                            showVideoDebugOverlay(userId, `Track state changed to ${track.readyState}`, "error");
                        }
                    });
                }
            } else {
                showVideoDebugOverlay(userId, "Video srcObject has been removed", "error");
            }
            
            
            if (++blackFrameCount > 10) {
                clearInterval(monitor);
            }
        }, 3000);
    }
    
    
    
    
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
        
        
        let bgColor = 'bg-yellow-600';
        if (type === 'error') bgColor = 'bg-red-600';
        if (type === 'info') bgColor = 'bg-blue-600';
        if (type === 'success') bgColor = 'bg-green-600';
        
        
        const msgElement = document.createElement('div');
        msgElement.className = `${bgColor} bg-opacity-90 mb-1 p-1 rounded`;
        msgElement.textContent = message;
        
        
        overlay.appendChild(msgElement);
        
        
        setTimeout(() => {
            if (msgElement.parentNode) {
                msgElement.parentNode.removeChild(msgElement);
            }
        }, 10000);
        
        
        console.log(`[VIDEO DEBUG] ${userId}: ${message}`);
    }
    
    
    function setupVideoAnalyzer(videoElement, userId) {
        
        if (window.WebRTCDebug && typeof window.WebRTCDebug.setupAnalyzer === 'function') {
            window.WebRTCDebug.setupAnalyzer(videoElement, userId);
        } else {
            console.error('WebRTCDebug setupAnalyzer function not available');
        }
    }
    
    
    function addImprovedPlayButton(videoElement, userId) {
        if (!videoElement) return;
        
        // Check if container exists
        const videoContainer = videoElement.closest('.remote-video-container') || videoElement.parentElement;
        if (!videoContainer) return;
        
        // Remove any existing play buttons
        const existingButton = videoContainer.querySelector('.play-button-overlay');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Create button container
        const playButtonOverlay = document.createElement('div');
        playButtonOverlay.className = 'play-button-overlay absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30';
        
        // Create the button with better visibility
        const playButton = document.createElement('button');
        playButton.className = 'w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center';
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `;
        
        // Add explanatory text
        const textElement = document.createElement('div');
        textElement.className = 'absolute bottom-8 text-white text-center w-full px-4';
        textElement.textContent = 'Click to play video (browser blocked autoplay)';
        
        // Add elements to overlay
        playButtonOverlay.appendChild(playButton);
        playButtonOverlay.appendChild(textElement);
        videoContainer.appendChild(playButtonOverlay);
        
        // Add click event
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`Manual play button clicked for ${userId}`);
            
            // Try to play the video
            videoElement.play()
                .then(() => {
                    console.log(`Manual play succeeded for ${userId}`);
                    // Remove the play button overlay on success
                    playButtonOverlay.remove();
                })
                .catch(error => {
                    console.error(`Manual play failed for ${userId}: ${error}`);
                    
                    // Try with muted option as fallback
                    const wasMuted = videoElement.muted;
                    videoElement.muted = true;
                    
                    videoElement.play()
                        .then(() => {
                            console.log(`Muted play succeeded for ${userId}`);
                            
                            // Update UI to show video is muted
                            textElement.textContent = 'Video is muted due to browser restrictions. Click to unmute.';
                            playButton.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                </svg>
                            `;
                            
                            // Change click handler to unmute
                            playButton.onclick = function(e) {
                                e.stopPropagation();
                                videoElement.muted = false;
                                playButtonOverlay.remove();
                                showVideoDebugOverlay(userId, "Video unmuted by user", "success");
                            };
                        })
                        .catch(finalError => {
                            console.error(`All play attempts failed for ${userId}`);
                            textElement.textContent = 'Unable to play video. Please try again later.';
                        });
                });
        });
        
        return playButtonOverlay;
    }
});

