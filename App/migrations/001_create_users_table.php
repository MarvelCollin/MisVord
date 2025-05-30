<?php
// Example migration file

class CreateUsersTable {
    public function up() {
        $query = new Query();
        $query->raw("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255),
                google_id VARCHAR(255) NULL,
                avatar_url VARCHAR(255) NULL,
                status ENUM('online', 'away', 'offline', 'dnd') DEFAULT 'offline',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
    }
    
    public function down() {
        $query = new Query();
        $query->raw("DROP TABLE IF EXISTS users");
    }
}
