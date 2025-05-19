/**
 * WebRTC Peer Connection Module
 * Handles creation and management of peer connections
 */

// Map of peer connections
let peers = {};

// Default STUN/TURN server configuration
const defaultRTCConfig = { 
    iceServers: [
        // Google's public STUN servers - multiple for redundancy
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
        { urls: ['stun:stun4.l.google.com:19302', 'stun:stun.stunprotocol.org:3478'] },
        
        // Additional STUN servers for better NAT traversal
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.sipnet.net:3478' },
        { urls: 'stun:stun.ideasip.com:3478' },
        { urls: 'stun:stun.iptel.org:3478' },
        
        // Free TURN servers with credentials - crucial for NAT traversal and Docker networks
        {
            urls: [
                'turn:openrelay.metered.ca:80',                  // TURN over TCP port 80 (firewall-friendly)
                'turn:openrelay.metered.ca:443',                 // TURN over UDP port 443 (standard)
                'turn:openrelay.metered.ca:443?transport=tcp',   // TURN over TCP port 443 (most compatible)
                'turns:openrelay.metered.ca:443'                 // TURN over TLS port 443 (secure)
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        
        // Additional free TURN servers for Docker compatibility
        {
            urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
            username: 'webrtc',
            credential: 'webrtc'
        },
        
        // Alternative TURN servers in case the primary ones fail
        {
            urls: [
                'turn:global.turn.twilio.com:3478?transport=udp',
                'turn:global.turn.twilio.com:3478?transport=tcp',
                'turn:global.turn.twilio.com:443?transport=tcp' // Port 443 works best with firewalls
            ],
            username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
            credential: 'w1WpuQsPVLZfmACB9rU+6h9GYTMp51Iw9VTyGgpYgR8='
        }
    ],
    iceCandidatePoolSize: 5,             // More reasonable pool size for Docker
    iceTransportPolicy: 'all',           // Try both TURN and STUN/Host candidates
    bundlePolicy: 'max-bundle',          // Bundle all media on one connection when possible
    rtcpMuxPolicy: 'require',            // Use RTCP multiplexing
    sdpSemantics: 'unified-plan',        // Use modern SDP format for better compatibility
    
    // Additional options for aggressive connectivity
    iceTransportPolicy: 'all',           // Use all available transport methods
    
    // PeerConnection constraints
    // These are optional but help with connections on different networks
    optional: [
        {DtlsSrtpKeyAgreement: true},    // Enable DTLS-SRTP key agreement
        {RtpDataChannels: true}          // Backward compatibility for older browsers
    ]
};

// Mobile-optimized RTC configuration
const mobileRTCConfig = {
    ...defaultRTCConfig,
    iceCandidatePoolSize: 5,        // Smaller pool for mobile
    bundlePolicy: 'max-bundle',     // Bundle all media to reduce overhead
    rtcpMuxPolicy: 'require'        // Require RTCP multiplexing
};

// Track heartbeat intervals for all peers
let connectionHeartbeatIntervals = {};

/**
 * Create a new peer connection
 * @param {string} peerSocketId - The peer's socket ID
 * @param {string} peerUserName - The peer's display name
 * @param {function} onIceCandidate - Callback for ICE candidate generation
 * @param {function} onTrack - Callback for when remote tracks are added
 * @param {function} onConnectionStateChange - Callback for connection state changes
 * @param {MediaStream} localStream - Local media stream to add to the connection
 * @returns {RTCPeerConnection} The created peer connection, or null if failed
 */
function createPeerConnection(
    peerSocketId, 
    peerUserName, 
    onIceCandidate, 
    onTrack, 
    onConnectionStateChange,
    localStream
) {
    if (!peerSocketId) {
        console.error('Cannot create peer connection: Missing peer socket ID');
        return null;
    }
    
    if (peerSocketId === WebRTCSignaling.getSocketId()) {
        console.warn(`Skipping peer connection for self (ID: ${peerSocketId})`);
        return null;
    }

    // Close any existing connection first to ensure clean state
    if (peers[peerSocketId] && peers[peerSocketId].pc) {
        console.log(`Closing existing peer connection with ${peerUserName} (${peerSocketId})`);
        peers[peerSocketId].pc.close();
    }

    console.log(`Creating new peer connection for ${peerUserName} (ID: ${peerSocketId})`);
    
    // Select config based on network type
    let pc;
    
    try {
        // Use special configuration for mobile devices
        if (window.isMobileNetwork) {
            console.log('Using mobile-optimized connection settings');
            pc = new RTCPeerConnection(mobileRTCConfig);
        } else {
            // Standard configuration
            pc = new RTCPeerConnection(defaultRTCConfig);
        }
        
        console.log(`Peer connection created successfully for ${peerUserName}`);
    } catch (err) {
        console.error(`Error creating RTCPeerConnection: ${err.message}`);
        return null;
    }

    // Store peer connection with metadata
    peers[peerSocketId] = { 
        pc: pc, 
        userName: peerUserName,
        createdAt: Date.now(),
        lastOfferSentTime: 0,          // Track when we last sent an offer
        lastAnswerReceived: 0,         // Track when we last received an answer
        lastRemoteDescriptionTime: 0,  // Track when we last set a remote description
        iceCandidateBuffer: [],        // Buffer for ICE candidates received before remote description
        candidatesProcessed: 0,        // Counter for tracking processed ICE candidates
        signallingRetries: 0           // Track how many times we've retried signaling
    };
    
    // Check if we have early ICE candidates for this peer and add them to the buffer
    if (window.earlyIceCandidates && window.earlyIceCandidates.has(peerSocketId)) {
        const earlyBuffer = window.earlyIceCandidates.get(peerSocketId);
        if (earlyBuffer && earlyBuffer.length > 0) {
            console.log(`Adding ${earlyBuffer.length} early ICE candidates to buffer for ${peerUserName}`);
            peers[peerSocketId].iceCandidateBuffer = earlyBuffer.slice();
            window.earlyIceCandidates.delete(peerSocketId); // Clear after using
        }
    }

    // Add local tracks to connection (if available)
    if (localStream) {
        localStream.getTracks().forEach(track => {
            try {
                pc.addTrack(track, localStream);
                console.log(`Added local ${track.kind} track to PC for ${peerUserName}`);
            } catch (e) {
                console.error(`Error adding local ${track.kind} track for ${peerUserName}: ${e.message}`);
            }
        });
    } else {
        console.warn(`Warning: No local stream available for ${peerUserName}`);
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log(`Generated ICE candidate for peer ${peerUserName}`);
            
            // Add some debugging info about the candidate type
            try {
                const candidateType = event.candidate.candidate.split(' ')[7] || 'unknown';
                console.log(`Candidate type: ${candidateType}`);
                
                // Log if this is a relay (TURN) candidate which is important for NAT traversal
                if (candidateType === 'relay') {
                    console.log(`Found TURN relay candidate - good for NAT traversal`);
                }
            } catch (e) {
                // Just ignore errors in candidate debugging
            }
            
            if (onIceCandidate) {
                onIceCandidate(peerSocketId, event.candidate);
            }
        } else {
            // Null candidate means ICE gathering is complete
            console.log(`ICE gathering complete for connection with ${peerUserName}`);
        }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
        console.log(`Received remote track from ${peerUserName}`);
        
        // Forward the track to the handler
        if (onTrack) {
            onTrack(peerSocketId, peerUserName, event.streams[0]);
        }
    };
    
    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${peerUserName}: ${pc.iceConnectionState}`);
        
        // Store the previous connection state for better transitioning
        if (!peers[peerSocketId]) return;
        
        const previousState = peers[peerSocketId].lastIceState || 'new';
        peers[peerSocketId].lastIceState = pc.iceConnectionState;
        peers[peerSocketId].lastIceStateChangeTime = Date.now();
        
        // Add state to history for tracking connection problems
        if (!peers[peerSocketId].connectionStateHistory) {
            peers[peerSocketId].connectionStateHistory = [];
        }
        
        // Add latest state to history, keeping last 5 states
        peers[peerSocketId].connectionStateHistory.push({
            state: pc.iceConnectionState,
            time: Date.now()
        });
        
        // Keep only the last 5 states
        if (peers[peerSocketId].connectionStateHistory.length > 5) {
            peers[peerSocketId].connectionStateHistory.shift();
        }
        
        // Record when we're in a connected state
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            peers[peerSocketId].lastConnectedTime = Date.now();
        }
        
        // Call the external state change handler
        if (onConnectionStateChange) {
            onConnectionStateChange(peerSocketId, peerUserName, pc.iceConnectionState, peers[peerSocketId]);
        }
    };
    
    // Connection state change
    pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${peerUserName}: ${pc.connectionState}`);
        
        // Call the external state change handler
        if (onConnectionStateChange) {
            onConnectionStateChange(peerSocketId, peerUserName, pc.connectionState, peers[peerSocketId]);
        }
    };
    
    // Signaling state change
    pc.onsignalingstatechange = () => {
        console.log(`Signaling state for ${peerUserName}: ${pc.signalingState}`);
        
        // Track signaling states
        peers[peerSocketId].lastSignalingState = pc.signalingState;
        peers[peerSocketId].lastSignalingStateChangeTime = Date.now();
    };
    
    // Negotiation needed
    pc.onnegotiationneeded = () => {
        console.log(`Negotiation needed for peer ${peerUserName}`);
    };
    
    // Start heartbeat for this peer
    startConnectionHeartbeat(peerSocketId);
    
    return pc;
}

/**
 * Start a heartbeat to detect and recover from broken connections
 */
function startConnectionHeartbeat(peerId) {
    // Clear any existing heartbeat first
    if (connectionHeartbeatIntervals[peerId]) {
        clearInterval(connectionHeartbeatIntervals[peerId]);
    }
    
    // Don't start a heartbeat if the peer doesn't exist
    if (!peers[peerId] || !peers[peerId].pc) return;
    
    const HEARTBEAT_INTERVAL = 15000; // 15 seconds
    const MAX_CONSECUTIVE_FAILURES = 3;
    
    // Initialize counters
    peers[peerId].heartbeatFailures = 0;
    peers[peerId].lastHeartbeatResponse = Date.now();
    
    // Create a data channel for heartbeats if it doesn't exist
    if (!peers[peerId].heartbeatChannel) {
        try {
            peers[peerId].heartbeatChannel = peers[peerId].pc.createDataChannel('heartbeat');
            peers[peerId].heartbeatChannel.onopen = () => {
                console.log(`Heartbeat channel open for ${peers[peerId].userName || peerId}`);
            };
            peers[peerId].heartbeatChannel.onclose = () => {
                console.log(`Heartbeat channel closed for ${peers[peerId].userName || peerId}`);
            };
            peers[peerId].heartbeatChannel.onerror = (err) => {
                console.warn(`Heartbeat channel error for ${peers[peerId].userName || peerId}: ${err}`);
            };
            peers[peerId].heartbeatChannel.onmessage = (event) => {
                // Reset failure counter on any message
                peers[peerId].heartbeatFailures = 0;
                peers[peerId].lastHeartbeatResponse = Date.now();
            };
        } catch (e) {
            console.error(`Could not create heartbeat channel for ${peers[peerId].userName || peerId}: ${e.message}`);
        }
    }
    
    // Start the heartbeat interval
    connectionHeartbeatIntervals[peerId] = setInterval(() => {
        // Only check active peer connections
        if (!peers[peerId] || !peers[peerId].pc) {
            clearInterval(connectionHeartbeatIntervals[peerId]);
            delete connectionHeartbeatIntervals[peerId];
            return;
        }
        
        // Check connection state
        const connectionState = peers[peerId].pc.connectionState;
        const iceConnectionState = peers[peerId].pc.iceConnectionState;
        const peerName = peers[peerId].userName || peerId;
        
        // Try to send a heartbeat message
        if (peers[peerId].heartbeatChannel && peers[peerId].heartbeatChannel.readyState === 'open') {
            try {
                peers[peerId].heartbeatChannel.send(JSON.stringify({
                    type: 'heartbeat',
                    timestamp: Date.now()
                }));
            } catch (e) {
                // If sending fails, increment failure counter
                peers[peerId].heartbeatFailures++;
                console.warn(`Heartbeat send failed for ${peerName}: ${e.message}`);
            }
        } else if (connectionState === 'connected' || iceConnectionState === 'connected') {
            // Channel should be open if we're connected
            peers[peerId].heartbeatFailures++;
        }
        
        // Check if heartbeat has failed too many times
        if (peers[peerId].heartbeatFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.warn(`Connection heartbeat failed ${MAX_CONSECUTIVE_FAILURES} times for ${peerName}. Attempting recovery.`);
            
            // Check how much time has passed since last heartbeat
            const timeSinceLastHeartbeat = Date.now() - peers[peerId].lastHeartbeatResponse;
            
            if (timeSinceLastHeartbeat > HEARTBEAT_INTERVAL * 2) {
                // Connection is likely dead, notify callback
                if (window.WebRTCConnectionMonitor && typeof window.WebRTCConnectionMonitor.onConnectionDead === 'function') {
                    window.WebRTCConnectionMonitor.onConnectionDead(peerId, peerName);
                }
            }
        }
    }, HEARTBEAT_INTERVAL);
}

/**
 * Clean up and remove a peer connection
 */
function removePeer(peerSocketId) {
    if (peers[peerSocketId]) {
        const peerName = peers[peerSocketId].userName || peerSocketId;
        console.log(`Removing peer connection for ${peerName}`);
        
        // Close the peer connection
        if (peers[peerSocketId].pc) {
            peers[peerSocketId].pc.close();
        }
        
        // Clean up the heartbeat
        if (connectionHeartbeatIntervals[peerSocketId]) {
            clearInterval(connectionHeartbeatIntervals[peerSocketId]);
            delete connectionHeartbeatIntervals[peerSocketId];
        }
        
        // Remove the peer
        delete peers[peerSocketId];
    }
}

/**
 * Add ICE candidate with check
 * For handling ICE candidates from other peers
 */
function addIceCandidateWithCheck(peerId, candidate) {
    if (!peers[peerId]) {
        console.warn(`Received ICE candidate but peer ${peerId} doesn't exist`);
        
        // Create a temporary buffer for candidates that arrive before the peer is created
        if (!window.earlyIceCandidates) {
            window.earlyIceCandidates = new Map();
        }
        
        if (!window.earlyIceCandidates.has(peerId)) {
            window.earlyIceCandidates.set(peerId, []);
        }
        
        window.earlyIceCandidates.get(peerId).push(candidate);
        console.log(`Stored early ICE candidate for future peer ${peerId}`);
        return;
    }
    
    if (!peers[peerId].pc) {
        console.warn(`Received ICE candidate but no peer connection exists for ${peerId}`);
        return;
    }

    const pc = peers[peerId].pc;
    const fromUserName = peers[peerId].userName || 'Unknown peer';
    
    // Store the candidate in the buffer regardless of current state
    // This ensures we don't lose candidates that arrive right before remote description is set
    if (!peers[peerId].iceCandidateBuffer) {
        peers[peerId].iceCandidateBuffer = [];
    }
    
    peers[peerId].iceCandidateBuffer.push(candidate);
    
    // Check if we can add the candidates now
    if (pc.remoteDescription && pc.remoteDescription.type) {
        processBufferedCandidates(peerId);
    } else {
        console.log(`Buffering ICE candidate for ${fromUserName} (${peers[peerId].iceCandidateBuffer.length} total buffered)`);
    }
}

/**
 * Process buffered ICE candidates for a peer
 */
function processBufferedCandidates(peerId) {
    if (!peers[peerId] || !peers[peerId].pc || !peers[peerId].iceCandidateBuffer) return;
    
    const pc = peers[peerId].pc;
    const buffer = peers[peerId].iceCandidateBuffer;
    const fromUserName = peers[peerId]?.userName || 'Unknown peer';
    
    // Check for remote description before trying to process candidates
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
        console.warn(`Cannot process ICE candidates yet - no remote description for ${fromUserName}`);
        return; // Keep candidates in buffer until we have a remote description
    }
    
    if (buffer.length > 0) {
        console.log(`Processing ${buffer.length} buffered ICE candidates for ${fromUserName}`);
        
        // Process candidates one by one with a slight delay between them to prevent overwhelming
        const processNextCandidate = (index) => {
            if (index >= buffer.length) {
                // All candidates processed
                console.log(`Finished processing all buffered ICE candidates for ${fromUserName}`);
                peers[peerId].iceCandidateBuffer = []; // Clear the buffer
                return;
            }
            
            const candidate = buffer[index];
            
            // Add the candidate to the peer connection
            pc.addIceCandidate(new RTCIceCandidate(candidate))
                .then(() => {
                    peers[peerId].candidatesProcessed++;
                    
                    // Process next candidate after a small delay
                    setTimeout(() => {
                        processNextCandidate(index + 1);
                    }, 5); // 5ms delay between candidates
                })
                .catch(e => {
                    console.error(`Error adding ICE candidate for ${fromUserName}: ${e.message}`);
                    // Continue processing the rest of the candidates
                    setTimeout(() => {
                        processNextCandidate(index + 1);
                    }, 5);
                });
        };
        
        // Start processing the first candidate
        processNextCandidate(0);
    }
}

/**
 * Create an offer for a peer
 */
async function createOffer(peerId, options = {}) {
    if (!peers[peerId] || !peers[peerId].pc) {
        console.error(`Cannot create offer: Peer ${peerId} does not exist`);
        return null;
    }
    
    const pc = peers[peerId].pc;
    
    try {
        // Create offer with specific options
        const offerOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            voiceActivityDetection: true,
            iceRestart: options.iceRestart || false
        };
        
        const offer = await pc.createOffer(offerOptions);
        
        // Set as local description
        await pc.setLocalDescription(offer);
        
        // Track when we sent this offer
        peers[peerId].lastOfferSentTime = Date.now();
        
        return offer;
    } catch (error) {
        console.error(`Error creating offer for ${peers[peerId].userName}: ${error.message}`);
        return null;
    }
}

/**
 * Process remote offer from a peer
 */
async function applyRemoteOffer(peerId, offer, isIceRestart = false) {
    if (!peers[peerId] || !peers[peerId].pc) {
        console.error(`Cannot apply remote offer: Peer ${peerId} does not exist`);
        return null;
    }
    
    const pc = peers[peerId].pc;
    const peerName = peers[peerId].userName || peerId;
    
    try {
        // Set remote description
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`Set remote description (offer) for ${peerName}`);
        
        // Mark the time we set the remote description
        peers[peerId].lastRemoteDescriptionTime = Date.now();
        
        // Create answer
        const answer = await pc.createAnswer();
        
        // Set local description
        await pc.setLocalDescription(answer);
        console.log(`Created and set local description (answer) for ${peerName}`);
        
        // Process any pending ICE candidates
        processBufferedCandidates(peerId);
        
        return answer;
    } catch (error) {
        console.error(`Error processing offer from ${peerName}: ${error.message}`);
        return null;
    }
}

/**
 * Process remote answer from a peer
 */
async function applyRemoteAnswer(peerId, answer) {
    if (!peers[peerId] || !peers[peerId].pc) {
        console.error(`Cannot apply remote answer: Peer ${peerId} does not exist`);
        return false;
    }
    
    const pc = peers[peerId].pc;
    const peerName = peers[peerId].userName || peerId;
    
    // Check if we can apply the answer based on signaling state
    if (pc.signalingState !== 'have-local-offer') {
        console.error(`Cannot set remote answer - peer connection is in ${pc.signalingState} state, expected 'have-local-offer'`);
        return false;
    }
    
    try {
        // Set remote description (the answer)
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`Set remote description (answer) for ${peerName}`);
        
        // Mark when we received this answer
        peers[peerId].lastAnswerReceived = Date.now();
        peers[peerId].lastRemoteDescriptionTime = Date.now();
        
        // Process any pending ICE candidates
        processBufferedCandidates(peerId);
        
        return true;
    } catch (error) {
        console.error(`Error setting remote answer for ${peerName}: ${error.message}`);
        return false;
    }
}

/**
 * Get all peers
 */
function getAllPeers() {
    return peers;
}

/**
 * Get a specific peer
 */
function getPeer(peerId) {
    return peers[peerId] || null;
}

/**
 * Check if a peer exists
 */
function hasPeer(peerId) {
    return !!peers[peerId];
}

// Export functions
window.WebRTCPeerConnection = {
    createPeerConnection,
    removePeer,
    addIceCandidateWithCheck,
    processBufferedCandidates,
    createOffer,
    applyRemoteOffer,
    applyRemoteAnswer,
    getAllPeers,
    getPeer,
    hasPeer
}; 