-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS misvord CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE misvord;

-- Allow root to connect from any host with password 'password'
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Alternative user for phpMyAdmin in case root doesn't work
CREATE USER IF NOT EXISTS 'phpmyadmin'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'%' WITH GRANT OPTION;

-- Make changes take effect
FLUSH PRIVILEGES; 