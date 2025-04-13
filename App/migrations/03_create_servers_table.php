<?php

class CreateServersMigration {
    public function up($migration) {
        $migration->createTable('servers', function($table) {
            $table->id();
            $table->string('name');
            $table->string('image_url', 255, true); // nullable
            $table->text('description', true); // nullable
            $table->string('invite_link', 255, true); // nullable
            $table->integer('group_server_id', false, false, true); // Changed from bigInteger to integer to match group_servers table id
            $table->timestamps();
            
            // Add the foreign key constraint to ensure it matches the id column in group_servers
            $table->foreignKey('group_server_id', 'group_servers', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        $migration->dropTable('servers', true);
    }
}
