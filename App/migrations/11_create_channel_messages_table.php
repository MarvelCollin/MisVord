<?php

class CreateChannelMessagesTableMigration {
    public function up($migration) {        $migration->createTable('channel_messages', function($table) {
            $table->id();
            $table->integer('channel_id'); // Changed to integer to match channels table
            $table->integer('message_id'); // Changed to integer to match messages table
            $table->timestamps();
            
            $table->foreignKey('channel_id', 'channels', 'id', 'CASCADE');
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('channel_messages', true);
    }
}
