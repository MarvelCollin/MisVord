<?php

class CreateUsersTableMigration {
    public function up(Migration $migration) {
        $migration->createTable('users', function($table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique('users_email_unique');
            $table->string('password');
            $table->string('remember_token', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(Migration $migration) {
        $migration->dropTable('users', true);
    }
}
