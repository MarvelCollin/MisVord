<?php

class CreateNitroTableMigration {
    public function up($migration) {
        $migration->createTable('nitro', function($table) {
            $table->id();
            $table->integer('user_id')->nullable();
            $table->string('code');
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'SET NULL');
        });
        
        $migration->raw("ALTER TABLE nitro ADD CONSTRAINT unique_nitro_code UNIQUE (code)");
    }

    public function down($migration) {
        $migration->dropTable('nitro', true);
    }
}
