<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required'
    ]);
    exit;
}

require_once __DIR__ . '/../../database/query.php';

try {
    $serverId = $_GET['server_id'] ?? 1;
    
    $query = new Query();
    
    // Get current categories
    $categories = $query->table('categories')
        ->where('server_id', $serverId)
        ->orderBy('position', 'ASC')
        ->get();
    
    // Get current channels
    $channels = $query->table('channels')
        ->where('server_id', $serverId)
        ->orderBy('position', 'ASC')
        ->get();
    
    // Separate uncategorized and categorized channels
    $uncategorizedChannels = array_filter($channels, function($ch) {
        return !$ch['category_id'] || $ch['category_id'] == 0;
    });
    
    $categorizedChannels = array_filter($channels, function($ch) {
        return $ch['category_id'] && $ch['category_id'] != 0;
    });
    
    // Group categorized channels by category
    $channelsByCategory = [];
    foreach ($categorizedChannels as $channel) {
        $categoryId = $channel['category_id'];
        if (!isset($channelsByCategory[$categoryId])) {
            $channelsByCategory[$categoryId] = [];
        }
        $channelsByCategory[$categoryId][] = $channel;
    }
    
    echo json_encode([
        'success' => true,
        'server_id' => $serverId,
        'current_state' => [
            'categories' => array_map(function($cat) {
                return [
                    'id' => $cat['id'],
                    'name' => $cat['name'],
                    'position' => $cat['position']
                ];
            }, $categories),
            'uncategorized_channels' => array_map(function($ch) {
                return [
                    'id' => $ch['id'],
                    'name' => $ch['name'],
                    'position' => $ch['position'],
                    'category_id' => $ch['category_id']
                ];
            }, $uncategorizedChannels),
            'channels_by_category' => array_map(function($categoryChannels) {
                return array_map(function($ch) {
                    return [
                        'id' => $ch['id'],
                        'name' => $ch['name'],
                        'position' => $ch['position'],
                        'category_id' => $ch['category_id']
                    ];
                }, $categoryChannels);
            }, $channelsByCategory)
        ],
        'analysis' => [
            'total_categories' => count($categories),
            'total_channels' => count($channels),
            'uncategorized_channels' => count($uncategorizedChannels),
            'categorized_channels' => count($categorizedChannels)
        ],
        'position_ranges' => [
            'categories' => [
                'min' => count($categories) > 0 ? min(array_column($categories, 'position')) : 0,
                'max' => count($categories) > 0 ? max(array_column($categories, 'position')) : 0
            ],
            'uncategorized_channels' => [
                'min' => count($uncategorizedChannels) > 0 ? min(array_column($uncategorizedChannels, 'position')) : 0,
                'max' => count($uncategorizedChannels) > 0 ? max(array_column($uncategorizedChannels, 'position')) : 0
            ]
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?> 