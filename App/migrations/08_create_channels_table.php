<?php

class CreateChannelsTable {
    public function up($migration) {
        $migration->createTable('channels', function($table) {
            $table->id();
            $table->string('name');
            $table->string('type', 20); // text, voice, etc.
            $table->text('description', true); // Using true for nullable
            $table->integer('server_id'); // Matches servers.id
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->integer('category_id');
            $table->nullable(); // This makes category_id nullable
            $table->foreignKey('category_id', 'categories', 'id', 'SET NULL');
            $table->integer('position')->default(0); // Add position field for ordering channels
            $table->boolean('is_private')->default(false);
            $table->string('slug', 255, true); // Using true for nullable
            $table->timestamps();
            
            // Indexes
            $table->index('server_id');
            $table->index('category_id');
            $table->index('position');
        });
    }

    public function down($migration) {
        $migration->dropTable('channels', true);
    }
}
