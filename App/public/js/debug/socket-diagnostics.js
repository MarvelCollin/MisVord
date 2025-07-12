class SocketDiagnostics {
    constructor() {
        this.results = [];
    }

    log(message, type = 'info') {
        const entry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message
        };
        this.results.push(entry);
        
        const colors = {
            info: 'color: #2196F3',
            success: 'color: #4CAF50', 
            warning: 'color: #FF9800',
            error: 'color: #F44336'
        };
        
        console.log(`%c[SOCKET-DIAGNOSTICS] ${message}`, colors[type] || colors.info);
    }

    async runFullDiagnostics() {
        this.log('🔍 Starting comprehensive Socket.IO diagnostics...', 'info');
        this.results = [];
        
        await this.checkEnvironmentConfiguration();
        await this.checkMetaTags();
        await this.checkNetworkConnectivity();
        await this.checkSocketIOLibrary();
        await this.checkSecuritySettings();
        await this.checkDockerVPSConfiguration();
        
        this.generateReport();
        return this.results;
    }

    checkEnvironmentConfiguration() {
        this.log('📋 Checking environment configuration...', 'info');
        
        const currentUrl = window.location.href;
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        this.log(`Current page: ${currentUrl}`, 'info');
        this.log(`Protocol: ${protocol}, Hostname: ${hostname}, Port: ${port}`, 'info');
        
        const isHTTPS = protocol === 'https:';
        this.log(`HTTPS detected: ${isHTTPS}`, isHTTPS ? 'success' : 'warning');
        
        if (isHTTPS && hostname === 'marvelcollin.my.id') {
            this.log('✅ VPS HTTPS configuration detected', 'success');
        } else if (!isHTTPS && hostname === 'localhost') {
            this.log('✅ Local development configuration detected', 'success');
        } else {
            this.log('⚠️ Mixed or unexpected configuration detected', 'warning');
        }
    }

    checkMetaTags() {
        this.log('🏷️ Checking meta tag configuration...', 'info');
        
        const metaTags = {
            'socket-host': document.querySelector('meta[name="socket-host"]')?.content,
            'socket-port': document.querySelector('meta[name="socket-port"]')?.content,
            'socket-secure': document.querySelector('meta[name="socket-secure"]')?.content,
            'socket-base-path': document.querySelector('meta[name="socket-base-path"]')?.content,
            'is-docker': document.querySelector('meta[name="is-docker"]')?.content,
            'is-vps': document.querySelector('meta[name="is-vps"]')?.content,
            'user-id': document.querySelector('meta[name="user-id"]')?.content,
            'username': document.querySelector('meta[name="username"]')?.content,
            'user-authenticated': document.querySelector('meta[name="user-authenticated"]')?.content
        };
        
        for (const [key, value] of Object.entries(metaTags)) {
            if (value) {
                this.log(`✅ ${key}: ${value}`, 'success');
            } else {
                this.log(`❌ ${key}: NOT FOUND`, 'error');
            }
        }
        
        const socketHost = metaTags['socket-host'];
        const socketPort = metaTags['socket-port'];
        const socketSecure = metaTags['socket-secure'] === 'true';
        const socketPath = metaTags['socket-base-path'] || '/socket.io';
        
        if (socketHost) {
            let expectedUrl;
            if (socketPort) {
                expectedUrl = `${socketSecure ? 'https' : 'http'}://${socketHost}:${socketPort}${socketPath}`;
            } else {
                expectedUrl = `${socketSecure ? 'https' : 'http'}://${socketHost}${socketPath}`;
            }
            this.log(`🎯 Expected Socket.IO URL: ${expectedUrl}`, 'info');
            
            const wsUrl = expectedUrl.replace('http', 'ws');
            this.log(`🔌 Expected WebSocket URL: ${wsUrl}`, 'info');
        }
    }

    async checkNetworkConnectivity() {
        this.log('🌐 Checking network connectivity...', 'info');
        
        const socketHost = document.querySelector('meta[name="socket-host"]')?.content;
        const socketPort = document.querySelector('meta[name="socket-port"]')?.content;
        const socketSecure = document.querySelector('meta[name="socket-secure"]')?.content === 'true';
        
        if (!socketHost) {
            this.log('❌ Cannot test connectivity - no socket host configured', 'error');
            return;
        }
        
        let baseUrl;
        if (socketPort) {
            baseUrl = `${socketSecure ? 'https' : 'http'}://${socketHost}:${socketPort}`;
        } else {
            baseUrl = `${socketSecure ? 'https' : 'http'}://${socketHost}`;
        }
        
        try {
            this.log(`🧪 Testing HTTP health endpoint: ${baseUrl}/health`, 'info');
            const healthResponse = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                this.log(`✅ Health endpoint accessible: ${JSON.stringify(healthData)}`, 'success');
            } else {
                this.log(`⚠️ Health endpoint returned ${healthResponse.status}`, 'warning');
            }
        } catch (error) {
            this.log(`❌ Health endpoint failed: ${error.message}`, 'error');
        }
        
        try {
            this.log(`🧪 Testing Socket.IO endpoint: ${baseUrl}/socket.io/`, 'info');
            const socketResponse = await fetch(`${baseUrl}/socket.io/`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (socketResponse.ok) {
                this.log(`✅ Socket.IO endpoint accessible`, 'success');
            } else {
                this.log(`⚠️ Socket.IO endpoint returned ${socketResponse.status}`, 'warning');
            }
        } catch (error) {
            this.log(`❌ Socket.IO endpoint failed: ${error.message}`, 'error');
        }
    }

    checkSocketIOLibrary() {
        this.log('📚 Checking Socket.IO library...', 'info');
        
        if (typeof io !== 'undefined') {
            this.log('✅ Socket.IO library loaded', 'success');
            this.log(`Socket.IO version: ${io.version || 'unknown'}`, 'info');
        } else {
            this.log('❌ Socket.IO library not loaded', 'error');
            return;
        }
        
        if (window.globalSocketManager) {
            this.log('✅ GlobalSocketManager available', 'success');
            
            const status = window.globalSocketManager.getStatus();
            this.log(`Connection status: ${JSON.stringify(status)}`, 'info');
            
            if (status.connected) {
                this.log('✅ Socket is connected', 'success');
            } else {
                this.log('❌ Socket is not connected', 'error');
            }
            
            if (status.authenticated) {
                this.log('✅ Socket is authenticated', 'success');
            } else {
                this.log('❌ Socket is not authenticated', 'error');
            }
        } else {
            this.log('❌ GlobalSocketManager not available', 'error');
        }
    }

    checkSecuritySettings() {
        this.log('🔒 Checking security settings...', 'info');
        
        const isHTTPS = window.location.protocol === 'https:';
        const socketSecure = document.querySelector('meta[name="socket-secure"]')?.content === 'true';
        
        this.log(`Page HTTPS: ${isHTTPS}`, isHTTPS ? 'success' : 'info');
        this.log(`Socket secure: ${socketSecure}`, socketSecure ? 'success' : 'info');
        
        if (isHTTPS && !socketSecure) {
            this.log('⚠️ WARNING: HTTPS page but socket not secure - will likely fail', 'warning');
        } else if (isHTTPS && socketSecure) {
            this.log('✅ HTTPS and secure socket configuration match', 'success');
        }
        
        try {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (cspMeta) {
                const cspContent = cspMeta.content;
                this.log(`CSP found: ${cspContent}`, 'info');
                
                if (cspContent.includes('connect-src')) {
                    const connectSrc = cspContent.match(/connect-src[^;]*/);
                    this.log(`Connect-src policy: ${connectSrc ? connectSrc[0] : 'not found'}`, 'info');
                    
                    if (cspContent.includes('wss:') || cspContent.includes('ws:')) {
                        this.log('✅ WebSocket protocols allowed in CSP', 'success');
                    } else {
                        this.log('❌ WebSocket protocols not allowed in CSP', 'error');
                    }
                }
            } else {
                this.log('ℹ️ No CSP meta tag found', 'info');
            }
        } catch (error) {
            this.log(`Error checking CSP: ${error.message}`, 'warning');
        }
    }

    checkDockerVPSConfiguration() {
        this.log('🐳 Checking Docker/VPS configuration...', 'info');
        
        const isDocker = document.querySelector('meta[name="is-docker"]')?.content === 'true';
        const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
        const hostname = window.location.hostname;
        
        this.log(`Is Docker: ${isDocker}`, 'info');
        this.log(`Is VPS: ${isVPS}`, 'info');
        this.log(`Hostname: ${hostname}`, 'info');
        
        if (isVPS && hostname === 'marvelcollin.my.id') {
            this.log('✅ VPS configuration matches hostname', 'success');
        } else if (!isVPS && hostname === 'localhost') {
            this.log('✅ Local configuration matches hostname', 'success');
        } else {
            this.log('⚠️ Configuration/hostname mismatch detected', 'warning');
        }
        
        if (isVPS && isDocker) {
            this.log('⚠️ WARNING: Both VPS and Docker flags are true - potential conflict', 'warning');
        }
    }

    generateReport() {
        this.log('📊 Generating diagnostic report...', 'info');
        
        const errors = this.results.filter(r => r.type === 'error');
        const warnings = this.results.filter(r => r.type === 'warning');
        const successes = this.results.filter(r => r.type === 'success');
        
        this.log(`Summary: ${successes.length} success, ${warnings.length} warnings, ${errors.length} errors`, 'info');
        
        if (errors.length > 0) {
            this.log('❌ Critical issues found:', 'error');
            errors.forEach(error => this.log(`  • ${error.message}`, 'error'));
        }
        
        if (warnings.length > 0) {
            this.log('⚠️ Warnings found:', 'warning');
            warnings.forEach(warning => this.log(`  • ${warning.message}`, 'warning'));
        }
        
        this.log('🎯 Recommended next steps:', 'info');
        
        if (errors.length > 0) {
            this.log('1. Fix critical errors first', 'info');
            this.log('2. Check environment configuration in .env file', 'info');
            this.log('3. Verify Docker/VPS mode settings', 'info');
        } else if (warnings.length > 0) {
            this.log('1. Address warnings for optimal performance', 'info');
            this.log('2. Test WebSocket connection manually', 'info');
        } else {
            this.log('✅ No major issues detected - try connecting!', 'success');
        }
    }
}

window.SocketDiagnostics = SocketDiagnostics;
window.runSocketDiagnostics = async function() {
    const diagnostics = new SocketDiagnostics();
    return await diagnostics.runFullDiagnostics();
};

console.log('🔧 Socket Diagnostics loaded! Run window.runSocketDiagnostics() to test.');
