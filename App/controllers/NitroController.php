<?php

require_once dirname(__DIR__) . '/controllers/BaseController.php';

class NitroController extends BaseController {
    
    public function index() {
        if (!$this->isAuthenticated()) {
            return $this->redirect('/login');
        }
        
        require_once __DIR__ . '/../views/pages/nitro-page.php';
    }
} 