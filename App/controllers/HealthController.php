<?php

require_once __DIR__ . '/BaseController.php';

class HealthController extends BaseController
{

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
                $socketHost = 'socket';  // Use Docker service name
                $socketPort = $_ENV['SOCKET_PORT'] ?? '1002';

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

            // Check essential directories
            $directories = [
                'logs' => __DIR__ . '/../logs',
                'storage' => __DIR__ . '/../storage',
                'views' => __DIR__ . '/../views'
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
}
