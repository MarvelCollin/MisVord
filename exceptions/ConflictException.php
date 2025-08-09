<?php

class ConflictException extends Exception
{
    protected $details;

    public function __construct($message = 'Resource conflict', $details = null, $code = 409, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->details = $details;
    }

    public function getDetails()
    {
        return $this->details;
    }

    public function setDetails($details)
    {
        $this->details = $details;
        return $this;
    }
}
