<?php

class CreateUsersTableMigration {
    public function up($migration) {
        $migration->createTable('users', function($table) {
            $table->id();
            $table->string('username');
            $table->string('discriminator', 4);
            $table->string('email');
            $table->string('password');
            $table->string('google_id', 255, true); 
            $table->string('avatar_url', 255, true); 
            $table->string('banner_url', 255, true); 
            $table->string('status', 255, true, 'appear');
            $table->string('security_question', 255, true);
            $table->string('security_answer', 255, true);
            $table->timestamps();
        });
    }

    public function down($migration) {
        $migration->dropTable('users', true);
    }
}
