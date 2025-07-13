<?php

require_once dirname(__DIR__) . '/database/repositories/UserRepository.php';

class DebugController extends BaseController
{
    private $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }
    public function getDatabaseDebugInfo()
    {
        $debugInfo = '';

        ob_start();
        try {
            require_once dirname(__DIR__) . '/database/query.php';
            require_once dirname(__DIR__) . '/config/env.php';

            $isDocker = (
                getenv('IS_DOCKER') === 'true' || 
                isset($_SERVER['IS_DOCKER']) || 
                getenv('CONTAINER') !== false ||
                isset($_SERVER['CONTAINER']) ||
                file_exists('/.dockerenv')
            );

            $dbHost = $isDocker ? 'db' : EnvLoader::get('DB_HOST', 'localhost');
            $port = EnvLoader::get('DB_PORT', '3306');
            $dbname = EnvLoader::get('DB_NAME', 'misvord');
            $dsn = "mysql:host=" . $dbHost . ";port=" . $port .
                ";dbname=" . $dbname . ";charset=" . EnvLoader::get('DB_CHARSET', 'utf8mb4');

            echo '<div class="bg-blue-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-36">';
            echo '<strong>Database Connection Settings:</strong><br>';
            echo 'Host: ' . $dbHost . '<br>';
            echo 'Port: ' . $port . '<br>';
            echo 'Database: ' . $dbname . '<br>';
            echo 'User: ' . EnvLoader::get('DB_USER', 'root') . '<br>';
            echo 'Docker: ' . ($isDocker ? 'Yes' : 'No') . '<br>';
            echo '</div>';

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_PERSISTENT => false,
            ];

            $pdo = new PDO(
                $dsn,
                EnvLoader::get('DB_USER', 'root'),
                EnvLoader::get('DB_PASS', ''),
                $options
            );

            $stmt = $pdo->query("SELECT 1 AS test_connection");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            echo '<div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center">
                Database connection successful! Server: ' . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . '
            </div>';

            $tableExists = $this->userRepository->createTable();

            echo '<div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center">
                User table ' . ($tableExists ? 'exists' : 'creation attempted') . '!
            </div>';
        } catch (PDOException $e) {
            echo '<div class="bg-red-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-64">';
            echo '<strong>Database Error:</strong><br>';
            echo 'Error Code: ' . $e->getCode() . '<br>';
            echo 'Message: ' . $e->getMessage() . '<br>';

            switch ($e->getCode()) {
                case 1049:
                    echo '<br><strong>Hint:</strong> Database "' . EnvLoader::get('DB_NAME', 'misvord') . '" does not exist. Create it using:<br>';
                    echo '<code>CREATE DATABASE ' . EnvLoader::get('DB_NAME', 'misvord') . ';</code>';
                    break;
                case 1045:
                    echo '<br><strong>Hint:</strong> Access denied. Check username and password.';
                    break;
                case 2002:
                    echo '<br><strong>Hint:</strong> Cannot connect to MySQL server. Is it running?';
                    break;
            }

            echo '</div>';
        } catch (Exception $e) {
            echo '<div class="bg-red-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-64">';
            echo '<strong>General Error:</strong><br>';
            echo 'Type: ' . get_class($e) . '<br>';
            echo 'Message: ' . $e->getMessage() . '<br>';
            echo 'File: ' . $e->getFile() . ' (Line ' . $e->getLine() . ')<br>';
            echo '</div>';
        }

        $debugInfo = ob_get_clean();
        return $debugInfo;
    }
    public function initializeDatabase()
    {
        try {
            require_once dirname(__DIR__) . '/database/query.php';
            $this->userRepository->initialize();
            return true;
        } catch (Exception $e) {
            log_error("Error initializing database", ['error' => $e->getMessage()]);
            return false;
        }
    }
    public function testSocketInput()
    {
                                        $input = $this->getInput();
                $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0 || strpos($key, 'X_') !== false) {
                $headers[$key] = $value;
            }
        }
                return $this->success([
            'raw_input' => file_get_contents('php://input'),
            'parsed_input' => $input,
            'headers' => $headers,
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'UNKNOWN'
        ]);
    }
    public function botDebug()
    {
        header('Content-Type: application/json');

        try {
            require_once __DIR__ . '/../database/repositories/UserRepository.php';
            require_once __DIR__ . '/../database/query.php';

            $userRepo = new UserRepository();
            $query = new Query();

            $directQuery = $query->query("SELECT * FROM users WHERE username = 'titibot'");

            $caseInsensitive = $query->query("SELECT * FROM users WHERE LOWER(username) = 'titibot'");

            $similarUsers = $query->query("SELECT id, username, status, email FROM users WHERE username LIKE '%titi%'");

            $allBots = $query->query("SELECT id, username, status, email FROM users WHERE status = 'bot'");

            $repoResult = $userRepo->findByUsername('titibot');

            $user1004 = $query->query("SELECT * FROM users WHERE id = 1004");

            $tables = $query->query("SHOW TABLES");
            $userTableInfo = $query->query("DESCRIBE users");

            echo json_encode([
                'success' => true,
                'debug_data' => [
                    'direct_query_result' => $directQuery,
                    'case_insensitive_result' => $caseInsensitive,
                    'similar_users' => $similarUsers,
                    'all_bots' => $allBots,
                    'repository_result' => $repoResult ? [
                        'id' => $repoResult->id,
                        'username' => $repoResult->username,
                        'status' => $repoResult->status,
                        'email' => $repoResult->email
                    ] : null,
                    'user_1004' => $user1004,
                    'database_info' => [
                        'tables_count' => count($tables),
                        'users_table_columns' => array_column($userTableInfo, 'Field')
                    ]
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_PRETTY_PRINT);

        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], JSON_PRETTY_PRINT);
        }

        exit;
    }
    public function getSystemStats()
    {
        require_once dirname(__DIR__) . '/config/env.php';
        
        return [
            'server_info' => [
                'php_version' => PHP_VERSION,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'localhost',
                'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
                'request_time' => date('Y-m-d H:i:s', $_SERVER['REQUEST_TIME'] ?? time()),
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size')
            ],
            'environment' => [
                'app_env' => EnvLoader::get('APP_ENV', 'development'),
                'app_debug' => EnvLoader::get('APP_DEBUG', 'true'),
                'app_url' => EnvLoader::get('APP_URL', 'http://localhost'),
                'is_docker' => getenv('IS_DOCKER') === 'true' ? 'true' : 'false',
                'is_vps' => EnvLoader::get('IS_VPS', 'false'),
                'timezone' => date_default_timezone_get()
            ],
            'socket_config' => [
                'socket_host' => EnvLoader::get('SOCKET_HOST', 'localhost'),
                'socket_port' => EnvLoader::get('SOCKET_PORT', '3001'),
                'socket_protocol' => EnvLoader::get('SOCKET_PROTOCOL', 'http')
            ]
        ];
    }

    public function getVpsHealthCheck()
    {
        $checks = [];
        
        // Database health check
        try {
            require_once dirname(__DIR__) . '/database/query.php';
            $query = new Query();
            $userCount = $query->query("SELECT COUNT(*) as count FROM users");
            $checks['database'] = [
                'status' => 'healthy',
                'message' => 'Database connection successful',
                'stats' => [
                    'total_users' => $userCount[0]['count'] ?? 0
                ]
            ];
        } catch (Exception $e) {
            $checks['database'] = [
                'status' => 'unhealthy',
                'message' => $e->getMessage()
            ];
        }
        
        // Socket server health check
        $socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
        $socketPort = EnvLoader::get('SOCKET_PORT', '3001');
        $isProduction = EnvLoader::get('APP_ENV', 'development') === 'production';
        $isVps = EnvLoader::get('IS_VPS', 'false') === 'true';
        $isDocker = getenv('IS_DOCKER') === 'true';
        
        // For Docker environment, use internal service name and port
        if ($isDocker) {
            $healthCheckUrl = "http://socket:1002/health";
        } else {
            // For local development or direct VPS access
            $protocol = 'http';
            $healthCheckUrl = "{$protocol}://{$socketHost}:{$socketPort}/health";
        }
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'method' => 'GET'
            ]
        ]);
        
        $response = @file_get_contents($healthCheckUrl, false, $context);
        if ($response !== false) {
            $checks['socket_server'] = [
                'status' => 'healthy',
                'message' => 'Socket server responding',
                'url' => $healthCheckUrl
            ];
        } else {
            $checks['socket_server'] = [
                'status' => 'unhealthy',
                'message' => 'Socket server not responding',
                'url' => $healthCheckUrl
            ];
        }
        
        // Disk space check
        $totalBytes = disk_total_space('.');
        $freeBytes = disk_free_space('.');
        $usedBytes = $totalBytes - $freeBytes;
        $usedPercent = round(($usedBytes / $totalBytes) * 100, 1);
        
        $checks['disk_space'] = [
            'status' => $usedPercent > 90 ? 'critical' : ($usedPercent > 70 ? 'warning' : 'healthy'),
            'used_percent' => $usedPercent,
            'used_gb' => round($usedBytes / (1024 * 1024 * 1024), 2),
            'total_gb' => round($totalBytes / (1024 * 1024 * 1024), 2),
            'free_gb' => round($freeBytes / (1024 * 1024 * 1024), 2)
        ];
        
        // Add SSL and nginx checks to health check
        $checks['ssl_certificate'] = $this->checkSslCertificate();
        $checks['nginx_status'] = $this->checkNginxStatus();
        
        return [
            'checks' => $checks,
            'overall_status' => $this->determineOverallHealth($checks),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function determineOverallHealth($checks)
    {
        $statuses = array_column($checks, 'status');
        
        if (in_array('critical', $statuses) || in_array('unhealthy', $statuses)) {
            return 'unhealthy';
        } elseif (in_array('warning', $statuses)) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }
    
    private function checkSslCertificate()
    {
        require_once dirname(__DIR__) . '/config/env.php';
        $appUrl = EnvLoader::get('APP_URL', 'http://localhost');
        $domain = parse_url($appUrl, PHP_URL_HOST);
        
        if (!$domain || strpos($appUrl, 'https://') !== 0) {
            return [
                'status' => 'not_applicable',
                'message' => 'HTTPS not configured or local development',
                'domain' => $domain
            ];
        }
        
        try {
            $context = stream_context_create([
                'ssl' => [
                    'capture_peer_cert' => true,
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);
            
            $stream = @stream_socket_client(
                "ssl://{$domain}:443",
                $errno,
                $errstr,
                10,
                STREAM_CLIENT_CONNECT,
                $context
            );
            
            if (!$stream) {
                return [
                    'status' => 'error',
                    'message' => "Failed to connect: {$errstr} ({$errno})",
                    'domain' => $domain
                ];
            }
            
            $cert = stream_context_get_params($stream)['options']['ssl']['peer_certificate'];
            $certInfo = openssl_x509_parse($cert);
            
            $validFrom = date('Y-m-d H:i:s', $certInfo['validFrom_time_t']);
            $validTo = date('Y-m-d H:i:s', $certInfo['validTo_time_t']);
            $daysUntilExpiry = floor(($certInfo['validTo_time_t'] - time()) / 86400);
            
            fclose($stream);
            
            return [
                'status' => $daysUntilExpiry > 30 ? 'healthy' : ($daysUntilExpiry > 7 ? 'warning' : 'critical'),
                'domain' => $domain,
                'issuer' => $certInfo['issuer']['CN'] ?? 'Unknown',
                'subject' => $certInfo['subject']['CN'] ?? 'Unknown',
                'valid_from' => $validFrom,
                'valid_to' => $validTo,
                'days_until_expiry' => $daysUntilExpiry,
                'fingerprint' => openssl_x509_fingerprint($cert)
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
                'domain' => $domain
            ];
        }
    }
    
    private function checkNginxStatus()
    {
        // Check if nginx is running (works on Linux/VPS)
        $nginxRunning = false;
        $nginxConfig = 'Unknown';
        
        if (function_exists('shell_exec') && !in_array('shell_exec', explode(',', ini_get('disable_functions')))) {
            // Check if nginx process is running
            $processes = @shell_exec('pgrep nginx 2>/dev/null | wc -l');
            $nginxRunning = $processes !== null && (int)trim($processes) > 0;
            
            // Try to get nginx config test
            $configTest = @shell_exec('nginx -t 2>&1');
            if ($configTest !== null) {
                $nginxConfig = trim($configTest);
            }
        }
        
        return [
            'status' => $nginxRunning ? 'healthy' : 'unknown',
            'running' => $nginxRunning,
            'config_test' => $nginxConfig,
            'note' => 'nginx status detection works only on Linux/VPS with shell access'
        ];
    }
}
