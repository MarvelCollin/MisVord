<?php

require_once __DIR__ . '/../query.php';

abstract class Repository {
    protected $model;
    protected $modelClass;
    
    public function __construct() {
        $this->modelClass = $this->getModelClass();
    }
    
    abstract protected function getModelClass();
    
    public function find($id) {
        return $this->modelClass::find($id);
    }
    
    public function all() {
        return $this->modelClass::all();
    }
    
    public function create($data) {
        try {
            error_log("Repository::create called with data: " . json_encode($data));
            
            $instance = new $this->modelClass($data);
            
            error_log("Created model instance for table: " . $instance::getTable());
            
            $saveResult = $instance->save();
            
            error_log("Model save result: " . ($saveResult ? "SUCCESS" : "FAILED"));
            
            if ($saveResult) {
                error_log("User created successfully with ID: " . $instance->id);
                return $instance;
            } else {
                error_log("Model save failed - returning null");
                return null;
            }
        } catch (Exception $e) {
            error_log("Exception in Repository::create: " . $e->getMessage());
            error_log("Exception trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
      public function update($id, $data) {
        $instance = $this->find($id);
        if (!$instance) {
            return null;
        }
        
        foreach ($data as $key => $value) {
            $instance->$key = $value;
        }
        return $instance->save() ? $instance : null;
    }
    
    public function delete($id) {
        $instance = $this->find($id);
        return $instance ? $instance->delete() : false;
    }
    
    public function where($column, $operator = null, $value = null) {
        return $this->modelClass::where($column, $operator, $value);
    }    public function findBy($field, $value) {
        $query = new Query();
        $result = $query->table($this->modelClass::getTable())->where($field, $value)->first();
        return $result ? new $this->modelClass($result) : null;
    }
      public function getAllBy($field, $value) {
        $query = new Query();
        $results = $query->table($this->modelClass::getTable())->where($field, $value)->get();
        return array_map(function($result) {
            return new $this->modelClass($result);
        }, $results);
    }
    
    public function whereIn($field, array $values) {
        $query = new Query();
        return $query->table($this->modelClass::getTable())->whereIn($field, $values);
    }
    
    public function whereNull($field) {
        $query = new Query();
        return $query->table($this->modelClass::getTable())->whereNull($field);
    }
    
    public function orderBy($column, $direction = 'ASC') {
        $query = new Query();
        return $query->table($this->modelClass::getTable())->orderBy($column, $direction);
    }
    
    public function limit($limit) {
        $query = new Query();
        return $query->table($this->modelClass::getTable())->limit($limit);
    }
      public function count($column = '*') {
        $query = new Query();
        return $query->table($this->modelClass::getTable())->count($column);
    }
    
    public function countBy($field, $value) {
        $query = new Query();
        return $query->table($this->modelClass::getTable())->where($field, $value)->count();
    }
}