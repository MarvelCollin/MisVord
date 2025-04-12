<?php

class CreateUserRolesTableMigration {
    public function up($migration) {
        $migration->createTable('user_roles', function($table) {
            $table->id();
            $table->bigInteger('user_id', false, true);
            $table->bigInteger('role_id', false, true);
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('role_id', 'roles', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_roles', true);
    }
}
