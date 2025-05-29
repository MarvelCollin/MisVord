<?php

class CreateFriendListTableMigration {    public function up($migration) {
        $migration->createTable('friend_list', function($table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('user_id2');
                $table->string('status');
                $table->timestamps();
                $table->foreignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
                $table->foreignKey('user_id2', 'users', 'id', 'CASCADE', 'CASCADE');
            });
    }

    public function down($migration) {
        $migration->dropTable('friend_list', true);
    }
}
