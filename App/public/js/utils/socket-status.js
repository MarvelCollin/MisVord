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
        
        console.log('Socket Status Monitoring started');
    },
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Socket status monitoring stopped');
        }
    },
    
    displayStatus() {
        const status = this.getFullStatus();
        console.group('=== COMPLETE SOCKET STATUS ===');
        console.log('Timestamp:', status.timestamp);
        console.log('Overall Status:', this.getOverallStatus(status));
        
        console.group('Global Socket Manager:');
        console.log('Available:', status.globalSocketManager.available);
        console.log('Ready:', status.globalSocketManager.ready);
        if (status.globalSocketManager.status) {
            console.log('Details:', status.globalSocketManager.status);
        }
        console.groupEnd();
        
        console.group('MisVord Messaging:');
        console.log('Available:', status.misVordMessaging.available);
        console.log('Initialized:', status.misVordMessaging.initialized);
        console.log('Connected:', status.misVordMessaging.connected);
        console.log('Authenticated:', status.misVordMessaging.authenticated);
        if (window.MisVordMessaging && window.MisVordMessaging.debugConnection) {
            console.log('Debug Info:', window.MisVordMessaging.debugConnection());
        }
        console.groupEnd();
        
        console.group('Socket.IO:');
        console.log('Available:', status.socketIO.available);
        console.log('Version:', status.socketIO.version);
        console.groupEnd();
        
        console.group('Page Info:');
        console.log('URL:', status.page.url);
        console.log('User Auth:', status.page.userAuthenticated);
        console.log('User ID:', status.page.userId);
        console.log('Username:', status.page.username);
        console.groupEnd();
        
        if (status.debug.errors.length > 0) {
            console.group('Recent Errors:');
            status.debug.errors.forEach(error => {
                console.error(error);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
        return status;
    },
    
    printStatus() {
        this.displayStatus();
    },
    
    testMessaging() {
        console.log('🧪 Testing messaging system...');
        
        if (!window.MisVordMessaging) {
            console.error('❌ MisVordMessaging not available');
            return false;
        }
        
        if (!window.MisVordMessaging.debugConnection) {
            console.error('❌ MisVordMessaging.debugConnection not available');
            return false;
        }
        
        const debug = window.MisVordMessaging.debugConnection();
        console.log('🔍 Messaging Debug Info:', debug);
        
        if (window.MisVordMessaging.forceReconnect) {
            console.log('🔄 Forcing reconnection...');
            window.MisVordMessaging.forceReconnect();
        }
        
        return true;
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
        
        // Listen for messaging system ready event
        window.addEventListener('messagingSystemReady', (event) => {
            console.log('✅ Messaging system connected!', event.detail);
            window.SocketStatus.printStatus();
        });
    });
}

if (typeof window !== 'undefined') {
    window.checkSockets = () => window.SocketStatus.printStatus();
}

// Auto-start monitoring when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.SocketStatus) {
            window.SocketStatus.startMonitoring(3000);
            console.log('📊 Socket status:', window.SocketStatus.getSimpleStatus());
        }
    }, 2000);
});

// Global shortcuts for debugging
window.ss = () => window.SocketStatus.displayStatus();
window.tm = () => window.SocketStatus.testMessaging();
