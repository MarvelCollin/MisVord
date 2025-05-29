<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "=== DISCORD-LIKE SERVER SIDEBAR FIX VERIFICATION ===\n\n";

// Test 1: Verify ServerInvite class exists and methods are available
echo "1. Testing ServerInvite class...\n";
try {
    require_once __DIR__ . '/database/models/ServerInvite.php';
    
    $reflection = new ReflectionClass('ServerInvite');
    $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC | ReflectionMethod::IS_STATIC);
    
    echo "✓ ServerInvite class loaded successfully\n";
    echo "Available static methods:\n";
    foreach ($methods as $method) {
        if ($method->isStatic()) {
            echo "  - " . $method->getName() . "()\n";
        }
    }
    echo "\n";
} catch (Exception $e) {
    echo "✗ Error loading ServerInvite class: " . $e->getMessage() . "\n\n";
}

// Test 2: Verify Query class has correct methods
echo "2. Testing Query class methods...\n";
try {
    require_once __DIR__ . '/database/query.php';
    
    $query = new Query();
    $requiredMethods = ['table', 'where', 'orderBy', 'first', 'insert', 'delete', 'get'];
    $problemMethods = ['fetchOne', 'execute', 'lastInsertId'];
    
    foreach ($requiredMethods as $method) {
        if (method_exists($query, $method)) {
            echo "✓ Query::{$method}() exists\n";
        } else {
            echo "✗ Query::{$method}() MISSING!\n";
        }
    }
    
    echo "\nChecking for problematic methods that should NOT exist:\n";
    foreach ($problemMethods as $method) {
        if (method_exists($query, $method)) {
            echo "✗ Query::{$method}() exists (this could cause issues)\n";
        } else {
            echo "✓ Query::{$method}() does NOT exist (correct)\n";
        }
    }
    echo "\n";
} catch (Exception $e) {
    echo "✗ Error testing Query class: " . $e->getMessage() . "\n\n";
}

// Test 3: Test ServerInvite methods individually
echo "3. Testing ServerInvite methods individually...\n";
try {
    // Test findActiveByServer (the method that was failing)
    echo "Testing ServerInvite::findActiveByServer(1)...\n";
    $result = ServerInvite::findActiveByServer(1);
    echo "✓ Method executed without errors\n";
    echo "Result: " . ($result ? "Found invite" : "No invite found") . "\n\n";
    
    // Test find method
    echo "Testing ServerInvite::find(1)...\n";
    $result = ServerInvite::find(1);
    echo "✓ Method executed without errors\n";
    echo "Result: " . ($result ? "Found invite" : "No invite found") . "\n\n";
    
} catch (Exception $e) {
    echo "✗ Error testing ServerInvite methods: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n\n";
}

// Test 4: Simulate the API endpoint
echo "4. Testing the actual API endpoint simulation...\n";
try {
    // Set up session
    session_start();
    $_SESSION['user_id'] = 1;
    
    require_once __DIR__ . '/controllers/ServerController.php';
    
    $controller = new ServerController();
    
    echo "Testing ServerController::getServerDetails(1)...\n";
    
    // Capture output
    ob_start();
    $controller->getServerDetails(1);
    $output = ob_get_clean();
    
    if (strpos($output, 'fetchOne') !== false) {
        echo "✗ Output still contains 'fetchOne' error!\n";
        echo "Output: " . substr($output, 0, 200) . "...\n";
    } elseif (strpos($output, 'success') !== false) {
        echo "✓ API endpoint working - JSON response detected\n";
    } else {
        echo "⚠ Unexpected output:\n";
        echo substr($output, 0, 200) . "...\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error testing API endpoint: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}

echo "\n=== TEST COMPLETED ===\n";
echo "If you still see fetchOne errors, please:\n";
echo "1. Run: php clear_cache.php\n";
echo "2. Restart your web server completely\n";
echo "3. Clear your browser cache\n";
echo "4. Try the dropdown functionality again\n";
?>
