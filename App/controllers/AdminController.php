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
        
        if (!empty($query)) {
            $users = $this->userRepository->search($query, $page, $limit);
            $total = $this->userRepository->countSearch($query);
        } else {
            $users = $this->userRepository->paginate($page, $limit);
            $total = $this->userRepository->countRegularUsers();
        }
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
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
        
        return $users;
    }
    
    public function getUser($id)
    {
        $this->requireAdmin();
        
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return $this->notFound('User not found');
        }
        
        return $this->success(['user' => $user]);
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
    
    public function createSampleData()
    {
        $this->requireAdmin();
        
        try {
            // Create sample users with different creation dates
            for ($i = 0; $i < 5; $i++) {
                $date = date('Y-m-d H:i:s', strtotime("-$i days"));
                for ($j = 0; $j < rand(1, 5); $j++) {
                    $userData = [
                        'username' => 'SampleUser' . time() . rand(1000, 9999),
                        'email' => 'sample' . time() . rand(1000, 9999) . '@test.com',
                        'password' => password_hash('password123', PASSWORD_DEFAULT),
                        'discriminator' => str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                        'status' => 'offline',
                        'created_at' => $date,
                        'updated_at' => $date
                    ];
                    $this->userRepository->create($userData);
                }
            }
            
            // Create sample servers
            for ($i = 0; $i < 3; $i++) {
                $date = date('Y-m-d H:i:s', strtotime("-$i days"));
                $serverData = [
                    'name' => 'Sample Server ' . time() . rand(100, 999),
                    'description' => 'A sample server for testing',
                    'owner_id' => 1, // Assuming admin user ID is 1
                    'is_public' => 1,
                    'category' => 'General',
                    'created_at' => $date,
                    'updated_at' => $date
                ];
                $this->serverRepository->create($serverData);
            }
            
            // Create sample messages
            for ($i = 0; $i < 7; $i++) {
                $date = date('Y-m-d H:i:s', strtotime("-$i days"));
                for ($j = 0; $j < rand(1, 10); $j++) {
                    $messageData = [
                        'user_id' => 1,
                        'content' => 'Sample message content ' . rand(1000, 9999),
                        'message_type' => 'text',
                        'sent_at' => $date,
                        'created_at' => $date,
                        'updated_at' => $date
                    ];
                    $this->messageRepository->create($messageData);
                }
            }
            
            return $this->success([], 'Sample data created successfully');
            
        } catch (Exception $e) {
            return $this->serverError('Error creating sample data: ' . $e->getMessage());
        }
    }

    public function debugChartData()
    {
        $this->requireAdmin();
        
        // Test data fetching directly
        $userCount = $this->userRepository->count();
        $serverCount = $this->serverRepository->count();
        $messageCount = $this->messageRepository->count();
        
        $dailyUserStats = $this->userRepository->getRegistrationStatsByDay(7);
        $dailyMessageStats = $this->messageRepository->getMessageStatsByDay(7);
        $dailyServerStats = $this->serverRepository->getCreationStatsByDay(7);
        
        return $this->success([
            'debug' => [
                'counts' => [
                    'users' => $userCount,
                    'servers' => $serverCount,
                    'messages' => $messageCount
                ],
                'raw_stats' => [
                    'users_daily' => $dailyUserStats,
                    'messages_daily' => $dailyMessageStats,
                    'servers_daily' => $dailyServerStats
                ],
                'formatted_stats' => [
                    'users_daily' => array_map(function($date, $count) {
                        return ['label' => $date, 'value' => $count];
                    }, array_keys($dailyUserStats), $dailyUserStats),
                    'messages_daily' => array_map(function($date, $count) {
                        return ['label' => $date, 'value' => $count];
                    }, array_keys($dailyMessageStats), $dailyMessageStats),
                    'servers_daily' => array_map(function($date, $count) {
                        return ['label' => $date, 'value' => $count];
                    }, array_keys($dailyServerStats), $dailyServerStats)
                ]
            ]
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
            
            $currentStatus = $user->status;
            $newStatus = $currentStatus === 'banned' ? 'offline' : 'banned';
            
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
