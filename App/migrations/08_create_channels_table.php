<?php

class CreateChannelsTable {
    public function up($migration) {
        $migration->createTable('channels', function($table) {
            $table->id();
            $table->string('name');
            $table->string('type', 20); 
            $table->text('description', true); 
            $table->integer('server_id'); 
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->integer('category_id', false, false, true);
            $table->foreignKey('category_id', 'categories', 'id', 'SET NULL');
            $table->integer('parent_id', false, false, true);
            $table->foreignKey('parent_id', 'channels', 'id', 'SET NULL');
            $table->integer('position')->default(0); 
            $table->boolean('is_private')->default(false);
            $table->string('slug', 255, true); 
            $table->timestamps();
            
            
            $table->index('server_id');
            $table->index('category_id');
            $table->index('parent_id');
            $table->index('position');
        });
    }

    public function down($migration) {
        $migration->dropTable('channels', true);
    }
}
