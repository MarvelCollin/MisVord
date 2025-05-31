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
        
        // Set proper headers
        header('Content-Type: application/json');
        http_response_code(500);
        
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