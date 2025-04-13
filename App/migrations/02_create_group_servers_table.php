<?php

class CreateGroupServersMigration {
    public function up($migration) {
        $migration->createTable('group_servers', function($table) {
            $table->id(); // This creates an INT AUTO_INCREMENT PRIMARY KEY
            
            // Using the same column definition as the users table's id column
            // INT type with AUTO_INCREMENT makes it compatible with users.id
            $table->integer('user_id');
            
            $table->string('group_name');
            $table->timestamps();
            
            // Add foreign key constraint that correctly references the users table's id column
            // Make sure to use consistent types
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('group_servers', true);
    }
}
