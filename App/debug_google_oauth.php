<?php
/**
 * Google OAuth Debug Page
 * 
 * Use this page to verify your Google OAuth configuration.
 * Access it at: http://localhost:8000/debug-oauth
 */

// Load configuration
$config = require_once __DIR__ . '/config/google_oauth.php';

// Function to check if a URL is reachable
function checkUrl($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode;
}

// Create a simple HTML page with configuration information
$html = '<!DOCTYPE html>
<html>
<head>
    <title>Google OAuth Configuration Debug</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #4285f4; }
        h2 { color: #34a853; margin-top: 30px; }
        .info { background-color: #e8f0fe; border-left: 4px solid #4285f4; padding: 15px; margin: 20px 0; }
        .warning { background-color: #fef7e0; border-left: 4px solid #fbbc04; padding: 15px; margin: 20px 0; }
        .error { background-color: #fce8e6; border-left: 4px solid #ea4335; padding: 15px; margin: 20px 0; }
        .success { background-color: #e6f4ea; border-left: 4px solid #34a853; padding: 15px; margin: 20px 0; }
        code { background-color: #f1f3f4; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
        th { background-color: #f1f3f4; }
    </style>
</head>
<body>
    <h1>Google OAuth Configuration Debug</h1>
    
    <div class="info">
        <p>This page helps you verify your Google OAuth configuration for MiscVord application.</p>
    </div>
    
    <h2>Configuration Values</h2>
    <table>
        <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>Client ID</td>
            <td><code>' . htmlspecialchars($config['client_id']) . '</code></td>
            <td>' . (empty($config['client_id']) ? '<span style="color: red;">Missing</span>' : '<span style="color: green;">Set</span>') . '</td>
        </tr>
        <tr>
            <td>Client Secret</td>
            <td><code>' . (empty($config['client_secret']) ? 'Not set' : '********' . substr($config['client_secret'], -4)) . '</code></td>
            <td>' . (empty($config['client_secret']) ? '<span style="color: red;">Missing</span>' : '<span style="color: green;">Set</span>') . '</td>
        </tr>
        <tr>
            <td>Redirect URI</td>
            <td><code>' . htmlspecialchars($config['redirect_uri']) . '</code></td>
            <td>' . (empty($config['redirect_uri']) ? '<span style="color: red;">Missing</span>' : '<span style="color: green;">Set</span>') . '</td>
        </tr>
    </table>
    
    <h2>Configuration Instructions</h2>
    <div class="info">
        <p>To fix the <code>invalid_client</code> error:</p>
        <ol>
            <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a></li>
            <li>Select your project</li>
            <li>Go to "Credentials" and find your OAuth client</li>
            <li>Make sure the redirect URI <code>' . htmlspecialchars($config['redirect_uri']) . '</code> is exactly listed in the authorized redirect URIs</li>
            <li>Verify your client ID and client secret match the values in your configuration</li>
            <li>If you made changes, click "Save" in the Google Cloud Console</li>
        </ol>
    </div>
    
    <h2>Test OAuth Flow</h2>
    <p>Click the button below to test the OAuth flow:</p>
    <form action="/auth/google" method="GET">
        <button type="submit" style="background-color: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
            Test Google Sign-In
        </button>
    </form>
</body>
</html>';

echo $html;
