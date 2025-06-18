<?php

class CreateChatRoomsTableMigration {
    public function up($migration) {
        $migration->createTable('chat_rooms', function($table) {
            $table->id();
            $table->string('name', 255, true);
            $table->string('type');
            $table->string('image_url', 255, true);
            $table->timestamps();
        });
    }

    public function down($migration) {
        $migration->dropTable('chat_rooms', true);
    }
}
