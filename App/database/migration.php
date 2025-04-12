<?php

class Migration {
    protected $pdo;
    protected $tableName;
    protected $columns = [];
    protected $foreignKeys = [];
    protected $primaryKey = 'id';
    protected $engine = 'InnoDB';
    protected $charset = 'utf8mb4';
    protected $collation = 'utf8mb4_unicode_ci';
    protected $temporary = false;
    protected $ifNotExists = false;
    protected $indexes = [];
    protected $uniqueIndexes = [];
    protected $fulltextIndexes = [];
    protected $spatialIndexes = [];

    public function __construct($pdo = null) {
        if ($pdo) {
            $this->pdo = $pdo;
        } else {
            try {
                // Use the EnvLoader to get database connection
                require_once __DIR__ . '/../config/env.php';
                $this->pdo = EnvLoader::getPDOConnection();

                // Set default engine and charset from config
                $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');
                $this->charset = $charset;

                // Default collation for utf8mb4
                if ($charset === 'utf8mb4') {
                    $this->collation = 'utf8mb4_unicode_ci';
                }
            } catch (PDOException $e) {
                die("Database connection failed: " . $e->getMessage());
            }
        }
    }

    /**
     * Parse .env file and return as associative array
     *
     * @param string $filePath Path to .env file
     * @return array Parsed environment variables
     */
    private static function parseEnvFile($filePath) {
        if (!file_exists($filePath)) {
            return [];
        }

        $env = [];
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '//') === 0) {
                continue;
            }

            // Split by first equals sign
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Remove quotes if they exist
                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                    $value = $matches[1];
                }

                $env[$key] = $value;
            }
        }

        return $env;
    }

    public function createDatabase($name, $ifNotExists = false) {
        $ifNotExistsClause = $ifNotExists ? 'IF NOT EXISTS' : '';
        $sql = "CREATE DATABASE $ifNotExistsClause `$name`";
        return $this->pdo->exec($sql);
    }

    public function dropDatabase($name, $ifExists = false) {
        $ifExistsClause = $ifExists ? 'IF EXISTS' : '';
        $sql = "DROP DATABASE $ifExistsClause `$name`";
        return $this->pdo->exec($sql);
    }

    public function createTable($tableName, callable $callback) {
        $this->tableName = $tableName;
        $this->columns = [];
        $this->foreignKeys = [];
        $this->indexes = [];
        $this->uniqueIndexes = [];
        $this->fulltextIndexes = [];
        $this->spatialIndexes = [];

        $callback($this);

        $sql = $this->buildCreateTableSQL();
        return $this->pdo->exec($sql);
    }

    public function dropTable($tableName, $ifExists = false) {
        $ifExistsClause = $ifExists ? 'IF EXISTS' : '';
        $sql = "DROP TABLE $ifExistsClause `$tableName`";
        return $this->pdo->exec($sql);
    }

    public function truncateTable($tableName) {
        $sql = "TRUNCATE TABLE `$tableName`";
        return $this->pdo->exec($sql);
    }

    public function renameTable($from, $to) {
        $sql = "RENAME TABLE `$from` TO `$to`";
        return $this->pdo->exec($sql);
    }

    public function alterTable($tableName, callable $callback) {
        $this->tableName = $tableName;
        $this->columns = [];
        $this->foreignKeys = [];
        $this->indexes = [];
        $this->uniqueIndexes = [];
        $this->fulltextIndexes = [];
        $this->spatialIndexes = [];

        $callback($this);

        $alterCommands = [];

        foreach ($this->columns as $column) {
            $alterCommands[] = "ADD COLUMN " . $column;
        }

        foreach ($this->foreignKeys as $foreignKey) {
            $alterCommands[] = "ADD " . $foreignKey;
        }

        foreach ($this->indexes as $index) {
            $alterCommands[] = "ADD " . $index;
        }

        foreach ($this->uniqueIndexes as $index) {
            $alterCommands[] = "ADD " . $index;
        }

        foreach ($this->fulltextIndexes as $index) {
            $alterCommands[] = "ADD " . $index;
        }

        foreach ($this->spatialIndexes as $index) {
            $alterCommands[] = "ADD " . $index;
        }

        if (empty($alterCommands)) {
            return true;
        }

        $sql = "ALTER TABLE `$tableName` " . implode(", ", $alterCommands);
        return $this->pdo->exec($sql);
    }

    public function dropColumn($tableName, $columnName) {
        $sql = "ALTER TABLE `$tableName` DROP COLUMN `$columnName`";
        return $this->pdo->exec($sql);
    }

    public function dropForeignKey($tableName, $keyName) {
        $sql = "ALTER TABLE `$tableName` DROP FOREIGN KEY `$keyName`";
        return $this->pdo->exec($sql);
    }

    public function dropIndex($tableName, $indexName) {
        $sql = "ALTER TABLE `$tableName` DROP INDEX `$indexName`";
        return $this->pdo->exec($sql);
    }

    public function dropPrimaryKey($tableName) {
        $sql = "ALTER TABLE `$tableName` DROP PRIMARY KEY";
        return $this->pdo->exec($sql);
    }

    // Basic data types
    public function id() {
        $this->columns[] = "`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY";
        return $this;
    }

    public function bigInteger($name, $autoIncrement = false, $unsigned = false, $nullable = false) {
        $type = "BIGINT(20)";
        if ($unsigned) {
            $type .= " UNSIGNED";
        }
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $autoInc = $autoIncrement ? "AUTO_INCREMENT" : "";
        $this->columns[] = "`$name` $type $nullable $autoInc";
        return $this;
    }

    public function integer($name, $autoIncrement = false, $unsigned = false, $nullable = false) {
        $type = "INT(11)";
        if ($unsigned) {
            $type .= " UNSIGNED";
        }
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $autoInc = $autoIncrement ? "AUTO_INCREMENT" : "";
        $this->columns[] = "`$name` $type $nullable $autoInc";
        return $this;
    }

    public function string($name, $length = 255, $nullable = false) {
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $this->columns[] = "`$name` VARCHAR($length) $nullable";
        return $this;
    }

    public function text($name, $nullable = false) {
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $this->columns[] = "`$name` TEXT $nullable";
        return $this;
    }

    public function boolean($name, $nullable = false) {
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $this->columns[] = "`$name` TINYINT(1) $nullable DEFAULT 0";
        return $this;
    }
    
    public function default($value) {
        // Find the last column added and add DEFAULT to it
        if (!empty($this->columns)) {
            $lastIndex = count($this->columns) - 1;
            $lastColumn = $this->columns[$lastIndex];
            
            // Format the default value based on type
            if (is_bool($value)) {
                $formattedValue = $value ? '1' : '0';
            } elseif (is_null($value)) {
                $formattedValue = 'NULL';
            } elseif (is_string($value)) {
                $formattedValue = "'" . addslashes($value) . "'";
            } else {
                $formattedValue = $value;
            }
            
            $this->columns[$lastIndex] = $lastColumn . " DEFAULT " . $formattedValue;
        }
        
        return $this;
    }

    public function date($name, $nullable = false) {
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $this->columns[] = "`$name` DATE $nullable";
        return $this;
    }

    public function dateTime($name, $nullable = false) {
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $this->columns[] = "`$name` DATETIME $nullable";
        return $this;
    }

    public function timestamp($name, $nullable = false) {
        $nullable = $nullable ? "NULL" : "NOT NULL";
        $this->columns[] = "`$name` TIMESTAMP $nullable";
        return $this;
    }

    public function timestamps() {
        $this->columns[] = "`created_at` TIMESTAMP NULL DEFAULT NULL";
        $this->columns[] = "`updated_at` TIMESTAMP NULL DEFAULT NULL";
        return $this;
    }

    public function foreignKey($column, $referencedTable, $referencedColumn, $onDelete = 'CASCADE', $onUpdate = 'CASCADE') {
        $name = "fk_{$this->tableName}_{$column}";
        $this->foreignKeys[] = "CONSTRAINT `$name` FOREIGN KEY (`$column`) REFERENCES `$referencedTable`(`$referencedColumn`) ON DELETE $onDelete ON UPDATE $onUpdate";
        return $this;
    }

    protected function buildCreateTableSQL() {
        $temporary = $this->temporary ? 'TEMPORARY' : '';
        $ifNotExists = $this->ifNotExists ? 'IF NOT EXISTS' : '';

        $sql = "CREATE $temporary TABLE $ifNotExists `{$this->tableName}` (";
        $sql .= implode(", ", $this->columns);

        if (!empty($this->foreignKeys)) {
            $sql .= ", " . implode(", ", $this->foreignKeys);
        }

        if (!empty($this->indexes)) {
            $sql .= ", " . implode(", ", $this->indexes);
        }

        if (!empty($this->uniqueIndexes)) {
            $sql .= ", " . implode(", ", $this->uniqueIndexes);
        }

        if (!empty($this->fulltextIndexes)) {
            $sql .= ", " . implode(", ", $this->fulltextIndexes);
        }

        if (!empty($this->spatialIndexes)) {
            $sql .= ", " . implode(", ", $this->spatialIndexes);
        }

        $sql .= ") ENGINE={$this->engine} DEFAULT CHARSET={$this->charset} COLLATE={$this->collation}";

        return $sql;
    }

    public function createMigrationTable() {
        try {
            // Check if migrations table exists
            $stmt = $this->pdo->prepare("SELECT 1 FROM migrations LIMIT 1");
            $stmt->execute();
            return true; // Table exists
        } catch (PDOException $e) {
            // Table doesn't exist, create it
            return $this->createTable('migrations', function($table) {
                $table->id();
                $table->string('migration');
                $table->integer('batch');
                $table->timestamps();
            });
        }
    }

    public function getMigrations() {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM migrations ORDER BY id");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    public function logMigration($name, $batch) {
        $stmt = $this->pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
        return $stmt->execute([$name, $batch]);
    }

    public function removeMigration($name) {
        $stmt = $this->pdo->prepare("DELETE FROM migrations WHERE migration = ?");
        return $stmt->execute([$name]);
    }

    public function getLastBatchNumber() {
        try {
            $stmt = $this->pdo->prepare("SELECT MAX(batch) as batch FROM migrations");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? (int)$result['batch'] : 0;
        } catch (PDOException $e) {
            return 0;
        }
    }
}

class MigrationRunner {
    protected $pdo;
    protected $migration;
    protected $migrationsPath;

    public function __construct($pdo = null, $migrationsPath = null) {
        // Make sure EnvLoader is loaded - use absolute path
        $basePath = dirname(__DIR__); // Gets the parent directory of current directory

        if (!class_exists('EnvLoader')) {
            require_once $basePath . '/config/env.php';
        }

        // If no PDO connection provided, create one from environment
        if ($pdo === null) {
            $pdo = EnvLoader::getPDOConnection();
        }

        $this->pdo = $pdo;
        $this->migration = new Migration($pdo);
        $this->migrationsPath = $migrationsPath ?? $basePath . '/migrations';
    }

    public function run() {
        $this->migration->createMigrationTable();
        echo "- Created migrations tracking table\n";

        $executedMigrations = $this->migration->getMigrations();
        $executedMigrationNames = array_column($executedMigrations, 'migration');

        // Use the connector to get migration mapping
        $migrationMap = require_once $this->migrationsPath . '/connector.php';

        if (!is_array($migrationMap)) {
            echo "Error: Migration map is not valid. Check connector.php\n";
            return;
        }

        $toRun = [];
        foreach ($migrationMap as $migrationName => $info) {
            if (!in_array($migrationName, $executedMigrationNames)) {
                $toRun[$migrationName] = $info;
            }
        }

        if (empty($toRun)) {
            echo "No migrations to run.\n";
            return;
        }

        // Print the order of migrations that will run
        echo "\n=== Migration execution order ===\n";
        foreach ($toRun as $migrationName => $info) {
            echo "- $migrationName => {$info['class']}\n";
        }
        echo "===========================\n\n";

        $batch = $this->migration->getLastBatchNumber() + 1;
        echo "Starting migration batch #{$batch}\n";
        echo "----------------------------------------\n";
        $count = 0;

        // First, include all migration files to make sure all classes are loaded
        foreach ($toRun as $migrationName => $info) {
            $file = $info['path'];
            include_once $file;
        }

        foreach ($toRun as $migrationName => $info) {
            $className = $info['class'];

            // Check if class exists now that we've loaded all files
            if (class_exists($className)) {
                $migration = new $className();
                echo "Migrating: $migrationName (using class $className)\n";

                try {
                    if (method_exists($migration, 'up')) {
                        // Start tracking execution time for this migration
                        $startTime = microtime(true);

                        // Run the migration
                        $migration->up($this->migration);

                        // Calculate execution time
                        $endTime = microtime(true);
                        $executionTime = round(($endTime - $startTime), 2);

                        // Log the migration in the database
                        $this->migration->logMigration($migrationName, $batch);

                        // Output success message with execution time
                        echo "✓ Migrated:  $migrationName ({$executionTime}s)\n";
                        $count++;
                    }
                } catch (Exception $e) {
                    echo "⨯ Migration failed: {$e->getMessage()}\n";
                    echo "Migration batch #{$batch} failed.\n";
                    return;
                }
            } else {
                echo "⨯ Class '$className' not found after loading file {$info['path']}\n";
            }
        }

        echo "----------------------------------------\n";
        echo "Migration completed successfully: {$count} migrations executed.\n";
    }

    public function dropAllTables() {
        try {
            // Disable foreign key checks temporarily
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            // Get list of all tables in the database
            $stmt = $this->pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($tables as $table) {
                echo "Dropping table: $table\n";
                $this->pdo->exec("DROP TABLE IF EXISTS `$table`");
            }

            // Re-enable foreign key checks
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

            echo "All tables have been dropped.\n";
        } catch (PDOException $e) {
            echo "Error dropping tables: " . $e->getMessage() . "\n";
        }
    }

    public function rollback($steps = 1) {
        $this->migration->createMigrationTable();

        $executedMigrations = $this->migration->getMigrations();

        if (empty($executedMigrations)) {
            echo "Nothing to rollback.\n";
            return;
        }

        $batches = [];
        foreach ($executedMigrations as $migration) {
            $batches[$migration['batch']][] = $migration;
        }

        $batchNumbers = array_keys($batches);
        rsort($batchNumbers);
        $batchesToRollback = array_slice($batchNumbers, 0, $steps);

        foreach ($batchesToRollback as $batch) {
            echo "Rolling back batch $batch\n";

            foreach ($batches[$batch] as $migration) {
                $migrationName = $migration['migration'];
                $file = $this->migrationsPath . '/' . $migrationName . '.php';

                if (file_exists($file)) {
                    require_once $file;
                    $className = $this->getMigrationClassName($migrationName);

                    if (class_exists($className)) {
                        $migrationObj = new $className();
                        echo "  Rolling back: $migrationName\n";

                        if (method_exists($migrationObj, 'down')) {
                            $migrationObj->down($this->migration);
                            $this->migration->removeMigration($migrationName);
                        }
                    }
                }
            }
        }

        echo "Rollback completed successfully.\n";
    }

    private function getMigrationClassName($filename) {
        $parts = explode('_', $filename);
        array_shift($parts);
        $name = implode('_', $parts);
        return studly_case($name) . 'Migration';
    }
}

if (!function_exists('studly_case')) {
    function studly_case($string) {
        $string = ucwords(str_replace(['-', '_'], ' ', $string));
        return str_replace(' ', '', $string);
    }
}
