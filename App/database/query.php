<?php

class Query {
    private $pdo;
    private $table;
    private $select = '*';
    private $where = [];
    private $orderBy = [];
    private $limit = null;
    private $offset = null;
    private $joins = [];
    private $bindings = [];
    private $groupBy = [];
    private $having = [];
    private $havingBindings = [];
    private $distinct = false;
    private $unionQueries = [];
    private $raw = [];
      public function __construct($pdo = null) {
        if (file_exists(__DIR__ . '/../utils/AppLogger.php')) {
            require_once __DIR__ . '/../utils/AppLogger.php';
        }
        
        if ($pdo) {
            $this->pdo = $pdo;
            if (function_exists('logger')) {
                logger()->debug("Query: Using provided PDO connection");
            }
        } else {
            try {
                require_once __DIR__ . '/../config/env.php';

                $isDocker = (
                    getenv('IS_DOCKER') === 'true' || 
                    isset($_SERVER['IS_DOCKER']) || 
                    getenv('CONTAINER') !== false ||
                    isset($_SERVER['CONTAINER']) ||
                    file_exists('/.dockerenv')
                );

                $dbHost = $isDocker ? 'db' : EnvLoader::get('DB_HOST', 'localhost');
                $port = EnvLoader::get('DB_PORT', '1003');
                $dbname = EnvLoader::get('DB_NAME', 'misvord');
                $username = EnvLoader::get('DB_USER', 'root');
                $password = EnvLoader::get('DB_PASS', 'kolin123');
                $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');

                $dsn = "mysql:host={$dbHost};port={$port};dbname={$dbname};charset={$charset}";

                if (function_exists('logger')) {
                    logger()->debug("Connecting to database", [
                        'host' => $dbHost,
                        'port' => $port,
                        'database' => $dbname,
                        'charset' => $charset
                    ]);
                }

                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",
                    PDO::ATTR_PERSISTENT => false,
                ];

                $this->pdo = new PDO($dsn, $username, $password, $options);

                $stmt = $this->pdo->query('SELECT DATABASE() as current_db');
                $result = $stmt->fetch();

                if ($result['current_db'] !== $dbname) {
                    $error = "Connected to wrong database: {$result['current_db']}, expected: $dbname";
                    if (function_exists('logger')) {
                        logger()->error("Database connection error: $error");
                    }
                    throw new PDOException($error);
                }

                if (function_exists('logger')) {
                    logger()->info("Database connected successfully", [
                        'database' => $result['current_db']
                    ]);
                }

            } catch (PDOException $e) {
                if (function_exists('logger')) {
                    logger()->error("Database connection failed", [
                        'error' => $e->getMessage(),
                        'host' => $dbHost,
                        'port' => $port,
                        'database' => $dbname,
                        'user' => $username
                    ]);
                } else {
                    log_error("Database connection failed", [
                        'error' => $e->getMessage(),
                        'host' => $dbHost,
                        'port' => $port,
                        'database' => $dbname,
                        'user' => $username
                    ]);
                }
                die("Database connection failed: " . $e->getMessage());
            }
        }
    }

    public function table($tableName) {
        $this->table = $tableName;
        return $this;
    }

    public function select($columns) {
        $this->select = is_array($columns) ? implode(', ', $columns) : $columns;
        return $this;
    }

    public function distinct() {
        $this->distinct = true;
        return $this;
    }

    public function where($column, $operator = null, $value = null) {
        
        if ($column instanceof Closure) {
            $query = new self($this->pdo);
            $column($query);
            
            $this->where[] = [
                'type' => 'NESTED',
                'query' => $query
            ];
            
            
            $this->bindings = array_merge($this->bindings, $query->getBindings());
            return $this;
        }
        
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->where[] = compact('column', 'operator', 'value');
        $this->bindings[] = $value;
        return $this;
    }

    public function orWhere($column, $operator = null, $value = null) {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->where[] = [
            'type' => 'OR',
            'column' => $column,
            'operator' => $operator,
            'value' => $value
        ];
        $this->bindings[] = $value;
        return $this;
    }

    public function whereIn($column, array $values) {
        $placeholders = implode(', ', array_fill(0, count($values), '?'));
        $this->where[] = [
            'column' => $column,
            'operator' => 'IN',
            'value' => "($placeholders)",
            'raw' => true
        ];

        foreach ($values as $value) {
            $this->bindings[] = $value;
        }

        return $this;
    }

    public function whereNotIn($column, array $values) {
        $placeholders = implode(', ', array_fill(0, count($values), '?'));
        $this->where[] = [
            'column' => $column,
            'operator' => 'NOT IN',
            'value' => "($placeholders)",
            'raw' => true
        ];

        foreach ($values as $value) {
            $this->bindings[] = $value;
        }

        return $this;
    }

    public function whereNull($column) {
        $this->where[] = [
            'column' => $column,
            'operator' => 'IS',
            'value' => 'NULL',
            'raw' => true
        ];
        return $this;
    }

    public function whereNotNull($column) {
        $this->where[] = [
            'column' => $column,
            'operator' => 'IS NOT',
            'value' => 'NULL',
            'raw' => true
        ];
        return $this;
    }

    public function whereBetween($column, array $range) {
        if (count($range) !== 2) {
            throw new InvalidArgumentException('Between range must have exactly 2 values');
        }

        $this->where[] = [
            'column' => $column,
            'operator' => 'BETWEEN',
            'value' => '? AND ?',
            'raw' => true
        ];

        $this->bindings[] = $range[0];
        $this->bindings[] = $range[1];

        return $this;
    }

    public function whereNotBetween($column, array $range) {
        if (count($range) !== 2) {
            throw new InvalidArgumentException('Between range must have exactly 2 values');
        }

        $this->where[] = [
            'column' => $column,
            'operator' => 'NOT BETWEEN',
            'value' => '? AND ?',
            'raw' => true
        ];

        $this->bindings[] = $range[0];
        $this->bindings[] = $range[1];

        return $this;
    }

    public function whereLike($column, $pattern) {
        return $this->where($column, 'LIKE', $pattern);
    }

    public function whereNotLike($column, $pattern) {
        return $this->where($column, 'NOT LIKE', $pattern);
    }

    public function orWhereLike($column, $pattern) {
        return $this->orWhere($column, 'LIKE', $pattern);
    }

    /**
     * Add a raw SQL condition to the WHERE clause. The provided expression is inserted directly into the query,
     * so make sure it is properly sanitized/parameterised before calling this method.
     *
     * Example:
     *     ->whereRaw('cp1.user_id != cp2.user_id')
     *
     * @param string $expression Raw SQL condition to append in the WHERE clause
     * @return $this
     */
    public function whereRaw($expression) {
        $this->where[] = [
            'column' => $expression,
            'operator' => '',
            'value' => '',
            'raw' => true
        ];
        return $this;
    }

    public function groupBy($column) {
        if (is_array($column)) {
            $this->groupBy = array_merge($this->groupBy, $column);
        } else {
            $this->groupBy[] = $column;
        }
        return $this;
    }

    public function having($column, $operator = null, $value = null) {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->having[] = compact('column', 'operator', 'value');
        $this->havingBindings[] = $value;
        return $this;
    }

    public function orHaving($column, $operator = null, $value = null) {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->having[] = [
            'type' => 'OR',
            'column' => $column,
            'operator' => $operator,
            'value' => $value
        ];
        $this->havingBindings[] = $value;
        return $this;
    }

    public function join($table, $first, $operator, $second, $type = 'INNER') {
        $this->joins[] = compact('table', 'first', 'operator', 'second', 'type');
        return $this;
    }

    public function leftJoin($table, $first, $operator, $second) {
        return $this->join($table, $first, $operator, $second, 'LEFT');
    }

    public function rightJoin($table, $first, $operator, $second) {
        return $this->join($table, $first, $operator, $second, 'RIGHT');
    }

    public function orderBy($column, $direction = 'ASC') {
        $this->orderBy[] = compact('column', 'direction');
        return $this;
    }

    public function limit($limit) {
        $this->limit = $limit;
        return $this;
    }

    public function offset($offset) {
        $this->offset = $offset;
        return $this;
    }

    public function union(Query $query) {
        $this->unionQueries[] = ['type' => 'UNION', 'query' => $query];
        return $this;
    }

    public function unionAll(Query $query) {
        $this->unionQueries[] = ['type' => 'UNION ALL', 'query' => $query];
        return $this;
    }

    public function raw($sql) {
        try {
            $stmt = $this->pdo->query($sql);
            if ($stmt) {
                $stmt->closeCursor(); 
            }
            return $this;
        } catch (PDOException $e) {

            log_error("Database error in query", [
                'error' => $e->getMessage(),
                'query' => $sql
            ]);
            return $this;
        }
    }

    public function rawQuery($sql) {
        try {
            $stmt = $this->pdo->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor(); 
            return $results;
        } catch (PDOException $e) {
            log_error("Database error in rawQuery", [
                'error' => $e->getMessage(),
                'query' => $sql
            ]);
            return [];
        }
    }

    /**
     * Execute a raw parameterized query
     *
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind to the query
     * @return array Results from the query
     */
    public function query($sql, array $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            return $results;
        } catch (PDOException $e) {
            log_error("Database error in parameterized query", [
                'error' => $e->getMessage(),
                'query' => $sql,
                'params' => $params
            ]);
            return [];
        }
    }

    public function get() {
        $startTime = microtime(true);
        $query = $this->buildSelectQuery();
        
        try {
            $stmt = $this->pdo->prepare($query);
            $this->execute($stmt, $this->bindings);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, null, [
                    'bindings' => $this->bindings,
                    'result_count' => count($result)
                ]);
            }
            
            return $result;
        } catch (Exception $e) {
            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, $e->getMessage(), [
                    'bindings' => $this->bindings
                ]);
            }
            throw $e;
        }
    }

    public function first() {
        $startTime = microtime(true);
        $this->limit(1);
        
        
        if (empty($this->table)) {
            if (function_exists('logger')) {
                logger()->error("Query error: No table specified for first() method");
            }
            error_log("Query error: No table specified for first() method");
            return null;
        }
        
        $query = $this->buildSelectQuery();
        
        try {
            $stmt = $this->pdo->prepare($query);
            $this->execute($stmt, $this->bindings);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, null, [
                    'bindings' => $this->bindings,
                    'found' => $result !== false
                ]);
            }
            
            return $result;
        } catch (Exception $e) {
            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, $e->getMessage(), [
                    'bindings' => $this->bindings
                ]);
            }
            throw $e;
        }
    }

    public function find($id) {
        return $this->where('id', $id)->first();
    }

    public function count($column = '*') {
        $query = "SELECT COUNT({$column}) AS count FROM {$this->table}";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return (int) $stmt->fetchColumn();
    }

    public function sum($column) {
        $query = "SELECT SUM({$column}) AS sum FROM {$this->table}";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return (float) $stmt->fetchColumn();
    }

    public function avg($column) {
        $query = "SELECT AVG({$column}) AS avg FROM {$this->table}";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return (float) $stmt->fetchColumn();
    }

    public function min($column) {
        $query = "SELECT MIN({$column}) AS min FROM {$this->table}";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return $stmt->fetchColumn();
    }

    public function max($column) {
        $query = "SELECT MAX({$column}) AS max FROM {$this->table}";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return $stmt->fetchColumn();
    }

    public function insert(array $data) {
        $startTime = microtime(true);
        $columns = array_keys($data);
        $values = array_values($data);
        $columnsList = '`' . implode('`, `', $columns) . '`';
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $query = "INSERT INTO {$this->table} ($columnsList) VALUES ($placeholders)";

        try {
            $stmt = $this->pdo->prepare($query);
            $this->execute($stmt, $values);
            $insertId = $stmt->rowCount() > 0 ? $this->pdo->lastInsertId() : false;

            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, null, [
                    'table' => $this->table,
                    'data' => $data,
                    'insert_id' => $insertId,
                    'affected_rows' => $stmt->rowCount()
                ]);
            }

            return $insertId;
        } catch (Exception $e) {
            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, $e->getMessage(), [
                    'table' => $this->table,
                    'data' => $data
                ]);
            }
            throw $e;
        }
    }

    public function insertGetId(array $data) {
        $startTime = microtime(true);
        $columns = array_keys($data);
        $values = array_values($data);
        $columnsList = '`' . implode('`, `', $columns) . '`';
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $query = "INSERT INTO {$this->table} ($columnsList) VALUES ($placeholders)";

        try {
            $stmt = $this->pdo->prepare($query);
            $this->execute($stmt, $values);
            $insertId = $this->pdo->lastInsertId();

            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, null, [
                    'table' => $this->table,
                    'data' => $data,
                    'insert_id' => $insertId,
                    'affected_rows' => $stmt->rowCount()
                ]);
            }

            return $insertId;
        } catch (Exception $e) {
            if (function_exists('logger')) {
                $duration = microtime(true) - $startTime;
                logger()->dbQuery($query, $duration, $e->getMessage(), [
                    'table' => $this->table,
                    'data' => $data
                ]);
            }
            throw $e;
        }
    }

    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    public function commit() {
        return $this->pdo->commit();
    }

    public function rollback() {
        return $this->pdo->rollBack();
    }

    public function insertBatch(array $data) {
        if (empty($data)) {
            return 0;
        }

        $columns = array_keys(reset($data));
        $columnsList = '`' . implode('`, `', $columns) . '`';
        $placeholders = [];
        $values = [];

        foreach ($data as $row) {
            $rowPlaceholders = array_fill(0, count($columns), '?');
            foreach ($columns as $column) {
                $values[] = $row[$column] ?? null;
            }
            $placeholders[] = '(' . implode(', ', $rowPlaceholders) . ')';
        }

        $placeholdersList = implode(', ', $placeholders);
        $query = "INSERT INTO {$this->table} ($columnsList) VALUES $placeholdersList";

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $values);

        return $stmt->rowCount();
    }

    public function update(array $data) {
        $set = [];
        $updateBindings = [];

        foreach ($data as $column => $value) {
            $set[] = "$column = ?";
            $updateBindings[] = $value;
        }

        $set = implode(', ', $set);
        $query = "UPDATE {$this->table} SET $set";

        $allBindings = array_merge($updateBindings, $this->bindings);

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $allBindings);

        return $stmt->rowCount();
    }

    public function updateOrInsert(array $attributes, array $values = []) {
        if (empty($attributes)) {
            return false;
        }

        $query = $this->newInstance();
        $query->table($this->table);

        foreach ($attributes as $key => $value) {
            $query->where($key, $value);
        }

        $found = $query->first();

        if ($found) {
            return $query->update($values) >= 1;
        }

        return $this->insert(array_merge($attributes, $values)) !== false;
    }

    public function delete() {
        $query = "DELETE FROM {$this->table}";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);

        return $stmt->rowCount();
    }

    public function truncate() {
        $query = "TRUNCATE TABLE {$this->table}";
        return $this->pdo->exec($query);
    }

    public function tableExists($table) {
        try {
            $stmt = $this->pdo->prepare("SHOW TABLES LIKE ?");
            $this->execute($stmt, [$table]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            return false;
        }
    }

    public function columnExists($table, $column) {
        try {
            $stmt = $this->pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
            $this->execute($stmt, [$column]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            log_error("Error checking if column exists", [
                'error' => $e->getMessage(),
                'table' => $table,
                'column' => $column
            ]);
            return false;
        }
    }

    public function getRawResults($sql) {
        try {
            $stmt = $this->pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            log_error("Error executing raw query", [
                'error' => $e->getMessage(),
                'query' => $sql
            ]);
            return [];
        }
    }

    public function newInstance() {
        return new static($this->pdo);
    }

    public function transaction(callable $callback) {
        $pdo = $this->pdo;
        if ($pdo->inTransaction()) {
            return $callback($this);
        }

        try {
            $pdo->beginTransaction();
            $result = $callback($this);
            $pdo->commit();
            return $result;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            log_error("Transaction error", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function pagination($page, $perPage = 15) {
        $totalQuery = clone $this;
        $total = $totalQuery->count();

        $lastPage = max(ceil($total / $perPage), 1);
        $currentPage = max(min($page, $lastPage), 1);
        $offset = ($currentPage - 1) * $perPage;

        $this->offset($offset)->limit($perPage);
        $data = $this->get();

        return [
            'current_page' => (int) $currentPage,
            'last_page' => (int) $lastPage,
            'per_page' => (int) $perPage,
            'total' => (int) $total,
            'from' => $offset + 1,
            'to' => min($offset + $perPage, $total),
            'data' => $data
        ];
    }

    public function exists() {
        return $this->count() > 0;
    }

    public function getPdo() {
        return $this->pdo;
    }

    private function buildSelectQuery() {
        if (empty($this->table)) {
            throw new Exception("No table specified for query");
        }
        
        $query = "SELECT " . ($this->distinct ? "DISTINCT " : "");
        $query .= !empty($this->select) ? $this->select : "*";
        $query .= " FROM {$this->table}";

        
        if (!empty($this->joins)) {
            foreach ($this->joins as $join) {
                $query .= " {$join['type']} JOIN {$join['table']} ON {$join['first']} {$join['operator']} {$join['second']}";
            }
        }

        
        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        
        if (!empty($this->groupBy)) {
            $query .= ' GROUP BY ' . implode(', ', $this->groupBy);

            
            if (!empty($this->having)) {
                $query .= ' ' . $this->buildHavingClause();
                $this->bindings = array_merge($this->bindings, $this->havingBindings);
            }
        }

        
        if (!empty($this->orderBy)) {
            $orderParts = [];
            foreach ($this->orderBy as $order) {
                $orderParts[] = "{$order['column']} {$order['direction']}";
            }
            $query .= ' ORDER BY ' . implode(', ', $orderParts);
        }

        
        if ($this->limit !== null) {
            $query .= " LIMIT {$this->limit}";

            
            if ($this->offset !== null) {
                $query .= " OFFSET {$this->offset}";
            }
        }

        
        if (!empty($this->unionQueries)) {
            foreach ($this->unionQueries as $unionInfo) {
                $unionQuery = $unionInfo['query']->buildSelectQuery();
                $query .= " {$unionInfo['type']} ($unionQuery)";
                $this->bindings = array_merge($this->bindings, $unionInfo['query']->getBindings());
            }
        }

        return $query;
    }

    private function buildWhereClause() {
        $clause = "WHERE ";
        $parts = [];

        foreach ($this->where as $index => $condition) {
            $prefix = $index === 0 ? '' : (isset($condition['type']) ? $condition['type'] : 'AND');
            
            if (isset($condition['type']) && $condition['type'] === 'NESTED') {
                $nestedWhere = substr($condition['query']->buildWhereClause(), 6); 
                $parts[] = "$prefix ($nestedWhere)";
                continue;
            }

            if (isset($condition['raw']) && $condition['raw']) {
                $parts[] = "$prefix {$condition['column']} {$condition['operator']} {$condition['value']}";
            } else {
                $parts[] = "$prefix {$condition['column']} {$condition['operator']} ?";
            }
        }

        $clause .= implode(' ', $parts);
        return $clause;
    }

    private function buildHavingClause() {
        $clause = "HAVING ";
        $parts = [];

        foreach ($this->having as $index => $condition) {
            $prefix = $index === 0 ? '' : (isset($condition['type']) ? $condition['type'] : 'AND');

            if (isset($condition['raw']) && $condition['raw']) {
                $parts[] = "$prefix {$condition['column']} {$condition['operator']} {$condition['value']}";
            } else {
                $parts[] = "$prefix {$condition['column']} {$condition['operator']} ?";
            }
        }

        $clause .= implode(' ', $parts);
        return $clause;
    }

    public function getBindings() {
        return array_merge($this->bindings, $this->havingBindings);
    }

    public function toSql() {
        return $this->buildSelectQuery();
    }

    public function execute($statement, $params = []) {
        foreach ($params as $key => $value) {
            if (is_object($value)) {
                if ($value instanceof DateTime) {
                    $params[$key] = $value->format('Y-m-d H:i:s');
                } else if (method_exists($value, '__toString')) {
                    $params[$key] = (string)$value;
                } else {
                    $params[$key] = null;
                }
            }
        }

        return $statement->execute($params);
    }

    public function testConnection() {
        try {
            $this->getPdo();
            return true;
        } catch (PDOException $e) {
            log_error("Database connection test failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}