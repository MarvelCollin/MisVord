<?php

require_once __DIR__ . '/repositories/UserRepository.php';
require_once __DIR__ . '/repositories/ServerRepository.php';
require_once __DIR__ . '/repositories/ChannelRepository.php';
require_once __DIR__ . '/repositories/MessageRepository.php';

function exampleUsage() {
    $userRepo = new UserRepository();
    $serverRepo = new ServerRepository();
    $channelRepo = new ChannelRepository();
    $messageRepo = new MessageRepository();

    $user = $userRepo->findByEmail('user@example.com');
    if (!$user) {
        $user = $userRepo->createWithHashedPassword([
            'username' => 'testuser',
            'email' => 'user@example.com',
            'password' => 'password123'
        ]);
    }

    $server = $serverRepo->createWithOwner([
        'name' => 'Test Server',
        'description' => 'A test server'
    ], $user->id);

    $channel = $channelRepo->createWithPosition([
        'name' => 'general',
        'type' => 'text',
        'server_id' => $server->id
    ]);

    $message = $messageRepo->createWithSentAt([
        'user_id' => $user->id,
        'content' => 'Hello, world!',
        'type' => 'text'
    ]);

    echo "Repository pattern example completed successfully!\n";
    echo "Created user: " . $user->username . "\n";
    echo "Created server: " . $server->name . "\n";
    echo "Created channel: " . $channel->name . "\n";
    echo "Created message: " . $message->content . "\n";
}
