<?php

class CreateGroupServersMigration
{
    public function up($migration)
    {
        $migration->createTable('group_servers', function ($table) {
            $table->id();
            $table->integer('user_id');
            $table->string('group_name');
            $table->timestamps();
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
        });
    }

    public function down($migration)
    {
        $migration->dropTable('group_servers', true);
    }
}
