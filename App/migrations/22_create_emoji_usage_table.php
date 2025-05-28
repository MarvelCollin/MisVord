<?php

class CreateEmojiUsageTableMigration {
    public function up($migration) {
        $migration->createTable('emoji_usage', function($table) {
            $table->id();
            $table->integer('server_emoji_id')->nullable();
            $table->string('unicode_emoji')->nullable();
            $table->integer('user_id');
            $table->integer('message_id');
            $table->integer('count')->default(1);
            $table->timestamps();
            
            $table->foreignKey('server_emoji_id', 'server_emojis', 'id', 'SET NULL');
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('emoji_usage', true);
    }
} 