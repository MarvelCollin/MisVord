<?php
require_once '../router.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

echo json_encode([
    'message' => 'Drag & Drop Test API',
    'endpoints' => [
        'POST /api/channels/move' => 'Move channel to category',
        'POST /api/channels/reorder' => 'Reorder channels',
        'POST /api/categories/reorder' => 'Reorder categories'
    ],
    'test_data' => [
        'server_id' => 1,
        'channel_id' => 1,
        'category_id' => null,
        'new_position' => 0
    ],
    'curl_example' => 'curl -X POST /api/channels/move -H "Content-Type: application/json" -d \'{"channel_id":1,"server_id":1,"category_id":null,"new_position":0}\'',
    'status' => 'ready',
    'timestamp' => date('Y-m-d H:i:s')
]);
?> 