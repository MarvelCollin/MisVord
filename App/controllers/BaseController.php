<?php

class BaseController {
    
    public function __construct() {
        // Set JSON header for API responses
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            header('Content-Type: application/json');
        }
    }
    
    protected function successResponse($data = [], $message = 'Success') {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data
        ];
        
        if ($this->isAjaxRequest() || $this->isApiRoute()) {
            echo json_encode($response);
            exit;
        }
        
        return $response;
    }
    
    protected function validationError($errors, $message = 'Validation failed') {
        http_response_code(400);
        
        $response = [
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ];
        
        if ($this->isAjaxRequest() || $this->isApiRoute()) {
            echo json_encode($response);
            exit;
        }
        
        return $response;
    }
    
    protected function serverError($message = 'Internal server error') {
        // Ensure we have a clean response
        if (ob_get_level()) ob_end_clean();
        
        // Log the error for debugging
        error_log("Server Error: $message");
        
        // Set proper headers
        header('Content-Type: application/json');
        http_response_code(500);
        
        // In development environment, include more details
        $isDevelopment = true; // Set this based on your environment
        
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($isDevelopment) {
            // Add backtrace for debugging in development
            $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
            $caller = isset($backtrace[1]) ? $backtrace[1] : [];
            
            $response['debug'] = [
                'file' => $caller['file'] ?? 'unknown',
                'line' => $caller['line'] ?? 'unknown',
                'function' => $caller['function'] ?? 'unknown',
                'time' => date('Y-m-d H:i:s')
            ];
        }
        
        if ($this->isAjaxRequest() || $this->isApiRoute()) {
            echo json_encode($response);
            exit;
        }
        
        return $response;
    }
    
    protected function unauthorized($message = 'Unauthorized') {
        http_response_code(401);
        
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($this->isAjaxRequest() || $this->isApiRoute()) {
            echo json_encode($response);
            exit;
        }
        
        return $response;
    }
    
    protected function notFound($message = 'Not found') {
        http_response_code(404);
        
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($this->isAjaxRequest() || $this->isApiRoute()) {
            echo json_encode($response);
            exit;
        }
        
        return $response;
    }
    
    protected function forbidden($message = 'Forbidden') {
        http_response_code(403);
        
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($this->isAjaxRequest() || $this->isApiRoute()) {
            echo json_encode($response);
            exit;
        }
        
        return $response;
    }
    
    protected function isAjaxRequest() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }
    
    protected function isApiRoute() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($uri, '/api/') === 0 || strpos($uri, '/api/') !== false;
    }
}