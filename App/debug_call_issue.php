<?php
echo "=== DEBUG: VideoSDK Call Page Issue ===\n";

// Step 1: Test if we can load the environment
echo "Step 1: Loading environment...\n";
try {
    require_once __DIR__ . '/config/env.php';
    echo "✅ EnvLoader loaded successfully\n";
    
    $env = EnvLoader::getEnv();
    echo "✅ Environment variables loaded: " . count($env) . " variables\n";
    
    // Check VideoSDK specific variables
    $apiKey = $env['VIDEOSDK_API_KEY'] ?? null;
    $secretKey = $env['VIDEOSDK_SECRET_KEY'] ?? null;
    
    echo "VIDEOSDK_API_KEY: " . ($apiKey ? substr($apiKey, 0, 8) . "..." : "NOT FOUND") . "\n";
    echo "VIDEOSDK_SECRET_KEY: " . ($secretKey ? substr($secretKey, 0, 8) . "..." : "NOT FOUND") . "\n";
    
} catch (Exception $e) {
    echo "❌ EnvLoader Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 2: Test VideoSDK configuration
echo "\nStep 2: Loading VideoSDK configuration...\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    echo "✅ VideoSDK config file loaded\n";
    
    VideoSDKConfig::init();
    echo "✅ VideoSDK initialized\n";
    
    $frontendConfig = VideoSDKConfig::getFrontendConfig();
    echo "✅ Frontend config generated\n";
    
    if ($frontendConfig) {
        echo "API Key: " . ($frontendConfig['apiKey'] ? substr($frontendConfig['apiKey'], 0, 8) . "..." : "MISSING") . "\n";
        echo "Token: " . ($frontendConfig['token'] ? substr($frontendConfig['token'], 0, 20) . "..." : "MISSING") . "\n";
        echo "Domain: " . $frontendConfig['domain'] . "\n";
        echo "Is Production: " . ($frontendConfig['isProduction'] ? 'true' : 'false') . "\n";
    } else {
        echo "❌ Frontend config is NULL\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ VideoSDK Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

// Step 3: Test what the call.php would generate
echo "\nStep 3: Testing meta tag generation...\n";

$videoSDKConfig = $frontendConfig;

$meta_api_key = $videoSDKConfig ? $videoSDKConfig['apiKey'] : '';
$meta_token = $videoSDKConfig ? $videoSDKConfig['token'] : '';

echo "Meta API Key: " . ($meta_api_key ? substr($meta_api_key, 0, 8) . "..." : "EMPTY") . "\n";
echo "Meta Token: " . ($meta_token ? substr($meta_token, 0, 20) . "..." : "EMPTY") . "\n";

// Step 4: Generate actual meta tags
echo "\nStep 4: Generated meta tags:\n";
echo '<meta name="videosdk-api-key" content="' . $meta_api_key . '">' . "\n";
echo '<meta name="videosdk-token" content="' . $meta_token . '">' . "\n";

// Step 5: Test the JavaScript would find these
echo "\nStep 5: JavaScript validation test:\n";
if (!empty($meta_api_key) && !empty($meta_token)) {
    echo "✅ JavaScript would find both API key and token\n";
} else {
    echo "❌ JavaScript would fail - missing values:\n";
    echo "  API Key empty: " . (empty($meta_api_key) ? "YES" : "NO") . "\n";
    echo "  Token empty: " . (empty($meta_token) ? "YES" : "NO") . "\n";
}

echo "\n=== DEBUG COMPLETE ===\n";
?>
