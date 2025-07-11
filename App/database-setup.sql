CREATE DATABASE IF NOT EXISTS misvord;
USE misvord;

-- Test table to verify connection
CREATE TABLE IF NOT EXISTS test_connection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO test_connection (id) VALUES (1);
