let socket = null;
let socketId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("WebRTC.js loaded - DOMContentLoaded event fired");
    
    // Initialize DOM elements
    const permissionRequest = document.getElementById('permissionRequest');
    const permissionStatus = document.getElementById('permissionStatus');
    const retryPermissionBtn = document.getElementById('retryPermissionBtn');
    const audioOnlyBtn = document.getElementById('audioOnlyBtn');
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
    
    // Validate DOM elements
    if (!permissionRequest) console.error("Required element 'permissionRequest' not found");
    if (!permissionStatus) console.error("Required element 'permissionStatus' not found");
    if (!retryPermissionBtn) console.error("Required element 'retryPermissionBtn' not found");
    if (!audioOnlyBtn) console.error("Required element 'audioOnlyBtn' not found");
    
    // Make sure permission request is visible
    if (permissionRequest) {
        console.log("Setting permission request dialog to visible");
        permissionRequest.style.display = 'flex';
    }
    
    // Show waiting status
    if (permissionStatus) {
        permissionStatus.textContent = 'Waiting for you to allow camera and microphone access...';
        permissionStatus.className = 'p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300';
    }
    
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
    
    // Initialize permission request system
    console.log('Initializing WebRTC permission system...');
    
    // First check browser compatibility
    console.log('Running browser compatibility check...');
    
    // Make sure WebRTCCompat exists before using it
    if (window.WebRTCCompat && typeof window.WebRTCCompat.check === 'function') {
        const browserCompat = window.WebRTCCompat.check();
        console.log('Browser compatibility check:', browserCompat);
        
        // Show warning if there are compatibility issues
        if (!browserCompat.isCompatible || browserCompat.issues.length > 0) {
            window.WebRTCCompat.showWarning(browserCompat);
        }
        
        // If permissions are already denied, show specific message
        if (browserCompat.permissions.camera === 'denied' || browserCompat.permissions.microphone === 'denied') {
            permissionStatus.textContent = 'Permission previously denied. Please check your browser settings.';
            permissionStatus.classList.add('text-red-500');
        }
    } else {
        console.warn('Browser compatibility module not loaded or not available');
    }
    
    // Wait a short delay to ensure UI is visible before requesting permissions
    setTimeout(() => {
        console.log("Initial permission request after delay...");
        requestMediaPermissions();
    }, 500);
    
    // Function to explicitly request media permissions
    function requestMediaPermissions() {
        console.log('Requesting media permissions...');
        permissionStatus.textContent = 'Requesting camera and microphone access...';
        
        initLocalStream()
            .then(success => {
                if (success) {
                    permissionStatus.textContent = 'Camera and microphone access granted!';
                    permissionStatus.classList.remove('text-red-500', 'text-yellow-300');
                    permissionStatus.classList.add('text-green-500');
                    
                    // Hide permission dialog after a short delay
                    setTimeout(() => {
                        permissionRequest.style.display = 'none';
                        testServerConnectivity();
                    }, 1500);
                } else {
                    permissionStatus.textContent = 'Permission denied. Please check your browser settings and try again.';
                    permissionStatus.classList.remove('text-yellow-300');
                    permissionStatus.classList.add('text-red-500');
                }
            })
            .catch(error => {
                console.error('Error accessing media:', error);
                
                // More user-friendly error messages
                let errorMessage = '';
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Permission denied. Please click "Allow" when prompted by your browser.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera or microphone found on your device.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage = 'Your camera or microphone is being used by another application.';
                } else {
                    errorMessage = error.message;
                }
                
                permissionStatus.textContent = 'Error: ' + errorMessage;
                permissionStatus.classList.remove('text-yellow-300');
                permissionStatus.classList.add('text-red-500');
            });
    }
    
    function testServerConnectivity() {
        
        addLogEntry('Testing connectivity to localhost:1002...', 'info');
        
        
        connectToSignalingServer();
    }
    
    
    retryPermissionBtn.addEventListener('click', () => {
        console.log("Retry permission button clicked");
        console.log("Clearing existing media streams and requesting new permissions...");
        
        permissionStatus.textContent = 'Requesting permission again...';
        permissionStatus.classList.remove('text-red-500', 'text-green-500');
        permissionStatus.classList.add('text-yellow-300');
        
        // Stop any existing streams
        if (localStream) {
            console.log("Stopping existing media tracks...");
            localStream.getTracks().forEach(track => {
                console.log(`Stopping ${track.kind} track`);
                track.stop();
            });
            localStream = null;
        }
        
        // Clear video element
        if (localVideo) {
            console.log("Clearing video element source");
            localVideo.srcObject = null;
        }
        
        // Force browser to show permission dialog by requesting with exact constraints
        console.log("Explicitly requesting media permissions with getUserMedia...");
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: true
        };
        
        // First try to check if permissions are already granted
        if (navigator.permissions && navigator.permissions.query) {
            console.log("Checking current permission status...");
            Promise.all([
                navigator.permissions.query({ name: 'camera' }),
                navigator.permissions.query({ name: 'microphone' })
            ]).then(([camera, mic]) => {
                console.log(`Current permission status - Camera: ${camera.state}, Microphone: ${mic.state}`);
                
                // If either is denied, show specific instructions
                if (camera.state === 'denied' || mic.state === 'denied') {
                    console.log("Permission previously denied, showing instructions to user");
                    permissionStatus.innerHTML = 'Permission was denied. Please reset permissions in your browser:<br>' +
                        '1. Click the lock/camera icon in your address bar<br>' +
                        '2. Change camera and microphone settings to "Allow"<br>' +
                        '3. Then reload the page';
                    permissionStatus.classList.remove('text-yellow-300');
                    permissionStatus.classList.add('text-red-500');
                    
                    // Add a reload button
                    const reloadBtn = document.createElement('button');
                    reloadBtn.className = 'mt-2 px-4 py-2 bg-blue-600 text-white rounded';
                    reloadBtn.textContent = 'Reload Page';
                    reloadBtn.onclick = () => window.location.reload();
                    permissionStatus.appendChild(reloadBtn);
                    return;
                }
                
                // Otherwise request normally
                requestMediaPermissions();
            }).catch(err => {
                console.warn("Could not query permission status:", err);
                // Fall back to regular request
                requestMediaPermissions();
            });
        } else {
            // Browser doesn't support permission query, just try requesting
            requestMediaPermissions();
        }
    });
    
    // Function to request permissions with proper error handling
    function requestMediaPermissions() {
        console.log("Requesting media permissions with getUserMedia API...");
        permissionStatus.textContent = 'Requesting camera and microphone access...';
        
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        }).then(stream => {
            console.log("Permission granted successfully");
            localStream = stream;
            localVideo.srcObject = stream;
            
            permissionStatus.textContent = 'Camera and microphone access granted!';
            permissionStatus.classList.remove('text-red-500', 'text-yellow-300');
            permissionStatus.classList.add('text-green-500');
            
            // Show success message and hide permission dialog after a delay
            setTimeout(() => {
                console.log("Hiding permission dialog");
                permissionRequest.style.display = 'none';
                testServerConnectivity();
            }, 1500);
            
            // Ensure video plays
            localVideo.play().catch(e => {
                console.error('Error playing local video:', e);
                addPlayButtonToLocalVideo();
            });
            
        }).catch(error => {
            console.error('Error accessing media:', error);
            let errorMessage = 'Permission request failed: ';
            
            // More user-friendly error messages
            if (error.name === 'NotAllowedError') {
                errorMessage += 'You denied permission. Please click Allow when prompted by your browser.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera or microphone found on your device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Your camera or microphone is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            permissionStatus.textContent = errorMessage;
            permissionStatus.classList.remove('text-yellow-300');
            permissionStatus.classList.add('text-red-500');
            
            // Add help text with browser-specific instructions
            const browser = getBrowserInfo();
            let helpText = '';
            
            if (browser.name === 'Chrome') {
                helpText = 'To fix in Chrome: Click the camera icon in the address bar → Site settings → Allow';
            } else if (browser.name === 'Firefox') {
                helpText = 'To fix in Firefox: Click the lock icon in the address bar → Allow';
            } else if (browser.name === 'Safari') {
                helpText = 'To fix in Safari: Check Safari → Preferences → Websites → Camera/Microphone';
            }
            
            const helpDiv = document.createElement('div');
            helpDiv.className = 'mt-2 p-2 bg-gray-600 rounded text-sm';
            helpDiv.textContent = helpText;
            
            // Remove any existing help text before adding new one
            const existingHelp = permissionStatus.querySelector('div');
            if (existingHelp) {
                permissionStatus.removeChild(existingHelp);
            }
            
            permissionStatus.appendChild(helpDiv);
        });
    }
    
    // Helper function to get browser info
    function getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        
        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "Chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "Firefox";
        } else if (userAgent.match(/safari/i)) {
            browserName = "Safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "Opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "Edge";
        }
        
        return { name: browserName };
    }
    
    // Add audio-only button event listener
    if (audioOnlyBtn) {
        audioOnlyBtn.addEventListener('click', () => {
            console.log("Audio-only button clicked");
            console.log("Requesting audio-only permissions...");
            
            permissionStatus.textContent = 'Requesting audio-only permission...';
            permissionStatus.classList.remove('text-red-500', 'text-green-500');
            permissionStatus.classList.add('text-yellow-300');
            
            // Stop any existing streams
            if (localStream) {
                console.log("Stopping existing media tracks...");
                localStream.getTracks().forEach(track => {
                    console.log(`Stopping ${track.kind} track`);
                    track.stop();
                });
                localStream = null;
            }
            
            // Clear video element
            if (localVideo) {
                console.log("Clearing video element source");
                localVideo.srcObject = null;
            }
            
            // Request audio only
            console.log("Explicitly requesting audio-only permissions...");
            navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }).then(stream => {
                console.log("Audio-only permission granted successfully");
                localStream = stream;
                
                // Create black video canvas as placeholder
                console.log("Creating placeholder video canvas for audio-only mode");
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add text to canvas
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Camera disabled', canvas.width/2, canvas.height/2);
                ctx.font = '14px Arial';
                ctx.fillText('Audio-only mode', canvas.width/2, canvas.height/2 + 30);
                
                // Create video stream from canvas
                console.log("Creating video track from canvas for audio-only mode");
                const emptyVideoStream = canvas.captureStream(1); // 1 fps
                const emptyVideoTrack = emptyVideoStream.getVideoTracks()[0];
                
                if (emptyVideoTrack) {
                    localStream.addTrack(emptyVideoTrack);
                    console.log('Added placeholder video track to stream');
                }
                
                // Set local video
                console.log("Setting local video display with audio-only stream");
                localVideo.srcObject = localStream;
                
                // Update UI
                permissionStatus.textContent = 'Audio-only mode activated';
                permissionStatus.classList.remove('text-yellow-300', 'text-red-500');
                permissionStatus.classList.add('text-green-500');
                
                // Hide permission dialog after success
                setTimeout(() => {
                    console.log("Hiding permission dialog");
                    permissionRequest.style.display = 'none';
                    connectToSignalingServer();
                }, 1500);
                
                // Auto-play local video
                localVideo.play().catch(e => {
                    console.error('Error playing local video:', e);
                    addPlayButtonToLocalVideo();
                });
                
            }).catch(error => {
                console.error('Error accessing audio:', error);
                let errorMessage = 'Error accessing microphone: ';
                
                // More user-friendly error messages
                if (error.name === 'NotAllowedError') {
                    errorMessage += 'You denied microphone permission.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage += 'No microphone found on your device.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage += 'Your microphone is already in use by another application.';
                } else {
                    errorMessage += error.message;
                }
                
                permissionStatus.textContent = errorMessage;
                permissionStatus.classList.remove('text-yellow-300');
                permissionStatus.classList.add('text-red-500');
                
                // Add help button to try again
                const retryDiv = document.createElement('div');
                retryDiv.className = 'mt-4 text-center';
                retryDiv.innerHTML = `
                    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Try Again
                    </button>
                `;
                
                // Remove any existing retry button before adding new one
                const existingRetry = permissionStatus.nextElementSibling;
                if (existingRetry && existingRetry.classList.contains('mt-4')) {
                    existingRetry.parentNode.removeChild(existingRetry);
                }
                
                permissionStatus.parentNode.insertBefore(retryDiv, permissionStatus.nextSibling);
                
                // Add click handler to retry button
                const retryButton = retryDiv.querySelector('button');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        audioOnlyBtn.click(); // Trigger the audio-only flow again
                    });
                }
            });
        });
    }
    
    // Add permission monitoring to auto-reload page when permissions change
    function setupPermissionMonitoring() {
        // Only if the browser supports it
        if (navigator.permissions && navigator.permissions.query) {
            // Monitor camera permissions
            navigator.permissions.query({ name: 'camera' })
                .then(status => {
                    status.onchange = function() {
                        console.log('Camera permission changed to:', this.state);
                        if (this.state === 'granted' && !localStream) {
                            // Permission just granted, reload page
                            window.location.reload();
                        }
                    };
                }).catch(e => console.warn('Cannot monitor camera permission:', e));
                
            // Monitor microphone permissions
            navigator.permissions.query({ name: 'microphone' })
                .then(status => {
                    status.onchange = function() {
                        console.log('Microphone permission changed to:', this.state);
                        if (this.state === 'granted' && !localStream) {
                            // Permission just granted, reload page
                            window.location.reload();
                        }
                    };
                }).catch(e => console.warn('Cannot monitor microphone permission:', e));
        }
    }
    
    // Setup permission monitoring
    setupPermissionMonitoring();
    
    
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
        
        // Get socket server URL from meta tag (set by PHP from environment variables)
        const metaSocketServer = document.querySelector('meta[name="socket-server"]')?.getAttribute('content');
        
        // Get the current hostname and protocol
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // Determine if we're in local dev or production environment
        const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';
        
        // Determine the socket URL based on available information
        let socketUrl;
        
        if (metaSocketServer) {
            // First priority: Use the environment-provided URL from meta tag
            socketUrl = metaSocketServer;
            console.log(`[SOCKET] Using environment-provided socket URL: ${socketUrl}`);
        } else if (isLocalDev) {
            // Local development fallback
            socketUrl = `${protocol}//${hostname}:1002`;
            console.log(`[SOCKET] Using local development socket URL: ${socketUrl}`);
        } else {
            // Production Docker fallback
            socketUrl = `${protocol}//socket-server:3000`;
            console.log(`[SOCKET] Using Docker service name socket URL: ${socketUrl}`);
        }
        
        // Log the final connection attempt
        console.log(`[SOCKET] Attempting connection to signaling server at ${socketUrl}`);
        addLogEntry(`Connecting to socket server: ${socketUrl}`, 'info');
        
        // Create socket connection with enhanced retry configuration
        socket = io(socketUrl, {
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['polling', 'websocket'],
            forceNew: true,
            withCredentials: false,
            upgrade: true,
            rememberUpgrade: true,
            autoConnect: true,
            reconnection: true,
            query: {
                username: userName,
                room: GLOBAL_ROOM,
                timestamp: Date.now()
            }
        });
        
        if (shouldDebug) {
            // Expose socket globally for debugging
            window._socketDebug = socket;
            
            // Add additional connection state debugging
            console.log(`[SOCKET] Initial state:`, {
                connected: socket.connected,
                disconnected: socket.disconnected,
                id: socket.id
            });
        }
        
        // Handle connection errors
        socket.on('connect_error', (error) => {
            console.error(`[SOCKET] Connection error: ${error.message}`);
            logConnectionDebug(`Connection error: ${error.message}`);
            updateConnectionStatus('disconnected');
            addLogEntry(`Connection error: ${error.message}`, 'error');
            
            // If in Docker and local connection fails, try the alternative URL
            if (!isLocalDev && !socket.connected) {
                addLogEntry('[SOCKET] Attempting fallback connection to localhost...', 'info');
                setTimeout(() => {
                    // Try connecting directly to the service port
                    const fallbackUrl = `http://localhost:1002`;
                    console.log(`[SOCKET] Attempting fallback to ${fallbackUrl}`);
                    socket.io.uri = fallbackUrl;
                    socket.connect();
                }, 2000);
            } else {
                // Show error UI for user
                const errorMsg = document.createElement('div');
                errorMsg.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-center p-4';
                errorMsg.innerHTML = `
                    Connection to signaling server failed.<br>
                    <span class="text-sm">Could not connect to server: ${error.message}</span><br>
                    <span class="text-sm mt-2">WebRTC functionality will not work.</span>
                `;
                document.body.appendChild(errorMsg);
                
                // Add reload button
                const reloadBtn = document.createElement('button');
                reloadBtn.className = 'ml-4 px-4 py-1 bg-white text-red-600 rounded';
                reloadBtn.textContent = 'Reload Page';
                reloadBtn.onclick = () => window.location.reload();
                errorMsg.appendChild(reloadBtn);
            }
        });
        
        // Set up event handlers if socket was created
        if (socket) {
            setupSocketEventHandlers();
        } else {
            console.error("[SOCKET] Failed to create socket connection. Socket is null.");
            addLogEntry("Failed to create socket connection", 'error');
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
            console.log(`[SOCKET] Connected with ID: ${socket.id}`);
            
            // Check if it appears to be a mock socket - safely handle undefined socket.id
            const isMockSocket = socket && socket.id && (
                socket.id.indexOf('mock-socket') > -1 || 
                (socket.io && socket.io.engine && socket.io.engine.transport && socket.io.engine.transport.name === 'mock-transport')
            );
            
            if (isMockSocket) {
                addLogEntry(`Using mock socket.io implementation`, 'warning');
                showToast('Using mock socket implementation - WebRTC calls will be simulated', 'warning');
            }
            
            // Check if socket.io and engine are properly initialized
            if (socket.io && socket.io.engine) {
                addLogEntry(`Socket Details - Transport: ${socket.io.engine.transport.name}`, 'info');
                console.log('[SOCKET] Connection Details:', {
                    id: socket.id,
                    connected: socket.connected,
                    isMock: isMockSocket,
                    transport: socket.io.engine.transport.name
                });
            } else {
                addLogEntry(`Socket.io engine not initialized properly`, 'warning');
                console.warn('[SOCKET] Socket.io engine not initialized properly');
            }
            
            // Clear existing participant list
            if (participantsList) {
                console.log("[SOCKET] Clearing existing participants list");
                Array.from(document.querySelectorAll('.participant-item')).forEach(item => {
                    participantsList.removeChild(item);
                });
            }
            
            // Join the global room
            console.log(`[SOCKET] Joining global room: ${GLOBAL_ROOM}`);
            socket.emit('join-global-room', {
                roomId: GLOBAL_ROOM,
                userId: socket.id,
                userName: userName
            });
            
            // Add ourselves to the participants list
            console.log(`[SOCKET] Adding ourselves to participant list as: ${userName} (You)`);
            addParticipantItem(socket.id, userName + ' (You)');
            
            // Request global users list after a short delay
            setTimeout(() => {
                console.log('[SOCKET] Requesting global users list...');
                logConnectionDebug('Requesting global users list...');
                socket.emit('get-global-users', { 
                    roomId: GLOBAL_ROOM,
                    userName: userName
                });
            }, 1000);  // Reduced delay for faster user discovery
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
            console.log(`User joined event received:`, data);
            
            // Process the user who joined directly
            handleUserJoined(data);
            
            // Also request updated global user list
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
        
        // Add handler for auto-join events from server
        socket.on('auto-joined', (data) => {
            console.log(`[SOCKET] Auto-joined to room ${data.roomId} with name ${data.userName}`);
            
            // Update our username if provided by server
            if (data.userName && data.userName !== userName) {
                console.log(`[SOCKET] Updating username from ${userName} to ${data.userName}`);
                userName = data.userName;
            }
            
            // Immediately request the global user list
            socket.emit('get-global-users', { 
                roomId: data.roomId || GLOBAL_ROOM,
                userName: userName
            });
        });
    }
    
    
    async function initLocalStream() {
        try {
            console.log('Requesting media permissions...');
            
            // Create constraints with ideal settings but fallbacks
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: {
                    width: { ideal: 640, min: 320 },
                    height: { ideal: 480, min: 240 },
                    frameRate: { ideal: 24, min: 15 }
                }
            };
            
            // First try with both audio and video
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                console.log('Successfully obtained audio and video permissions');
                addLogEntry('Successfully obtained audio and video permissions', 'info');
            } catch (e) {
                console.warn('Could not get video and audio, trying audio only:', e.message);
                addLogEntry('Could not get both audio and video. Trying audio only...', 'warning');
                
                // Try with just audio as fallback
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: constraints.audio
                    });
                    console.log('Successfully obtained audio-only permissions');
                    addLogEntry('Successfully obtained audio-only permissions', 'info');
                    
                    // Create an empty black video track since we couldn't get camera
                    const canvas = document.createElement('canvas');
                    canvas.width = 640;
                    canvas.height = 480;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Add text to canvas
                    ctx.fillStyle = 'white';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Camera disabled', canvas.width/2, canvas.height/2);
                    ctx.font = '14px Arial';
                    ctx.fillText('Audio-only mode', canvas.width/2, canvas.height/2 + 30);
                    
                    // Create video stream from canvas
                    const emptyVideoStream = canvas.captureStream(1); // 1 fps
                    const emptyVideoTrack = emptyVideoStream.getVideoTracks()[0];
                    if (emptyVideoTrack) {
                        localStream.addTrack(emptyVideoTrack);
                        console.log('Added placeholder video track');
                    }
                } catch (audioError) {
                    console.error('Could not get even audio permissions:', audioError.message);
                    throw audioError; // Re-throw to be handled by outer catch
                }
            }
            
            const videoTrack = localStream.getVideoTracks()[0];
            const audioTrack = localStream.getAudioTracks()[0];
            
            if (videoTrack) {
                console.log('Video track obtained:', videoTrack.label);
                console.log('Video track settings:', videoTrack.getSettings());
                
                permissionStatus.textContent = 'Camera and microphone access granted!';
                permissionStatus.classList.add('text-green-500');
                
                videoTrack.onended = () => {
                    console.warn('Video track ended unexpectedly');
                    addLogEntry('Camera track ended. Try reloading the page.', 'error');
                };
            } else {
                console.warn('No video track obtained');
                permissionStatus.textContent = 'Microphone access granted, but no camera available.';
                permissionStatus.classList.add('text-yellow-500');
            }
            
            if (audioTrack) {
                console.log('Audio track obtained:', audioTrack.label);
            } else {
                console.warn('No audio track obtained');
                permissionStatus.textContent = permissionStatus.textContent + ' (No microphone)';
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
            let errorDetail = '';
            
            if (error.name === 'NotAllowedError') {
                errorDetail = 'You denied permission to use your camera/microphone. Please allow access in your browser settings.';
                permissionStatus.textContent = 'Permission denied! Please click "Allow" when prompted by your browser.';
            } else if (error.name === 'NotFoundError') {
                errorDetail = 'No camera or microphone found on your device.';
                permissionStatus.textContent = 'No camera or microphone detected on your device.';
            } else if (error.name === 'NotReadableError') {
                errorDetail = 'Your camera or microphone is already in use by another application.';
                permissionStatus.textContent = 'Camera/mic is being used by another application.';
            } else if (error.name === 'OverconstrainedError') {
                errorDetail = 'The requested camera/microphone settings could not be satisfied.';
                permissionStatus.textContent = 'Camera/mic constraints not satisfied. Please try again.';
            } else if (error.name === 'TypeError') {
                errorDetail = 'No cameras or microphones available, or permission was denied.';
                permissionStatus.textContent = 'Media devices not available or permission denied.';
            } else {
                errorDetail = error.message;
                permissionStatus.textContent = 'Error: ' + error.message;
            }
            
            permissionStatus.classList.add('text-red-500');
            errorMessage += errorDetail;
            console.log('Detailed error info:', errorMessage);
            
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
        console.log(`User joined: ${userName || userId}`, data);
        
        // Skip if this is our own ID
        if (userId === socketId) {
            console.log(`Ignoring our own join event`);
            return;
        }
        
        // Check if user is already in the list to avoid duplicates
        const existingItem = document.getElementById(`participant-${userId}`);
        const existingPeer = peers[userId];
        const existingVideo = document.getElementById(`container-${userId}`);
        
        // If user is fully set up, skip
        if (existingItem && existingPeer && existingVideo) {
            console.log(`User ${userId} is already fully set up, skipping duplicate join event`);
            return;
        }
        
        console.log(`Setting up user ${userId} - Existing UI: ${!!existingItem}, Existing peer: ${!!existingPeer}, Existing video: ${!!existingVideo}`);
        
        // Step 1: Add to participants list if needed
        if (!existingItem) {
            const displayName = userName || `User_${userId.substring(0, 4)}`;
            addParticipantItem(userId, displayName);
            console.log(`Added participant ${displayName} to the list`);
            addLogEntry(`New user joined: ${displayName}`, 'info');
            
            // Show a toast notification for new user
            showToast(`${displayName} joined the room`, 'info');
        }
        
        // Step 2: Create peer connection if needed
        if (!existingPeer) {
            console.log(`Creating new peer connection for user ${userId}`);
            const peerConnection = createPeerConnection(userId, userName);
            console.log(`Peer connection created for ${userId}`);
        }
        
        // Step 3: Create video container if needed
        if (!existingVideo) {
            console.log(`Creating video container for ${userId}`);
            updateRemoteVideo(userId, null, userName || `User_${userId.substring(0, 4)}`);
        }
        
        // Step 4: Trigger connection immediately
        if (peers[userId] && peers[userId].signalingState === 'stable') {
            console.log(`Initiating WebRTC negotiation with ${userId}`);
            // Delay slightly to ensure everything is set up
            setTimeout(() => {
                if (peers[userId]) {
                    console.log(`Triggering negotiation with ${userId}`);
                    peers[userId].onnegotiationneeded();
                }
            }, 1000);
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
        console.log("[USERS] handleGlobalUsers called with data:", data);
        
        // Guard against undefined data
        if (!data) {
            console.error("[USERS] Received undefined data in handleGlobalUsers");
            return;
        }
        
        const { users, roomId, totalCount } = data;
        
        // Guard against undefined users
        if (!users) {
            console.error("[USERS] No users data found in global users list");
            addLogEntry("Error: Received global users list with no user data", 'error');
            return;
        }
        
        // Convert object to array if it's not already an array
        const userList = Array.isArray(users) ? users : Object.values(users);
        
        console.log(`[USERS] Received ${userList.length} users in room ${roomId || GLOBAL_ROOM}`);
        
        // Show debug info for received users
        userList.forEach(user => {
            if (user && user.userId) {
                console.log(`[USERS] User in list: ${user.userName} (${user.userId})`);
            }
        });
        
        // Add a toast notification with user count
        showToast(`${userList.length} user${userList.length !== 1 ? 's' : ''} online`, 'info');
        
        // Keep track of all valid user IDs we received
        const receivedUserIds = userList
            .filter(user => user && user.userId) // Filter out invalid users
            .map(user => user.userId);
            
        console.log(`[USERS] Valid user IDs received:`, receivedUserIds);
        
        // Get current participants displayed in the UI
        const currentParticipants = Array.from(document.querySelectorAll('.participant-item'))
            .map(el => el.id.replace('participant-', ''));
            
        console.log(`[USERS] Current participants in UI:`, currentParticipants);
        
        // Make sure we have our own ID in the valid list
        if (!receivedUserIds.includes(socketId) && socketId) {
            console.log(`[USERS] Adding our own ID ${socketId} to valid user list`);
            receivedUserIds.push(socketId);
        }
        
        // 1. Remove participants that are no longer in the room
        currentParticipants.forEach(id => {
            if (!receivedUserIds.includes(id)) {
                console.log(`[USERS] Removing participant ${id} - no longer in room`);
                
                // Remove from participants list
                removeParticipantItem(id);
                
                // Clean up peer connection if it exists
                if (peers[id]) {
                    console.log(`[USERS] Closing peer connection for ${id}`);
                    peers[id].close();
                    delete peers[id];
                }
                
                // Remove video container
                const container = document.getElementById(`container-${id}`);
                if (container) {
                    console.log(`[USERS] Removing video container for ${id}`);
                    if (videoGrid.contains(container)) {
                        videoGrid.removeChild(container);
                    }
                }
            }
        });
        
        // 2. Make sure we're in the list
        if (!document.getElementById(`participant-${socketId}`)) {
            console.log(`[USERS] Adding ourselves to the participant list`);
            addParticipantItem(socketId, userName + ' (You)');
        }
        
        // 3. Process all valid users
        userList.forEach(user => {
            // Skip invalid users
            if (!user || !user.userId) {
                console.warn("[USERS] Skipping invalid user entry", user);
                return;
            }
            
            // Skip ourselves
            if (user.userId === socketId) {
                console.log(`[USERS] Skipping our own user entry`);
                return;
            }
            
            const displayName = user.userName || `User_${user.userId.substring(0, 4)}`;
            console.log(`[USERS] Processing remote user: ${displayName} (${user.userId})`);
            
            // Add to participant list if not already there
            if (!document.getElementById(`participant-${user.userId}`)) {
                console.log(`[USERS] Adding new participant ${displayName} to list`);
                addParticipantItem(user.userId, displayName);
            }
            
            // Create peer connection if doesn't exist
            if (!peers[user.userId]) {
                console.log(`[USERS] Creating new peer connection for ${user.userId}`);
                createPeerConnection(user.userId, user.userName);
                
                // Create video container if needed
                if (!document.getElementById(`container-${user.userId}`)) {
                    console.log(`[USERS] Creating video container for ${user.userId}`);
                    updateRemoteVideo(user.userId, null, displayName);
                }
                
                // Initialize connection
                setTimeout(() => {
                    if (peers[user.userId] && peers[user.userId].signalingState === 'stable') {
                        console.log(`[USERS] Triggering negotiation for ${user.userId}`);
                        peers[user.userId].onnegotiationneeded();
                    }
                }, 1000);
            }
        });
        
        // Update the count display
        updateParticipantCount(receivedUserIds.length);
        
        // Periodic connection check for all peers
        setTimeout(() => {
            console.log(`[USERS] Checking connection status for all peers`);
            Object.keys(peers).forEach(peerId => {
                const peer = peers[peerId];
                if (peer) {
                    const state = peer.connectionState || peer.iceConnectionState;
                    console.log(`[USERS] Peer ${peerId} connection state: ${state}`);
                    
                    // If peer is disconnected but should be connected (is in user list)
                    if ((state === 'disconnected' || state === 'failed' || state === 'closed') && 
                        receivedUserIds.includes(peerId)) {
                        console.log(`[USERS] Reconnecting to disconnected peer ${peerId}`);
                        
                        // Close and recreate connection
                        peer.close();
                        delete peers[peerId];
                        
                        // Get user info
                        const userInfo = userList.find(u => u.userId === peerId);
                        if (userInfo) {
                            createPeerConnection(peerId, userInfo.userName);
                            
                            // Trigger negotiation
                            setTimeout(() => {
                                if (peers[peerId]) {
                                    peers[peerId].onnegotiationneeded();
                                }
                            }, 500);
                        }
                    }
                }
            });
        }, 5000);
    }
    
    // Add this function to show the participant count
    function updateParticipantCount(count) {
        // Find or create participant count element
        let countElement = document.getElementById('participant-count');
        if (!countElement) {
            const participantsTitle = document.querySelector('.participants-panel h2');
            if (participantsTitle) {
                countElement = document.createElement('span');
                countElement.id = 'participant-count';
                countElement.className = 'ml-2 px-2 py-1 bg-blue-600 text-white text-sm rounded-full';
                participantsTitle.appendChild(countElement);
            }
        }
        
        // Update count
        if (countElement) {
            countElement.textContent = count;
        }
    }
    
    
    function handleError(data) {
        console.error(`Server error: ${data.message}`);
        addLogEntry(`Server error: ${data.message}`, 'error');
    }
    
    
    function updateRemoteVideo(userId, stream, userName) {
        console.log(`updateRemoteVideo called for ${userId} with stream:`, stream ? `Stream with ${stream.getTracks().length} tracks` : 'No stream');
        
        // Find existing container or create a new one
        let container = document.getElementById(`container-${userId}`);
        let video;
        
        if (!container) {
            console.log(`Creating new video container for ${userId}`);
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
                <button class="resubscribe-btn p-1 bg-green-600 text-white rounded opacity-70 hover:opacity-100 transition-opacity" title="Resubscribe">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
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
            console.log(`Using existing video container for ${userId}`);
            video = document.getElementById(`video-${userId}`);
            
            // Update username if provided
            if (userName) {
                const usernameEl = container.querySelector('.username');
                if (usernameEl && usernameEl.textContent !== userName) {
                    console.log(`Updating username for ${userId} to ${userName}`);
                    usernameEl.textContent = userName;
                }
            }
        }
        
        // If we have a stream, attach it to the video element
        if (stream && video) {
            console.log(`Setting stream for ${userId} video element`);
            
            // Check if we need to replace the stream
            const currentStream = video.srcObject;
            
            if (!currentStream) {
                // No current stream, just set the new one
                console.log(`No current stream for ${userId}, setting new stream`);
                video.srcObject = stream;
                
                // Show debug info about tracks
                showVideoDebugOverlay(userId, `Setting new stream with ${stream.getTracks().length} tracks`, "info");
                stream.getTracks().forEach(track => {
                    showVideoDebugOverlay(userId, `Track: ${track.kind}, state: ${track.readyState}, enabled: ${track.enabled}`, "info");
                });
            } else {
                console.log(`Existing stream found for ${userId}`);
                
                // Check if it's the same stream (by comparing track IDs)
                const existingTrackIds = Array.from(currentStream.getTracks()).map(t => t.id).sort().join(',');
                const newTrackIds = Array.from(stream.getTracks()).map(t => t.id).sort().join(',');
                
                if (existingTrackIds !== newTrackIds) {
                    console.log(`Stream has changed for ${userId}, replacing`);
                    video.srcObject = stream;
                    
                    // Show debug info
                    showVideoDebugOverlay(userId, `Replacing stream with ${stream.getTracks().length} new tracks`, "info");
                } else {
                    console.log(`Same stream detected for ${userId}, not replacing`);
                    // Still log tracks for debugging
                    stream.getTracks().forEach(track => {
                        console.log(`Track in stream: ${track.kind}, state: ${track.readyState}, enabled: ${track.enabled}`);
                    });
                }
            }
            
            // Try to play the video after a short delay
            setTimeout(() => {
                console.log(`Attempting to play video for ${userId}`);
                playWithUnmuteSequence(video, userId);
            }, 100);
        } else if (video && !video.srcObject) {
            // No stream yet, show a placeholder
            console.log(`No stream available yet for ${userId}`);
            showVideoDebugOverlay(userId, "Waiting for media stream...", "warning");
            
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
            // Prevent multiple negotiations happening at once
            if (peerConnection._isNegotiating) return;
            peerConnection._isNegotiating = true;
            
            try {
                // Only proceed if connection is stable
                if (peerConnection.signalingState === 'stable') {
                    updateDebugInfo(userId, 'Creating offer...');
                    
                    // Set up offer options with proper constraints
                    const offerOptions = {
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                        iceRestart: peerConnection.iceConnectionState === 'failed'
                    };
                    
                    // Create the offer
                    const offer = await peerConnection.createOffer(offerOptions);
                    
                    // Only proceed if still in stable state
                    if (peerConnection.signalingState === 'stable') {
                        // Set our local description
                        await peerConnection.setLocalDescription(offer);
                        
                        // Function to send the offer to remote peer
                        const sendOffer = () => {
                            socket.emit('offer', {
                                offer: peerConnection.localDescription,
                                to: userId,
                                from: socketId,
                                userName: userName
                            });
                            console.log(`Sent offer to ${userId}`);
                        };
                        
                        // Either send immediately if ICE gathering is complete,
                        // or wait for gathering to finish or timeout
                        if (peerConnection.iceGatheringState === 'complete') {
                            sendOffer();
                        } else {
                            // Set a timeout to send offer even if gathering isn't complete
                            const gatheringTimeout = setTimeout(() => {
                                sendOffer();
                            }, 1000);
                            
                            // Helper to check ICE gathering state
                            const checkGatheringState = () => {
                                if (peerConnection.iceGatheringState === 'complete') {
                                    clearTimeout(gatheringTimeout);
                                    sendOffer();
                                    return true;
                                }
                                return false;
                            };
                            
                            // Hook into gathering state changes
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
                // Reset negotiation flag after delay
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
            
            // Get the stream from the event or create a new one if none exists
            let remoteStream = null;
            
            // First try to get the stream from the event
            if (event.streams && event.streams.length > 0) {
                remoteStream = event.streams[0];
                console.log(`Using existing stream from track event with ${remoteStream.getTracks().length} tracks`);
            } else {
                // Create a new stream if none was provided
                console.log(`No stream in track event, creating synthetic stream for ${userId}`);
                remoteStream = new MediaStream();
                remoteStream.addTrack(event.track);
            }
            
            // Log track and stream details
            console.log(`Remote stream for ${userId} now has ${remoteStream.getTracks().length} tracks`);
            console.log(`Remote stream tracks:`, remoteStream.getTracks().map(t => `${t.kind}:${t.readyState}`));
            
            // Handle track state changes
            event.track.onunmute = () => {
                console.log(`Track ${event.track.kind} from ${userId} is now unmuted and should be visible`);
                updateDebugInfo(userId, `${event.track.kind} active`);
                
                // Check if this video exists and update it
                const existingVideo = document.getElementById(`video-${userId}`);
                if (existingVideo) {
                    console.log(`Found existing video element for ${userId}`);
                    
                    // Try to play if paused
                    if (existingVideo.paused) {
                        console.log(`Video element is paused, attempting to play`);
                        playWithUnmuteSequence(existingVideo, userId);
                    }
                    
                    // Hide debug indicator
                    const debugIndicator = document.getElementById(`video-debug-${userId}`);
                    if (debugIndicator) {
                        debugIndicator.style.opacity = '0';
                    }
                    
                    // Check if video has dimensions
                    if (existingVideo.videoWidth > 0 && existingVideo.videoHeight > 0) {
                        console.log(`Video dimensions: ${existingVideo.videoWidth}x${existingVideo.videoHeight}`);
                    } else {
                        console.log(`Video dimensions are still zero, waiting for video to render`);
                    }
                } else {
                    console.log(`No video element found for ${userId}, will create one`);
                }
                
                // Refresh the video display regardless
                updateRemoteVideo(userId, remoteStream, remoteUserName || `User_${userId.substring(0, 4)}`);
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
            
            // Always update the remote video with the new stream
            console.log(`Updating remote video for ${userId} with stream containing ${remoteStream.getTracks().length} tracks`);
            updateRemoteVideo(userId, remoteStream, remoteUserName || `User_${userId.substring(0, 4)}`);
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
        
        // Make sure we have tracks in the stream
        const stream = videoElement.srcObject;
        if (!stream) {
            console.error(`No stream attached to video element for ${userId}`);
            showVideoDebugOverlay(userId, "No stream to play", "error");
            return;
        }
        
        // Check if we have any tracks in the stream
        const tracks = stream.getTracks();
        console.log(`Stream has ${tracks.length} tracks for ${userId}`);
        if (tracks.length === 0) {
            console.error(`Stream has no tracks for ${userId}`);
            showVideoDebugOverlay(userId, "Stream has no tracks", "error");
            return;
        }
        
        // Check track states
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
            const videoTrack = videoTracks[0];
            console.log(`Video track state for ${userId}: ${videoTrack.readyState}, enabled: ${videoTrack.enabled}`);
            
            if (videoTrack.readyState === 'ended') {
                console.warn(`Video track is in 'ended' state for ${userId}`);
                showVideoDebugOverlay(userId, "Video track ended", "warning");
            }
        } else {
            console.warn(`No video tracks for ${userId}`);
            showVideoDebugOverlay(userId, "Audio-only connection", "info");
        }
        
        // Some browsers need a user gesture simulation
        simulateUserGesture(() => {
            // First try regular play with a safety timeout
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                let playTimeoutId = setTimeout(() => {
                    console.warn(`Play timeout for ${userId} - video may be stuck`);
                    showVideoDebugOverlay(userId, "Play timeout - retrying", "warning");
                    
                    // Try refreshing the stream
                    const currentStream = videoElement.srcObject;
                    videoElement.srcObject = null;
                    setTimeout(() => {
                        videoElement.srcObject = currentStream;
                        videoElement.play().catch(e => {
                            console.error(`Refresh play failed for ${userId}: ${e}`);
                        });
                    }, 100);
                }, 5000);
                
                playPromise
                    .then(() => {
                        clearTimeout(playTimeoutId);
                        console.log(`Video playing successfully for ${userId}`);
                        showVideoDebugOverlay(userId, "Video playing", "success");
                    })
                    .catch(error => {
                        clearTimeout(playTimeoutId);
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
            } else {
                console.warn(`Play promise undefined for ${userId}, browser may not support promises for media`);
                
                // Monitor video state manually
                const checkVideoPlaying = setInterval(() => {
                    if (!videoElement.paused) {
                        console.log(`Video now playing for ${userId} (manually detected)`);
                        clearInterval(checkVideoPlaying);
                    }
                }, 500);
                
                // Clear after a reasonable timeout
                setTimeout(() => {
                    clearInterval(checkVideoPlaying);
                }, 10000);
            }
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

