<?php

class CreateServersTableMigration {
    public function up($migration) {
        $migration->createTable('servers', function($table) {
            $table->id();
            $table->string('name');
            $table->string('image_url', 255, true); // nullable
            $table->text('description', true); // nullable
            $table->string('invite_link', 255, true); // nullable
            $table->timestamps();
        });
    }

    public function down($migration) {
        $migration->dropTable('servers', true);
    }
}
