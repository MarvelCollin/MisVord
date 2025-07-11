<?php
// Simple PHP proxy to Docker container
$dockerUrl = 'http://localhost:1001';
$requestUri = $_SERVER['REQUEST_URI'];

// Remove any leading slash for proper URL construction
$requestUri = ltrim($requestUri, '/');

// Build the target URL  
$targetUrl = $dockerUrl . '/' . $requestUri;

echo "<h1>MisVord IIS PHP Proxy</h1>";
echo "<p>Target URL: $targetUrl</p>";
echo "<p>Request Method: {$_SERVER['REQUEST_METHOD']}</p>";

// Test connection to Docker container
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "<p style='color: red;'>❌ cURL Error: $error</p>";
} else {
    echo "<p style='color: green;'>✅ Connection successful (HTTP $httpCode)</p>";
    
    // If this is the test file, show a snippet of the response
    if (strpos($requestUri, 'test-iis.php') !== false) {
        echo "<h3>Response Preview:</h3>";
        echo "<pre>" . htmlentities(substr($response, 0, 500)) . "</pre>";
    } else {
        // For other requests, output the full response
        echo $response;
    }
}
?>
