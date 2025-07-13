<?php
session_start();

if (!class_exists('EnvLoader')) {
    require_once __DIR__ . '/../../config/env.php';
}

// Simple authentication
$debug_password = 'kolin123';
$is_authenticated = isset($_SESSION['debug_authenticated']) && $_SESSION['debug_authenticated'] === true;

if (isset($_GET['logout'])) {
    unset($_SESSION['debug_authenticated']);
    header('Location: /debug');
    exit;
}

if (!$is_authenticated) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
        if ($_POST['password'] === $debug_password) {
            $_SESSION['debug_authenticated'] = true;
            header('Location: /debug');
            exit;
        } else {
            $error = 'Invalid password';
        }
    }
    
    // Show login form
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Socket Debug - Authentication</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div class="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 class="text-2xl font-bold mb-6 text-center">Socket Debug Access</h1>
            <?php if (isset($error)): ?>
                <div class="bg-red-600 text-white p-3 rounded mb-4"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Password:</label>
                    <input type="password" name="password" class="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none" required>
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Access Debug Panel
                </button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Get socket configuration
$socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
$socketPort = EnvLoader::get('SOCKET_PORT', '1002');
$socketSecure = EnvLoader::get('SOCKET_SECURE', 'false');
$socketBasePath = EnvLoader::get('SOCKET_BASE_PATH', '/socket.io');
$isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
$isDocker = EnvLoader::get('IS_DOCKER', 'false') === 'true';
$domain = EnvLoader::get('DOMAIN', 'localhost');
$useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';

// Test socket server health
function testSocketHealth($host, $port) {
    $url = "http://{$host}:{$port}/health";
    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'method' => 'GET'
        ]
    ]);
    
    $result = @file_get_contents($url, false, $context);
    if ($result !== false) {
        $data = json_decode($result, true);
        return [
            'status' => 'ok',
            'data' => $data,
            'response_time' => 'N/A'
        ];
    } else {
        return [
            'status' => 'error',
            'error' => 'Connection failed',
            'data' => null
        ];
    }
}

$socketHealth = testSocketHealth($isDocker ? 'socket' : 'localhost', $socketPort);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Socket Debug Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    
    <!-- Socket Meta Tags for Testing -->
    <?php
    // Use same logic as head.php
    $pageIsHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    $pageIsHttps = $pageIsHttps || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    
    if ($isVPS && $domain !== 'localhost') {
        $frontendSocketHost = $socketHost; // Fixed: use SOCKET_HOST instead of DOMAIN
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
<body class="bg-gray-900 text-white min-h-screen">
    <!-- Header -->
    <div class="bg-gray-800 shadow-lg border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div class="flex items-center">
                    <h1 class="text-3xl font-bold text-white">🔌 Socket Debug Dashboard</h1>
                    <span class="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded-full">SOCKET FOCUS</span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-300" id="current-time"><?php echo date('Y-m-d H:i:s'); ?></span>
                    <a href="/" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">Back to App</a>
                    <a href="/debug?logout=1" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">Logout</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Socket Configuration Overview -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-white">Socket Configuration Overview</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="text-sm font-semibold text-gray-300 mb-2">Environment</h3>
                    <div class="space-y-1 text-sm">
                        <div>VPS: <?php echo $isVPS ? '✅ Yes' : '❌ No'; ?></div>
                        <div>Docker: <?php echo $isDocker ? '✅ Yes' : '❌ No'; ?></div>
                        <div>HTTPS: <?php echo $useHttps ? '✅ Yes' : '❌ No'; ?></div>
                    </div>
                </div>
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="text-sm font-semibold text-gray-300 mb-2">Socket Server</h3>
                    <div class="space-y-1 text-sm">
                        <div>Host: <?php echo htmlspecialchars($socketHost); ?></div>
                        <div>Port: <?php echo htmlspecialchars($socketPort); ?></div>
                        <div>Secure: <?php echo $socketSecure === 'true' ? '✅ Yes' : '❌ No'; ?></div>
                    </div>
                </div>
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="text-sm font-semibold text-gray-300 mb-2">Frontend Config</h3>
                    <div class="space-y-1 text-sm">
                        <div>Current Host: <?php echo htmlspecialchars($_SERVER['HTTP_HOST'] ?? 'N/A'); ?></div>
                        <div>Domain: <?php echo htmlspecialchars($domain); ?></div>
                        <div>Frontend Host: <?php echo htmlspecialchars($frontendSocketHost); ?></div>
                    </div>
                </div>
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="text-sm font-semibold text-gray-300 mb-2">Server Status</h3>
                    <div class="space-y-1 text-sm">
                        <div class="flex items-center">
                            <div class="w-3 h-3 <?php echo $socketHealth['status'] === 'ok' ? 'bg-green-500' : 'bg-red-500'; ?> rounded-full mr-2"></div>
                            <span><?php echo $socketHealth['status'] === 'ok' ? 'Healthy' : 'Error'; ?></span>
                        </div>
                        <?php if ($socketHealth['status'] === 'ok' && isset($socketHealth['data']['connectedClients'])): ?>
                        <div>Clients: <?php echo $socketHealth['data']['connectedClients']; ?></div>
                        <div>Uptime: <?php echo round($socketHealth['data']['uptime']); ?>s</div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Socket Testing Panel -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-white">Socket Connection Testing</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <button onclick="testPrimarySocket()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                    🔍 Test Primary Socket
                </button>
                <button onclick="testFallbackHosts()" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white">
                    🔄 Test Fallback Hosts
                </button>
                <button onclick="testFullSystem()" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
                    ⚡ Full System Test
                </button>
                <button onclick="clearResults()" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                    🗑️ Clear Results
                </button>
            </div>

            <div id="socket-test-results" class="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                <div class="text-green-400">[SYSTEM] Socket debug panel ready...</div>
                <div class="text-gray-400">[INFO] Click any test button to begin socket diagnostics</div>
            </div>
        </div>

        <!-- Frontend Socket Diagnostics -->
        <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-2xl font-bold mb-4 text-white">Frontend Socket Diagnostics</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="text-lg font-semibold mb-3 text-blue-400">Meta Tag Configuration</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-300">Host:</span>
                            <span id="meta-socket-host" class="text-white font-mono">Loading...</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-300">Port:</span>
                            <span id="meta-socket-port" class="text-white font-mono">Loading...</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-300">Secure:</span>
                            <span id="meta-socket-secure" class="text-white font-mono">Loading...</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-300">Path:</span>
                            <span id="meta-socket-path" class="text-white font-mono">Loading...</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="text-lg font-semibold mb-3 text-green-400">Connection Status</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-300">Status:</span>
                            <span id="frontend-status" class="px-2 py-1 rounded text-xs">
                                <i class="fas fa-circle text-gray-400 mr-1"></i>Unknown
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-300">Final URL:</span>
                            <span id="frontend-url" class="text-white font-mono text-xs break-all">N/A</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-300">Last Error:</span>
                            <span id="frontend-error" class="text-red-400 font-mono text-xs">None</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-300">Attempts:</span>
                            <span id="frontend-attempts" class="text-white font-mono">0</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <button onclick="testFrontendConfig()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                    🔍 Test Frontend Config
                </button>
                <button onclick="simulateConnection()" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
                    🔌 Simulate Connection
                </button>
                <button onclick="diagnoseErrors()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
                    🚨 Diagnose Errors
                </button>
            </div>

            <div id="frontend-diagnostics-results" class="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                <div class="text-blue-400">[FRONTEND] Diagnostics panel ready...</div>
                <div class="text-gray-400">[INFO] Click any test button to begin frontend analysis</div>
            </div>
        </div>
    </div>

    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script>
        // Socket Testing Functions
        function testPrimarySocket() {
            log('🔍 Testing primary socket connection...');
            
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content;
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content;
            const metaSecure = document.querySelector('meta[name="socket-secure"]')?.content;
            const metaPath = document.querySelector('meta[name="socket-base-path"]')?.content;
            const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
            
            let finalSecure = metaSecure === 'true';
            if (window.location.protocol === 'https:' || isVPS) {
                finalSecure = true;
            }
            
            const protocol = finalSecure ? 'wss://' : 'ws://';
            const portPart = metaPort ? `:${metaPort}` : '';
            const socketUrl = `${protocol}${metaHost}${portPart}${metaPath}`;
            
            log(`🔗 Connecting to: ${socketUrl}`);
            
            try {
                const socket = io(socketUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    forceNew: true
                });
                
                const startTime = Date.now();
                
                socket.on('connect', () => {
                    const connectTime = Date.now() - startTime;
                    log(`✅ Primary socket connected successfully in ${connectTime}ms`);
                    log(`📊 Transport: ${socket.io.engine.transport.name}`);
                    socket.disconnect();
                });
                
                socket.on('connect_error', (error) => {
                    log(`❌ Primary socket connection failed: ${error.message}`);
                    log(`🔍 Error type: ${error.type || 'unknown'}`);
                });
                
                setTimeout(() => {
                    if (!socket.connected) {
                        log(`⏰ Primary socket connection timeout (10s)`);
                        socket.disconnect();
                    }
                }, 10000);
                
            } catch (error) {
                log(`💥 Exception: ${error.message}`);
            }
        }

        function testFallbackHosts() {
            log('🔄 Testing fallback socket hosts...');
            
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content;
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content;
            const metaSecure = document.querySelector('meta[name="socket-secure"]')?.content;
            const metaPath = document.querySelector('meta[name="socket-base-path"]')?.content;
            const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
            
            let hosts = [metaHost];
            
            // Add fallback hosts
            if (metaHost && metaHost.startsWith('www.')) {
                hosts.push(metaHost.replace('www.', ''));
            } else if (metaHost && !metaHost.includes('localhost')) {
                hosts.push('www.' + metaHost);
            }
            
            log(`📋 Testing ${hosts.length} host(s): ${hosts.join(', ')}`);
            
            hosts.forEach((host, index) => {
                setTimeout(() => {
                    let finalSecure = metaSecure === 'true';
                    if (window.location.protocol === 'https:' || isVPS) {
                        finalSecure = true;
                    }
                    
                    const protocol = finalSecure ? 'wss://' : 'ws://';
                    const portPart = metaPort ? `:${metaPort}` : '';
                    const socketUrl = `${protocol}${host}${portPart}${metaPath}`;
                    
                    log(`🔍 [${index + 1}] Testing: ${socketUrl}`);
                    
                    try {
                        const socket = io(socketUrl, {
                            transports: ['websocket', 'polling'],
                            timeout: 8000,
                            forceNew: true
                        });
                        
                        socket.on('connect', () => {
                            log(`✅ [${index + 1}] Connected to ${host}`);
                            socket.disconnect();
                        });
                        
                        socket.on('connect_error', (error) => {
                            log(`❌ [${index + 1}] Failed: ${error.message}`);
                        });
                        
                        setTimeout(() => {
                            if (!socket.connected) {
                                log(`⏰ [${index + 1}] Timeout`);
                                socket.disconnect();
                            }
                        }, 8000);
                        
                    } catch (error) {
                        log(`💥 [${index + 1}] Exception: ${error.message}`);
                    }
                }, index * 2000);
            });
        }

        function testFullSystem() {
            log('⚡ Running full system test...');
            testPrimarySocket();
            setTimeout(() => testFallbackHosts(), 3000);
        }

        function testFrontendConfig() {
            logFrontend('🔍 Testing frontend socket configuration...');
            updateMetaDisplay();
            
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content;
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content;
            const metaSecure = document.querySelector('meta[name="socket-secure"]')?.content;
            const metaPath = document.querySelector('meta[name="socket-base-path"]')?.content;
            const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
            const isDocker = document.querySelector('meta[name="is-docker"]')?.content === 'true';
            
            logFrontend(`[CONFIG] Meta host: ${metaHost || 'undefined'}`);
            logFrontend(`[CONFIG] Meta port: ${metaPort || 'undefined'}`);
            logFrontend(`[CONFIG] Meta secure: ${metaSecure || 'undefined'}`);
            logFrontend(`[CONFIG] Meta path: ${metaPath || 'undefined'}`);
            logFrontend(`[CONFIG] Is VPS: ${isVPS}`);
            logFrontend(`[CONFIG] Is Docker: ${isDocker}`);
            logFrontend(`[CONFIG] Current page protocol: ${window.location.protocol}`);
            logFrontend(`[CONFIG] Current page host: ${window.location.host}`);
            
            let finalSecure = metaSecure === 'true';
            if (window.location.protocol === 'https:' || isVPS) {
                finalSecure = true;
                logFrontend(`[AUTO] Forcing secure connection due to HTTPS/VPS`);
            }
            
            const protocol = finalSecure ? 'wss://' : 'ws://';
            const portPart = metaPort ? `:${metaPort}` : '';
            const finalUrl = `${protocol}${metaHost}${portPart}${metaPath}`;
            
            logFrontend(`[RESULT] Final socket URL: ${finalUrl}`);
            
            document.getElementById('frontend-url').textContent = finalUrl;
            document.getElementById('frontend-status').innerHTML = '<i class="fas fa-circle text-yellow-400 mr-1"></i>Configured';
        }

        function simulateConnection() {
            logFrontend('🔌 Simulating socket.io connection...');
            updateMetaDisplay();
            
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content;
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content;
            const metaSecure = document.querySelector('meta[name="socket-secure"]')?.content;
            const metaPath = document.querySelector('meta[name="socket-base-path"]')?.content;
            const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
            
            if (!metaHost) {
                logFrontend(`[ERROR] No socket host found in meta tags!`);
                document.getElementById('frontend-error').textContent = 'Missing meta tags';
                return;
            }
            
            let finalSecure = metaSecure === 'true';
            if (window.location.protocol === 'https:' || isVPS) {
                finalSecure = true;
            }
            
            const protocol = finalSecure ? 'wss://' : 'ws://';
            const portPart = metaPort ? `:${metaPort}` : '';
            const socketUrl = `${protocol}${metaHost}${portPart}${metaPath}`;
            
            logFrontend(`[CONNECT] Attempting connection to: ${socketUrl}`);
            document.getElementById('frontend-url').textContent = socketUrl;
            document.getElementById('frontend-attempts').textContent = '1';
            
            try {
                const socket = io(socketUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 8000,
                    forceNew: true
                });
                
                const startTime = Date.now();
                
                socket.on('connect', () => {
                    const connectTime = Date.now() - startTime;
                    logFrontend(`[SUCCESS] ✅ Connected in ${connectTime}ms`);
                    logFrontend(`[INFO] Transport: ${socket.io.engine.transport.name}`);
                    document.getElementById('frontend-status').innerHTML = '<i class="fas fa-circle text-green-400 mr-1"></i>Connected';
                    document.getElementById('frontend-error').textContent = 'None';
                    socket.disconnect();
                });
                
                socket.on('connect_error', (error) => {
                    logFrontend(`[ERROR] ❌ Connection failed: ${error.message}`);
                    document.getElementById('frontend-error').textContent = error.message;
                    document.getElementById('frontend-status').innerHTML = '<i class="fas fa-circle text-red-400 mr-1"></i>Error';
                });
                
                setTimeout(() => {
                    if (!socket.connected) {
                        logFrontend(`[TIMEOUT] Connection timeout after 8 seconds`);
                        socket.disconnect();
                    }
                }, 8000);
                
            } catch (error) {
                logFrontend(`[EXCEPTION] ${error.message}`);
                document.getElementById('frontend-error').textContent = error.message;
            }
        }

        function diagnoseErrors() {
            logFrontend('🚨 Diagnosing connection issues...');
            
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content;
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content;
            const isVPS = document.querySelector('meta[name="is-vps"]')?.content === 'true';
            
            logFrontend(`[DIAGNOSIS] Starting comprehensive error analysis...`);
            
            if (!metaHost) {
                logFrontend(`[CRITICAL] ❌ Missing socket-host meta tag`);
            } else {
                logFrontend(`[OK] ✅ Socket host meta tag found: ${metaHost}`);
            }
            
            const pageHttps = window.location.protocol === 'https:';
            const currentHost = window.location.hostname;
            
            if (metaHost && metaHost !== currentHost && !metaHost.includes(currentHost) && !currentHost.includes(metaHost.replace('www.', ''))) {
                logFrontend(`[WARNING] ⚠️ Socket host (${metaHost}) differs from page host (${currentHost})`);
            }
            
            if (metaPort && isVPS) {
                logFrontend(`[WARNING] ⚠️ VPS mode with explicit port - may cause issues`);
            }
            
            logFrontend(`[RECOMMENDATIONS] Suggested fixes:`);
            
            if (isVPS && metaPort) {
                logFrontend(`[REC] 1. For VPS, try removing socket port from URL`);
            }
            
            if (pageHttps) {
                logFrontend(`[REC] 2. Ensure SOCKET_SECURE=true for HTTPS pages`);
            }
            
            if (metaHost && metaHost.startsWith('www.') && !currentHost.startsWith('www.')) {
                logFrontend(`[REC] 3. Check www vs non-www host consistency`);
            }
            
            logFrontend(`[REC] 4. Verify socket server is running on correct port`);
            logFrontend(`[REC] 5. Check nginx proxy configuration`);
        }

        function updateMetaDisplay() {
            const metaHost = document.querySelector('meta[name="socket-host"]')?.content || 'N/A';
            const metaPort = document.querySelector('meta[name="socket-port"]')?.content || 'N/A';
            const metaSecure = document.querySelector('meta[name="socket-secure"]')?.content || 'N/A';
            const metaPath = document.querySelector('meta[name="socket-base-path"]')?.content || 'N/A';
            
            document.getElementById('meta-socket-host').textContent = metaHost;
            document.getElementById('meta-socket-port').textContent = metaPort;
            document.getElementById('meta-socket-secure').textContent = metaSecure;
            document.getElementById('meta-socket-path').textContent = metaPath;
        }

        function clearResults() {
            document.getElementById('socket-test-results').innerHTML = '<div class="text-gray-500">Results cleared. Click a test button to start testing.</div>';
        }

        function log(message) {
            const div = document.getElementById('socket-test-results');
            const timestamp = new Date().toLocaleTimeString();
            div.innerHTML += `<div class="text-gray-300">[${timestamp}] ${message}</div>`;
            div.scrollTop = div.scrollHeight;
        }

        function logFrontend(message) {
            const div = document.getElementById('frontend-diagnostics-results');
            const timestamp = new Date().toLocaleTimeString();
            div.innerHTML += `<div class="text-gray-300">[${timestamp}] ${message}</div>`;
            div.scrollTop = div.scrollHeight;
        }

        function updateCurrentTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleString();
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            setInterval(updateCurrentTime, 1000);
            updateMetaDisplay();
        });
    </script>
</body>
</html>
