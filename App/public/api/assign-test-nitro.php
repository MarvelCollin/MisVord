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
    $action = $_GET['action'] ?? 'assign';
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
                'nitro_code' => $existingNitro['code']
            ]);
        } else {
            $testCode = 'TEST-KOLINA-' . date('Ymd');
            $query->table('nitro')->insert([
                'user_id' => $kolinaId,
                'code' => $testCode,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Nitro assigned to kolina',
                'nitro_code' => $testCode
            ]);
        }
    } else if ($action === 'remove') {
        $query->table('nitro')
            ->where('user_id', $kolinaId)
            ->delete();
            
        echo json_encode([
            'success' => true,
            'message' => 'Nitro removed from kolina'
        ]);
    } else {
        $nitroStatus = $query->table('nitro')
            ->where('user_id', $kolinaId)
            ->first();
            
        echo json_encode([
            'success' => true,
            'message' => 'Nitro status checked',
            'has_nitro' => $nitroStatus ? true : false,
            'nitro_code' => $nitroStatus ? $nitroStatus['code'] : null
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 