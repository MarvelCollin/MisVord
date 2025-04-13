<?php

class CreateServerInvitesMigration {
    public function up($migration) {
        $migration->createTable('server_invites', function($table) {            $table->id();
            $table->integer('server_id');
            $table->integer('inviter_user_id');
            $table->integer('target_user_id')->nullable(); // Making it nullable without auto-increment
            $table->string('invite_link');
            $table->timestamps();
            
            // Add foreign keys
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->foreignKey('inviter_user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('target_user_id', 'users', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        $migration->dropTable('server_invites', true);
    }
}
