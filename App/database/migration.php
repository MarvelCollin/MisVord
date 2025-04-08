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
                $envFile = __DIR__ . '/../../.env';
                $config = self::parseEnvFile($envFile);
                
                $host = $config['DB_HOST'] ?? 'localhost';
                $dbname = $config['DB_NAME'] ?? 'your_database';
                $username = $config['DB_USER'] ?? 'root';
                $password = $config['DB_PASS'] ?? '';
                $charset = $config['DB_CHARSET'] ?? 'utf8mb4';
                
                $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
                $this->pdo = new PDO($dsn, $username, $password);
                $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Set default engine and charset from config if available
                if (isset($config['DB_CHARSET'])) {
                    $this->charset = $config['DB_CHARSET'];
                    // Default collation for utf8mb4
                    if ($config['DB_CHARSET'] === 'utf8mb4') {
                        $this->collation = 'utf8mb4_unicode_ci';
                    }
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

    public function id($columnName = 'id') {
        $this->primaryKey = $columnName;
        return $this->bigInteger($columnName, true, true);
    }

    public function string($columnName, $length = 255, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT '$default'" : '';
        
        $this->columns[] = "`$columnName` VARCHAR($length) $nullStatement $defaultStatement";
        return $this;
    }

    public function text($columnName, $nullable = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        
        $this->columns[] = "`$columnName` TEXT $nullStatement";
        return $this;
    }

    public function mediumText($columnName, $nullable = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        
        $this->columns[] = "`$columnName` MEDIUMTEXT $nullStatement";
        return $this;
    }

    public function longText($columnName, $nullable = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        
        $this->columns[] = "`$columnName` LONGTEXT $nullStatement";
        return $this;
    }

    public function integer($columnName, $autoIncrement = false, $unsigned = false, $nullable = false, $default = null) {
        $unsignedStatement = $unsigned ? 'UNSIGNED' : '';
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $autoIncrementStatement = $autoIncrement ? 'AUTO_INCREMENT' : '';
        $defaultStatement = ($default !== null && !$autoIncrement) ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` INT $unsignedStatement $nullStatement $autoIncrementStatement $defaultStatement";
        
        if ($autoIncrement && $this->primaryKey === $columnName) {
            $this->columns[] = "PRIMARY KEY (`$columnName`)";
        }
        
        return $this;
    }

    public function tinyInteger($columnName, $autoIncrement = false, $unsigned = false, $nullable = false, $default = null) {
        $unsignedStatement = $unsigned ? 'UNSIGNED' : '';
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $autoIncrementStatement = $autoIncrement ? 'AUTO_INCREMENT' : '';
        $defaultStatement = ($default !== null && !$autoIncrement) ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` TINYINT $unsignedStatement $nullStatement $autoIncrementStatement $defaultStatement";
        
        if ($autoIncrement && $this->primaryKey === $columnName) {
            $this->columns[] = "PRIMARY KEY (`$columnName`)";
        }
        
        return $this;
    }

    public function smallInteger($columnName, $autoIncrement = false, $unsigned = false, $nullable = false, $default = null) {
        $unsignedStatement = $unsigned ? 'UNSIGNED' : '';
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $autoIncrementStatement = $autoIncrement ? 'AUTO_INCREMENT' : '';
        $defaultStatement = ($default !== null && !$autoIncrement) ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` SMALLINT $unsignedStatement $nullStatement $autoIncrementStatement $defaultStatement";
        
        if ($autoIncrement && $this->primaryKey === $columnName) {
            $this->columns[] = "PRIMARY KEY (`$columnName`)";
        }
        
        return $this;
    }

    public function mediumInteger($columnName, $autoIncrement = false, $unsigned = false, $nullable = false, $default = null) {
        $unsignedStatement = $unsigned ? 'UNSIGNED' : '';
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $autoIncrementStatement = $autoIncrement ? 'AUTO_INCREMENT' : '';
        $defaultStatement = ($default !== null && !$autoIncrement) ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` MEDIUMINT $unsignedStatement $nullStatement $autoIncrementStatement $defaultStatement";
        
        if ($autoIncrement && $this->primaryKey === $columnName) {
            $this->columns[] = "PRIMARY KEY (`$columnName`)";
        }
        
        return $this;
    }

    public function bigInteger($columnName, $autoIncrement = false, $unsigned = false, $nullable = false, $default = null) {
        $unsignedStatement = $unsigned ? 'UNSIGNED' : '';
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $autoIncrementStatement = $autoIncrement ? 'AUTO_INCREMENT' : '';
        $defaultStatement = ($default !== null && !$autoIncrement) ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` BIGINT $unsignedStatement $nullStatement $autoIncrementStatement $defaultStatement";
        
        if ($autoIncrement && $this->primaryKey === $columnName) {
            $this->columns[] = "PRIMARY KEY (`$columnName`)";
        }
        
        return $this;
    }

    public function float($columnName, $total = 8, $places = 2, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` FLOAT($total, $places) $nullStatement $defaultStatement";
        return $this;
    }

    public function decimal($columnName, $total = 8, $places = 2, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` DECIMAL($total, $places) $nullStatement $defaultStatement";
        return $this;
    }

    public function double($columnName, $total = 8, $places = 2, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT $default" : '';
        
        $this->columns[] = "`$columnName` DOUBLE($total, $places) $nullStatement $defaultStatement";
        return $this;
    }

    public function boolean($columnName, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT " . ($default ? 1 : 0) : '';
        
        $this->columns[] = "`$columnName` TINYINT(1) $nullStatement $defaultStatement";
        return $this;
    }

    public function enum($columnName, array $values, $nullable = false, $default = null) {
        $valuesEscaped = array_map(function($value) {
            return "'" . addslashes($value) . "'";
        }, $values);
        
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT '$default'" : '';
        
        $this->columns[] = "`$columnName` ENUM(" . implode(', ', $valuesEscaped) . ") $nullStatement $defaultStatement";
        return $this;
    }

    public function date($columnName, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT '$default'" : '';
        
        $this->columns[] = "`$columnName` DATE $nullStatement $defaultStatement";
        return $this;
    }

    public function dateTime($columnName, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT '$default'" : '';
        
        $this->columns[] = "`$columnName` DATETIME $nullStatement $defaultStatement";
        return $this;
    }

    public function timestamp($columnName, $nullable = false, $default = 'CURRENT_TIMESTAMP', $onUpdate = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT $default" : '';
        $onUpdateStatement = $onUpdate ? "ON UPDATE CURRENT_TIMESTAMP" : '';
        
        $this->columns[] = "`$columnName` TIMESTAMP $nullStatement $defaultStatement $onUpdateStatement";
        return $this;
    }

    public function time($columnName, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT '$default'" : '';
        
        $this->columns[] = "`$columnName` TIME $nullStatement $defaultStatement";
        return $this;
    }

    public function year($columnName, $nullable = false, $default = null) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        $defaultStatement = $default !== null ? "DEFAULT '$default'" : '';
        
        $this->columns[] = "`$columnName` YEAR $nullStatement $defaultStatement";
        return $this;
    }

    public function binary($columnName, $length = 255, $nullable = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        
        $this->columns[] = "`$columnName` BINARY($length) $nullStatement";
        return $this;
    }

    public function blob($columnName, $nullable = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        
        $this->columns[] = "`$columnName` BLOB $nullStatement";
        return $this;
    }

    public function json($columnName, $nullable = false) {
        $nullStatement = $nullable ? 'NULL' : 'NOT NULL';
        
        $this->columns[] = "`$columnName` JSON $nullStatement";
        return $this;
    }

    public function timestamps($createdAt = 'created_at', $updatedAt = 'updated_at') {
        $this->timestamp($createdAt, false, 'CURRENT_TIMESTAMP', false);
        $this->timestamp($updatedAt, false, 'CURRENT_TIMESTAMP', true);
        return $this;
    }

    public function softDeletes($columnName = 'deleted_at') {
        $this->timestamp($columnName, true, null, false);
        return $this;
    }

    public function primaryKey($columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $columnsStr = implode('`, `', $columns);
        $this->columns[] = "PRIMARY KEY (`$columnsStr`)";
        return $this;
    }

    public function unique($indexName, $columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $columnsStr = implode('`, `', $columns);
        $this->uniqueIndexes[] = "UNIQUE INDEX `$indexName` (`$columnsStr`)";
        return $this;
    }

    public function index($indexName, $columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $columnsStr = implode('`, `', $columns);
        $this->indexes[] = "INDEX `$indexName` (`$columnsStr`)";
        return $this;
    }

    public function fulltext($indexName, $columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $columnsStr = implode('`, `', $columns);
        $this->fulltextIndexes[] = "FULLTEXT INDEX `$indexName` (`$columnsStr`)";
        return $this;
    }

    public function spatial($indexName, $columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $columnsStr = implode('`, `', $columns);
        $this->spatialIndexes[] = "SPATIAL INDEX `$indexName` (`$columnsStr`)";
        return $this;
    }

    public function foreignKey($columns, $referencedTable, $referencedColumns, $onDelete = 'CASCADE', $onUpdate = 'CASCADE') {
        $columns = is_array($columns) ? $columns : [$columns];
        $referencedColumns = is_array($referencedColumns) ? $referencedColumns : [$referencedColumns];
        
        $columnsStr = implode('`, `', $columns);
        $referencedColumnsStr = implode('`, `', $referencedColumns);
        $constraintName = "fk_" . $this->tableName . "_" . implode('_', $columns);
        
        $this->foreignKeys[] = "CONSTRAINT `$constraintName` FOREIGN KEY (`$columnsStr`) REFERENCES `$referencedTable` (`$referencedColumnsStr`) ON DELETE $onDelete ON UPDATE $onUpdate";
        return $this;
    }

    public function engine($engine) {
        $this->engine = $engine;
        return $this;
    }

    public function charset($charset) {
        $this->charset = $charset;
        return $this;
    }

    public function collation($collation) {
        $this->collation = $collation;
        return $this;
    }

    public function temporary() {
        $this->temporary = true;
        return $this;
    }

    public function ifNotExists() {
        $this->ifNotExists = true;
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
        return $this->createTable('migrations', function($table) {
            $table->id();
            $table->string('migration');
            $table->integer('batch');
            $table->timestamps();
        });
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
        $this->pdo = $pdo;
        $this->migration = new Migration($pdo);
        $this->migrationsPath = $migrationsPath ?? __DIR__ . '/../migrations';
    }
    
    public function run() {
        $this->migration->createMigrationTable();
        
        $executedMigrations = $this->migration->getMigrations();
        $executedMigrationNames = array_column($executedMigrations, 'migration');
        
        $migrationFiles = glob($this->migrationsPath . '/*.php');
        sort($migrationFiles);
        
        $toRun = [];
        foreach ($migrationFiles as $file) {
            $migrationName = pathinfo($file, PATHINFO_FILENAME);
            if (!in_array($migrationName, $executedMigrationNames)) {
                $toRun[] = $file;
            }
        }
        
        if (empty($toRun)) {
            echo "No migrations to run.\n";
            return;
        }
        
        $batch = $this->migration->getLastBatchNumber() + 1;
        
        foreach ($toRun as $file) {
            require_once $file;
            $migrationName = pathinfo($file, PATHINFO_FILENAME);
            $className = $this->getMigrationClassName($migrationName);
            
            if (class_exists($className)) {
                $migration = new $className();
                echo "Running migration: $migrationName\n";
                
                if (method_exists($migration, 'up')) {
                    $migration->up($this->migration);
                    $this->migration->logMigration($migrationName, $batch);
                }
            }
        }
        
        echo "Migration completed successfully.\n";
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
            echo "Rolling back batch
            
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
?>
