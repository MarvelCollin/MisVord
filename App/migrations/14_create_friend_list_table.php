<?php

class CreateFriendListTableMigration {    public function up($migration) {
        // We'll create the table without checking for users table existence first
        // The migration system should ensure tables are created in the correct order
        $migration->createTable('friend_list', function($table) {
                $table->id();
                $table->integer('user_id');  // Changed to integer to match users table's id type
                $table->integer('user_id2'); // Changed to integer to match users table's id type
                $table->string('status');
                $table->timestamps();
                  // Add foreign keys - assuming users table is created first
                $table->foreignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
                $table->foreignKey('user_id2', 'users', 'id', 'CASCADE', 'CASCADE');
            });
    }

    public function down($migration) {
        $migration->dropTable('friend_list', true);
    }
}
