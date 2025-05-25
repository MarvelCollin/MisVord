/**
 * Socket Diagnostics Utility
 * Helps diagnose WebSocket connection issues in both local and VPS environments
 */
window.SocketDiagnostics = {
    /**
     * Initialize the diagnostics tool
     * @param {Object} options Configuration options
     */
    init: function(options = {}) {
        this.options = Object.assign({
            logToConsole: true,
            logToElement: true,
            logElementId: 'socketLogs',
            maxLogEntries: 50
        }, options);
        
        this.logs = [];
        this.connectionAttempts = 0;
        
        // Create log element if needed
        if (this.options.logToElement && !document.getElementById(this.options.logElementId)) {
            const logElement = document.createElement('div');
            logElement.id = this.options.logElementId;
            logElement.className = 'socket-logs';
            logElement.style.cssText = 'position:fixed; bottom:10px; left:10px; max-width:400px; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.7); color:white; padding:10px; border-radius:5px; font-family:monospace; font-size:12px; z-index:9999; display:none;';
            document.body.appendChild(logElement);
            
            // Add toggle button
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'Socket Logs';
            toggleButton.style.cssText = 'position:fixed; bottom:10px; left:10px; background:#007bff; color:white; border:none; border-radius:3px; padding:5px 10px; cursor:pointer; z-index:10000;';
            toggleButton.onclick = () => {
                const logs = document.getElementById(this.options.logElementId);
                if (logs.style.display === 'none') {
                    logs.style.display = 'block';
                    logs.classList.add('visible');
                } else {
                    logs.style.display = 'none';
                    logs.classList.remove('visible');
                }
            };
            document.body.appendChild(toggleButton);
        }
        
        this.detectEnvironment();
        this.log('Socket Diagnostics initialized');
        this.log(`Environment: ${this.environment.type}`);
        
        // Check for Socket.IO
        if (typeof io === 'undefined') {
            this.log('ERROR: Socket.IO not loaded!', 'error');
        } else {
            this.log('Socket.IO loaded successfully');
        }
        
        // Get socket configuration from meta tags
        this.getSocketConfig();
    },
    
    /**
     * Detect the current environment
     */
    detectEnvironment: function() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.');
        const isHttps = window.location.protocol === 'https:';
        const port = window.location.port;
        
        this.environment = {
            type: isLocal ? 'local' : 'production',
            isHttps: isHttps,
            hostname: hostname,
            port: port,
            fullUrl: window.location.href
        };
    },
    
    /**
     * Get socket configuration from meta tags
     */
    getSocketConfig: function() {
        const socketServer = document.querySelector('meta[name="socket-server"]');
        const socketPath = document.querySelector('meta[name="socket-path"]');
        const socketSecure = document.querySelector('meta[name="socket-secure"]');
        const socketSubpath = document.querySelector('meta[name="socket-subpath"]');
        
        this.socketConfig = {
            server: socketServer ? socketServer.content : null,
            path: socketPath ? socketPath.content : null,
            secure: socketSecure ? socketSecure.content === 'true' : false,
            subpath: socketSubpath ? socketSubpath.content === 'true' : false
        };
        
        this.log('Socket configuration detected:');
        this.log(`- Server: ${this.socketConfig.server}`);
        this.log(`- Path: ${this.socketConfig.path}`);
        this.log(`- Secure: ${this.socketConfig.secure}`);
        this.log(`- Subpath: ${this.socketConfig.subpath}`);
        
        // Check for potential issues
        this.checkForIssues();
    },
    
    /**
     * Check for potential WebSocket issues
     */
    checkForIssues: function() {
        // Check for mixed content issues
        if (this.environment.isHttps && this.socketConfig.server && this.socketConfig.server.startsWith('http:')) {
            this.log('WARNING: Mixed content - secure page with insecure WebSocket', 'warning');
        }
        
        // Check for path issues
        if (this.socketConfig.subpath && this.socketConfig.path && !this.socketConfig.path.includes(this.environment.isLocal ? '' : '/misvord')) {
            this.log('WARNING: Socket path may be incorrect for subpath deployment', 'warning');
        }
        
        // Check for Socket.IO connection
        if (typeof io !== 'undefined' && this.socketConfig.server && this.socketConfig.path) {
            this.testConnection();
        }
    },
    
    /**
     * Test socket connection
     */
    testConnection: function() {
        this.log('Testing socket connection...');
        this.connectionAttempts++;
        
        try {
            const socket = io(this.socketConfig.server, {
                path: this.socketConfig.path,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 3,
                timeout: 5000
            });
            
            socket.on('connect', () => {
                this.log('✓ Socket connected successfully!', 'success');
                this.log(`Socket ID: ${socket.id}`);
                
                // Disconnect after successful test
                setTimeout(() => {
                    socket.disconnect();
                    this.log('Test socket disconnected');
                }, 3000);
            });
            
            socket.on('connect_error', (error) => {
                this.log(`✗ Connection error: ${error.message}`, 'error');
                this.suggestFixes(error);
            });
            
            socket.on('disconnect', (reason) => {
                this.log(`Socket disconnected: ${reason}`);
            });
            
            socket.on('error', (error) => {
                this.log(`Socket error: ${error}`, 'error');
            });
        } catch (e) {
            this.log(`✗ Error creating socket: ${e.message}`, 'error');
        }
    },
    
    /**
     * Suggest fixes based on error
     */
    suggestFixes: function(error) {
        if (error.message.includes('xhr poll error')) {
            this.log('Suggestion: Check if the socket server is running and accessible');
            this.log('Suggestion: Verify the socket URL and path are correct');
        } else if (error.message.includes('timeout')) {
            this.log('Suggestion: The server might be running but not responding in time');
            this.log('Suggestion: Check server logs for errors');
        } else if (error.message.includes('CORS')) {
            this.log('Suggestion: CORS issue - check server CORS configuration');
            this.log(`Current origin: ${window.location.origin}`);
        }
        
        // Retry connection if needed
        if (this.connectionAttempts < 3) {
            this.log(`Retrying connection (attempt ${this.connectionAttempts + 1}/3)...`);
            setTimeout(() => this.testConnection(), 2000);
        }
    },
    
    /**
     * Log a message
     * @param {string} message The message to log
     * @param {string} level Log level (info, warning, error, success)
     */
    log: function(message, level = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        const logEntry = {
            timestamp,
            message,
            level
        };
        
        this.logs.push(logEntry);
        
        // Trim logs if needed
        if (this.logs.length > this.options.maxLogEntries) {
            this.logs.shift();
        }
        
        // Console logging
        if (this.options.logToConsole) {
            const consoleMethod = level === 'error' ? 'error' : 
                                level === 'warning' ? 'warn' : 
                                level === 'success' ? 'info' : 'log';
            console[consoleMethod](`[Socket] ${timestamp} - ${message}`);
        }
        
        // Element logging
        if (this.options.logToElement) {
            const logElement = document.getElementById(this.options.logElementId);
            if (logElement) {
                const entryElement = document.createElement('div');
                entryElement.className = `log-entry log-${level}`;
                entryElement.innerHTML = `<span class="log-time">${timestamp}</span> <span class="log-msg">${message}</span>`;
                
                // Style based on level
                switch (level) {
                    case 'error':
                        entryElement.style.color = '#ff5555';
                        break;
                    case 'warning':
                        entryElement.style.color = '#ffaa00';
                        break;
                    case 'success':
                        entryElement.style.color = '#55ff55';
                        break;
                    default:
                        entryElement.style.color = '#ffffff';
                }
                
                logElement.appendChild(entryElement);
                logElement.scrollTop = logElement.scrollHeight;
            }
        }
    }
};

// Auto-initialize if in debug mode
if (window.location.search.includes('debug=socket')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.SocketDiagnostics.init();
    });
}