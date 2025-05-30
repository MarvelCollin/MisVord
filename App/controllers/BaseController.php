<?php

class BaseController {
    protected function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    /**
     * Standard JSON response format for AJAX requests
     * 
     * @param array $data Response data
     * @param int $status HTTP status code
     * @param bool $exit Whether to exit after sending response
     */
    protected function jsonResponse($data, $status = 200, $exit = true) {
        http_response_code($status);
        header('Content-Type: application/json');
        
        // Ensure no output buffering is active
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            echo json_encode($data, JSON_THROW_ON_ERROR);
        } catch (Exception $e) {
            error_log("JSON encoding error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server error: Failed to encode response'
            ]);
        }
        
        if ($exit) {
            exit;
        }
    }
    
    /**
     * Return an authentication error response for AJAX
     */
    protected function unauthorized() {
        return $this->jsonResponse([
            'success' => false,
            'message' => 'Unauthorized',
            'redirect' => '/login'
        ], 401);
    }
    
    /**
     * Return a not found error response for AJAX
     */
    protected function notFound($message = 'Resource not found') {
        return $this->jsonResponse([
            'success' => false,
            'message' => $message
        ], 404);
    }
    
    /**
     * Return a permission error response for AJAX
     */
    protected function forbidden($message = 'Permission denied') {
        return $this->jsonResponse([
            'success' => false,
            'message' => $message
        ], 403);
    }
    
    /**
     * Return a validation error response for AJAX
     */
    protected function validationError($errors) {
        return $this->jsonResponse([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors
        ], 400);
    }
    
    /**
     * Return a server error response for AJAX
     */
    protected function serverError($message = 'An error occurred') {
        return $this->jsonResponse([
            'success' => false,
            'message' => $message
        ], 500);
    }
    
    /**
     * Return a successful response with redirect for AJAX
     */
    protected function redirectResponse($url, $message = 'Success') {
        return $this->jsonResponse([
            'success' => true,
            'message' => $message,
            'redirect' => $url
        ]);
    }
    
    /**
     * Return a successful response for AJAX
     */
    protected function successResponse($data = [], $message = 'Success') {
        $response = [
            'success' => true,
            'message' => $message
        ];
        
        if (!empty($data)) {
            $response['data'] = $data;
        }
        
        return $this->jsonResponse($response);
    }
} 