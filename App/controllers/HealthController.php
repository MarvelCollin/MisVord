<?php

require_once __DIR__ . '/BaseController.php';

class HealthController extends BaseController
{
    public function __construct()
    {
        parent::__construct();
    }

    public function check()
    {
        try {
            $health = [
                'status' => 'healthy',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0.0',
                'components' => []
            ];
            try {
                $query = $this->query();
                $result = $query->raw("SELECT 1 AS test");
                $health['components']['database'] = [
                    'status' => 'healthy',
                    'message' => 'Database connection successful'
                ];
            } catch (Exception $e) {
                $health['components']['database'] = [
                    'status' => 'unhealthy',
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ];
                $health['status'] = 'degraded';
            }            try {
                $socketHost = 'socket';
                $socketPort = getenv('SOCKET_PORT') ?: '1002';
                $socketUrl = "http://{$socketHost}:{$socketPort}/health";
                $context = stream_context_create([
                    'http' => [
                        'timeout' => 5,
                        'method' => 'GET'
                    ]
                ]);

                $result = @file_get_contents($socketUrl, false, $context);

                if ($result !== false) {
                    $socketResponse = json_decode($result, true);
                    $health['components']['socket_server'] = [
                        'status' => 'healthy',
                        'message' => 'Socket server responding',
                        'connections' => $socketResponse['connections'] ?? 0
                    ];
                } else {
                    $health['components']['socket_server'] = [
                        'status' => 'unhealthy',
                        'message' => 'Socket server not responding'
                    ];
                    $health['status'] = 'degraded';
                }
            } catch (Exception $e) {
                $health['components']['socket_server'] = [
                    'status' => 'unhealthy',
                    'message' => 'Socket server check failed: ' . $e->getMessage()
                ];
                $health['status'] = 'degraded';
            }

            $directories = [
                'storage' => '/var/www/html/storage',
                'logs' => '/var/www/html/logs',
                'public' => '/var/www/html/public'
            ];

            foreach ($directories as $name => $path) {
                if (is_dir($path) && is_writable($path)) {
                    $health['components'][$name] = [
                        'status' => 'healthy',
                        'message' => 'Directory accessible and writable'
                    ];
                } else {
                    $health['components'][$name] = [
                        'status' => 'unhealthy',
                        'message' => 'Directory not accessible or not writable'
                    ];
                    $health['status'] = 'degraded';
                }
            }

            $httpStatus = $health['status'] === 'healthy' ? 200 : 503;
            http_response_code($httpStatus);

            header('Content-Type: application/json');
            echo json_encode($health, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'unhealthy',
                'message' => 'Health check failed: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_PRETTY_PRINT);
        }
    }

    public function socketStatus()
    {
        try {
            $socketHost = $_ENV['SOCKET_HOST'] ?? 'localhost';
            $socketPort = $_ENV['SOCKET_PORT'] ?? '1002';

            $endpoints = [
                'health' => "/api/health",
                'stats' => "/api/stats",
                'online_users' => "/api/online-users"
            ];

            $results = [];

            foreach ($endpoints as $name => $endpoint) {
                $url = "http://{$socketHost}:{$socketPort}{$endpoint}";
                $context = stream_context_create([
                    'http' => [
                        'timeout' => 5,
                        'method' => 'GET'
                    ]
                ]);

                $result = @file_get_contents($url, false, $context);

                if ($result !== false) {
                    $results[$name] = json_decode($result, true);
                } else {
                    $results[$name] = ['error' => 'Endpoint not responding'];
                }
            }

            header('Content-Type: application/json');
            echo json_encode([
                'socket_host' => $socketHost,
                'socket_port' => $socketPort,
                'endpoints' => $results,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Socket status check failed: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_PRETTY_PRINT);
        }
    }

    public function checkHealth()
    {
        $this->success(['status' => 'ok', 'time' => time()]);
    }

    public function ping()
    {
        $startTime = microtime(true);
        
        $serverLoad = function_exists('sys_getloadavg') ? sys_getloadavg() : [0, 0, 0];
        $memoryUsage = memory_get_usage(true);
        $networkName = $this->getNetworkName();
        
        $processingTime = (microtime(true) - $startTime) * 1000;
        
        header('Content-Type: application/json');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        
        echo json_encode([
            'status' => 'ok', 
            'timestamp' => microtime(true),
            'server_time' => time(),
            'processing_time_ms' => round($processingTime, 2),
            'server_load' => $serverLoad[0],
            'memory_usage_mb' => round($memoryUsage / 1024 / 1024, 2),
            'network_name' => $networkName
        ]);
    }

    public function getNetworkInfo()
    {
        $networkName = $this->getNetworkName();
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $hostname = gethostbyaddr($ipAddress);
        
        header('Content-Type: application/json');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        
        echo json_encode([
            'status' => 'ok',
            'network_name' => $networkName,
            'ip_address' => $ipAddress,
            'hostname' => $hostname,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'time' => time()
        ]);
    }
    
    private function getNetworkName()
    {
        $networkName = 'Unknown';
        
        if (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
            return 'Local Development';
        }
        
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
        if ($ipAddress) {
            $hostname = gethostbyaddr($ipAddress);
            if ($hostname && $hostname !== $ipAddress) {
                $parts = explode('.', $hostname);
                if (count($parts) >= 2) {
                    $domain = $parts[count($parts) - 2];
                    if (strlen($domain) > 3) {
                        $networkName = ucfirst($domain);
                    }
                }
            }
        }
        
        $xForwardedFor = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($xForwardedFor && strpos($xForwardedFor, ',') !== false) {
            $networkName = 'Network via Proxy';
        }
        
        return $networkName;
    }
}
