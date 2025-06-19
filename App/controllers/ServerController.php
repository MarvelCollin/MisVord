<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerInviteRepository.php';
require_once __DIR__ . '/BaseController.php';

class ServerController extends BaseController
{
    private $serverRepository;
    private $channelRepository;
    private $messageRepository;
    private $userServerMembershipRepository;
    private $inviteRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->channelRepository = new ChannelRepository();
        $this->messageRepository = new MessageRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->inviteRepository = new ServerInviteRepository();
    }

        public function show($id)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $id);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        try {

            $channels = $this->channelRepository->getByServerId($id);

            $activeChannelId = $_GET['channel'] ?? null;
            $activeChannel = null;
            $channelMessages = [];
            if ($activeChannelId) {
                $activeChannel = $this->channelRepository->find($activeChannelId);
                if ($activeChannel && $activeChannel->server_id == $id) {
                    try {
                        $channelMessages = $this->messageRepository->getForChannel($activeChannelId, 50, 0);
                        $this->logActivity('channel_messages_loaded', [
                            'channel_id' => $activeChannelId,
                            'message_count' => count($channelMessages)
                        ]);
                    } catch (Exception $e) {
                        $this->logActivity('channel_messages_error', [
                            'channel_id' => $activeChannelId,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'server' => $this->formatServer($server),
                    'channels' => array_map([$this, 'formatChannel'], $channels),
                    'active_channel' => $activeChannel ? $this->formatChannel($activeChannel) : null,
                    'messages' => $channelMessages
                ]);
            }

            $GLOBALS['server'] = $server;
            $GLOBALS['serverChannels'] = $channels;
            $GLOBALS['activeChannelId'] = $activeChannelId;
            $GLOBALS['channelMessages'] = $channelMessages;

            $this->logActivity('server_view', ['server_id' => $id]);

            require_once __DIR__ . '/../views/pages/server-page.php';
        } catch (Exception $e) {
            $this->logActivity('server_view_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError('Failed to load server');
            }

            $this->redirect('/404');
        }
    }

    public function create()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'name' => 'required'
        ]);

        $name = $input['name'];
        $description = $input['description'] ?? '';
        
        try {
            $server = new Server();
            $server->name = $name;
            $server->description = $description;
            
            if (isset($_FILES['server_icon']) && $_FILES['server_icon']['error'] === UPLOAD_ERR_OK) {
                $imageUrl = $this->uploadImage($_FILES['server_icon'], 'servers');
                if ($imageUrl !== false) {
                    $server->image_url = $imageUrl;
                }
            }

            if ($server->save()) {
                $membership = new UserServerMembership();
                $membership->user_id = $this->getCurrentUserId();
                $membership->server_id = $server->id;
                $membership->role = 'owner';
                $membership->save();

                $generalChannel = new Channel();
                $generalChannel->name = 'general';
                $generalChannel->type = 'text';
                $generalChannel->server_id = $server->id;
                $generalChannel->created_by = $this->getCurrentUserId();
                $generalChannel->save();

                $this->logActivity('server_created', [
                    'server_id' => $server->id,
                    'server_name' => $name
                ]);

                return $this->success([
                    'server' => $this->formatServer($server),
                    'redirect' => "/servers/{$server->id}"
                ], 'Server created successfully');
            } else {
                throw new Exception('Failed to save server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_create_error', [
                'server_name' => $name,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to create server');
        }
    }

        public function update($id)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $errors = [];

        if (isset($input['name'])) {
            if (empty($input['name'])) {
                $errors['name'] = 'Server name is required';
            } else {
                $server->name = $input['name'];
            }
        }

        if (isset($input['description'])) {
            $server->description = $input['description'];
        }

        if (!empty($errors)) {
            return $this->validationError($errors);
        }

        try {
            if ($server->save()) {
                $this->logActivity('server_updated', [
                    'server_id' => $id,
                    'changes' => array_keys($input)
                ]);

                return $this->success([
                    'server' => $this->formatServer($server)
                ], 'Server updated successfully');
            } else {
                throw new Exception('Failed to save server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_update_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server');
        }
    }

    public function delete()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $id = $input['server_id'] ?? null;

        if (!$id) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }        if (!$server->isOwner($this->getCurrentUserId())) {
            return $this->forbidden('Only the server owner can delete this server');
        }

        try {
            $deleted = $this->serverRepository->delete($id);

            if ($deleted) {
                $this->logActivity('server_deleted', [
                    'server_id' => $id,
                    'server_name' => $server->name
                ]);

                return $this->success(['redirect' => '/app'], 'Server deleted successfully');
            } else {
                throw new Exception('Failed to delete server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_delete_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to delete server');
        }
    }

    public function join($inviteCode)
    {
        $this->requireAuth();

        return $this->notFound('Server invite not found');
    }

        public function leave($id)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }        
        $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $id);
        if (!$membership) {
            return $this->notFound('You are not a member of this server');
        }        if ($server->isOwner($this->getCurrentUserId())) {
            return $this->validationError(['server' => 'Server owner cannot leave. Transfer ownership first.']);
        }

        try {

            if ($this->userServerMembershipRepository->removeMembership($this->getCurrentUserId(), $id)) {
                $this->logActivity('server_left', [
                    'server_id' => $id,
                    'server_name' => $server->name
                ]);

                return $this->success(['redirect' => '/app'], 'Left server successfully');
            } else {
                throw new Exception('Failed to leave server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_leave_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to leave server');
        }
    }

    public function getUserServers()
    {
        $this->requireAuth();
        try {
            $servers = $this->serverRepository->getFormattedServersForUser($this->getCurrentUserId());

            return $this->success(['servers' => $servers]);
        } catch (Exception $e) {
            $this->logActivity('user_servers_error', [
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load servers');
        }
    }

    public function showInvite($code = null)
    {

        if (!$code) {
            $input = $this->getInput();
            $code = $input['code'] ?? null;
        }

        if (!$code) {
            return $this->notFound('Invalid invite code');
        }
        try {

            $invite = $this->inviteRepository->findByCode($code);
            if (!$invite) {
                return $this->notFound('Invite not found or expired');
            }

            $server = $this->serverRepository->find($invite->server_id);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            $this->logActivity('invite_viewed', [
                'invite_code' => $code,
                'server_id' => $server->id
            ]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'server' => $server,
                    'invite' => $invite
                ]);
            }

            $GLOBALS['server'] = $server;
            $GLOBALS['invite'] = $invite;

            return [
                'server' => $server,
                'invite' => $invite
            ];
        } catch (Exception $e) {
            $this->logActivity('invite_view_error', [
                'invite_code' => $code,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load invite');
        }
    }

    public function getServerChannels($serverId = null)
    {
        $this->requireAuth();

        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }
        try {

            if (!$this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }

            $channels = $this->channelRepository->getByServerId($serverId);

            $this->logActivity('server_channels_viewed', ['server_id' => $serverId]);

            return $this->success([
                'channels' => $channels,
                'server_id' => $serverId
            ]);
        } catch (Exception $e) {
            $this->logActivity('server_channels_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load server channels');
        }
    }
        public function getServerDetails($serverId = null)
    {
        $this->requireAuth();

        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }            
            if (!$this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }

            $this->logActivity('server_details_viewed', ['server_id' => $serverId]);

            return $this->success(['server' => $server]);
        } catch (Exception $e) {
            $this->logActivity('server_details_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load server details');
        }
    }

    public function generateInviteLink($serverId = null)
    {
        $this->requireAuth();

        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }
        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            if (!$this->userServerMembershipRepository->isOwner($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have permission to generate invite links');
            } 
            $inviteCode = bin2hex(random_bytes(8));
            $inviteUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/join/' . $inviteCode;
            $invite = $this->inviteRepository->create([
                'server_id' => $serverId,
                'inviter_user_id' => $this->getCurrentUserId(),
                'invite_link' => $inviteUrl
            ]);

            if ($invite) {
                $this->logActivity('invite_generated', [
                    'server_id' => $serverId,
                    'invite_code' => $inviteCode
                ]);

                return $this->success([
                    'invite_code' => $inviteCode,
                    'invite_url' => $inviteUrl
                ]);
            } else {
                return $this->serverError('Failed to generate invite');
            }
        } catch (Exception $e) {
            $this->logActivity('invite_generation_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to generate invite link');
        }
    }    private function formatServer($server)
    {
        return [
            'id' => $server->id,
            'name' => $server->name,
            'description' => $server->description,
            'image_url' => $server->image_url ?? null,
            'member_count' => $server->getMemberCount(),
            'created_at' => $server->created_at,
            'updated_at' => $server->updated_at,
            'owner' => $server->getOwner() ? [
                'id' => $server->getOwner()->id,
                'username' => $server->getOwner()->username,
                'display_name' => $server->getOwner()->display_name
            ] : null
        ];
    }

    private function formatChannel($channel)
    {
        return [
            'id' => $channel->id,
            'name' => $channel->name,
            'type' => $channel->type,
            'server_id' => $channel->server_id,
            'category_id' => $channel->category_id,
            'created_at' => $channel->created_at
        ];
    }    private function canManageServer($server)
    {

        if ($server->isOwner($this->getCurrentUserId())) {
            return true;
        }

        return false;
    }
}