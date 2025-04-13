<?php

class CreateChatParticipantsTableMigration {
    public function up($migration) {        $migration->createTable('chat_participants', function($table) {
            $table->id();
            $table->integer('chat_room_id'); // Changed to integer to match chat_rooms table
            $table->integer('user_id'); // Changed to integer to match users table
            $table->timestamps();
            
            $table->foreignKey('chat_room_id', 'chat_rooms', 'id', 'CASCADE');
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('chat_participants', true);
    }
}
