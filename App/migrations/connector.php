<?php

$migrationPath = __DIR__;

echo "Scanning for migrations in: $migrationPath\n";

$migrationFiles = glob($migrationPath . '/*.php');

echo "Found " . count($migrationFiles) . " PHP files\n";

$migrationFiles = array_filter($migrationFiles, function($file) {
    $filename = basename($file);
    return $filename !== 'connector.php' && 
           $filename !== 'db.sql' && 
           !preg_match('/^MigrationRunner|^Migration\.php$/', $filename) &&
           preg_match('/^\d+\_/', $filename); 
});

echo "After filtering, " . count($migrationFiles) . " migration files found\n";

usort($migrationFiles, function($a, $b) {
    $fileNameA = pathinfo($a, PATHINFO_FILENAME);
    $fileNameB = pathinfo($b, PATHINFO_FILENAME);

    $prefixA = (int)preg_replace('/^(\d+).*$/', '$1', $fileNameA);
    $prefixB = (int)preg_replace('/^(\d+).*$/', '$1', $fileNameB);

    return $prefixA - $prefixB;
});

$migrationMap = [];
foreach ($migrationFiles as $file) {
    $filename = pathinfo($file, PATHINFO_FILENAME);
    $className = '';

    $content = file_get_contents($file);
    if (preg_match('/class\s+(\w+)/', $content, $matches)) {
        $className = $matches[1];
        echo "• Found class '{$className}' in file {$filename}.php\n";
    } else {

        $parts = explode('_', $filename);

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

if (!function_exists('studly_case')) {
    function studly_case($string) {
        $string = ucwords(str_replace(['-', '_'], ' ', $string));
        return str_replace(' ', '', $string);
    }
}

return $migrationMap;