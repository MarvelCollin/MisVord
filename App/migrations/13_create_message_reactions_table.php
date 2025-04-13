<?php

class CreateMessageReactionsTableMigration {
    public function up($migration) {        $migration->createTable('message_reactions', function($table) {
            $table->id();
            $table->integer('message_id'); // Changed to integer to match messages table
            $table->integer('user_id'); // Changed to integer to match users table
            $table->string('emoji');
            $table->timestamps();
            
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('message_reactions', true);
    }
}
