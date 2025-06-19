<?php

class AuthenticationException extends Exception
{
    public function __construct($message = 'Authentication required', $code = 401, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
