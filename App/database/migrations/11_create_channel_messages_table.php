<?php

class CreateChannelMessagesTableMigration {
    public function up($migration) {
        
        $migration->createTable('channel_messages', function($table) {
            $table->id();
            $table->integer('channel_id')->notNull();
            $table->integer('message_id')->notNull();
            $table->timestamps();
            $table->unique(['channel_id', 'message_id'], 'unique_channel_message');
        });
        
        
        $migration->alterTable('channel_messages', function($table) {
            $table->foreignKey('channel_id', 'channels', 'id', 'CASCADE');
        });
        
        $migration->alterTable('channel_messages', function($table) {
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        
        try {
            $migration->dropForeignKey('channel_messages', 'fk_channel_messages_channel_id');
        } catch (Exception $e) {
            
        }
        
        try {
            $migration->dropForeignKey('channel_messages', 'fk_channel_messages_message_id');
        } catch (Exception $e) {
            
        }
        
        
        $migration->dropTable('channel_messages', true);
    }
}
