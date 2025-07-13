<?php
require_once dirname(__DIR__, 2) . '/config/app.php';

// Suppress any PHP warnings/errors from appearing in output
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

// Authentication is now handled in routes.php

// Load environment configurations for comparison
function loadEnvironmentConfig($envFile) {
    $config = [];
    $envPath = dirname(__DIR__, 2) . '/' . $envFile;
    
    try {
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, '#') === 0 || empty($line)) {
                    continue;
                }
                
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $config[trim($key)] = trim($value, '"\'');
                }
            }
        }
    } catch (Exception $e) {
        // If there's any error loading the config, return empty array
        error_log("Error loading environment config from $envFile: " . $e->getMessage());
    }
    
    return $config;
}

$prodConfig = loadEnvironmentConfig('.env.production');
$devConfig = loadEnvironmentConfig('.env.development');

$controller = new DebugController();

try {
    $systemStats = $controller->getSystemStats();
} catch (Exception $e) {
    $systemStats = [
        'server_info' => [],
        'environment' => ['app_env' => 'unknown', 'app_debug' => 'false', 'is_vps' => 'false'],
        'socket_config' => ['socket_host' => 'localhost', 'socket_port' => '3001']
    ];
}

try {
    $healthCheck = $controller->getVpsHealthCheck();
} catch (Exception $e) {
    $healthCheck = [
        'checks' => [
            'database' => ['status' => 'unknown', 'stats' => ['total_users' => 0]],
            'socket_server' => ['status' => 'unknown'],
            'disk_space' => ['used_percent' => 0, 'used_gb' => 0, 'total_gb' => 0]
        ]
    ];
}

try {
    $databaseDebug = $controller->getDatabaseDebugInfo();
} catch (Exception $e) {
    $databaseDebug = 'Database debug info unavailable';
}
?>

<!DOCTYPE html>
<html lang="en">
<?php 
$page_title = 'System Debug Panel - MisVord';
require_once dirname(__DIR__) . '/layout/head.php'; 
?>
<body class="bg-gray-900 text-white">
    <div class="min-h-screen">
        <!-- Header -->
        <div class="bg-gray-800 shadow-lg border-b border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div class="flex items-center">
                        <h1 class="text-3xl font-bold text-white">🔧 System Debug Panel</h1>
                        <span class="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-full">RESTRICTED ACCESS</span>
                    </div>                        <div class="flex items-center space-x-4">
                            <span class="text-gray-300" id="current-time"><?php echo date('Y-m-d H:i:s'); ?></span>
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span class="text-green-400 text-sm">Live Monitoring</span>
                            </div>
                            <button onclick="toggleAutoRefresh()" id="autoRefreshBtn" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white">
                                Auto-Refresh: ON
                            </button>
                            <a href="/home" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">Back to App</a>
                            <a href="/debug?logout=1" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">Logout</a>
                        </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Quick Status Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-2">Environment</h3>
                    <div class="text-2xl font-bold <?php echo ($systemStats['environment']['app_env'] ?? 'unknown') === 'production' ? 'text-red-400' : 'text-green-400'; ?>">
                        <?php echo strtoupper($systemStats['environment']['app_env'] ?? 'unknown'); ?>
                    </div>
                    <p class="text-gray-400 text-sm">
                        <?php echo ($systemStats['environment']['is_vps'] ?? 'false') === 'true' ? 'VPS Mode' : 'Local Mode'; ?>
                    </p>
                </div>

                <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-2">Socket Server</h3>
                    <div class="text-2xl font-bold <?php echo ($healthCheck['checks']['socket_server']['status'] ?? 'unknown') === 'healthy' ? 'text-green-400' : 'text-red-400'; ?>">
                        <?php echo strtoupper($healthCheck['checks']['socket_server']['status'] ?? 'unknown'); ?>
                    </div>
                    <p class="text-gray-400 text-sm">
                        <?php echo $systemStats['socket_config']['socket_host'] ?? 'localhost'; ?>
                    </p>
                </div>

                <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-2">Database</h3>
                    <div class="text-2xl font-bold <?php echo ($healthCheck['checks']['database']['status'] ?? 'unknown') === 'healthy' ? 'text-green-400' : 'text-red-400'; ?>">
                        <?php echo strtoupper($healthCheck['checks']['database']['status'] ?? 'unknown'); ?>
                    </div>
                    <p class="text-gray-400 text-sm">
                        <?php echo $healthCheck['checks']['database']['stats']['total_users'] ?? 0; ?> users
                    </p>
                </div>

                <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 class="text-lg font-semibold mb-2">Disk Usage</h3>
                    <div class="text-2xl font-bold <?php echo ($healthCheck['checks']['disk_space']['used_percent'] ?? 0) > 90 ? 'text-red-400' : (($healthCheck['checks']['disk_space']['used_percent'] ?? 0) > 70 ? 'text-yellow-400' : 'text-green-400'); ?>">
                        <?php echo $healthCheck['checks']['disk_space']['used_percent'] ?? 0; ?>%
                    </div>
                    <p class="text-gray-400 text-sm">
                        <?php echo $healthCheck['checks']['disk_space']['used_gb'] ?? 0; ?>GB / <?php echo $healthCheck['checks']['disk_space']['total_gb'] ?? 0; ?>GB
                    </p>
                </div>
            </div>

            <!-- Main Content Tabs -->
            <div class="bg-gray-800 rounded-lg border border-gray-700">
                <div class="border-b border-gray-700">
                    <nav class="flex space-x-8 px-6" aria-label="Tabs">
                        <button onclick="switchTab('overview')" id="tab-overview" class="tab-button border-b-2 border-blue-500 py-4 px-1 text-blue-400 font-medium">
                            System Overview
                        </button>
                        <button onclick="switchTab('health')" id="tab-health" class="tab-button border-b-2 border-transparent py-4 px-1 text-gray-400 hover:text-gray-300">
                            Health Checks
                        </button>
                        <button onclick="switchTab('database')" id="tab-database" class="tab-button border-b-2 border-transparent py-4 px-1 text-gray-400 hover:text-gray-300">
                            Database
                        </button>
                        <button onclick="switchTab('socket')" id="tab-socket" class="tab-button border-b-2 border-transparent py-4 px-1 text-gray-400 hover:text-gray-300">
                            Socket Status
                        </button>
                        <button onclick="switchTab('docker')" id="tab-docker" class="tab-button border-b-2 border-transparent py-4 px-1 text-gray-400 hover:text-gray-300">
                            Docker
                        </button>
                        <button onclick="switchTab('ssl')" id="tab-ssl" class="tab-button border-b-2 border-transparent py-4 px-1 text-gray-400 hover:text-gray-300">
                            SSL/Security
                        </button>
                        <button onclick="switchTab('environment')" id="tab-environment" class="tab-button border-b-2 border-transparent py-4 px-1 text-gray-400 hover:text-gray-300">
                            Environment Comparison
                        </button>
                    </nav>
                </div>

                <div class="p-6">
                    <!-- System Overview Tab -->
                    <div id="content-overview" class="tab-content">
                        <h2 class="text-2xl font-bold mb-6">System Overview</h2>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Server Information -->
                            <div class="space-y-4">
                                <h3 class="text-xl font-semibold border-b border-gray-700 pb-2">Server Information</h3>
                                <div class="space-y-2">
                                    <?php foreach ($systemStats['server_info'] as $key => $value): ?>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400"><?php echo ucwords(str_replace('_', ' ', $key)); ?>:</span>
                                        <span class="text-white font-mono"><?php echo htmlspecialchars($value); ?></span>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>

                            <!-- Environment Configuration -->
                            <div class="space-y-4">
                                <h3 class="text-xl font-semibold border-b border-gray-700 pb-2">Environment</h3>
                                <div class="space-y-2">
                                    <?php foreach ($systemStats['environment'] as $key => $value): ?>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400"><?php echo ucwords(str_replace('_', ' ', $key)); ?>:</span>
                                        <span class="text-white font-mono"><?php echo htmlspecialchars($value); ?></span>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Health Checks Tab -->
                    <div id="content-health" class="tab-content hidden">
                        <h2 class="text-2xl font-bold mb-6">System Health Checks</h2>
                        
                        <div class="space-y-6">
                            <?php foreach ($healthCheck['checks'] as $checkName => $checkData): ?>
                            <div class="bg-gray-700 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-lg font-semibold"><?php echo ucwords(str_replace('_', ' ', $checkName)); ?></h3>
                                    <span class="px-3 py-1 rounded-full text-sm font-medium
                                        <?php 
                                        $status = $checkData['status'];
                                        if ($status === 'healthy') echo 'bg-green-600 text-white';
                                        elseif ($status === 'warning') echo 'bg-yellow-600 text-white';
                                        elseif ($status === 'unhealthy' || $status === 'error') echo 'bg-red-600 text-white';
                                        else echo 'bg-gray-600 text-white';
                                        ?>">
                                        <?php echo strtoupper($status); ?>
                                    </span>
                                </div>
                                <div class="text-sm text-gray-300">
                                    <pre class="whitespace-pre-wrap"><?php echo json_encode($checkData, JSON_PRETTY_PRINT); ?></pre>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Database Tab -->
                    <div id="content-database" class="tab-content hidden">
                        <h2 class="text-2xl font-bold mb-6">Database Information</h2>
                        
                        <div class="space-y-6">
                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">Connection Status</h3>
                                <?php echo $databaseDebug; ?>
                            </div>

                            <?php if (isset($healthCheck['checks']['database']['stats'])): ?>
                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">Database Statistics</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <?php foreach ($healthCheck['checks']['database']['stats'] as $stat => $value): ?>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-blue-400"><?php echo number_format($value); ?></div>
                                        <div class="text-gray-400"><?php echo ucwords(str_replace('_', ' ', $stat)); ?></div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Socket Status Tab -->
                    <div id="content-socket" class="tab-content hidden">
                        <h2 class="text-2xl font-bold mb-6">Socket Server Status</h2>
                        
                        <div class="space-y-6">
                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">Configuration</h3>
                                <div class="space-y-2">
                                    <?php foreach ($systemStats['socket_config'] as $key => $value): ?>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400"><?php echo ucwords(str_replace('_', ' ', $key)); ?>:</span>
                                        <span class="text-white font-mono"><?php echo htmlspecialchars($value); ?></span>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>

                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">Health Check Results</h3>
                                <pre class="text-sm text-gray-300 whitespace-pre-wrap"><?php echo json_encode($healthCheck['checks']['socket_server'], JSON_PRETTY_PRINT); ?></pre>
                            </div>

                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">Real-Time Socket Monitoring</h3>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <h4 class="font-semibold mb-2 text-green-400">Primary Connection</h4>
                                        <button onclick="testSocket()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white w-full mb-2">
                                            Test Primary Host
                                        </button>
                                        <div class="text-xs text-gray-400">
                                            Host: <?php echo $systemStats['socket_config']['socket_host']; ?>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 class="font-semibold mb-2 text-orange-400">Fallback System</h4>
                                        <button onclick="testSocketFallback()" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white w-full mb-2">
                                            Test Fallback Hosts
                                        </button>
                                        <div class="text-xs text-gray-400">
                                            Auto www/non-www variants
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <button onclick="testFullSocket()" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
                                        🔍 Complete System Test
                                    </button>
                                    <button onclick="monitorSocketHealth()" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white">
                                        📊 Start Health Monitor
                                    </button>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <button onclick="testSocketSecurity()" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white">
                                        🔒 Security Test (WSS)
                                    </button>
                                    <button onclick="clearTestResults()" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                                        🗑️ Clear Results
                                    </button>
                                </div>
                                
                                <!-- Live Status Indicators -->
                                <div class="mb-4 p-3 bg-gray-800 rounded">
                                    <h4 class="font-semibold mb-2">Live Connection Status</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div class="flex items-center">
                                            <div id="primaryStatus" class="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                            <span>Primary Host</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div id="fallbackStatus" class="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                            <span>Fallback System</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div id="securityStatus" class="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                            <span>SSL/WSS Security</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="socket-test-result" class="mt-4 text-sm bg-black rounded p-3 max-h-80 overflow-y-auto font-mono">
                                    <div class="text-green-400">[SYSTEM] Socket monitoring panel ready...</div>
                                    <div class="text-gray-400">[INFO] Click any test button to begin monitoring</div>
                                </div>
                                
                                <!-- Socket Fallback Configuration Display -->
                                <div class="mt-6 pt-4 border-t border-gray-600">
                                    <h4 class="text-md font-semibold mb-3">Fallback Host Configuration</h4>
                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <span class="text-green-400 w-6">1.</span>
                                            <span class="font-mono text-white"><?php echo $systemStats['socket_config']['host']; ?></span>
                                            <span class="text-gray-400 ml-2">(Primary)</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-yellow-400 w-6">2.</span>
                                            <span class="font-mono text-white">
                                                <?php 
                                                $host = $systemStats['socket_config']['host'];
                                                if (strpos($host, 'www.') === 0) {
                                                    echo str_replace('www.', '', $host);
                                                } else if (!strpos($host, 'localhost')) {
                                                    echo 'www.' . $host;
                                                } else {
                                                    echo $host . ' (no fallback for localhost)';
                                                }
                                                ?>
                                            </span>
                                            <span class="text-gray-400 ml-2">(Fallback)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Docker Tab -->
                    <div id="content-docker" class="tab-content hidden">
                        <h2 class="text-2xl font-bold mb-6">Docker Container Status</h2>
                        
                        <div class="space-y-4">
                            <?php if (isset($healthCheck['checks']['docker_containers']['containers'])): ?>
                                <?php foreach ($healthCheck['checks']['docker_containers']['containers'] as $containerName => $containerInfo): ?>
                                <div class="bg-gray-700 rounded-lg p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <h3 class="text-lg font-semibold"><?php echo $containerName; ?></h3>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium
                                            <?php echo $containerInfo['status'] === 'running' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'; ?>">
                                            <?php echo strtoupper($containerInfo['status']); ?>
                                        </span>
                                    </div>
                                    <div class="text-sm text-gray-300 font-mono">
                                        <?php echo htmlspecialchars($containerInfo['details']); ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="bg-gray-700 rounded-lg p-4">
                                    <p class="text-gray-300"><?php echo $healthCheck['checks']['docker_containers']['message'] ?? 'Docker information not available'; ?></p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- SSL/Security Tab -->
                    <div id="content-ssl" class="tab-content hidden">
                        <h2 class="text-2xl font-bold mb-6">SSL Certificate & Security</h2>
                        
                        <div class="space-y-6">
                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">SSL Certificate Status</h3>
                                <pre class="text-sm text-gray-300 whitespace-pre-wrap"><?php echo json_encode($healthCheck['checks']['ssl_certificate'], JSON_PRETTY_PRINT); ?></pre>
                            </div>

                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3">Nginx Status</h3>
                                <pre class="text-sm text-gray-300 whitespace-pre-wrap"><?php echo json_encode($healthCheck['checks']['nginx_status'], JSON_PRETTY_PRINT); ?></pre>
                            </div>
                        </div>
                    </div>

                    <!-- Environment Comparison Tab -->
                    <div id="content-environment" class="tab-content hidden">
                        <h2 class="text-2xl font-bold mb-6">Environment Configuration Comparison</h2>
                        
                        <!-- Current Environment Status -->
                        <div class="bg-blue-800 rounded-lg p-4 mb-6">
                            <h3 class="text-lg font-semibold mb-2">Current Environment Status</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <span class="text-gray-300">Active Environment:</span>
                                    <span class="font-bold text-<?php echo $systemStats['environment']['app_env'] === 'production' ? 'red' : 'green'; ?>-400">
                                        <?php echo strtoupper($systemStats['environment']['app_env']); ?>
                                    </span>
                                </div>
                                <div>
                                    <span class="text-gray-300">Current Host:</span>
                                    <span class="font-bold text-white"><?php echo $_SERVER['HTTP_HOST'] ?? 'Unknown'; ?></span>
                                </div>
                                <div>
                                    <span class="text-gray-300">Socket Host:</span>
                                    <span class="font-bold text-white"><?php echo $systemStats['socket_config']['socket_host']; ?></span>
                                </div>
                            </div>
                        </div>

                        <!-- Configuration Comparison Table -->
                        <div class="bg-gray-700 rounded-lg p-4 mb-6">
                            <h3 class="text-lg font-semibold mb-4">Configuration Comparison</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr class="border-b border-gray-600">
                                            <th class="text-left py-2 px-3 text-gray-300">Configuration Key</th>
                                            <th class="text-left py-2 px-3 text-red-400">Production</th>
                                            <th class="text-left py-2 px-3 text-green-400">Development</th>
                                            <th class="text-left py-2 px-3 text-gray-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        // Get all unique keys from both environments
                                        $allKeys = array_unique(array_merge(array_keys($prodConfig), array_keys($devConfig)));
                                        sort($allKeys);
                                        
                                        foreach ($allKeys as $key):
                                            $prodValue = $prodConfig[$key] ?? '<span class="text-red-400">NOT SET</span>';
                                            $devValue = $devConfig[$key] ?? '<span class="text-red-400">NOT SET</span>';
                                            $isDifferent = $prodValue !== $devValue;
                                            $status = $isDifferent ? '⚠️' : '✅';
                                            $statusColor = $isDifferent ? 'text-yellow-400' : 'text-green-400';
                                        ?>
                                        <tr class="border-b border-gray-600 hover:bg-gray-600">
                                            <td class="py-2 px-3 font-mono text-blue-300"><?php echo htmlspecialchars($key); ?></td>
                                            <td class="py-2 px-3 font-mono text-red-300"><?php echo htmlspecialchars($prodValue); ?></td>
                                            <td class="py-2 px-3 font-mono text-green-300"><?php echo htmlspecialchars($devValue); ?></td>
                                            <td class="py-2 px-3 <?php echo $statusColor; ?>"><?php echo $status; ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Raw Configuration Files -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Production Configuration -->
                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3 text-red-400">🔥 Production (.env.production)</h3>
                                <div class="space-y-2 max-h-96 overflow-y-auto">
                                    <?php if (empty($prodConfig)): ?>
                                        <p class="text-red-400">⚠️ Production environment file not found or empty!</p>
                                    <?php else: ?>
                                        <?php foreach ($prodConfig as $key => $value): ?>
                                        <div class="flex justify-between items-start border-b border-gray-600 pb-1">
                                            <span class="text-gray-300 font-mono text-sm"><?php echo htmlspecialchars($key); ?>:</span>
                                            <span class="text-red-300 font-mono text-sm ml-2 break-all"><?php echo htmlspecialchars($value); ?></span>
                                        </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Development Configuration -->
                            <div class="bg-gray-700 rounded-lg p-4">
                                <h3 class="text-lg font-semibold mb-3 text-green-400">🛠️ Development (.env.development)</h3>
                                <div class="space-y-2 max-h-96 overflow-y-auto">
                                    <?php if (empty($devConfig)): ?>
                                        <p class="text-red-400">⚠️ Development environment file not found or empty!</p>
                                    <?php else: ?>
                                        <?php foreach ($devConfig as $key => $value): ?>
                                        <div class="flex justify-between items-start border-b border-gray-600 pb-1">
                                            <span class="text-gray-300 font-mono text-sm"><?php echo htmlspecialchars($key); ?>:</span>
                                            <span class="text-green-300 font-mono text-sm ml-2 break-all"><?php echo htmlspecialchars($value); ?></span>
                                        </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>

                        <!-- Environment Recommendations -->
                        <div class="bg-yellow-800 rounded-lg p-4 mt-6">
                            <h3 class="text-lg font-semibold mb-3 text-yellow-200">💡 Environment Recommendations</h3>
                            <ul class="text-yellow-100 space-y-2">
                                <li>• Ensure production uses HTTPS (APP_URL, SOCKET_PROTOCOL)</li>
                                <li>• Production should have APP_DEBUG=false for security</li>
                                <li>• Socket hosts should match the domain environment (www/non-www consistency)</li>
                                <li>• Database credentials should be different between environments</li>
                                <li>• Production should use secure session settings</li>
                            </ul>
                        </div>

                        <!-- Environment Validation -->
                        <div class="bg-purple-800 rounded-lg p-4 mt-6">
                            <h3 class="text-lg font-semibold mb-3 text-purple-200">🔍 Environment Validation</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Critical Settings Check -->
                                <div class="space-y-2">
                                    <h4 class="font-semibold text-purple-100">Critical Settings</h4>
                                    <?php
                                    $criticalChecks = [
                                        ['key' => 'APP_ENV', 'expected' => 'production', 'current' => $systemStats['environment']['app_env']],
                                        ['key' => 'APP_DEBUG', 'expected' => 'false', 'current' => $systemStats['environment']['app_debug']],
                                        ['key' => 'APP_URL', 'expected' => 'https://', 'current' => $prodConfig['APP_URL'] ?? '']
                                    ];
                                    
                                    foreach ($criticalChecks as $check):
                                        $isValid = false;
                                        if ($check['key'] === 'APP_URL') {
                                            $isValid = strpos($check['current'], 'https://') === 0;
                                        } else {
                                            $isValid = $check['current'] === $check['expected'];
                                        }
                                        $statusIcon = $isValid ? '✅' : '❌';
                                        $statusColor = $isValid ? 'text-green-400' : 'text-red-400';
                                    ?>
                                    <div class="flex items-center space-x-2">
                                        <span class="<?php echo $statusColor; ?>"><?php echo $statusIcon; ?></span>
                                        <span class="text-purple-100"><?php echo $check['key']; ?>:</span>
                                        <span class="font-mono text-sm <?php echo $statusColor; ?>"><?php echo htmlspecialchars($check['current']); ?></span>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                                
                                <!-- Domain Consistency Check -->
                                <div class="space-y-2">
                                    <h4 class="font-semibold text-purple-100">Domain Consistency</h4>
                                    <?php
                                    $appDomain = parse_url($prodConfig['APP_URL'] ?? '', PHP_URL_HOST);
                                    $socketDomain = $prodConfig['SOCKET_HOST'] ?? '';
                                    $domainsMatch = $appDomain === $socketDomain;
                                    $wwwConsistent = (strpos($appDomain, 'www.') === 0 && strpos($socketDomain, 'www.') === 0) ||
                                                   (strpos($appDomain, 'www.') !== 0 && strpos($socketDomain, 'www.') !== 0);
                                    ?>
                                    <div class="flex items-center space-x-2">
                                        <span class="<?php echo $domainsMatch ? 'text-green-400' : 'text-red-400'; ?>"><?php echo $domainsMatch ? '✅' : '❌'; ?></span>
                                        <span class="text-purple-100">APP_URL & SOCKET_HOST match</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="<?php echo $wwwConsistent ? 'text-green-400' : 'text-yellow-400'; ?>"><?php echo $wwwConsistent ? '✅' : '⚠️'; ?></span>
                                        <span class="text-purple-100">WWW consistency</span>
                                    </div>
                                    <div class="text-sm text-purple-200 mt-2">
                                        APP: <?php echo htmlspecialchars($appDomain); ?><br>
                                        Socket: <?php echo htmlspecialchars($socketDomain); ?>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="bg-indigo-800 rounded-lg p-4 mt-6">
                            <h3 class="text-lg font-semibold mb-3 text-indigo-200">⚡ Quick Actions</h3>
                            <div class="flex flex-wrap gap-3">
                                <button onclick="testEnvironmentSockets()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                                    Test Both Environment Sockets
                                </button>
                                <button onclick="copyEnvironmentDiff()" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
                                    Copy Differences to Clipboard
                                </button>
                                <button onclick="switchTab('socket')" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white">
                                    Go to Socket Testing
                                </button>
                            </div>
                            <div id="environment-test-results" class="mt-4 p-3 bg-gray-700 rounded hidden">
                                <h4 class="font-semibold mb-2">Test Results:</h4>
                                <div id="environment-test-content"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Remove active styling from all tab buttons
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('border-blue-500', 'text-blue-400');
                button.classList.add('border-transparent', 'text-gray-400');
            });
            
            // Show selected tab content
            document.getElementById('content-' + tabName).classList.remove('hidden');
            
            // Style active tab button
            const activeTab = document.getElementById('tab-' + tabName);
            activeTab.classList.remove('border-transparent', 'text-gray-400');
            activeTab.classList.add('border-blue-500', 'text-blue-400');
        }

        function testSocket() {
            const resultDiv = document.getElementById('socket-test-result');
            resultDiv.innerHTML = '<div class="text-yellow-400">🔄 Testing primary socket connection...</div>';
            
            const socketHost = <?php echo json_encode($systemStats['socket_config']['socket_host'] ?? 'localhost'); ?>;
            const socketSecure = <?php echo json_encode(strpos($systemStats['environment']['app_url'] ?? '', 'https://') === 0); ?>;
            const protocol = socketSecure ? 'wss://' : 'ws://';
            const socketUrl = protocol + socketHost + '/socket.io/';
            
            appendToResults(`🔍 Testing URL: ${socketUrl}`);
            
            try {
                const socket = io(socketUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    forceNew: true
                });
                
                const startTime = Date.now();
                
                socket.on('connect', () => {
                    const connectTime = Date.now() - startTime;
                    appendToResults(`✅ Primary socket connected successfully in ${connectTime}ms`);
                    appendToResults(`📊 Transport: ${socket.io.engine.transport.name}`);
                    socket.disconnect();
                });
                
                socket.on('connect_error', (error) => {
                    appendToResults(`❌ Primary socket connection failed: ${error.message}`);
                });
                
                setTimeout(() => {
                    if (!socket.connected) {
                        appendToResults(`⏰ Primary socket connection timeout (10s)`);
                        socket.disconnect();
                    }
                }, 10000);
                
            } catch (error) {
                appendToResults(`💥 Socket test error: ${error.message}`);
            }
        }

        function testSocketFallback() {
            const resultDiv = document.getElementById('socket-test-result');
            appendToResults('🔄 Testing fallback socket hosts...');
            
            const primaryHost = '<?php echo $systemStats['socket_config']['socket_host']; ?>';
            const socketSecure = <?php echo $systemStats['environment']['use_https'] === 'true' ? 'true' : 'false'; ?>;
            const protocol = socketSecure ? 'wss://' : 'ws://';
            
            // Generate fallback hosts
            const fallbackHosts = [];
            if (primaryHost.startsWith('www.')) {
                fallbackHosts.push(primaryHost.replace('www.', ''));
            } else if (!primaryHost.includes('localhost')) {
                fallbackHosts.push('www.' + primaryHost);
            }
            fallbackHosts.push(primaryHost);
            
            // Remove duplicates
            const uniqueHosts = [...new Set(fallbackHosts)];
            
            appendToResults(`📋 Testing ${uniqueHosts.length} host(s): ${uniqueHosts.join(', ')}`);
            
            let testCount = 0;
            uniqueHosts.forEach((host, index) => {
                const socketUrl = protocol + host + '/socket.io/';
                appendToResults(`\n🔍 [${index + 1}] Testing: ${socketUrl}`);
                
                try {
                    const socket = io(socketUrl, {
                        transports: ['websocket', 'polling'],
                        timeout: 8000,
                        forceNew: true
                    });
                    
                    const startTime = Date.now();
                    
                    socket.on('connect', () => {
                        const connectTime = Date.now() - startTime;
                        appendToResults(`✅ [${index + 1}] Connected in ${connectTime}ms (${socket.io.engine.transport.name})`);
                        socket.disconnect();
                        testCount++;
                    });
                    
                    socket.on('connect_error', (error) => {
                        appendToResults(`❌ [${index + 1}] Failed: ${error.message}`);
                        testCount++;
                    });
                    
                    setTimeout(() => {
                        if (!socket.connected) {
                            appendToResults(`⏰ [${index + 1}] Timeout`);
                            socket.disconnect();
                            testCount++;
                        }
                    }, 8000);
                    
                } catch (error) {
                    appendToResults(`💥 [${index + 1}] Error: ${error.message}`);
                    testCount++;
                }
            });
        }

        function testFullSocket() {
            appendToResults('🚀 Starting comprehensive socket test...');
            
            // Test primary first
            testSocket();
            
            // Wait a bit then test fallbacks
            setTimeout(() => {
                testSocketFallback();
            }, 2000);
            
            // Test HTTP endpoints
            setTimeout(() => {
                testSocketEndpoints();
            }, 4000);
        }

        function testSocketEndpoints() {
            appendToResults('\n🌐 Testing socket HTTP endpoints...');
            
            const socketHost = '<?php echo $systemStats['socket_config']['socket_host']; ?>';
            const socketSecure = <?php echo $systemStats['environment']['use_https'] === 'true' ? 'true' : 'false'; ?>;
            const protocol = socketSecure ? 'https://' : 'http://';
            
            const endpoints = [
                '/health',
                '/socket-health',
                '/socket.io/'
            ];
            
            endpoints.forEach(endpoint => {
                const url = protocol + socketHost + endpoint;
                appendToResults(`🔍 Testing HTTP: ${url}`);
                
                fetch(url, { 
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                })
                .then(response => {
                    appendToResults(`✅ HTTP ${endpoint}: Status ${response.status} (${response.statusText})`);
                })
                .catch(error => {
                    appendToResults(`❌ HTTP ${endpoint}: ${error.message}`);
                });
            });
        }

        function appendToResults(message) {
            const resultDiv = document.getElementById('socket-test-result');
            const timestamp = new Date().toLocaleTimeString();
            resultDiv.innerHTML += `<div class="text-gray-300">[${timestamp}] ${message}</div>`;
            resultDiv.scrollTop = resultDiv.scrollHeight;
        }

        function clearTestResults() {
            const resultDiv = document.getElementById('socket-test-result');
            resultDiv.innerHTML = '<div class="text-gray-500">Socket test results cleared. Click a test button to start testing.</div>';
        }

        function testEnvironmentSockets() {
            const resultsDiv = document.getElementById('environment-test-results');
            const contentDiv = document.getElementById('environment-test-content');
            
            resultsDiv.classList.remove('hidden');
            contentDiv.innerHTML = '<div class="text-yellow-400">🔄 Testing socket connections for both environments...</div>';
            
            const prodSocket = <?php echo json_encode($prodConfig['SOCKET_HOST'] ?? 'N/A'); ?>;
            const devSocket = <?php echo json_encode($devConfig['SOCKET_HOST'] ?? 'N/A'); ?>;
            const prodSecure = <?php echo json_encode(($prodConfig['SOCKET_SECURE'] ?? 'false') === 'true'); ?>;
            const devSecure = <?php echo json_encode(($devConfig['SOCKET_SECURE'] ?? 'false') === 'true'); ?>;
            
            let results = [];
            
            // Test production socket
            if (prodSocket !== 'N/A') {
                const prodProtocol = prodSecure ? 'wss://' : 'ws://';
                const prodUrl = prodProtocol + prodSocket + '/socket.io/';
                results.push(`🔥 Production: Testing ${prodUrl}`);
                
                try {
                    const prodSocketTest = io(prodUrl, { timeout: 5000 });
                    prodSocketTest.on('connect', () => {
                        results.push('✅ Production socket: Connected successfully');
                        prodSocketTest.disconnect();
                        updateResults();
                    });
                    prodSocketTest.on('connect_error', (error) => {
                        results.push(`❌ Production socket: ${error.message}`);
                        updateResults();
                    });
                } catch (error) {
                    results.push(`❌ Production socket: ${error.message}`);
                }
            }
            
            // Test development socket
            if (devSocket !== 'N/A') {
                const devProtocol = devSecure ? 'wss://' : 'ws://';
                const devUrl = devProtocol + devSocket + ':' + <?php echo json_encode($devConfig['SOCKET_PORT'] ?? '3001'); ?> + '/socket.io/';
                results.push(`🛠️ Development: Testing ${devUrl}`);
                
                try {
                    const devSocketTest = io(devUrl, { timeout: 5000 });
                    devSocketTest.on('connect', () => {
                        results.push('✅ Development socket: Connected successfully');
                        devSocketTest.disconnect();
                        updateResults();
                    });
                    devSocketTest.on('connect_error', (error) => {
                        results.push(`❌ Development socket: ${error.message}`);
                        updateResults();
                    });
                } catch (error) {
                    results.push(`❌ Development socket: ${error.message}`);
                }
            }
            
            function updateResults() {
                contentDiv.innerHTML = results.map(result => `<div>${result}</div>`).join('');
            }
            
            // Initial update
            updateResults();
            
            // Add timeout for final results
            setTimeout(() => {
                if (!results.some(r => r.includes('✅') || r.includes('❌'))) {
                    results.push('⏰ Timeout: No response from socket servers');
                    updateResults();
                }
            }, 10000);
        }
        
        function copyEnvironmentDiff() {
            const prodConfig = <?php echo json_encode($prodConfig); ?>;
            const devConfig = <?php echo json_encode($devConfig); ?>;
            
            let differences = "=== MisVord Environment Configuration Differences ===\n\n";
            
            const allKeys = [...new Set([...Object.keys(prodConfig), ...Object.keys(devConfig)])].sort();
            
            allKeys.forEach(key => {
                const prodValue = prodConfig[key] || 'NOT_SET';
                const devValue = devConfig[key] || 'NOT_SET';
                
                if (prodValue !== devValue) {
                    differences += `${key}:\n`;
                    differences += `  Production:  ${prodValue}\n`;
                    differences += `  Development: ${devValue}\n\n`;
                }
            });
            
            if (differences === "=== MisVord Environment Configuration Differences ===\n\n") {
                differences += "No differences found between environments.\n";
            }
            
            navigator.clipboard.writeText(differences).then(() => {
                alert('Environment differences copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                // Fallback: show in modal or new window
                const newWindow = window.open('', '_blank');
                newWindow.document.write(`<pre>${differences}</pre>`);
            });
        }

        // Auto-refresh and live monitoring
        let autoRefreshEnabled = true;
        let autoRefreshInterval;

        function updateCurrentTime() {
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = new Date().toLocaleString();
            }
        }

        function toggleAutoRefresh() {
            const btn = document.getElementById('autoRefreshBtn');
            autoRefreshEnabled = !autoRefreshEnabled;
            
            if (autoRefreshEnabled) {
                btn.textContent = 'Auto-Refresh: ON';
                btn.className = 'bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white';
                startAutoRefresh();
            } else {
                btn.textContent = 'Auto-Refresh: OFF';
                btn.className = 'bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm text-white';
                clearInterval(autoRefreshInterval);
            }
        }

        function startAutoRefresh() {
            autoRefreshInterval = setInterval(() => {
                if (autoRefreshEnabled) {
                    location.reload();
                }
            }, 30000);
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Update time every second
            setInterval(updateCurrentTime, 1000);
            
            // Start auto-refresh
            if (autoRefreshEnabled) {
                startAutoRefresh();
            }
            
            // Initialize socket test results
            const resultDiv = document.getElementById('socket-test-result');
            if (resultDiv && !resultDiv.innerHTML.trim()) {
                resultDiv.innerHTML = '<div class="text-gray-500">Ready for socket testing. Click a test button above to begin.</div>';
            }
        });
    </script>

    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
</body>
</html>