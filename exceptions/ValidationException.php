<?php

class ValidationException extends Exception
{
    protected $errors;

    public function __construct($message = 'Validation failed', $errors = [], $code = 422, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->errors = $errors;
    }

    public function getErrors()
    {
        return $this->errors;
    }

    public function setErrors($errors)
    {
        $this->errors = $errors;
        return $this;
    }

    public function addError($field, $message)
    {
        $this->errors[$field][] = $message;
        return $this;
    }

    public function hasErrors()
    {
        return !empty($this->errors);
    }
}
