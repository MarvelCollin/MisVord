<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/NitroRepository.php';

class AdminController extends BaseController
{
    private $userRepository;
    private $serverRepository;
    private $messageRepository;
    private $nitroRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->serverRepository = new ServerRepository();
        $this->messageRepository = new MessageRepository();
        $this->nitroRepository = new NitroRepository();
    }

    public function index()
    {
        $this->requireAdmin();
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'admin',
                'stats' => $this->getSystemStats()
            ]);
        }

        require_once __DIR__ . '/../views/pages/admin.php';
    }

    public function getSystemStats()
    {
        $this->requireAdmin();
        
        $stats = [
            'users' => [
                'total' => intval($this->userRepository->count()),
                'online' => intval($this->userRepository->countByStatus('online')),
                'active' => intval($this->userRepository->countByStatus('online')),
                'recent' => intval($this->userRepository->countRecentUsers(7))
            ],
            'servers' => [
                'total' => intval($this->serverRepository->count())
            ],
            'messages' => [
                'total' => intval($this->messageRepository->count()),
                'today' => intval($this->messageRepository->countToday())
            ]
        ];
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['stats' => $stats], 'Stats retrieved successfully');
        }
        
        return $stats;
    }

    public function getUsers()
    {
        $this->requireAdmin();
        
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        $status = isset($_GET['status']) ? trim($_GET['status']) : 'all';
        
        try {
            if (!empty($query)) {
                $users = $this->userRepository->searchWithNitroStatusRaw($query, $page, $limit, $status);
                $total = $this->userRepository->countSearch($query, $status);
            } else {
                $users = $this->userRepository->paginateWithNitroStatusRaw($page, $limit, $status);
                $total = $this->userRepository->countRegularUsers($status);
            }
            
            $normalizedUsers = [];
            foreach ($users as $userData) {
                $normalizedUsers[] = [
                    'id' => $userData['id'] ?? null,
                    'username' => $userData['username'] ?? 'Unknown User',
                    'discriminator' => $userData['discriminator'] ?? '0000',
                    'email' => $userData['email'] ?? '',
                    'status' => $userData['status'] ?? 'active',
                    'display_name' => $userData['display_name'] ?? $userData['username'] ?? 'Unknown User',
                    'avatar_url' => $userData['avatar_url'] ?? null,
                    'banner_url' => $userData['banner_url'] ?? null,
                    'bio' => $userData['bio'] ?? '',
                    'created_at' => $userData['created_at'] ?? null,
                    'updated_at' => $userData['updated_at'] ?? null,
                    'has_nitro' => isset($userData['has_nitro']) ? (bool)$userData['has_nitro'] : false,
                    'nitro_active' => isset($userData['has_nitro']) ? (bool)$userData['has_nitro'] : false,
                    'nitro_status' => isset($userData['has_nitro']) && $userData['has_nitro'] ? 'active' : 'inactive',
                    'nitro_code' => $userData['nitro_code'] ?? null
                ];
            }
            
            $responseData = [
                'users' => $normalizedUsers,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ];
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success($responseData, 'Users retrieved successfully');
            }
            
            return $normalizedUsers;
            
        } catch (Exception $e) {
            error_log("AdminController getUsers error: " . $e->getMessage());
            return $this->serverError('Failed to get users: ' . $e->getMessage());
        }
    }
    
    public function getUser($id)
    {
        $this->requireAdmin();
        
        try {
            $user = $this->userRepository->find($id);
            
            if (!$user) {
                return $this->notFound('User not found');
            }
            
            $userData = is_object($user) && method_exists($user, 'toArray') ? $user->toArray() : (array)$user;
            
            if (isset($userData['email']) && $userData['email'] === 'admin@admin.com') {
                return $this->forbidden('Access to admin user details is restricted');
            }
            
            $normalizedUser = [
                'id' => $userData['id'] ?? null,
                'username' => $userData['username'] ?? 'Unknown User',
                'discriminator' => $userData['discriminator'] ?? '0000',
                'email' => $userData['email'] ?? '',
                'status' => $userData['status'] ?? 'active',
                'display_name' => $userData['display_name'] ?? $userData['username'] ?? 'Unknown User',
                'avatar_url' => $userData['avatar_url'] ?? null,
                'banner_url' => $userData['banner_url'] ?? null,
                'bio' => $userData['bio'] ?? '',
                'created_at' => $userData['created_at'] ?? null,
                'updated_at' => $userData['updated_at'] ?? null
            ];
            
            return $this->success(['user' => $normalizedUser]);
        } catch (Exception $e) {
            error_log("Error getting user details in admin controller: " . $e->getMessage());
            return $this->serverError("Failed to load user details: " . $e->getMessage());
        }
    }
    
    public function searchUsers()
    {
        $this->requireAdmin();
        
        if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
            return $this->forbidden('This endpoint requires AJAX request');
        }
        
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 8;
        
        if (empty($query) || strlen($query) < 2) {
            return $this->success([
                'users' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => 0
                ]
            ]);
        }
        
        try {
            $users = $this->userRepository->searchWithNitroStatusRaw($query, $page, $limit);
            
            $normalizedUsers = [];
            foreach ($users as $userData) {
                $normalizedUsers[] = [
                    'id' => $userData['id'] ?? null,
                    'username' => $userData['username'] ?? 'Unknown',
                    'discriminator' => $userData['discriminator'] ?? '0000',
                    'email' => $userData['email'] ?? '',
                    'display_name' => $userData['display_name'] ?? $userData['username'] ?? 'Unknown',
                    'avatar_url' => $userData['avatar_url'] ?? null,
                    'has_nitro' => isset($userData['has_nitro']) ? (bool)$userData['has_nitro'] : false,
                    'nitro_active' => isset($userData['has_nitro']) ? (bool)$userData['has_nitro'] : false,
                    'nitro_status' => isset($userData['has_nitro']) && $userData['has_nitro'] ? 'active' : 'inactive',
                    'nitro_code' => $userData['nitro_code'] ?? null
                ];
            }
            
            $total = $this->userRepository->countSearch($query);
            
            return $this->success([
                'users' => $normalizedUsers,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ], 'Users found successfully');
            
        } catch (Exception $e) {
            error_log("AdminController searchUsers error: " . $e->getMessage());
            return $this->serverError('Failed to search users: ' . $e->getMessage());
        }
    }
    
    public function getServers()
    {
        $this->requireAdmin();
        
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        
        try {
            if (!empty($query)) {
                $servers = $this->serverRepository->search($query, $page, $limit);
                $total = $this->serverRepository->countSearch($query);
            } else {
                $servers = $this->serverRepository->paginate($page, $limit);
                $total = $this->serverRepository->count();
            }
            
            $normalizedServers = [];
            foreach ($servers as $server) {
                $serverData = is_object($server) && method_exists($server, 'toArray') ? $server->toArray() : (array)$server;
                
                $normalizedServers[] = [
                    'id' => $serverData['id'] ?? null,
                    'name' => $serverData['name'] ?? 'Unknown Server',
                    'description' => $serverData['description'] ?? '',
                    'owner_id' => $serverData['owner_id'] ?? null,
                    'owner_display' => $serverData['owner_display'] ?? 'Unknown User',
                    'member_count' => intval($serverData['member_count'] ?? 0),
                    'icon' => $serverData['image_url'] ?? null,
                    'banner' => $serverData['banner_url'] ?? null,
                    'is_public' => $serverData['is_public'] ?? 0,
                    'category' => $serverData['category'] ?? null,
                    'created_at' => $serverData['created_at'] ?? null,
                    'updated_at' => $serverData['updated_at'] ?? null
                ];
            }
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'servers' => $normalizedServers,
                    'total' => $total,
                    'pagination' => [
                        'total' => $total,
                        'page' => $page,
                        'limit' => $limit,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
            
            return $normalizedServers;
        } catch (Exception $e) {
            error_log("Error loading servers in admin controller: " . $e->getMessage());
            return $this->serverError("Failed to load servers: " . $e->getMessage());
        }
    }
    
    public function searchServers()
    {
        $this->requireAdmin();
        
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        try {
            $servers = $this->serverRepository->search($query, $page, $limit);
            $total = $this->serverRepository->countSearch($query);
            
            $normalizedServers = [];
            foreach ($servers as $server) {
                $serverData = is_object($server) && method_exists($server, 'toArray') ? $server->toArray() : (array)$server;
                
                $normalizedServers[] = [
                    'id' => $serverData['id'] ?? null,
                    'name' => $serverData['name'] ?? 'Unknown Server',
                    'description' => $serverData['description'] ?? '',
                    'owner_id' => $serverData['owner_id'] ?? null,
                    'owner_display' => $serverData['owner_display'] ?? 'Unknown User',
                    'member_count' => intval($serverData['member_count'] ?? 0),
                    'icon' => $serverData['image_url'] ?? null,
                    'banner' => $serverData['banner_url'] ?? null,
                    'is_public' => $serverData['is_public'] ?? 0,
                    'category' => $serverData['category'] ?? null,
                    'created_at' => $serverData['created_at'] ?? null,
                    'updated_at' => $serverData['updated_at'] ?? null
                ];
            }
            
            return $this->success([
                'servers' => $normalizedServers,
                'total' => $total,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error searching servers in admin controller: " . $e->getMessage());
            return $this->serverError("Failed to search servers: " . $e->getMessage());
        }
    }

    public function updateUser($id)
    {
        $this->requireAdmin();
        
        $input = $this->getInput();
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return $this->notFound('User not found');
        }
        
        if (isset($input['status'])) {
            $user->status = $input['status'];
        }
        
        if (isset($input['username'])) {
            $user->username = $input['username'];
        }
        
        if (isset($input['email'])) {
            $user->email = $input['email'];
        }
        
        if ($user->save()) {
            return $this->success(['user' => $user], 'User updated successfully');
        }
        
        return $this->serverError('Failed to update user');
    }
    
    public function deleteUser($id)
    {
        $this->requireAdmin();
        
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return $this->notFound('User not found');
        }
        
        if ($this->userRepository->delete($id)) {
            return $this->success([], 'User deleted successfully');
        }
        
        return $this->serverError('Failed to delete user');
    }
    
    public function deleteServer($id)
    {
        $this->requireAdmin();
        
        $server = $this->serverRepository->find($id);
        
        if (!$server) {
            return $this->notFound('Server not found');
        }
        
        if ($this->serverRepository->delete($id)) {
            return $this->success([], 'Server deleted successfully');
        }
        
        return $this->serverError('Failed to delete server');
    }
    
    public function getLogs()
    {
        $this->requireAdmin();
        
        $level = isset($_GET['level']) ? trim($_GET['level']) : 'all';
        $date = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');
        
        $logsDir = dirname(__DIR__) . '/logs/';
        $logFile = "app_{$date}.log";
        $logPath = $logsDir . $logFile;
        
        if (!file_exists($logPath)) {
            return $this->success(['logs' => "No logs found for {$date}"]);
        }
        
        $logs = file_get_contents($logPath);
        
        if ($level !== 'all') {
            
            $filteredLogs = [];
            $logLines = explode(PHP_EOL, $logs);
            
            foreach ($logLines as $line) {
                if (strpos($line, "[{$level}]") !== false) {
                    $filteredLogs[] = $line;
                }
            }
            
            $logs = implode(PHP_EOL, $filteredLogs);
        }
        
        return $this->success(['logs' => $logs]);
    }
    
    public function getServerStats()
    {
        $this->requireAdmin();
        
        
        $daily = $this->serverRepository->getCreationStatsByDay(7);
        
        
        $weekly = $this->serverRepository->getCreationStatsByWeek(4);
        
        
        $activeServers = $this->serverRepository->countActiveServers(24);
        
        
        $totalMembers = $this->serverRepository->countTotalMembers();
        
        $stats = [
            'daily' => $daily,
            'weekly' => $weekly,
            'active' => $activeServers,
            'total_members' => $totalMembers,
            'total_servers' => $this->serverRepository->count(),
            'avg_members_per_server' => $this->serverRepository->count() > 0 
                ? round($totalMembers / $this->serverRepository->count(), 1) 
                : 0
        ];
        
        return $this->success(['stats' => $stats]);
    }
    
    public function getUserStats()
    {
        $this->requireAdmin();
        
        
        $daily = $this->userRepository->getRegistrationStatsByDay(7);
        
        
        $weekly = $this->userRepository->getRegistrationStatsByWeek(4);
        
        
        $onlineUsers = $this->userRepository->countByStatus('online');
        
        
        $activeUsers = $this->userRepository->countActiveUsers(24);
        
        $stats = [
            'daily' => $daily,
            'weekly' => $weekly,
            'online' => $onlineUsers,
            'active' => $activeUsers,
            'total' => $this->userRepository->count()
        ];
        
        return $this->success(['stats' => $stats]);
    }
    
    public function getUserGrowthStats()
    {
        $this->requireAdmin();

        require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
        require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
        
        $categoryRepository = new CategoryRepository();
        $channelRepository = new ChannelRepository();
        
        $totalCategories = $categoryRepository->countAll();
        $textChannels = $channelRepository->countTextChannels();
        $voiceChannels = $channelRepository->countVoiceChannels();
        
        $data = [
            ['label' => 'Categories', 'value' => $totalCategories],
            ['label' => 'Text Channels', 'value' => $textChannels],
            ['label' => 'Voice Channels', 'value' => $voiceChannels]
        ];
        
        return $this->success([
            'data' => $data,
            'total' => $totalCategories + $textChannels + $voiceChannels
        ]);
    }
    
    public function getMessageActivityStats()
    {
        $this->requireAdmin();
        
        $totalMessages = $this->messageRepository->count();
        $todayMessages = $this->messageRepository->countToday();
        $thisWeekMessages = $totalMessages;
        
        $data = [
            ['label' => 'Total Messages', 'value' => $totalMessages],
            ['label' => 'Today', 'value' => $todayMessages],
            ['label' => 'Remaining', 'value' => max(0, $totalMessages - $todayMessages)]
        ];
        
        return $this->success([
            'data' => $data,
            'total' => $totalMessages
        ]);
    }
    
    public function getServerGrowthStats()
    {
        $this->requireAdmin();
        
        $totalServers = $this->serverRepository->count();
        $publicServers = $this->serverRepository->countPublicServers();
        $privateServers = $totalServers - $publicServers;
        
        $data = [
            ['label' => 'Public Servers', 'value' => $publicServers],
            ['label' => 'Private Servers', 'value' => $privateServers]
        ];
        
        return $this->success([
            'data' => $data,
            'total' => $totalServers
        ]);
    }
    
    public function getNitroStats()
    {
        $this->requireAdmin();

        try {
            $total = $this->nitroRepository->countTotalCodes();
            $active = $this->nitroRepository->countActiveCodes();
            $used = $total - $active;

            $stats = [
                'total' => intval($total),
                'active' => intval($active),
                'used' => intval($used)
            ];

            return $this->success(['stats' => $stats], 'Nitro stats retrieved successfully');
        } catch (Exception $e) {
            error_log("AdminController getNitroStats error: " . $e->getMessage());
            return $this->serverError('Failed to get Nitro stats: ' . $e->getMessage());
        }
    }
    
    public function toggleUserBan($userId) {
        $this->requireAdmin();
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->notFound("User not found");
            }
            
            if (isset($user->email) && $user->email === 'admin@admin.com') {
                return $this->forbidden("Cannot modify admin user status");
            }
            
            $currentStatus = $user->status;
            $newStatus = $currentStatus === 'banned' ? 'active' : 'banned';
            
            $updated = $this->userRepository->update($userId, [
                'status' => $newStatus
            ]);
            
            if (!$updated) {
                return $this->serverError("Failed to update user status");
            }
            
            $actionType = $newStatus === 'banned' ? 'banned' : 'unbanned';
            
            return $this->success([
                'user_id' => $userId,
                'status' => $newStatus
            ], "User has been {$actionType} successfully");
        } catch (Exception $e) {
            return $this->serverError("Error toggling user ban: " . $e->getMessage());
        }
    }

    public function getServerDetails($serverId) {
        $this->requireAdmin();
        
        try {
            require_once __DIR__ . '/../database/models/UserServerMembership.php';
            
            $server = $this->serverRepository->find($serverId);
            
            if (!$server) {
                return $this->notFound("Server not found");
            }
            
            $serverData = is_object($server) && method_exists($server, 'toArray') ? $server->toArray() : (array)$server;
            
            $members = UserServerMembership::getServerDetailsWithMembers($serverId);
            
            $normalizedServer = [
                'id' => $serverData['id'] ?? null,
                'name' => $serverData['name'] ?? 'Unknown Server',
                'description' => $serverData['description'] ?? '',
                'icon' => $serverData['image_url'] ?? null,
                'banner' => $serverData['banner_url'] ?? null,
                'is_public' => $serverData['is_public'] ?? 0,
                'category' => $serverData['category'] ?? null,
                'invite_link' => $serverData['invite_link'] ?? null,
                'created_at' => $serverData['created_at'] ?? null,
                'updated_at' => $serverData['updated_at'] ?? null,
                'member_count' => count($members)
            ];
            
            $normalizedMembers = [];
            foreach ($members as $member) {
                $normalizedMembers[] = [
                    'membership_id' => $member['membership_id'] ?? null,
                    'user_id' => $member['user_id'] ?? null,
                    'username' => $member['username'] ?? 'Unknown User',
                    'discriminator' => $member['discriminator'] ?? '0000',
                    'display_name' => $member['display_name'] ?? $member['username'] ?? 'Unknown User',
    
                    'email' => $member['email'] ?? '',
                    'avatar_url' => $member['avatar_url'] ?? null,
                    'banner_url' => $member['banner_url'] ?? null,
                    'status' => $member['status'] ?? 'active',
                    'bio' => $member['bio'] ?? '',
                    'role' => $member['role'] ?? 'member',
                    'notification_settings' => $member['notification_settings'] ?? null,
                    'joined_at' => $member['joined_at'] ?? null,
                    'membership_updated_at' => $member['membership_updated_at'] ?? null,
                    'user_created_at' => $member['user_created_at'] ?? null
                ];
            }
            
            return $this->success([
                'server' => $normalizedServer,
                'members' => $normalizedMembers,
                'total_members' => count($normalizedMembers)
            ]);
        } catch (Exception $e) {
            error_log("Error getting server details in admin controller: " . $e->getMessage());
            return $this->serverError("Failed to load server details: " . $e->getMessage());
        }
    }
    
    protected function requireAdmin()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        if (isset($_SESSION['username']) && $_SESSION['username'] === 'Admin' && 
            isset($_SESSION['discriminator']) && $_SESSION['discriminator'] === '0000') {
            return true;
        }
        
        $user = $this->userRepository->find($userId);
        
        if (!$user || $user->email !== 'admin@admin.com') {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                header('Content-Type: application/json');
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'timestamp' => date('Y-m-d H:i:s'),
                    'error' => [
                        'code' => 403,
                        'message' => 'Access denied: Admin privileges required'
                    ]
                ]);
                exit;
            }
            
            header('Location: /home');
            exit;
        }
        
        return true;
    }


}
