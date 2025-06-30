<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'testuser';
}

echo "<h1>Testing New Chat Modal Functionality - IIS Version</h1>";

echo "<h2>0. Session Debug</h2>";
echo "<pre>Session Data:\n" . htmlspecialchars(print_r($_SESSION, true)) . "</pre>";
echo "<pre>Session ID: " . session_id() . "</pre>";
echo "<pre>Session Status: " . session_status() . "</pre>";

echo "<h2>1. Testing Direct API File</h2>";
$apiUrl = 'http://localhost/public/api/users-all.php';
echo "<pre>Testing URL: $apiUrl</pre>";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Requested-With: XMLHttpRequest',
        'Cookie: ' . session_name() . '=' . session_id()
    ],
    CURLOPT_VERBOSE => true,
    CURLOPT_STDERR => fopen('php://temp', 'w+'),
    CURLOPT_FOLLOWLOCATION => true
]);
$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$error = curl_error($curl);
curl_close($curl);

echo "<pre>HTTP Code: $httpCode</pre>";
if ($error) {
    echo "<pre>cURL Error: " . htmlspecialchars($error) . "</pre>";
}
echo "<pre>Direct API Response:\n" . htmlspecialchars($response) . "</pre>";

echo "<h2>2. Direct PHP Function Test</h2>";
try {
    require_once __DIR__ . '/../../controllers/UserController.php';
    $controller = new UserController();
    
    ob_start();
    $result = $controller->getAllUsers();
    $directOutput = ob_get_clean();
    
    echo "<pre>Direct Function Result:\n" . htmlspecialchars(print_r($result, true)) . "</pre>";
    if ($directOutput) {
        echo "<pre>Direct Output:\n" . htmlspecialchars($directOutput) . "</pre>";
    }
} catch (Exception $e) {
    echo "<pre>Direct Function Error: " . htmlspecialchars($e->getMessage()) . "</pre>";
}

echo "<h2>3. Database Direct Query Test</h2>";
try {
    require_once __DIR__ . '/../../database/query.php';
    $query = new Query();
    $users = $query->table('users')
        ->where('status', '!=', 'bot')
        ->where('status', '!=', 'banned')
        ->where('status', '!=', 'deleted')
        ->where('id', '!=', $_SESSION['user_id'])
        ->limit(10)
        ->get();
    
    echo "<pre>Direct DB Query Result (" . count($users) . " users):\n" . htmlspecialchars(print_r($users, true)) . "</pre>";
} catch (Exception $e) {
    echo "<pre>Database Query Error: " . htmlspecialchars($e->getMessage()) . "</pre>";
}

echo "<h2>4. File System Check</h2>";
$apiFile = __DIR__ . '/users-all.php';
echo "<pre>API File Path: $apiFile</pre>";
echo "<pre>API File Exists: " . (file_exists($apiFile) ? 'YES' : 'NO') . "</pre>";
if (file_exists($apiFile)) {
    echo "<pre>File Size: " . filesize($apiFile) . " bytes</pre>";
    echo "<pre>File Permissions: " . substr(sprintf('%o', fileperms($apiFile)), -4) . "</pre>";
}

echo "<h2>5. Direct File Include Test</h2>";
if (file_exists($apiFile)) {
    echo "<pre>Including API file directly...</pre>";
    try {
        ob_start();
        include $apiFile;
        $includeOutput = ob_get_clean();
        echo "<pre>Direct Include Output:\n" . htmlspecialchars($includeOutput) . "</pre>";
    } catch (Exception $e) {
        echo "<pre>Direct Include Error: " . htmlspecialchars($e->getMessage()) . "</pre>";
    }
} else {
    echo "<pre>API file not found for direct include test</pre>";
}
?> 