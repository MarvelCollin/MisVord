<?php
// Test script for server creation with is_public toggle

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../controllers/ServerController.php';

// Initialize session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Make sure we're logged in
if (!isset($_SESSION['user_id'])) {
    die("You need to be logged in to test server creation");
}

$controller = new ServerController();

// Test case 1: is_public = 0
$_POST = [
    'name' => 'Test Server Without Public',
    'description' => 'Testing server creation without public toggle',
    'is_public' => '0',
    'category' => 'gaming'
];
$_FILES = [];
$_SERVER['REQUEST_METHOD'] = 'POST';

echo "<h3>Test Case 1: is_public = 0</h3>";
echo "<pre>";
$result1 = $controller->create();
echo json_encode($result1, JSON_PRETTY_PRINT);
echo "</pre>";

// Test case 2: is_public = 1
$_POST = [
    'name' => 'Test Server With Public',
    'description' => 'Testing server creation with public toggle',
    'is_public' => '1',
    'category' => 'gaming'
];

echo "<h3>Test Case 2: is_public = 1</h3>";
echo "<pre>";
$result2 = $controller->create();
echo json_encode($result2, JSON_PRETTY_PRINT);
echo "</pre>";

// Test case 3: is_public not set (should default to false)
$_POST = [
    'name' => 'Test Server No Public Param',
    'description' => 'Testing server creation without public parameter',
    'category' => 'gaming'
];

echo "<h3>Test Case 3: is_public not set</h3>";
echo "<pre>";
$result3 = $controller->create();
echo json_encode($result3, JSON_PRETTY_PRINT);
echo "</pre>"; 