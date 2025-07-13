<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Socket Connection Test</title>
    <?php
    if (!class_exists('EnvLoader')) {
        require_once __DIR__ . '/config/env.php';
    }
    
    
    $socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
    $socketPort = EnvLoader::get('SOCKET_PORT', '1002');
    $socketSecure = EnvLoader::get('SOCKET_SECURE', 'false');
    $socketBasePath = EnvLoader::get('SOCKET_BASE_PATH', '/socket.io');
    $isDocker = EnvLoader::get('IS_DOCKER', 'false') === 'true';
    
    $currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    $useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';
    $vpsHost = EnvLoader::get('DOMAIN', 'localhost');
    
    $pageIsHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    $pageIsHttps = $pageIsHttps || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    $pageIsHttps = $pageIsHttps || (isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https');
    
    if ($isVPS && $vpsHost !== 'localhost') {
        $frontendSocketHost = $vpsHost;
        $frontendSocketPort = '';
        $frontendSocketSecure = 'true';
    } elseif ($isDocker) {
        $frontendSocketHost = 'localhost';
        $frontendSocketPort = $socketPort;
        $frontendSocketSecure = $pageIsHttps ? 'true' : 'false';
    } else {
        $frontendSocketHost = 'localhost';
        $frontendSocketPort = $socketPort;
        $frontendSocketSecure = $pageIsHttps ? 'true' : 'false';
    }
    ?>
    <meta name="socket-host" content="<?php echo htmlspecialchars($frontendSocketHost); ?>">
    <meta name="socket-port" content="<?php echo htmlspecialchars($frontendSocketPort); ?>">
    <meta name="socket-secure" content="<?php echo htmlspecialchars($frontendSocketSecure); ?>">
    <meta name="socket-base-path" content="<?php echo htmlspecialchars($socketBasePath); ?>">
    <meta name="is-docker" content="<?php echo $isDocker ? 'true' : 'false'; ?>">
    <meta name="is-vps" content="<?php echo $isVPS ? 'true' : 'false'; ?>">
</head>
<body>
    <h1>Socket Connection Test</h1>
    
    <div style="font-family: monospace; margin: 20px; padding: 20px; background: #f0f0f0;">
        <h2>Environment Information:</h2>
        <p><strong>Current Host:</strong> <?php echo htmlspecialchars($currentHost); ?></p>
        <p><strong>Socket Host (env):</strong> <?php echo htmlspecialchars($socketHost); ?></p>
        <p><strong>Socket Port (env):</strong> <?php echo htmlspecialchars($socketPort); ?></p>
        <p><strong>Is VPS:</strong> <?php echo $isVPS ? 'true' : 'false'; ?></p>
        <p><strong>Is Docker:</strong> <?php echo $isDocker ? 'true' : 'false'; ?></p>
        <p><strong>VPS Domain:</strong> <?php echo htmlspecialchars($vpsHost); ?></p>
        <p><strong>Page HTTPS:</strong> <?php echo $pageIsHttps ? 'true' : 'false'; ?></p>
        
        <h2>Frontend Configuration:</h2>
        <p><strong>Frontend Host:</strong> <?php echo htmlspecialchars($frontendSocketHost); ?></p>
        <p><strong>Frontend Port:</strong> <?php echo htmlspecialchars($frontendSocketPort); ?></p>
        <p><strong>Frontend Secure:</strong> <?php echo htmlspecialchars($frontendSocketSecure); ?></p>
    </div>
    
    <div id="test-results" style="font-family: monospace; margin: 20px; padding: 20px; background: #000; color: #fff; height: 300px; overflow-y: auto;"></div>
    
    <button onclick="testSocketConnection()">Test Socket Connection</button>
    <button onclick="clearResults()">Clear Results</button>
    
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script>
        function log(message) {
            const div = document.getElementById('test-results');
            const timestamp = new Date().toLocaleTimeString();
            div.innerHTML += `[${timestamp}] ${message}\n`;
            div.scrollTop = div.scrollHeight;
        }
        
        function clearResults() {
            document.getElementById('test-results').innerHTML = '';
        }
        
        function testSocketConnection() {
            clearResults();
            log('Starting socket connection test...');
            
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content;
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content;
            const metaSecure = document.querySelector('meta[name="socket-secure"]')?.content;
            const metaPath = document.querySelector('meta[name="socket-base-path"]')?.content;
            const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
            
            log(`Meta host: ${metaHost}`);
            log(`Meta port: ${metaPort}`);
            log(`Meta secure: ${metaSecure}`);
            log(`Meta path: ${metaPath}`);
            log(`Is VPS: ${isVPS}`);
            log(`Page protocol: ${window.location.protocol}`);
            
            let finalSecure = metaSecure === 'true';
            if (window.location.protocol === 'https:' || isVPS) {
                finalSecure = true;
                log('Forcing secure connection due to HTTPS/VPS');
            }
            
            const protocol = finalSecure ? 'wss://' : 'ws://';
            const portPart = metaPort ? `:${metaPort}` : '';
            const socketUrl = `${protocol}${metaHost}${portPart}${metaPath}`;
            
            log(`Final socket URL: ${socketUrl}`);
            
            try {
                const socket = io(socketUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    forceNew: true
                });
                
                socket.on('connect', () => {
                    log('✅ Socket connected successfully!');
                    log(`Transport: ${socket.io.engine.transport.name}`);
                    socket.disconnect();
                });
                
                socket.on('connect_error', (error) => {
                    log(`❌ Connection error: ${error.message}`);
                    log(`Error type: ${error.type}`);
                    log(`Error context: ${JSON.stringify(error.context || {})}`);
                    
                    
                    let fallbackHost = metaHost;
                    if (metaHost && metaHost.startsWith('www.')) {
                        fallbackHost = metaHost.replace('www.', '');
                    } else if (metaHost && !metaHost.includes('localhost')) {
                        fallbackHost = 'www.' + metaHost;
                    }
                    
                    if (fallbackHost !== metaHost) {
                        log(`Trying fallback host: ${fallbackHost}`);
                        const fallbackUrl = `${protocol}${fallbackHost}${portPart}${metaPath}`;
                        log(`Fallback URL: ${fallbackUrl}`);
                        
                        const fallbackSocket = io(fallbackUrl, {
                            transports: ['websocket', 'polling'],
                            timeout: 10000,
                            forceNew: true
                        });
                        
                        fallbackSocket.on('connect', () => {
                            log('✅ Fallback socket connected successfully!');
                            fallbackSocket.disconnect();
                        });
                        
                        fallbackSocket.on('connect_error', (fallbackError) => {
                            log(`❌ Fallback connection also failed: ${fallbackError.message}`);
                        });
                    }
                });
                
                setTimeout(() => {
                    if (!socket.connected) {
                        log('⏰ Connection timeout after 10 seconds');
                        socket.disconnect();
                    }
                }, 10000);
                
            } catch (error) {
                log(`Exception: ${error.message}`);
            }
        }
        
        
        window.addEventListener('load', () => {
            setTimeout(testSocketConnection, 1000);
        });
    </script>
</body>
</html>
