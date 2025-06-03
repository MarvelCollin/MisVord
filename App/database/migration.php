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

    protected $lastColumn = null;

    public function __construct($pdo = null) {
        if ($pdo) {
            $this->pdo = $pdo;
        } else {
            try {
                require_once __DIR__ . '/../config/env.php';

                $host = EnvLoader::get('DB_HOST', 'db');
                $port = EnvLoader::get('DB_PORT', '1003');
                $username = EnvLoader::get('DB_USER', 'root');
                $password = EnvLoader::get('DB_PASS', 'kolin123');
                $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');

                $dsn = "mysql:host={$host};port={$port};charset={$charset}";

                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",

                    PDO::ATTR_PERSISTENT => false,
                ];

                $this->pdo = new PDO($dsn, $username, $password, $options);

                $this->charset = $charset;
                $this->collation = $charset === 'utf8mb4' ? 'utf8mb4_unicode_ci' : $charset . '_general_ci';

                echo "Connected to MySQL database at {$host}:{$port} as {$username}\n";
            } catch (PDOException $e) {
                die("Database connection failed: " . $e->getMessage());
            }
        }
    }

    private static function parseEnvFile($filePath) {
        if (!file_exists($filePath)) {
            return [];
        }

        $env = [];
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            if (strpos(trim($line), '//') === 0) {
                continue;
            }

            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

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

    public function createTableWithoutForeignKeys($tableName, callable $callback) {
        $this->tableName = $tableName;
        $this->columns = [];
        $this->foreignKeys = [];
        $this->indexes = [];
        $this->uniqueIndexes = [];
        $this->fulltextIndexes = [];
        $this->spatialIndexes = [];

        $callback($this);

        $storedForeignKeys = $this->foreignKeys;
        $this->foreignKeys = [];

        $sql = $this->buildCreateTableSQL();
        $result = $this->pdo->exec($sql);

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

    public function nullable() {
        if ($this->lastColumn !== null) {

            $columnIndex = count($this->columns) - 1;
            if ($columnIndex >= 0) {

                $column = $this->columns[$columnIndex];
                $column = str_replace('NOT NULL', 'NULL', $column);
                $this->columns[$columnIndex] = $column;
            }
        }
        return $this;
    }

    public function integer($name, $autoIncrement = false, $unsigned = false) {
        $type = $unsigned ? 'INT UNSIGNED' : 'INT';
        $ai = $autoIncrement ? ' AUTO_INCREMENT' : '';
        $this->columns[] = "`$name` $type NOT NULL$ai";
        $this->lastColumn = $name;
        return $this;
    }

    public function bigInteger($name, $autoIncrement = false, $unsigned = false, $nullable = false) {
        $type = $unsigned ? 'BIGINT UNSIGNED' : 'BIGINT';
        $ai = $autoIncrement ? ' AUTO_INCREMENT' : '';
        $null = $nullable ? ' NULL' : ' NOT NULL';
        $this->columns[] = "`$name` $type$null$ai";
        $this->lastColumn = $name;
        return $this;
    }

    public function string($name, $length = 255, $nullable = false) {
        $null = $nullable ? ' NULL' : ' NOT NULL';
        $this->columns[] = "`$name` VARCHAR($length)$null";
        $this->lastColumn = $name;
        return $this;
    }

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
        if (!empty($this->columns)) {
            $lastIndex = count($this->columns) - 1;
            $lastColumn = $this->columns[$lastIndex];

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

    public function index($columns, $name = null) {
        if (!is_array($columns)) {
            $columns = [$columns];
        }

        if ($name === null) {
            $name = $this->tableName . '_' . implode('_', $columns) . '_idx';
        }

        $columnStr = implode('`, `', $columns);

        $this->indexes[] = "INDEX `$name` (`$columnStr`)";

        return $this;
    }

    protected function buildCreateTableSQL() {
        $temporary = $this->temporary ? 'TEMPORARY' : '';
        $ifNotExists = $this->ifNotExists ? 'IF NOT EXISTS' : '';

        $sql = "CREATE $temporary TABLE $ifNotExists `{$this->tableName}` (";

        $columns = [];
        foreach ($this->columns as $column) {
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

    public function createMigrationTable() {
        try {
            $stmt = $this->pdo->prepare("SELECT 1 FROM migrations LIMIT 1");
            $stmt->execute();
            return true; 
        } catch (PDOException $e) {
            $sql = "CREATE TABLE IF NOT EXISTS `migrations` (
                `id` INT AUTO_INCREMENT PRIMARY KEY, 
                `migration` VARCHAR(255) NOT NULL, 
                `batch` INT NOT NULL,
                `created_at` TIMESTAMP NULL DEFAULT NULL,
                `updated_at` TIMESTAMP NULL DEFAULT NULL
            )";

            $result = $this->pdo->exec($sql);

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

    public function id() {
        $this->columns[] = "`id` INT AUTO_INCREMENT PRIMARY KEY";
        $this->lastColumn = 'id';
        return $this;
    }

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
        $basePath = dirname(__DIR__);

        if (!class_exists('EnvLoader')) {
            require_once $basePath . '/config/env.php';
        }

        if ($pdo === null) {

            $host = EnvLoader::get('DB_HOST', 'db');
            $port = EnvLoader::get('DB_PORT', '1003');
            $username = EnvLoader::get('DB_USER', 'root');
            $password = EnvLoader::get('DB_PASS', 'kolin123');
            $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');

            $dsn = "mysql:host={$host};port={$port};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",

                PDO::ATTR_PERSISTENT => false,
            ];

            try {

                $pdo = new PDO($dsn, $username, $password, $options);
                echo "MigrationRunner: Connected to MySQL database at {$host}:{$port} as {$username}\n";
            } catch (PDOException $e) {
                echo "MigrationRunner: Database connection failed: " . $e->getMessage() . "\n";
                throw $e;
            }
        }

        $this->pdo = $pdo;
        $this->migration = new Migration($pdo);
        $this->migrationsPath = $migrationsPath ?? $basePath . '/migrations';
    }    public function run() {
        $this->migration->createMigrationTable();
        echo "- Migration tracking table ready\n";

        $executedMigrations = $this->migration->getMigrations();
        $executedMigrationNames = array_column($executedMigrations, 'migration');

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

        echo "\n=== Migration execution order ===\n";
        foreach ($toRun as $migrationName => $info) {
            echo "- $migrationName => {$info['class']}\n";
        }
        echo "===========================\n\n";

        $batch = $this->migration->getLastBatchNumber() + 1;
        echo "Starting migration batch #{$batch}\n";
        echo "----------------------------------------\n";
        $count = 0;

        foreach ($toRun as $migrationName => $info) {
            $file = $info['path'];
            include_once $file;
        }

        $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        echo "Foreign key checks disabled for migration process\n";

        foreach ($toRun as $migrationName => $info) {
            $className = $info['class'];

            if (class_exists($className)) {
                $migration = new $className();
                echo "Migrating: $migrationName (using class $className)\n";

                try {
                    if (method_exists($migration, 'up')) {
                        $startTime = microtime(true);

                        $migration->up($this->migration);

                        $endTime = microtime(true);
                        $executionTime = round(($endTime - $startTime), 2);

                        $this->migration->logMigration($migrationName, $batch);
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

        $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        echo "Foreign key checks re-enabled\n";

        echo "----------------------------------------\n";
        echo "Migration completed successfully: {$count} migrations executed.\n";
    }

    public function fresh() {
        try {
            $this->dropAllTables();

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
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

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

            $batches = [];
            foreach ($executedMigrations as $migration) {
                $batches[$migration['batch']][] = $migration;
            }

            $batchNumbers = array_keys($batches);
            rsort($batchNumbers);

            if ($steps > count($batchNumbers)) {
                echo "Warning: You requested to rollback {$steps} batches, but only " . count($batchNumbers) . " exist.\n";
                $steps = count($batchNumbers);
            }

            $batchesToRollback = array_slice($batchNumbers, 0, $steps);

            if (empty($batchesToRollback)) {
                echo "No migrations to roll back.\n";
                return;
            }

            $migrationMap = $this->loadMigrationMap();

            foreach ($batchesToRollback as $batch) {
                echo "Rolling back batch {$batch}...\n";
                echo "----------------------------------------\n";

                $migrations = $batches[$batch];
                usort($migrations, function($a, $b) {
                    return strcmp($b['migration'], $a['migration']);
                });

                foreach ($migrations as $migration) {
                    $migrationName = $migration['migration'];

                    if (!isset($migrationMap[$migrationName])) {
                        echo "⨯ Migration file for '{$migrationName}' not found. Skipping.\n";
                        continue;
                    }

                    $info = $migrationMap[$migrationName];
                    $className = $info['class'];
                    $file = $info['path'];

                    if (file_exists($file)) {
                        require_once $file;

                        if (class_exists($className)) {
                            $migrationObj = new $className();
                            echo "Rolling back: {$migrationName} (using class {$className})\n";

                            try {
                                if (method_exists($migrationObj, 'down')) {
                                    $startTime = microtime(true);

                                    $migrationObj->down($this->migration);

                                    $endTime = microtime(true);
                                    $executionTime = round(($endTime - $startTime), 2);

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

    public function getAppliedMigrations() {
        try {

            $this->migration->createMigrationTable();
            return $this->migration->getMigrations();
        } catch (Exception $e) {
            echo "Error getting applied migrations: " . $e->getMessage() . "\n";
            return [];
        }
    }

    public function getPendingMigrations() {
        try {

            $migrationMap = $this->loadMigrationMap();
            $fileNames = array_keys($migrationMap);

            $this->migration->createMigrationTable();
            $appliedMigrations = $this->migration->getMigrations();
            $appliedFiles = array_column($appliedMigrations, 'migration');

            $pendingMigrations = array_diff($fileNames, $appliedFiles);

            return $pendingMigrations;
        } catch (Exception $e) {
            echo "Error getting pending migrations: " . $e->getMessage() . "\n";
            return [];
        }
    }

    public function checkConnection() {
        try {
            $host = EnvLoader::get('DB_HOST', 'db');
            $port = EnvLoader::get('DB_PORT', '1003');
            $dbname = EnvLoader::get('DB_NAME', 'misvord');
            $username = EnvLoader::get('DB_USER', 'root');
            $password = EnvLoader::get('DB_PASS', 'kolin123');

            echo "Connection test with these settings:\n";
            echo "- Host: {$host}\n";
            echo "- Port: {$port}\n";
            echo "- Database: {$dbname}\n";
            echo "- Username: {$username}\n";
            echo "- Password: " . (empty($password) ? "(empty)" : str_repeat('*', strlen($password))) . "\n\n";

            $dsn = "mysql:host={$host};port={$port}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",

                PDO::ATTR_PERSISTENT => false,

                PDO::ATTR_TIMEOUT => 5,
            ];

            $pdo = new PDO($dsn, $username, $password, $options);

            echo "\033[32m✓ Successfully connected to MySQL server.\033[0m\n";

            try {
                $pdo->query("USE `{$dbname}`");
                echo "\033[32m✓ Successfully connected to database '{$dbname}'.\033[0m\n";
            } catch (PDOException $e) {
                echo "\033[33m! Database '{$dbname}' doesn't exist.\033[0m\n";

                try {
                    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    echo "\033[32m✓ Successfully created database '{$dbname}'.\033[0m\n";

                    $pdo->query("USE `{$dbname}`");
                    echo "\033[32m✓ Successfully switched to database '{$dbname}'.\033[0m\n";
                } catch (PDOException $e) {
                    echo "\033[31m✗ Could not create database: " . $e->getMessage() . "\033[0m\n";
                    return false;
                }
            }

            try {
                $createTableSQL = "CREATE TABLE IF NOT EXISTS `migrations` (
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                    `migration` varchar(255) NOT NULL,
                    `batch` int(11) NOT NULL,
                    PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

                $pdo->exec($createTableSQL);
                echo "\033[32m✓ Migration table exists or was created successfully.\033[0m\n";
            } catch (PDOException $e) {
                echo "\033[31m✗ Could not create migration table: " . $e->getMessage() . "\033[0m\n";
            }

            echo "\n\033[32mDatabase connection is fully working!\033[0m\n";
            return true;
        } catch (PDOException $e) {
            echo "\033[31m✗ Connection failed: " . $e->getMessage() . "\033[0m\n";

            if (strpos($e->getMessage(), 'Connection refused') !== false) {
                echo "\nTroubleshooting tips:\n";
                echo "1. Make sure Docker is running with: docker ps\n";
                echo "2. Check if MySQL container is running with: docker ps | grep mysql\n";
                echo "3. Make sure port {$port} is being exposed in docker-compose.yml\n";
                echo "4. If outside Docker, make sure your host can connect to the container\n";
            } elseif (strpos($e->getMessage(), 'Access denied') !== false) {
                echo "\nTroubleshooting tips:\n";
                echo "1. Check if the username and password are correct\n";
                echo "2. Make sure the user has access to the database\n";
                echo "3. Check environment variables or .env file settings\n";
            }

            return false;
        }
    }
}

if (!function_exists('studly_case')) {
    function studly_case($string) {
        $string = ucwords(str_replace(['-', '_'], ' ', $string));
        return str_replace(' ', '', $string);
    }
}