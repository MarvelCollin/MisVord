<?php

class AddMentionsToMessagesTableMigration {
    public function up($migration) {
        $migration->alterTable('messages', function($table) {
            $table->text('mentions', true);
        });
    }

    public function down($migration) {
        $migration->alterTable('messages', function($table) {
            $table->dropColumn('mentions');
        });
    }
} 