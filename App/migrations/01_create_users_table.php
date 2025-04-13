<?php

class CreateUsersTableMigration {
    public function up($migration) {
        $migration->createTable('users', function($table) {
            $table->id();
            $table->string('username');
            $table->string('email');
            $table->string('password');
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
