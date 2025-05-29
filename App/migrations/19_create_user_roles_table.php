<?php

class CreateUserRolesMigration {
    public function up($migration) {        $migration->createTable('user_roles', function($table) {
            $table->id();
            $table->integer('user_id');
            $table->integer('role_id');
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('role_id', 'roles', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_roles', true);
    }
}
