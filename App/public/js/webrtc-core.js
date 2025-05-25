/**
 * WebRTC Core Module
 * Consolidated core functionality for video calling system
 * Combines: config, signaling, peer connections, media control, and main controller
 */

// =====================================
// CONFIGURATION AND ENVIRONMENT SETUP
// =====================================

// Environment detection
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.includes('marvelcollin.my.id');
const isDockerLocal = window.location.port === '1001'; // Docker local environment

// Socket configuration
const SOCKET_BASE_URL_LOCAL = 'http://localhost:1002';
const SOCKET_BASE_URL_DOCKER = window.location.origin.replace(':1001', ':1002'); // Docker environment
const SOCKET_BASE_URL_PROD = 'https://marvelcollin.my.id';
const SOCKET_PATH_LOCAL = '/socket.io';
const SOCKET_PATH_PROD = '/misvord/socket/socket.io';

// Global configuration object
window.ENV_CONFIG = {
    IS_VPS: !isLocalhost && !isDockerLocal,
    SOCKET_BASE_URL_LOCAL: SOCKET_BASE_URL_LOCAL,
    SOCKET_BASE_URL_DOCKER: SOCKET_BASE_URL_DOCKER,
    SOCKET_BASE_URL_PROD: SOCKET_BASE_URL_PROD,
    SOCKET_PATH: (isProduction ? SOCKET_PATH_PROD : SOCKET_PATH_LOCAL),
    DEBUG_MODE: !isProduction,
    
    getCurrentConfig: function() {
        let url, path;
        
        if (isProduction) {
            url = this.SOCKET_BASE_URL_PROD;
            path = SOCKET_PATH_PROD;
        } else if (isDockerLocal) {
            url = this.SOCKET_BASE_URL_DOCKER;
            path = SOCKET_PATH_LOCAL;
        } else {
            url = this.SOCKET_BASE_URL_LOCAL;
            path = SOCKET_PATH_LOCAL;
        }
        
        return {
            url: url,
            path: path,
            secure: isProduction
        };
    }
};

// WebRTC Configuration
window.WebRTCConfig = {
    getSocketUrl: () => {
        if (isProduction) return SOCKET_BASE_URL_PROD;
        if (isDockerLocal) return SOCKET_BASE_URL_DOCKER;
        return SOCKET_BASE_URL_LOCAL;
    },
    
    getSocketOptions: () => ({
        path: isProduction ? SOCKET_PATH_PROD : SOCKET_PATH_LOCAL,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 15000,
        forceNew: true
    }),
    
    isWebRTCSupported: () => {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.RTCPeerConnection);
    },
    
    isSecureContext: () => {
        return window.location.protocol === 'https:' || isLocalhost;
    },
      getEnvironmentInfo: () => ({
        environment: isProduction ? 'PRODUCTION' : (isDockerLocal ? 'DOCKER' : 'LOCAL'),
        isLocal: isLocalhost && !isDockerLocal,
        isDocker: isDockerLocal,
        isProduction: isProduction,
        hostname: window.location.hostname,
        port: window.location.port,
        socketUrl: window.WebRTCConfig.getSocketUrl(),
        socketPath: isProduction ? SOCKET_PATH_PROD : SOCKET_PATH_LOCAL
    }),
    
    // ICE Servers for NAT traversal
    getIceServers: () => [
        // Google STUN servers
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
        
        // Free TURN servers for Docker/NAT traversal
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp',
                'turns:openrelay.metered.ca:443'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

// =====================================
// SIGNALING AND SOCKET CONNECTION
// =====================================

// Global socket instance
window.socket = null;
let socketId = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Signaling namespace
window.WebRTCSignaling = {
    /**
     * Connect to the signaling server
     */
    connectToSignalingServer: function(roomId, userName, onConnected, onError) {
        window.VIDEO_CHAT_ROOM = roomId || 'global-video-chat';
        window.userName = userName || 'User_' + Math.floor(Math.random() * 10000);
        
        console.log(`[WebRTC Signaling] Connecting to room: ${roomId}, user: ${userName}`);
        
        connectionAttempts = 0;
        this.attemptConnection(onConnected, onError);
    },
    
    /**
     * Attempt socket connection
     */
    attemptConnection: function(onConnected, onError) {
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
            console.error('[WebRTC Signaling] Max connection attempts reached');
            if (onError) onError(new Error('Max connection attempts reached'));
            return;
        }
        
        connectionAttempts++;
        console.log(`[WebRTC Signaling] Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
        
        const config = window.ENV_CONFIG.getCurrentConfig();
        
        try {
            window.socket = io(config.url, {
                path: config.path,
                transports: ['websocket', 'polling'],
                timeout: 10000,
                forceNew: true
            });
            
            this.setupSocketHandlers(onConnected, onError);
            
        } catch (error) {
            console.error('[WebRTC Signaling] Connection error:', error);
            if (onError) onError(error);
        }
    },
    
    /**
     * Setup socket event handlers
     */
    setupSocketHandlers: function(onConnected, onError) {
        window.socket.on('connect', () => {
            console.log('[WebRTC Signaling] Socket connected:', window.socket.id);
            socketId = window.socket.id;
            window.socketId = socketId;
            
            // Join the video chat room
            window.socket.emit('joinRoom', {
                roomId: window.VIDEO_CHAT_ROOM,
                userName: window.userName
            });
            
            if (onConnected) onConnected();
        });
        
        window.socket.on('disconnect', (reason) => {
            console.warn('[WebRTC Signaling] Socket disconnected:', reason);
            socketId = null;
        });
        
        window.socket.on('connect_error', (error) => {
            console.error('[WebRTC Signaling] Connection error:', error);
            
            // Retry connection if not max attempts
            if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                setTimeout(() => {
                    this.attemptConnection(onConnected, onError);
                }, 2000);
            } else if (onError) {
                onError(error);
            }
        });
        
        // WebRTC signaling events
        this.setupWebRTCSignaling();
    },
    
    /**
     * Setup WebRTC signaling event handlers
     */
    setupWebRTCSignaling: function() {
        window.socket.on('userJoined', (data) => {
            console.log('[WebRTC Signaling] User joined:', data.userName);
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.handleUserJoined(data);
            }
        });
        
        window.socket.on('userLeft', (data) => {
            console.log('[WebRTC Signaling] User left:', data.userName);
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.handleUserLeft(data);
            }
        });
        
        window.socket.on('offer', (data) => {
            console.log('[WebRTC Signaling] Received offer from:', data.from);
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.handleOffer(data);
            }
        });
        
        window.socket.on('answer', (data) => {
            console.log('[WebRTC Signaling] Received answer from:', data.from);
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.handleAnswer(data);
            }
        });
        
        window.socket.on('ice-candidate', (data) => {
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.handleIceCandidate(data);
            }
        });
    },
    
    /**
     * Reconnect to signaling server
     */
    reconnect: function() {
        console.log('[WebRTC Signaling] Reconnecting...');
        
        if (window.socket) {
            window.socket.disconnect();
        }
        
        connectionAttempts = 0;
        
        setTimeout(() => {
            this.connectToSignalingServer(
                window.VIDEO_CHAT_ROOM,
                window.userName,
                () => console.log('[WebRTC Signaling] Reconnected successfully'),
                (error) => console.error('[WebRTC Signaling] Reconnection failed:', error)
            );
        }, 1000);
    },
    
    /**
     * Export socket to global scope
     */
    exportSocket: function() {
        window.WebRTCSocket = window.socket;
    }
};

// =====================================
// MEDIA CONTROL AND STREAM MANAGEMENT
// =====================================

// Media state variables
let localStream = null;
let screenStream = null;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isScreenSharing = false;

// Media constraints
const getMediaConstraints = () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        return {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: {
                width: { ideal: 640, max: 640 },
                height: { ideal: 480, max: 480 },
                frameRate: { max: 20 },
                facingMode: 'user'
            }
        };
    }
    
    return {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: {
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 30 }
        }
    };
};

// Media control namespace
window.WebRTCMedia = {
    localStream: null,
    
    /**
     * Initialize local media stream
     */
    initLocalStream: async function(audio = true, video = true, onSuccess = null, onError = null) {
        try {
            console.log('[WebRTC Media] Requesting media access');
            
            // Stop existing stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            const constraints = getMediaConstraints();
            constraints.audio = audio ? constraints.audio : false;
            constraints.video = video ? constraints.video : false;
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            localStream = this.localStream; // Keep global reference
            
            console.log('[WebRTC Media] Media stream obtained:', 
                       this.localStream.getTracks().map(t => t.kind).join(', '));
            
            // Update local video element
            const localVideo = document.getElementById('localVideo');
            if (localVideo && video) {
                localVideo.srcObject = this.localStream;
                localVideo.muted = true; // Prevent feedback
            }
            
            // Update state
            isVideoEnabled = video;
            isAudioEnabled = audio;
            
            if (onSuccess) onSuccess(this.localStream);
            return true;
            
        } catch (error) {
            console.error('[WebRTC Media] Media access error:', error);
            if (onError) onError(error);
            return false;
        }
    },
    
    /**
     * Retry media access (for permission retry)
     */
    retryMediaAccess: function(video = true) {
        console.log('[WebRTC Media] Retrying media access, video:', video);
        
        return this.initLocalStream(true, video)
            .then(() => {
                console.log('[WebRTC Media] Media access retry successful');
                
                // Hide permission dialog
                const permissionRequest = document.getElementById('permissionRequest');
                if (permissionRequest) {
                    permissionRequest.style.display = 'none';
                }
                
                return true;
            })
            .catch(error => {
                console.error('[WebRTC Media] Media access retry failed:', error);
                return false;
            });
    },
    
    /**
     * Toggle video on/off
     */
    toggleVideo: function() {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            isVideoEnabled = videoTracks.length > 0 && videoTracks[0].enabled;
            console.log('[WebRTC Media] Video toggled:', isVideoEnabled);
        }
        return isVideoEnabled;
    },
    
    /**
     * Toggle audio on/off
     */
    toggleAudio: function() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            isAudioEnabled = audioTracks.length > 0 && audioTracks[0].enabled;
            console.log('[WebRTC Media] Audio toggled:', isAudioEnabled);
        }
        return isAudioEnabled;
    },
    
    /**
     * Start screen sharing
     */
    startScreenShare: async function() {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            console.log('[WebRTC Media] Screen sharing started');
            isScreenSharing = true;
            
            // Replace video track in all peer connections
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.replaceVideoTrack(screenStream.getVideoTracks()[0]);
            }
            
            // Handle screen share end
            screenStream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };
            
            return screenStream;
            
        } catch (error) {
            console.error('[WebRTC Media] Screen sharing error:', error);
            throw error;
        }
    },
    
    /**
     * Stop screen sharing
     */
    stopScreenShare: function() {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        
        isScreenSharing = false;
        console.log('[WebRTC Media] Screen sharing stopped');
        
        // Restore camera video track
        if (this.localStream && window.WebRTCPeerConnection) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                window.WebRTCPeerConnection.replaceVideoTrack(videoTrack);
            }
        }
    }
};

// =====================================
// PEER CONNECTION MANAGEMENT
// =====================================

// Peer connections map
let peers = {};

// RTC Configuration
const getRTCConfiguration = () => ({
    iceServers: window.WebRTCConfig.getIceServers(),
    iceCandidatePoolSize: 5,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan'
});

// Peer connection namespace
window.WebRTCPeerConnection = {
    peers: {},
    
    /**
     * Create a new peer connection
     */
    createPeerConnection: function(peerSocketId, peerUserName) {
        if (!peerSocketId) {
            console.error('[WebRTC Peer] Cannot create peer connection: Missing socket ID');
            return null;
        }
        
        console.log(`[WebRTC Peer] Creating peer connection for ${peerUserName} (${peerSocketId})`);
        
        try {
            const pc = new RTCPeerConnection(getRTCConfiguration());
            
            // Add local stream tracks
            if (window.WebRTCMedia.localStream) {
                window.WebRTCMedia.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, window.WebRTCMedia.localStream);
                });
            }
            
            // Handle remote stream
            pc.ontrack = (event) => {
                console.log(`[WebRTC Peer] Received remote stream from ${peerUserName}`);
                this.handleRemoteStream(peerSocketId, peerUserName, event.streams[0]);
            };
            
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && window.socket) {
                    window.socket.emit('ice-candidate', {
                        to: peerSocketId,
                        candidate: event.candidate
                    });
                }
            };
            
            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`[WebRTC Peer] Connection state with ${peerUserName}: ${pc.connectionState}`);
                
                if (pc.connectionState === 'failed') {
                    this.cleanupPeer(peerSocketId);
                }
            };
            
            this.peers[peerSocketId] = {
                connection: pc,
                userName: peerUserName
            };
            
            return pc;
            
        } catch (error) {
            console.error('[WebRTC Peer] Error creating peer connection:', error);
            return null;
        }
    },
    
    /**
     * Handle incoming offer
     */
    handleOffer: async function(data) {
        const { from, offer, userName } = data;
        
        try {
            const pc = this.createPeerConnection(from, userName);
            if (!pc) return;
            
            await pc.setRemoteDescription(offer);
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            window.socket.emit('answer', {
                to: from,
                answer: answer
            });
            
            console.log(`[WebRTC Peer] Sent answer to ${userName}`);
            
        } catch (error) {
            console.error('[WebRTC Peer] Error handling offer:', error);
        }
    },
    
    /**
     * Handle incoming answer
     */
    handleAnswer: async function(data) {
        const { from, answer } = data;
        
        try {
            const peer = this.peers[from];
            if (peer && peer.connection) {
                await peer.connection.setRemoteDescription(answer);
                console.log(`[WebRTC Peer] Set remote description from ${peer.userName}`);
            }
            
        } catch (error) {
            console.error('[WebRTC Peer] Error handling answer:', error);
        }
    },
    
    /**
     * Handle ICE candidate
     */
    handleIceCandidate: async function(data) {
        const { from, candidate } = data;
        
        try {
            const peer = this.peers[from];
            if (peer && peer.connection) {
                await peer.connection.addIceCandidate(candidate);
            }
            
        } catch (error) {
            console.error('[WebRTC Peer] Error handling ICE candidate:', error);
        }
    },
    
    /**
     * Handle user joined
     */
    handleUserJoined: async function(data) {
        const { socketId, userName } = data;
        
        if (socketId === window.socketId) return; // Don't connect to self
        
        console.log(`[WebRTC Peer] User joined: ${userName}`);
        
        // Create offer for new user
        try {
            const pc = this.createPeerConnection(socketId, userName);
            if (!pc) return;
            
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            window.socket.emit('offer', {
                to: socketId,
                offer: offer
            });
            
            console.log(`[WebRTC Peer] Sent offer to ${userName}`);
            
        } catch (error) {
            console.error('[WebRTC Peer] Error creating offer:', error);
        }
    },
    
    /**
     * Handle user left
     */
    handleUserLeft: function(data) {
        const { socketId, userName } = data;
        console.log(`[WebRTC Peer] User left: ${userName}`);
        this.cleanupPeer(socketId);
    },
    
    /**
     * Handle remote stream
     */
    handleRemoteStream: function(peerSocketId, peerUserName, stream) {
        console.log(`[WebRTC Peer] Setting up remote video for ${peerUserName}`);
        
        // Find or create remote video element
        let remoteVideo = document.getElementById(`remoteVideo-${peerSocketId}`);
        
        if (!remoteVideo) {
            remoteVideo = this.createRemoteVideoElement(peerSocketId, peerUserName);
        }
        
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }
    },
    
    /**
     * Create remote video element
     */
    createRemoteVideoElement: function(peerSocketId, peerUserName) {
        const container = document.getElementById('videoGrid') || 
                         document.getElementById('remoteVideos') ||
                         document.querySelector('.video-container') ||
                         document.body;
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'remote-video-container';
        videoContainer.id = `container-${peerSocketId}`;
        
        videoContainer.innerHTML = `
            <video id="remoteVideo-${peerSocketId}" autoplay playsinline class="remote-video"></video>
            <div class="username-label">${peerUserName}</div>
        `;
        
        container.appendChild(videoContainer);
        return videoContainer.querySelector('video');
    },
    
    /**
     * Replace video track (for screen sharing)
     */
    replaceVideoTrack: function(newTrack) {
        Object.values(this.peers).forEach(peer => {
            const sender = peer.connection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (sender) {
                sender.replaceTrack(newTrack);
            }
        });
    },
    
    /**
     * Cleanup peer connection
     */
    cleanupPeer: function(peerSocketId) {
        const peer = this.peers[peerSocketId];
        
        if (peer) {
            // Close peer connection
            if (peer.connection) {
                peer.connection.close();
            }
            
            // Remove video element
            const videoContainer = document.getElementById(`container-${peerSocketId}`);
            if (videoContainer) {
                videoContainer.remove();
            }
            
            delete this.peers[peerSocketId];
            console.log(`[WebRTC Peer] Cleaned up peer: ${peerSocketId}`);
        }
    }
};

// =====================================
// MAIN CONTROLLER
// =====================================

window.WebRTCController = {
    state: {
        initialized: false,
        userName: '',
        roomId: '',
        localSocketId: null,
        isCallActive: false
    },
    
    /**
     * Initialize the WebRTC application
     */
    init: function(config = {}) {
        this.config = {
            debugMode: false,
            roomId: 'global-video-chat',
            userName: 'User_' + Math.floor(Math.random() * 10000),
            autoJoin: true,
            ...config
        };
        
        console.log('[WebRTC Controller] Initializing with config:', this.config);
        
        // Check Socket.IO availability
        if (typeof io !== 'function') {
            console.error('[WebRTC Controller] Socket.IO not available!');
            this.loadSocketIO().then(() => this.continueInitialization());
            return;
        }
        
        this.continueInitialization();
    },
    
    /**
     * Load Socket.IO if not available
     */
    loadSocketIO: function() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = isLocalhost ? 
                'http://localhost:1002/socket.io/socket.io.js' :
                'https://cdn.socket.io/4.6.0/socket.io.min.js';
            
            script.onload = () => {
                console.log('[WebRTC Controller] Socket.IO loaded successfully');
                resolve();
            };
            
            script.onerror = () => {
                console.error('[WebRTC Controller] Failed to load Socket.IO');
                reject(new Error('Failed to load Socket.IO'));
            };
            
            document.head.appendChild(script);
        });
    },
    
    /**
     * Continue initialization after Socket.IO is loaded
     */
    continueInitialization: function() {
        // Update state
        this.state.userName = this.config.userName;
        this.state.roomId = this.config.roomId;
        
        // Connect to signaling server
        window.WebRTCSignaling.connectToSignalingServer(
            this.state.roomId,
            this.state.userName,
            () => {
                console.log('[WebRTC Controller] Connected to signaling server');
                this.state.initialized = true;
                
                // Initialize media if auto-join is enabled
                if (this.config.autoJoin) {
                    this.requestMediaPermissions();
                }
            },
            (error) => {
                console.error('[WebRTC Controller] Failed to connect to signaling server:', error);
            }
        );
        
        // Setup UI event handlers
        this.setupUIHandlers();
    },
    
    /**
     * Request media permissions
     */
    requestMediaPermissions: function() {
        console.log('[WebRTC Controller] Requesting media permissions');
        
        window.WebRTCMedia.initLocalStream(true, true, 
            (stream) => {
                console.log('[WebRTC Controller] Media permissions granted');
                this.state.isCallActive = true;
            },
            (error) => {
                console.error('[WebRTC Controller] Media permission denied:', error);
            }
        );
    },
    
    /**
     * Setup UI event handlers
     */
    setupUIHandlers: function() {
        // Camera permission retry button
        const retryBtn = document.getElementById('retryPermissionBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                window.WebRTCMedia.retryMediaAccess(true);
            });
        }
        
        // Audio-only button
        const audioOnlyBtn = document.getElementById('audioOnlyBtn');
        if (audioOnlyBtn) {
            audioOnlyBtn.addEventListener('click', () => {
                window.WebRTCMedia.retryMediaAccess(false);
            });
        }
        
        // Video toggle button
        const videoToggleBtn = document.getElementById('toggleVideo');
        if (videoToggleBtn) {
            videoToggleBtn.addEventListener('click', () => {
                const enabled = window.WebRTCMedia.toggleVideo();
                videoToggleBtn.textContent = enabled ? 'Turn Off Video' : 'Turn On Video';
            });
        }
        
        // Audio toggle button
        const audioToggleBtn = document.getElementById('toggleAudio');
        if (audioToggleBtn) {
            audioToggleBtn.addEventListener('click', () => {
                const enabled = window.WebRTCMedia.toggleAudio();
                audioToggleBtn.textContent = enabled ? 'Mute' : 'Unmute';
            });
        }
        
        // Screen share button
        const screenShareBtn = document.getElementById('shareScreen');
        if (screenShareBtn) {
            screenShareBtn.addEventListener('click', () => {
                if (!isScreenSharing) {
                    window.WebRTCMedia.startScreenShare()
                        .then(() => {
                            screenShareBtn.textContent = 'Stop Sharing';
                        })
                        .catch(error => {
                            console.error('Screen sharing failed:', error);
                        });
                } else {
                    window.WebRTCMedia.stopScreenShare();
                    screenShareBtn.textContent = 'Share Screen';
                }
            });
        }
    }
};

// =====================================
// INITIALIZATION
// =====================================

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[WebRTC Core] Module loaded, ready for initialization');
});

// Export for global access
window.WebRTCCore = {
    init: () => window.WebRTCController.init(),
    getVersion: () => '2.0.0-consolidated'
};

console.log('[WebRTC Core] Consolidated WebRTC module loaded successfully');
