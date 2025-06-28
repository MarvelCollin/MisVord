<?php

define('APP_ROOT', __DIR__);
require_once 'config/db.php';
require_once 'database/query.php';
require_once 'database/models/Channel.php';

try {
    $channels = Channel::getByServerId(17);
    echo "Channels for server 17:\n";
    var_dump($channels);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 