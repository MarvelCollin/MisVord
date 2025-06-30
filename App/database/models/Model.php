<?php

require_once __DIR__ . '/../query.php';

abstract class Model {
    protected static $table;
    protected $attributes = [];
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
        $query = new Query();
        
        if (!isset($this->attributes['updated_at'])) {
            $this->attributes['updated_at'] = date('Y-m-d H:i:s');
        }        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            $data = $this->attributes;
            unset($data['id']);
            
            $result = $query->table(static::$table)
                ->where('id', $id)
                ->update($data);
                
            return $result > 0;} else {
            if (!isset($this->attributes['created_at'])) {
                $this->attributes['created_at'] = date('Y-m-d H:i:s');
            }
            
            $insertId = $query->table(static::$table)
                ->insert($this->attributes);
                
            if ($insertId) {
                $this->attributes['id'] = $insertId;
                return true;
            }
            return false;
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


