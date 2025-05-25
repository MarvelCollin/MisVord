/**
 * WebRTC Signaling Module
 * Handles all socket connection and signaling for WebRTC
 */

// ENV Configuration - Similar to .env file values
// Remove local ENV_CONFIG definition, assume window.ENV_CONFIG from webrtc.js is available

// Create namespace for signaling
window.WebRTCSignaling = window.WebRTCSignaling || {};

// Singleton socket connection
let socket = null;
let socketId = null;

// Connection status tracking
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Fix Docker service names in URLs
 * Browsers cannot resolve Docker internal service names like 'socket-server'
 * @param {string} url - The URL to fix
 * @return {string} The fixed URL
 */
function fixDockerServiceNames(url) {
    if (!url) return url;
    
    // Replace Docker service name with localhost for local development
    if (url.includes('socket-server')) {
        console.warn("[WebRTC] Detected Docker service name in socket URL, replacing with localhost");
        return url.replace('socket-server', 'localhost');
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
    
    connectionAttempts = 0;
    
    try {
        // Use WebRTCConfig to get consistent configuration
        if (!window.WebRTCConfig) {
            console.warn("[WebRTC Signaling] WebRTCConfig not found. Creating fallback configuration.");
            
            // Create fallback configuration with standardized socket paths
            window.WebRTCConfig = {
                // Determine if we're in a local environment
                isLocalEnvironment: function() {
                    return window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
                },
                
                // Get the socket URL based on environment
                getSocketUrl: function() {
                    const isLocal = this.isLocalEnvironment();
                    return isLocal ? 'http://localhost:1002' : 'https://marvelcollin.my.id';
                },
                
                // Get standardized socket path based on environment
                getSocketPath: function() {
                    const isLocal = this.isLocalEnvironment();
                    return isLocal ? '/socket.io' : '/misvord/socket/socket.io';
                },
                
                // Get socket connection options
                getSocketOptions: function() {
                    return {
                        path: this.getSocketPath(),
                        transports: ['websocket', 'polling'],
                        reconnectionAttempts: this.isLocalEnvironment() ? 10 : 5,
                        reconnectionDelay: this.isLocalEnvironment() ? 500 : 1000,
                        timeout: this.isLocalEnvironment() ? 10000 : 5000
                    };
                },
                
                // Get environment information for debugging
                getEnvironmentInfo: function() {
                    const isLocal = this.isLocalEnvironment();
                    return {
                        environment: isLocal ? 'LOCAL' : 'PRODUCTION',
                        isLocal: isLocal,
                        isProduction: !isLocal,
                        hostname: window.location.hostname,
                        protocol: window.location.protocol,
                        socketUrl: this.getSocketUrl(),
                        socketPath: this.getSocketPath()
                    };
                }
            };
        }
        
        const socketUrl = window.WebRTCConfig.getSocketUrl();
        const socketOptions = window.WebRTCConfig.getSocketOptions();
        
        console.log(`[WebRTC Signaling] Connecting to: ${socketUrl} with path: ${socketOptions.path}`);
        
        // Disconnect existing socket if any
        if (socket) {
            console.log("Disconnecting existing socket before creating a new one");
            socket.disconnect();
            socket = null;
        }
        
        // Create socket connection with consistent configuration
        // Handle namespace if specified
        if (socketOptions.namespace && socketOptions.namespace.length > 0) {
            console.log(`[WebRTC Signaling] Using namespace: ${socketOptions.namespace}`);
            // Remove namespace from options to avoid duplicate
            const { namespace, ...remainingOptions } = socketOptions;
            socket = io(`${socketUrl}${namespace}`, remainingOptions);
        } else {
            socket = io(socketUrl, socketOptions);
        }
        
        setupSocketEvents(roomId, userName, onConnected, onError);
        
        // Handle connection errors
        socket.io.on("error", (error) => {
            console.error("Socket.IO error:", error);
            window.WebRTCUI.addLogEntry(`Socket.IO error: ${error.type || error.message}`, 'error');
            
            if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                connectionAttempts++;
                // Try fallback with polling only
                if (socket) socket.disconnect();
                
                window.WebRTCUI.addLogEntry(`Trying fallback connection (attempt ${connectionAttempts})`, 'socket');
                
                // Modify options for fallback attempt
                const fallbackOptions = {...socketOptions};
                fallbackOptions.transports = ['polling']; 
                fallbackOptions.timeout = 10000;
                fallbackOptions.query = {
                    ...fallbackOptions.query,
                    attempt: connectionAttempts
                };
                
                // Handle namespace for fallback too
                if (socketOptions.namespace && socketOptions.namespace.length > 0) {
                    const { namespace, ...remainingOptions } = fallbackOptions;
                    socket = io(`${socketUrl}${namespace}`, remainingOptions);
                } else {
                    socket = io(socketUrl, fallbackOptions);
                }
                
                setupSocketEvents(roomId, userName, onConnected, onError);
            } else {
                if (onError) onError("Failed to connect after multiple attempts");
            }
        });
        
    } catch (e) {
        console.error("Error initializing Socket.IO connection:", e);
        window.WebRTCUI.addLogEntry(`Error connecting to signaling server: ${e.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection Failed');
        
        if (onError) onError(e.message || "Failed to initialize socket connection");
    }
}

/**
 * Remove all event listeners from a socket instance
 * This function carefully removes tracked listeners to avoid memory leaks
 * @param {Object} socketInstance - The socket instance to clean up
 */
function removeSocketEventListeners(socketInstance) {
    if (!socketInstance) return;
    
    // First use general removeAllListeners for basic cleanup
    socketInstance.removeAllListeners();
    if (socketInstance.io && typeof socketInstance.io.removeAllListeners === 'function') {
        socketInstance.io.removeAllListeners(); // Remove manager listeners too
    }
    
    // Then do targeted removal if we have tracked handlers
    if (socketInstance._eventHandlers) {
        for (const [event, handlers] of Object.entries(socketInstance._eventHandlers)) {
            handlers.forEach(handler => {
                try {
                    socketInstance.off(event, handler);
                } catch (e) {
                    console.warn(`[WebRTC Signaling] Error removing handler for ${event}:`, e);
                }
            });
        }
        
        // Clear the handler tracking
        socketInstance._eventHandlers = {};
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
    
    // Create a store for handlers to enable clean removal later
    if (!socket._eventHandlers) {
        socket._eventHandlers = {};
    }
    
    // Clean helper function to add event handlers with tracking
    const addTrackedHandler = (event, handler) => {
        // Store reference to handler for later removal
        if (!socket._eventHandlers[event]) {
            socket._eventHandlers[event] = [];
        }
        socket._eventHandlers[event].push(handler);
        
        // Attach the handler
        socket.on(event, handler);
    };
    
    // Remove any existing event handlers to avoid duplicates from multiple connection attempts
    removeSocketEventListeners(socket);
    
    // Connection events
    addTrackedHandler('connect', () => {
        socketId = socket.id;
        connectionAttempts = 0; // Reset main attempt counter on successful connection
        
        window.WebRTCUI.addLogEntry(`✅ Connected to signaling server! ID: ${socketId} via ${socket.io.engine.transport.name}`, 'success');
        window.WebRTCUI.updateConnectionStatus('connected', 'Connected to server');
        
        window.WebRTCUI.addLogEntry(`Joining room: ${roomId} as ${userName}`, 'socket');
        socket.emit('joinVideoChat', { 
            userId: socket.id, 
            userName: userName 
        });
    });
    
    addTrackedHandler('disconnect', (reason) => {
        window.WebRTCUI.addLogEntry(`Disconnected from signaling server: ${reason}`, 'socket');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Disconnected: ${reason}`);
        // Potentially trigger reconnection logic here or notify user
        if (reason === 'io server disconnect') {
             // The server deliberately disconnected the socket
             if (onError) onError("Server disconnected session.");
        }
    });
    
    addTrackedHandler('error', (error) => { // This is for errors on an established socket
        console.error("Socket instance error:", error);
        window.WebRTCUI.addLogEntry(`Socket instance error: ${error.message || error}`, 'error');
        // This usually implies a problem with an active connection, not failure to connect
    });
    
    addTrackedHandler('connect_error', (error) => {
        console.error("Socket connect_error:", error);
        window.WebRTCUI.addLogEntry(`Connection establishment error: ${error.message}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Connection Error: ${error.message}`);
        
        // Simple fallback approach
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS && !socket.active) { // Check if not already active/retrying
            connectionAttempts++;
            window.WebRTCUI.addLogEntry(`Connect_error, trying fallback (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`, 'socket');
            
            if(socket) socket.disconnect();
            
            // Create new connection with modified options
            const socketUrl = window.WebRTCConfig.getSocketUrl();
            const socketOptions = window.WebRTCConfig.getSocketOptions();
            
            // Modify options to prefer polling if WebSocket fails
            if (error.message.toLowerCase().includes('websocket')) {
                socketOptions.transports = ['polling'];
            }
            
            // Update query param to track attempt
            socketOptions.query = { 
                ...socketOptions.query,
                attempt: connectionAttempts
            };
            
            // Try new connection
            socket = io(socketUrl, socketOptions);
            setupSocketEvents(roomId, userName, onConnected, onError);
            
        } else if (!socket.active) {
            if (onError) onError(error.message || "Connection failed after multiple attempts");
        }
    });
    
    addTrackedHandler('reconnect_attempt', (attemptNumber) => {
        window.WebRTCUI.addLogEntry(`Reconnection attempt ${attemptNumber}...`, 'socket');
        window.WebRTCUI.updateConnectionStatus('connecting', `Reconnecting... (${attemptNumber})`);
    });

    addTrackedHandler('reconnect_error', (error) => {
        console.error("Reconnect error:", error);
        window.WebRTCUI.addLogEntry(`Reconnect error: ${error.message}`, 'error');
    });
    
    addTrackedHandler('reconnect_failed', () => {
        window.WebRTCUI.addLogEntry('Reconnection failed. Please refresh the page.', 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Reconnection Failed');
        if (onError) onError("Reconnection failed after multiple attempts");
    });
    
    // Room-specific events
    addTrackedHandler('room-joined', (data) => {
        const { roomId: joinedRoomId, users } = data; // Renamed to avoid conflict with outer scope roomId
        window.WebRTCUI.addLogEntry(`Joined room: ${joinedRoomId} with ${users ? users.length : 0} other users`, 'socket');
        window.WebRTCUI.updateConnectionStatus('in-room', `Connected to Room: ${joinedRoomId}`);
        if (onConnected) onConnected(users);
    });
    
    addTrackedHandler('currentUsers', (users) => {
        window.WebRTCUI.addLogEntry(`Received users list with ${users ? users.length : 0} users`, 'socket');
        if (onConnected && (!socket.flags || !socket.flags.roomJoinedCalled) ) { 
            socket.flags = socket.flags || {};
            socket.flags.roomJoinedCalled = true; 
            onConnected(users); 
        }
    });

    addTrackedHandler('userJoined', (userData) => {
        window.WebRTCUI.addLogEntry(`User joined video room: ${userData.userName} (ID: ${userData.socketId})`, 'user');
        // This event will be handled by webrtc-controller.js to create peer connections
    });

    addTrackedHandler('userLeft', (userData) => {
        window.WebRTCUI.addLogEntry(`User left video room: ${userData.userName || 'Unknown'} (ID: ${userData.socketId})`, 'user');
        // Handled by webrtc-controller.js
    });

    addTrackedHandler('signal', (signalData) => {
        const type = signalData.signal ? 
            (signalData.signal.type || 'unknown') : 'unknown';
            
        if (type === 'offer') {
            window.WebRTCUI.addLogEntry(`Received WebRTC offer from ${signalData.userName || signalData.from}`, 'signal');
            // Convert to expected format for compatibility with existing code
            const offerData = {
                from: signalData.from,
                fromUserName: signalData.userName,
                offer: signalData.signal
            };
            // Emit normalized event for controllers listening to the old event name
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('webrtc-offer', { detail: offerData }));
            }
        } 
        else if (type === 'answer') {
            window.WebRTCUI.addLogEntry(`Received WebRTC answer from ${signalData.userName || signalData.from}`, 'signal');
            // Convert to expected format for compatibility with existing code
            const answerData = {
                from: signalData.from,
                fromUserName: signalData.userName,
                answer: signalData.signal
            };
            // Emit normalized event for controllers listening to the old event name
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('webrtc-answer', { detail: answerData }));
            }
        }
        else if (type === 'candidate') {
            if(window.appDebugMode) window.WebRTCUI.addLogEntry(`Received ICE candidate from ${signalData.from}`, 'signal');
            // Convert to expected format for compatibility with existing code
            const candidateData = {
                from: signalData.from,
                candidate: signalData.signal.candidate
            };
            // Emit normalized event for controllers listening to the old event name
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('webrtc-ice-candidate', { detail: candidateData }));
            }
        }
        // Handled by webrtc-controller.js
    });

    // Keep legacy event listeners for backward compatibility during transition
    addTrackedHandler('webrtc-offer', (offerData) => {
        window.WebRTCUI.addLogEntry(`(Legacy) Received WebRTC offer from ${offerData.fromUserName || offerData.from}`, 'signal');
        // This will be phased out in favor of unified 'signal' event
    });

    addTrackedHandler('webrtc-answer', (answerData) => {
        window.WebRTCUI.addLogEntry(`(Legacy) Received WebRTC answer from ${answerData.fromUserName || answerData.from}`, 'signal');
        // This will be phased out in favor of unified 'signal' event
    });

    addTrackedHandler('webrtc-ice-candidate', (candidateData) => {
        if(window.appDebugMode) window.WebRTCUI.addLogEntry(`(Legacy) Received ICE candidate from ${candidateData.from}`, 'signal');
        // This will be phased out in favor of unified 'signal' event
    });

    addTrackedHandler('video-room-error', (errorData) => {
        console.error("Video room error:", errorData);
        window.WebRTCUI.addLogEntry(`Video Room Error: ${errorData.message}`, 'error');
    });

    // Ping system related events if used by application logic
    addTrackedHandler('ping-user-request', (requestData) => {
        window.WebRTCUI.addLogEntry(`Received ping request from ${requestData.fromUserName || requestData.from}`, 'debug');
    });

    addTrackedHandler('ping-response', (responseData) => {
        window.WebRTCUI.addLogEntry(`Received ping response regarding ${responseData.targetId}, status: ${responseData.status}`, 'debug');
    });
    
    // Other application-specific events would be here...
}

/**
 * Leave the current video room
 */
function leaveVideoRoom(onLeaveCallback) {
    if (socket && socket.connected) {
        socket.emit('leaveVideoChat');
        window.WebRTCUI.addLogEntry("Sent 'leaveVideoChat' signal", 'socket');
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
    // Use unified 'signal' event to match server implementation
    socket.emit('signal', {
        to: peerId,
        signal: {
            ...offer,
            type: 'offer'
        },
        userId: options.userId || socket.id,
        userName: options.fromUserName || window.userName || 'Anonymous',
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
    // Use unified 'signal' event to match server implementation
    socket.emit('signal', {
        to: peerId,
        signal: {
            ...answer,
            type: 'answer'
        },
        userId: options.userId || socket.id,
        userName: options.fromUserName || window.userName || 'Anonymous',
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
    // Use unified 'signal' event to match server implementation
    socket.emit('signal', {
        to: peerId,
        signal: {
            type: 'candidate',
        candidate: candidate
        }
    });
    // This can be very noisy so don't log every candidate
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
 * Reconnect to the signaling server
 * @param {string} roomId - Room ID to rejoin
 * @param {string} userName - User name to use
 */
function reconnect(roomId, userName) {
    console.log("[WebRTC Signaling] Reconnecting to signaling server");
    window.WebRTCUI.addLogEntry('Reconnecting to signaling server...', 'socket');
    
    // Use cached or provided room/user info
    const roomToJoin = roomId || window.VIDEO_CHAT_ROOM || 'global-video-chat';
    const userNameToUse = userName || window.userName || ('User_' + Math.floor(Math.random() * 10000));

    // Close existing connection
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    // Make sure we get fresh configuration on reconnect
    // This is important in VPS environments where paths may have changed
    if (window.WebRTCConfig) {
        // Force path re-evaluation in case we switched environments (local <-> VPS)
        const socketUrl = window.WebRTCConfig.getSocketUrl();
        const socketOptions = window.WebRTCConfig.getSocketOptions();
        
        // Store the current environment info for debugging
        const envInfo = window.WebRTCConfig.getEnvironmentInfo ? 
                        window.WebRTCConfig.getEnvironmentInfo() : 
                        { environment: 'unknown' };
                        
        console.log(`[WebRTC Signaling] Reconnecting in ${envInfo.environment || 'unknown'} environment`);
        console.log(`[WebRTC Signaling] Socket URL: ${socketUrl}, Path: ${socketOptions.path}`);
        window.WebRTCUI.addLogEntry(`Reconnecting to ${socketUrl} with path ${socketOptions.path}`, 'socket');
        
        // Create new socket with fresh configuration
        // Handle namespace if specified
        if (socketOptions.namespace && socketOptions.namespace.length > 0) {
            console.log(`[WebRTC Signaling] Using namespace for reconnect: ${socketOptions.namespace}`);
            // Remove namespace from options to avoid duplicate
            const { namespace, ...remainingOptions } = socketOptions;
            socket = io(`${socketUrl}${namespace}`, remainingOptions);
                } else {
            socket = io(socketUrl, socketOptions);
        }
        
        // Setup connection events
        setupSocketEvents(roomToJoin, userNameToUse, 
            // Success callback
            (users) => {
                window.WebRTCUI.addLogEntry('Reconnected successfully!', 'success');
                window.WebRTCUI.updateConnectionStatus('connected', 'Reconnected to server');
            },
            // Error callback
            (error) => {
                window.WebRTCUI.addLogEntry(`Failed to reconnect: ${error}`, 'error');
                window.WebRTCUI.updateConnectionStatus('disconnected', 'Reconnection Failed');
            }
        );
    } else {
        console.error('[WebRTC Signaling] Cannot reconnect: WebRTCConfig not available');
        window.WebRTCUI.addLogEntry('Cannot reconnect: configuration not available', 'error');
    }
}

// Export the socket instance to window for direct access by debugging tools
function exportSocket() {
    window.socket = socket; // Make socket globally available
    window.socketId = socketId; // Make socket ID globally available
}

/**
 * Initialize the WebRTC signaling module
 * This should be called before any other functions to ensure proper setup
 * @param {Object} config - Optional configuration settings
 * @returns {Object} The WebRTCSignaling object
 */
function initialize(config = {}) {
    console.log('[WebRTC Signaling] Initializing module');
    
    // Reset connection state
    if (socket) {
        try {
            socket.disconnect();
        } catch (e) {
            console.warn('[WebRTC Signaling] Error disconnecting existing socket:', e);
        }
        socket = null;
    }
    
    socketId = null;
    connectionAttempts = 0;
    
    // Make sure WebRTCConfig is available
    if (!window.WebRTCConfig) {
        console.warn('[WebRTC Signaling] WebRTCConfig not found. Creating fallback configuration.');
        
        // Create standardized fallback configuration
        window.WebRTCConfig = {
            // Determine if we're in a local environment
            isLocalEnvironment: function() {
                return window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
            },
            
            // Get the socket URL based on environment
            getSocketUrl: function() {
                const isLocal = this.isLocalEnvironment();
                return isLocal ? 'http://localhost:1002' : 'https://marvelcollin.my.id';
            },
            
            // Get standardized socket path based on environment
            getSocketPath: function() {
                const isLocal = this.isLocalEnvironment();
                return isLocal ? '/socket.io' : '/misvord/socket/socket.io';
            },
            
            // Get socket connection options
            getSocketOptions: function() {
                return {
                    path: this.getSocketPath(),
                    transports: ['websocket', 'polling'],
                    reconnectionAttempts: this.isLocalEnvironment() ? 10 : 5,
                    reconnectionDelay: this.isLocalEnvironment() ? 500 : 1000,
                    timeout: this.isLocalEnvironment() ? 10000 : 5000
                };
            },
            
            // Get environment information for debugging
            getEnvironmentInfo: function() {
                const isLocal = this.isLocalEnvironment();
                return {
                    environment: isLocal ? 'LOCAL' : 'PRODUCTION',
                    isLocal: isLocal,
                    isProduction: !isLocal,
                    hostname: window.location.hostname,
                    protocol: window.location.protocol,
                    socketUrl: this.getSocketUrl(),
                    socketPath: this.getSocketPath()
                };
            }
        };
    }
    
    // Log configuration
    const envInfo = window.WebRTCConfig.getEnvironmentInfo ? 
        window.WebRTCConfig.getEnvironmentInfo() : 
        { isLocal: true, socketUrl: '(unknown)', socketPath: '(unknown)' };
        
    console.log('[WebRTC Signaling] Environment:', envInfo.isLocal ? 'Development' : 'Production');
    console.log('[WebRTC Signaling] Socket URL:', envInfo.socketUrl);
    console.log('[WebRTC Signaling] Socket Path:', envInfo.socketPath);
    
    return window.WebRTCSignaling;
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
    reconnect,
    exportSocket,
    initialize
};

// Add socket ID update handler when connected
        if (socket) {
            socket.on('connect', () => {
                window.socketId = socket.id;
            });
        }

// Export socket to window for debugging
exportSocket();

// If the module is loaded in a Node.js environment, export it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCSignaling;
}