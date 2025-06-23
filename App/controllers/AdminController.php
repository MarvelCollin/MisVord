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
                'total' => $this->userRepository->count(),
                'online' => $this->userRepository->countByStatus('online'),
                'recent' => $this->userRepository->countRecentUsers(7)
            ],
            'servers' => [
                'total' => $this->serverRepository->count()
            ],
            'messages' => [
                'total' => $this->messageRepository->count(),
                'today' => $this->messageRepository->countToday()
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
        
        $users = $this->userRepository->paginate($page, $limit);
        $total = $this->userRepository->count();
        
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
            $filteredLogs = '';
            $lines = explode("\n", $logs);
            
            foreach ($lines as $line) {
                if (stripos($line, "[{$level}]") !== false) {
                    $filteredLogs .= $line . "\n";
                }
            }
            
            $logs = $filteredLogs;
        }
        
        return $this->success(['logs' => $logs]);
    }
    
    protected function requireAdmin()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        // Special case for admin user
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
