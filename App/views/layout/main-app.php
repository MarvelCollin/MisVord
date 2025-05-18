<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en" class="h-full w-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php
    // Determine the appropriate socket server URL based on environment
    $socketServer = getenv('SOCKET_SERVER');
    $socketServerLocal = getenv('SOCKET_SERVER_LOCAL');
    $isLocalhost = (isset($_SERVER['SERVER_NAME']) && 
                   ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1'));
    
    // Enhanced debugging for socket server configuration
    error_log("--- WebRTC Socket Server Configuration ---");
    error_log("SOCKET_SERVER env: " . ($socketServer ?: 'not set'));
    error_log("SOCKET_SERVER_LOCAL env: " . ($socketServerLocal ?: 'not set'));
    error_log("SERVER_NAME: " . (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'not set'));
    error_log("isLocalhost detection: " . ($isLocalhost ? 'true' : 'false'));
    
    // Use local socket server if accessing from localhost, otherwise use container socket server
    $effectiveSocketServer = $isLocalhost ? $socketServerLocal : $socketServer;
    
    // Default fallback if neither is set
    if (empty($effectiveSocketServer)) {
        $effectiveSocketServer = $isLocalhost ? 'http://localhost:1002' : 'http://localhost:1002';
        error_log("WARNING: Using fallback socket server URL: " . $effectiveSocketServer);
    }
    
    error_log("FINAL Socket server URL: " . $effectiveSocketServer);
    
    // Additional debug: Check if socket server is reachable
    $socketServerStatus = "unknown";
    try {
        $socketServerHeaders = @get_headers($effectiveSocketServer);
        if ($socketServerHeaders && strpos($socketServerHeaders[0], '200') !== false) {
            $socketServerStatus = "reachable";
        } else {
            $socketServerStatus = "unreachable";
        }
    } catch (Exception $e) {
        $socketServerStatus = "error: " . $e->getMessage();
    }
    error_log("Socket server status: " . $socketServerStatus);
    
    // Add debug attribute to the meta tag
    echo '<meta name="socket-server-debug" content="ENV: ' . getenv('SOCKET_SERVER') . ', LOCAL: ' . getenv('SOCKET_SERVER_LOCAL') . ', IS_LOCALHOST: ' . ($isLocalhost ? 'true' : 'false') . ', STATUS: ' . $socketServerStatus . '">';
    ?>
    <!-- Socket server URL from environment variables -->
    <meta name="socket-server" content="<?php echo $effectiveSocketServer; ?>">
    <title><?php echo isset($page_title) ? $page_title : 'MiscVord - Your Place to Talk and Hang Out'; ?></title>    <!-- Favicon -->    <link rel="icon" href="<?php echo asset('landing-page/main-logo.png'); ?>" type="image/png">    <link rel="shortcut icon" href="<?php echo asset('landing-page/main-logo.png'); ?>" type="image/png">
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
    <!-- Socket.io client library -->
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'discord-blue': '#5865F2',
                        'discord-bg': '#404EED',
                        'discord-dark': '#23272A',
                        'discord-light': '#F6F6F6',
                        'discord-pink': '#EB459E',
                        'discord-green': '#57F287'
                    }
                }
            }
        }
    </script>
    
    <?php if (isset($page_css)): ?>
        <link rel="stylesheet" href="<?php echo css($page_css); ?>">
    <?php endif; ?>
    
    <?php if (isset($additional_head)): ?>
        <?php echo $additional_head; ?>
    <?php endif; ?>
    
    <style>
        /* Ensure full height and width */
        html, body {
            height: 100% !important;
            width: 100% !important;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }
        
        /* Landing page background */
        body.landing-bg {
            background-color: #5865F2;
            background-image: linear-gradient(180deg, #5865F2 0%, #404EED 100%);
            background-attachment: fixed;
            background-size: cover;
            min-height: 100vh;
        }
        
        /* Authentication page specific */
        body.authentication-page {
            height: 100% !important;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #202225;
            min-height: 100vh;
        }
        
        /* Main content container */
        .content-container {
            /* display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center; */
            min-height: 100vh;
            width: 100%;
        }

        /* Developer debug panel styles */
        #devDebugPanel {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(0, 0, 0, 0.85);
            color: #fff;
            z-index: 9999;
            font-family: monospace;
            font-size: 12px;
            max-height: 30vh;
            overflow-y: auto;
            padding: 10px;
            border-top: 2px solid #5865F2;
            transform: translateY(100%);
            transition: transform 0.3s ease-in-out;
        }
        
        #devDebugPanel.visible {
            transform: translateY(0);
        }
        
        #devDebugPanel .debug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        
        #devDebugPanel .debug-content {
            display: flex;
        }
        
        #devDebugPanel .debug-section {
            flex: 1;
            padding: 0 10px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        #devDebugPanel .debug-section:last-child {
            border-right: none;
        }
        
        #devDebugPanel h3 {
            font-size: 14px;
            margin-top: 0;
            margin-bottom: 5px;
            color: #5865F2;
        }
        
        #devDebugPanel pre {
            margin: 0;
            white-space: pre-wrap;
        }
        
        #devDebugPanel .debug-entry {
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        }
        
        #devDebugPanel .error {
            color: #ED4245;
        }
        
        #devDebugPanel .warning {
            color: #FAA61A;
        }
        
        #devDebugPanel .info {
            color: #57F287;
        }
        
        #devDebugToggle {
            position: fixed;
            bottom: 10px;
            left: 10px;
            width: 30px;
            height: 30px;
            background-color: #5865F2;
            color: white;
            border: none;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9998;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="<?php echo isset($body_class) ? $body_class : 'overflow-x-hidden text-white landing-bg'; ?>">
    <?php 
    // Check if this is the landing page or WebRTC page
    $isLandingPage = (isset($page_css) && $page_css === 'landing-page');
    $isWebRTCPage = (isset($page_title) && strpos($page_title, 'WebRTC') !== false) || 
                   (isset($page_title) && strpos($page_title, 'Video Chat') !== false);
    
    // Only show debug toggle if not on landing page or WebRTC page
    if (!$isLandingPage && !$isWebRTCPage): 
    ?>
    <!-- Developer Debug Toggle Button -->
    <button id="devDebugToggle" title="Toggle Debug Panel">D</button>
    
    <!-- Developer Debug Panel -->
    <div id="devDebugPanel">
        <div class="debug-header">
            <h2>MiscVord Developer Debug Panel</h2>
            <div>
                <button id="refreshDebugBtn" class="px-2 py-1 bg-discord-blue text-white text-xs rounded mr-2">Refresh</button>
                <button id="closeDevDebugBtn" class="px-2 py-1 bg-red-500 text-white text-xs rounded">Close</button>
            </div>
        </div>
        <div class="debug-content">
            <div class="debug-section">
                <h3>Session Data</h3>
                <div id="sessionDebug">
                    <?php if (!empty($_SESSION)): ?>
                        <pre><?php print_r($_SESSION); ?></pre>
                    <?php else: ?>
                        <span class="warning">No session data available</span>
                    <?php endif; ?>
                </div>
            </div>
            <div class="debug-section">
                <h3>Request Data</h3>
                <div id="requestDebug">
                    <div class="debug-entry">
                        <strong>URI:</strong> <?php echo $_SERVER['REQUEST_URI']; ?>
                    </div>
                    <div class="debug-entry">
                        <strong>Method:</strong> <?php echo $_SERVER['REQUEST_METHOD']; ?>
                    </div>
                    <div class="debug-entry">
                        <strong>GET:</strong>
                        <pre><?php print_r($_GET); ?></pre>
                    </div>
                    <div class="debug-entry">
                        <strong>POST:</strong>
                        <pre><?php print_r($_POST); ?></pre>
                    </div>
                </div>
            </div>
            <div class="debug-section">
                <h3>PHP Errors</h3>
                <div id="errorDebug">
                    <?php
                    // Display the most recent PHP errors
                    $error_log_path = ini_get('error_log');
                    if (file_exists($error_log_path) && is_readable($error_log_path)) {
                        $errors = file($error_log_path);
                        $errors = array_slice($errors, -10); // Get last 10 errors
                        echo '<pre class="error">';
                        foreach ($errors as $error) {
                            echo htmlspecialchars($error) . "\n";
                        }
                        echo '</pre>';
                    } else {
                        echo '<span class="info">No recent PHP errors or error log not accessible</span>';
                    }
                    ?>
                </div>
            </div>
            <div class="debug-section">
                <h3>Database</h3>
                <div id="dbDebug">
                    <?php
                    try {
                        require_once dirname(dirname(__DIR__)) . '/database/query.php';
                        $query = new Query();
                        $tables = $query->raw("SHOW TABLES");
                        echo "<div class='info'>Connected to database successfully</div>";
                        echo "<div class='debug-entry'><strong>Tables:</strong><pre>";
                        print_r($tables);
                        echo "</pre></div>";
                    } catch (Exception $e) {
                        echo "<div class='error'>Database Error: " . $e->getMessage() . "</div>";
                    }
                    ?>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>
    
    <!-- Main content container -->
    <div class="content-container">
        <!-- Content will be injected here -->
        <?php if (isset($content)): ?>
            <?php echo $content; ?>
        <?php endif; ?>
    </div>
    
    <?php if (!$isLandingPage && !$isWebRTCPage): ?>
    <!-- Hidden debug panel - only shown with "kowlin" keyword -->
    <div id="debugPanel" class="fixed bottom-0 right-0 p-4 bg-gray-900/90 text-white rounded-tl-lg border border-gray-700 transform translate-y-full transition-transform duration-300 ease-in-out z-50 max-w-md max-h-96 overflow-auto opacity-0 invisible" style="box-shadow: 0 -5px 15px rgba(0,0,0,0.3);">
        <h3 class="text-lg font-bold mb-2 flex justify-between items-center">
            <span>Debug Panel</span>
            <button id="closeDebugBtn" class="text-gray-400 hover:text-white">×</button>
        </h3>
        
        <!-- Debug content will appear here when "kowlin" is typed -->
        <?php if (isset($GLOBALS['debugInfo']) && !empty($GLOBALS['debugInfo'])): ?>
            <?php echo $GLOBALS['debugInfo']; ?>
        <?php endif; ?>
    </div>
    <?php endif; ?>
    
    <!-- Simple keyboard detection for "kowlin" -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        <?php if (!$isLandingPage && !$isWebRTCPage): ?>
        // Original kowlin debug panel code
        const keySequence = [];
        const debugPanel = document.getElementById('debugPanel');
        const closeDebugBtn = document.getElementById('closeDebugBtn');
        const targetWord = 'kowlin';
        
        // Close button
        if(closeDebugBtn) {
            closeDebugBtn.addEventListener('click', function() {
                debugPanel.classList.add('translate-y-full');
                setTimeout(() => {
                    debugPanel.classList.add('opacity-0', 'invisible');
                }, 300);
            });
        }
        
        // Keyboard detection
        document.addEventListener('keydown', function(e) {
            keySequence.push(e.key.toLowerCase());
            if (keySequence.length > targetWord.length) {
                keySequence.shift();
            }
            
            if (keySequence.join('') === targetWord) {
                debugPanel.classList.remove('opacity-0', 'invisible');
                setTimeout(() => {
                    debugPanel.classList.remove('translate-y-full');
                }, 50);
            }
        });

        // Developer Debug Panel functionality
        const devDebugPanel = document.getElementById('devDebugPanel');
        const devDebugToggle = document.getElementById('devDebugToggle');
        const closeDevDebugBtn = document.getElementById('closeDevDebugBtn');
        const refreshDebugBtn = document.getElementById('refreshDebugBtn');
        
        // Toggle developer debug panel
        if(devDebugToggle) {
            devDebugToggle.addEventListener('click', function() {
                devDebugPanel.classList.toggle('visible');
            });
        }
        
        // Close developer debug panel
        if(closeDevDebugBtn) {
            closeDevDebugBtn.addEventListener('click', function() {
                devDebugPanel.classList.remove('visible');
            });
        }
        
        // Refresh debug data
        if(refreshDebugBtn) {
            refreshDebugBtn.addEventListener('click', function() {
                // Fetch fresh debug data via AJAX
                fetch('/debug_api.php')
                    .then(response => response.json())
                    .then(data => {
                        // Update session debug info
                        const sessionDebug = document.getElementById('sessionDebug');
                        if(sessionDebug && data.session) {
                            sessionDebug.innerHTML = '<pre>' + JSON.stringify(data.session, null, 2) + '</pre>';
                        }
                        
                        // You could update other debug sections as needed
                        
                        // Show a temporary notification
                        const notification = document.createElement('div');
                        notification.textContent = 'Debug data refreshed';
                        notification.style.position = 'fixed';
                        notification.style.bottom = '50px';
                        notification.style.left = '10px';
                        notification.style.backgroundColor = '#57F287';
                        notification.style.color = 'white';
                        notification.style.padding = '5px 10px';
                        notification.style.borderRadius = '3px';
                        notification.style.zIndex = '10000';
                        document.body.appendChild(notification);
                        
                        setTimeout(() => {
                            notification.remove();
                        }, 2000);
                    })
                    .catch(error => {
                        console.error('Error refreshing debug data:', error);
                    });
            });
        }

        // Press 'Escape' key to close debug panels
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (devDebugPanel.classList.contains('visible')) {
                    devDebugPanel.classList.remove('visible');
                }
                
                if (!debugPanel.classList.contains('translate-y-full')) {
                    debugPanel.classList.add('translate-y-full');
                    setTimeout(() => {
                        debugPanel.classList.add('opacity-0', 'invisible');
                    }, 300);
                }
            }
        });
        <?php endif; ?>
    });
    </script>
    
    <?php if (isset($page_js)): ?>
        <script src="<?php echo js($page_js); ?>"></script>
    <?php endif; ?>
</body>
</html>