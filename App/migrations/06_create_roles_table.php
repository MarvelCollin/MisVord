<?php

class CreateRolesTableMigration {
    public function up($migration) {
        $migration->createTable('roles', function($table) {
            $table->id();
            $table->integer('server_id'); 
            $table->string('role_name', 255);
            $table->string('role_color', 255, true); 
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('roles', true);
    }   
}
