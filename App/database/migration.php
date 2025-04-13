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
    // Track nullable status for columns
    protected $lastColumn = null;

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
    }    public function createTable($tableName, callable $callback) {
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
    
    /**
     * Creates a table with deferred foreign key constraints
     * This is useful when tables reference each other circularly
     *
     * @param string $tableName The name of the table
     * @param callable $callback The callback that defines the table
     * @return bool Whether the table was created successfully
     */
    public function createTableWithoutForeignKeys($tableName, callable $callback) {
        $this->tableName = $tableName;
        $this->columns = [];
        $this->foreignKeys = [];
        $this->indexes = [];
        $this->uniqueIndexes = [];
        $this->fulltextIndexes = [];
        $this->spatialIndexes = [];

        $callback($this);

        // Store foreign keys for later processing
        $storedForeignKeys = $this->foreignKeys;
        $this->foreignKeys = [];

        $sql = $this->buildCreateTableSQL();
        $result = $this->pdo->exec($sql);

        // Store the foreign keys for this table for later addition
        if (!empty($storedForeignKeys)) {
            static $deferredForeignKeys = [];
            $deferredForeignKeys[$tableName] = $storedForeignKeys;
        }

        return $result;
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

    /**
     * Set the last column definition as nullable
     * 
     * @return $this
     */
    public function nullable() {
        if ($this->lastColumn !== null) {
            // Find the last column and add NULL to it
            $columnIndex = count($this->columns) - 1;
            if ($columnIndex >= 0) {
                // Replace NOT NULL with NULL in the column definition
                $column = $this->columns[$columnIndex];
                $column = str_replace('NOT NULL', 'NULL', $column);
                $this->columns[$columnIndex] = $column;
            }
        }
        return $this;
    }

    /**
     * Add integer column
     * 
     * @param string $name Column name
     * @param bool $autoIncrement Whether to auto-increment
     * @param bool $unsigned Whether the integer is unsigned
     * @return $this
     */
    public function integer($name, $autoIncrement = false, $unsigned = false) {
        $type = $unsigned ? 'INT UNSIGNED' : 'INT';
        $ai = $autoIncrement ? ' AUTO_INCREMENT' : '';
        $this->columns[] = "`$name` $type NOT NULL$ai";
        $this->lastColumn = $name;
        return $this;
    }

    /**
     * Add big integer column
     * 
     * @param string $name Column name
     * @param bool $autoIncrement Whether to auto-increment
     * @param bool $unsigned Whether the integer is unsigned
     * @param bool $nullable Whether the column can be NULL
     * @return $this
     */
    public function bigInteger($name, $autoIncrement = false, $unsigned = false, $nullable = false) {
        $type = $unsigned ? 'BIGINT UNSIGNED' : 'BIGINT';
        $ai = $autoIncrement ? ' AUTO_INCREMENT' : '';
        $null = $nullable ? ' NULL' : ' NOT NULL';
        $this->columns[] = "`$name` $type$null$ai";
        $this->lastColumn = $name;
        return $this;
    }

    /**
     * Add string column
     * 
     * @param string $name Column name
     * @param int $length Column length
     * @param bool $nullable Whether the column can be NULL
     * @return $this
     */
    public function string($name, $length = 255, $nullable = false) {
        $null = $nullable ? ' NULL' : ' NOT NULL';
        $this->columns[] = "`$name` VARCHAR($length)$null";
        $this->lastColumn = $name;
        return $this;
    }

    /**
     * Add text column
     * 
     * @param string $name Column name
     * @param bool $nullable Whether the column can be NULL
     * @return $this
     */
    public function text($name, $nullable = false) {
        $null = $nullable ? ' NULL' : ' NOT NULL';
        $this->columns[] = "`$name` TEXT$null";
        $this->lastColumn = $name;
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

    /**
     * Add an index to a column
     * 
     * @param string|array $columns Column name(s)
     * @param string|null $name Index name (optional)
     * @return $this
     */
    public function index($columns, $name = null) {
        // Convert to array if a single column
        if (!is_array($columns)) {
            $columns = [$columns];
        }
        
        // Generate index name if not provided
        if ($name === null) {
            $name = $this->tableName . '_' . implode('_', $columns) . '_idx';
        }
        
        // Convert columns to string with proper backticks
        $columnStr = implode('`, `', $columns);
        
        // Add to indexes array
        $this->indexes[] = "INDEX `$name` (`$columnStr`)";
        
        return $this;
    }

    protected function buildCreateTableSQL() {
        $temporary = $this->temporary ? 'TEMPORARY' : '';
        $ifNotExists = $this->ifNotExists ? 'IF NOT EXISTS' : '';

        $sql = "CREATE $temporary TABLE $ifNotExists `{$this->tableName}` (";

        $columns = [];
        foreach ($this->columns as $column) {
            // Check if the column is nullable and adjust the SQL accordingly
            if (stripos($column, 'NOT NULL') !== false) {
                $column = str_ireplace('NOT NULL', '', $column);
                $column = trim($column);
                $columns[] = "$column";
            } else {
                $columns[] = "$column";
            }
        }

        $sql .= implode(", ", $columns);

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

    /**
     * Create migrations table if it doesn't exist
     * 
     * @return bool Whether the table exists or was created successfully
     */
    public function createMigrationTable() {
        try {
            // Check if migrations table exists
            $stmt = $this->pdo->prepare("SELECT 1 FROM migrations LIMIT 1");
            $stmt->execute();
            return true; // Table exists
        } catch (PDOException $e) {
            // Table doesn't exist, create it
            $sql = "CREATE TABLE IF NOT EXISTS `migrations` (
                `id` INT AUTO_INCREMENT PRIMARY KEY, 
                `migration` VARCHAR(255) NOT NULL, 
                `batch` INT NOT NULL,
                `created_at` TIMESTAMP NULL DEFAULT NULL,
                `updated_at` TIMESTAMP NULL DEFAULT NULL
            )";
            
            $result = $this->pdo->exec($sql);
            
            // Verify the table was created
            try {
                $stmt = $this->pdo->prepare("SELECT 1 FROM migrations LIMIT 1");
                $stmt->execute();
                return true;
            } catch (PDOException $e) {
                error_log("Failed to create migrations table: " . $e->getMessage());
                return false;
            }
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

    /**
     * Add a primary key auto-increment ID column
     * 
     * @return $this
     */
    public function id() {
        $this->columns[] = "`id` INT AUTO_INCREMENT PRIMARY KEY";
        $this->lastColumn = 'id';
        return $this;
    }

    /**
     * Execute a raw SQL query
     * 
     * @param string $sql Raw SQL query
     * @return bool Whether the query was successful
     */
    public function raw($sql) {
        try {
            return $this->pdo->exec($sql);
        } catch (PDOException $e) {
            error_log("Database error in raw SQL: " . $e->getMessage());
            throw $e;
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
    }    public function run() {
        $this->migration->createMigrationTable();
        echo "- Migration tracking table ready\n";

        $executedMigrations = $this->migration->getMigrations();
        $executedMigrationNames = array_column($executedMigrations, 'migration');

        // Use the connector to get migration mapping
        $migrationMap = $this->loadMigrationMap();

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
            echo "Nothing to migrate. All migrations have been run.\n";
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
        
        // Disable foreign key checks before running migrations
        $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        echo "Foreign key checks disabled for migration process\n";

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
                    echo "Re-enabling foreign key checks...\n";
                    $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                    return;
                }
            } else {
                echo "⨯ Class '$className' not found after loading file {$info['path']}\n";
            }
        }
        
        // Re-enable foreign key checks after all migrations are run
        $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        echo "Foreign key checks re-enabled\n";

        echo "----------------------------------------\n";
        echo "Migration completed successfully: {$count} migrations executed.\n";
    }

    /**
     * Drop all tables and re-run all migrations
     * 
     * @return void
     */
    public function fresh() {
        try {
            // First drop all tables
            $this->dropAllTables();
            
            // Then run all migrations
            $this->run();
            
            echo "----------------------------------------\n";
            echo "Database refreshed successfully.\n";
        } catch (Exception $e) {
            echo "Error refreshing database: {$e->getMessage()}\n";
        }
    }

    public function dropAllTables() {
        try {
            echo "Starting database cleanup...\n";
            // Disable foreign key checks temporarily
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            // Get list of all tables in the database
            $stmt = $this->pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (count($tables) === 0) {
                echo "No tables found in the database.\n";
            } else {
                echo "Found " . count($tables) . " tables to drop.\n";
                
                foreach ($tables as $table) {
                    echo "Dropping table: $table\n";
                    $this->pdo->exec("DROP TABLE IF EXISTS `$table`");
                }
            }

            // Re-enable foreign key checks
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

            echo "Database cleanup completed. All tables have been dropped.\n";
        } catch (PDOException $e) {
            echo "Error dropping tables: " . $e->getMessage() . "\n";
        }
    }

    public function rollback($steps = 1) {
        try {
            $this->migration->createMigrationTable();

            $executedMigrations = $this->migration->getMigrations();

            if (empty($executedMigrations)) {
                echo "Nothing to rollback. No migrations have been run.\n";
                return;
            }

            // Group migrations by batch
            $batches = [];
            foreach ($executedMigrations as $migration) {
                $batches[$migration['batch']][] = $migration;
            }

            $batchNumbers = array_keys($batches);
            rsort($batchNumbers); // Sort batches in descending order
            
            if ($steps > count($batchNumbers)) {
                echo "Warning: You requested to rollback {$steps} batches, but only " . count($batchNumbers) . " exist.\n";
                $steps = count($batchNumbers);
            }
            
            $batchesToRollback = array_slice($batchNumbers, 0, $steps);
            
            if (empty($batchesToRollback)) {
                echo "No migrations to roll back.\n";
                return;
            }

            // Load the migration map to get class names
            $migrationMap = $this->loadMigrationMap();
            
            foreach ($batchesToRollback as $batch) {
                echo "Rolling back batch {$batch}...\n";
                echo "----------------------------------------\n";
                
                // Process migrations in reverse order within each batch
                $migrations = $batches[$batch];
                // Sort migrations in reverse order to roll them back correctly
                usort($migrations, function($a, $b) {
                    return strcmp($b['migration'], $a['migration']); // Descending order
                });

                foreach ($migrations as $migration) {
                    $migrationName = $migration['migration'];
                    
                    // Get migration info from the map
                    if (!isset($migrationMap[$migrationName])) {
                        echo "⨯ Migration file for '{$migrationName}' not found. Skipping.\n";
                        continue;
                    }
                    
                    $info = $migrationMap[$migrationName];
                    $className = $info['class'];
                    $file = $info['path'];
                    
                    // Include the file if it exists
                    if (file_exists($file)) {
                        require_once $file;
                        
                        if (class_exists($className)) {
                            $migrationObj = new $className();
                            echo "Rolling back: {$migrationName} (using class {$className})\n";
                            
                            try {
                                if (method_exists($migrationObj, 'down')) {
                                    // Start tracking execution time
                                    $startTime = microtime(true);
                                    
                                    // Run the down migration
                                    $migrationObj->down($this->migration);
                                    
                                    // Calculate execution time
                                    $endTime = microtime(true);
                                    $executionTime = round(($endTime - $startTime), 2);
                                    
                                    // Remove from migrations table
                                    $this->migration->removeMigration($migrationName);
                                    
                                    echo "✓ Rolled back: {$migrationName} ({$executionTime}s)\n";
                                } else {
                                    echo "⨯ Method 'down' not found in class {$className}\n";
                                }
                            } catch (Exception $e) {
                                echo "⨯ Rollback failed: {$e->getMessage()}\n";
                            }
                        } else {
                            echo "⨯ Class '{$className}' not found in file {$file}\n";
                        }
                    } else {
                        echo "⨯ Migration file {$file} does not exist\n";
                    }
                }
                echo "----------------------------------------\n";
            }

            echo "Rollback completed successfully.\n";
        } catch (Exception $e) {
            echo "Error during rollback: {$e->getMessage()}\n";
        }
    }

    /**
     * Load the migration map from the connector file
     * 
     * @return array The migration map
     */
    private function loadMigrationMap() {
        $connectorFile = $this->migrationsPath . '/connector.php';
        
        if (!file_exists($connectorFile)) {
            echo "Error: Migration connector file not found at {$connectorFile}\n";
            return [];
        }
        
        try {
            $map = require $connectorFile;
            return is_array($map) ? $map : [];
        } catch (Exception $e) {
            echo "Error loading migration map: {$e->getMessage()}\n";
            return [];
        }
    }
}

if (!function_exists('studly_case')) {
    function studly_case($string) {
        $string = ucwords(str_replace(['-', '_'], ' ', $string));
        return str_replace(' ', '', $string);
    }
}
