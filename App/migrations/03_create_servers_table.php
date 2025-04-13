<?php

class CreateServersMigration {
    public function up($migration) {
        $migration->createTable('servers', function($table) {
            $table->id();
            $table->string('name');
            $table->string('image_url', 255, true); // nullable
            $table->text('description', true); // nullable
            $table->string('invite_link', 255, true); // nullable
            $table->bigInteger('group_server_id', false, true, true); // Added nullable group_server_id
            $table->timestamps();
            
            $table->foreignKey('group_server_id', 'group_servers', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        $migration->dropTable('servers', true);
    }
}
