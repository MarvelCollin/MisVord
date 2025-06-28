<?php

return [
    'description' => 'Update messages table to support multiple attachments',
    'up' => function($connection) {
        $connection->exec("ALTER TABLE messages MODIFY attachment_url TEXT NULL");
        
        $stmt = $connection->prepare("UPDATE messages SET attachment_url = CONCAT('[\"', attachment_url, '\"]') WHERE attachment_url IS NOT NULL AND attachment_url NOT LIKE '[%'");
        $stmt->execute();
        
        return true;
    },
    'down' => function($connection) {
        $stmt = $connection->prepare("UPDATE messages SET attachment_url = JSON_UNQUOTE(JSON_EXTRACT(attachment_url, '$[0]')) WHERE attachment_url IS NOT NULL AND attachment_url LIKE '[%'");
        $stmt->execute();
        
        $connection->exec("ALTER TABLE messages MODIFY attachment_url VARCHAR(512) NULL");
        
        return true;
    }
]; 