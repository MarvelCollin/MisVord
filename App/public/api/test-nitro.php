<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/NitroController.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/NitroRepository.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['username'] !== 'Admin') {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? 'info';
$nitroRepository = new NitroRepository();

switch ($action) {
    case 'generate':
        $nitro = $nitroRepository->generateCode();
        echo json_encode([
            'success' => true,
            'code' => $nitro->code,
            'formatted' => substr($nitro->code, 0, 4) . '-' . 
                          substr($nitro->code, 4, 4) . '-' . 
                          substr($nitro->code, 8, 4) . '-' . 
                          substr($nitro->code, 12, 4)
        ]);
        break;
        
    case 'list':
        $codes = $nitroRepository->getActiveCodes();
        echo json_encode([
            'success' => true,
            'active_codes' => array_map(function($nitro) {
                return [
                    'code' => $nitro->code,
                    'formatted' => substr($nitro->code, 0, 4) . '-' . 
                                  substr($nitro->code, 4, 4) . '-' . 
                                  substr($nitro->code, 8, 4) . '-' . 
                                  substr($nitro->code, 12, 4),
                    'created_at' => $nitro->created_at
                ];
            }, $codes),
            'total_active' => count($codes)
        ]);
        break;
        
    default:
        echo json_encode([
            'info' => 'Nitro test API',
            'endpoints' => [
                '/api/test-nitro.php?action=generate' => 'Generate a new nitro code',
                '/api/test-nitro.php?action=list' => 'List all active codes'
            ]
        ]);
} 