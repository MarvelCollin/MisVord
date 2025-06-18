<?php

class CreateServerEmojisTableMigration {
    public function up($migration) {
        $migration->createTable('server_emojis', function($table) {
            $table->id();
            $table->integer('server_id');
            $table->string('name');
            $table->string('image_url');
            $table->boolean('is_animated')->default(false);
            $table->integer('created_by_user_id');
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->foreignKey('created_by_user_id', 'users', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        $migration->dropTable('server_emojis', true);
    }
} 