<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';

class AdminController extends BaseController
{
    private $userRepository;
    private $serverRepository;
    private $messageRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->serverRepository = new ServerRepository();
        $this->messageRepository = new MessageRepository();
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
            return $this->success(['stats' => $stats]);
        }
        
        return $stats;
    }

    public function getUsers()
    {
        $this->requireAdmin();
        
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        
        try {
            if (!empty($query)) {
                $users = $this->userRepository->search($query, $page, $limit);
                $total = $this->userRepository->countSearch($query);
            } else {
                $users = $this->userRepository->paginate($page, $limit);
                $total = $this->userRepository->countRegularUsers();
            }
            
            // Ensure consistent user structure
            $normalizedUsers = [];
            foreach ($users as $user) {
                // Convert to array if it's an object
                $userData = is_object($user) && method_exists($user, 'toArray') ? $user->toArray() : (array)$user;
                
                // Skip admin user
                if (isset($userData['email']) && $userData['email'] === 'admin@admin.com') {
                    continue;
                }
                
                // Ensure all critical fields exist
                $normalizedUsers[] = [
                    'id' => $userData['id'] ?? null,
                    'username' => $userData['username'] ?? 'Unknown User',
                    'discriminator' => $userData['discriminator'] ?? '0000',
                    'email' => $userData['email'] ?? '',
                    'status' => $userData['status'] ?? 'offline',
                    'display_name' => $userData['display_name'] ?? $userData['username'] ?? 'Unknown User',
                    'avatar_url' => $userData['avatar_url'] ?? null,
                    'banner_url' => $userData['banner_url'] ?? null,
                    'bio' => $userData['bio'] ?? '',
                    'created_at' => $userData['created_at'] ?? null,
                    'updated_at' => $userData['updated_at'] ?? null
                ];
            }
            
            // Adjust total count to exclude admin
            if (!empty($query) && $query !== 'admin' && $total > 0) {
                $total = count($normalizedUsers);
            } else {
                $total--; // Subtract admin from total count
                if ($total < 0) $total = 0;
            }
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'users' => $normalizedUsers,
                    'pagination' => [
                        'total' => $total,
                        'page' => $page,
                        'limit' => $limit,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
            
            return $normalizedUsers;
        } catch (Exception $e) {
            error_log("Error loading users in admin controller: " . $e->getMessage());
            return $this->serverError("Failed to load users: " . $e->getMessage());
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
            
            // Convert to array if it's an object
            $userData = is_object($user) && method_exists($user, 'toArray') ? $user->toArray() : (array)$user;
            
            // Prevent accessing admin user details
            if (isset($userData['email']) && $userData['email'] === 'admin@admin.com') {
                return $this->forbidden('Access to admin user details is restricted');
            }
            
            // Ensure all critical fields exist
            $normalizedUser = [
                'id' => $userData['id'] ?? null,
                'username' => $userData['username'] ?? 'Unknown User',
                'discriminator' => $userData['discriminator'] ?? '0000',
                'email' => $userData['email'] ?? '',
                'status' => $userData['status'] ?? 'offline',
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
        
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $users = $this->userRepository->search($query, $page, $limit);
        $total = $this->userRepository->countSearch($query);
        
        return $this->success([
            'users' => $users,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    public function getServers()
    {
        $this->requireAdmin();
        
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $servers = $this->serverRepository->paginate($page, $limit);
        $total = $this->serverRepository->count();
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'servers' => $servers,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        }
        
        return $servers;
    }
    
    public function searchServers()
    {
        $this->requireAdmin();
        
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $servers = $this->serverRepository->search($query, $page, $limit);
        $total = $this->serverRepository->countSearch($query);
        
        return $this->success([
            'servers' => $servers,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
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
        
        // Get channel and category statistics instead of user status
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
        
        // Get simple message statistics by type or recent activity
        $totalMessages = $this->messageRepository->count();
        $todayMessages = $this->messageRepository->countToday();
        $thisWeekMessages = $totalMessages; // You can implement countThisWeek if needed
        
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
        
        // Get simple server statistics
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
    


    public function toggleUserBan($userId) {
        $this->requireAdmin();
        
        try {
            require_once __DIR__ . '/../database/repositories/UserRepository.php';
            $userRepository = new UserRepository();
            
            $user = $userRepository->find($userId);
            
            if (!$user) {
                return $this->error("User not found", 404);
            }
            
            // Prevent banning admin user
            if (isset($user->email) && $user->email === 'admin@admin.com') {
                return $this->forbidden("Cannot modify admin user status");
            }
            
            $currentStatus = $user->status;
            $newStatus = $currentStatus === 'banned' ? 'active' : 'banned';
            
            $updated = $userRepository->update($userId, [
                'status' => $newStatus
            ]);
            
            if (!$updated) {
                return $this->serverError("Failed to update user status");
            }
            
            $actionType = $newStatus === 'banned' ? 'banned' : 'unbanned';
            
            $this->logActivity("user_{$actionType}", [
                'admin_id' => $this->getCurrentUserId(),
                'user_id' => $userId
            ]);
            
            return $this->success([
                'user_id' => $userId,
                'status' => $newStatus
            ], "User has been {$actionType} successfully");
        } catch (Exception $e) {
            return $this->serverError("Error toggling user ban: " . $e->getMessage());
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
                return $this->forbidden('Access denied: Admin privileges required');
            }
            
            header('Location: /home');
            exit;
        }
    }


}
