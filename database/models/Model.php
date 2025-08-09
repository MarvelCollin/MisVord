<?php

require_once __DIR__ . '/../query.php';

abstract class Model {
    protected static $table;
    public $attributes = [];
    protected $fillable = [];
    
    public function __construct($attributes = []) {
        $this->fill($attributes);
    }
    
    public function fill($attributes) {
        foreach ($attributes as $key => $value) {
            if (empty($this->fillable) || in_array($key, $this->fillable)) {
                $this->attributes[$key] = $value;
            }
        }
        return $this;
    }
    
    public function __get($key) {
        return $this->attributes[$key] ?? null;
    }
      public function __set($key, $value) {
        $this->attributes[$key] = $value;
    }
    
    public static function getTable() {
        return static::$table;
    }
    
    public static function find($id) {
        error_log("Model::find called with ID: " . var_export($id, true) . " (type: " . gettype($id) . ") for table: " . static::$table);
        
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('id', $id)
            ->first();
        
        if ($result) {
            error_log("Model::find - Found result for ID $id: " . json_encode($result));
        } else {
            error_log("Model::find - No result found for ID $id in table " . static::$table);
        }
            
        return $result ? new static($result) : null;
    }
    
    public static function all() {
        $query = new Query();
        $results = $query->table(static::$table)->get();
        
        return array_map(function($result) {
            return new static($result);
        }, $results);
    }
      public static function where($column, $operator = null, $value = null) {
        $query = new Query();
        return $query->table(static::$table)->where($column, $operator, $value);
    }
    
    public static function whereIn($column, array $values) {
        $query = new Query();
        return $query->table(static::$table)->whereIn($column, $values);
    }
    
    public static function whereNull($column) {
        $query = new Query();
        return $query->table(static::$table)->whereNull($column);
    }
    
    public static function orderBy($column, $direction = 'ASC') {
        $query = new Query();
        return $query->table(static::$table)->orderBy($column, $direction);
    }
    
    public static function limit($limit) {
        $query = new Query();
        return $query->table(static::$table)->limit($limit);
    }
    
    public static function count($column = '*') {
        $query = new Query();
        return $query->table(static::$table)->count($column);
    }
    
    public function save() {
        try {
            $query = new Query();
            
            if (!isset($this->attributes['updated_at'])) {
                $this->attributes['updated_at'] = date('Y-m-d H:i:s');
            }
            
            if (isset($this->attributes['id'])) {
                $id = $this->attributes['id'];
                $data = $this->attributes;
                unset($data['id']);
                
                error_log("Model::save - Updating existing record with ID: $id");
                error_log("Model::save - Data to update: " . json_encode($data));
                error_log("Model::save - Table: " . static::$table);
                
                $result = $query->table(static::$table)
                    ->where('id', $id)
                    ->update($data);
                    
                error_log("Model::save - Update result: " . var_export($result, true));
                return $result > 0;
            } else {
                if (!isset($this->attributes['created_at'])) {
                    $this->attributes['created_at'] = date('Y-m-d H:i:s');
                }
                
                error_log("Model::save - Inserting new record into table: " . static::$table);
                error_log("Model::save - Data to insert: " . json_encode($this->attributes));
                
                $insertId = $query->table(static::$table)
                    ->insert($this->attributes);
                    
                error_log("Model::save - Insert result: " . ($insertId ? "ID $insertId" : "FAILED"));
                
                if ($insertId) {
                    $this->attributes['id'] = $insertId;
                    return true;
                }
                return false;
            }
        } catch (Exception $e) {
            error_log("Exception in Model::save: " . $e->getMessage());
            error_log("Exception trace: " . $e->getTraceAsString());
            error_log("Data that failed to save: " . json_encode($this->attributes));
            throw $e;
        }
    }
    
    public function delete() {
        if (!$this->id) {
            return false;
        }
        
        $query = new Query();
        return $query->table(static::$table)
            ->where('id', $this->id)
            ->delete() > 0;
    }
    
    public function __isset($key) {
        return isset($this->attributes[$key]);
    }

    public function toArray() {
        $result = [];
        
        foreach ($this->attributes as $key => $value) {
            if (is_object($value) && method_exists($value, 'toArray')) {
                $result[$key] = $value->toArray();
            } else {
                $result[$key] = $value;
            }
        }
        
        return $result;
    }
}


