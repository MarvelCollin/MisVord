<?php

class CreateGroupServersMigration {
    public function up($migration) {
        $migration->createTable('group_servers', function($table) {
            $table->id();
            $table->bigInteger('user_id', false, true); // Changed from server_id to user_id
            $table->string('group_name');
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE'); // Updated foreign key
        });
    }

    public function down($migration) {
        $migration->dropTable('group_servers', true);
    }
}
