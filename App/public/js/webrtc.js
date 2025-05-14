




const socket = io('https:
  path: '/socket.io/',
  transports: ['websocket'],
  secure: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000
});


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
    let socket = null;
    let socketId = null;
    const peers = {};
    
    
    const GLOBAL_ROOM = 'global-video-chat';
    
    
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    const pingBtn = document.getElementById('pingBtn');
    const hangupBtn = document.getElementById('hangupBtn');
    
    
    let debugMode = true; 
    
    
    console.log('Running browser compatibility check...');
    
    const browserCompat = window.WebRTCCompat.check();
    console.log('Browser compatibility check:', browserCompat);
    
    
    testServerConnectivity();
    
    
    function testServerConnectivity() {
        
        addLogEntry('Testing connectivity to marvelcollin.my.id...', 'info');
        
        
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
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        logEntries.appendChild(entry);
        
        
        socketLogs.scrollTop = socketLogs.scrollHeight;
        
        
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
        
        
        const debugContainer = document.createElement('div');
        debugContainer.className = 'text-xs text-gray-500 hidden';
        debugContainer.textContent = `[${timestamp.split('T')[1].split('.')[0]}] ${message}`;
        
        
        const debugArea = document.querySelector('#connectionStatus');
        if (debugArea) {
            debugArea.appendChild(debugContainer);
            
            
            const debugMessages = debugArea.querySelectorAll('.text-gray-500');
            if (debugMessages.length > 10) {
                debugArea.removeChild(debugMessages[0]);
            }
        }
    }
    
    
    function connectToSignalingServer() {
        updateConnectionStatus('connecting');
        
        
        const remoteUrl = 'https:
        logConnectionDebug(`Attempting to connect to signaling server at ${remoteUrl}...`);
        
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
            path: '/socket.io/',
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
        
        
        setupSocketEventHandlers();
    }
    
    
    function setupSocketEventHandlers() {
        
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
            
            
            addLogEntry(`Socket Details - Transport: ${socket.io.engine.transport.name}`, 'info');
            console.log('Socket Connection Details:', {
                id: socket.id,
                connected: socket.connected,
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
        playButton.innerHTML = '<svg xmlns="http:
        
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
        console.log(`Received global users: ${users.length}`);
        
        
        const usernameMap = new Map();
        
        
        usernameMap.set(userName.replace(' (You)', ''), socketId);
        
        
        const currentParticipants = Array.from(document.querySelectorAll('.participant-item'))
            .map(el => el.id.replace('participant-', ''));
        
        
        const validUserIds = [];
        
        
        users.forEach(user => {
            
            validUserIds.push(user.userId);
            
            
            const cleanUsername = (user.userName || '').replace(' (You)', '');
            
            
            if (cleanUsername === userName.replace(' (You)', '') && user.userId !== socketId) {
                console.log(`Found duplicate user with our username: ${cleanUsername}, ID: ${user.userId}`);
                
                return;
            }
            
            
            usernameMap.set(cleanUsername, user.userId);
        });
        
        
        if (!validUserIds.includes(socketId)) {
            validUserIds.push(socketId);
        }
        
        console.log(`Current participants: ${currentParticipants.length}, Valid users: ${validUserIds.length}`);
        
        
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
        
        
        const userEls = document.querySelectorAll('.participant-item');
        userEls.forEach(el => {
            const id = el.id.replace('participant-', '');
            const nameEl = el.querySelector('.participant-name');
            if (nameEl) {
                
                const displayedName = nameEl.textContent.replace(' (You)', '');
                const expectedId = usernameMap.get(displayedName);
                
                
                if (expectedId && expectedId !== id) {
                    console.log(`Removing duplicate participant with username ${displayedName}`);
                    removeParticipantItem(id);
                }
            }
        });
        
        
        if (!document.getElementById(`participant-${socketId}`)) {
            addParticipantItem(socketId, userName + ' (You)');
        }
        
        
        users.forEach(user => {
            
            if (user.userId === socketId || 
                (user.userName && user.userName.replace(' (You)', '') === userName.replace(' (You)', ''))) {
                return;
            }
            
            
            addParticipantItem(user.userId, user.userName || `User_${user.userId.substring(0, 4)}`);
            
            
            if (!peers[user.userId]) {
                console.log(`Creating new peer connection for ${user.userId}`);
                const peerConnection = createPeerConnection(user.userId, user.userName);
                
                
                updateRemoteVideo(user.userId, null, user.userName || `User_${user.userId.substring(0, 4)}`);
            }
        });
    }
    
    
    function handleError(data) {
        console.error(`Server error: ${data.message}`);
        addLogEntry(`Server error: ${data.message}`, 'error');
    }
    
    
    function updateRemoteVideo(userId, stream, userName) {
        
        let container = document.getElementById(`container-${userId}`);
        let video;
        
        if (!container) {
            
            container = document.createElement('div');
            container.id = `container-${userId}`;
            container.className = 'remote-video-container relative rounded overflow-hidden bg-gray-800';
            
            
            video = document.createElement('video');
            video.id = `video-${userId}`;
            video.className = 'w-full h-full object-cover';
            video.autoplay = true;
            video.playsInline = true;
            video.muted = false; 
            video.setAttribute('playsinline', ''); 
            video.setAttribute('webkit-playsinline', ''); 
            
            
            const debugIndicator = document.createElement('div');
            debugIndicator.className = 'absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 transition-opacity duration-300';
            debugIndicator.id = `video-debug-${userId}`;
            debugIndicator.textContent = 'No video';
            
            
            const usernameOverlay = document.createElement('div');
            usernameOverlay.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-sm';
            usernameOverlay.innerHTML = `<span class="username">${userName || 'Connecting...'}</span>`;
            
            
            container.appendChild(video);
            container.appendChild(debugIndicator);
            container.appendChild(usernameOverlay);
            
            
            const connectionStatusIndicator = document.createElement('div');
            connectionStatusIndicator.className = 'absolute top-0 left-0 p-1 z-10';
            connectionStatusIndicator.innerHTML = `
                <div class="px-2 py-1 bg-yellow-500 text-white text-xs rounded-br-md">
                    <span id="connection-status-${userId}">Connecting...</span>
                </div>
            `;
            container.appendChild(connectionStatusIndicator);
            
            
            const actionButtons = document.createElement('div');
            actionButtons.className = 'absolute top-0 right-0 p-1 flex gap-1 z-10';
            actionButtons.innerHTML = `
                <button class="refresh-video-btn p-1 bg-blue-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Refresh Video">
                    <svg xmlns="http:
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
                <button class="resubscribe-btn p-1 bg-green-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Resubscribe">
                    <svg xmlns="http:
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
            `;
            container.appendChild(actionButtons);
            
            
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
                        
                        if (peers[userId]) {
                            showVideoDebugOverlay(userId, "Closing existing peer connection", "info");
                            peers[userId].close();
                            delete peers[userId];
                            
                            
                            showVideoDebugOverlay(userId, "Creating new peer connection", "info");
                            createPeerConnection(userId, userName);
                        }
                    });
                }
            }, 100);
            
            
            videoGrid.appendChild(container);
            
            
            video.addEventListener('canplay', () => {
                console.log(`Video can play for ${userId}`);
                debugIndicator.style.opacity = '0';
                
                
                const statusEl = document.getElementById(`connection-status-${userId}`);
                if (statusEl) {
                    statusEl.textContent = 'Connected';
                    statusEl.parentElement.classList.remove('bg-yellow-500');
                    statusEl.parentElement.classList.add('bg-green-500');
                    
                    
                    setTimeout(() => {
                        statusEl.parentElement.style.opacity = '0';
                    }, 5000);
                }
            });
            
            video.addEventListener('playing', () => {
                console.log(`Video is playing for ${userId}`);
                debugIndicator.style.opacity = '0';
                
                
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
        
        
        if (stream && video) {
            showVideoDebugOverlay(userId, `Setting new stream with ${stream.getTracks().length} tracks`, "info");
            
            
            stream.getTracks().forEach(track => {
                showVideoDebugOverlay(userId, `Track: ${track.kind}, state: ${track.readyState}, enabled: ${track.enabled}`, "info");
            });
            
            video.srcObject = stream;
            
            
            playWithUnmuteSequence(video, userId);
        } else if (video && !video.srcObject) {
            showVideoDebugOverlay(userId, "No stream available yet", "warning");
            
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
            
            icon.innerHTML = `<svg xmlns="http:
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>`;
        } else if (type === 'error') {
            icon.innerHTML = `<svg xmlns="http:
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        } else {
            icon.innerHTML = `<svg xmlns="http:
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
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
        
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
            logConnectionDebug(`Cleaned up old peer connection for ${userId}`);
        }
        
        logConnectionDebug(`Creating peer connection for ${userId} (${remoteUserName})`);
        showVideoDebugOverlay(userId, "Creating new peer connection", "info");
        
        
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
        
        
        const originalCreateOffer = peerConnection.createOffer;
        peerConnection.createOffer = async function(options) {
            const offer = await originalCreateOffer.apply(this, arguments);
            
            
            if (offer.sdp) {
                let sdp = offer.sdp;
                
                
                sdp = sdp.replace(/(m=video.*\r\n)/g, '$1b=AS:2000\r\n');
                
                
                const videoSection = sdp.match(/(m=video.*)((?:\r\n(?=.))(?:.(?!\r\n\r\n))*)/s);
                if (videoSection) {
                    const section = videoSection[0];
                    const lines = section.split('\r\n');
                    
                    
                    const vp8PayloadTypes = [];
                    const allPayloadTypes = [];
                    const rtpmapLines = [];
                    
                    
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
                    
                    
                    if (vp8PayloadTypes.length > 0) {
                        
                        const mLineIndex = lines.findIndex(line => line.startsWith('m=video'));
                        if (mLineIndex >= 0) {
                            const mLine = lines[mLineIndex];
                            const parts = mLine.split(' ');
                            
                            
                            const nonPayloadParts = parts.slice(0, 3); 
                            const otherPayloadTypes = allPayloadTypes.filter(pt => !vp8PayloadTypes.includes(pt));
                            
                            
                            const newMLine = [...nonPayloadParts, ...vp8PayloadTypes, ...otherPayloadTypes].join(' ');
                            lines[mLineIndex] = newMLine;
                            
                            
                            const newSection = lines.join('\r\n');
                            sdp = sdp.replace(section, newSection);
                        }
                    }
                }
                
                offer.sdp = sdp;
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
            
            
            console.log(`Track details - kind: ${event.track.kind}, enabled: ${event.track.enabled}, muted: ${event.track.muted}, readyState: ${event.track.readyState}`);
            
            
            event.track.onunmute = () => {
                console.log(`Track ${event.track.kind} from ${userId} is now unmuted and should be visible`);
                updateDebugInfo(userId, `${event.track.kind} active`);
                
                
                if (event.track.kind === 'video') {
                    
                    const existingVideo = document.getElementById(`video-${userId}`);
                    if (existingVideo) {
                        
                        if (existingVideo.paused) {
                            playWithUnmuteSequence(existingVideo, userId);
                        }
                        
                        
                        const debugIndicator = document.getElementById(`video-debug-${userId}`);
                        if (debugIndicator) {
                            debugIndicator.style.opacity = '0';
                        }
                    }
                }
            };
            
            
            event.track.onended = () => {
                console.log(`Track ${event.track.kind} from ${userId} has ended`);
                
                
                if (event.track.kind === 'video') {
                    const debugIndicator = document.getElementById(`video-debug-${userId}`);
                    if (debugIndicator) {
                        debugIndicator.style.opacity = '1';
                        debugIndicator.textContent = 'Video ended';
                    }
                }
            };
            
            
            let remoteStream = event.streams && event.streams.length > 0 ? event.streams[0] : null;
            
            if (!remoteStream) {
                
                console.log(`Creating synthetic stream for ${userId} as no stream was provided with the track`);
                remoteStream = new MediaStream();
                remoteStream.addTrack(event.track);
            }
            
            
            console.log(`Remote stream for ${userId} has ${remoteStream.getTracks().length} tracks`);
            
            
            const existingVideo = document.getElementById(`video-${userId}`);
            
            if (existingVideo) {
                
                const currentStream = existingVideo.srcObject;
                
                if (currentStream instanceof MediaStream) {
                    
                    const trackExists = currentStream.getTracks().some(t => 
                        t.id === event.track.id || t.kind === event.track.kind
                    );
                    
                    if (!trackExists) {
                        
                        const existingTracksOfSameKind = currentStream.getTracks()
                            .filter(t => t.kind === event.track.kind);
                        
                        existingTracksOfSameKind.forEach(t => currentStream.removeTrack(t));
                        
                        
                        currentStream.addTrack(event.track);
                        console.log(`Added ${event.track.kind} track to existing stream for ${userId}`);
                        
                        
                        if (event.track.kind === 'video') {
                            
                            setTimeout(() => {
                                if (existingVideo.videoWidth === 0 || existingVideo.videoHeight === 0) {
                                    console.warn(`Video track added but dimensions still zero for ${userId}`);
                                    
                                    
                                    console.log(`Trying to replace entire stream for ${userId}`);
                                    existingVideo.srcObject = remoteStream;
                                    
                                    playWithUnmuteSequence(existingVideo, userId);
                                }
                            }, 2000);
                        }
                    }
                    
                    
                    console.log(`Video element state for ${userId}: readyState=${existingVideo.readyState}, paused=${existingVideo.paused}, videoWidth=${existingVideo.videoWidth}, videoHeight=${existingVideo.videoHeight}`);
                    
                    
                    if (event.track.kind === 'video') {
                        
                        const trackRef = event.track;
                        
                        
                        const statsInterval = setInterval(async () => {
                            
                            if (!peers[userId] || peers[userId].connectionState === 'closed') {
                                console.log(`Clearing stats interval for ${userId} - peer connection gone or closed`);
                                clearInterval(statsInterval);
                                return;
                            }
                            
                            try {
                                
                                const stats = await peers[userId].getStats(null);
                                let hasVideoData = false;
                                
                                
                                stats.forEach(stat => {
                                    if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                                        hasVideoData = true;
                                        console.log(`${userId} video stats: framesReceived=${stat.framesReceived}, framesDecoded=${stat.framesDecoded}, packetsLost=${stat.packetsLost}`);
                                        
                                        
                                        if (stat.framesReceived > 0 && stat.framesDecoded === 0) {
                                            console.warn(`Potential black screen issue detected: frames received but not decoded`);
                                            
                                            
                                            const debugIndicator = document.getElementById(`video-debug-${userId}`);
                                            if (debugIndicator) {
                                                debugIndicator.style.opacity = '1';
                                                debugIndicator.textContent = 'Not decoding frames';
                                            }
                                            
                                            
                                            console.log(`Attempting to fix black screen by replacing stream for ${userId}`);
                                            existingVideo.srcObject = new MediaStream([trackRef]);
                                            playWithUnmuteSequence(existingVideo, userId);
                                        } else if (stat.framesReceived > 0 && stat.framesDecoded > 0) {
                                            
                                            const debugIndicator = document.getElementById(`video-debug-${userId}`);
                                            if (debugIndicator) {
                                                debugIndicator.style.opacity = '0';
                                            }
                                        }
                                    }
                                });
                                
                                if (!hasVideoData) {
                                    
                                    const videoTracks = currentStream.getVideoTracks();
                                    if (videoTracks.length > 0) {
                                        console.warn(`No video statistics available for ${userId} despite having ${videoTracks.length} video tracks`);
                                    } else {
                                        console.log(`No video tracks currently available for ${userId}`);
                                    }
                                }
                            } catch (e) {
                                
                                console.warn(`Error getting stats for ${userId}: ${e.message}`);
                                
                                
                                if (e.message.includes('no sender or receiver')) {
                                    console.log(`Track no longer available, stopping stats monitoring for ${userId}`);
                                    clearInterval(statsInterval);
                                }
                            }
                        }, 5000); 
                    }
                    
                    
                    if (currentStream.getVideoTracks().length > 0) {
                        if (existingVideo.paused) {
                            console.log(`Video is paused for ${userId}, attempting to play...`);
                            playWithUnmuteSequence(existingVideo, userId);
                        }
                    }
                } else {
                    
                    console.log(`Replacing invalid stream for ${userId} with new stream`);
                    existingVideo.srcObject = remoteStream;
                    
                    
                    playWithUnmuteSequence(existingVideo, userId);
                }
            } else {
                
                console.log(`Creating new video element for ${userId}`);
                updateRemoteVideo(userId, remoteStream, remoteUserName);
            }
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
        
        if (window.WebRTCPlayer && typeof window.WebRTCPlayer.playWithUnmuteSequence === 'function') {
            window.WebRTCPlayer.playWithUnmuteSequence(videoElement, userId);
        } else {
            console.error('WebRTCPlayer module function not available');
        }
    }
    
    
    function simulateUserGesture(callback) {
        
        if (window.WebRTCPlayer && typeof window.WebRTCPlayer.simulateUserGesture === 'function') {
            window.WebRTCPlayer.simulateUserGesture(callback);
        } else {
            console.error('WebRTCPlayer simulateUserGesture function not available');
        }
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
        
        if (window.WebRTCPlayer && typeof window.WebRTCPlayer.addImprovedPlayButton === 'function') {
            window.WebRTCPlayer.addImprovedPlayButton(videoElement, userId);
        } else {
            console.error('WebRTCPlayer addImprovedPlayButton function not available');
        }
    }
});

