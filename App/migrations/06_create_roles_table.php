<?php

class CreateRolesTableMigration {
    public function up($migration) {
        $migration->createTable('roles', function($table) {
            $table->id();
            $table->bigInteger('server_id', false, true);
            $table->string('role_name', 255);
            $table->string('role_color', 255, true); // nullable
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('roles', true);
    }
}
