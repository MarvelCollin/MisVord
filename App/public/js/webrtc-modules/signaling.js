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
 * Fix Docker service names in URLs
 * Browsers cannot resolve Docker internal service names like 'socket-server'
 * @param {string} url - The URL to fix
 * @return {string} The fixed URL
 */
function fixDockerServiceNames(url) {
    if (!url) return url;
    
    // Replace Docker service name with localhost
    if (url.includes('socket-server')) {
        console.warn("[WebRTC] Detected Docker service name in socket URL, replacing with localhost");
        url = url.replace('socket-server', 'localhost');
    }
    
    // Also check for ws:// or wss:// protocols for Socket.IO connections
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
        console.warn("[WebRTC] Detected WebSocket protocol in Socket.IO URL, fixing protocol");
        url = url.replace('ws://', 'http://').replace('wss://', 'https://');
    }
    
    return url;
}

/**
 * Initialize the signaling connection to the server
 * @param {string} roomId - The room ID to join
 * @param {string} userName - The user's display name
 * @param {Function} onConnected - Callback when connection is established
 * @param {Function} onError - Callback when connection fails
 */
function connectToSignalingServer(roomId, userName, onConnected, onError) {
    window.VIDEO_CHAT_ROOM = roomId || 'global-video-chat';
    window.userName = userName || 'User_' + Math.floor(Math.random() * 10000);
    
    console.log(`Connecting to signaling server - Room: ${roomId}, User: ${userName}`);
    window.WebRTCUI.addLogEntry(`Connecting to signaling server as ${userName}`, 'socket');
    window.WebRTCUI.updateConnectionStatus('connecting', 'Connecting to signaling server...');
    
    // Reset connection attempts counter
    connectionAttempts = 0;
    
    try {
        // Get socket server configuration from meta tags
        const socketServerMeta = document.querySelector('meta[name="socket-server"]');
        const socketPathMeta = document.querySelector('meta[name="socket-path"]');
        const isSecureMeta = document.querySelector('meta[name="socket-secure"]');
        
        // Set defaults
        let socketUrl = '';
        let socketPath = '';
        let isSecure = window.location.protocol === 'https:';
        
        // Extract values from meta tags (if available)
        if (socketServerMeta && socketServerMeta.content) {
            socketUrl = socketServerMeta.content;
            // CRITICAL FIX: Fix Docker service names if present
            socketUrl = fixDockerServiceNames(socketUrl);
            console.log("Using socket server URL from meta tag:", socketUrl);
        }
        
        if (socketPathMeta && socketPathMeta.content) {
            socketPath = socketPathMeta.content;
            console.log("Using socket path from meta tag:", socketPath);
        }
        
        if (isSecureMeta && isSecureMeta.content) {
            isSecure = isSecureMeta.content === 'true';
        }
        
        // Fallback for socket URL if not set
        if (!socketUrl) {
            const hostname = window.location.hostname;
            const port = hostname === 'localhost' || hostname === '127.0.0.1' ? '1002' : window.location.port;
            const protocol = isSecure ? 'https:' : 'http:';
            socketUrl = `${protocol}//${hostname}:${port}`;
            
            console.log("Using fallback socket URL:", socketUrl);
        }
        
        // Ensure socket path is always set to the standardized path
        if (!socketPath) {
            socketPath = '/misvord/socket/socket.io';
            console.log("Using standardized socket path:", socketPath);
        }
        
        // Ensure any existing socket is properly disconnected
        if (socket) {
            console.log("Disconnecting existing socket before creating a new one");
            socket.disconnect();
            socket = null;
        }
        
        // Log expected WebSocket URL for debugging
        const expectedWsUrl = socketUrl.replace('http:', 'ws:').replace('https:', 'wss:') + socketPath;
        console.log(`[WebRTC] Expected WebSocket URL: ${expectedWsUrl}`);
        
        socket = io(socketUrl, {
            path: socketPath,
            transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
            reconnectionAttempts: 3, // Reduced initial attempts before explicit fallback
            reconnectionDelay: 1500,
            timeout: 15000, // Increased timeout
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
    
    // Get socket server configuration from meta tags first
    const socketServerMeta = document.querySelector('meta[name="socket-server"]');
    const socketPathMeta = document.querySelector('meta[name="socket-path"]');
    
    let trySocketUrl = fallbackUrl;
    let trySocketPath = fallbackPath;
    
    // If URL not specified, try to get from meta tag first
    if (!trySocketUrl) {
        if (socketServerMeta && socketServerMeta.content) {
            trySocketUrl = socketServerMeta.content;
            // CRITICAL FIX: Fix Docker service names here too
            trySocketUrl = fixDockerServiceNames(trySocketUrl);
            console.log("Fallback using socket URL from meta tag (fixed):", trySocketUrl);
        } else {
            // Auto-detect fallback URL
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                trySocketUrl = `${window.location.protocol}//${window.location.hostname}:1002`;
                console.log("Using localhost URL with port 1002:", trySocketUrl);
            } else {
                const protocol = window.location.protocol;
                trySocketUrl = `${protocol}//${window.location.host}`;
                console.log("Using production URL from window.location:", trySocketUrl);
            }
        }
    }
    
    // If path not specified, try to get from meta tag first
    if (!trySocketPath) {
        if (socketPathMeta && socketPathMeta.content) {
            // Use the value from meta tag
            trySocketPath = socketPathMeta.content;
            console.log("Fallback using socket path from meta tag:", trySocketPath);
        } else {
            // Use standardized path for all environments
            trySocketPath = '/misvord/socket/socket.io';
            console.log("Using standardized socket path for all environments:", trySocketPath);
        }
    }
    
    console.log(`[WebRTC] Fallback socket attempt - URL: ${trySocketUrl}, Path: ${trySocketPath}`);
    window.WebRTCUI.addLogEntry(`Trying fallback connection: ${trySocketUrl} (path: ${trySocketPath})`, 'socket');
    
    // Ensure any existing socket is properly disconnected
    if (socket) {
        console.log("Disconnecting existing socket before creating a new one");
        try {
            socket.disconnect();
        } catch (err) {
            console.error("Error disconnecting existing socket:", err);
        }
        socket = null;
    }
    
    try {
        // Create a new socket with the fallback options
        socket = io(trySocketUrl, {
            path: trySocketPath,
            transports: preferredTransports,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 10000,
            forceNew: true,
            query: { t: new Date().getTime(), attempt: 'fallback' }
        });
        
        setupSocketEvents(roomId, userName, onConnected, onError);
        
        socket.io.on("error", (error) => {
            console.error("Fallback socket error:", error);
            window.WebRTCUI.addLogEntry(`Fallback socket error: ${error.type || error.message}`, 'error');
            
            // If fallback fails with all transport options, try direct connection
            if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                connectionAttempts++;
                window.WebRTCUI.updateConnectionStatus('connecting', `Trying direct connection (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
                
                // Try direct connection or final fallback
                if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS - 1) {
                    // Last resort - direct connection attempt
                    tryDirectConnection(trySocketUrl, trySocketPath, roomId, userName, onConnected, onError);
                }
            } else {
                window.WebRTCUI.updateConnectionStatus('disconnected', 'All connection attempts failed');
                if (onError) onError("All connection attempts failed");
            }
        });
    } catch (e) {
        console.error("Error creating fallback socket connection:", e);
        window.WebRTCUI.addLogEntry(`Fallback connection error: ${e.message}`, 'error');
        
        // Try direct connection or report error
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            connectionAttempts++;
            tryDirectConnection(trySocketUrl, trySocketPath, roomId, userName, onConnected, onError);
        } else {
            window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection failed');
            if (onError) onError(e.message || "All connection attempts failed");
        }
    }
}

/**
 * Final attempt to directly connect to socket server
 * @param {string} serverUrl - The server URL
 * @param {string} socketIoPath - The socket.io path
 * @param {string} roomId - The room ID to join
 * @param {string} userName - The user's display name
 * @param {Function} onConnected - Callback when connection is established
 * @param {Function} onError - Callback when connection fails
 */
function tryDirectConnection(serverUrl, socketIoPath = '/misvord/socket/socket.io', roomId, userName, onConnected, onError) {
    window.WebRTCUI.addLogEntry(`Attempting direct socket connection to ${serverUrl}`, 'socket');
    window.WebRTCUI.updateConnectionStatus('connecting', 'Final connection attempt...');
    
    // Ensure direct connection has unique parameters to avoid caching
    const timestamp = new Date().getTime();
    const attemptId = Math.random().toString(36).substring(2, 15);
    
    // Final URL determination for direct connection
    let finalUrl = serverUrl;
    let finalPath = socketIoPath;
    
    if (!finalUrl) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            finalUrl = `${window.location.protocol}//${window.location.hostname}:1002`;
        } else {
            finalUrl = window.location.origin;
        }
    }
    
    if (!finalPath) {
        finalPath = '/misvord/socket/socket.io'; // Standardized path for all environments
    }
    
    console.log(`FINAL CONNECTION ATTEMPT - URL: ${finalUrl}, Path: ${finalPath}`);
    
    // Ensure any existing socket is properly disconnected
    if (socket) {
        try { socket.disconnect(); } catch (e) { /* ignore */ }
        socket = null;
    }
    
    try {
        // Create final socket attempt with minimal options
        socket = io(finalUrl, {
            path: finalPath,
            transports: ['polling', 'websocket'], // Try polling first as a last resort
            reconnectionAttempts: 1,
            timeout: 15000,
            forceNew: true,
            upgrade: true,
            rememberUpgrade: false,
            query: { 
                t: timestamp,
                id: attemptId,
                attempt: 'direct'
            }
        });
        
        setupSocketEvents(roomId, userName, onConnected, onError, true);
        
        // Add one-time error handler for final attempt
        const finalErrorHandler = (error) => {
            console.error("Final socket connection attempt failed:", error);
            window.WebRTCUI.addLogEntry(`Final socket connection failed: ${error.type || error.message}`, 'error');
            window.WebRTCUI.updateConnectionStatus('disconnected', 'All connection attempts failed');
            
            if (onError) {
                onError("All connection attempts failed. Please try again later or contact support.");
            }
        };
        
        socket.io.once("error", finalErrorHandler);
        
        // Add specific one-time connect handler for final attempt
        socket.once("connect", () => {
            console.log("✅ Final socket connection attempt succeeded:", socket.id);
            window.WebRTCUI.addLogEntry(`Final socket connection succeeded! ID: ${socket.id}`, 'success');
            socket.io.off("error", finalErrorHandler); // Remove error handler on success
        });
        
    } catch (e) {
        console.error("Error creating direct socket connection:", e);
        window.WebRTCUI.addLogEntry(`Final connection error: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection failed');
        
        if (onError) {
            onError(e.message || "All connection attempts failed. Please try again later.");
        }
    }
}

/**
 * Setup socket event handlers
 */
function setupSocketEvents(roomId, userName, onConnected, onError, isFinalAttempt = false) {
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

/**
 * Try to reconnect the socket
 * @param {string} roomId - Optional room ID to rejoin after reconnection
 * @param {string} userName - Optional user name for rejoin
 */
function reconnect(roomId, userName) {
    // Use existing room ID and username if not provided
    const currentRoomId = roomId || window.VIDEO_CHAT_ROOM || 'global-video-chat';
    const currentUserName = userName || window.userName || 'User_' + Math.floor(Math.random() * 10000);
    
    console.log('Manual reconnection requested for', currentUserName, 'to room', currentRoomId);
    window.WebRTCUI.addLogEntry('Manual reconnection initiated', 'socket');
    window.WebRTCUI.updateConnectionStatus('connecting', 'Manual reconnection...');
    
    // Check if we already have a socket instance
    if (socket && socket.connected) {
        console.log('Socket is already connected, no need to reconnect');
        window.WebRTCUI.addLogEntry('Socket already connected', 'socket');
        return true;
    }
    
    try {
        // If we have an existing disconnected socket, try to reconnect it first
        if (socket) {
            console.log('Attempting to reconnect existing socket');
            socket.connect();
            
            // Schedule a delayed check to see if we succeeded
            setTimeout(() => {
                if (socket.connected) {
                    console.log('Existing socket reconnected successfully');
                    // Rejoin room
                    socket.emit('join-video-room', { roomId: currentRoomId, userName: currentUserName });
                } else {
                    console.log('Existing socket failed to reconnect, creating new connection');
                    // Try a completely new connection
                    connectionAttempts = 0; // Reset attempts
                    connectToSignalingServer(currentRoomId, currentUserName);
                }
            }, 2000);
            
            return true;
        }
        
        // No existing socket, create a new connection
        connectionAttempts = 0; // Reset attempts
        connectToSignalingServer(currentRoomId, currentUserName);
        return true;
    } catch (e) {
        console.error('Error during manual reconnection:', e);
        window.WebRTCUI.addLogEntry(`Reconnection error: ${e.message}`, 'error');
        return false;
    }
}

// Export the socket instance to window for direct access by debugging tools
function exportSocket() {
    window.socket = socket; // Make socket globally available
    window.socketId = socketId; // Make socket ID globally available
}

// Export all functions to the namespace
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
    tryFallbackSocketConnection, // Expose for specific UI-triggered recovery
    reconnect,
    exportSocket
};

// Setup proper event listeners for the export
if (typeof setupSocketEvents === 'function') {
    const originalSetupSocketEvents = setupSocketEvents;
    
    // Override setupSocketEvents to also export the socket
    setupSocketEvents = function(roomId, userName, onConnected, onError) {
        // Call the original function
        originalSetupSocketEvents(roomId, userName, onConnected, onError);
        
        // Export socket to window
        exportSocket();
        
        // Add extra event to update the exported socket ID when it changes
        if (socket) {
            socket.on('connect', () => {
                window.socketId = socket.id;
            });
        }
    };
}

// If the module is loaded in a Node.js environment, export it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCSignaling;
} 