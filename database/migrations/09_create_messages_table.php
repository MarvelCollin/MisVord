<?php

class CreateMessagesTable2Migration {
    public function up($migration) {        
        $migration->createTable('messages', function($table) {
            $table->id();
            $table->integer('user_id')->nullable(); 
            $table->integer('reply_message_id')->nullable(); 
            $table->text('content');
            $table->dateTime('sent_at');
            $table->dateTime('edited_at')->nullable(); 
            $table->string('message_type');
            $table->string('attachment_url', 512, true); 
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('sent_at');
            $table->index('reply_message_id');
        });

        
        $migration->alterTable('messages', function($table) {
            $table->foreignKey('user_id', 'users', 'id', 'SET NULL');
        });
        
        
        $migration->alterTable('messages', function($table) {
            $table->foreignKey('reply_message_id', 'messages', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        
        try {
            $migration->dropForeignKey('messages', 'fk_messages_user_id');
        } catch (Exception $e) {
            
        }
        
        try {
            $migration->dropForeignKey('messages', 'fk_messages_reply_message_id');
        } catch (Exception $e) {
            
        }
        
        
        $migration->dropTable('messages', true);
    }
}
