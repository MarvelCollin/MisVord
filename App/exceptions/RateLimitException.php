<?php

class RateLimitException extends Exception
{
    protected $retryAfter;

    public function __construct($message = 'Rate limit exceeded', $retryAfter = null, $code = 429, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->retryAfter = $retryAfter;
    }

    public function getRetryAfter()
    {
        return $this->retryAfter;
    }

    public function setRetryAfter($retryAfter)
    {
        $this->retryAfter = $retryAfter;
        return $this;
    }
}
