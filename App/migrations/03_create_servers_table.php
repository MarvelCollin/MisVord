<?php

class CreateServersMigration {
    public function up($migration) {
        $migration->createTable('servers', function($table) {
            $table->id();
            $table->string('name');
            $table->string('image_url', 255, true); 
            $table->text('description', true); 
            $table->string('invite_link', 255, true); 
            $table->integer('group_server_id', false, false, true); 
            $table->timestamps();
            
            
            $table->foreignKey('group_server_id', 'group_servers', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        $migration->dropTable('servers', true);
    }
}
