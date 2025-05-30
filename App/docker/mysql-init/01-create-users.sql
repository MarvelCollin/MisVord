-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS misvord CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE misvord;

-- Set root password for all hosts
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'kolin123';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'kolin123';

-- Grant all privileges to root
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

-- Create additional users if needed
-- Example: CREATE USER 'myuser'@'%' IDENTIFIED WITH mysql_native_password BY 'mypassword';
-- Example: GRANT ALL PRIVILEGES ON misvord.* TO 'myuser'@'%';

-- Make changes take effect
FLUSH PRIVILEGES;