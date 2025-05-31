<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

require_once dirname(dirname(__DIR__)) . '/database/models/Server.php';
require_once dirname(dirname(__DIR__)) . '/database/query.php';

$currentUserId = $_SESSION['user_id'] ?? 0;

// Get all debug info
$query = new Query();

// Check if tables exist
$tablesExist = [
    'servers' => $query->tableExists('servers'),
    'user_server_memberships' => $query->tableExists('user_server_memberships'),
    'users' => $query->tableExists('users')
];

// Get raw data
$allServers = $query->table('servers')->get();
$allMemberships = $query->table('user_server_memberships')->get();
$userMemberships = $query->table('user_server_memberships')->where('user_id', $currentUserId)->get();
$userServers = Server::getFormattedServersForUser($currentUserId);

header('Content-Type: application/json');
echo json_encode([
    'user_id' => $currentUserId,
    'tables_exist' => $tablesExist,
    'total_servers' => count($allServers),
    'total_memberships' => count($allMemberships),
    'user_memberships' => count($userMemberships),
    'user_servers' => count($userServers),
    'data' => [
        'all_servers' => $allServers,
        'user_memberships' => $userMemberships,
        'formatted_servers' => $userServers
    ]
], JSON_PRETTY_PRINT);
?>
