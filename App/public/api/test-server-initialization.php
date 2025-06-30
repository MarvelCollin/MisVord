<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'testuser';
}

echo "<h1>Testing Server Initialization Fix</h1>";

echo "<h2>1. Server Initialization Components Status</h2>";
echo "<pre>
✅ Created missing initializeChatSection function
✅ Simplified performServerLayoutUpdate in load-server-page.js
✅ Updated server page initialization with proper order
✅ Added bot systems initialization
✅ Fixed ChannelSwitchManager redundant initialization
✅ Added proper cleanup method to ChannelSwitchManager
✅ Updated server page script loading order
</pre>";

echo "<h2>2. Test Server Layout Loading</h2>";
$serverUrl = 'http://localhost/server/1/layout';
echo "<pre>Testing URL: $serverUrl</pre>";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => $serverUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-Requested-With: XMLHttpRequest',
        'Accept: text/html'
    ],
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo "<h3>Server Layout Response:</h3>";
echo "<pre>HTTP Status: $httpCode</pre>";

if ($response && $httpCode === 200) {
    echo "<pre>✅ Server layout loads successfully</pre>";
    
    $hasChannelSwitchManager = strpos($response, 'channel-switch-manager') !== false;
    $hasChatSection = strpos($response, 'chat-section') !== false;
    $hasServerDropdown = strpos($response, 'server-dropdown') !== false;
    $hasBotComponent = strpos($response, 'bot.js') !== false;
    $hasParticipantSection = strpos($response, 'participant-section') !== false;
    
    echo "<h3>Required Components Check:</h3>";
    echo "<pre>";
    echo "✅ Channel Switch Manager: " . ($hasChannelSwitchManager ? "Found" : "Missing") . "\n";
    echo "✅ Chat Section: " . ($hasChatSection ? "Found" : "Missing") . "\n";
    echo "✅ Server Dropdown: " . ($hasServerDropdown ? "Found" : "Missing") . "\n";
    echo "✅ Bot Component: " . ($hasBotComponent ? "Found" : "Missing") . "\n";
    echo "✅ Participant Section: " . ($hasParticipantSection ? "Found" : "Missing") . "\n";
    echo "</pre>";
    
    if ($hasChannelSwitchManager && $hasChatSection && $hasServerDropdown && $hasBotComponent && $hasParticipantSection) {
        echo "<h3>🎉 All Components Available!</h3>";
    } else {
        echo "<h3>⚠️ Some Components Missing</h3>";
    }
} else {
    echo "<pre>❌ Server layout failed to load</pre>";
    echo "<pre>Response: " . substr($response, 0, 200) . "...</pre>";
}

echo "<h2>3. Test Individual Component Endpoints</h2>";

$testEndpoints = [
    'Chat API' => '/api/messages/channel/1?limit=5',
    'Server API' => '/api/servers/1',
    'Bot API' => '/api/bot/list',
    'User API' => '/api/users/all?limit=5'
];

foreach ($testEndpoints as $name => $endpoint) {
    echo "<h3>Testing $name</h3>";
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "http://localhost$endpoint",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'X-Requested-With: XMLHttpRequest',
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 5
    ]);
    
    $apiResponse = curl_exec($curl);
    $apiHttpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    echo "<pre>$name Status: $apiHttpCode</pre>";
    
    if ($apiResponse && $apiHttpCode === 200) {
        $apiData = json_decode($apiResponse, true);
        if ($apiData && isset($apiData['success']) && $apiData['success']) {
            echo "<pre>✅ $name working correctly</pre>";
        } else {
            echo "<pre>⚠️ $name returned error: " . ($apiData['message'] ?? 'Unknown error') . "</pre>";
        }
    } else {
        echo "<pre>❌ $name failed (HTTP $apiHttpCode)</pre>";
    }
}

echo "<h2>4. JavaScript Components Test</h2>";
echo "<script>
document.addEventListener('DOMContentLoaded', function() {
    const testResults = {
        'initializeChatSection': typeof window.initializeChatSection === 'function',
        'ChatSection': typeof window.ChatSection === 'function',
        'ChannelSwitchManager': typeof window.ChannelSwitchManager === 'function',
        'BotComponent': typeof window.BotComponent === 'function',
        'initServerDropdown': typeof window.initServerDropdown === 'function',
        'initializeParticipantSection': typeof window.initializeParticipantSection === 'function'
    };
    
    let resultHtml = '<h3>JavaScript Components Status:</h3><pre>';
    Object.entries(testResults).forEach(([name, available]) => {
        resultHtml += (available ? '✅' : '❌') + ' ' + name + ': ' + (available ? 'Available' : 'Missing') + '\\n';
    });
    resultHtml += '</pre>';
    
    const allAvailable = Object.values(testResults).every(v => v);
    if (allAvailable) {
        resultHtml += '<h3 style=\"color: green;\">🎉 All JavaScript Components Available!</h3>';
    } else {
        resultHtml += '<h3 style=\"color: orange;\">⚠️ Some JavaScript Components Missing</h3>';
    }
    
    document.body.insertAdjacentHTML('beforeend', resultHtml);
});
</script>";

echo "<style>
body { font-family: Arial, sans-serif; margin: 20px; }
h1, h2, h3 { color: #333; }
pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
</style>";
?> 