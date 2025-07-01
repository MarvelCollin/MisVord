<?php

class CreateChatParticipantsTableMigration {
    public function up($migration) {
        $migration->createTable('chat_participants', function($table) {
            $table->id();
            $table->integer('chat_room_id');
            $table->integer('user_id');
            $table->timestamps();
            
            $table->foreignKey('chat_room_id', 'chat_rooms', 'id', 'CASCADE');
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('chat_participants', true);
    }
}
