<?php
/**
 * Application Bootstrap File
 * 
 * This file initializes the application by loading necessary components,
 * setting up error handling, and starting the routing system.
 */

// Load configuration files
require_once dirname(__DIR__) . '/config/helpers.php';

// Set up error handling for development environment
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load the router configuration and start routing
require_once dirname(__DIR__) . '/routes/web.php';
