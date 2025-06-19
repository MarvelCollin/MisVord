window.SocketStatus = {
    getFullStatus() {
        return {
            timestamp: new Date().toISOString(),
            
            globalSocketManager: {
                available: !!window.globalSocketManager,
                ready: window.globalSocketManager ? window.globalSocketManager.isReady() : false,
                status: window.globalSocketManager ? window.globalSocketManager.getStatus() : null
            },
            
            misVordMessaging: {
                available: !!window.MisVordMessaging,
                initialized: window.MisVordMessaging ? window.MisVordMessaging.initialized : false,
                connected: window.MisVordMessaging ? window.MisVordMessaging.connected : false,
                authenticated: window.MisVordMessaging ? window.MisVordMessaging.authenticated : false
            },
            
            socketIO: {
                available: typeof io !== 'undefined',
                version: typeof io !== 'undefined' && io.version ? io.version : 'unknown'
            },
            
            page: {
                url: window.location.href,
                pathname: window.location.pathname,
                userAuthenticated: document.querySelector('meta[name="user-authenticated"]')?.content === 'true',
                userId: document.querySelector('meta[name="user-id"]')?.content || null,
                username: document.querySelector('meta[name="username"]')?.content || null
            },
            
            debug: {
                misVordDebug: !!window.MisVordDebug,
                debugInfo: window.MisVordDebug ? window.MisVordDebug.getDebugInfo() : null,
                errors: window.MisVordDebug ? window.MisVordDebug.errors.slice(-3) : [],
                recentLogs: window.MisVordDebug ? window.MisVordDebug.logs.slice(-5) : []
            }
        };
    },
    
    getSimpleStatus() {
        const full = this.getFullStatus();
        return {
            globalSocketReady: full.globalSocketManager.ready,
            messagingReady: full.misVordMessaging.initialized && full.misVordMessaging.connected,
            userAuthenticated: full.page.userAuthenticated,
            socketIOAvailable: full.socketIO.available,
            overallStatus: this.getOverallStatus(full)
        };
    },
    
    getOverallStatus(fullStatus) {
        if (!fullStatus.page.userAuthenticated) {
            return 'guest';
        }
        
        if (!fullStatus.socketIO.available) {
            return 'no-socket-io';
        }
        
        if (fullStatus.globalSocketManager.ready && fullStatus.misVordMessaging.connected) {
            return 'fully-operational';
        }
        
        if (fullStatus.globalSocketManager.available) {
            return 'global-socket-available';
        }
        
        return 'initializing';
    },
    
    startMonitoring(intervalMs = 5000) {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        let lastStatus = null;
        
        this.monitoringInterval = setInterval(() => {
            const currentStatus = this.getSimpleStatus();
            
            if (!lastStatus || JSON.stringify(currentStatus) !== JSON.stringify(lastStatus)) {
                console.log('🔄 Socket Status Change:', currentStatus);
                
                window.dispatchEvent(new CustomEvent('socketStatusChanged', {
                    detail: { previous: lastStatus, current: currentStatus }
                }));
                
                lastStatus = { ...currentStatus };
            }
        }, intervalMs);
        
        console.log('🔍 Socket status monitoring started (interval: ' + intervalMs + 'ms)');
        return this.monitoringInterval;
    },
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Socket status monitoring stopped');
        }
    },
    
    printStatus() {
        const status = this.getFullStatus();
        console.group('🌐 MisVord Socket Status Report');
        console.log('📊 Overall Status:', this.getOverallStatus(status));
        console.log('👤 User:', status.page.userAuthenticated ? `${status.page.username} (${status.page.userId})` : 'Guest');
        console.log('🔌 Global Socket Manager:', status.globalSocketManager.ready ? '✅ Ready' : '❌ Not Ready');
        console.log('💬 Messaging System:', status.misVordMessaging.connected ? '✅ Connected' : '❌ Not Connected');
        console.log('🔧 Socket.IO:', status.socketIO.available ? `✅ Available (${status.socketIO.version})` : '❌ Not Available');
        
        if (status.debug.errors.length > 0) {
            console.warn('⚠️ Recent Errors:', status.debug.errors);
        }
        
        console.groupEnd();
        
        return status;
    }
};

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🔍 Auto-starting socket status monitoring for development...');
            window.SocketStatus.startMonitoring(3000);
            
            setTimeout(() => {
                window.SocketStatus.printStatus();
            }, 2000);
        }, 1000);
    });
}

if (typeof window !== 'undefined') {
    window.checkSockets = () => window.SocketStatus.printStatus();
}
