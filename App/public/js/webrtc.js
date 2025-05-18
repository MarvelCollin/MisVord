let socket = null;
let socketId = null; // Our own socket ID

const permissionRequest = document.getElementById('permissionRequest');
const permissionStatus = document.getElementById('permissionStatus');
const retryPermissionBtn = document.getElementById('retryPermissionBtn');
const audioOnlyBtn = document.getElementById('audioOnlyBtn');
const retryConnection = document.getElementById('retryConnection'); // Ensure this exists or handle if not
const videoGrid = document.getElementById('videoGrid');
const localVideo = document.getElementById('localVideo');
const participantsList = document.getElementById('participantsList');

// Connection status UI (ensure these elements exist in your HTML)
const connectionStatusUI = document.getElementById('connectionStatus'); // Main container for status
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Control Buttons
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleScreenBtn = document.getElementById('toggleScreenBtn');
const hangupBtn = document.getElementById('hangupBtn');
// const pingBtn = document.getElementById('pingBtn'); // Removed for simplification, can be added back

// Logging UI (ensure these elements exist if you use the addLogEntry function)
const socketLogs = document.getElementById('socketLogs');
const logEntries = document.getElementById('logEntries');
const toggleLogsBtn = document.getElementById('toggleLogs'); // Renamed from toggleLogs
const clearLogsBtn = document.getElementById('clearLogs'); // Renamed from clearLogs

let localStream = null;
let screenStream = null;
let isScreenSharing = false;
let isVideoEnabled = true;
let isAudioEnabled = true;
let userName = 'User_' + Math.floor(Math.random() * 10000); // Simple default username
const peers = {}; // { peerSocketId: RTCPeerConnection }

const VIDEO_CHAT_ROOM = 'global-video-chat'; // Matches server
window.debugMode = window.debugMode ?? true; // Prevent redeclaration and ensure global

// --- Enhanced Debugging Configuration ---
const DEBUG_SOCKET_EVENTS = true;
const DEBUG_PEER_CONNECTIONS = true;
const DEBUG_USER_TRACKING = true;

// --- Expanded Logging Utility ---
function addLogEntry(message, type = 'info') {
    // Browser console color coding
    const colorMap = {
        info: 'color: #17a2b8;',
        error: 'color: #dc3545; font-weight: bold;',
        success: 'color: #28a745;',
        warn: 'color: #ffc107;',
        debug: 'color: #6f42c1;',
        system: 'color: #007bff;',
        socket: 'color: #20c997;',
        signal: 'color: #fd7e14;',
        ui: 'color: #6610f2;',
        rawsocket: 'color: #343a40;',
        user: 'color: #e83e8c; font-weight: bold;', // New type for user tracking
        peer: 'color: #6610f2; font-weight: bold;', // New type for peer connections
        ping: 'color: #FF9500; font-weight: bold;', // New type for ping system
    };
    const style = colorMap[type] || '';
    // Log to browser console
    if (type === 'error') {
        console.error(`%c[${type.toUpperCase()}] ${message}`, style);
    } else if (type === 'warn') {
        console.warn(`%c[${type.toUpperCase()}] ${message}`, style);
    } else if (type === 'success') {
        console.log(`%c[${type.toUpperCase()}] ${message}`, style);
    } else if (type === 'debug') {
        console.debug(`%c[${type.toUpperCase()}] ${message}`, style);
    } else {
        console.log(`%c[${type.toUpperCase()}] ${message}`, style);
    }
    // Log to UI
    if (!logEntries) return;
    const entry = document.createElement('div');
    entry.className = `log-entry type-${type}`;
    entry.innerHTML = `<strong>[${type.toUpperCase()}]</strong> ${new Date().toLocaleTimeString()}: ${message}`;
    logEntries.appendChild(entry);
    if (socketLogs) socketLogs.scrollTop = socketLogs.scrollHeight;
}

// --- UI Update Functions ---
function updateConnectionStatus(status, text) {
    if (!connectionStatusUI || !statusIndicator || !statusText) return;
    addLogEntry(`Connection status: ${status} - ${text}`, 'system');
    
    statusIndicator.className = 'status-indicator'; // Reset classes
    if (status === 'connected') {
        statusIndicator.classList.add('connected');
    } else if (status === 'connecting') {
        statusIndicator.classList.add('connecting');
    } else {
        statusIndicator.classList.add('disconnected');
    }
    statusText.textContent = text;
    connectionStatusUI.style.display = 'flex'; // Make sure it's visible
}

function updateParticipantsList(currentPeers) {
    if (!participantsList) {
        addLogEntry("participantsList element not found in DOM!", 'error');
        return;
    }
    
    participantsList.innerHTML = '';
    const peerCount = Object.keys(currentPeers).length;
    addLogEntry(`Updating participants list UI. Current peers: ${peerCount}`, 'user');


    // DEBUG: Log the current user and all peers
    if (DEBUG_USER_TRACKING) {
        console.log('%c[PARTICIPANTS] Local user:', 'color: #007bff; font-weight: bold;', {
            userName,
            socketId,
            browserInfo: navigator.userAgent
        });
        console.log('%c[PARTICIPANTS] Peers listing:', 'color: #6610f2; font-weight: bold;', currentPeers);
        console.table(Object.entries(currentPeers).map(([id, peer]) => ({
            id,
            userName: peer.userName || 'Unknown',
            connectionState: peer.pc ? peer.pc.connectionState : 'No connection',
            iceState: peer.pc ? peer.pc.iceConnectionState : 'No connection'
        })));
    }

    // Always show local user at the top
    const selfItem = document.createElement('div');
    selfItem.className = 'participant-item flex items-center p-2 bg-blue-900 rounded mb-1';
    selfItem.id = 'participant-self';
    const selfAvatar = document.createElement('div');
    selfAvatar.className = 'participant-avatar w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2';
    selfAvatar.textContent = (userName || 'Me').substring(0, 2).toUpperCase();
    const selfNameSpan = document.createElement('span');
    selfNameSpan.className = 'text-sm font-bold';
    selfNameSpan.textContent = userName + ' (You)';
    selfItem.appendChild(selfAvatar);
    selfItem.appendChild(selfNameSpan);
    participantsList.appendChild(selfItem);

    // Then show all remote peers
    let count = 1;
    for (const peerSocketId in currentPeers) {
        const peerData = currentPeers[peerSocketId];
        if (peerData && peerData.userName) {
            const participantItem = document.createElement('div');
            participantItem.className = 'participant-item flex items-center p-2 hover:bg-gray-700 rounded';
            participantItem.id = `participant-${peerSocketId}`;

            const avatar = document.createElement('div');
            avatar.className = 'participant-avatar w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2';
            avatar.textContent = peerData.userName.substring(0, 2).toUpperCase();

            const nameSpan = document.createElement('span');
            nameSpan.className = 'text-sm';
            nameSpan.textContent = peerData.userName;
            
            // Add connection status indicator
            const statusDot = document.createElement('div');
            statusDot.className = 'w-2 h-2 rounded-full ml-2';
            
            const connectionState = peerData.pc ? peerData.pc.connectionState : 'unknown';
            if (connectionState === 'connected') {
                statusDot.classList.add('bg-green-500'); // Connected - green
            } else if (connectionState === 'connecting' || connectionState === 'new') {
                statusDot.classList.add('bg-yellow-500'); // Connecting - yellow
            } else {
                statusDot.classList.add('bg-red-500'); // Problem - red
            }
            
            participantItem.appendChild(avatar);
            participantItem.appendChild(nameSpan);
            participantItem.appendChild(statusDot);
            participantsList.appendChild(participantItem);
            count++;
            
            addLogEntry(`Added participant to UI: ${peerData.userName} (${peerSocketId}), state: ${connectionState}`, 'user');
        } else {
            addLogEntry(`Skipped adding peer ${peerSocketId} to UI - missing userName`, 'warn');
        }
    }
    if (count === 1) {
        const noUsersItem = document.createElement('div');
        noUsersItem.className = 'text-gray-400 text-sm p-2';
        noUsersItem.textContent = 'You are the only one here.';
        participantsList.appendChild(noUsersItem);
        addLogEntry('No other participants to show', 'user');
    } else {
        addLogEntry(`Successfully displayed ${count-1} participants`, 'user');
    }
}


// --- WebRTC Core Functions ---

// Initialize Local Media
async function initLocalStream(audio = true, video = true) {
    try {
        addLogEntry(`Requesting media: Audio=${audio}, Video=${video}`, 'media');
        const constraints = {
            audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
            video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        };
        
        // Stop existing tracks before getting new stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true; // Mute local video to prevent echo
            localVideo.play().catch(e => addLogEntry(`Local video play error: ${e.message}`, 'error'));
        }
        
        isVideoEnabled = video;
        isAudioEnabled = audio;
        updateMediaToggleButtons();
        addLogEntry('Local stream initialized successfully.', 'media');
        return true;
    } catch (error) {
        addLogEntry(`Error initializing local stream: ${error.name} - ${error.message}`, 'error');
        if (permissionStatus) {
            permissionStatus.textContent = `Error: ${error.message}. Please check permissions.`;
            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
        }
        return false;
    }
}

// Toggle Local Video
function toggleLocalVideo() {
    if (!localStream) return;
    isVideoEnabled = !isVideoEnabled;
    localStream.getVideoTracks().forEach(track => track.enabled = isVideoEnabled);
    updateMediaToggleButtons();
    // Notify peers if necessary (e.g., to show a "camera off" icon) - advanced feature
    addLogEntry(`Video ${isVideoEnabled ? 'enabled' : 'disabled'}`, 'media');
}

// Toggle Local Audio
function toggleLocalAudio() {
    if (!localStream) return;
    isAudioEnabled = !isAudioEnabled;
    localStream.getAudioTracks().forEach(track => track.enabled = isAudioEnabled);
    updateMediaToggleButtons();
    addLogEntry(`Audio ${isAudioEnabled ? 'enabled' : 'disabled'}`, 'media');
}

function updateMediaToggleButtons() {
    if (toggleVideoBtn) {
        toggleVideoBtn.innerHTML = isVideoEnabled ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>' : // Camera On
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7C3.732 7.943 7.522 5 12 5c1.74 0 3.364.508 4.773 1.382m1.215 1.215L12 12m6-6l-6 6m-3-3l6 6m1-13l-16 16"/></svg>'; // Camera Off (example with slash)
        toggleVideoBtn.classList.toggle('active', isVideoEnabled);
        toggleVideoBtn.classList.toggle('inactive', !isVideoEnabled);

    }
    if (toggleAudioBtn) {
        toggleAudioBtn.innerHTML = isAudioEnabled ?
             '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>' : // Mic On
             '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.586 15.586L8.414 8.414m5.172-5.172a7.004 7.004 0 00-9.9 0L2.207 4.707a1 1 0 000 1.414l14.142 14.142a1 1 0 001.414 0l1.485-1.485a7.004 7.004 0 000-9.9l-1.485-1.485zM12 4L9.91 6.09 12 8.18V4z"/></svg>'; // Mic Off (example with slash)
        toggleAudioBtn.classList.toggle('active', isAudioEnabled);
        toggleAudioBtn.classList.toggle('inactive', !isAudioEnabled);
    }
}


// Screen Sharing
async function toggleScreenSharing() {
    if (!localStream) {
        addLogEntry("Local stream not available to start screen sharing.", "warn");
        return;
    }

    if (isScreenSharing) {
        // Stop screen sharing, revert to camera
        addLogEntry("Stopping screen sharing.", 'media');
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
        isScreenSharing = false;
        
        // Restore camera stream to peers
        for (const peerId in peers) {
            const pc = peers[peerId].pc; // Assuming peers[peerId] is an object {pc: RTCPeerConnection, userName: ...}
            if (pc) {
                const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (videoSender && localStream.getVideoTracks().length > 0) {
                    videoSender.replaceTrack(localStream.getVideoTracks()[0]);
                }
            }
        }
        if (localVideo) localVideo.srcObject = localStream; // Show local camera again
        if (toggleScreenBtn) toggleScreenBtn.classList.remove('active');

    } else {
        // Start screen sharing
        try {
            addLogEntry("Attempting to start screen sharing.", 'media');
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); // Can request audio too
            
            if (localVideo) localVideo.srcObject = screenStream; // Show screen share locally
            isScreenSharing = true;

            // Replace video track for all peers
            for (const peerId in peers) {
                 const pc = peers[peerId].pc;
                 if (pc) {
                    const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (videoSender && screenStream.getVideoTracks().length > 0) {
                        videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
                    } else if (screenStream.getVideoTracks().length > 0) { // If no sender, might need to add track and re-negotiate
                        pc.addTrack(screenStream.getVideoTracks()[0], screenStream);
                        // Potentially trigger renegotiation here if addTrack doesn't do it automatically
                        // This part can be complex and might require sending a new offer
                    }
                 }
            }
            if (toggleScreenBtn) toggleScreenBtn.classList.add('active');

            // When screen sharing stops (e.g., user clicks browser's "Stop sharing" button)
            screenStream.getVideoTracks()[0].onended = () => {
                addLogEntry("Screen sharing ended by user (browser UI).", 'media');
                if (isScreenSharing) { // Ensure we only run this if we think we are sharing
                    toggleScreenSharing(); // Call our function to revert to camera
                }
            };

        } catch (error) {
            addLogEntry(`Error starting screen sharing: ${error.message}`, 'error');
            isScreenSharing = false;
        }
    }
}


// Create Peer Connection
function createPeerConnection(peerSocketId, peerUserName) {
    if (peerSocketId === socketId) {
        addLogEntry(`Skipping peer connection for self (ID: ${peerSocketId})`, 'debug');
        return null;
    }

    // Close any existing connection first to ensure clean state
    if (peers[peerSocketId] && peers[peerSocketId].pc) {
        addLogEntry(`Closing existing peer connection with ${peerUserName} (${peerSocketId})`, 'pc');
        peers[peerSocketId].pc.close();
    }

    addLogEntry(`Creating new peer connection for ${peerUserName} (ID: ${peerSocketId})`, 'pc');
    
    // Simplified WebRTC STUN/TURN Server Configuration
    const configuration = {
        iceServers: [
            // STUN servers - for NAT traversal
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            
            // Free TURN servers (fewer options for simplicity)
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
        iceCandidatePoolSize: 10
    };
    
    // Create new peer connection
    const pc = new RTCPeerConnection(configuration);

    // Store peer connection
    peers[peerSocketId] = { 
        pc: pc, 
        userName: peerUserName,
        createdAt: Date.now() 
    };
    
    // Always update UI immediately when creating a connection
    updateParticipantsList(peers);

    // Add local tracks to connection (if available)
    if (localStream) {
        localStream.getTracks().forEach(track => {
            try {
                pc.addTrack(track, localStream);
                addLogEntry(`Added local ${track.kind} track to PC for ${peerUserName}`, 'pc');
            } catch (e) {
                addLogEntry(`Error adding local ${track.kind} track for ${peerUserName}: ${e.message}`, 'error');
            }
        });
    } else {
        addLogEntry(`Warning: No local stream available for ${peerUserName}. Getting media first.`, 'warn');
        // Try to get media immediately if needed
        initLocalStream(true, true)
            .then(success => {
                if (success && localStream) {
                    localStream.getTracks().forEach(track => {
                        try {
                            pc.addTrack(track, localStream);
                        } catch (e) {
                            addLogEntry(`Error adding track after getting media: ${e.message}`, 'error');
                        }
                    });
                }
            });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            addLogEntry(`Sending ICE candidate to ${peerUserName} (${peerSocketId})`, 'signal');
            socket.emit('webrtc-ice-candidate', {
                to: peerSocketId,
                candidate: event.candidate,
            });
        }
    };

    // Handle tracks added by the remote peer
    pc.ontrack = (event) => {
        addLogEntry(`Received remote track from ${peerUserName} (ID: ${peerSocketId})`, 'pc');
        
        // Ensure video container exists
        let videoContainer = document.getElementById(`video-container-${peerSocketId}`);
        if (!videoContainer) {
            // Create new video container
            videoContainer = document.createElement('div');
            videoContainer.id = `video-container-${peerSocketId}`;
            videoContainer.className = 'video-container remote-video-container';
            videoContainer.style.position = 'relative';
            videoContainer.style.overflow = 'hidden';
            videoContainer.style.borderRadius = '8px';
            videoContainer.style.backgroundColor = '#2D3748';

            // Create video element
            const remoteVideo = document.createElement('video');
            remoteVideo.id = `video-${peerSocketId}`;
            remoteVideo.autoplay = true;
            remoteVideo.playsinline = true;
            remoteVideo.style.width = '100%';
            remoteVideo.style.height = '100%';
            remoteVideo.style.objectFit = 'cover';

            // Create username overlay
            const nameOverlay = document.createElement('div');
            nameOverlay.className = 'username-overlay';
            nameOverlay.textContent = peerUserName;
            nameOverlay.style.position = 'absolute';
            nameOverlay.style.bottom = '5px';
            nameOverlay.style.left = '5px';
            nameOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            nameOverlay.style.color = 'white';
            nameOverlay.style.padding = '2px 5px';
            nameOverlay.style.borderRadius = '3px';
            nameOverlay.style.fontSize = '0.9em';

            // Add connection status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'connection-state-indicator';
            statusIndicator.style.position = 'absolute';
            statusIndicator.style.top = '5px';
            statusIndicator.style.right = '5px';
            statusIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            statusIndicator.style.color = 'white';
            statusIndicator.style.fontSize = '0.8em';
            statusIndicator.style.padding = '2px 6px';
            statusIndicator.style.borderRadius = '3px';
            statusIndicator.textContent = 'Connecting...';

            // Assemble video container
            videoContainer.appendChild(remoteVideo);
            videoContainer.appendChild(nameOverlay);
            videoContainer.appendChild(statusIndicator);
            
            // Add to video grid
            if (videoGrid) {
                videoGrid.appendChild(videoContainer);
                addLogEntry(`Added video container for ${peerUserName}`, 'ui');
            } else {
                addLogEntry(`Video grid not found, couldn't add container for ${peerUserName}`, 'error');
            }
        }
        
        // Get video element and add the stream
        const remoteVideoElement = videoContainer.querySelector('video');
        if (remoteVideoElement && event.streams && event.streams[0]) {
            addLogEntry(`Setting stream for ${peerUserName}`, 'media');
            remoteVideoElement.srcObject = event.streams[0];
            
            // Ensure video plays (handle autoplay restrictions)
            remoteVideoElement.play()
                .then(() => {
                    addLogEntry(`Video playback started for ${peerUserName}`, 'success');
                    
                    // Set connection status to Connected once video is playing
                    const statusIndicator = videoContainer.querySelector('.connection-state-indicator');
                    if (statusIndicator) {
                        statusIndicator.textContent = 'Connected';
                        statusIndicator.style.backgroundColor = 'rgba(72, 187, 120, 0.8)'; // Green background
                    }
                })
                .catch(e => {
                    addLogEntry(`Remote video play error for ${peerUserName}: ${e.message}`, 'error');
                    alert(`Video playback error: ${e.message}. Try clicking on the page to enable autoplay.`);
                });
        } else {
            addLogEntry(`Failed to set remote stream for ${peerUserName}`, 'error');
        }
    };
    
    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
        addLogEntry(`ICE connection state for ${peerUserName} (${peerSocketId}): ${pc.iceConnectionState}`, 'pc');
        
        // Update connection status indicator
        const videoContainer = document.getElementById(`video-container-${peerSocketId}`);
        if (videoContainer) {
            const statusIndicator = videoContainer.querySelector('.connection-state-indicator');
            if (statusIndicator) {
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    statusIndicator.textContent = 'Connected';
                    statusIndicator.style.backgroundColor = 'rgba(72, 187, 120, 0.8)'; // Green
                } else if (pc.iceConnectionState === 'checking') {
                    statusIndicator.textContent = 'Connecting...';
                    statusIndicator.style.backgroundColor = 'rgba(236, 201, 75, 0.8)'; // Yellow
                } else if (pc.iceConnectionState === 'failed') {
                    statusIndicator.textContent = 'Failed';
                    statusIndicator.style.backgroundColor = 'rgba(245, 101, 101, 0.8)'; // Red
                    
                    // Try to restart ICE if failed
                    addLogEntry(`Connection to ${peerUserName} failed. Attempting to restart ICE.`, 'warn');
                    try {
                        pc.restartIce();
                    } catch (e) {
                        addLogEntry(`Error restarting ICE: ${e.message}`, 'error');
                    }
                } else if (pc.iceConnectionState === 'disconnected') {
                    statusIndicator.textContent = 'Disconnected';
                    statusIndicator.style.backgroundColor = 'rgba(160, 174, 192, 0.8)'; // Gray
                    
                    // Try to reconnect after a brief delay
                    setTimeout(() => {
                        if (pc.iceConnectionState === 'disconnected' && peers[peerSocketId]) {
                            addLogEntry(`Attempting to reconnect to ${peerUserName}`, 'pc');
                            try {
                                pc.restartIce();
                            } catch (e) {
                                addLogEntry(`Error restarting ICE: ${e.message}`, 'error');
                            }
                        }
                    }, 2000);
                } else if (pc.iceConnectionState === 'closed') {
                    statusIndicator.textContent = 'Closed';
                    statusIndicator.style.backgroundColor = 'rgba(45, 55, 72, 0.8)'; // Dark gray
                    removePeer(peerSocketId);
                }
            }
        }
        
        // Update the participant list to reflect connection state
        updateParticipantsList(peers);
    };
    
    // Connection signaling state monitoring
    pc.onsignalingstatechange = () => {
        addLogEntry(`Signaling state for ${peerUserName} (${peerSocketId}): ${pc.signalingState}`, 'pc');
    };

    // Connection negotiation monitoring 
    pc.onnegotiationneeded = () => {
        addLogEntry(`Negotiation needed for ${peerUserName} (${peerSocketId})`, 'pc');
        
        // Create offer when negotiation is needed
        pc.createOffer()
            .then(offer => {
                addLogEntry(`Setting local description for ${peerUserName}`, 'pc');
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                addLogEntry(`Sending offer to ${peerUserName}`, 'signal');
                socket.emit('webrtc-offer', {
                    to: peerSocketId,
                    offer: pc.localDescription,
                    fromUserName: userName
                });
            })
            .catch(e => {
                addLogEntry(`Error during negotiation with ${peerUserName}: ${e.message}`, 'error');
            });
    };

    // Connection closed event
    pc.onconnectionstatechange = () => {
        addLogEntry(`Connection state for ${peerUserName} (${peerSocketId}): ${pc.connectionState}`, 'pc');
        
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            // If connection is permanently failed or closed, remove the peer
            if (pc.connectionState === 'failed') {
                addLogEntry(`Connection with ${peerUserName} failed permanently. Will recreate.`, 'warn');
                
                // Remove and recreate the connection after a delay
                setTimeout(() => {
                    if (peers[peerSocketId] && peers[peerSocketId].pc.connectionState === 'failed') {
                        removePeer(peerSocketId);
                        createPeerConnection(peerSocketId, peerUserName);
                    }
                }, 3000);
            }
        }
    };

    return pc;
}

// Remove Peer
function removePeer(peerSocketId) {
    if (peers[peerSocketId]) {
        addLogEntry(`Removing peer: ${peers[peerSocketId].userName} (ID: ${peerSocketId})`, 'pc');
        if (peers[peerSocketId].pc) {
            peers[peerSocketId].pc.close();
        }
        delete peers[peerSocketId];

        const videoContainer = document.getElementById(`video-container-${peerSocketId}`);
        if (videoContainer) {
            videoContainer.remove();
        }
        updateParticipantsList(peers); // Update UI
    }
}

// --- Enhanced Socket Event Handlers ---
function setupSocketEvents() {
    if (!socket) {
        addLogEntry('Socket not initialized for event setup.', 'error');
        return;
    }

    // Clear previous listeners to prevent duplicates if re-connecting
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('video-room-users');
    socket.off('user-joined-video-room');
    socket.off('user-left-video-room');
    socket.off('webrtc-offer');
    socket.off('webrtc-answer');
    socket.off('webrtc-ice-candidate');
    socket.off('video-room-error');
    socket.off('ping-request');
    socket.off('ping-response');
    socket.off('ping-all-response');
    socket.off('ping-all-update');
    
    // Verbose connection tracking
    socket.on('connect', () => {
        socketId = socket.id;
        addLogEntry(`Successfully connected to signaling server with ID: ${socketId}`, 'success');
        updateConnectionStatus('connected', 'Connected');
        
        // Debug socket transport mechanism
        const transport = socket.io.engine.transport.name; // websocket or polling
        addLogEntry(`Socket transport: ${transport}`, 'debug');
        
        addLogEntry(`Attempting to join video room: ${VIDEO_CHAT_ROOM} as ${userName}`, 'socket');
        socket.emit('join-video-room', { userName: userName });
    });

    socket.on('disconnect', (reason) => {
        addLogEntry(`Disconnected from signaling server: ${reason}`, 'warn');
        updateConnectionStatus('disconnected', `Disconnected: ${reason}`);
        // Clean up all peers as we are disconnected
        for (const peerId in peers) {
            removePeer(peerId);
        }
    });

    socket.on('connect_error', (error) => {
        addLogEntry(`Connection error: ${error.message}`, 'error');
        updateConnectionStatus('disconnected', `Connection Error: ${error.message}`);
        console.error('Socket connection error details:', error);
    });
    
    socket.on('video-room-users', (data) => {
        const { users } = data; // users is an array of { userId, userName, socketId }
        addLogEntry(`[SOCKET] Received initial list of users in room: ${users.length} users.`, 'socket');
        
        if (DEBUG_USER_TRACKING) {
            console.group('🔍 Video Room Users Received');
            console.log('%c[SOCKET] Current users in room:', 'color: #20c997; font-weight: bold;', users);
            console.table(users);
            console.groupEnd();
        }

        // Clear existing peers before processing new list, except self
        for (const existingPeerId in peers) {
            if (existingPeerId !== socketId) {
                addLogEntry(`[SOCKET] Removing stale peer: ${existingPeerId}`, 'debug');
                removePeer(existingPeerId);
            }
        }

        // For each user, create a peer connection and immediately initiate an offer (except self)
        users.forEach(user => {
            if (user.socketId === socketId) {
                addLogEntry(`[SOCKET] Skipping self (${user.userName}, ${user.socketId})`, 'user');
                return;  // Skip self
            }
            
            addLogEntry(`[SOCKET] Processing remote user: ${user.userName} (${user.socketId})`, 'user');
            const pc = createPeerConnection(user.socketId, user.userName);
            if (pc) {
                addLogEntry(`[SOCKET] Creating offer to ${user.userName} (${user.socketId})`, 'signal');
                pc.createOffer()
                    .then(offer => {
                        addLogEntry(`[SOCKET] Setting local description for ${user.userName}`, 'peer');
                        return pc.setLocalDescription(offer);
                    })
                    .then(() => {
                        addLogEntry(`[SOCKET] Sending WebRTC offer to ${user.userName} (${user.socketId})`, 'signal');
                        socket.emit('webrtc-offer', {
                            to: user.socketId,
                            offer: pc.localDescription,
                            fromUserName: userName
                        });
                    })
                    .catch(e => {
                        addLogEntry(`[SOCKET] Error creating initial offer for ${user.userName}: ${e.message}`, 'error');
                        console.error('Offer creation error:', e);
                    });
            } else {
                addLogEntry(`[SOCKET] Failed to create peer connection for ${user.userName}`, 'error');
            }
        });
        
        // Force update participants list after processing all users
        if (DEBUG_USER_TRACKING) {
            addLogEntry(`[SOCKET] Forcing participants list update after processing ${users.length} users`, 'user');
            setTimeout(() => updateParticipantsList(peers), 500);
        }
    });

    socket.on('user-joined-video-room', (userData) => {
        addLogEntry(`User joined: ${userData.userName} (${userData.socketId})`, 'user');
        console.log('%c[USER JOINED]', 'background: #4CAF50; color: white; padding: 2px 5px;', userData);
        
        if (userData.socketId === socketId) {
            addLogEntry(`Ignoring join notification for self`, 'debug');
            return; // It's us, ignore
        }

        const pc = createPeerConnection(userData.socketId, userData.userName);
        if (pc) {
            // This client (an existing user) will make an offer to the new user
            pc.createOffer()
                .then(offer => {
                    addLogEntry(`Setting local description for new user ${userData.userName}`, 'peer');
                    return pc.setLocalDescription(offer);
                })
                .then(() => {
                    addLogEntry(`Sending WebRTC offer to new user ${userData.userName} (${userData.socketId})`, 'signal');
                    socket.emit('webrtc-offer', {
                        to: userData.socketId,
                        offer: pc.localDescription,
                        fromUserName: userName
                    });
                })
                .catch(e => {
                    addLogEntry(`Error creating offer for ${userData.userName}: ${e.message}`, 'error');
                    console.error('Offer creation error for new user:', e);
                });
        } else {
            addLogEntry(`Failed to create peer connection for new user ${userData.userName}`, 'error');
        }
        
        // Force update UI after new user joins
        setTimeout(() => updateParticipantsList(peers), 500);
    });
    
    socket.on('webrtc-offer', (data) => {
        const { from, offer, fromUserName } = data;
        addLogEntry(`Received WebRTC offer from ${fromUserName} (${from})`, 'signal');

        if (from === socketId) {
            addLogEntry(`Ignoring offer from self`, 'debug');
            return; // Skip offers from self (should not happen)
        }

        // Create peer connection if it doesn't exist
        let pc = peers[from]?.pc;
        if (!pc) {
            pc = createPeerConnection(from, fromUserName);
            if (!pc) {
                addLogEntry(`Failed to create peer connection for offer from ${fromUserName}`, 'error');
                return;
            }
        }

        // Process the offer
        pc.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => {
                addLogEntry(`Set remote description from ${fromUserName}'s offer`, 'peer');
                return pc.createAnswer();
            })
            .then(answer => {
                addLogEntry(`Created answer for ${fromUserName}`, 'peer');
                return pc.setLocalDescription(answer);
            })
            .then(() => {
                addLogEntry(`Sending WebRTC answer to ${fromUserName} (${from})`, 'signal');
                socket.emit('webrtc-answer', {
                    to: from,
                    answer: pc.localDescription,
                    fromUserName: userName
                });
            })
            .catch(e => {
                addLogEntry(`Error processing offer from ${fromUserName}: ${e.message}`, 'error');
                console.error('Error processing offer:', e);
            });
    });

    socket.on('webrtc-answer', (data) => {
        const { from, answer, fromUserName } = data;
        addLogEntry(`Received WebRTC answer from ${fromUserName} (${from})`, 'signal');

        if (!peers[from] || !peers[from].pc) {
            addLogEntry(`Received answer from ${fromUserName} but no peer connection exists`, 'error');
            return;
        }

        peers[from].pc.setRemoteDescription(new RTCSessionDescription(answer))
            .then(() => {
                addLogEntry(`Set remote description from ${fromUserName}'s answer`, 'peer');
            })
            .catch(e => {
                addLogEntry(`Error setting remote description from ${fromUserName}: ${e.message}`, 'error');
                console.error('Error setting remote description:', e);
            });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        const { from, candidate } = data;
        const fromUserName = peers[from]?.userName || 'Unknown peer';
        
        if (!peers[from] || !peers[from].pc) {
            addLogEntry(`Received ICE candidate from ${fromUserName} (${from}) but no peer connection exists`, 'warn');
            return;
        }

        try {
            addLogEntry(`Adding ICE candidate from ${fromUserName}`, 'peer');
            peers[from].pc.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(e => {
                    addLogEntry(`Error adding ICE candidate from ${fromUserName}: ${e.message}`, 'error');
                    console.error('Error adding ICE candidate:', e);
                });
        } catch (e) {
            addLogEntry(`Exception processing ICE candidate: ${e.message}`, 'error');
        }
    });

    socket.on('user-left-video-room', (data) => {
        const { userId, userName } = data;
        addLogEntry(`User left: ${userName || 'Unknown'} (${userId})`, 'user');
        removePeer(userId);
        updateParticipantsList(peers);
    });
    
    // Add ping event handling
    socket.on('ping-request', (data) => {
        const { from, fromUserName, timestamp, originalTimestamp, echo, isPingAll } = data;
        addLogEntry(`Ping request from ${fromUserName} (${from})`, 'ping');
        
        // Calculate latency
        const latency = Date.now() - timestamp;
        
        // Show ping notification to user
        showPingNotification(fromUserName);
        
        // Don't respond if echo is explicitly set to false
        if (echo === false) return;
        
        // Respond to the ping
        socket.emit('ping-response', {
            to: from,
            status: 'received',
            latency: latency,
            timestamp: Date.now(),
            originalTimestamp: originalTimestamp,
            isPingAll: isPingAll
        });
    });
    
    socket.on('ping-response', (data) => {
        const { targetId, status, latency, timestamp, originalTimestamp } = data;
        
        // Find user name from peers
        const userName = peers[targetId]?.userName || 'Unknown user';
        
        // Calculate round trip time
        const roundTripTime = Date.now() - originalTimestamp;
        
        addLogEntry(`Ping response from ${userName} (${targetId}): ${status}, latency: ${latency}ms, RTT: ${roundTripTime}ms`, 'ping');
        
        // Update UI if ping results window is open
        updatePingResult(targetId, {
            userName,
            status,
            latency,
            roundTripTime
        });
    });
    
    socket.on('ping-all-response', (data) => {
        const { status, users, roomSize, timestamp, message } = data;
        
        if (status === 'error') {
            addLogEntry(`Ping all error: ${message}`, 'error');
            alert(`Ping error: ${message}`);
            return;
        }
        
        addLogEntry(`Ping all ${status}: ${roomSize} users in room`, 'ping');
        
        if (status === 'initiated') {
            // Show the ping results window
            showPingResultsWindow(users, timestamp);
        }
    });
    
    socket.on('ping-all-update', (data) => {
        const { users, timestamp, originalTimestamp } = data;
        
        // Update ping results window with delivery status
        updatePingResults(users);
    });
    
    // Handle signal delivery status
    socket.on('webrtc-signal-status', (data) => {
        const { type, to, status } = data;
        
        if (status === 'delivered') {
            addLogEntry(`${type.toUpperCase()} delivered to ${peers[to]?.userName || to}`, 'signal');
        } else if (status === 'error') {
            addLogEntry(`Error delivering ${type} to ${peers[to]?.userName || to}: ${data.error || 'Unknown error'}`, 'error');
            
            // If user not found or left, clean up
            if (data.error === 'user-not-found' || data.error === 'user-left') {
                if (peers[to]) {
                    addLogEntry(`Removing peer ${peers[to].userName || to} as they are no longer available`, 'peer');
                    removePeer(to);
                    updateParticipantsList(peers);
                }
            }
        }
    });
    
    // Debug socket events if enabled
    if (DEBUG_SOCKET_EVENTS) {
        const originalEmit = socket.emit;
        socket.emit = function() {
            const args = Array.prototype.slice.call(arguments);
            const eventName = args[0];
            const eventData = args[1] || {};
            console.group(`%c[SOCKET EMIT] ${eventName}`, 'background:#fd7e14;color:white;padding:2px 5px;');
            console.log('Event:', eventName);
            console.log('Data:', eventData);
            console.groupEnd();
            return originalEmit.apply(this, args);
        };
    }
}

// --- Enhanced Connection Function ---
function connectToSignalingServer() {
    const socketServerUrlMeta = document.querySelector('meta[name="socket-server"]');
    if (!socketServerUrlMeta) {
        addLogEntry("Socket server URL meta tag not found!", "error");
        console.error("Missing meta tag: socket-server");
        updateConnectionStatus('disconnected', 'Configuration Error');
        
        // Show all meta tags for debugging
        const allMeta = document.querySelectorAll('meta');
        console.log('Available meta tags:', Array.from(allMeta).map(m => ({name: m.getAttribute('name'), content: m.getAttribute('content')})));
        
        // Fallback to localhost port 1002 if meta tag is missing
        tryFallbackSocketConnection('http://localhost:1002');
        return;
    }
    
    const socketServerUrl = socketServerUrlMeta.content;
    addLogEntry(`Connecting to signaling server at ${socketServerUrl}...`, 'system');
    console.log('%c[SOCKET SERVER URL]', 'background:#007bff;color:white;padding:2px 5px;', socketServerUrl);

    if (socket && socket.connected) {
        addLogEntry('Disconnecting existing socket connection...', 'system');
        socket.disconnect();
    }

    try {
        socket = io(socketServerUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
            timeout: 10000,
            forceNew: true,
            query: {
                clientVersion: '1.0.0',
                userAgent: navigator.userAgent
            }
        });

        updateConnectionStatus('connecting', 'Connecting...');
        setupSocketEvents();
        
        // Add connection debugging
        socket.io.on("error", (error) => {
            addLogEntry(`Socket.IO transport error: ${error}`, 'error');
            console.error('Socket transport error details:', error);
            updateConnectionStatus('disconnected', `Connection Error: ${error}`);
        });

        socket.io.on("reconnect_attempt", (attempt) => {
            addLogEntry(`Socket reconnect attempt #${attempt}`, 'warn');
            updateConnectionStatus('connecting', `Reconnecting (Attempt ${attempt})`);
        });
        
        // Log connection details
        socket.on('connect', () => {
            const transport = socket.io.engine.transport.name;
            console.log('%c[SOCKET CONNECTED]', 'background:#28a745;color:white;padding:2px 5px;', {
                id: socket.id,
                transport: transport,
                url: socket.io.uri,
                namespace: socket.nsp
            });
        });
    } catch (e) {
        addLogEntry(`Error creating socket connection: ${e.message}`, 'error');
        console.error('Socket connection error:', e);
        updateConnectionStatus('disconnected', `Connection Error`);
        
        setTimeout(tryFallbackSocketConnection, 3000);
    }
}

// Function to try fallback socket server connections
function tryFallbackSocketConnection(fallbackUrl = 'http://localhost:1002') {
    addLogEntry(`Trying fallback socket connection to ${fallbackUrl}`, 'system');
    updateConnectionStatus('connecting', `Trying fallback connection to ${fallbackUrl}`);
    
    try {
        if (socket && socket.connected) {
            socket.disconnect();
        }
        
        socket = io(fallbackUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
            timeout: 8000,
            forceNew: true
        });
        
        setupSocketEvents();
        
        // Add connection debugging
        socket.io.on("error", (error) => {
            addLogEntry(`Fallback socket connection error: ${error}`, 'error');
            updateConnectionStatus('disconnected', `Connection Error: ${error}`);
        });
    } catch (e) {
        addLogEntry(`Error creating fallback socket connection: ${e.message}`, 'error');
        updateConnectionStatus('disconnected', `Connection Failed`);
    }
}

function hangUpCall() {
    addLogEntry("Hanging up call.", 'system');
    if (socket) {
        socket.emit('leave-video-room'); // Notify server
        // Server will then notify others via 'user-left-video-room'
    }
    // Client-side cleanup of all peers
    for (const peerId in peers) {
        removePeer(peerId);
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
        isScreenSharing = false;
    }
    if (localVideo) localVideo.srcObject = null;
    if (videoGrid) videoGrid.innerHTML = ''; // Clear video grid
    updateParticipantsList({}); // Clear participants list
    updateConnectionStatus('disconnected', 'Call Ended');
    // Optionally, redirect or show a "call ended" message
    // For now, we allow re-joining by potentially re-initializing media and connecting
}


// --- Event Listeners for UI ---
document.addEventListener('DOMContentLoaded', () => {
    addLogEntry("DOM fully loaded and parsed.", 'system');

    if (permissionRequest) permissionRequest.style.display = 'flex'; // Show permission dialog initially
    if (permissionStatus) permissionStatus.textContent = 'Please allow camera and microphone access.';

    // Listen for stream recovery events from video-player.js
    document.addEventListener('webrtc-stream-recovery', (event) => {
        const { userId, reason } = event.detail;
        addLogEntry(`Received stream recovery request for ${userId} due to: ${reason}`, 'media');
        
        // Find the peer connection for this user
        const peerConnection = Object.entries(peers).find(([id, peer]) => peer.userId === userId || id === userId);
        
        if (peerConnection) {
            const [peerId, peer] = peerConnection;
            addLogEntry(`Attempting to restart connection with ${peer.userName || 'Unknown peer'}`, 'pc');
            
            // Try to refresh the connection
            if (peer.pc && peer.pc.iceConnectionState !== 'closed') {
                // For ongoing connections, try to restart ICE first
                peer.pc.restartIce();
                
                // Also try renegotiating if needed for more severe issues
                if (['black-screen', 'frozen-frame', 'no-stream'].includes(reason)) {
                    peer.pc.createOffer({iceRestart: true})
                        .then(offer => peer.pc.setLocalDescription(offer))
                        .then(() => {
                            socket.emit('webrtc-offer', {
                                to: peerId,
                                offer: peer.pc.localDescription,
                                fromUserName: userName
                            });
                        })
                        .catch(e => addLogEntry(`Error creating recovery offer: ${e.message}`, 'error'));
                }
            }
        }
    });

    if (retryPermissionBtn) {
        retryPermissionBtn.addEventListener('click', () => {
            addLogEntry("Retry permission button clicked", 'ui');
            if (permissionStatus) permissionStatus.textContent = 'Requesting permissions...';
            initLocalStream(true, true).then(success => { // Request both audio and video
                if (success) {
                    if (permissionRequest) permissionRequest.style.display = 'none';
                    connectToSignalingServer();
                } else {
                     if (permissionStatus) permissionStatus.textContent = 'Permission denied. Please check browser settings.';
                }
            });
        });
    }
    
    if (audioOnlyBtn) {
        audioOnlyBtn.addEventListener('click', () => {
            addLogEntry("Audio-only button clicked", 'ui');
            if (permissionStatus) permissionStatus.textContent = 'Requesting audio permission...';
            initLocalStream(true, false).then(success => { // Request only audio
                if (success) {
                    if (permissionRequest) permissionRequest.style.display = 'none';
                    connectToSignalingServer();
                } else {
                    if (permissionStatus) permissionStatus.textContent = 'Audio permission denied. Please check browser settings.';
                }
            });
        });
    }

    // Initial attempt to get media if permissions might already be granted (e.g. after a reload)
    // This can be aggressive, consider a softer approach or user action to trigger.
    // For now, let's rely on the user clicking a button in the permission dialog.
    // initLocalStream().then(success => {
    //     if (success) {
    //         if (permissionRequest) permissionRequest.style.display = 'none';
    //         connectToSignalingServer();
    //     } else {
    //         if (permissionRequest) permissionRequest.style.display = 'flex';
    //     }
    // });
    
    if (toggleVideoBtn) toggleVideoBtn.addEventListener('click', toggleLocalVideo);
    if (toggleAudioBtn) toggleAudioBtn.addEventListener('click', toggleLocalAudio);
    if (toggleScreenBtn) toggleScreenBtn.addEventListener('click', toggleScreenSharing);
    if (hangupBtn) hangupBtn.addEventListener('click', hangUpCall);
    
    // Add event listener for ping button
    if (document.getElementById('pingBtn')) {
        document.getElementById('pingBtn').addEventListener('click', () => {
            addLogEntry('Ping button clicked', 'ui');
            pingAllUsers();
        });
    }
    
    if (retryConnection) { // Button to manually retry connection if it fails
        retryConnection.addEventListener('click', () => {
            addLogEntry("Retry connection button clicked.", 'ui');
            connectToSignalingServer();
        });
    }

    // Logging UI controls
    if (toggleLogsBtn) {
        toggleLogsBtn.addEventListener('click', () => {
            if (socketLogs) {
                socketLogs.classList.toggle('visible'); // Assuming 'visible' class controls display
                toggleLogsBtn.textContent = socketLogs.classList.contains('visible') ? 'Hide Logs' : 'Show Logs';
            }
        });
    }
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            if (logEntries) logEntries.innerHTML = '';
            addLogEntry("Logs cleared.", "system");
        });
    }
    
    // Add CSS styles for ping button animation
    const style = document.createElement('style');
    style.textContent = `
        .ping-active {
            animation: ping-pulse 0.6s infinite alternate;
        }
        
        @keyframes ping-pulse {
            0% { transform: scale(1); }
            100% { transform: scale(1.2); }
        }
        
        .log-entry.type-ping {
            color: #FF9500;
            font-weight: bold;
        }
        
        #ping-notification {
            animation: ping-fade-in 0.3s ease-in-out;
        }
        
        @keyframes ping-fade-in {
            from { opacity: 0; transform: translateY(20px) translateX(-50%); }
            to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
    `;
    document.head.appendChild(style);
    
    addLogEntry("WebRTC client initialized. Waiting for media permissions.", 'system');
});

// Make sure to style .video-container, .remote-video-container, .username-overlay, .log-entry, etc. in your CSS.
// Example CSS for .username-overlay:
// .video-container .username-overlay {
//   position: absolute;
//   bottom: 5px;
//   left: 5px;
//   background-color: rgba(0,0,0,0.5);
//   color: white;
//   padding: 2px 5px;
//   font-size: 0.9em;
//   border-radius: 3px;
// }

// --- Ping System Functions ---

// Show a temporary ping notification to the user
function showPingNotification(fromUserName) {
    // Create notification element if it doesn't exist
    let pingNotification = document.getElementById('ping-notification');
    if (!pingNotification) {
        pingNotification = document.createElement('div');
        pingNotification.id = 'ping-notification';
        pingNotification.className = 'ping-notification';
        pingNotification.style.position = 'fixed';
        pingNotification.style.bottom = '100px';
        pingNotification.style.left = '50%';
        pingNotification.style.transform = 'translateX(-50%)';
        pingNotification.style.backgroundColor = 'rgba(79, 70, 229, 0.9)';
        pingNotification.style.color = 'white';
        pingNotification.style.padding = '10px 20px';
        pingNotification.style.borderRadius = '20px';
        pingNotification.style.fontWeight = 'bold';
        pingNotification.style.zIndex = '100';
        pingNotification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        pingNotification.style.transition = 'opacity 0.3s ease-in-out';
        pingNotification.style.opacity = '0';
        document.body.appendChild(pingNotification);
    }
    
    // Update and show the notification
    pingNotification.textContent = `🔔 Ping from ${fromUserName}`;
    pingNotification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        if (pingNotification) {
            pingNotification.style.opacity = '0';
        }
    }, 3000);
}

// Show ping results window with all users being pinged
function showPingResultsWindow(users, timestamp) {
    // Create or get ping results window
    let pingResultsWindow = document.getElementById('ping-results-window');
    if (!pingResultsWindow) {
        pingResultsWindow = document.createElement('div');
        pingResultsWindow.id = 'ping-results-window';
        pingResultsWindow.className = 'ping-results-window';
        pingResultsWindow.style.position = 'fixed';
        pingResultsWindow.style.top = '50%';
        pingResultsWindow.style.left = '50%';
        pingResultsWindow.style.transform = 'translate(-50%, -50%)';
        pingResultsWindow.style.backgroundColor = 'rgba(17, 24, 39, 0.95)';
        pingResultsWindow.style.border = '1px solid rgba(75, 85, 99, 0.5)';
        pingResultsWindow.style.borderRadius = '8px';
        pingResultsWindow.style.padding = '20px';
        pingResultsWindow.style.width = '400px';
        pingResultsWindow.style.maxWidth = '90vw';
        pingResultsWindow.style.maxHeight = '80vh';
        pingResultsWindow.style.overflow = 'auto';
        pingResultsWindow.style.zIndex = '1000';
        pingResultsWindow.style.color = 'white';
        pingResultsWindow.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
        document.body.appendChild(pingResultsWindow);
    }
    
    // Clear previous results
    pingResultsWindow.innerHTML = '';
    
    // Add title and close button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid rgba(75, 85, 99, 0.5)';
    header.style.paddingBottom = '10px';
    
    const title = document.createElement('h3');
    title.textContent = 'Ping Results';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';
    header.appendChild(title);
    
    const timestamp_span = document.createElement('span');
    timestamp_span.textContent = new Date(timestamp).toLocaleTimeString();
    timestamp_span.style.fontSize = '12px';
    timestamp_span.style.opacity = '0.7';
    timestamp_span.style.marginLeft = '10px';
    title.appendChild(timestamp_span);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
        pingResultsWindow.remove();
    };
    header.appendChild(closeButton);
    
    pingResultsWindow.appendChild(header);
    
    // Create results list
    const resultsList = document.createElement('div');
    resultsList.id = 'ping-results-list';
    
    // Add each user to the list
    Object.entries(users).forEach(([userId, userData]) => {
        const userItem = document.createElement('div');
        userItem.id = `ping-result-${userId}`;
        userItem.className = 'ping-result-item';
        userItem.style.display = 'flex';
        userItem.style.justifyContent = 'space-between';
        userItem.style.alignItems = 'center';
        userItem.style.padding = '10px';
        userItem.style.borderBottom = '1px solid rgba(75, 85, 99, 0.3)';
        
        const userInfo = document.createElement('div');
        userInfo.style.display = 'flex';
        userInfo.style.alignItems = 'center';
        
        const avatar = document.createElement('div');
        avatar.style.width = '30px';
        avatar.style.height = '30px';
        avatar.style.borderRadius = '50%';
        avatar.style.backgroundColor = 'rgba(79, 70, 229, 0.5)';
        avatar.style.marginRight = '10px';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.fontWeight = 'bold';
        avatar.textContent = userData.userName.substring(0, 2).toUpperCase();
        userInfo.appendChild(avatar);
        
        const name = document.createElement('span');
        name.textContent = userData.userName;
        userInfo.appendChild(name);
        
        userItem.appendChild(userInfo);
        
        const status = document.createElement('div');
        status.className = 'ping-status';
        
        // Set initial status
        const statusDot = document.createElement('span');
        statusDot.style.display = 'inline-block';
        statusDot.style.width = '10px';
        statusDot.style.height = '10px';
        statusDot.style.borderRadius = '50%';
        statusDot.style.marginRight = '5px';
        
        const statusText = document.createElement('span');
        
        // Set status based on current state
        if (userData.status === 'pending') {
            statusDot.style.backgroundColor = '#FCD34D'; // Yellow
            statusText.textContent = 'Pending';
        } else {
            statusDot.style.backgroundColor = '#EF4444'; // Red
            statusText.textContent = userData.status || 'Unknown';
        }
        
        status.appendChild(statusDot);
        status.appendChild(statusText);
        userItem.appendChild(status);
        
        resultsList.appendChild(userItem);
    });
    
    pingResultsWindow.appendChild(resultsList);
}

// Update the status for a specific user in the ping results window
function updatePingResult(userId, resultData) {
    const pingResultItem = document.getElementById(`ping-result-${userId}`);
    if (!pingResultItem) return;
    
    const statusElement = pingResultItem.querySelector('.ping-status');
    if (!statusElement) return;
    
    const statusDot = statusElement.querySelector('span:first-child');
    const statusText = statusElement.querySelector('span:last-child');
    
    // Update status based on result
    if (resultData.status === 'received') {
        statusDot.style.backgroundColor = '#10B981'; // Green
        statusText.textContent = `${resultData.roundTripTime}ms`;
    } else if (resultData.status === 'delivered') {
        statusDot.style.backgroundColor = '#3B82F6'; // Blue
        statusText.textContent = 'Delivered';
    } else {
        statusDot.style.backgroundColor = '#EF4444'; // Red
        statusText.textContent = resultData.status || 'Failed';
    }
    
    // Add ping latency if available
    if (resultData.latency) {
        const latencyElement = document.createElement('div');
        latencyElement.textContent = `One-way: ${resultData.latency}ms`;
        latencyElement.style.fontSize = '11px';
        latencyElement.style.opacity = '0.7';
        statusElement.appendChild(latencyElement);
    }
}

// Update all ping results with the latest data
function updatePingResults(users) {
    if (!users) return;
    
    Object.entries(users).forEach(([userId, userData]) => {
        updatePingResult(userId, userData);
    });
}

// Function to ping all users in the room
function pingAllUsers() {
    if (!socket) {
        addLogEntry('Cannot ping, socket not connected', 'error');
        return;
    }
    
    addLogEntry('Pinging all users in the room...', 'ping');
    
    // Animate ping button to show activity
    const pingBtn = document.getElementById('pingBtn');
    if (pingBtn) {
        pingBtn.classList.add('ping-active');
        setTimeout(() => {
            pingBtn.classList.remove('ping-active');
        }, 2000);
    }
    
    // Send ping-all command to server
    socket.emit('ping-all', {
        timestamp: Date.now()
    });
}

