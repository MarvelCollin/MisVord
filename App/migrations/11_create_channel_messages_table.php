<?php

class CreateChannelMessagesTableMigration {
    public function up($migration) {
        $migration->createTable('channel_messages', function($table) {
            $table->id();
            $table->bigInteger('channel_id', false, true);
            $table->bigInteger('message_id', false, true);
            $table->timestamps();
            
            $table->foreignKey('channel_id', 'channels', 'id', 'CASCADE');
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('channel_messages', true);
    }
}
