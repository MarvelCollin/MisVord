<?php

class CreateCategoryTableMigration {
    public function up($migration) {
        $migration->createTable('categories', function($table) {
            $table->id();
            $table->string('name');
            $table->integer('server_id'); // Changed from bigInteger to integer to match servers.id
            $table->integer('position')->default(0);
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            
            // Add index for better performance
            $table->index('server_id');
        });
    }

    public function down($migration) {
        $migration->dropTable('categories', true);
    }
}
