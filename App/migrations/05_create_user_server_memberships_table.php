<?php

class CreateUserServerMembershipsMigration {
    public function up($migration) {
        $migration->createTable('user_server_memberships', function($table) {
            $table->id();
            $table->integer('user_id'); // Changed from bigInteger to integer to match users.id
            $table->integer('server_id'); // Changed from bigInteger to integer to match servers.id
            $table->string('role', 255, true); // nullable
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('user_server_memberships', true);
    }
}
