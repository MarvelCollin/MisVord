<?php

class CreateChannelsTableMigration {
    public function up($migration) {
        $migration->createTable('channels', function($table) {
            $table->id();
            $table->bigInteger('server_id', false, true);
            $table->string('name');
            $table->boolean('is_private'); // Removed default(false) call
            $table->string('type');
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
        });
    }

    public function down($migration) {
        $migration->dropTable('channels', true);
    }
}
