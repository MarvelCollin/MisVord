<?php

class CreateUsersTableMigration {
    public function up($migration) {
        $migration->createTable('users', function($table) {
            $table->id();
            $table->string('username', 255);
            $table->string('email', 255);
            $table->string('password', 255);
            $table->string('google_id', 255, true); // nullable
            $table->string('avatar_url', 255, true); // nullable
            $table->string('status', 255, true); // nullable
            $table->timestamps();
        });
    }

    public function down($migration) {
        $migration->dropTable('users', true);
    }
}
