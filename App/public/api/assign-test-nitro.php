<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/database/query.php';
require_once dirname(dirname(__DIR__)) . '/database/models/Nitro.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'Admin';
$_SESSION['discriminator'] = '0000';

try {
    $action = $_GET['action'] ?? 'check';
    $query = new Query();
    
    $kolinaUser = $query->table('users')
        ->where('username', 'kolina')
        ->first();
    
    if (!$kolinaUser) {
        echo json_encode([
            'success' => false,
            'error' => 'User kolina not found'
        ]);
        exit;
    }
    
    $kolinaId = $kolinaUser['id'];
    
    if ($action === 'assign') {
        $existingNitro = $query->table('nitro')
            ->where('user_id', $kolinaId)
            ->first();
        
        if ($existingNitro) {
            echo json_encode([
                'success' => true,
                'message' => 'Kolina already has nitro',
                'existing_code' => $existingNitro['code']
            ]);
            exit;
        }
        
        $testCode = 'TEST-KOLINA-' . date('Ymd-His');
        
        $result = $query->table('nitro')->insert([
            'user_id' => $kolinaId,
            'code' => $testCode,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Nitro assigned to kolina',
                'user_id' => $kolinaId,
                'code' => $testCode
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to assign nitro'
            ]);
        }
    } else if ($action === 'remove') {
        $deleted = $query->table('nitro')
            ->where('user_id', $kolinaId)
            ->delete();
        
        echo json_encode([
            'success' => true,
            'message' => 'Nitro removed from kolina',
            'deleted_count' => $deleted
        ]);
    } else {
        $nitroStatus = $query->table('nitro')
            ->where('user_id', $kolinaId)
            ->first();
        
        $hasNitro = $nitroStatus ? true : false;
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $kolinaId,
                'username' => $kolinaUser['username'],
                'discriminator' => $kolinaUser['discriminator']
            ],
            'has_nitro' => $hasNitro,
            'nitro_details' => $nitroStatus,
            'available_actions' => [
                'check' => '?action=check',
                'assign' => '?action=assign', 
                'remove' => '?action=remove'
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 