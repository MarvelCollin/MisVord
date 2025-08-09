<?php

class CreateServerInvitesMigration {
    public function up($migration) {
        $migration->createTable('server_invites', function($table) {            
            $table->id();
            $table->integer('server_id');
            $table->integer('inviter_user_id');
            $table->string('invite_link');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->foreignKey('inviter_user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('server_invites', true);
    }
}
