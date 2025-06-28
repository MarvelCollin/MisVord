<?php
require_once dirname(__DIR__) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(__DIR__) . '/config/helpers.php';
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

$userId = $_SESSION['user_id'];
$username = $_SESSION['username'] ?? 'User';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test AJAX Server Loading - MisVord</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #2f3136; 
            color: white;
        }
        .container { max-width: 800px; margin: 0 auto; }
        button { 
            padding: 10px 20px; 
            margin: 10px; 
            background: #5865f2; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
        }
        button:hover { background: #4752c4; }
        #result { 
            border: 1px solid #40444b; 
            padding: 15px; 
            margin-top: 20px; 
            background: #36393f;
            border-radius: 5px;
        }
        .success { color: #57f287; }
        .error { color: #ed4245; }
        .info { color: #5865f2; }
        .user-info { 
            background: #40444b; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 20px;
        }
        input { 
            padding: 8px; 
            margin: 5px; 
            background: #40444b; 
            border: 1px solid #555; 
            color: white; 
            border-radius: 3px;
        }
        pre { 
            background: #2f3136; 
            padding: 10px; 
            border-radius: 3px; 
            overflow-x: auto;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Test AJAX Server Loading</h1>
        
        <div class="user-info">
            <strong>Logged in as:</strong> <?php echo htmlspecialchars($username); ?> (ID: <?php echo $userId; ?>)
        </div>
        
        <div>
            <label>Server ID: <input type="number" id="serverId" value="13" /></label>
            <button onclick="testAjaxLoad()">🔄 Test AJAX Load</button>
            <button onclick="testNormalLoad()">🌐 Test Normal Load</button>
            <button onclick="loadUserServers()">📂 Load My Servers</button>
        </div>
        
        <div id="result"></div>
    </div>
    
    <script>
        function loadUserServers() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p class="info">🔍 Loading your servers...</p>';
            
            fetch('/api/user/servers', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data.servers) {
                    const servers = data.data.servers;
                    let serverList = servers.map(server => 
                        `<li>ID: ${server.id} - ${server.name}</li>`
                    ).join('');
                    
                    resultDiv.innerHTML = `
                        <h3 class="success">✅ Your Servers</h3>
                        <ul>${serverList}</ul>
                        <p>Click on any server ID above to test it!</p>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <h3 class="error">❌ Failed to load servers</h3>
                        <p>${data.message || 'Unknown error'}</p>
                    `;
                }
            })
            .catch(error => {
                resultDiv.innerHTML = `
                    <h3 class="error">❌ Error</h3>
                    <p>${error.message}</p>
                `;
            });
        }
        
        function testAjaxLoad() {
            const serverId = document.getElementById('serverId').value;
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = '<p class="info">🔄 Loading AJAX server page...</p>';
            
            const startTime = Date.now();
            
            fetch(`/server/${serverId}?render_html=1`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                const loadTime = Date.now() - startTime;
                console.log('Response status:', response.status);
                console.log('Response headers:', [...response.headers.entries()]);
                
                if (response.status === 401) {
                    resultDiv.innerHTML = `
                        <h3 class="error">❌ Authentication Required</h3>
                        <p>Please refresh the page and login again</p>
                    `;
                    return null;
                } else if (response.status === 403) {
                    resultDiv.innerHTML = `
                        <h3 class="error">❌ Access Denied</h3>
                        <p>You don't have access to server ${serverId}</p>
                    `;
                    return null;
                } else if (response.status === 404) {
                    resultDiv.innerHTML = `
                        <h3 class="error">❌ Server Not Found</h3>
                        <p>Server ${serverId} doesn't exist</p>
                    `;
                    return null;
                } else if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text().then(html => ({ html, loadTime, contentType: response.headers.get('content-type') }));
            })
            .then(result => {
                if (result) {
                    const { html, loadTime, contentType } = result;
                    resultDiv.innerHTML = `
                        <h3 class="success">✅ AJAX Load Successful</h3>
                        <p><strong>Load Time:</strong> ${loadTime}ms</p>
                        <p><strong>Content Length:</strong> ${html.length} characters</p>
                        <p><strong>Content-Type:</strong> ${contentType}</p>
                        <p><strong>Contains server page:</strong> ${html.includes('server-content') ? '✅ Yes' : '❌ No'}</p>
                        <details>
                            <summary>📄 HTML Preview (first 800 chars)</summary>
                            <pre>${html.substring(0, 800)}...</pre>
                        </details>
                    `;
                }
            })
            .catch(error => {
                resultDiv.innerHTML = `
                    <h3 class="error">❌ AJAX Load Failed</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Make sure server ${serverId} exists and you have access to it</p>
                `;
            });
        }
        
        function testNormalLoad() {
            const serverId = document.getElementById('serverId').value;
            window.open(`/server/${serverId}`, '_blank');
        }
        
        // Auto-load user servers on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadUserServers();
        });
    </script>
</body>
</html> 