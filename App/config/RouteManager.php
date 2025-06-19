<?php

require_once __DIR__ . '/ConfigManager.php';

class RouteManager {
    private static $instance = null;
    private $routes = [];
    private $middleware = [];
    private $config;
    private $currentPrefix = '';
    private $currentMiddleware = [];
    
    private function __construct() {
        $this->config = ConfigManager::getInstance();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function get($pattern, $handler, $middleware = []) {
        return $this->add('GET', $pattern, $handler, $middleware);
    }
    
    public function post($pattern, $handler, $middleware = []) {
        return $this->add('POST', $pattern, $handler, $middleware);
    }
    
    public function put($pattern, $handler, $middleware = []) {
        return $this->add('PUT', $pattern, $handler, $middleware);
    }
    
    public function delete($pattern, $handler, $middleware = []) {
        return $this->add('DELETE', $pattern, $handler, $middleware);
    }
    
    public function options($pattern, $handler, $middleware = []) {
        return $this->add('OPTIONS', $pattern, $handler, $middleware);
    }
    
    private function add($method, $pattern, $handler, $middleware = []) {
        $routeKey = $method . ':' . $pattern;
        $this->routes[$routeKey] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware
        ];
        return $this;
    }
    
    public function group($prefix, $callback, $middleware = []) {
        $originalPrefix = $this->currentPrefix ?? '';
        $originalMiddleware = $this->currentMiddleware ?? [];
        
        $this->currentPrefix = $originalPrefix . $prefix;
        $this->currentMiddleware = array_merge($originalMiddleware, $middleware);
        
        $callback($this);
        
        $this->currentPrefix = $originalPrefix;
        $this->currentMiddleware = $originalMiddleware;
        
        return $this;
    }
    
    public function middleware($name, $callback) {
        $this->middleware[$name] = $callback;
        return $this;
    }
    
    public function resolve() {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];
        
        $uri = '/' . trim($uri, '/');
        if ($uri === '//') {
            $uri = '/';
        }
        
        foreach ($this->routes as $routeKey => $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            
            $pattern = $route['pattern'];
            $regex = $this->patternToRegex($pattern);
            
            if (preg_match($regex, $uri, $matches)) {
                array_shift($matches);
                
                try {
                    $this->runMiddleware($route['middleware']);
                    
                    if (is_string($route['handler'])) {
                        if (strpos($route['handler'], '.php') !== false) {
                            $this->includeView($route['handler']);
                        } else {
                            $this->callControllerMethod($route['handler'], $matches);
                        }
                    } elseif (is_callable($route['handler'])) {
                        call_user_func_array($route['handler'], $matches);
                    }
                    
                    return true;
                } catch (Exception $e) {
                    $this->handleError($e);
                    return false;
                }
            }
        }
        
        $this->handle404();
        return false;
    }
    
    private function patternToRegex($pattern) {
        $pattern = preg_replace('/\(([^)]+)\)/', '([^/]+)', $pattern);
        $pattern = str_replace('/', '\/', $pattern);
        return '/^' . $pattern . '$/';
    }
    
    private function runMiddleware($middlewareNames) {
        foreach ($middlewareNames as $name) {
            if (isset($this->middleware[$name])) {
                $result = call_user_func($this->middleware[$name]);
                if ($result === false) {
                    throw new Exception("Middleware '$name' failed");
                }
            }
        }
    }
    
    private function includeView($viewPath) {
        $fullPath = $this->config->get('app.root_path') . '/views/' . $viewPath;
        if (file_exists($fullPath)) {
            require_once $fullPath;
        } else {
            throw new Exception("View not found: $fullPath");
        }
    }
    
    private function callControllerMethod($handler, $params) {
        if (strpos($handler, '@') !== false) {
            list($controller, $method) = explode('@', $handler);
            $controllerClass = $controller . 'Controller';
            
            if (class_exists($controllerClass)) {
                $instance = new $controllerClass();
                if (method_exists($instance, $method)) {
                    call_user_func_array([$instance, $method], $params);
                } else {
                    throw new Exception("Method $method not found in $controllerClass");
                }
            } else {
                throw new Exception("Controller $controllerClass not found");
            }
        } else {
            throw new Exception("Invalid handler format: $handler");
        }
    }
    
    private function handleError($e) {
        if ($this->config->isDebug()) {
            echo "<h1>Route Error</h1>";
            echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
            echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        } else {
            http_response_code(500);
            require_once $this->config->get('app.root_path') . '/views/pages/500.php';
        }
    }
    
    private function handle404() {
        http_response_code(404);
        require_once $this->config->get('app.root_path') . '/views/pages/404.php';
    }
    
    public function getRoutes() {
        return $this->routes;
    }
}

function route() {
    return RouteManager::getInstance();
}
