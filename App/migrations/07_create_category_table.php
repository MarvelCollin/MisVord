<?php

class CreateCategoryMigration {
    public function up($migration) {
        $migration->createTable('categories', function($table) {
            $table->id();
            $table->string('name');
            $table->bigInteger('server_id', false, true); // Reference to the server
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('categories', true);
    }
}
