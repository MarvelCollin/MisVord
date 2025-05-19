/**
 * WebRTC UI Manager Module
 * Handles all UI-related functionality for the WebRTC application
 */

// Create a namespace for the UI manager
window.WebRTCUI = {
    // UI element references
    elements: {
        // These will be populated in the init function
        connectionStatus: null,
        statusIndicator: null, 
        statusText: null,
        participantsList: null,
        socketLogs: null,
        logEntries: null
    },

    /**
     * Initialize the UI manager
     * @param {Object} config - Configuration for the UI manager
     */
    init(config = {}) {
        // Store references to DOM elements
        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            participantsList: document.getElementById('participantsList'),
            socketLogs: document.getElementById('socketLogs'),
            logEntries: document.getElementById('logEntries')
        };

        // Configure debug modes
        this.debugMode = config.debugMode || window.appDebugMode || false;
        this.debugSettings = {
            socketEvents: config.debugSocketEvents || true,
            peerConnections: config.debugPeerConnections || true,
            userTracking: config.debugUserTracking || true
        };

        return this;
    },

    /**
     * Add a log entry to the console and UI
     * @param {string} message - The message to log
     * @param {string} type - The type of log entry
     */
    addLogEntry(message, type = 'info') {
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
            user: 'color: #e83e8c; font-weight: bold;',
            peer: 'color: #6610f2; font-weight: bold;',
            ping: 'color: #FF9500; font-weight: bold;',
            media: 'color: #0693e3; font-weight: bold;',
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
        
        // Log to UI if element exists
        if (!this.elements.logEntries) return;
        const entry = document.createElement('div');
        entry.className = `log-entry type-${type}`;
        entry.innerHTML = `<strong>[${type.toUpperCase()}]</strong> ${new Date().toLocaleTimeString()}: ${message}`;
        this.elements.logEntries.appendChild(entry);
        if (this.elements.socketLogs) this.elements.socketLogs.scrollTop = this.elements.socketLogs.scrollHeight;
    },

    /**
     * Update the connection status UI
     * @param {string} status - The connection status (connected, connecting, disconnected)
     * @param {string} text - The text to display
     */
    updateConnectionStatus(status, text) {
        if (!this.elements.connectionStatus || !this.elements.statusIndicator || !this.elements.statusText) return;
        
        this.addLogEntry(`Connection status: ${status} - ${text}`, 'system');
        
        this.elements.statusIndicator.className = 'status-indicator'; // Reset classes
        if (status === 'connected') {
            this.elements.statusIndicator.classList.add('connected');
        } else if (status === 'connecting') {
            this.elements.statusIndicator.classList.add('connecting');
        } else {
            this.elements.statusIndicator.classList.add('disconnected');
        }
        this.elements.statusText.textContent = text;
        this.elements.connectionStatus.style.display = 'flex'; // Make sure it's visible
    },

    /**
     * Update the participants list UI
     * @param {Object} currentPeers - The current peers object
     * @param {string} localUserName - The local user's name
     * @param {string} localSocketId - The local user's socket ID
     */
    updateParticipantsList(currentPeers, localUserName, localSocketId) {
        if (!this.elements.participantsList) {
            this.addLogEntry("participantsList element not found in DOM!", 'error');
            return;
        }
        
        this.elements.participantsList.innerHTML = '';
        const peerCount = Object.keys(currentPeers).length;
        this.addLogEntry(`Updating participants list UI. Current peers: ${peerCount}`, 'user');

        // DEBUG: Log the current user and all peers
        if (this.debugSettings.userTracking) {
            console.log('%c[PARTICIPANTS] Local user:', 'color: #007bff; font-weight: bold;', {
                userName: localUserName,
                socketId: localSocketId,
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
        selfAvatar.textContent = (localUserName || 'Me').substring(0, 2).toUpperCase();
        const selfNameSpan = document.createElement('span');
        selfNameSpan.className = 'text-sm font-bold';
        selfNameSpan.textContent = localUserName + ' (You)';
        selfItem.appendChild(selfAvatar);
        selfItem.appendChild(selfNameSpan);
        this.elements.participantsList.appendChild(selfItem);

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
                this.elements.participantsList.appendChild(participantItem);
                count++;
                
                this.addLogEntry(`Added participant to UI: ${peerData.userName} (${peerSocketId}), state: ${connectionState}`, 'user');
            } else {
                this.addLogEntry(`Skipped adding peer ${peerSocketId} to UI - missing userName`, 'warn');
            }
        }
        if (count === 1) {
            const noUsersItem = document.createElement('div');
            noUsersItem.className = 'text-gray-400 text-sm p-2';
            noUsersItem.textContent = 'You are the only one here.';
            this.elements.participantsList.appendChild(noUsersItem);
            this.addLogEntry('No other participants to show', 'user');
        } else {
            this.addLogEntry(`Successfully displayed ${count-1} participants`, 'user');
        }
    },

    /**
     * Update media toggle buttons state
     * @param {boolean} isVideoEnabled - Whether video is enabled
     * @param {boolean} isAudioEnabled - Whether audio is enabled
     * @param {boolean} isScreenSharing - Whether screen sharing is enabled
     */
    updateMediaToggleButtons(isVideoEnabled, isAudioEnabled, isScreenSharing) {
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');
        const toggleAudioBtn = document.getElementById('toggleAudioBtn');
        const toggleScreenBtn = document.getElementById('toggleScreenBtn');
        
        if (toggleVideoBtn) {
            toggleVideoBtn.innerHTML = isVideoEnabled ? 
                '<i class="fas fa-video"></i>' : 
                '<i class="fas fa-video-slash"></i>';
            toggleVideoBtn.classList.toggle('bg-red-500', !isVideoEnabled);
            toggleVideoBtn.classList.toggle('bg-gray-600', isVideoEnabled);
        }
        
        if (toggleAudioBtn) {
            toggleAudioBtn.innerHTML = isAudioEnabled ? 
                '<i class="fas fa-microphone"></i>' : 
                '<i class="fas fa-microphone-slash"></i>';
            toggleAudioBtn.classList.toggle('bg-red-500', !isAudioEnabled);
            toggleAudioBtn.classList.toggle('bg-gray-600', isAudioEnabled);
        }
        
        if (toggleScreenBtn && isScreenSharing !== undefined) {
            toggleScreenBtn.innerHTML = isScreenSharing ? 
                '<i class="fas fa-desktop text-green-500"></i>' : 
                '<i class="fas fa-desktop"></i>';
            toggleScreenBtn.classList.toggle('bg-green-500', isScreenSharing);
            toggleScreenBtn.classList.toggle('bg-gray-600', !isScreenSharing);
        }
    },

    /**
     * Show a low bandwidth warning to the user
     * @param {string} message - The warning message
     */
    showLowBandwidthWarning(message = 'Low bandwidth detected. Video quality reduced.') {
        // Remove any existing warning first
        const existingWarning = document.getElementById('bandwidth-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // Create the warning element
        const warningElement = document.createElement('div');
        warningElement.id = 'bandwidth-warning';
        warningElement.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-fadeIn';
        
        // Add the warning icon and message
        warningElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button class="ml-3 focus:outline-none" onclick="this.parentElement.remove();">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to the document
        document.body.appendChild(warningElement);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warningElement.parentNode) {
                warningElement.classList.add('animate-fadeOut');
                setTimeout(() => warningElement.remove(), 500); // Remove after fade out
            }
        }, 10000);
    },

    /**
     * Show a network connectivity alert to the user
     * @param {string} message - The alert message
     */
    showNetworkConnectivityAlert(message) {
        const existingAlert = document.getElementById('network-connectivity-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alertElement = document.createElement('div');
        alertElement.id = 'network-connectivity-alert';
        alertElement.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md animate-fadeIn';
        
        alertElement.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas fa-wifi text-xl"></i>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium">Network Issue Detected</h3>
                    <div class="mt-1 text-sm">${message}</div>
                    <div class="mt-2">
                        <button type="button" id="reconnect-button" 
                            class="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded">
                            Reconnect
                        </button>
                        <button type="button" id="dismiss-network-alert" 
                            class="text-sm ml-2 text-white text-opacity-80 hover:text-opacity-100">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertElement);
        
        // Add event listeners
        document.getElementById('dismiss-network-alert').addEventListener('click', () => {
            alertElement.classList.add('animate-fadeOut');
            setTimeout(() => alertElement.remove(), 500);
        });
        
        // Reconnect button should be configured separately with the app's reconnect logic
        return alertElement;
    }
}; 