<?php

class CreateRolePermissionsTableMigration {
    public function up($migration) {        $migration->createTable('role_permissions', function($table) {
            $table->id();
            $table->integer('role_id'); // Changed to integer to match roles table
            $table->integer('channel_id'); // Changed to integer to match channels table
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_manage')->default(false);
            $table->boolean('can_write')->default(false);
            $table->boolean('can_read')->default(false);
            $table->timestamps();
            
            $table->foreignKey('role_id', 'roles', 'id', 'CASCADE');
            $table->foreignKey('channel_id', 'channels', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('role_permissions', true);
    }
}
