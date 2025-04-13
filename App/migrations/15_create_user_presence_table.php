<?php

class CreateUserPresenceTableMigration {
    public function up($migration) {        $migration->createTable('user_presence', function($table) {
            $table->id();
            $table->integer('user_id'); // Changed to integer to match users table
            $table->string('status')->nullable(); // Fixed nullable syntax            $table->string('activity_type')->nullable(); // Fixed nullable syntax
            $table->string('activity_details')->nullable(); // Fixed nullable syntax
            $table->timestamp('last_seen')->nullable(); // Fixed nullable syntax
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_presence', true);
    }
}
