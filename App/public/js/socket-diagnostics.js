/**
 * Socket.IO Connection Diagnostics Utility
 * 
 * This utility helps diagnose and fix common Socket.IO connection issues,
 * particularly for WebRTC applications running in Docker environments.
 */

// Create the diagnostics object
window.SocketDiagnostics = {
    // Configuration
    config: {
        debugToConsole: true,
        fixDockerServiceNames: true,
        testTimeout: 5000,
        showSuccessMessages: true
    },
    
    // Test results
    lastTest: {
        timestamp: null,
        success: false,
        error: null,
        details: {}
    },
    
    /**
     * Initialize the diagnostics tool
     * This adds a diagnostic button to the page if in debug mode
     */
    init(config = {}) {
        // Merge provided config with defaults
        this.config = {...this.config, ...config};
        
        // Log initialization
        this.log('Socket.IO Diagnostics initialized');
        
        // Add diagnostic button if in debug mode
        if (this.config.addDebugButton) {
            this.addDiagnosticButton();
        }
        
        // Automatically apply fixes for known issues
        if (this.config.autoApplyFixes) {
            this.applyFixes();
        }
        
        return this;
    },
    
    /**
     * Add a diagnostic button to the page
     */
    addDiagnosticButton() {
        // Create button element
        const button = document.createElement('button');
        button.textContent = 'Test Socket Connection';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.padding = '5px 15px';
        button.style.backgroundColor = '#5865F2';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        // Add click handler
        button.onclick = () => {
            this.runDiagnostics();
        };
        
        // Add to page
        document.body.appendChild(button);
        
        this.log('Diagnostic button added to page');
    },
    
    /**
     * Apply fixes for known issues
     * Currently only fixes Docker service names
     */
    applyFixes() {
        // Fix Docker service names in socket server meta tag
        if (this.config.fixDockerServiceNames) {
            const socketServerMeta = document.querySelector('meta[name="socket-server"]');
            if (socketServerMeta && socketServerMeta.content) {
                const originalUrl = socketServerMeta.content;
                
                // Fix Docker service names
                if (originalUrl.includes('socket-server')) {
                    const fixedUrl = originalUrl.replace('socket-server', 'localhost');
                    socketServerMeta.content = fixedUrl;
                    
                    this.log(`Fixed Docker service name in socket URL. Original: ${originalUrl}, Fixed: ${fixedUrl}`, 'warning');
                }
            }
            
            // Also fix socket path for localhost connections
            const socketPathMeta = document.querySelector('meta[name="socket-path"]');
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost && socketPathMeta) {
                // For localhost, always use standard Socket.IO path
                const originalPath = socketPathMeta.content;
                if (originalPath !== '/socket.io') {
                    socketPathMeta.content = '/socket.io';
                    this.log(`Fixed socket path for localhost. Original: ${originalPath}, Fixed: /socket.io`, 'warning');
                }
            }
        }
    },
    
    /**
     * Run diagnostic tests for Socket.IO connection
     */
    async runDiagnostics() {
        this.log('Starting Socket.IO connection diagnostics...');
        
        // Create results panel if it doesn't exist
        this.createResultsPanel();
        
        // Reset last test
        this.lastTest = {
            timestamp: new Date(),
            success: false,
            error: null,
            details: {}
        };
        
        // Step 1: Check Socket.IO library availability
        if (typeof io !== 'function') {
            this.lastTest.error = 'Socket.IO library not loaded';
            this.log('Socket.IO library not loaded!', 'error');
            this.updateResultsPanel();
            return;
        }
        
        // Step 2: Check socket configuration first
        if (!this.checkSocketConfiguration()) {
            this.log('Socket configuration check failed. Please fix the issues before testing connection.', 'warning');
            return;
        }
        
        // Step 3: Get socket configuration from getSocketConfig
        const socketConfig = this.getSocketConfig();
        this.lastTest.details.config = socketConfig;
        
        // Log configuration
        this.log(`Socket Config - URL: ${socketConfig.url}, Path: ${socketConfig.path}`);
        
        // Step 4: Attempt socket connection
        try {
            // Update panel to show testing
            this.updateResultsPanel('Testing socket connection...');
            
            // CRITICAL FIX: For localhost, always test with port 1002
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalhost) {
                const localhostUrl = window.location.protocol + '//' + window.location.hostname + ':1002';
                if (socketConfig.url !== localhostUrl) {
                    this.log(`Forcing localhost URL to use port 1002: ${localhostUrl}`, 'warning');
                    socketConfig.url = localhostUrl;
                    socketConfig.path = '/socket.io'; // Always use standard path for port 1002
                }
            }
            
            // Create test socket
            const testSocket = io(socketConfig.url, {
                path: socketConfig.path,
                transports: ['websocket', 'polling'],
                timeout: this.config.testTimeout,
                autoConnect: true,
                forceNew: true,
                query: { test: 'socket-diagnostics', t: Date.now() }
            });
            
            // Set up event handlers
            await new Promise((resolve) => {
                // Add connection timeout
                const timeout = setTimeout(() => {
                    this.lastTest.error = 'Connection timeout';
                    testSocket.disconnect();
                    resolve();
                }, this.config.testTimeout);
                
                // Connection success
                testSocket.on('connect', () => {
                    clearTimeout(timeout);
                    this.lastTest.success = true;
                    this.lastTest.details.socketId = testSocket.id;
                    this.lastTest.details.transport = testSocket.io.engine.transport.name;
                    
                    this.log(`Socket.IO connected successfully (ID: ${testSocket.id})`, 'success');
                    
                    testSocket.disconnect();
                    resolve();
                });
                
                // Connection error
                testSocket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    this.lastTest.error = error.message;
                    
                    this.log(`Socket.IO connection error: ${error.message}`, 'error');
                    
                    testSocket.disconnect();
                    resolve();
                });
            });
            
            // Update results panel
            this.updateResultsPanel();
            
        } catch (error) {
            this.lastTest.error = error.message;
            this.log(`Socket.IO test failed: ${error.message}`, 'error');
            this.updateResultsPanel();
        }
    },
    
    /**
     * Get the current Socket.IO configuration
     */
    getSocketConfig() {
        // Get socket server URL from meta tag
        const socketServerMeta = document.querySelector('meta[name="socket-server"]');
        let socketUrl = socketServerMeta ? socketServerMeta.content : null;
        
        // Get socket path from meta tag
        const socketPathMeta = document.querySelector('meta[name="socket-path"]');
        let socketPath = socketPathMeta ? socketPathMeta.content : '/socket.io';
        
        // Check if we're running on localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Apply special handling for localhost
        if (isLocalhost) {
            // For localhost development, ALWAYS use port 1002 and standard path
            socketUrl = window.location.protocol + '//' + window.location.hostname + ':1002';
            socketPath = '/socket.io';
            this.log(`Using localhost URL for socket connection: ${socketUrl}`, 'info');
            
            // Test if the Socket.IO script exists at this URL+path
            fetch(`${socketUrl}/socket.io/socket.io.js`, { method: 'HEAD' })
                .then(response => {
                    this.log(`Socket.IO test at ${socketUrl}/socket.io/socket.io.js: ${response.ok ? 'Available' : 'Not found'} (${response.status})`, 
                             response.ok ? 'success' : 'warning');
                })
                .catch(error => {
                    this.log(`Socket.IO test error: ${error.message}`, 'error');
                });
        } else if (!socketUrl) {
            // For non-localhost without explicit URL, use current origin
            socketUrl = window.location.origin;
            this.log(`Using current origin for socket connection: ${socketUrl}`, 'info');
        }
        
        return {
            url: socketUrl,
            path: socketPath,
            isLocalhost: isLocalhost
        };
    },
    
    /**
     * Create or show the results panel
     */
    createResultsPanel() {
        // Check if panel already exists
        let panel = document.getElementById('socket-diagnostics-panel');
        
        if (!panel) {
            // Create panel
            panel = document.createElement('div');
            panel.id = 'socket-diagnostics-panel';
            panel.style.position = 'fixed';
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.transform = 'translate(-50%, -50%)';
            panel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            panel.style.color = 'white';
            panel.style.padding = '20px';
            panel.style.borderRadius = '5px';
            panel.style.zIndex = '10000';
            panel.style.width = '400px';
            panel.style.maxHeight = '80vh';
            panel.style.overflowY = 'auto';
            panel.style.fontFamily = 'monospace';
            panel.style.fontSize = '14px';
            panel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
            
            // Create header
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '15px';
            
            const title = document.createElement('h3');
            title.textContent = 'Socket.IO Diagnostics';
            title.style.margin = '0';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.color = 'white';
            closeButton.style.fontSize = '20px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = () => {
                panel.style.display = 'none';
            };
            
            header.appendChild(title);
            header.appendChild(closeButton);
            panel.appendChild(header);
            
            // Create content area
            const content = document.createElement('div');
            content.id = 'socket-diagnostics-content';
            panel.appendChild(content);
            
            // Create footer with action buttons
            const footer = document.createElement('div');
            footer.style.marginTop = '15px';
            footer.style.display = 'flex';
            footer.style.gap = '10px';
            
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry Test';
            retryButton.style.flex = '1';
            retryButton.style.padding = '5px';
            retryButton.style.backgroundColor = '#5865F2';
            retryButton.style.color = 'white';
            retryButton.style.border = 'none';
            retryButton.style.borderRadius = '3px';
            retryButton.style.cursor = 'pointer';
            retryButton.onclick = () => this.runDiagnostics();
            
            const fixButton = document.createElement('button');
            fixButton.textContent = 'Apply Fixes';
            fixButton.style.flex = '1';
            fixButton.style.padding = '5px';
            fixButton.style.backgroundColor = '#57F287';
            fixButton.style.color = 'white';
            fixButton.style.border = 'none';
            fixButton.style.borderRadius = '3px';
            fixButton.style.cursor = 'pointer';
            fixButton.onclick = () => {
                this.applyFixes();
                this.runDiagnostics();
            };
            
            footer.appendChild(retryButton);
            footer.appendChild(fixButton);
            panel.appendChild(footer);
            
            // Add to document
            document.body.appendChild(panel);
        } else {
            // Show panel if it exists
            panel.style.display = 'block';
        }
    },
    
    /**
     * Update the results panel with current test results
     */
    updateResultsPanel(statusText = null) {
        const content = document.getElementById('socket-diagnostics-content');
        if (!content) return;
        
        // If status text is provided, show just that
        if (statusText) {
            content.innerHTML = `<div style="text-align: center;">${statusText}</div>`;
            return;
        }
        
        // Otherwise build results HTML
        let html = '';
        
        // Test result header
        if (this.lastTest.success) {
            html += '<div style="color: #57F287; font-weight: bold; margin-bottom: 10px;">✅ Connection Successful</div>';
        } else {
            html += '<div style="color: #ED4245; font-weight: bold; margin-bottom: 10px;">❌ Connection Failed</div>';
        }
        
        // Error message if any
        if (this.lastTest.error) {
            html += `<div style="color: #ED4245; margin-bottom: 10px;">Error: ${this.lastTest.error}</div>`;
        }
        
        // Configuration details
        const config = this.lastTest.details.config || {};
        html += '<div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">';
        html += '<div style="font-weight: bold; margin-bottom: 5px;">Connection Settings:</div>';
        html += `<div>URL: <span style="color: #5865F2;">${config.url || 'Not set'}</span></div>`;
        html += `<div>Path: <span style="color: #5865F2;">${config.path || 'Not set'}</span></div>`;
        html += '</div>';
        
        // Connection details if successful
        if (this.lastTest.success) {
            html += '<div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">';
            html += '<div style="font-weight: bold; margin-bottom: 5px;">Connection Details:</div>';
            html += `<div>Socket ID: <span style="color: #5865F2;">${this.lastTest.details.socketId || 'Unknown'}</span></div>`;
            html += `<div>Transport: <span style="color: #5865F2;">${this.lastTest.details.transport || 'Unknown'}</span></div>`;
            html += '</div>';
        }
        
        // Troubleshooting suggestions if failed
        if (!this.lastTest.success) {
            html += '<div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">';
            html += '<div style="font-weight: bold; margin-bottom: 5px;">Troubleshooting Suggestions:</div>';
            
            if (this.lastTest.error && this.lastTest.error.includes('ECONNREFUSED')) {
                html += '<div>• Server might not be running, check socket-server.js process</div>';
                html += '<div>• Check if port 1002 is accessible from your browser</div>';
            } else if (this.lastTest.error && this.lastTest.error.includes('timeout')) {
                html += '<div>• Connection timed out, server might be unreachable</div>';
                html += '<div>• Check your network connection</div>';
            } else if (config.url && config.url.includes('socket-server')) {
                html += '<div style="color: #FAA61A;">• URL contains Docker service name "socket-server" which browsers cannot resolve</div>';
                html += '<div>• Click "Apply Fixes" to replace with "localhost"</div>';
            } else {
                html += '<div>• Check if Socket.IO server is running</div>';
                html += '<div>• Verify the URL and path are correct</div>';
            }
            
            html += '</div>';
        }
        
        // Update content
        content.innerHTML = html;
    },
    
    /**
     * Utility logging function
     */
    log(message, level = 'info') {
        // Only log to console if enabled
        if (this.config.debugToConsole) {
            const prefix = '[SocketDiagnostics]';
            
            switch (level) {
                case 'error':
                    console.error(prefix, message);
                    break;
                case 'warning':
                    console.warn(prefix, message);
                    break;
                case 'success':
                    if (this.config.showSuccessMessages) {
                        console.log(prefix, '%c' + message, 'color: green');
                    }
                    break;
                default:
                    console.log(prefix, message);
            }
        }
        
        // If WebRTCUI is available, log there too
        if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
            window.WebRTCUI.addLogEntry(message, level);
        }
    },
    
    /**
     * Socket.IO Configuration Checker
     * Performs a comprehensive check of socket connection settings
     */
    checkSocketConfiguration() {
        this.log('Checking Socket.IO configuration...');
        
        // Create a configuration check entry in the panel
        this.createResultsPanel();
        
        // Get metadata configuration
        const socketServerMeta = document.querySelector('meta[name="socket-server"]');
        const socketPathMeta = document.querySelector('meta[name="socket-path"]');
        const socketServerUrl = socketServerMeta ? socketServerMeta.content : null;
        const socketPath = socketPathMeta ? socketPathMeta.content : '/socket.io';
        
        // Check if we're in localhost or production
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Check for common misconfigurations
        let issues = [];
        
        // Check 1: Docker service name check
        if (socketServerUrl && socketServerUrl.includes('socket-server')) {
            issues.push({
                type: 'error',
                message: 'Socket server URL contains Docker service name "socket-server" which browsers cannot resolve',
                fix: 'Replace "socket-server" with "localhost" in meta[name="socket-server"] content'
            });
        }
        
        // Check 2: Port check for localhost
        if (isLocalhost) {
            if (socketServerUrl && !socketServerUrl.includes(':1002')) {
                issues.push({
                    type: 'error',
                    message: 'Socket server URL for localhost should use port 1002',
                    fix: 'Set socket server URL to "http://localhost:1002"'
                });
            }
            
            if (socketPath !== '/socket.io') {
                issues.push({
                    type: 'error',
                    message: 'Socket path for localhost should be "/socket.io"',
                    fix: 'Set socket path to "/socket.io" for localhost'
                });
            }
        }
        
        // Check 3: WebSocket URL construction check
        const expectedWebSocketUrl = isLocalhost 
            ? `ws://${window.location.hostname}:1002/socket.io/` 
            : `${window.location.protocol.replace('http', 'ws')}//${window.location.host}${socketPath}`;
        
        this.log(`Expected WebSocket URL: ${expectedWebSocketUrl}`);
        
        // Update the results panel with the configuration check
        this.updateResultsPanel(`
            <div style="margin-bottom: 10px; font-weight: bold;">Socket.IO Configuration Check</div>
            <div>Environment: ${isLocalhost ? 'Localhost' : 'Production'}</div>
            <div>Server URL: ${socketServerUrl || 'Not configured'}</div>
            <div>Socket Path: ${socketPath}</div>
            <div>Expected WebSocket URL: ${expectedWebSocketUrl}</div>
            ${issues.length > 0 
                ? `<div style="margin-top: 10px; color: #ED4245; font-weight: bold;">Found ${issues.length} configuration issues:</div>` +
                  issues.map(issue => `<div style="color: ${issue.type === 'error' ? '#ED4245' : '#FAA61A'}; margin-left: 10px;">• ${issue.message}</div>`).join('')
                : `<div style="margin-top: 10px; color: #57F287;">✓ No configuration issues detected</div>`
            }
        `);
        
        // Apply fixes automatically if configured
        if (this.config.autoApplyFixes && issues.length > 0) {
            this.applyFixes();
            // Rerun check after applying fixes
            setTimeout(() => this.checkSocketConfiguration(), 500);
        }
        
        return issues.length === 0;
    }
};

// Auto-initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    window.SocketDiagnostics.init({
        autoApplyFixes: true,
        addDebugButton: true
    });
}); 