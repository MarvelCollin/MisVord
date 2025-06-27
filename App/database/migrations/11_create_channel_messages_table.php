<?php

class CreateChannelMessagesTableMigration {
    public function up($migration) {
        $migration->createTable('channel_messages', function($table) {
            $table->id();
            $table->integer('channel_id');
            $table->integer('message_id');
            $table->timestamps();
            
            $table->foreignKey('channel_id', 'channels', 'id', 'CASCADE');
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
            
            $table->unique(['channel_id', 'message_id']);
            $table->index('channel_id');
            $table->index('message_id');
        });
    }

    public function down($migration) {
        $migration->dropTable('channel_messages', true);
    }
} 