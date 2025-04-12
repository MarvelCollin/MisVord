<?php

class CreateUserPresenceTableMigration {
    public function up($migration) {
        $migration->createTable('user_presence', function($table) {
            $table->id();
            $table->bigInteger('user_id', false, true);
            $table->string('status', 255, true); // nullable
            $table->string('activity_type', 255, true); // nullable
            $table->string('activity_details', 255, true); // nullable
            $table->timestamp('last_seen', true); // nullable
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_presence', true);
    }
}
