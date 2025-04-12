<?php

class CreateGroupServersTableMigration {
    public function up($migration) {
        $migration->createTable('group_servers', function($table) {
            $table->id();
            $table->bigInteger('server_id', false, true);
            $table->string('group_name', 255);
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('group_servers', true);
    }
}
