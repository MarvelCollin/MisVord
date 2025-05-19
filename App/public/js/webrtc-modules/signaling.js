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
const MAX_CONNECTION_ATTEMPTS = 3;

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
    const protocol = 'wss://';  // Always use secure WebSocket
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let socketUrl;
    let socketPath;
    
    if (isLocalhost) {
        // For local development, use explicit port 1002
        socketUrl = `http://localhost:1002`;
        socketPath = '/socket.io';
    } else {
        // For production, use same host with secure protocol
        socketUrl = `${protocol}${window.location.host}`;
        socketPath = '/socket.io';
    }

    try {
        window.WebRTCUI.addLogEntry(`Connecting to signaling server at ${socketUrl}`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connecting', 'Connecting to server...');
        
        // Initialize Socket.IO
        socket = io(socketUrl, {
            path: socketPath,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: MAX_CONNECTION_ATTEMPTS,
            reconnectionDelay: 1000,
            timeout: 8000,
            forceNew: true
        });
        
        // Setup event handlers
        setupSocketEvents(roomId, userName, onConnected, onError);
        
    } catch (e) {
        window.WebRTCUI.addLogEntry(`Error connecting to signaling server: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection Failed');
        
        // Try fallback connections
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            connectionAttempts++;
            window.WebRTCUI.addLogEntry(`Trying fallback connection (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`, 'socket');
            tryFallbackSocketConnection(null, null, roomId, userName, onConnected, onError);
        } else {
            if (onError) onError(e.message);
        }
    }
}

/**
 * Try a fallback socket connection with different parameters
 */
function tryFallbackSocketConnection(fallbackUrl = null, fallbackPath = '/socket.io', roomId, userName, onConnected, onError) {
    window.WebRTCUI.addLogEntry('Attempting fallback socket connection', 'socket');
    
    try {
        // Clean up existing connection
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Fallback URL logic - check different ports for localhost
        if (!fallbackUrl) {
            if (isLocalhost) {
                fallbackUrl = 'http://localhost:1002'; // Try port 1002 directly
            } else {
                // For production, try the base URL without any special path
                fallbackUrl = window.location.origin;
            }
        }
        
        // Try the fallback connection
        window.WebRTCUI.addLogEntry(`Connecting to fallback at ${fallbackUrl}`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connecting', 'Trying alternate connection...');
        
        socket = io(fallbackUrl, {
            path: fallbackPath,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 2,
            timeout: 5000,
            forceNew: true
        });
        
        setupSocketEvents(roomId, userName, onConnected, onError);
        
        socket.io.on("error", (error) => {
            window.WebRTCUI.addLogEntry(`Fallback socket connection error: ${error}`, 'error');
            window.WebRTCUI.updateConnectionStatus('disconnected', `Fallback connection failed`);
            
            // Try one more approach with different port
            if (isLocalhost) {
                setTimeout(() => {
                    window.WebRTCUI.addLogEntry('Attempting final fallback connection with WSS', 'system');
                    tryDirectConnection('http://localhost:1002', '/socket.io', roomId, userName, onConnected, onError);
                }, 2000);
            } else {
                if (onError) onError("All connection attempts failed");
            }
        });
    } catch (e) {
        window.WebRTCUI.addLogEntry(`Error creating fallback socket connection: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection Failed');
        if (onError) onError(e.message);
    }
}

/**
 * Direct IP connection attempt as last resort
 */
function tryDirectConnection(serverUrl, socketIoPath = '/socket.io', roomId, userName, onConnected, onError) {
    window.WebRTCUI.addLogEntry(`Trying direct connection to ${serverUrl}`, 'system');
    window.WebRTCUI.updateConnectionStatus('connecting', `Direct connection...`);
    
    try {
        if (socket && socket.connected) {
            socket.disconnect();
        }
        
        // Force secure WebSocket for better reliability
        const useSSL = (serverUrl.startsWith('https:') || !serverUrl.includes('localhost'));
        const socketOptions = {
            path: socketIoPath,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 2,
            reconnectionDelay: 2000,
            timeout: 5000,
            forceNew: true,
            secure: useSSL
        };
        
        socket = io(serverUrl, socketOptions);
        
        setupSocketEvents(roomId, userName, onConnected, onError);
    } catch (e) {
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
    
    // Remove any existing event handlers to avoid duplicates
    socket.off('connect');
    socket.off('disconnect');
    socket.off('error');
    socket.off('connect_error');
    socket.off('connect_timeout');
    socket.off('reconnect');
    socket.off('reconnect_attempt');
    socket.off('reconnect_error');
    socket.off('reconnect_failed');
    socket.off('room-joined');
    socket.off('user-joined-video-room');
    socket.off('user-left-video-room');
    socket.off('webrtc-offer');
    socket.off('webrtc-answer');
    socket.off('webrtc-ice-candidate');
    socket.off('video-room-error');
    socket.off('ping-user-request');
    socket.off('ping-response');
    socket.off('ping-results');
    
    // Connection events
    socket.on('connect', () => {
        socketId = socket.id;
        connectionAttempts = 0; // Reset attempt counter on successful connection
        
        window.WebRTCUI.addLogEntry(`Connected to signaling server with ID: ${socketId}`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connected', 'Connected to server');
        
        // Join the video room
        window.WebRTCUI.addLogEntry(`Joining room: ${roomId} as ${userName}`, 'socket');
        socket.emit('join-video-room', { roomId, userName });
    });
    
    socket.on('disconnect', (reason) => {
        window.WebRTCUI.addLogEntry(`Disconnected from signaling server: ${reason}`, 'socket');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Disconnected: ${reason}`);
    });
    
    socket.on('error', (error) => {
        window.WebRTCUI.addLogEntry(`Socket error: ${error}`, 'error');
        window.WebRTCUI.updateConnectionStatus('error', `Socket Error`);
    });
    
    socket.on('connect_error', (error) => {
        window.WebRTCUI.addLogEntry(`Connection error: ${error.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Connection Error: ${error.message}`);
        console.error('Socket connection error details:', error);
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
        window.WebRTCUI.addLogEntry(`Reconnection attempt ${attemptNumber}...`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connecting', `Reconnecting... (${attemptNumber})`);
    });
    
    socket.on('reconnect_failed', () => {
        window.WebRTCUI.addLogEntry('Reconnection failed. Please refresh the page.', 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Reconnection Failed');
        
        if (onError) onError("Reconnection failed after multiple attempts");
    });
    
    // Room-specific events
    socket.on('room-joined', (data) => {
        const { roomId, users } = data;
        window.WebRTCUI.addLogEntry(`Joined room: ${roomId} with ${users.length} other users`, 'socket');
        window.WebRTCUI.updateConnectionStatus('in-room', `Connected to Room: ${roomId}`);
        
        if (onConnected) onConnected(users);
    });
    
    // Other events will be set up in their respective modules
}

/**
 * Leave the current video room
 */
function leaveVideoRoom(onLeaveCallback) {
    if (socket) {
        socket.emit('leave-video-room');
        window.WebRTCUI.addLogEntry("Left video room", 'socket');
        
        if (onLeaveCallback) onLeaveCallback();
    }
}

/**
 * Send WebRTC offer to a peer
 */
function sendWebRTCOffer(peerId, offer, options = {}) {
    if (!socket) return false;
    
    socket.emit('webrtc-offer', {
        to: peerId,
        offer: offer,
        fromUserName: options.fromUserName || 'Anonymous',
        isIceRestart: options.isIceRestart || false,
        isReconnect: options.isReconnect || false
    });
    
    return true;
}

/**
 * Send WebRTC answer to a peer
 */
function sendWebRTCAnswer(peerId, answer, options = {}) {
    if (!socket) return false;
    
    socket.emit('webrtc-answer', {
        to: peerId,
        answer: answer,
        fromUserName: options.fromUserName || 'Anonymous',
        isIceRestart: options.isIceRestart || false
    });
    
    return true;
}

/**
 * Send ICE candidate to a peer
 */
function sendICECandidate(peerId, candidate) {
    if (!socket) return false;
    
    socket.emit('webrtc-ice-candidate', {
        to: peerId,
        candidate: candidate
    });
    
    return true;
}

/**
 * Send a ping request to specific user
 */
function sendPingRequest(userId) {
    if (!socket) return false;
    
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
    return socketId;
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
    getSocket
};

// If the module is loaded in a Node.js environment, export it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCSignaling;
} 