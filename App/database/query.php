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
                // Use the EnvLoader to get database connection
                require_once __DIR__ . '/../config/env.php';
                $this->pdo = EnvLoader::getPDOConnection();
            } catch (PDOException $e) {
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
    
    /**
     * Execute a raw SQL query
     * 
     * @param string $sql Raw SQL query
     * @return $this
     */
    public function raw($sql) {
        try {
            $stmt = $this->pdo->query($sql);
            if ($stmt) {
                $stmt->closeCursor(); // Ensure cursor is closed to prevent unbuffered query issues
            }
            return $this;
        } catch (PDOException $e) {
            // Log the error but don't stop execution
            error_log("Database error: " . $e->getMessage());
            return $this;
        }
    }
    
    /**
     * Execute a raw SQL query and return results
     * 
     * @param string $sql Raw SQL query to execute
     * @return array Results of the query
     */
    public function rawQuery($sql) {
        try {
            $stmt = $this->pdo->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor(); // Important: close cursor after fetching results
            return $results;
        } catch (PDOException $e) {
            error_log("Database error in rawQuery: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get query results
     * 
     * @return array
     */
    public function get() {
        try {
            $query = $this->buildSelectQuery();
            $stmt = $this->pdo->prepare($query);
            $stmt->execute($this->bindings);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor(); // Close the cursor to avoid "unbuffered queries" error
            return $result;
        } catch (PDOException $e) {
            error_log("Database error in get(): " . $e->getMessage());
            return [];
        }
    }
    
    public function first() {
        $this->limit(1);
        $result = $this->get();
        return count($result) > 0 ? $result[0] : null;
    }
    
    public function find($id) {
        return $this->where('id', $id)->first();
    }
    
    public function count() {
        $this->select('COUNT(*) as count');
        $result = $this->get();
        return isset($result[0]['count']) ? (int) $result[0]['count'] : 0;
    }
    
    public function sum($column) {
        $this->select("SUM($column) as sum");
        $result = $this->get();
        return isset($result[0]['sum']) ? (float) $result[0]['sum'] : 0;
    }
    
    public function avg($column) {
        $this->select("AVG($column) as avg");
        $result = $this->get();
        return isset($result[0]['avg']) ? (float) $result[0]['avg'] : 0;
    }
    
    public function min($column) {
        $this->select("MIN($column) as min");
        $result = $this->get();
        return isset($result[0]['min']) ? $result[0]['min'] : null;
    }
    
    public function max($column) {
        $this->select("MAX($column) as max");
        $result = $this->get();
        return isset($result[0]['max']) ? $result[0]['max'] : null;
    }
    
    public function insert(array $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $query = "INSERT INTO {$this->table} ($columns) VALUES ($placeholders)";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute(array_values($data));
        
        return $this->pdo->lastInsertId();
    }
    
    public function insertBatch(array $data) {
        if (empty($data)) {
            return 0;
        }
        
        $columns = array_keys($data[0]);
        $columnsList = implode(', ', $columns);
        
        $placeholders = [];
        $values = [];
        
        foreach ($data as $row) {
            $rowPlaceholders = [];
            foreach ($columns as $column) {
                $rowPlaceholders[] = '?';
                $values[] = $row[$column] ?? null;
            }
            $placeholders[] = '(' . implode(', ', $rowPlaceholders) . ')';
        }
        
        $placeholdersList = implode(', ', $placeholders);
        $query = "INSERT INTO {$this->table} ($columnsList) VALUES $placeholdersList";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($values);
        
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
        $stmt->execute($this->bindings);
        
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
        $stmt->execute($this->bindings);
        
        return $stmt->rowCount();
    }
    
    public function truncate() {
        $query = "TRUNCATE TABLE {$this->table}";
        return $this->pdo->exec($query);
    }
    
    public function tableExists($table) {
        try {
            $sql = "SHOW TABLES LIKE " . $this->pdo->quote($table);
            $stmt = $this->pdo->query($sql);
            
            if ($stmt) {
                $exists = $stmt->rowCount() > 0;
                $stmt->closeCursor(); 
                return $exists;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error checking table existence: " . $e->getMessage());
            return false;
        }
    }
    
    public function newInstance() {
        return new static($this->pdo);
    }
    
    public function transaction(callable $callback) {
        try {
            $this->pdo->beginTransaction();
            $result = $callback($this);
            $this->pdo->commit();
            return $result;
        } catch (Exception $e) {
            $this->pdo->rollBack();
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
        return $this->bindings;
    }
    
    public function toSql() {
        return $this->buildSelectQuery();
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
}
