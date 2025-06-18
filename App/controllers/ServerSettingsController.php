<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerInviteRepository.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/BaseController.php';

class ServerSettingsController extends BaseController {

    private $serverRepository;
    private $membershipRepository;
    private $inviteRepository;

    public function __construct() {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->membershipRepository = new UserServerMembershipRepository();
        $this->inviteRepository = new ServerInviteRepository();
    }

    public function updateServerSettings() {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['server_id'])) {
            return $this->validationError(['message' => 'Invalid request']);
        }        $serverId = $data['server_id'];
        $server = $this->serverRepository->find($serverId);

        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->membershipRepository->isOwner($_SESSION['user_id'], $serverId)) {
            return $this->forbidden('You do not have permission to update server settings');
        }

        if (isset($data['name']) && !empty($data['name'])) {
            $server->name = $data['name'];
        }

        if (isset($data['description'])) {
            $server->description = $data['description'];
        }

        if (isset($data['is_public'])) {
            $server->is_public = (bool)$data['is_public'];
        }

        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->uploadImage($_FILES['image_file'], 'servers');
            if ($imageUrl !== false) {
                $server->image_url = $imageUrl;
            }
        }

        if ($server->save()) {
            return $this->successResponse([
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name,
                    'description' => $server->description,
                    'image_url' => $server->image_url,
                    'is_public' => $server->is_public
                ]
            ], 'Server settings updated successfully');
        } else {
            return $this->serverError('Failed to update server settings');
        }
    }

    public function generateInviteLink() {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/servers\/(\d+)\/invite/', $path, $matches);

        if (!isset($matches[1])) {
            return $this->validationError(['message' => 'Server ID not found in URL']);
        }        $serverId = $matches[1];
        $server = $this->serverRepository->find($serverId);

        if (!$server) {
            return $this->notFound('Server not found');
        }

        $membership = $this->membershipRepository->findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            return $this->forbidden('You do not have permission to generate invite links');
        }

        try {

            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $inviteCode = '';
            for ($i = 0; $i < 10; $i++) {
                $inviteCode .= $characters[rand(0, strlen($characters) - 1)];
            }            $this->inviteRepository->deleteOldInvites($serverId);

            $invite = $this->inviteRepository->create([
                'server_id' => $serverId,
                'inviter_user_id' => $_SESSION['user_id'],
                'invite_link' => $inviteCode
            ]);

            if ($invite) {
                return $this->successResponse([
                    'invite_code' => $inviteCode
                ], 'Invite link generated successfully');
            } else {
                error_log("Failed to create server invite for server ID: $serverId");
                return $this->serverError('Failed to generate invite link');
            }
        } catch (Exception $e) {
            error_log("Error generating invite link: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }
}