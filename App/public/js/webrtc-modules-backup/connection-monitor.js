/**
 * WebRTC Connection Monitor - Real-time monitoring and troubleshooting for WebRTC connections
 * This module provides a way to monitor and debug peer connections in real-time
 */

// Initialize the namespace if it doesn't exist
window.WebRTCMonitor = window.WebRTCMonitor || {};

// Only set CONFIG if it doesn't exist yet
if (!window.WebRTCMonitor.hasOwnProperty('CONFIG')) {
    window.WebRTCMonitor.CONFIG = {
    monitorInterval: 3000, // Check connections every 3 seconds
    autoRecover: true,    // Attempt automatic recovery of failing connections
    debugToConsole: true  // Log debug info to console
};
}

// Set up state tracking in the namespace
if (!window.WebRTCMonitor.hasOwnProperty('connectionStates')) {
    window.WebRTCMonitor.connectionStates = new Map(); // Track connection state history
}
if (!window.WebRTCMonitor.hasOwnProperty('monitoringActive')) {
    window.WebRTCMonitor.monitoringActive = false;
}
if (!window.WebRTCMonitor.hasOwnProperty('monitorInterval')) {
    window.WebRTCMonitor.monitorInterval = null;
}

// UI elements in the namespace
if (!window.WebRTCMonitor.hasOwnProperty('debugPanel')) {
    window.WebRTCMonitor.debugPanel = null;
}
if (!window.WebRTCMonitor.hasOwnProperty('connectionList')) {
    window.WebRTCMonitor.connectionList = null;
}
if (!window.WebRTCMonitor.hasOwnProperty('statsArea')) {
    window.WebRTCMonitor.statsArea = null;
}

// Configuration
const CONNECTION_MONITOR_CONFIG = {
    updateInterval: 2000,          // How often to check connection status (ms)
    maxSocketReconnectAttempts: 5, // Maximum attempts to reconnect socket
    reconnectDelay: 3000,          // Delay between reconnect attempts (ms)
    debug: true                     // Enable detailed debugging
};

// State
let monitoringEnabled = false;
let socketReconnectAttempts = 0;
let lastSocketStatus = null;
let lastPeerStatus = null;
let connectionMonitorInterval = null;

// Store module configuration
const config = {
    socketCheckInterval: 5000,    // Check socket every 5 seconds
    localhostSettings: {
        useDefaultPath: true,     // Use standard /socket.io path for localhost
        port: 1002                // Use port 1002 for localhost
    }
};

// Module state
const state = {
    isMonitoring: false,
    intervalId: null,
    lastSocketId: null
};

// Initialize the monitor
function initConnectionMonitor(config = {}) {
    // Merge configs
    Object.assign(CONNECTION_MONITOR_CONFIG, config);
    
    // Set up monitor interval
    if (!connectionMonitorInterval) {
        connectionMonitorInterval = setInterval(checkConnectionStatus, CONNECTION_MONITOR_CONFIG.updateInterval);
        monitoringEnabled = true;
        
        logDebug('Connection monitor initialized');
    }
    
    // Add socket connection event listeners if socket exists
    if (window.socket) {
        attachSocketListeners(window.socket);
    }
    
    return true;
}

// Create the monitoring UI
function createDebugUI() {
    // Check if panel already exists
    if (document.getElementById('webrtc-monitor-panel')) {
        window.WebRTCMonitor.debugPanel = document.getElementById('webrtc-monitor-panel');
        return;
    }
    
    // Create monitor panel
    window.WebRTCMonitor.debugPanel = document.createElement('div');
    window.WebRTCMonitor.debugPanel.id = 'webrtc-monitor-panel';
    window.WebRTCMonitor.debugPanel.className = 'webrtc-debug-panel';
    window.WebRTCMonitor.debugPanel.style.position = 'fixed';
    window.WebRTCMonitor.debugPanel.style.top = '60px';
    window.WebRTCMonitor.debugPanel.style.right = '10px';
    window.WebRTCMonitor.debugPanel.style.width = '320px';
    window.WebRTCMonitor.debugPanel.style.maxHeight = '70vh';
    window.WebRTCMonitor.debugPanel.style.overflow = 'auto';
    window.WebRTCMonitor.debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    window.WebRTCMonitor.debugPanel.style.color = '#fff';
    window.WebRTCMonitor.debugPanel.style.padding = '10px';
    window.WebRTCMonitor.debugPanel.style.borderRadius = '5px';
    window.WebRTCMonitor.debugPanel.style.fontFamily = 'monospace';
    window.WebRTCMonitor.debugPanel.style.fontSize = '12px';
    window.WebRTCMonitor.debugPanel.style.zIndex = '9999';
    window.WebRTCMonitor.debugPanel.style.display = 'none';
    window.WebRTCMonitor.debugPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    
    // Create header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '10px';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
    header.style.paddingBottom = '5px';
    
    const title = document.createElement('h3');
    title.textContent = 'WebRTC Connection Monitor';
    title.style.margin = '0';
    title.style.fontSize = '14px';
    title.style.fontWeight = 'bold';
    header.appendChild(title);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.onclick = () => { window.WebRTCMonitor.debugPanel.style.display = 'none'; };
    header.appendChild(closeButton);
    
    window.WebRTCMonitor.debugPanel.appendChild(header);
    
    // Connection list
    const listHeader = document.createElement('div');
    listHeader.textContent = 'Active Connections';
    listHeader.style.fontWeight = 'bold';
    listHeader.style.marginTop = '5px';
    listHeader.style.marginBottom = '5px';
    window.WebRTCMonitor.debugPanel.appendChild(listHeader);
    
    window.WebRTCMonitor.connectionList = document.createElement('div');
    window.WebRTCMonitor.connectionList.id = 'webrtc-connection-list';
    window.WebRTCMonitor.connectionList.style.marginBottom = '10px';
    window.WebRTCMonitor.debugPanel.appendChild(window.WebRTCMonitor.connectionList);
    
    // Stats area
    const statsHeader = document.createElement('div');
    statsHeader.textContent = 'Connection Statistics';
    statsHeader.style.fontWeight = 'bold';
    statsHeader.style.marginTop = '10px';
    statsHeader.style.marginBottom = '5px';
    window.WebRTCMonitor.debugPanel.appendChild(statsHeader);
    
    window.WebRTCMonitor.statsArea = document.createElement('div');
    window.WebRTCMonitor.statsArea.id = 'webrtc-stats-area';
    window.WebRTCMonitor.statsArea.style.fontSize = '11px';
    window.WebRTCMonitor.debugPanel.appendChild(window.WebRTCMonitor.statsArea);
    
    // Action buttons
    const actions = document.createElement('div');
    actions.style.marginTop = '10px';
    actions.style.display = 'flex';
    actions.style.gap = '5px';
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.style.flex = '1';
    refreshButton.style.padding = '5px';
    refreshButton.style.backgroundColor = '#2196F3';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '3px';
    refreshButton.style.color = '#fff';
    refreshButton.style.cursor = 'pointer';
    refreshButton.onclick = () => { updateConnectionList(true); };
    actions.appendChild(refreshButton);
    
    const reconnectButton = document.createElement('button');
    reconnectButton.textContent = 'Reconnect All';
    reconnectButton.style.flex = '1';
    reconnectButton.style.padding = '5px';
    reconnectButton.style.backgroundColor = '#F44336';
    reconnectButton.style.border = 'none';
    reconnectButton.style.borderRadius = '3px';
    reconnectButton.style.color = '#fff';
    reconnectButton.style.cursor = 'pointer';
    reconnectButton.onclick = () => { attemptReconnectAll(); };
    actions.appendChild(reconnectButton);
    
    window.WebRTCMonitor.debugPanel.appendChild(actions);
    
    // Add to document
    document.body.appendChild(window.WebRTCMonitor.debugPanel);
}

// Start monitoring connections
function startMonitoring() {
    if (window.WebRTCMonitor.monitoringActive) return;
    
    window.WebRTCMonitor.monitoringActive = true;
    window.WebRTCMonitor.monitorInterval = setInterval(() => {
        updateConnectionList();
    }, window.WebRTCMonitor.CONFIG.monitorInterval);
    
    // Initial update
    updateConnectionList(true);
}

// Stop monitoring connections
function stopMonitoring() {
    if (!window.WebRTCMonitor.monitoringActive) return;
    
    clearInterval(window.WebRTCMonitor.monitorInterval);
    window.WebRTCMonitor.monitoringActive = false;
}

// Update the connection list
function updateConnectionList(forceUpdate = false) {
    if (!window.peers || !window.WebRTCMonitor.connectionList) return;
    
    const peersArray = Object.entries(window.peers);
    
    // Only update if there are changes or forced
    const connectionCount = peersArray.length;
    
    if (connectionCount === 0) {
        window.WebRTCMonitor.connectionList.innerHTML = '<div style="color:#aaa;font-style:italic;">No active connections</div>';
        return;
    }
    
    // Create or update connection items
    window.WebRTCMonitor.connectionList.innerHTML = '';
    
    // Keep track of valid peer IDs to clean up stale entries later
    const activePeerIds = new Set();
    
    peersArray.forEach(([peerId, peerData]) => {
        activePeerIds.add(peerId);
        const pc = peerData.pc;
        if (!pc) return;
        
        const connectionState = pc.connectionState || 'unknown';
        const iceState = pc.iceConnectionState || 'unknown';
        const userName = peerData.userName || 'Unknown';
        
        // Connection item
        const item = document.createElement('div');
        item.className = 'connection-item';
        item.style.padding = '5px';
        item.style.marginBottom = '5px';
        item.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        item.style.borderRadius = '3px';
        
        // Username
        const nameElement = document.createElement('div');
        nameElement.textContent = userName;
        nameElement.style.fontWeight = 'bold';
        nameElement.style.marginBottom = '3px';
        item.appendChild(nameElement);
        
        // Connection status
        const statusElement = document.createElement('div');
        statusElement.style.display = 'flex';
        statusElement.style.gap = '5px';
        
        // Status indicator
        const indicator = document.createElement('span');
        indicator.style.width = '10px';
        indicator.style.height = '10px';
        indicator.style.borderRadius = '50%';
        indicator.style.display = 'inline-block';
        
        // Status color
        if (connectionState === 'connected' && iceState === 'connected') {
            indicator.style.backgroundColor = '#4CAF50'; // Green
        } else if (connectionState === 'connecting' || iceState === 'checking') {
            indicator.style.backgroundColor = '#FF9800'; // Orange
        } else if (connectionState === 'failed' || iceState === 'failed') {
            indicator.style.backgroundColor = '#F44336'; // Red
        } else if (connectionState === 'disconnected' || iceState === 'disconnected') {
            indicator.style.backgroundColor = '#9E9E9E'; // Gray
        } else {
            indicator.style.backgroundColor = '#2196F3'; // Blue
        }
        
        statusElement.appendChild(indicator);
        
        // Status text
        const statusText = document.createElement('span');
        statusText.textContent = `${connectionState} / ${iceState}`;
        statusElement.appendChild(statusText);
        
        item.appendChild(statusElement);
        
        // Actions
        const actions = document.createElement('div');
        actions.style.marginTop = '5px';
        actions.style.textAlign = 'right';
        
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh';
        refreshButton.style.padding = '2px 5px';
        refreshButton.style.marginRight = '5px';
        refreshButton.style.backgroundColor = '#2196F3';
        refreshButton.style.border = 'none';
        refreshButton.style.borderRadius = '2px';
        refreshButton.style.color = '#fff';
        refreshButton.style.fontSize = '10px';
        refreshButton.style.cursor = 'pointer';
        refreshButton.onclick = () => { attemptReconnectPeer(peerId); };
        actions.appendChild(refreshButton);
        
        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'Details';
        detailsButton.style.padding = '2px 5px';
        detailsButton.style.backgroundColor = '#607D8B';
        detailsButton.style.border = 'none';
        detailsButton.style.borderRadius = '2px';
        detailsButton.style.color = '#fff';
        detailsButton.style.fontSize = '10px';
        detailsButton.style.cursor = 'pointer';
        detailsButton.onclick = () => { showConnectionDetails(peerId); };
        actions.appendChild(detailsButton);
        
        item.appendChild(actions);
        
        window.WebRTCMonitor.connectionList.appendChild(item);
        
        // Track states for history
        if (!window.WebRTCMonitor.connectionStates.has(peerId)) {
            window.WebRTCMonitor.connectionStates.set(peerId, {
                previous: null,
                current: connectionState,
                history: [{
                    connectionState,
                    iceState,
                    timestamp: Date.now()
                }]
            });
        } else {
            const state = window.WebRTCMonitor.connectionStates.get(peerId);
            state.previous = state.current;
            state.current = connectionState;
            
            // Only add to history if state changed
            if (state.previous !== state.current) {
                state.history.push({
                    connectionState,
                    iceState,
                    timestamp: Date.now()
                });
                
                // Limit history size
                if (state.history.length > 10) {
                    state.history.shift();
                }
            }
        }
    });
    
    // Clean up stale connection states to prevent memory leaks
    // This removes entries for connections that no longer exist
    for (const storedPeerId of window.WebRTCMonitor.connectionStates.keys()) {
        if (!activePeerIds.has(storedPeerId)) {
            window.WebRTCMonitor.connectionStates.delete(storedPeerId);
            console.log(`[MONITOR] Cleaned up stale connection state for peer: ${storedPeerId}`);
            
            // Also clean up any stored reconnect attempt flags in sessionStorage
            try {
                sessionStorage.removeItem(`failed_${storedPeerId}`);
            } catch (e) {
                // Ignore errors with sessionStorage
            }
        }
    }
    
    // Update stats
    updateConnectionStats();
}

// Update connection statistics
function updateConnectionStats() {
    if (!window.WebRTCMonitor.statsArea) return;
    
    const totalConnections = Object.keys(window.peers || {}).length;
    let connectedCount = 0;
    let failedCount = 0;
    let connectingCount = 0;
    
    // Count connection states
    for (const [peerId, peerData] of Object.entries(window.peers || {})) {
        if (!peerData.pc) continue;
        
        const connectionState = peerData.pc.connectionState;
        if (connectionState === 'connected') {
            connectedCount++;
        } else if (connectionState === 'failed') {
            failedCount++;
        } else if (connectionState === 'connecting' || connectionState === 'new') {
            connectingCount++;
        }
    }
    
    // Format stats
    window.WebRTCMonitor.statsArea.innerHTML = `
        <div>Total peers: ${totalConnections}</div>
        <div style="color:#4CAF50">Connected: ${connectedCount}</div>
        <div style="color:#FF9800">Connecting: ${connectingCount}</div>
        <div style="color:#F44336">Failed: ${failedCount}</div>
    `;
}

// Attempt to reconnect a peer
function attemptReconnectPeer(peerId) {
    if (!window.peers || !window.peers[peerId] || !window.peers[peerId].pc) {
        console.warn(`[MONITOR] Cannot reconnect peer ${peerId} - not found or no connection`);
        return false;
    }
    
    const peer = window.peers[peerId];
    
    // Try to restart ICE
    try {
        if (typeof peer.pc.restartIce === 'function') {
            peer.pc.restartIce();
            
            // Create a new offer to renegotiate
            peer.pc.createOffer({ iceRestart: true })
                .then(offer => peer.pc.setLocalDescription(offer))
                .then(() => {
                    // Emit offer via socket if available
                    if (window.socket) {
                        window.socket.emit('webrtc-offer', {
                            to: peerId,
                            offer: peer.pc.localDescription,
                            fromUserName: window.userName || 'Unknown'
                        });
                    }
                })
                .catch(err => {
                    console.error(`[MONITOR] Error creating offer for reconnect: ${err.message}`);
                });
                
            return true;
        }
    } catch (err) {
        console.error(`[MONITOR] Error reconnecting peer ${peerId}: ${err.message}`);
    }
    
    return false;
}

// Attempt to reconnect all failing connections
function attemptReconnectAll() {
    if (!window.peers) return;
    
    let reconnectCount = 0;
    
    for (const [peerId, peerData] of Object.entries(window.peers)) {
        if (!peerData.pc) continue;
        
        const connectionState = peerData.pc.connectionState;
        const iceState = peerData.pc.iceConnectionState;
        
        // Only reconnect failing or disconnected peers
        if (connectionState === 'failed' || connectionState === 'disconnected' || 
            iceState === 'failed' || iceState === 'disconnected') {
            if (attemptReconnectPeer(peerId)) {
                reconnectCount++;
            }
        }
    }
    
    console.log(`[MONITOR] Attempted to reconnect ${reconnectCount} peers`);
}

// Show detailed information for a connection
function showConnectionDetails(peerId) {
    if (!window.peers || !window.peers[peerId]) return;
    
    const peer = window.peers[peerId];
    const pc = peer.pc;
    
    if (!pc) {
        alert(`No peer connection data available for ${peer.userName || peerId}`);
        return;
    }
    
    // Connection history
    const history = window.WebRTCMonitor.connectionStates.get(peerId)?.history || [];
    let historyHtml = '';
    
    if (history.length > 0) {
        history.forEach((entry, index) => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString();
            historyHtml += `
                <tr>
                    <td>${timeStr}</td>
                    <td>${entry.connectionState}</td>
                    <td>${entry.iceState}</td>
                </tr>
            `;
        });
    } else {
        historyHtml = `<tr><td colspan="3">No history available</td></tr>`;
    }
    
    // Get WebRTC stats if available
    if (typeof pc.getStats === 'function') {
        pc.getStats()
            .then(stats => {
                let statsHtml = '';
                
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        statsHtml += `<div>Video packets received: ${report.packetsReceived}</div>`;
                        statsHtml += `<div>Video packets lost: ${report.packetsLost}</div>`;
                        statsHtml += `<div>Video jitter: ${report.jitter?.toFixed(3) || 'N/A'}</div>`;
                    }
                    
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                        statsHtml += `<div>Audio packets received: ${report.packetsReceived}</div>`;
                        statsHtml += `<div>Audio packets lost: ${report.packetsLost}</div>`;
                        statsHtml += `<div>Audio jitter: ${report.jitter?.toFixed(3) || 'N/A'}</div>`;
                    }
                    
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        statsHtml += `<div>Round trip time: ${report.currentRoundTripTime ? (report.currentRoundTripTime * 1000).toFixed(1) + 'ms' : 'N/A'}</div>`;
                        statsHtml += `<div>Network type: ${report.localCandidateId ? stats.get(report.localCandidateId)?.networkType || 'N/A' : 'N/A'}</div>`;
                        statsHtml += `<div>Relay protocol: ${report.localCandidateId ? stats.get(report.localCandidateId)?.protocol || 'N/A' : 'N/A'}</div>`;
                    }
                });
                
                // Create the modal content
                showDetailsModal(peer.userName || peerId, {
                    id: peerId,
                    connectionState: pc.connectionState,
                    iceState: pc.iceConnectionState,
                    signalingState: pc.signalingState,
                    statsHtml,
                    historyHtml
                });
            })
            .catch(err => {
                showDetailsModal(peer.userName || peerId, {
                    id: peerId,
                    connectionState: pc.connectionState,
                    iceState: pc.iceConnectionState,
                    signalingState: pc.signalingState,
                    statsHtml: `<div class="error">Error getting stats: ${err.message}</div>`,
                    historyHtml
                });
            });
    } else {
        showDetailsModal(peer.userName || peerId, {
            id: peerId,
            connectionState: pc.connectionState,
            iceState: pc.iceConnectionState,
            signalingState: pc.signalingState,
            statsHtml: `<div class="error">Stats API not available</div>`,
            historyHtml
        });
    }
}

// Show a modal with connection details
function showDetailsModal(userName, details) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000';
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.backgroundColor = '#1e1e1e';
    modal.style.borderRadius = '5px';
    modal.style.width = '400px';
    modal.style.maxWidth = '90%';
    modal.style.maxHeight = '80vh';
    modal.style.overflow = 'auto';
    modal.style.padding = '15px';
    modal.style.color = '#fff';
    modal.style.fontFamily = 'monospace';
    modal.style.fontSize = '12px';
    
    // Modal header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
    header.style.paddingBottom = '10px';
    
    const title = document.createElement('h3');
    title.textContent = `Connection Details: ${userName}`;
    title.style.margin = '0';
    title.style.fontSize = '16px';
    header.appendChild(title);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => { document.body.removeChild(overlay); };
    header.appendChild(closeButton);
    
    modal.appendChild(header);
    
    // Connection details
    const content = document.createElement('div');
    content.innerHTML = `
        <h4>Connection Status</h4>
        <div>
            <div><strong>Connection State:</strong> <span style="color: ${getStateColor(details.connectionState)}">${details.connectionState}</span></div>
            <div><strong>ICE State:</strong> <span style="color: ${getStateColor(details.iceState)}">${details.iceState}</span></div>
            <div><strong>Signaling State:</strong> ${details.signalingState}</div>
            <div><strong>Peer ID:</strong> ${details.id}</div>
        </div>
        
        <h4>WebRTC Stats</h4>
        <div>${details.statsHtml || 'No stats available'}</div>
        
        <h4>Connection History</h4>
        <table style="width:100%; border-collapse:collapse">
            <thead>
                <tr style="text-align:left">
                    <th>Time</th>
                    <th>Connection</th>
                    <th>ICE</th>
                </tr>
            </thead>
            <tbody>
                ${details.historyHtml}
            </tbody>
        </table>
    `;
    
    // Style the table
    const style = document.createElement('style');
    style.textContent = `
        table th, table td {
            padding: 5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
    `;
    content.appendChild(style);
    modal.appendChild(content);
    
    // Actions
    const actions = document.createElement('div');
    actions.style.marginTop = '15px';
    actions.style.textAlign = 'right';
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Attempt Reconnect';
    refreshButton.style.padding = '8px 15px';
    refreshButton.style.backgroundColor = '#2196F3';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '3px';
    refreshButton.style.color = '#fff';
    refreshButton.style.cursor = 'pointer';
    refreshButton.onclick = () => { 
        attemptReconnectPeer(details.id); 
        // Close modal after action
        document.body.removeChild(overlay);
    };
    actions.appendChild(refreshButton);
    
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Helper to get color for connection state
function getStateColor(state) {
    switch(state) {
        case 'connected': return '#4CAF50';
        case 'connecting': 
        case 'checking': 
        case 'new': return '#FF9800';
        case 'failed': return '#F44336';
        case 'disconnected': return '#9E9E9E';
        default: return '#2196F3';
    }
}

// Toggle the debug panel visibility
function toggleDebugPanel() {
    if (!window.WebRTCMonitor.debugPanel) {
        createDebugUI();
    }
    
    window.WebRTCMonitor.debugPanel.style.display = window.WebRTCMonitor.debugPanel.style.display === 'none' ? 'block' : 'none';
    
    if (window.WebRTCMonitor.debugPanel.style.display === 'block') {
        updateConnectionList(true);
    }
}

// Export functions to the WebRTCMonitor namespace
window.WebRTCMonitor = {
    ...window.WebRTCMonitor,
    init: initConnectionMonitor,
    start: startMonitoring,
    stop: stopMonitoring,
    togglePanel: toggleDebugPanel,
    updateConnections: updateConnectionList,
    getStateColor: getStateColor,
    attemptReconnectAll: attemptReconnectAll,
    attemptReconnectPeer: attemptReconnectPeer,
    show: function() { 
        if (!window.WebRTCMonitor.debugPanel) createDebugUI();
        window.WebRTCMonitor.debugPanel.style.display = 'block';
        updateConnectionList(true);
    },
    hide: function() { 
        if (window.WebRTCMonitor.debugPanel) window.WebRTCMonitor.debugPanel.style.display = 'none';
    },
    toggle: toggleDebugPanel,
    refresh: function() {
        updateConnectionList(true);
    }
};

// If the module is loaded in a Node.js environment, export it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCMonitor;
}

// Define keyboard shortcut to toggle debug panel (Ctrl+M)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        toggleDebugPanel();
    }
});

// Auto-initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Auto-initialize after a delay (to ensure all required objects are available)
    setTimeout(() => {
        if (window.peers) {
            initConnectionMonitor();
            console.log('[MONITOR] WebRTC Monitor ready (Press Ctrl+M to toggle)');
        }
    }, 2000);
});

/**
 * Check the status of all connections and update UI
 */
function checkConnectionStatus() {
    if (!monitoringEnabled) return;
    
    // Check socket status
    const socketStatus = checkSocketStatus();
    
    // Check peer connections status
    const peerStatus = checkPeerConnectionsStatus();
    
    // Update UI if status changed
    if (socketStatus !== lastSocketStatus || peerStatus !== lastPeerStatus) {
        updateConnectionStatusUI(socketStatus, peerStatus);
        
        lastSocketStatus = socketStatus;
        lastPeerStatus = peerStatus;
    }
}

/**
 * Check socket connection status
 * @returns {string} - 'connected', 'connecting', or 'disconnected'
 */
function checkSocketStatus() {
    const socket = window.socket;
    
    if (!socket) {
        logError('Socket not initialized');
        return 'disconnected';
    }
    
    // Log detailed socket info for debugging
    if (CONNECTION_MONITOR_CONFIG.debug) {
        logDebug('Socket status:', {
            connected: socket.connected,
            id: socket.id,
            disconnected: socket.disconnected,
            engine: socket.io ? {
                transport: socket.io.engine ? socket.io.engine.transport : 'unknown',
                readyState: socket.io.engine ? socket.io.engine.readyState : 'unknown',
                hostname: socket.io.uri || 'unknown'
            } : 'unknown'
        });
    }
    
    if (socket.connected) {
        socketReconnectAttempts = 0;
        return 'connected';
    } else if (socket.connecting) {
        return 'connecting';
    } else {
        // Check if we should attempt to reconnect
        if (socketReconnectAttempts < CONNECTION_MONITOR_CONFIG.maxSocketReconnectAttempts) {
            socketReconnectAttempts++;
            logWarning(`Socket disconnected. Attempting to reconnect (${socketReconnectAttempts}/${CONNECTION_MONITOR_CONFIG.maxSocketReconnectAttempts})`);
            
            // Try to reconnect if socket exists but is disconnected
            if (socket && !socket.connected && !socket.connecting) {
                try {
                    setTimeout(() => {
                        if (socket && !socket.connected && !socket.connecting) {
                            logInfo('Attempting socket reconnect...');
                            socket.connect();
                        }
                    }, CONNECTION_MONITOR_CONFIG.reconnectDelay);
                } catch (e) {
                    logError('Socket reconnect error:', e);
                }
            }
            
            return 'connecting';
        }
        
        return 'disconnected';
    }
}

/**
 * Check all peer connections status
 * @returns {string} - 'connected', 'connecting', or 'disconnected'
 */
function checkPeerConnectionsStatus() {
    // Get all peer connections
    let peerConnections = [];
    
    if (window.WebRTCPeerConnection && typeof window.WebRTCPeerConnection.getAllPeers === 'function') {
        peerConnections = window.WebRTCPeerConnection.getAllPeers();
    } else if (window.peers) {
        peerConnections = Object.entries(window.peers).map(([id, data]) => ({id, ...data}));
    }
    
    if (peerConnections.length === 0) {
        // No peers yet, consider this "connecting" state
        return 'connecting';
    }
    
    // Count connection states
    let connectedCount = 0;
    let connectingCount = 0;
    let disconnectedCount = 0;
    let failedCount = 0;
    
    // Log detailed peer info for debugging
    if (CONNECTION_MONITOR_CONFIG.debug) {
        const peerInfo = peerConnections.map(peer => {
            const pc = peer.pc || peer;
            return {
                id: peer.id || 'unknown',
                connectionState: pc.connectionState || 'unknown',
                iceConnectionState: pc.iceConnectionState || 'unknown',
                iceGatheringState: pc.iceGatheringState || 'unknown'
            };
        });
        logDebug('Peer connections:', peerInfo);
    }
    
    peerConnections.forEach(peer => {
        const pc = peer.pc || peer;
        const peerId = peer.id || 'unknown';
        
        if (!pc) return;
        
        // Check connection state
        const iceState = pc.iceConnectionState;
        const connState = pc.connectionState;
        
        // Handle failed ICE connections with fallback strategy
        if (iceState === 'failed' || connState === 'failed') {
            failedCount++;
            
            // Track failed connections to avoid repeated fallback attempts
            const failedKey = `failed_${peerId}`;
            const lastAttempt = parseInt(sessionStorage.getItem(failedKey) || '0');
            const now = Date.now();
            
            // Only try fallback every 30 seconds at most
            if (now - lastAttempt > 30000) {
                sessionStorage.setItem(failedKey, now.toString());
                handleIceFailure(peerId, peer);
            }
        }
        else if (connState === 'connected' || iceState === 'connected') {
            connectedCount++;
            
            // Clear failed flag if connection is established
            sessionStorage.removeItem(`failed_${peerId}`);
        }
        else if (
            connState === 'connecting' || 
            connState === 'new' ||
            iceState === 'checking' || 
            iceState === 'new'
        ) {
            connectingCount++;
        }
        else {
            disconnectedCount++;
        }
    });
    
    // Determine overall status
    if (connectedCount > 0) {
        return 'connected';
    } else if (connectingCount > 0) {
        return 'connecting';
    } else {
        return 'disconnected';
    }
}

/**
 * Update the connection status UI
 * @param {string} socketStatus - Socket connection status
 * @param {string} peerStatus - Peer connections status
 */
function updateConnectionStatusUI(socketStatus, peerStatus) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const retryConnection = document.getElementById('retryConnection');
    
    if (!statusIndicator || !statusText) return;
    
    // Remove old classes
    statusIndicator.classList.remove('connected', 'connecting', 'disconnected');
    
    // Determine overall status (socket is more important)
    let overallStatus = 'disconnected';
    let statusMessage = 'Disconnected';
    
    if (socketStatus === 'connected') {
        if (peerStatus === 'connected') {
            overallStatus = 'connected';
            statusMessage = 'Connected';
        } else if (peerStatus === 'connecting') {
            overallStatus = 'connecting';
            statusMessage = 'Establishing peer connections...';
        } else {
            overallStatus = 'connecting';
            statusMessage = 'Waiting for peers...';
        }
    } else if (socketStatus === 'connecting') {
        overallStatus = 'connecting';
        statusMessage = 'Connecting to server...';
    } else {
        overallStatus = 'disconnected';
        statusMessage = 'Disconnected from server';
    }
    
    // Update UI
    statusIndicator.classList.add(overallStatus);
    statusText.textContent = statusMessage;
    
    // Show/hide retry button
    if (retryConnection) {
        retryConnection.style.display = (overallStatus === 'disconnected') ? 'block' : 'none';
    }
    
    // Log status change
    logInfo(`Connection status: ${overallStatus} (Socket: ${socketStatus}, Peers: ${peerStatus})`);
    
    // Update document title to show connection status (optional)
    document.title = overallStatus === 'disconnected' ? 
        '⚠️ Disconnected - MiscVord' : 
        'MiscVord - Global Video Chat';
}

/**
 * Attach socket event listeners for monitoring connection
 * @param {SocketIO.Socket} socket - The socket instance to monitor
 */
function attachSocketListeners(socket) {
    if (!socket) return;
    
    // Remove any existing listeners
    socket.off('connect');
    socket.off('disconnect');
    socket.off('error');
    socket.off('connect_error');
    socket.off('reconnect');
    socket.off('reconnect_attempt');
    socket.off('reconnect_error');
    socket.off('reconnect_failed');
    
    // Add listeners for connection events
    socket.on('connect', () => {
        logInfo('Socket connected:', socket.id);
        updateConnectionStatusUI('connected', lastPeerStatus || 'connecting');
        socketReconnectAttempts = 0;
    });
    
    socket.on('disconnect', (reason) => {
        logWarning('Socket disconnected. Reason:', reason);
        updateConnectionStatusUI('disconnected', lastPeerStatus || 'disconnected');
    });
    
    socket.on('error', (error) => {
        logError('Socket error:', error);
    });
    
    socket.on('connect_error', (error) => {
        logError('Socket connect error:', error);
        updateConnectionStatusUI('disconnected', lastPeerStatus || 'disconnected');
    });
    
    // Reconnection events
    socket.on('reconnect', (attemptNumber) => {
        logInfo('Socket reconnected after', attemptNumber, 'attempts');
        updateConnectionStatusUI('connected', lastPeerStatus || 'connecting');
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
        logInfo('Socket reconnect attempt:', attemptNumber);
        updateConnectionStatusUI('connecting', lastPeerStatus || 'disconnected');
    });
    
    socket.on('reconnect_error', (error) => {
        logError('Socket reconnect error:', error);
    });
    
    socket.on('reconnect_failed', () => {
        logError('Socket reconnect failed after max attempts');
        updateConnectionStatusUI('disconnected', lastPeerStatus || 'disconnected');
    });
    
    logInfo('Socket listeners attached');
}

/**
 * Log a message to the console and UI if available
 */
function logDebug(...args) {
    if (!CONNECTION_MONITOR_CONFIG.debug) return;
    console.debug('[ConnectionMonitor]', ...args);
    
    // Log to UI if available
    if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
        window.WebRTCUI.addLogEntry('[ConnectionMonitor] ' + args.join(' '), 'debug');
    }
}

function logInfo(...args) {
    console.info('[ConnectionMonitor]', ...args);
    
    // Log to UI if available
    if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
        window.WebRTCUI.addLogEntry('[ConnectionMonitor] ' + args.join(' '), 'info');
    }
}

function logWarning(...args) {
    console.warn('[ConnectionMonitor]', ...args);
    
    // Log to UI if available
    if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
        window.WebRTCUI.addLogEntry('[ConnectionMonitor] ' + args.join(' '), 'warn');
    }
}

function logError(...args) {
    console.error('[ConnectionMonitor]', ...args);
    
    // Log to UI if available
    if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
        window.WebRTCUI.addLogEntry('[ConnectionMonitor] ' + args.join(' '), 'error');
    }
}

/**
 * Simple connection retry (legacy version for compatibility)
 * Forwards to the enhanced recoverConnection function
 */
function retryConnection() {
    console.log("[Connection Monitor] Retry connection requested (legacy)");
    window.WebRTCUI.addLogEntry('Connection retry requested', 'system');
    
    // Forward to the advanced recovery function
    return recoverConnection();
}

/**
 * Stop monitoring connections
 */
function stopConnectionMonitor() {
    if (connectionMonitorInterval) {
        clearInterval(connectionMonitorInterval);
        connectionMonitorInterval = null;
    }
    
    monitoringEnabled = false;
    logInfo('Connection monitor stopped');
}

// Export functions
window.WebRTCMonitor = {
    initConnectionMonitor,
    checkConnectionStatus,
    retryConnection,
    stopConnectionMonitor
};

/**
 * Initialize the connection monitor
 * @param {Object} config - Optional configuration parameters
 * @return {Object} Connection monitor interface
 */
function init(config = {}) {
    // Merge configuration
    Object.assign(CONNECTION_MONITOR_CONFIG, config);
    
    // Apply special fixes for localhost environment
    applyLocalhostFixes();
    
    // Start monitoring with a short delay
    setTimeout(startMonitoring, 1000);
    
    // Add network change event listener
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    // Listen for visibility changes to restart monitoring when tab becomes visible again
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            console.log('[Connection Monitor] Tab visible, checking connection status');
            checkConnectionStatus();
        }
    });
    
    // Create debug UI if requested
    if (config.showDebugUI) {
        createDebugUI();
    }
    
    // Export interface to module namespace
    window.WebRTCMonitor.startMonitoring = startMonitoring;
    window.WebRTCMonitor.stopMonitoring = stopMonitoring;
    window.WebRTCMonitor.checkConnectionStatus = checkConnectionStatus;
    window.WebRTCMonitor.retryConnection = retryConnection;
    window.WebRTCMonitor.recoverConnection = recoverConnection; // Export the new enhanced recovery function
    window.WebRTCMonitor.toggleDebugPanel = toggleDebugPanel;
    
    console.log('[Connection Monitor] Initialized');
    
    return {
        startMonitoring,
        stopMonitoring,
        checkConnectionStatus,
        retryConnection, 
        recoverConnection, // Expose enhanced recovery function
        toggleDebugPanel
    };
}

/**
 * Apply special settings for localhost development
 */
function applyLocalhostFixes() {
    console.log('[WebRTC] Applying localhost specific connection settings');
    window.WebRTCUI.addLogEntry('Applying localhost connection fixes', 'system');
    
    // Force socket settings for localhost
    const socketPathMeta = document.querySelector('meta[name="socket-path"]');
    if (socketPathMeta) {
        if (config.localhostSettings.useDefaultPath) {
            // Override any existing socket path with the standard /socket.io path
            socketPathMeta.content = '/socket.io';
            console.log('[WebRTC] Forcing standard socket.io path for localhost:', socketPathMeta.content);
        }
    }
    
    // Force socket URL to include the correct port
    const socketServerMeta = document.querySelector('meta[name="socket-server"]');
    if (socketServerMeta) {
        // Ensure URL has the correct port
        let url = socketServerMeta.content;
        if (!url.includes(':' + config.localhostSettings.port)) {
            url = window.location.protocol + '//' + window.location.hostname + ':' + config.localhostSettings.port;
            socketServerMeta.content = url;
            console.log('[WebRTC] Forcing localhost socket URL with correct port:', url);
        }
    }
    
    // Extra debug UI elements for localhost
    setTimeout(() => {
        const debugPanel = document.getElementById('webrtcDebugPanel');
        if (debugPanel) {
            const localhostNotice = document.createElement('div');
            localhostNotice.className = 'bg-indigo-900 text-white text-xs p-2 mb-2 rounded';
            localhostNotice.innerHTML = '<b>Localhost Environment</b><br>Socket path: <span class="text-yellow-300">/socket.io</span><br>Socket port: <span class="text-yellow-300">1002</span>';
            
            // Insert at the beginning of the debug panel
            if (debugPanel.firstChild) {
                debugPanel.insertBefore(localhostNotice, debugPanel.firstChild);
            } else {
                debugPanel.appendChild(localhostNotice);
            }
        }
    }, 1000);
    
    // Ensure socket connection is established immediately
    ensureSocketConnection();
}

/**
 * Check if the socket connection is established
 */
function checkSocketConnection() {
    // Check WebRTCSignaling module
    if (!window.WebRTCSignaling) {
        console.warn('[WebRTC] WebRTCSignaling module not loaded.');
        return;
    }
    
    // Check if socket exists and is connected
    const isConnected = window.WebRTCSignaling.isConnected();
    const socketId = window.WebRTCSignaling.getSocketId();
    
    if (isConnected && socketId) {
        if (state.lastSocketId !== socketId) {
            // Socket reconnected with a different ID
            console.log('[WebRTC] Socket reconnected with new ID:', socketId);
            window.WebRTCUI.addLogEntry(`Socket reconnected: ${socketId}`, 'socket');
            
            // Update lastSocketId
            state.lastSocketId = socketId;
        }
    } else {
        // Socket disconnected or not initialized
        if (state.lastSocketId !== null) {
            // Was connected before, now disconnected
            console.warn('[WebRTC] Socket disconnected');
            window.WebRTCUI.addLogEntry('Socket disconnected', 'socket');
            
            // Reset lastSocketId
            state.lastSocketId = null;
            
            // Try to reconnect
            attemptReconnection();
        } else {
            // Was never connected or still trying to connect
            ensureSocketConnection();
        }
    }
}

/**
 * Handle network changes (online/offline)
 */
function handleNetworkChange(event) {
    if (event.type === 'online') {
        console.log('[WebRTC] Network online, attempting reconnection');
        window.WebRTCUI.addLogEntry('Network connection restored', 'socket');
        attemptReconnection();
    } else {
        console.log('[WebRTC] Network offline');
        window.WebRTCUI.addLogEntry('Network connection lost', 'socket');
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Network connection lost');
    }
}

/**
 * Attempt to reconnect the socket
 */
function attemptReconnection() {
    if (!window.WebRTCSignaling || !window.WebRTCSignaling.reconnect) {
        console.warn('[WebRTC] WebRTCSignaling.reconnect not available');
        return;
    }
    
    console.log('[WebRTC] Attempting reconnection');
    window.WebRTCUI.updateConnectionStatus('connecting', 'Reconnecting...');
    
    // Get room ID and username from global storage if available
    const roomId = window.VIDEO_CHAT_ROOM || 'global-video-chat';
    const userName = window.userName || 'User_' + Math.floor(Math.random() * 10000);
    
    // Call reconnect with current room and username
    window.WebRTCSignaling.reconnect(roomId, userName);
}

/**
 * Ensure socket connection is established
 * This can be called from other modules or UI elements
 */
function ensureSocketConnection() {
    if (window.WebRTCSignaling && window.WebRTCSignaling.isConnected()) {
        console.log('[WebRTC] Socket already connected');
        return;
    }
    
    // If webrtc.js has a global connection function, use it
    if (typeof window.webrtcEnsureSocketConnection === 'function') {
        console.log('[WebRTC] Using global ensureSocketConnection function');
        window.webrtcEnsureSocketConnection();
        return;
    }
    
    // Otherwise try using WebRTCSignaling directly
    if (window.WebRTCSignaling && window.WebRTCSignaling.reconnect) {
        console.log('[WebRTC] Using WebRTCSignaling.reconnect');
        // Get room ID and username from global storage if available
        const roomId = window.VIDEO_CHAT_ROOM || 'global-video-chat';
        const userName = window.userName || 'User_' + Math.floor(Math.random() * 10000);
        
        window.WebRTCSignaling.reconnect(roomId, userName);
    } else {
        console.warn('[WebRTC] No method available to ensure socket connection');
    }
}

// Export functions to the namespace
window.WebRTCMonitor = {
    ...window.WebRTCMonitor,
    init,
    checkSocketConnection,
    retryConnection,
    ensureSocketConnection
};

// Auto-initialize if all required modules are loaded
if (window.WebRTCUI && window.WebRTCSignaling) {
    init();
} else {
    // Wait for modules to be loaded
    console.log('[WebRTC] Connection Monitor waiting for required modules');
    
    // Check every second for required modules
    const checkInterval = setInterval(() => {
        if (window.WebRTCUI && window.WebRTCSignaling) {
            clearInterval(checkInterval);
            init();
        }
    }, 1000);
}

/**
 * Handle failed ICE connections with fallback strategies
 * @param {String} peerId - ID of the peer connection that failed
 * @param {Object} peerInfo - Peer connection information
 */
function handleIceFailure(peerId, peerInfo) {
    if (!peerInfo || !peerInfo.pc) {
        logError(`Cannot handle ICE failure for peer ${peerId}: Invalid peer information`);
        return;
    }

    logWarning(`ICE connection to peer ${peerId} failed, trying fallback strategies`);
    
    // Strategy 1: Try ICE restart
    if (typeof peerInfo.pc.restartIce === 'function') {
        logInfo(`Attempting ICE restart for peer ${peerId}`);
        peerInfo.pc.restartIce();
        
        // Create a new offer with ICE restart flag
        peerInfo.pc.createOffer({ iceRestart: true })
            .then(offer => {
                return peerInfo.pc.setLocalDescription(offer);
            })
            .then(() => {
                // If we have a signaling channel, send the offer
                if (window.WebRTCSignaling && typeof window.WebRTCSignaling.sendWebRTCOffer === 'function') {
                    window.WebRTCSignaling.sendWebRTCOffer(
                        peerId, 
                        peerInfo.pc.localDescription, 
                        { isIceRestart: true, isReconnect: true }
                    );
                    logInfo(`Sent ICE restart offer to peer ${peerId}`);
                }
            })
            .catch(err => {
                logError(`Error creating ICE restart offer: ${err.message}`);
                
                // Move to next strategy if ICE restart fails
                tryRelayCandidateOnly(peerId, peerInfo);
            });
    } else {
        // If ICE restart not supported, try relay candidates only
        tryRelayCandidateOnly(peerId, peerInfo);
    }
}

/**
 * Try connecting using only relay candidates
 * This is useful when direct connections fail due to NAT/firewall issues
 * @param {String} peerId - ID of the peer
 * @param {Object} peerInfo - Peer connection information
 */
function tryRelayCandidateOnly(peerId, peerInfo) {
    logInfo(`Attempting relay-only connection for peer ${peerId}`);
    
    // Get current ICE transport policy
    const currentPolicy = peerInfo.pc.getConfiguration()?.iceTransportPolicy || 'all';
    
    // Only proceed if we're not already using relay-only
    if (currentPolicy !== 'relay') {
        // Create new config with relay-only
        const newConfig = peerInfo.pc.getConfiguration() || {};
        newConfig.iceTransportPolicy = 'relay';
        
        try {
            // Apply new configuration if supported
            if (typeof peerInfo.pc.setConfiguration === 'function') {
                peerInfo.pc.setConfiguration(newConfig);
                logInfo(`Set ICE transport policy to relay-only for peer ${peerId}`);
                
                // Force ICE restart with new configuration
                peerInfo.pc.restartIce();
                
                // Create a new offer with new configuration
                peerInfo.pc.createOffer({ iceRestart: true })
                    .then(offer => peerInfo.pc.setLocalDescription(offer))
                    .then(() => {
                        if (window.WebRTCSignaling && typeof window.WebRTCSignaling.sendWebRTCOffer === 'function') {
                            window.WebRTCSignaling.sendWebRTCOffer(
                                peerId, 
                                peerInfo.pc.localDescription, 
                                { isIceRestart: true, isReconnect: true, relayOnly: true }
                            );
                            logInfo(`Sent relay-only ICE restart offer to peer ${peerId}`);
                        }
                    })
                    .catch(err => {
                        logError(`Error creating relay-only offer: ${err.message}`);
                    });
            } else {
                logError(`setConfiguration not supported, cannot use relay-only fallback`);
            }
        } catch (e) {
            logError(`Error applying relay-only configuration: ${e.message}`);
        }
    } else {
        logWarning(`Peer ${peerId} already using relay-only configuration`);
    }
}

/**
 * Advanced connection recovery with progressive backoff
 * This function attempts to restore lost connections with increased delay between attempts
 */
function recoverConnection() {
    console.log('[Connection Monitor] Starting advanced connection recovery');
    window.WebRTCUI.addLogEntry('Starting connection recovery process...', 'system');
    
    // Check for socket health
    if (!window.socket || !window.socket.connected) {
        console.log('[Connection Monitor] Socket connection lost, attempting recovery');
        window.WebRTCUI.updateConnectionStatus('connecting', 'Attempting to recover connection...');
        
        // Try reconnection with progressive backoff
        let attempts = 0;
        const maxAttempts = 5;
        const baseDelay = 1000;
        
        const attemptReconnect = () => {
            if (attempts >= maxAttempts) {
                console.error('[Connection Monitor] Failed to recover connection after maximum attempts');
                window.WebRTCUI.updateConnectionStatus('disconnected', 'Connection recovery failed');
                window.WebRTCUI.addLogEntry('Connection recovery failed after multiple attempts. Please refresh the page.', 'error');
                return;
            }
            
            attempts++;
            const delay = baseDelay * Math.pow(1.5, attempts - 1);
            console.log(`[Connection Monitor] Reconnection attempt ${attempts}/${maxAttempts} in ${delay}ms`);
            window.WebRTCUI.addLogEntry(`Reconnection attempt ${attempts}/${maxAttempts}...`, 'socket');
            
            setTimeout(() => {
                // Try to reconnect using WebRTCSignaling if available
                if (window.WebRTCSignaling && typeof window.WebRTCSignaling.reconnect === 'function') {
                    window.WebRTCSignaling.reconnect(
                        window.VIDEO_CHAT_ROOM || 'global-video-chat',
                        window.userName || 'User_' + Math.floor(Math.random() * 10000)
                    );
                    
                    // Check if reconnect was successful
                    setTimeout(() => {
                        if (window.socket && window.socket.connected) {
                            console.log('[Connection Monitor] Reconnection successful');
                            window.WebRTCUI.addLogEntry('Connection restored successfully!', 'success');
                            window.WebRTCUI.updateConnectionStatus('connected', 'Connection restored');
                        } else {
                            console.log('[Connection Monitor] Reconnection attempt failed');
                            window.WebRTCUI.addLogEntry(`Connection attempt ${attempts} failed`, 'warn');
                            attemptReconnect();
                        }
                    }, 2000);
                } else {
                    // Fallback to direct socket reconnection
                    if (window.socket) {
                        try {
                            window.socket.connect();
                            
                            // Check if reconnect was successful
                            setTimeout(() => {
                                if (window.socket && window.socket.connected) {
                                    console.log('[Connection Monitor] Direct reconnection successful');
                                    window.WebRTCUI.addLogEntry('Connection restored successfully!', 'success');
                                    window.WebRTCUI.updateConnectionStatus('connected', 'Connection restored');
                                } else {
                                    console.log('[Connection Monitor] Direct reconnection attempt failed');
                                    window.WebRTCUI.addLogEntry(`Connection attempt ${attempts} failed`, 'warn');
                                    attemptReconnect();
                                }
                            }, 2000);
                        } catch (e) {
                            console.error('[Connection Monitor] Error during reconnection:', e);
                            window.WebRTCUI.addLogEntry(`Error during reconnection: ${e.message}`, 'error');
                            attemptReconnect();
                        }
                    } else {
                        console.error('[Connection Monitor] Socket instance not available for reconnection');
                        window.WebRTCUI.addLogEntry('Socket instance not available. Creating new connection...', 'warn');
                        
                        // Last resort: try to create a new connection
                        if (window.WebRTCConfig && typeof window.io === 'function') {
                            try {
                                const socketUrl = window.WebRTCConfig.getSocketUrl();
                                const socketOptions = window.WebRTCConfig.getSocketOptions();
                                
                                window.socket = window.io(socketUrl, socketOptions);
                                
                                // Check if new connection was successful
                                setTimeout(() => {
                                    if (window.socket && window.socket.connected) {
                                        console.log('[Connection Monitor] New socket connection successful');
                                        window.WebRTCUI.addLogEntry('New connection established successfully!', 'success');
                                        window.WebRTCUI.updateConnectionStatus('connected', 'New connection established');
                                        
                                        // Try to rejoin the room
                                        if (window.VIDEO_CHAT_ROOM && window.userName) {
                                            window.socket.emit('joinVideoChat', {
                                                userId: window.socket.id,
                                                userName: window.userName
                                            });
                                            window.WebRTCUI.addLogEntry(`Rejoining room as ${window.userName}`, 'socket');
                                        }
                                    } else {
                                        console.log('[Connection Monitor] New socket connection failed');
                                        window.WebRTCUI.addLogEntry('Failed to establish new connection', 'error');
                                        attemptReconnect();
                                    }
                                }, 2000);
                            } catch (e) {
                                console.error('[Connection Monitor] Failed to create new socket:', e);
                                window.WebRTCUI.addLogEntry(`Failed to create new socket: ${e.message}`, 'error');
                                attemptReconnect();
                            }
                        } else {
                            window.WebRTCUI.addLogEntry('Cannot recover: Socket.IO or configuration not available', 'error');
                        }
                    }
                }
            }, delay);
        };
        
        // Start the reconnection process
        attemptReconnect();
    } else {
        console.log('[Connection Monitor] Socket already connected, checking peer connections');
        window.WebRTCUI.addLogEntry('Socket connected, checking peer connections...', 'system');
        
        // Check peer connections health as well
        if (typeof checkPeerConnectionsStatus === 'function') {
            checkPeerConnectionsStatus();
        }
    }
    
    return true;
} 