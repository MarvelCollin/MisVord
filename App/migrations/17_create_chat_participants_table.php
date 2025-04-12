<?php

class CreateChatParticipantsTableMigration {
    public function up($migration) {
        $migration->createTable('chat_participants', function($table) {
            $table->id();
            $table->bigInteger('chat_room_id', false, true);
            $table->bigInteger('user_id', false, true);
            $table->timestamps();
            
            $table->foreignKey('chat_room_id', 'chat_rooms', 'id', 'CASCADE');
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('chat_participants', true);
    }
}
