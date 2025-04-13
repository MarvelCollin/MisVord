<?php

class CreateCategoryTableMigration {
    public function up($migration) {
        $migration->createTable('categories', function($table) {
            $table->id();
            $table->string('name');
            $table->integer('server_id'); 
            $table->integer('position')->default(0);
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            
            
            $table->index('server_id');
        });
    }

    public function down($migration) {
        $migration->dropTable('categories', true);
    }
}
