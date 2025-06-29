<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Online Status Test</title>
    <meta name="user-id" content="<?php echo $_SESSION['user_id']; ?>">
    <meta name="username" content="<?php echo $_SESSION['username']; ?>">
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #2c2f36; color: white; }
        .log { background: #1e2124; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
        .online { color: #43b581; }
        .offline { color: #f04747; }
        .info { color: #7289da; }
        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .connect { background: #43b581; color: white; }
        .disconnect { background: #f04747; color: white; }
        .test { background: #7289da; color: white; }
    </style>
</head>
<body>
    <h1>🔌 Socket Online Status Test</h1>
    <p>User: <strong><?php echo $_SESSION['username']; ?></strong> (ID: <?php echo $_SESSION['user_id']; ?>)</p>
    
    <div>
        <button class="connect" onclick="connectSocket()">Connect Socket</button>
        <button class="disconnect" onclick="disconnectSocket()">Disconnect Socket</button>
        <button class="test" onclick="testOnlineUsers()">Test Get Online Users</button>
        <button class="test" onclick="clearLog()">Clear Log</button>
    </div>
    
    <div id="status">Status: <span id="connectionStatus">Disconnected</span></div>
    
    <h3>📋 Event Log:</h3>
    <div id="eventLog"></div>

    <script>
        let socket = null;
        let userId = '<?php echo $_SESSION['user_id']; ?>';
        let username = '<?php echo $_SESSION['username']; ?>';
        
        function log(message, type = 'info') {
            const logDiv = document.getElementById('eventLog');
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log ${type}`;
            logEntry.innerHTML = `[${timestamp}] ${message}`;
            logDiv.appendChild(logEntry);
            logDiv.scrollTop = logDiv.scrollHeight;
            console.log(message);
        }
        
        function updateStatus(status) {
            document.getElementById('connectionStatus').textContent = status;
        }
        
        function connectSocket() {
            if (socket) {
                log('Socket already connected', 'info');
                return;
            }
            
            log('🔌 Connecting to socket server...', 'info');
            socket = io('http://localhost:1002');
            
            socket.on('connect', () => {
                updateStatus('Connected');
                log(`✅ Socket connected with ID: ${socket.id}`, 'online');
                
                log('🔐 Sending authentication...', 'info');
                socket.emit('authenticate', {
                    user_id: userId,
                    username: username,
                    session_id: 'test-session',
                    avatar_url: '/public/assets/common/default-profile-picture.png'
                });
            });
            
            socket.on('auth-success', (data) => {
                log(`🔐 Authentication successful: ${JSON.stringify(data)}`, 'online');
            });
            
            socket.on('auth-error', (data) => {
                log(`❌ Authentication failed: ${JSON.stringify(data)}`, 'offline');
            });
            
            socket.on('user-online', (data) => {
                log(`👥 User came online: ${data.username} (ID: ${data.user_id})`, 'online');
            });
            
            socket.on('user-offline', (data) => {
                log(`👥 User went offline: ${data.username} (ID: ${data.user_id})`, 'offline');
            });
            
            socket.on('user-presence-update', (data) => {
                log(`👤 User presence update: ${data.username} - ${data.status}`, 'info');
            });
            
            socket.on('online-users-response', (data) => {
                log(`📊 Online users response: ${JSON.stringify(data, null, 2)}`, 'info');
            });
            
            socket.on('disconnect', () => {
                updateStatus('Disconnected');
                log('❌ Socket disconnected', 'offline');
            });
            
            socket.on('connect_error', (error) => {
                log(`❌ Connection error: ${error.message}`, 'offline');
            });
        }
        
        function disconnectSocket() {
            if (socket) {
                log('🔌 Disconnecting socket...', 'info');
                socket.disconnect();
                socket = null;
                updateStatus('Disconnected');
            }
        }
        
        function testOnlineUsers() {
            if (!socket) {
                log('❌ Socket not connected', 'offline');
                return;
            }
            
            log('📊 Requesting online users...', 'info');
            socket.emit('get-online-users');
        }
        
        function clearLog() {
            document.getElementById('eventLog').innerHTML = '';
        }
        
        // Auto-connect on page load
        setTimeout(connectSocket, 1000);
    </script>
</body>
</html> 