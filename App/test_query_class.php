<?php
require_once __DIR__ . '/database/query.php';

echo "Testing Query class...\n";

try {
    $query = new Query();
    echo "Query object created successfully\n";
    
    // Test if the methods exist
    if (method_exists($query, 'table')) {
        echo "✓ table() method exists\n";
    } else {
        echo "✗ table() method does NOT exist\n";
    }
    
    if (method_exists($query, 'where')) {
        echo "✓ where() method exists\n";
    } else {
        echo "✗ where() method does NOT exist\n";
    }
    
    if (method_exists($query, 'first')) {
        echo "✓ first() method exists\n";
    } else {
        echo "✗ first() method does NOT exist\n";
    }
    
    if (method_exists($query, 'fetchOne')) {
        echo "✗ fetchOne() method exists (this should NOT exist!)\n";
    } else {
        echo "✓ fetchOne() method does NOT exist (correct!)\n";
    }
    
    if (method_exists($query, 'execute')) {
        echo "✗ execute() method exists (this should NOT exist!)\n";
    } else {
        echo "✓ execute() method does NOT exist (correct!)\n";
    }
    
    // Try a simple query
    echo "\nTesting a simple query...\n";
    $result = $query->table('servers')->first();
    echo "Query executed successfully: " . json_encode($result) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
