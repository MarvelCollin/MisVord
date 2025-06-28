<?php

define('APP_ROOT', __DIR__);
require_once 'config/db.php';
require_once 'database/query.php';
require_once 'database/models/Category.php';

try {
    $query = new Query();
    $categories = $query->table('categories')->where('server_id', 17)->get();
    echo "Categories for server 17:\n";
    var_dump($categories);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 