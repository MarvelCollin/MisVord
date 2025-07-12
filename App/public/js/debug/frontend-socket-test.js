console.log('🔧 [SOCKET-DEBUG] Starting frontend environment analysis...');

console.log('📍 Current page info:', {
    url: window.location.href,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port
});

console.log('🏷️ Meta tag analysis:');
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

Object.entries(metaTags).forEach(([key, value]) => {
    console.log(`   ${key}: ${value || 'NOT FOUND'}`);
});

if (metaTags['socket-host']) {
    const expectedUrl = metaTags['socket-port'] 
        ? `${metaTags['socket-secure'] === 'true' ? 'https' : 'http'}://${metaTags['socket-host']}:${metaTags['socket-port']}${metaTags['socket-base-path'] || '/socket.io'}`
        : `${metaTags['socket-secure'] === 'true' ? 'https' : 'http'}://${metaTags['socket-host']}${metaTags['socket-base-path'] || '/socket.io'}`;
    
    console.log('🎯 Expected Socket.IO URL:', expectedUrl);
    
    const wsUrl = expectedUrl.replace(/^http/, 'ws');
    console.log('🔌 Expected WebSocket URL:', wsUrl);
    
    console.log('🧪 Testing Socket.IO endpoint accessibility...');
    fetch(expectedUrl, { 
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
    })
    .then(response => {
        console.log(`✅ Socket.IO endpoint accessible: ${response.status} ${response.statusText}`);
        return response.text();
    })
    .then(text => {
        console.log('📄 Response preview:', text.substring(0, 100) + '...');
    })
    .catch(error => {
        console.error('❌ Socket.IO endpoint not accessible:', error.message);
        console.log('🔍 This indicates a server-side or network issue');
    });
}

if (window.globalSocketManager) {
    console.log('🎛️ GlobalSocketManager status:');
    const status = window.globalSocketManager.getStatus();
    console.log('   Status:', status);
    
    console.log('🔧 Socket configuration:');
    console.log('   Host:', window.globalSocketManager.socketHost);
    console.log('   Port:', window.globalSocketManager.socketPort);
    console.log('   Secure:', window.globalSocketManager.socketSecure);
    console.log('   Base Path:', window.globalSocketManager.socketBasePath);
    
    if (window.globalSocketManager.lastError) {
        console.log('❌ Last error:', window.globalSocketManager.lastError);
    }
} else {
    console.log('❌ GlobalSocketManager not available');
}

if (typeof io !== 'undefined') {
    console.log('✅ Socket.IO library loaded, version:', io.version || 'unknown');
} else {
    console.log('❌ Socket.IO library not loaded');
}

console.log('🏁 Frontend environment analysis complete');
