<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AdminController.php';
require_once dirname(dirname(__DIR__)) . '/database/query.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'Admin';
$_SESSION['discriminator'] = '0000';

try {
    $query = new Query();
    
    $step1_directQuery = $query->table('users u')
        ->select('u.id, u.username, u.discriminator, u.email, CASE WHEN n.user_id IS NOT NULL THEN 1 ELSE 0 END as has_nitro, n.code as nitro_code, n.user_id as nitro_user_id')
        ->leftJoin('nitro n', 'u.id', '=', 'n.user_id')
        ->where('u.username', 'LIKE', '%kol%')
        ->get();
    
    $step2_repoMethod = [];
    require_once dirname(dirname(__DIR__)) . '/database/repositories/UserRepository.php';
    $userRepo = new UserRepository();
    $repoUsers = $userRepo->searchWithNitroStatus('kol', 1, 10);
    foreach ($repoUsers as $user) {
        $userData = $user->toArray();
        $step2_repoMethod[] = [
            'id' => $userData['id'],
            'username' => $userData['username'],
            'discriminator' => $userData['discriminator'],
            'has_nitro' => $userData['has_nitro'] ?? null,
            'nitro_code' => $userData['nitro_code'] ?? null,
            'all_fields' => array_keys($userData)
        ];
    }
    
    $_GET['q'] = 'kol';
    $_GET['limit'] = '10';
    $controller = new AdminController();
    $step3_controllerResponse = $controller->searchUsers();
    
    $kolinaUser = null;
    $kolinNitroCheck = null;
    foreach ($step1_directQuery as $user) {
        if ($user['username'] === 'kolina') {
            $kolinaUser = $user;
            break;
        }
    }
    
    if ($kolinaUser) {
        $nitroRepository = new \NitroRepository();
        $kolinNitroCheck = $nitroRepository->getUserNitroStatus($kolinaUser['id']);
    }
    
    echo json_encode([
        'success' => true,
        'debug_name' => 'Complete Nitro Flow Debug',
        'step1_direct_sql_query' => $step1_directQuery,
        'step2_repository_method' => $step2_repoMethod,
        'step3_controller_response' => $step3_controllerResponse,
        'kolina_specific_analysis' => [
            'direct_query_result' => $kolinaUser,
            'nitro_repo_check' => $kolinNitroCheck,
            'has_nitro_from_sql' => $kolinaUser ? (bool)$kolinaUser['has_nitro'] : null,
            'nitro_code_from_sql' => $kolinaUser ? $kolinaUser['nitro_code'] : null
        ],
        'debug_conclusion' => [
            'sql_detects_nitro' => $kolinaUser ? (bool)$kolinaUser['has_nitro'] : false,
            'repo_detects_nitro' => $kolinNitroCheck ?? false,
            'frontend_should_see' => [
                'has_nitro' => $kolinaUser ? (bool)$kolinaUser['has_nitro'] : false,
                'nitro_status' => $kolinaUser && $kolinaUser['has_nitro'] ? 'active' : 'inactive',
                'nitro_active' => $kolinaUser ? (bool)$kolinaUser['has_nitro'] : false
            ]
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 