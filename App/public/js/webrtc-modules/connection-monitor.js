/**
 * WebRTC Connection Monitor - Real-time monitoring and troubleshooting for WebRTC connections
 * This module provides a way to monitor and debug peer connections in real-time
 */

// Namespace for connection monitoring
window.WebRTCMonitor = window.WebRTCMonitor || {};

// Configuration
const CONFIG = {
    monitorInterval: 3000, // Check connections every 3 seconds
    autoRecover: true,    // Attempt automatic recovery of failing connections
    debugToConsole: true  // Log debug info to console
};

// State tracking
const connectionStates = new Map(); // Track connection state history
let monitoringActive = false;
let monitorInterval = null;

// UI elements
let debugPanel = null;
let connectionList = null;
let statsArea = null;

// Initialize the monitor
function initConnectionMonitor() {
    if (!window.peers) {
        console.warn("[MONITOR] No peers object found in global scope. WebRTC Monitor may not function properly.");
        return false;
    }
    
    createDebugUI();
    startMonitoring();
    console.log("[MONITOR] WebRTC connection monitoring initialized");
    return true;
}

// Create the monitoring UI
function createDebugUI() {
    // Check if panel already exists
    if (document.getElementById('webrtc-monitor-panel')) {
        debugPanel = document.getElementById('webrtc-monitor-panel');
        return;
    }
    
    // Create monitor panel
    debugPanel = document.createElement('div');
    debugPanel.id = 'webrtc-monitor-panel';
    debugPanel.className = 'webrtc-debug-panel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.top = '60px';
    debugPanel.style.right = '10px';
    debugPanel.style.width = '320px';
    debugPanel.style.maxHeight = '70vh';
    debugPanel.style.overflow = 'auto';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    debugPanel.style.color = '#fff';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '9999';
    debugPanel.style.display = 'none';
    debugPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    
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
    closeButton.onclick = () => { debugPanel.style.display = 'none'; };
    header.appendChild(closeButton);
    
    debugPanel.appendChild(header);
    
    // Connection list
    const listHeader = document.createElement('div');
    listHeader.textContent = 'Active Connections';
    listHeader.style.fontWeight = 'bold';
    listHeader.style.marginTop = '5px';
    listHeader.style.marginBottom = '5px';
    debugPanel.appendChild(listHeader);
    
    connectionList = document.createElement('div');
    connectionList.id = 'webrtc-connection-list';
    connectionList.style.marginBottom = '10px';
    debugPanel.appendChild(connectionList);
    
    // Stats area
    const statsHeader = document.createElement('div');
    statsHeader.textContent = 'Connection Statistics';
    statsHeader.style.fontWeight = 'bold';
    statsHeader.style.marginTop = '10px';
    statsHeader.style.marginBottom = '5px';
    debugPanel.appendChild(statsHeader);
    
    statsArea = document.createElement('div');
    statsArea.id = 'webrtc-stats-area';
    statsArea.style.fontSize = '11px';
    debugPanel.appendChild(statsArea);
    
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
    
    debugPanel.appendChild(actions);
    
    // Add to document
    document.body.appendChild(debugPanel);
}

// Start monitoring connections
function startMonitoring() {
    if (monitoringActive) return;
    
    monitoringActive = true;
    monitorInterval = setInterval(() => {
        updateConnectionList();
    }, CONFIG.monitorInterval);
    
    // Initial update
    updateConnectionList(true);
}

// Stop monitoring connections
function stopMonitoring() {
    if (!monitoringActive) return;
    
    clearInterval(monitorInterval);
    monitoringActive = false;
}

// Update the connection list
function updateConnectionList(forceUpdate = false) {
    if (!window.peers || !connectionList) return;
    
    const peersArray = Object.entries(window.peers);
    
    // Only update if there are changes or forced
    const connectionCount = peersArray.length;
    
    if (connectionCount === 0) {
        connectionList.innerHTML = '<div style="color:#aaa;font-style:italic;">No active connections</div>';
        return;
    }
    
    // Create or update connection items
    connectionList.innerHTML = '';
    
    peersArray.forEach(([peerId, peerData]) => {
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
        
        connectionList.appendChild(item);
        
        // Track states for history
        if (!connectionStates.has(peerId)) {
            connectionStates.set(peerId, {
                previous: null,
                current: connectionState,
                history: [{
                    connectionState,
                    iceState,
                    timestamp: Date.now()
                }]
            });
        } else {
            const state = connectionStates.get(peerId);
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
    
    // Update stats
    updateConnectionStats();
}

// Update connection statistics
function updateConnectionStats() {
    if (!statsArea) return;
    
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
    statsArea.innerHTML = `
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
    const history = connectionStates.get(peerId)?.history || [];
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
    if (!debugPanel) {
        createDebugUI();
    }
    
    debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    
    if (debugPanel.style.display === 'block') {
        updateConnectionList(true);
    }
}

// Expose public API
window.WebRTCMonitor = {
    init: initConnectionMonitor,
    show: function() { 
        if (!debugPanel) createDebugUI();
        debugPanel.style.display = 'block';
        updateConnectionList(true);
    },
    hide: function() { 
        if (debugPanel) debugPanel.style.display = 'none';
    },
    toggle: toggleDebugPanel,
    refresh: function() {
        updateConnectionList(true);
    },
    reconnectAll: attemptReconnectAll
};

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