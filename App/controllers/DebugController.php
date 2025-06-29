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
                EnvLoader::get('DB_PASS', 'kolin123'),
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
        error_log("=== DEBUG SOCKET INPUT TEST ===");
        error_log("Request Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN'));
        error_log("Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'UNKNOWN'));
        error_log("Raw Input: " . file_get_contents('php://input'));
        
        $input = $this->getInput();
        error_log("Parsed Input: " . json_encode($input));
        
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0 || strpos($key, 'X_') !== false) {
                $headers[$key] = $value;
            }
        }
        error_log("Headers: " . json_encode($headers));
        
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
            
            // Test 1: Direct database query for titibot
            $directQuery = $query->query("SELECT * FROM users WHERE username = 'titibot'");
            
            // Test 2: Case insensitive search
            $caseInsensitive = $query->query("SELECT * FROM users WHERE LOWER(username) = 'titibot'");
            
            // Test 3: All users with 'titi' in name
            $similarUsers = $query->query("SELECT id, username, status, email FROM users WHERE username LIKE '%titi%'");
            
            // Test 4: All bot users
            $allBots = $query->query("SELECT id, username, status, email FROM users WHERE status = 'bot'");
            
            // Test 5: User repository method
            $repoResult = $userRepo->findByUsername('titibot');
            
            // Test 6: Check if user 1004 exists
            $user1004 = $query->query("SELECT * FROM users WHERE id = 1004");
            
            // Test 7: Database connection info
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
}
