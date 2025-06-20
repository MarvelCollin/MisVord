<?php

require_once __DIR__ . '/config_manager.php';

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
    
    public function get($uri, $handler) {
        return $this->addRoute('GET', $uri, $handler);
    }
    
    public function post($uri, $handler) {
        return $this->addRoute('POST', $uri, $handler);
    }
    
    public function put($uri, $handler) {
        return $this->addRoute('PUT', $uri, $handler);
    }
    
    public function delete($uri, $handler) {
        return $this->addRoute('DELETE', $uri, $handler);
    }
    
    public function patch($uri, $handler) {
        return $this->addRoute('PATCH', $uri, $handler);
    }
    
    public function options($uri, $handler) {
        return $this->addRoute('OPTIONS', $uri, $handler);
    }
    
    public function any($uri, $handler) {
        $methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
        foreach ($methods as $method) {
            $this->addRoute($method, $uri, $handler);
        }
        return $this;
    }
    
    private function addRoute($method, $uri, $handler) {
        $uri = $this->currentPrefix . $uri;
        $key = $method . ':' . $uri;
        
        $this->routes[$key] = [
            'method' => $method,
            'uri' => $uri,
            'handler' => $handler,
            'middleware' => array_merge($this->currentMiddleware, [])
        ];
        
        return $this;
    }
    
    public function group($attributes, $callback) {
        $previousPrefix = $this->currentPrefix;
        $previousMiddleware = $this->currentMiddleware;
        
        if (isset($attributes['prefix'])) {
            $this->currentPrefix .= '/' . trim($attributes['prefix'], '/');
        }
        
        if (isset($attributes['middleware'])) {
            $middleware = is_array($attributes['middleware']) ? $attributes['middleware'] : [$attributes['middleware']];
            $this->currentMiddleware = array_merge($this->currentMiddleware, $middleware);
        }
        
        $callback($this);
        
        $this->currentPrefix = $previousPrefix;
        $this->currentMiddleware = $previousMiddleware;
        
        return $this;
    }
    
    public function middleware($middleware) {
        $middleware = is_array($middleware) ? $middleware : [$middleware];
        $this->currentMiddleware = array_merge($this->currentMiddleware, $middleware);
        return $this;
    }
    
    public function registerMiddleware($name, $handler) {
        $this->middleware[$name] = $handler;
        return $this;
    }
    
    public function getRoutes() {
        return $this->routes;
    }
    
    public function resolve($uri, $method = 'GET') {
        $uri = parse_url($uri, PHP_URL_PATH);
        $method = strtoupper($method);
        $key = $method . ':' . $uri;
        
        // Direct match
        if (isset($this->routes[$key])) {
            return $this->routes[$key];
        }
        
        // Pattern matching
        foreach ($this->routes as $routeKey => $route) {
            if (strpos($routeKey, $method . ':') !== 0) {
                continue;
            }
            
            $pattern = $route['uri'];
            
            // Convert route parameters to regex
            if (strpos($pattern, '{') !== false) {
                $pattern = preg_quote($pattern, '#');
                $pattern = preg_replace('/\\\{([a-zA-Z0-9_]+)\\\}/', '(?P<$1>[^/]+)', $pattern);
                $pattern = '#^' . $pattern . '$#';
                
                if (preg_match($pattern, $uri, $matches)) {
                    // Extract named parameters
                    $parameters = [];
                    foreach ($matches as $key => $value) {
                        if (!is_numeric($key)) {
                            $parameters[$key] = $value;
                        }
                    }
                    
                    $route['parameters'] = $parameters;
                    return $route;
                }
            }
        }
        
        return null;
    }
    
    public function dispatch($uri, $method = 'GET') {
        $route = $this->resolve($uri, $method);
        
        if (!$route) {
            http_response_code(404);
            echo "Route not found: $method $uri";
            return;
        }
        
        // Execute middleware
        foreach ($route['middleware'] as $middlewareName) {
            if (isset($this->middleware[$middlewareName])) {
                $middlewareResult = call_user_func($this->middleware[$middlewareName]);
                if ($middlewareResult === false) {
                    return; // Middleware blocked the request
                }
            }
        }
        
        // Execute handler
        $handler = $route['handler'];
        $parameters = $route['parameters'] ?? [];
        
        if (is_callable($handler)) {
            call_user_func_array($handler, array_values($parameters));
        } elseif (is_string($handler)) {
            // Assume it's a view file
            $viewPath = __DIR__ . '/../views/' . $handler;
            if (file_exists($viewPath)) {
                // Extract parameters as variables
                extract($parameters);
                require $viewPath;
            } else {
                http_response_code(500);
                echo "View not found: $handler";
            }
        }
    }
    
    public function getCurrentRoute() {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];
        return $this->resolve($uri, $method);
    }
    
    public function url($name, $parameters = []) {
        // This would be used for named routes (not implemented yet)
        // For now, just return the URI with parameters replaced
        foreach ($this->routes as $route) {
            if (isset($route['name']) && $route['name'] === $name) {
                $uri = $route['uri'];
                foreach ($parameters as $key => $value) {
                    $uri = str_replace('{' . $key . '}', $value, $uri);
                }
                return $uri;
            }
        }
        
        return null;
    }
}
