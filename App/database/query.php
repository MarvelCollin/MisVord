<?php

class Query {
    private $pdo;
    private $table;
    private $select = '*';
    private $where = [];
    private $order = [];
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
        if ($pdo) {
            $this->pdo = $pdo;
        } else {
            try {
                require_once __DIR__ . '/../config/env.php';

                $dbHost = EnvLoader::get('DB_HOST', 'localhost');
                $port = EnvLoader::get('DB_PORT', '1003');
                $dbname = EnvLoader::get('DB_NAME', 'misvord');
                $username = EnvLoader::get('DB_USER', 'root');
                $password = EnvLoader::get('DB_PASS', 'kolin123');
                $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');

                $dsn = "mysql:host={$dbHost};port={$port};dbname={$dbname};charset={$charset}";

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
                    throw new PDOException("Connected to wrong database: {$result['current_db']}, expected: $dbname");
                }

            } catch (PDOException $e) {
                error_log("Database connection failed: " . $e->getMessage());
                error_log("Connection details: host=$dbHost, port=$port, dbname=$dbname, user=$username");
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
        $this->order[] = compact('column', 'direction');
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

            error_log("Database error: " . $e->getMessage());
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
            error_log("Database error in rawQuery: " . $e->getMessage());
            return [];
        }
    }

    public function get() {
        $query = $this->buildSelectQuery();
        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function first() {
        $this->limit(1);
        $query = $this->buildSelectQuery();
        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);
        return $stmt->fetch(PDO::FETCH_ASSOC);
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
        $columns = array_keys($data);
        $values = array_values($data);
        $columnsList = '`' . implode('`, `', $columns) . '`';
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $query = "INSERT INTO {$this->table} ($columnsList) VALUES ($placeholders)";

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $values);

        if ($stmt->rowCount() > 0) {
            return $this->pdo->lastInsertId();
        }

        return false;
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

        foreach ($data as $column => $value) {
            $set[] = "$column = ?";
            $this->bindings[] = $value;
        }

        $set = implode(', ', $set);
        $query = "UPDATE {$this->table} SET $set";

        if (!empty($this->where)) {
            $query .= ' ' . $this->buildWhereClause();
        }

        $stmt = $this->pdo->prepare($query);
        $this->execute($stmt, $this->bindings);

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
            error_log("Error checking if column exists: " . $e->getMessage());
            return false;
        }
    }

    public function getRawResults($sql) {
        try {
            $stmt = $this->pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error executing raw query: " . $e->getMessage());
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
            error_log("Transaction error: " . $e->getMessage());
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
        $query = "SELECT " . ($this->distinct ? "DISTINCT " : "") . "{$this->select} FROM {$this->table}";

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
        }

        if (!empty($this->having)) {
            $query .= ' ' . $this->buildHavingClause();
            $this->bindings = array_merge($this->bindings, $this->havingBindings);
        }

        if (!empty($this->order)) {
            $orderParts = [];
            foreach ($this->order as $order) {
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

        if (!empty($this->raw)) {
            $query .= ' ' . implode(' ', $this->raw);
        }

        return $query;
    }

    private function buildWhereClause() {
        $clause = "WHERE ";
        $parts = [];

        foreach ($this->where as $index => $condition) {
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
                if (method_exists($value, '__toString')) {
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
            error_log("Database connection test failed: " . $e->getMessage());
            return false;
        }
    }
}