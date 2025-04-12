<?php

class CreateChatRoomMessagesTableMigration {
    public function up($migration) {
        $migration->createTable('chat_room_messages', function($table) {
            $table->id();
            $table->bigInteger('room_id', false, true);
            $table->bigInteger('message_id', false, true);
            $table->timestamps();
            
            $table->foreignKey('room_id', 'chat_rooms', 'id', 'CASCADE');
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('chat_room_messages', true);
    }
}
