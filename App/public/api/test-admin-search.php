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
    $_GET['q'] = 'ti';
    $_GET['limit'] = '10';
    
    $controller = new AdminController();
    $response = $controller->searchUsers();
    
    $orderingAnalysis = [];
    if (isset($response['data']['users'])) {
        foreach ($response['data']['users'] as $index => $user) {
            $orderingAnalysis[] = [
                'position' => $index + 1,
                'username' => $user['username'],
                'discriminator' => $user['discriminator'],
                'has_nitro' => $user['has_nitro'] ?? false,
                'nitro_status' => $user['nitro_status'] ?? 'unknown'
            ];
        }
    }
    
    $usersWithoutNitro = array_filter($orderingAnalysis, function($user) {
        return !$user['has_nitro'];
    });
    
    $usersWithNitro = array_filter($orderingAnalysis, function($user) {
        return $user['has_nitro'];
    });
    
    echo json_encode([
        'success' => true,
        'test_name' => 'Admin Search Ordering Test',
        'search_query' => 'ti',
        'total_users' => count($orderingAnalysis),
        'users_without_nitro' => count($usersWithoutNitro),
        'users_with_nitro' => count($usersWithNitro),
        'ordering_correct' => function() use ($orderingAnalysis) {
            $foundNitroUser = false;
            foreach ($orderingAnalysis as $user) {
                if ($user['has_nitro']) {
                    $foundNitroUser = true;
                } else if ($foundNitroUser) {
                    return false;
                }
            }
            return true;
        },
        'detailed_ordering' => $orderingAnalysis,
        'controller_response' => $response,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 