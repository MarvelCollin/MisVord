<?php

class CreateUserPresenceTableMigration {
    public function up($migration) {        $migration->createTable('user_presence', function($table) {
            $table->id();
            $table->integer('user_id');
            $table->string('status')->nullable();
            $table->string('activity_details')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_presence', true);
    }
}
