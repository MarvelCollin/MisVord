<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AdminController.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'Admin';
$_SESSION['discriminator'] = '0000';

try {
    $_GET['q'] = 'kol';
    $_GET['limit'] = '10';
    
    $controller = new AdminController();
    $response = $controller->searchUsers();
    
    $kolinaAnalysis = ['found' => false];
    if (isset($response['data']['users'])) {
        foreach ($response['data']['users'] as $user) {
            if ($user['username'] === 'kolina') {
                $kolinaAnalysis = [
                    'found' => true,
                    'has_nitro' => $user['has_nitro'] ?? false,
                    'nitro_status' => $user['nitro_status'] ?? 'unknown',
                    'nitro_active' => $user['nitro_active'] ?? false,
                    'nitro_code' => $user['nitro_code'] ?? null,
                    'all_fields' => array_keys($user),
                    'raw_user_data' => $user
                ];
                break;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'test_name' => 'Admin Search Users Nitro Status Test',
        'search_query' => 'kol',
        'controller_response' => $response,
        'kolina_analysis' => $kolinaAnalysis,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 