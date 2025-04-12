<?php

class CreatePinnedMessagesTableMigration {
    public function up($migration) {
        $migration->createTable('pinned_messages', function($table) {
            $table->id();
            $table->bigInteger('message_id', false, true);
            $table->bigInteger('pinned_by_user_id', false, true);
            $table->dateTime('pinned_at');
            $table->timestamps();
            
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
            $table->foreignKey('pinned_by_user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('pinned_messages', true);
    }
}
