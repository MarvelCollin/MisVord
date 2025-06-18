<?php

require_once __DIR__ . '/../query.php';

abstract class Repository {
    protected $model;
    
    public function __construct($model) {
        $this->model = $model;
    }
    
    public function find($id) {
        return $this->model::find($id);
    }
    
    public function all() {
        return $this->model::all();
    }
    
    public function create($data) {
        $instance = new $this->model($data);
        return $instance->save() ? $instance : null;
    }
    
    public function update($id, $data) {
        $instance = $this->find($id);
        if (!$instance) {
            return null;
        }
        
        $instance->fill($data);
        return $instance->save() ? $instance : null;
    }
    
    public function delete($id) {
        $instance = $this->find($id);
        return $instance ? $instance->delete() : false;
    }
    
    public function where($column, $operator = null, $value = null) {
        return $this->model::where($column, $operator, $value);
    }
      public function findBy($field, $value) {
        $query = new Query();
        $result = $query->table($this->model::getTable())->where($field, $value)->first();
        return $result ? new $this->model($result) : null;
    }
    
    public function getAllBy($field, $value) {
        $query = new Query();
        $results = $query->table($this->model::getTable())->where($field, $value)->get();
        return array_map(function($result) {
            return new $this->model($result);
        }, $results);
    }
    
    public function whereIn($field, array $values) {
        $query = new Query();
        return $query->table($this->model::getTable())->whereIn($field, $values);
    }
    
    public function whereNull($field) {
        $query = new Query();
        return $query->table($this->model::getTable())->whereNull($field);
    }
    
    public function orderBy($column, $direction = 'ASC') {
        $query = new Query();
        return $query->table($this->model::getTable())->orderBy($column, $direction);
    }
    
    public function limit($limit) {
        $query = new Query();
        return $query->table($this->model::getTable())->limit($limit);
    }
    
    public function count($column = '*') {
        $query = new Query();
        return $query->table($this->model::getTable())->count($column);
    }
}