<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/BaseController.php';

class MessageController extends BaseController
{
    private $messageRepository;

    public function __construct()
    {
        parent::__construct();
        $this->messageRepository = new MessageRepository();
    }

    public function addReaction($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['emoji' => 'required']);

        $emoji = $input['emoji'];
        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            return $this->success([
                'message_id' => $messageId,
                'emoji' => $emoji,
                'user_id' => $userId,
                'socket_event' => 'reaction-added',
                'socket_data' => [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'emoji' => $emoji
                ],
                'client_should_emit_socket' => true
            ], 'Reaction added successfully');
        } catch (Exception $e) {
            return $this->serverError('Failed to add reaction');
        }
    }

    public function removeReaction($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['emoji' => 'required']);

        $emoji = $input['emoji'];

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            return $this->success([
                'message_id' => $messageId,
                'emoji' => $emoji,
                'user_id' => $userId,
                'socket_event' => 'reaction-removed',
                'socket_data' => [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'emoji' => $emoji
                ],
                'client_should_emit_socket' => true
            ], 'Reaction removed successfully');
        } catch (Exception $e) {
            return $this->serverError('Failed to remove reaction');
        }
    }

    public function getReactions($messageId)
    {
        $this->requireAuth();

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            return $this->success([
                'message_id' => $messageId,
                'reactions' => []
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to get reactions');
        }
    }

    public function pinMessage($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            return $this->success([
                'message_id' => $messageId,
                'socket_event' => 'message-pinned',
                'socket_data' => [
                    'message_id' => $messageId,
                    'user_id' => $userId
                ],
                'client_should_emit_socket' => true
            ], 'Message pinned successfully');
        } catch (Exception $e) {
            return $this->serverError('Failed to pin message');
        }
    }

    public function debugMessageStorage()
    {
        if (EnvLoader::get('APP_ENV') === 'production') {
            return $this->forbidden('Debug methods not allowed in production');
        }

        $this->requireAuth();
        try {
            $recentMessages = $this->messageRepository->getRecentMessages(10);

            return $this->success([
                'stats' => [
                    'total_messages' => 'N/A',
                    'channel_messages' => 'N/A',
                    'recent_messages' => count($recentMessages),
                    'user_message_count' => 'N/A'
                ],
                'recent_messages' => $recentMessages,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to retrieve debug information');
        }
    }
}
