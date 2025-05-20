/**
 * WebRTC Signaling Module
 * Handles all socket connection and signaling for WebRTC
 */

// Create namespace for signaling
window.WebRTCSignaling = window.WebRTCSignaling || {};

// Singleton socket connection
let socket = null;
let socketId = null;

// Connection status tracking
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3; // Max attempts for initial connection and for each fallback type

/**
 * Initialize the signaling connection to the server
 * @param {string} roomId - The room ID to join
 * @param {string} userName - The user's display name
 * @param {Function} onConnected - Callback when connection is established
 * @param {Function} onError - Callback when connection fails
 */
function connectToSignalingServer(roomId, userName, onConnected, onError) {
    if (!roomId) {
        console.error("Room ID is required");
        if (onError) onError("Room ID is required");
        return;
    }

    if (!userName) {
        console.error("User name is required");
        if (onError) onError("User name is required");
        return;
    }

    // Determine the socket connection URL
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let socketUrl;
    let socketPath;
    
    if (isLocalhost) {
        // For local development, use current hostname with socket port
        socketUrl = window.location.protocol + '//' + window.location.hostname + ':1002';
        socketPath = '/socket.io'; // Use default Socket.IO path
        console.log("Using localhost connection:", socketUrl, "Path:", socketPath);
    } else {
        // For production/Docker, derive protocol from current page
        const protocol = window.location.protocol;
        const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
        // Assuming subpath is the first part of the path if present, or default to 'misvord'
        const subpath = pathParts.length > 0 ? pathParts[0] : 'misvord';
        
        socketUrl = `${protocol}//${window.location.host}`;
        // Standardized path for VPS based on actual subpath or default
        socketPath = `/${subpath}/socket/socket.io`;
        
        console.log("Using production connection:", socketUrl, "with path:", socketPath);
        
        // Specific override for marvelcollin.my.id if needed, though dynamic should work
        if (window.location.hostname === 'marvelcollin.my.id') {
            // This might be redundant if subpath logic is correct
            // socketPath = `/misvord/socket/socket.io`; 
            console.log("Detected marvelcollin.my.id domain - ensuring path is:", socketPath);
        }
    }

    try {
        window.WebRTCUI.addLogEntry(`Connecting to signaling server at ${socketUrl} (path: ${socketPath})`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connecting', 'Connecting to server...');
        
        console.log(`Attempting Socket.IO connection - URL: ${socketUrl}, Path: ${socketPath}, Transports: ['websocket', 'polling']`);
        
        socket = io(socketUrl, {
            path: socketPath,
            transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
            reconnectionAttempts: 3, // Reduced initial attempts before explicit fallback
            reconnectionDelay: 1500,
            timeout: 10000,
            forceNew: true, // Ensures a new connection attempt
            query: { t: new Date().getTime() }, // Cache-busting
            autoConnect: true // Default is true, explicit for clarity
        });
        
        setupSocketEvents(roomId, userName, onConnected, onError);
        
        socket.io.on("error", (error) => {
            console.error("Socket.IO Manager error:", error);
            window.WebRTCUI.addLogEntry(`Socket.IO Manager error: ${error.type || error.message}`, 'error');
            
            // If WebSocket connection itself fails, try forcing polling as a fallback
            if (error.type === 'TransportError' && error.message.includes('websocket')) {
                window.WebRTCUI.addLogEntry('WebSocket transport failed. Attempting fallback to polling...', 'socket');
                // Disconnect current failing socket before trying fallback
                if(socket) socket.disconnect();
                connectionAttempts = 0; // Reset attempts for this specific fallback
                tryFallbackSocketConnection(socketUrl, socketPath, roomId, userName, onConnected, onError, ['polling']);
            } else if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                // For other manager errors, rely on built-in reconnection or generic fallback
                connectionAttempts++;
                 if(socket) socket.disconnect();
                window.WebRTCUI.addLogEntry(`General connection issue, trying generic fallback (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`, 'socket');
                tryFallbackSocketConnection(null, null, roomId, userName, onConnected, onError);
            }
        });
        
    } catch (e) {
        console.error("Error initializing Socket.IO connection:", e);
        window.WebRTCUI.addLogEntry(`Error connecting to signaling server: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection Failed');
        
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            connectionAttempts++;
            window.WebRTCUI.addLogEntry(`Initial connection setup failed. Trying generic fallback (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`, 'socket');
            tryFallbackSocketConnection(null, null, roomId, userName, onConnected, onError);
        } else {
            if (onError) onError(e.message || "All connection attempts failed");
        }
    }
}

/**
 * Try fallback socket connection methods
 * @param {string} fallbackUrl - Specific URL to try, or null to auto-detect
 * @param {string} fallbackPath - Specific path to try, or null to auto-detect
 * @param {string} roomId - The room ID to join
 * @param {string} userName - The user's display name
 * @param {Function} onConnected - Callback when connection is established
 * @param {Function} onError - Callback when connection fails
 * @param {Array<string>} [preferredTransports=['websocket', 'polling']] - Transports to try
 */
function tryFallbackSocketConnection(fallbackUrl = null, fallbackPath = null, roomId, userName, onConnected, onError, preferredTransports = ['websocket', 'polling']) {
    window.WebRTCUI.addLogEntry(`Attempting fallback socket connection with transports: ${preferredTransports.join(', ')}`, 'socket');
    
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let trySocketUrl = fallbackUrl;
    let trySocketPath = fallbackPath;
    
    if (!trySocketUrl) {
        if (isLocalhost) {
            trySocketUrl = `${window.location.protocol}//${window.location.hostname}:1002`;
            trySocketPath = '/socket.io';
        } else {
            const protocol = window.location.protocol;
            const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
            const subpath = pathParts.length > 0 ? pathParts[0] : 'misvord';
            trySocketUrl = `${protocol}//${window.location.host}`;
            trySocketPath = `/${subpath}/socket/socket.io`;
        }
    }
    
    if (!trySocketPath) { // Should generally be set with trySocketUrl logic
        trySocketPath = '/socket.io';
    }
    
    window.WebRTCUI.addLogEntry(`Fallback connecting to ${trySocketUrl} (path: ${trySocketPath})`, 'socket');
    window.WebRTCUI.updateConnectionStatus('connecting', `Trying fallback connection (${preferredTransports.join(', ')})...`);

    try {
        if (socket && socket.connected) socket.disconnect();
        
        console.log(`Fallback Socket.IO attempt - URL: ${trySocketUrl}, Path: ${trySocketPath}, Transports: ${preferredTransports.join(', ')}`);
        
        socket = io(trySocketUrl, {
            path: trySocketPath,
            transports: preferredTransports, // Use the provided transports
            reconnectionAttempts: 2, // Fewer attempts for fallback scenario
            reconnectionDelay: 2000,
            timeout: 10000, 
            forceNew: true,
            query: { t: new Date().getTime(), fallback: 'true' }, // Cache-busting and indicate fallback
            withCredentials: true 
        });
        
        setupSocketEvents(roomId, userName, onConnected, onError);
        
        // Specific error handling for this fallback attempt
        socket.io.on("error", (error) => {
            console.error("Fallback socket manager error:", error);
            window.WebRTCUI.addLogEntry(`Fallback socket manager error: ${error.type || error.message}`, 'error');
            // If even this fallback fails, call the main onError
            if (onError) onError(error.message || "Fallback connection attempt failed");
            window.WebRTCUI.updateConnectionStatus('disconnected', `Fallback connection failed`);
        });

    } catch (e) {
        console.error("Error creating fallback socket connection:", e);
        window.WebRTCUI.addLogEntry(`Error in fallback connection setup: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection Failed');
        if (onError) onError(e.message || "All connection attempts failed");
    }
}

/**
 * Direct IP connection attempt as last resort
 */
function tryDirectConnection(serverUrl, socketIoPath = '/socket.io', roomId, userName, onConnected, onError) {
    window.WebRTCUI.addLogEntry(`Trying direct connection to ${serverUrl} (path: ${socketIoPath})`, 'system');
    window.WebRTCUI.updateConnectionStatus('connecting', `Direct connection...`);
    
    try {
        if (socket && socket.connected) {
            socket.disconnect();
        }
        
        const useSSL = (serverUrl.startsWith('https:') || !(serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')));
        const socketOptions = {
            path: socketIoPath,
            transports: ['websocket', 'polling'], // Default for direct
            reconnectionAttempts: 1, // Minimal attempts for direct
            reconnectionDelay: 2000,
            timeout: 8000,
            forceNew: true,
            secure: useSSL,
            query: { t: new Date().getTime(), direct: 'true' }
        };
        
        console.log(`Direct connection attempt: URL ${serverUrl}, Path: ${socketIoPath}, Secure: ${useSSL}`);
        socket = io(serverUrl, socketOptions);
        
        setupSocketEvents(roomId, userName, onConnected, onError);

        socket.io.on("error", (error) => {
            console.error("Direct connection manager error:", error);
            window.WebRTCUI.addLogEntry(`Direct connection manager error: ${error.type || error.message}`, 'error');
            if (onError) onError(error.message || "Direct connection failed");
            window.WebRTCUI.updateConnectionStatus('disconnected', `Direct connection failed`);
        });

    } catch (e) {
        console.error("Error in direct connection setup:", e);
        window.WebRTCUI.addLogEntry(`Connection attempt failed: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Connection Failed`);
        if (onError) onError(e.message);
    }
}

/**
 * Setup socket event handlers
 */
function setupSocketEvents(roomId, userName, onConnected, onError) {
    if (!socket) {
        window.WebRTCUI.addLogEntry('Socket not initialized for event setup.', 'error');
        return;
    }
    
    // Remove any existing event handlers to avoid duplicates from multiple connection attempts
    socket.removeAllListeners();
    if (socket.io && typeof socket.io.removeAllListeners === 'function') {
      socket.io.removeAllListeners(); // Remove manager listeners too
    }

    // Connection events
    socket.on('connect', () => {
        socketId = socket.id;
        connectionAttempts = 0; // Reset main attempt counter on successful connection
        
        window.WebRTCUI.addLogEntry(`✅ Connected to signaling server! ID: ${socketId} via ${socket.io.engine.transport.name}`, 'success');
        window.WebRTCUI.updateConnectionStatus('connected', 'Connected to server');
        
        window.WebRTCUI.addLogEntry(`Joining room: ${roomId} as ${userName}`, 'socket');
        socket.emit('join-video-room', { roomId, userName });
    });
    
    socket.on('disconnect', (reason) => {
        window.WebRTCUI.addLogEntry(`Disconnected from signaling server: ${reason}`, 'socket');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Disconnected: ${reason}`);
        // Potentially trigger reconnection logic here or notify user
        if (reason === 'io server disconnect') {
             // The server deliberately disconnected the socket
             if (onError) onError("Server disconnected session.");
        }
    });
    
    socket.on('error', (error) => { // This is for errors on an established socket
        console.error("Socket instance error:", error);
        window.WebRTCUI.addLogEntry(`Socket instance error: ${error.message || error}`, 'error');
        // This usually implies a problem with an active connection, not failure to connect
    });
    
    socket.on('connect_error', (error) => {
        console.error("Socket connect_error:", error);
        window.WebRTCUI.addLogEntry(`Connection establishment error: ${error.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Connection Error: ${error.message}`);
        
        // Fallback logic might be initiated from socket.io.on("error") for transport errors
        // or here if it's a general connect_error not caught by the manager's error handler.
        // Avoid creating too many loops of fallbacks.
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS && !socket.active) { // Check if not already active/retrying
            connectionAttempts++;
            window.WebRTCUI.addLogEntry(`Connect_error, trying generic fallback (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`, 'socket');
            if(socket) socket.disconnect();
            // Decide which fallback, maybe polling if websocket was the issue
            const transportsToTry = error.message.toLowerCase().includes('websocket') ? ['polling'] : ['websocket', 'polling'];
            tryFallbackSocketConnection(null, null, roomId, userName, onConnected, onError, transportsToTry);
        } else if (!socket.active) {
            if (onError) onError(error.message || "Connection failed after multiple attempts");
        }
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
        window.WebRTCUI.addLogEntry(`Reconnection attempt ${attemptNumber}...`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connecting', `Reconnecting... (${attemptNumber})`);
    });

    socket.on('reconnect_error', (error) => {
        console.error("Reconnect error:", error);
        window.WebRTCUI.addLogEntry(`Reconnect error: ${error.message}`, 'error');
    });
    
    socket.on('reconnect_failed', () => {
        window.WebRTCUI.addLogEntry('Reconnection failed. Please refresh the page.', 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Reconnection Failed');
        if (onError) onError("Reconnection failed after multiple attempts");
    });
    
    // Room-specific events
    socket.on('room-joined', (data) => {
        const { roomId: joinedRoomId, users } = data; // Renamed to avoid conflict with outer scope roomId
        window.WebRTCUI.addLogEntry(`Joined room: ${joinedRoomId} with ${users ? users.length : 0} other users`, 'socket');
        window.WebRTCUI.updateConnectionStatus('in-room', `Connected to Room: ${joinedRoomId}`);
        if (onConnected) onConnected(users);
    });
    
    socket.on('video-room-users', (data) => {
        const { users } = data;
        window.WebRTCUI.addLogEntry(`Received users list with ${users ? users.length : 0} users`, 'socket');
        if (onConnected && (!socket.flags || !socket.flags.roomJoinedCalled) ) { // Ensure onConnected isn't called twice if room-joined also fires
            socket.flags = socket.flags || {};
            socket.flags.roomJoinedCalled = true; 
            onConnected(users); 
        }
    });

    socket.on('user-joined-video-room', (userData) => {
        window.WebRTCUI.addLogEntry(`User joined video room: ${userData.userName} (ID: ${userData.socketId})`, 'user');
        // This event will be handled by webrtc-controller.js to create peer connections
    });

    socket.on('user-left-video-room', (userData) => {
        window.WebRTCUI.addLogEntry(`User left video room: ${userData.userName} (ID: ${userData.userId})`, 'user');
        // Handled by webrtc-controller.js
    });

    socket.on('webrtc-offer', (offerData) => {
        window.WebRTCUI.addLogEntry(`Received WebRTC offer from ${offerData.fromUserName || offerData.from}`, 'signal');
        // Handled by webrtc-controller.js
    });

    socket.on('webrtc-answer', (answerData) => {
        window.WebRTCUI.addLogEntry(`Received WebRTC answer from ${answerData.fromUserName || answerData.from}`, 'signal');
        // Handled by webrtc-controller.js
    });

    socket.on('webrtc-ice-candidate', (candidateData) => {
        if(window.appDebugMode) window.WebRTCUI.addLogEntry(`Received ICE candidate from ${candidateData.from}`, 'signal');
        // Handled by webrtc-controller.js
    });

    socket.on('video-room-error', (errorData) => {
        console.error("Video room error:", errorData);
        window.WebRTCUI.addLogEntry(`Video Room Error: ${errorData.message}`, 'error');
    });

    // Ping system related events if used by application logic
    socket.on('ping-user-request', (requestData) => {
        window.WebRTCUI.addLogEntry(`Received ping request from ${requestData.fromUserName || requestData.from}`, 'debug');
    });

    socket.on('ping-response', (responseData) => {
        window.WebRTCUI.addLogEntry(`Received ping response regarding ${responseData.targetId}, status: ${responseData.status}`, 'debug');
    });
    
    // Other application-specific events would be here...
}

/**
 * Leave the current video room
 */
function leaveVideoRoom(onLeaveCallback) {
    if (socket && socket.connected) {
        socket.emit('leave-video-room');
        window.WebRTCUI.addLogEntry("Sent 'leave-video-room' signal", 'socket');
        if (onLeaveCallback) onLeaveCallback();
    } else {
        window.WebRTCUI.addLogEntry("Cannot leave room: socket not connected", 'warn');
    }
}

/**
 * Send WebRTC offer to a peer
 */
function sendWebRTCOffer(peerId, offer, options = {}) {
    if (!socket || !socket.connected) {
        window.WebRTCUI.addLogEntry("Cannot send offer: socket not connected", 'error');
        return false;
    }
    socket.emit('webrtc-offer', {
        to: peerId,
        offer: offer,
        fromUserName: options.fromUserName || 'Anonymous',
        isIceRestart: options.isIceRestart || false,
        isReconnect: options.isReconnect || false
    });
    if(window.appDebugMode) window.WebRTCUI.addLogEntry(`Sent WebRTC offer to ${peerId}`, 'signal');
    return true;
}

/**
 * Send WebRTC answer to a peer
 */
function sendWebRTCAnswer(peerId, answer, options = {}) {
    if (!socket || !socket.connected) {
        window.WebRTCUI.addLogEntry("Cannot send answer: socket not connected", 'error');
        return false;
    }
    socket.emit('webrtc-answer', {
        to: peerId,
        answer: answer,
        fromUserName: options.fromUserName || 'Anonymous',
        isIceRestart: options.isIceRestart || false
    });
    if(window.appDebugMode) window.WebRTCUI.addLogEntry(`Sent WebRTC answer to ${peerId}`, 'signal');
    return true;
}

/**
 * Send ICE candidate to a peer
 */
function sendICECandidate(peerId, candidate) {
    if (!socket || !socket.connected) {
        // This can be noisy, so only log if in debug mode
        if(window.appDebugMode) window.WebRTCUI.addLogEntry("Cannot send ICE candidate: socket not connected", 'warn');
        return false;
    }
    socket.emit('webrtc-ice-candidate', {
        to: peerId,
        candidate: candidate
    });
    // This can also be very noisy
    // if(window.appDebugMode) window.WebRTCUI.addLogEntry(`Sent ICE candidate to ${peerId}`, 'signal');
    return true;
}

/**
 * Send a ping request to specific user
 */
function sendPingRequest(userId) {
    if (!socket || !socket.connected) {
         window.WebRTCUI.addLogEntry("Cannot send ping: socket not connected", 'error');
        return false;
    }
    socket.emit('ping-user-request', {
        userId,
        timestamp: Date.now()
    });
    return true;
}

/**
 * Check if socket is connected
 */
function isConnected() {
    return socket && socket.connected;
}

/**
 * Get socket ID
 */
function getSocketId() {
    return socketId; // This is set on successful 'connect' event
}

/**
 * Get the socket instance
 */
function getSocket() {
    return socket;
}

// Export functions to the WebRTCSignaling namespace
window.WebRTCSignaling = {
    connectToSignalingServer,
    leaveVideoRoom,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    sendPingRequest,
    isConnected,
    getSocketId,
    getSocket,
    tryDirectConnection, // Expose direct connection for specific UI-triggered recovery
    tryFallbackSocketConnection // Expose for specific UI-triggered recovery
};

// If the module is loaded in a Node.js environment, export it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCSignaling;
} 