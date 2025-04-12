<?php

class CreateUserServerMembershipsTableMigration {
    public function up($migration) {
        $migration->createTable('user_server_memberships', function($table) {
            $table->id();
            $table->bigInteger('user_id', false, true);
            $table->bigInteger('server_id', false, true);
            $table->string('role', 255, true); // nullable
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_server_memberships', true);
    }
}
