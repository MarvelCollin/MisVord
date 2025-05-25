/**
 * Simplified All-in-One WebRTC Module for MiscVord
 * This replaces all the complex modules with a single, clean implementation
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        SOCKET_URL: 'http://localhost:1002',
        SOCKET_PATH: '/socket.io',
        DEBUG: true,
        ICE_SERVERS: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };
    
    // Global state
    let socket = null;
    let localStream = null;
    let peers = new Map(); // Map of peer connections
    let isConnected = false;
    
    // Logging utility
    function log(message, type = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        if (CONFIG.DEBUG) {
            console.log(`[WebRTC ${type}] ${timestamp}: ${message}`);
        }
        
        // Update UI if elements exist
        const statusElement = document.getElementById('permissionStatus');
        if (statusElement && type === 'ERROR') {
            statusElement.innerHTML = `❌ ${message}`;
        } else if (statusElement && type === 'SUCCESS') {
            statusElement.innerHTML = `✅ ${message}`;
        }
    }
    
    // Initialize socket connection
    function initSocket() {
        if (socket) return;
        
        log(`Connecting to ${CONFIG.SOCKET_URL}${CONFIG.SOCKET_PATH}`);
        
        socket = io(CONFIG.SOCKET_URL, {
            path: CONFIG.SOCKET_PATH,
            transports: ['websocket', 'polling'],
            timeout: 10000,
            forceNew: true
        });
        
        socket.on('connect', () => {
            log('Socket connected successfully', 'SUCCESS');
            isConnected = true;
            updateConnectionUI('Connected', 'success');
        });
        
        socket.on('disconnect', () => {
            log('Socket disconnected', 'WARNING');
            isConnected = false;
            updateConnectionUI('Disconnected', 'error');
        });
        
        socket.on('connect_error', (error) => {
            log(`Connection error: ${error.message}`, 'ERROR');
            isConnected = false;
            updateConnectionUI(`Error: ${error.message}`, 'error');
        });
        
        // WebRTC signaling events
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
    }
    
    // Update connection UI
    function updateConnectionUI(message, type) {
        const statusElements = [
            document.getElementById('connectionStatus'),
            document.getElementById('permissionStatus')
        ];
        
        statusElements.forEach(element => {
            if (element) {
                element.textContent = message;
                element.className = `status ${type}`;
            }
        });
    }
    
    // Request camera and microphone permissions
    async function requestMediaPermissions() {
        try {
            log('Requesting camera and microphone access...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            localStream = stream;
            log('Media permissions granted', 'SUCCESS');
            
            // Display local video
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
                localVideo.muted = true; // Prevent echo
            }
            
            updateConnectionUI('Ready for video calls', 'success');
            return stream;
            
        } catch (error) {
            log(`Permission error: ${error.message}`, 'ERROR');
            updateConnectionUI(`Permission denied: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // Create peer connection
    function createPeerConnection(peerId) {
        const pc = new RTCPeerConnection({
            iceServers: CONFIG.ICE_SERVERS
        });
        
        // Add local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }
        
        // Handle remote stream
        pc.ontrack = (event) => {
            log(`Received remote stream from ${peerId}`);
            const remoteVideo = document.getElementById(`remoteVideo-${peerId}`) || 
                              createRemoteVideoElement(peerId);
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice-candidate', {
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'failed') {
                cleanupPeer(peerId);
            }
        };
        
        peers.set(peerId, pc);
        return pc;
    }
    
    // Create remote video element
    function createRemoteVideoElement(peerId) {
        const container = document.getElementById('videoGrid') || 
                         document.getElementById('remoteVideos') ||
                         document.body;
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.innerHTML = `
            <video id="remoteVideo-${peerId}" autoplay playsinline></video>
            <div class="username">User ${peerId.slice(-4)}</div>
        `;
        
        container.appendChild(videoContainer);
        return videoContainer.querySelector('video');
    }
    
    // Handle incoming offer
    async function handleOffer(data) {
        const { from, offer } = data;
        log(`Received offer from ${from}`);
        
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(offer);
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', {
            to: from,
            answer: answer
        });
    }
    
    // Handle incoming answer
    async function handleAnswer(data) {
        const { from, answer } = data;
        log(`Received answer from ${from}`);
        
        const pc = peers.get(from);
        if (pc) {
            await pc.setRemoteDescription(answer);
        }
    }
    
    // Handle ICE candidate
    async function handleIceCandidate(data) {
        const { from, candidate } = data;
        
        const pc = peers.get(from);
        if (pc) {
            await pc.addIceCandidate(candidate);
        }
    }
    
    // Handle user joined
    function handleUserJoined(data) {
        const { userId } = data;
        log(`User ${userId} joined`);
        
        if (!localStream) {
            log('No local stream available for call', 'WARNING');
            return;
        }
        
        // Create offer for new user
        createOffer(userId);
    }
    
    // Handle user left
    function handleUserLeft(data) {
        const { userId } = data;
        log(`User ${userId} left`);
        cleanupPeer(userId);
    }
    
    // Create and send offer
    async function createOffer(peerId) {
        const pc = createPeerConnection(peerId);
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('offer', {
            to: peerId,
            offer: offer
        });
    }
    
    // Cleanup peer connection
    function cleanupPeer(peerId) {
        const pc = peers.get(peerId);
        if (pc) {
            pc.close();
            peers.delete(peerId);
        }
        
        // Remove video element
        const videoElement = document.getElementById(`remoteVideo-${peerId}`);
        if (videoElement && videoElement.parentElement) {
            videoElement.parentElement.remove();
        }
    }
    
    // Join video room
    function joinRoom(roomId = 'default') {
        if (!socket || !isConnected) {
            log('Socket not connected', 'ERROR');
            return;
        }
        
        socket.emit('join-room', { roomId });
        log(`Joined room: ${roomId}`);
    }
    
    // Public API
    window.WebRTC = {
        init: initSocket,
        requestPermissions: requestMediaPermissions,
        joinRoom: joinRoom,
        disconnect: () => {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
            peers.forEach((pc, peerId) => cleanupPeer(peerId));
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
        },
        
        // Getters for debugging
        get isConnected() { return isConnected; },
        get peerCount() { return peers.size; },
        get localStream() { return localStream; }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSocket);
    } else {
        initSocket();
    }
    
    log('Simplified WebRTC module loaded');
    
})();
