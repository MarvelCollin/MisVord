<?php

class CreateServerInvitesMigration {
    public function up($migration) {
        $migration->createTable('server_invites', function($table) {
            $table->id();
            $table->bigInteger('server_id', false, true);
            $table->bigInteger('inviter_user_id', false, true);
            $table->bigInteger('target_user_id', false, true, true); // nullable
            $table->string('invite_link');
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->foreignKey('inviter_user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('target_user_id', 'users', 'id', 'SET NULL');
        });
    }

    public function down($migration) {
        $migration->dropTable('server_invites', true);
    }
}
