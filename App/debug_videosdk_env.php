<?php
// Debug environment and VideoSDK configuration

echo "<!DOCTYPE html>\n";
echo "<html>\n";
echo "<head><title>🔍 VideoSDK Debug</title>\n";
echo "<style>body{font-family:Arial;margin:20px;background:#1a1a2e;color:white;}";
echo ".section{background:#16213e;padding:15px;margin:10px 0;border-radius:8px;}";
echo ".success{color:#4CAF50;} .error{color:#f44336;} .warning{color:#ff9800;}";
echo "</style></head>\n";
echo "<body>\n";

echo "<h1>🔍 VideoSDK Configuration Debug</h1>\n";

// 1. Check .env file
echo "<div class='section'>\n";
echo "<h3>📄 Environment File Check</h3>\n";
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    echo "<p class='success'>✅ .env file exists: $envFile</p>\n";
    
    $envContent = file_get_contents($envFile);
    if (strpos($envContent, 'VIDEOSDK_API_KEY') !== false) {
        echo "<p class='success'>✅ VIDEOSDK_API_KEY found in .env</p>\n";
    } else {
        echo "<p class='error'>❌ VIDEOSDK_API_KEY not found in .env</p>\n";
    }
    
    if (strpos($envContent, 'VIDEOSDK_SECRET_KEY') !== false) {
        echo "<p class='success'>✅ VIDEOSDK_SECRET_KEY found in .env</p>\n";
    } else {
        echo "<p class='error'>❌ VIDEOSDK_SECRET_KEY not found in .env</p>\n";
    }
} else {
    echo "<p class='error'>❌ .env file not found</p>\n";
}
echo "</div>\n";

// 2. Check EnvLoader
echo "<div class='section'>\n";
echo "<h3>🔧 EnvLoader Test</h3>\n";
try {
    require_once __DIR__ . '/config/env.php';
    $envVars = EnvLoader::getEnv();
    
    echo "<p class='success'>✅ EnvLoader loaded successfully</p>\n";
    echo "<p><strong>Loaded variables count:</strong> " . count($envVars) . "</p>\n";
    
    if (isset($envVars['VIDEOSDK_API_KEY'])) {
        echo "<p class='success'>✅ VIDEOSDK_API_KEY loaded: " . substr($envVars['VIDEOSDK_API_KEY'], 0, 20) . "...</p>\n";
    } else {
        echo "<p class='error'>❌ VIDEOSDK_API_KEY not loaded</p>\n";
    }
    
    if (isset($envVars['VIDEOSDK_SECRET_KEY'])) {
        echo "<p class='success'>✅ VIDEOSDK_SECRET_KEY loaded: " . substr($envVars['VIDEOSDK_SECRET_KEY'], 0, 20) . "...</p>\n";
    } else {
        echo "<p class='error'>❌ VIDEOSDK_SECRET_KEY not loaded</p>\n";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ EnvLoader error: " . $e->getMessage() . "</p>\n";
}
echo "</div>\n";

// 3. Check getenv() function
echo "<div class='section'>\n";
echo "<h3>🌍 getenv() Test</h3>\n";
$apiKey = getenv('VIDEOSDK_API_KEY');
$secretKey = getenv('VIDEOSDK_SECRET_KEY');

if ($apiKey) {
    echo "<p class='success'>✅ getenv('VIDEOSDK_API_KEY'): " . substr($apiKey, 0, 20) . "...</p>\n";
} else {
    echo "<p class='warning'>⚠️ getenv('VIDEOSDK_API_KEY') returned empty</p>\n";
}

if ($secretKey) {
    echo "<p class='success'>✅ getenv('VIDEOSDK_SECRET_KEY'): " . substr($secretKey, 0, 20) . "...</p>\n";
} else {
    echo "<p class='warning'>⚠️ getenv('VIDEOSDK_SECRET_KEY') returned empty</p>\n";
}
echo "</div>\n";

// 4. Test VideoSDK Configuration
echo "<div class='section'>\n";
echo "<h3>🎥 VideoSDK Configuration Test</h3>\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    VideoSDKConfig::init();
    
    $config = VideoSDKConfig::getFrontendConfig();
    
    echo "<p class='success'>✅ VideoSDK configuration initialized</p>\n";
    echo "<p><strong>API Key:</strong> " . substr($config['apiKey'], 0, 20) . "...</p>\n";
    echo "<p><strong>Token generated:</strong> " . (strlen($config['token']) > 10 ? 'Yes' : 'No') . "</p>\n";
    echo "<p><strong>Token length:</strong> " . strlen($config['token']) . " characters</p>\n";
    
} catch (Exception $e) {
    echo "<p class='error'>❌ VideoSDK configuration error: " . $e->getMessage() . "</p>\n";
}
echo "</div>\n";

// 5. Test Meta Tag Generation
echo "<div class='section'>\n";
echo "<h3>🏷️ Meta Tag Generation Test</h3>\n";
try {
    $videoSDKConfig = VideoSDKConfig::getFrontendConfig();
    
    if ($videoSDKConfig) {
        echo "<p class='success'>✅ Meta tags would be generated:</p>\n";
        echo "<pre>";
        echo htmlspecialchars('<meta name="videosdk-api-key" content="' . $videoSDKConfig['apiKey'] . '">') . "\n";
        echo htmlspecialchars('<meta name="videosdk-token" content="' . substr($videoSDKConfig['token'], 0, 50) . '...">');
        echo "</pre>";
    } else {
        echo "<p class='error'>❌ No VideoSDK config available for meta tags</p>\n";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Meta tag generation error: " . $e->getMessage() . "</p>\n";
}
echo "</div>\n";

// 6. Manual Environment Setting Test
echo "<div class='section'>\n";
echo "<h3>🔧 Manual Environment Test</h3>\n";
putenv('VIDEOSDK_API_KEY=8ad2dbcd-638d-4fbb-999c-9a48a83caa15');
putenv('VIDEOSDK_SECRET_KEY=2894abac68603be19aa80b781cad6683eebfb922f496c22cc46b19ad91647d4e');

$testApiKey = getenv('VIDEOSDK_API_KEY');
$testSecretKey = getenv('VIDEOSDK_SECRET_KEY');

if ($testApiKey && $testSecretKey) {
    echo "<p class='success'>✅ Manual environment setting works</p>\n";
    echo "<p>API Key: " . substr($testApiKey, 0, 20) . "...</p>\n";
    echo "<p>Secret Key: " . substr($testSecretKey, 0, 20) . "...</p>\n";
} else {
    echo "<p class='error'>❌ Manual environment setting failed</p>\n";
}
echo "</div>\n";

echo "<div class='section'>\n";
echo "<h3>🚀 Actions</h3>\n";
echo "<p><a href='/call' style='color:#2196F3;'>🎥 Test Call Page</a></p>\n";
echo "<p><a href='/videosdk_api.php?action=get_token' style='color:#2196F3;'>🔑 Test API Token</a></p>\n";
echo "</div>\n";

echo "</body>\n";
echo "</html>\n";
?>
