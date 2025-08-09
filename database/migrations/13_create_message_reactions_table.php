<?php

class CreateMessageReactionsTableMigration {
    public function up($migration) {        $migration->createTable('message_reactions', function($table) {
            $table->id();
            $table->integer('message_id');
            $table->integer('user_id');
            $table->string('emoji');
            $table->timestamps();
            
            $table->foreignKey('message_id', 'messages', 'id', 'CASCADE');
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            
            $table->unique(['message_id', 'user_id', 'emoji']);
            $table->index('message_id');
            $table->index('user_id');
        });
    }

    public function down($migration) {
        $migration->dropTable('message_reactions', true);
    }
}
