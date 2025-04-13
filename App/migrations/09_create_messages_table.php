<?php

class CreateMessagesTable2Migration {
    public function up($migration) {        // First create the messages table without any foreign keys
        $migration->createTable('messages', function($table) {
            $table->id();
            $table->integer('user_id')->nullable(); // Changed to integer to match users table id type
            $table->integer('reply_message_id')->nullable(); // Changed to integer and made nullable
            $table->text('content');
            $table->dateTime('sent_at');
            $table->dateTime('edited_at')->nullable(); // Fixed nullable syntax
            $table->string('message_type');
            $table->string('attachment_url', 255, true); // nullable
            $table->timestamps();
        });

        // Add foreign keys separately to ensure table exists first
        $migration->alterTable('messages', function($table) {
            $table->foreignKey('user_id', 'users', 'id', 'SET NULL');
        });
        
        // Now add the self-reference separately
        $migration->alterTable('messages', function($table) {
            $table->foreignKey('reply_message_id', 'messages', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        // First drop foreign key constraints
        try {
            $migration->dropForeignKey('messages', 'fk_messages_user_id');
        } catch (Exception $e) {
            // Ignore if constraint doesn't exist
        }
        
        try {
            $migration->dropForeignKey('messages', 'fk_messages_reply_message_id');
        } catch (Exception $e) {
            // Ignore if constraint doesn't exist
        }
        
        // Then drop the table
        $migration->dropTable('messages', true);
    }
}
