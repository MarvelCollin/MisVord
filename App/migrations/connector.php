<?php

/**
 * Migration Connector
 * 
 * This file serves as a central connector for all migration files.
 * It ensures all migration files are properly loaded when running migrations.
 */

// Define the base migration path
$migrationPath = __DIR__;

// Debug: Print the migration path to verify it's correct
echo "Scanning for migrations in: $migrationPath\n";

// Get all migration files
$migrationFiles = glob($migrationPath . '/*.php');

// Debug: Print all found PHP files
echo "Found " . count($migrationFiles) . " PHP files\n";

// Filter out this connector file itself and any other non-migration files
$migrationFiles = array_filter($migrationFiles, function($file) {
    $filename = basename($file);
    return $filename !== 'connector.php' && 
           $filename !== 'db.sql' && 
           !preg_match('/^MigrationRunner|^Migration\.php$/', $filename) &&
           preg_match('/^\d+\_/', $filename); // Must start with numbers followed by underscore
});

// Debug: Print filtered files
echo "After filtering, " . count($migrationFiles) . " migration files found\n";

// Sort files numerically to ensure proper migration order
usort($migrationFiles, function($a, $b) {
    $fileNameA = pathinfo($a, PATHINFO_FILENAME);
    $fileNameB = pathinfo($b, PATHINFO_FILENAME);
    
    // Extract the numeric prefix if it exists (handles both 01 and 1 style numbering)
    $prefixA = (int)preg_replace('/^(\d+).*$/', '$1', $fileNameA);
    $prefixB = (int)preg_replace('/^(\d+).*$/', '$1', $fileNameB);
    
    return $prefixA - $prefixB;
});

// Create a mapping of migration file names to class names for easy loading
$migrationMap = [];
foreach ($migrationFiles as $file) {
    $filename = pathinfo($file, PATHINFO_FILENAME);
    $className = '';
    
    // Try to read the actual class name from the file
    $content = file_get_contents($file);
    if (preg_match('/class\s+(\w+)/', $content, $matches)) {
        $className = $matches[1];
        echo "• Found class '{$className}' in file {$filename}.php\n";
    } else {
        // Fallback to generating expected class name from filename
        $parts = explode('_', $filename);
        
        // Skip numeric prefix if present
        if (is_numeric($parts[0])) {
            array_shift($parts);
        }
        
        $name = implode('_', $parts);
        $className = studly_case($name) . 'Migration';
        echo "• Generated class name '{$className}' for file {$filename}.php\n";
    }
    
    $migrationMap[$filename] = [
        'path' => $file,
        'class' => $className
    ];
}

// Helper function for converting snake_case to StudlyCase if not already defined
if (!function_exists('studly_case')) {
    function studly_case($string) {
        $string = ucwords(str_replace(['-', '_'], ' ', $string));
        return str_replace(' ', '', $string);
    }
}

// Return the migration map for use in MigrationRunner
return $migrationMap;
