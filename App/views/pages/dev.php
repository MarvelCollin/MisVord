<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Include the VideoSDK config and environment loader
require_once dirname(dirname(__DIR__)) . '/config/videosdk.php';
require_once dirname(dirname(__DIR__)) . '/config/env.php';

$page_title = 'VideoSDK Development Test';
$body_class = 'bg-discord-dark text-white';

// Test results storage
$testResults = [
    'env_load' => false,
    'videosdk_init' => false,
    'api_key' => null,
    'token' => null,
    'secret_key' => null,
    'meeting_creation' => false,
    'meeting_validation' => false,
    'errors' => []
];

// Test 1: Environment Variables Loading
try {
    EnvLoader::load();
    $testResults['env_load'] = true;
    
    // Test individual env vars
    $testResults['api_key'] = EnvLoader::get('VIDEOSDK_API_KEY');
    $testResults['token'] = EnvLoader::get('VIDEOSDK_TOKEN');
    $testResults['secret_key'] = EnvLoader::get('VIDEOSDK_SECRET_KEY');
    
    // Debug information
    $testResults['debug_info'] = [
        'api_key_length' => $testResults['api_key'] ? strlen($testResults['api_key']) : 0,
        'token_length' => $testResults['token'] ? strlen($testResults['token']) : 0,
        'secret_key_length' => $testResults['secret_key'] ? strlen($testResults['secret_key']) : 0,
        'token_empty' => empty($testResults['token']),
        'token_null' => is_null($testResults['token']),
        'token_false' => $testResults['token'] === false,
        'raw_token_type' => gettype($testResults['token']),
        'env_getenv' => getenv('VIDEOSDK_TOKEN') ? 'SET' : 'NOT SET',
        'env_server' => isset($_SERVER['VIDEOSDK_TOKEN']) ? 'SET' : 'NOT SET',
        'env_env' => isset($_ENV['VIDEOSDK_TOKEN']) ? 'SET' : 'NOT SET',
    ];
} catch (Exception $e) {
    $testResults['errors'][] = 'Environment Loading Error: ' . $e->getMessage();
}

// Test 2: VideoSDK Configuration Initialization
try {
    VideoSDKConfig::init();
    $testResults['videosdk_init'] = true;
} catch (Exception $e) {
    $testResults['errors'][] = 'VideoSDK Init Error: ' . $e->getMessage();
}

// Test 3: Meeting Creation
if ($testResults['videosdk_init']) {
    try {
        $meetingResponse = VideoSDKConfig::createMeeting();
        $testResults['meeting_creation'] = true;
        $testResults['meeting_data'] = $meetingResponse;
    } catch (Exception $e) {
        $testResults['errors'][] = 'Meeting Creation Error: ' . $e->getMessage();
    }
}

// Test 4: Meeting Validation (if meeting was created successfully)
if ($testResults['meeting_creation'] && isset($testResults['meeting_data']['roomId'])) {
    try {
        $isValid = VideoSDKConfig::validateMeeting($testResults['meeting_data']['roomId']);
        $testResults['meeting_validation'] = $isValid;
    } catch (Exception $e) {
        $testResults['errors'][] = 'Meeting Validation Error: ' . $e->getMessage();
    }
}

?>

<?php ob_start(); ?>

<div class="min-h-screen bg-discord-darker p-8">
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="bg-discord-background rounded-lg p-6 mb-6 border border-gray-700">
            <h1 class="text-3xl font-bold text-white mb-2">
                <i class="fas fa-video text-discord-primary mr-3"></i>
                VideoSDK Development Test
            </h1>
            <p class="text-discord-lighter">Testing VideoSDK environment configuration and API connectivity</p>
        </div>

        <!-- Test Results Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Environment Variables Test -->
            <div class="bg-discord-background rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 rounded-full mr-3 <?php echo $testResults['env_load'] ? 'bg-green-500' : 'bg-red-500'; ?>"></span>
                    Environment Variables
                </h2>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">API Key:</span>
                        <span class="font-mono text-sm <?php echo $testResults['api_key'] ? 'text-green-400' : 'text-red-400'; ?>">
                            <?php echo $testResults['api_key'] ? substr($testResults['api_key'], 0, 8) . '...' : 'NOT SET'; ?>
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">Token:</span>
                        <span class="font-mono text-sm <?php echo $testResults['token'] ? 'text-green-400' : 'text-red-400'; ?>">
                            <?php echo $testResults['token'] ? substr($testResults['token'], 0, 20) . '...' : 'NOT SET'; ?>
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">Secret Key:</span>
                        <span class="font-mono text-sm <?php echo $testResults['secret_key'] ? 'text-green-400' : 'text-red-400'; ?>">
                            <?php echo $testResults['secret_key'] ? substr($testResults['secret_key'], 0, 12) . '...' : 'NOT SET'; ?>
                        </span>
                    </div>
                </div>
            </div>

            <!-- VideoSDK Initialization Test -->
            <div class="bg-discord-background rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 rounded-full mr-3 <?php echo $testResults['videosdk_init'] ? 'bg-green-500' : 'bg-red-500'; ?>"></span>
                    VideoSDK Initialization
                </h2>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">Configuration Status:</span>
                        <span class="<?php echo $testResults['videosdk_init'] ? 'text-green-400' : 'text-red-400'; ?>">
                            <?php echo $testResults['videosdk_init'] ? 'SUCCESS' : 'FAILED'; ?>
                        </span>
                    </div>
                    <?php if ($testResults['videosdk_init']): ?>
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">API Key Retrieved:</span>
                        <span class="text-green-400">✓</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">Token Retrieved:</span>
                        <span class="text-green-400">✓</span>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- API Tests -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Meeting Creation Test -->
            <div class="bg-discord-background rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 rounded-full mr-3 <?php echo $testResults['meeting_creation'] ? 'bg-green-500' : 'bg-red-500'; ?>"></span>
                    Meeting Creation
                </h2>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">API Call Status:</span>
                        <span class="<?php echo $testResults['meeting_creation'] ? 'text-green-400' : 'text-red-400'; ?>">
                            <?php echo $testResults['meeting_creation'] ? 'SUCCESS' : 'FAILED'; ?>
                        </span>
                    </div>
                    <?php if ($testResults['meeting_creation'] && isset($testResults['meeting_data'])): ?>
                    <div class="mt-3">
                        <span class="text-discord-lighter block mb-2">Meeting Data:</span>
                        <div class="bg-discord-dark p-3 rounded text-xs font-mono overflow-x-auto">
                            <pre class="text-green-300"><?php echo json_encode($testResults['meeting_data'], JSON_PRETTY_PRINT); ?></pre>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Meeting Validation Test -->
            <div class="bg-discord-background rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 rounded-full mr-3 <?php echo $testResults['meeting_validation'] ? 'bg-green-500' : 'bg-red-500'; ?>"></span>
                    Meeting Validation
                </h2>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">Validation Status:</span>
                        <span class="<?php echo $testResults['meeting_validation'] ? 'text-green-400' : 'text-red-400'; ?>">
                            <?php 
                            if (!$testResults['meeting_creation']) {
                                echo 'SKIPPED';
                            } else {
                                echo $testResults['meeting_validation'] ? 'SUCCESS' : 'FAILED';
                            }
                            ?>
                        </span>
                    </div>
                    <?php if ($testResults['meeting_creation'] && isset($testResults['meeting_data']['roomId'])): ?>
                    <div class="flex justify-between items-center">
                        <span class="text-discord-lighter">Room ID:</span>
                        <span class="font-mono text-sm text-blue-400">
                            <?php echo $testResults['meeting_data']['roomId']; ?>
                        </span>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Error Messages -->
        <?php if (!empty($testResults['errors'])): ?>
        <div class="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 text-red-400 flex items-center">
                <i class="fas fa-exclamation-triangle mr-3"></i>
                Errors Encountered
            </h2>
            <div class="space-y-2">
                <?php foreach ($testResults['errors'] as $error): ?>
                <div class="bg-red-800/30 p-3 rounded text-red-300 font-mono text-sm">
                    <?php echo htmlspecialchars($error); ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Environment Debug Info -->
        <div class="bg-discord-background rounded-lg p-6 border border-gray-700">
            <h2 class="text-xl font-semibold mb-4 text-white flex items-center">
                <i class="fas fa-info-circle text-blue-400 mr-3"></i>
                Environment Debug Information
            </h2>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Environment Variables -->
                <div>
                    <h3 class="text-lg font-medium mb-3 text-discord-lighter">All Environment Variables</h3>
                    <div class="bg-discord-dark p-4 rounded text-xs font-mono max-h-64 overflow-y-auto">
                        <?php
                        $allEnvVars = EnvLoader::getAll();
                        foreach ($allEnvVars as $key => $value) {
                            $displayValue = $value;
                            // Mask sensitive data
                            if (strpos($key, 'KEY') !== false || strpos($key, 'SECRET') !== false || strpos($key, 'TOKEN') !== false || strpos($key, 'PASS') !== false) {
                                $displayValue = substr($value, 0, 8) . '...';
                            }
                            echo "<span class='text-blue-300'>$key</span>=<span class='text-green-300'>$displayValue</span>\n";
                        }                        ?>
                    </div>
                </div>

                <!-- VideoSDK Debug Information -->
                <div>
                    <h3 class="text-lg font-medium mb-3 text-discord-lighter">VideoSDK Variable Debug</h3>
                    <div class="bg-discord-dark p-4 rounded text-xs font-mono space-y-1">                        <?php if (isset($testResults['debug_info'])): ?>
                            <div class="text-yellow-300">API Key Length: <?php echo $testResults['debug_info']['api_key_length']; ?></div>
                            <div class="text-yellow-300">Token Length: <?php echo $testResults['debug_info']['token_length']; ?></div>
                            <div class="text-yellow-300">Secret Key Length: <?php echo $testResults['debug_info']['secret_key_length']; ?></div>
                            <div class="text-red-300">Token Empty: <?php echo $testResults['debug_info']['token_empty'] ? 'YES' : 'NO'; ?></div>
                            <div class="text-red-300">Token Null: <?php echo $testResults['debug_info']['token_null'] ? 'YES' : 'NO'; ?></div>
                            <div class="text-red-300">Token False: <?php echo $testResults['debug_info']['token_false'] ? 'YES' : 'NO'; ?></div>
                            <div class="text-orange-300">Token Type: <?php echo $testResults['debug_info']['raw_token_type']; ?></div>
                            <div class="text-blue-300">getenv(): <?php echo $testResults['debug_info']['env_getenv']; ?></div>
                            <div class="text-blue-300">$_SERVER: <?php echo $testResults['debug_info']['env_server']; ?></div>
                            <div class="text-blue-300">$_ENV: <?php echo $testResults['debug_info']['env_env']; ?></div>
                            <div class="text-green-300">Raw Token Value: <?php echo $testResults['token'] ? '"' . substr($testResults['token'], 0, 30) . '..."' : 'NULL/EMPTY'; ?></div>
                        <?php else: ?>
                            <div class="text-red-300">Debug info not available</div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="mt-6">
                <!-- System Information -->
                <div>
                    <h3 class="text-lg font-medium mb-3 text-discord-lighter">System Information</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-discord-lighter">PHP Version:</span>
                            <span class="text-white"><?php echo PHP_VERSION; ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-discord-lighter">Server Software:</span>
                            <span class="text-white"><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-discord-lighter">cURL Available:</span>
                            <span class="<?php echo function_exists('curl_init') ? 'text-green-400' : 'text-red-400'; ?>">
                                <?php echo function_exists('curl_init') ? 'YES' : 'NO'; ?>
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-discord-lighter">OpenSSL Available:</span>
                            <span class="<?php echo extension_loaded('openssl') ? 'text-green-400' : 'text-red-400'; ?>">
                                <?php echo extension_loaded('openssl') ? 'YES' : 'NO'; ?>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 mt-6">
            <button onclick="location.reload()" class="bg-discord-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                <i class="fas fa-refresh mr-2"></i>Refresh Tests
            </button>
            <button onclick="testAPI()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                <i class="fas fa-play mr-2"></i>Test API Call
            </button>
            <a href="/home" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors inline-block">
                <i class="fas fa-home mr-2"></i>Back to Home
            </a>
        </div>
    </div>
</div>

<script>
async function testAPI() {
    try {
        const response = await fetch('/api/videosdk-token.php');
        const result = await response.json();
        
        if (result.success) {
            alert('API Test Successful!\nToken: ' + result.token.substring(0, 20) + '...');
        } else {
            alert('API Test Failed!\nError: ' + result.error);
        }
    } catch (error) {
        alert('API Test Failed!\nError: ' + error.message);
    }
}
</script>

<?php 
$content = ob_get_clean();
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>