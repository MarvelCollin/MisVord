<?php


class AppLogger {
    const LEVEL_DEBUG = 1;
    const LEVEL_INFO = 2;
    const LEVEL_WARNING = 3;
    const LEVEL_ERROR = 4;
    const LEVEL_CRITICAL = 5;

    private static $instance = null;
    private $logDir;
    private $logFile;
    private $displayErrors;
    private $logToFile;
    private $maxFileSize;
    private $maxFiles;

    private function __construct() {
        $this->logDir = APP_ROOT . '/logs';
        $this->logFile = $this->logDir . '/app_' . date('Y-m-d') . '.log';
        $this->displayErrors = true;
        $this->logToFile = true;
        $this->maxFileSize = 10 * 1024 * 1024; 
        $this->maxFiles = 30; 

        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }

        $this->rotateLogsIfNeeded();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function configure($displayErrors = true, $logToFile = true) {
        $this->displayErrors = $displayErrors;
        $this->logToFile = $logToFile;
        return $this;
    }

    public function debug($message, $context = []) {
        $this->log(self::LEVEL_DEBUG, $message, $context);
    }

    public function info($message, $context = []) {
        $this->log(self::LEVEL_INFO, $message, $context);
    }

    public function warning($message, $context = []) {
        $this->log(self::LEVEL_WARNING, $message, $context);
    }

    public function error($message, $context = []) {
        $this->log(self::LEVEL_ERROR, $message, $context);
    }

    public function critical($message, $context = []) {
        $this->log(self::LEVEL_CRITICAL, $message, $context);
    }

    public function exception(Throwable $exception, $context = []) {
        $message = sprintf(
            "Exception: %s in %s:%d\nStack trace:\n%s",
            $exception->getMessage(),
            $exception->getFile(),
            $exception->getLine(),
            $exception->getTraceAsString()
        );
        
        $context['exception_class'] = get_class($exception);
        $context['exception_code'] = $exception->getCode();
        
        $this->log(self::LEVEL_ERROR, $message, $context);
    }

    public function apiRequest($method, $path, $statusCode, $duration = null, $context = []) {
        $message = sprintf(
            "API Request: %s %s - Status: %d%s",
            $method,
            $path,
            $statusCode,
            $duration ? sprintf(" - Duration: %.2fms", $duration * 1000) : ""
        );
        
        $context['api_method'] = $method;
        $context['api_path'] = $path;
        $context['api_status'] = $statusCode;
        if ($duration) {
            $context['api_duration'] = $duration;
        }
        
        $level = $statusCode >= 500 ? self::LEVEL_ERROR : 
                ($statusCode >= 400 ? self::LEVEL_WARNING : self::LEVEL_INFO);
        
        $this->log($level, $message, $context);
    }

    public function dbQuery($query, $duration = null, $error = null, $context = []) {
        if ($error) {
            $message = sprintf("DB Error: %s - Query: %s", $error, $query);
            $context['db_error'] = $error;
            $level = self::LEVEL_ERROR;
        } else {
            $message = sprintf(
                "DB Query: %s%s",
                substr($query, 0, 100) . (strlen($query) > 100 ? '...' : ''),
                $duration ? sprintf(" - Duration: %.2fms", $duration * 1000) : ""
            );
            $level = self::LEVEL_DEBUG;
        }
        
        $context['db_query'] = $query;
        if ($duration) {
            $context['db_duration'] = $duration;
        }
        
        $this->log($level, $message, $context);
    }

    private function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $levelName = $this->getLevelName($level);
        $requestId = $this->getRequestId();
        
        $contextStr = '';
        if (!empty($context)) {
            $contextStr = ' - Context: ' . json_encode($context, JSON_UNESCAPED_SLASHES);
        }
        
        $logEntry = sprintf(
            "[%s] %s [%s] %s%s\n",
            $timestamp,
            $levelName,
            $requestId,
            $message,
            $contextStr
        );
        
        if ($this->logToFile) {
            file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        }
        
        if ($this->displayErrors && $level >= self::LEVEL_ERROR) {
            $this->displayError($levelName, $message, $context);
        }
        
        if ($level >= self::LEVEL_CRITICAL) {
            error_log($message);
        }
    }

    private function displayError($levelName, $message, $context = []) {
        if (php_sapi_name() !== 'cli') {
            $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
                     strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
            
            if ($isAjax || strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
                header("X-Error-Level: {$levelName}");
                header("X-Error-Message: " . base64_encode($message));
            } else {
                echo $this->formatWebError($levelName, $message, $context);
            }
        } else {
            echo "[$levelName] $message\n";
        }
    }

    private function formatWebError($levelName, $message, $context = []) {
        $color = $levelName === 'ERROR' ? '#ff4444' : '#ff8800';
        $contextStr = !empty($context) ? '<pre>' . htmlspecialchars(json_encode($context, JSON_PRETTY_PRINT)) . '</pre>' : '';
        
        return sprintf(
            '<div style="position: fixed; top: 10px; right: 10px; background: %s; color: white; padding: 15px; border-radius: 5px; max-width: 400px; z-index: 99999; font-family: monospace; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <strong>[%s]</strong><br>
                %s
                %s
                <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 16px; margin-top: -5px;">&times;</button>
            </div>',
            $color,
            $levelName,
            htmlspecialchars($message),
            $contextStr
        );
    }

    private function getLevelName($level) {
        switch ($level) {
            case self::LEVEL_DEBUG: return 'DEBUG';
            case self::LEVEL_INFO: return 'INFO';
            case self::LEVEL_WARNING: return 'WARNING';
            case self::LEVEL_ERROR: return 'ERROR';
            case self::LEVEL_CRITICAL: return 'CRITICAL';
            default: return 'UNKNOWN';
        }
    }   
    public function getRequestId() {
        static $requestId = null;
        if ($requestId === null) {
            $requestId = substr(uniqid(), -6);
        }
        return $requestId;
    }

    private function rotateLogsIfNeeded() {
        if (file_exists($this->logFile) && filesize($this->logFile) > $this->maxFileSize) {
            $rotatedFile = $this->logFile . '.' . time();
            rename($this->logFile, $rotatedFile);
        }
        
        $this->cleanOldLogs();
    }

    private function cleanOldLogs() {
        $files = glob($this->logDir . '/app_*.log*');
        if (count($files) > $this->maxFiles) {
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            $filesToDelete = array_slice($files, 0, count($files) - $this->maxFiles);
            foreach ($filesToDelete as $file) {
                unlink($file);
            }
        }
    }

    public function getRecentLogs($lines = 100) {
        if (!file_exists($this->logFile)) {
            return [];
        }
        
        $file = file($this->logFile);
        return array_slice($file, -$lines);
    }

    public function clearLogs() {
        $files = glob($this->logDir . '/app_*.log*');
        foreach ($files as $file) {
            unlink($file);
        }
    }
}

if (!function_exists('logger')) {
    function logger() {
        return AppLogger::getInstance();
    }
}

if (!function_exists('log_error')) {
    function log_error($message, $context = []) {
        AppLogger::getInstance()->error($message, $context);
    }
}

if (!function_exists('log_info')) {
    function log_info($message, $context = []) {
        AppLogger::getInstance()->info($message, $context);
    }
}

if (!function_exists('log_debug')) {
    function log_debug($message, $context = []) {
        AppLogger::getInstance()->debug($message, $context);
    }
}

if (!function_exists('log_exception')) {
    function log_exception(Throwable $exception, $context = []) {
        AppLogger::getInstance()->exception($exception, $context);
    }
}

if (!function_exists('log_warning')) {
    function log_warning($message, $context = []) {
        AppLogger::getInstance()->warning($message, $context);
    }
}
