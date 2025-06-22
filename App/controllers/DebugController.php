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
}
