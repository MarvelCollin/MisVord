<?php

class CreateBadgesSystemTablesMigration {
    public function up($migration) {
        $migration->createTable('badges', function($table) {
            $table->id();
            $table->string('name');
            $table->string('description');
            $table->string('icon_url');
            $table->string('badge_type');
            $table->boolean('is_rare')->default(false);
            $table->timestamps();
        });
        
        $migration->createTable('user_badges', function($table) {
            $table->id();
            $table->integer('user_id');
            $table->integer('badge_id');
            $table->dateTime('acquired_at');
            $table->timestamps();
            
            $table->foreignKey('user_id', 'users', 'id', 'CASCADE');
            $table->foreignKey('badge_id', 'badges', 'id', 'CASCADE');
            
            $table->index(['user_id', 'badge_id']);
        });
        
        $migration->createTable('server_badges', function($table) {
            $table->id();
            $table->integer('server_id');
            $table->integer('badge_id');
            $table->dateTime('acquired_at');
            $table->timestamps();
            
            $table->foreignKey('server_id', 'servers', 'id', 'CASCADE');
            $table->foreignKey('badge_id', 'badges', 'id', 'CASCADE');
            
            $table->index(['server_id', 'badge_id']);
        });
    }

    public function down($migration) {
        $migration->dropTable('user_badges', true);
        $migration->dropTable('server_badges', true);
        $migration->dropTable('badges', true);
    }
} 