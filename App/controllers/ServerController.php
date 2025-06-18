<?php

require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/BaseController.php';

class ServerController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    /**
     * Show server page with channels and messages
     */
    public function show($id) {
        $this->requireAuth();

        $server = Server::find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        // Check if user is a member of this server
        $membership = UserServerMembership::findByUserAndServer($this->getCurrentUserId(), $id);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        try {
            // Get server channels
            $channels = Channel::getByServerId($id);
            
            // Handle active channel if specified
            $activeChannelId = $_GET['channel'] ?? null;
            $activeChannel = null;
            $channelMessages = [];
            
            if ($activeChannelId) {
                $activeChannel = Channel::find($activeChannelId);
                if ($activeChannel && $activeChannel->server_id == $id) {
                    try {
                        $channelMessages = Message::getForChannel($activeChannelId, 50, 0);
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

            // For API/AJAX requests, return JSON
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'server' => $this->formatServer($server),
                    'channels' => array_map([$this, 'formatChannel'], $channels),
                    'active_channel' => $activeChannel ? $this->formatChannel($activeChannel) : null,
                    'messages' => $channelMessages
                ]);
            }

            // For regular requests, set globals and render view
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

    /**
     * Create a new server
     */
    public function create() {
        $this->requireAuth();
        
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        // Validate input
        $this->validate($input, [
            'name' => 'required'
        ]);

        $name = $input['name'];
        $description = $input['description'] ?? '';

        try {
            $server = new Server();
            $server->name = $name;
            $server->description = $description;
            $server->owner_id = $this->getCurrentUserId();
            
            if ($server->save()) {
                // Add owner as member
                $membership = new UserServerMembership();
                $membership->user_id = $this->getCurrentUserId();
                $membership->server_id = $server->id;
                $membership->role = 'owner';
                $membership->save();
                
                // Create default general channel
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

    /**
     * Update server settings
     */
    public function update($id) {
        $this->requireAuth();
        
        $server = Server::find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        // Check if user is the owner or has admin permissions
        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        $errors = [];
        
        // Validate name if provided
        if (isset($input['name'])) {
            if (empty($input['name'])) {
                $errors['name'] = 'Server name is required';
            } else {
                $server->name = $input['name'];
            }
        }

        // Update description if provided
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
    }    /**
     * Delete a server
     */
    public function delete() {
        $this->requireAuth();
        
        $input = $this->getInput();
        $id = $input['server_id'] ?? null;
        
        if (!$id) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }
        
        $server = Server::find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        // Only owner can delete server
        if ($server->owner_id != $this->getCurrentUserId()) {
            return $this->forbidden('Only the server owner can delete this server');
        }
        
        try {
            // For now, we'll use a direct query to delete the server
            // TODO: Implement proper delete method in Server model
            $query = new Query();
            $deleted = $query->table('servers')
                ->where('id', $id)
                ->delete();
                
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

    /**
     * Join a server via invite
     */
    public function join($inviteCode) {
        $this->requireAuth();
        
        // TODO: Implement server invite system
        // For now, this is a placeholder
        
        return $this->notFound('Server invite not found');
    }

    /**
     * Leave a server
     */
    public function leave($id) {
        $this->requireAuth();
        
        $server = Server::find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        // Check if user is a member
        $membership = UserServerMembership::findByUserAndServer($this->getCurrentUserId(), $id);
        if (!$membership) {
            return $this->notFound('You are not a member of this server');
        }        // Prevent owner from leaving (they must transfer ownership first)
        if ($server->owner_id == $this->getCurrentUserId()) {
            return $this->validationError(['server' => 'Server owner cannot leave. Transfer ownership first.']);
        }
        
        try {
            // Use removeMember method from Server model
            if ($server->removeMember($this->getCurrentUserId())) {
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

    /**
     * Get user's servers
     */
    public function getUserServers() {
        $this->requireAuth();        try {
            $servers = Server::getForUser($this->getCurrentUserId());
            $formattedServers = array_map([$this, 'formatServer'], $servers);

            return $this->success(['servers' => $formattedServers]);
        } catch (Exception $e) {
            $this->logActivity('user_servers_error', [
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load servers');
        }
    }    /**
     * Show server invite page
     */
    public function showInvite($code = null) {
        // Get code from parameter or input
        if (!$code) {
            $input = $this->getInput();
            $code = $input['code'] ?? null;
        }
        
        if (!$code) {
            return $this->notFound('Invalid invite code');
        }try {
            // Find invite by code
            $invite = ServerInvite::findByInviteCode($code);
            if (!$invite) {
                return $this->notFound('Invite not found or expired');
            }

            $server = Server::find($invite->server_id);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            $this->logActivity('invite_viewed', [
                'invite_code' => $code,
                'server_id' => $server->id
            ]);

            // For API requests, return JSON
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'server' => $server,
                    'invite' => $invite
                ]);
            }

            // For web requests, set global variables and render view
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
    }    /**
     * Get server channels
     */
    public function getServerChannels($serverId = null) {
        $this->requireAuth();

        // Get server ID from parameter or input
        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }
        
        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        try {
            // Check if user has access to the server
            if (!UserServerMembership::isMember($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }

            $channels = Channel::getByServerId($serverId);

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
    }    /**
     * Get server details
     */
    public function getServerDetails($serverId = null) {
        $this->requireAuth();

        // Get server ID from parameter or input
        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }
        
        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        try {
            $server = Server::find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            // Check if user has access to the server
            if (!UserServerMembership::isMember($this->getCurrentUserId(), $serverId)) {
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
    }    /**
     * Generate invite link
     */
    public function generateInviteLink($serverId = null) {
        $this->requireAuth();

        // Get server ID from parameter or input
        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }
        
        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        try {
            $server = Server::find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            // Check if user is owner or has permission
            if (!UserServerMembership::isOwner($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have permission to generate invite links');
            }            // Generate invite code
            $inviteCode = bin2hex(random_bytes(8));
            $inviteUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/join/' . $inviteCode;

            $invite = ServerInvite::create([
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
    }

    /**
     * Format server data for API response
     */
    private function formatServer($server) {
        return [
            'id' => $server->id,
            'name' => $server->name,
            'description' => $server->description,
            'owner_id' => $server->owner_id,
            'icon_url' => $server->icon_url ?? null,
            'member_count' => $server->getMemberCount(),
            'created_at' => $server->created_at,
            'updated_at' => $server->updated_at
        ];
    }

    /**
     * Format channel data for API response
     */
    private function formatChannel($channel) {
        return [
            'id' => $channel->id,
            'name' => $channel->name,
            'type' => $channel->type,
            'server_id' => $channel->server_id,
            'category_id' => $channel->category_id,
            'created_at' => $channel->created_at
        ];
    }

    /**
     * Check if user can manage server
     */
    private function canManageServer($server) {
        // Check if user is the owner
        if ($server->owner_id == $this->getCurrentUserId()) {
            return true;
        }
        
        // TODO: Check for admin role permissions
        return false;
    }
}
