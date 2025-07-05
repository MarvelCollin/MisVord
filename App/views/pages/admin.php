<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AdminController.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/UserRepository.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

if (isset($_SESSION['username']) && $_SESSION['username'] === 'Admin' && 
    isset($_SESSION['discriminator']) && $_SESSION['discriminator'] === '0000') {
    $user = new stdClass();
    $user->id = 0;
    $user->username = 'Admin';
    $user->discriminator = '0000';
    $user->email = 'admin@admin.com';
} else {
    $userRepository = new UserRepository();
    $user = $userRepository->find($_SESSION['user_id']);

    if (!$user || $user->email !== 'admin@admin.com') {
        header('Location: /home');
        exit;
    }
}

$adminController = new AdminController();
$stats = $adminController->getSystemStats();
$users = $adminController->getUsers();
$servers = $adminController->getServers();

$page_title = 'Admin Dashboard - misvord';
$body_class = 'bg-discord-dark text-white admin-page';
$page_css = 'admin';
$page_js = 'components/admin/admin';
$head_scripts = ['logger-init'];
$data_page = 'admin';
$body_attributes = 'data-page="admin"';
$contentType = 'admin';

echo '<link rel="stylesheet" href="' . asset('/css/admin.css') . '?v=' . time() . '">';
echo '<link rel="stylesheet" href="' . asset('/css/chart.css') . '?v=' . time() . '">';

ob_start();
?>

<div class="flex min-h-screen">
    <div class="w-60 bg-discord-light border-r border-discord-dark">
        <div class="p-4">
            <div class="text-sm font-semibold text-white">Admin Dashboard</div>
            <div class="text-xs text-discord-lighter mt-1"><?php echo htmlspecialchars($user->username); ?></div>
        </div>
        
        <nav class="mt-2">
            <ul>
                <li>
                    <div class="sidebar-category">
                        <span>DASHBOARD</span>
                    </div>
                </li>
                <li>
                    <a href="#overview" class="sidebar-item active" data-section="overview">
                        Overview
                    </a>
                </li>
                <li>
                    <a href="#users" class="sidebar-item" data-section="users">
                        Users
                    </a>
                </li>
                <li>
                    <a href="#servers" class="sidebar-item" data-section="servers">
                        Servers
                    </a>
                </li>

                <li>
                    <a href="#nitro" class="sidebar-item" data-section="nitro">
                        Nitro Codes
                    </a>
                </li>
                <li class="mt-6">
                    <button id="logout-btn" class="sidebar-item text-red-500 hover:text-red-400">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        Log Out
                    </button>
                </li>
            </ul>
        </nav>
    </div>

    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <div id="overview-section" class="admin-section active p-10">
            <div class="mb-8">
                <h1 class="text-2xl font-bold mb-2">System Overview</h1>
                <p class="text-discord-lighter">System statistics and information</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div id="total-users-card" class="bg-discord-darker rounded-lg p-6 skeleton">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">Users</h3>
                        <span class="text-blue-400">
                            <i class="fas fa-user text-xl"></i>
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-discord-lighter">Total Users</span>
                            <span class="text-xl font-bold card-value"><?php echo number_format($stats['users']['total']); ?></span>
                        </div>
                    </div>
                </div>
                
                <div id="online-users-card" class="bg-discord-darker rounded-lg p-6 skeleton">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">Online Users</h3>
                        <span class="text-green-400">
                            <i class="fas fa-broadcast-tower text-xl"></i>
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-discord-lighter">Online Users</span>
                            <span class="text-green-400 font-bold card-value"><?php echo number_format($stats['users']['online']); ?></span>
                        </div>
                    </div>
                </div>

                <div id="new-users-card" class="bg-discord-darker rounded-lg p-6 skeleton">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">New Users</h3>
                        <span class="text-blue-400">
                            <i class="fas fa-user-plus text-xl"></i>
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center">
                            <span class="text-discord-lighter">New (7 days)</span>
                            <span class="text-blue-400 font-bold card-value"><?php echo number_format($stats['users']['recent']); ?></span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div id="total-servers-card" class="bg-discord-darker rounded-lg p-6 skeleton">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">Servers</h3>
                        <span class="text-indigo-400">
                            <i class="fas fa-server text-xl"></i>
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-discord-lighter">Total Servers</span>
                            <span class="text-xl font-bold card-value"><?php echo number_format($stats['servers']['total']); ?></span>
                        </div>
                    </div>
                </div>
                
                <div id="total-messages-card" class="bg-discord-darker rounded-lg p-6 skeleton">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">Total Messages</h3>
                        <span class="text-yellow-400">
                            <i class="fas fa-comment text-xl"></i>
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-discord-lighter">Total Messages</span>
                            <span class="text-xl font-bold card-value"><?php echo number_format($stats['messages']['total']); ?></span>
                        </div>
                    </div>
                </div>
                
                <div id="todays-messages-card" class="bg-discord-darker rounded-lg p-6 skeleton">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">Today's Messages</h3>
                        <span class="text-yellow-400">
                            <i class="fas fa-clock text-xl"></i>
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center">
                            <span class="text-discord-lighter">Today</span>
                            <span class="text-yellow-400 font-bold card-value"><?php echo number_format($stats['messages']['today']); ?></span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-center mt-8 mb-4">
                <h2 class="text-xl font-semibold">Activity & Growth</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-discord-darker rounded-lg p-6">
                    <div id="users-chart" class="h-64">
                    </div>
                </div>

                <div class="bg-discord-darker rounded-lg p-6">
                    <div id="messages-chart" class="h-64">
                    </div>
                </div>
            </div>
        
            <div class="bg-discord-darker rounded-lg p-6">
                <div id="servers-chart" class="h-64">
                </div>
            </div>
        </div>
                                        
        <div id="users-section" class="admin-section hidden p-10">
            <div class="discord-header">
                <div>
                    <h1 class="discord-header-title">User Management</h1>
                    <p class="text-discord-lighter">View and manage all users</p>
                </div>
                <div class="discord-header-actions">
                    <div class="view-modes">
                        <div class="view-mode-button active" id="view-mode-list" data-mode="list">
                            <i class="fas fa-list" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div class="view-mode-button" id="view-mode-grid" data-mode="grid">
                            <i class="fas fa-th-large" style="width: 20px; height: 20px;"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-discord-darker rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center">
                        <select class="user-filter-dropdown mr-4" id="user-status-filter">
                        </select>
                    </div>
                    <div class="user-search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" id="user-search" placeholder="Search users..." class="user-search-input">
                    </div>
                </div>
                
                <div id="user-list-view">
                    <div id="users-container">
                        <?php foreach ($users as $user): ?>
                        <div class="user-card">
                            <div class="user-avatar">
                                <?php if (isset($user->avatar_url) && $user->avatar_url): ?>
                                <img src="<?php echo htmlspecialchars($user->avatar_url); ?>" alt="<?php echo htmlspecialchars($user->username); ?>">
                                <?php else: ?>
                                <?php echo strtoupper(substr($user->username, 0, 1)); ?>
                                <?php endif; ?>
                            </div>
                            <div class="user-info">
                                <div class="user-name">
                                    <?php echo htmlspecialchars($user->username . '#' . $user->discriminator); ?>
                                    
                                    <?php if ($user->email === 'admin@admin.com'): ?>
                                    <span class="user-badge badge-admin">Admin</span>
                                    <?php endif; ?>
                                    
                                    <span class="user-badge" style="
                                        <?php 
                                        echo match($user->status) {
                                            'online' => 'background-color: rgba(59, 165, 93, 0.1); color: #3ba55d;',
                                            'idle' => 'background-color: rgba(250, 168, 26, 0.1); color: #faa81a;',
                                            'do_not_disturb' => 'background-color: rgba(237, 66, 69, 0.1); color: #ed4245;',
                                            'banned' => 'background-color: rgba(0, 0, 0, 0.1); color: #ffffff;',
                                            default => 'background-color: rgba(116, 127, 141, 0.1); color: #747f8d;'
                                        };
                                        ?>
                                    ">
                                        <?php echo htmlspecialchars($user->status); ?>
                                    </span>
                                </div>
                                <div class="user-meta">
                                    <span>ID: <?php echo htmlspecialchars($user->id); ?></span> • 
                                    <span><?php echo htmlspecialchars($user->email); ?></span> • 
                                    <span>Joined: <?php echo htmlspecialchars(date('M d, Y', strtotime($user->created_at))); ?></span>
                                </div>
                            </div>
                            <div class="user-actions">
                                <?php if ($user->status === 'banned'): ?>
                                <button class="discord-button success unban-user" data-id="<?php echo $user->id; ?>" data-username="<?php echo htmlspecialchars($user->username); ?>">
                                    <i class="fas fa-user-check mr-2"></i>
                                    Unban
                                </button>
                                <?php else: ?>
                                <button class="discord-button danger ban-user" data-id="<?php echo $user->id; ?>" data-username="<?php echo htmlspecialchars($user->username); ?>">
                                    <i class="fas fa-ban mr-2"></i>
                                    Ban
                                </button>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div id="user-grid-view" class="hidden">
                    <div class="user-grid">
                        <?php foreach ($users as $user): ?>
                        <div class="user-card-grid">
                            <div class="user-card-header">
                                <div class="user-avatar">
                                    <?php if (isset($user->avatar_url) && $user->avatar_url): ?>
                                    <img src="<?php echo htmlspecialchars($user->avatar_url); ?>" alt="<?php echo htmlspecialchars($user->username); ?>">
                                    <?php else: ?>
                                    <?php echo strtoupper(substr($user->username, 0, 1)); ?>
                                    <?php endif; ?>
                                </div>
                                <div class="ml-3">
                                    <div class="user-name">
                                        <?php echo htmlspecialchars($user->username); ?>
                                    </div>
                                    <div class="text-discord-lighter text-xs">#<?php echo htmlspecialchars($user->discriminator); ?></div>
                                </div>
                            </div>
                            
                            <div class="user-meta px-2 py-3 border-t border-b border-discord-dark">
                                <div class="flex items-center mb-1">
                                    <i class="fas fa-envelope mr-2 text-discord-lighter" style="width: 14px;"></i>
                                    <span class="text-sm"><?php echo htmlspecialchars($user->email); ?></span>
                                </div>
                                <div class="flex items-center mb-1">
                                    <i class="fas fa-id-card mr-2 text-discord-lighter" style="width: 14px;"></i>
                                    <span class="text-sm">ID: <?php echo htmlspecialchars($user->id); ?></span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-calendar-alt mr-2 text-discord-lighter" style="width: 14px;"></i>
                                    <span class="text-sm">Joined: <?php echo htmlspecialchars(date('M d, Y', strtotime($user->created_at))); ?></span>
                                </div>
                            </div>
                            
                            <div class="user-card-footer">
                                <?php if ($user->status === 'banned'): ?>
                                <button class="discord-button success unban-user" data-id="<?php echo $user->id; ?>" data-username="<?php echo htmlspecialchars($user->username); ?>">
                                    <i class="fas fa-user-check mr-2"></i>
                                    Unban
                                </button>
                                <?php else: ?>
                                <button class="discord-button danger ban-user" data-id="<?php echo $user->id; ?>" data-username="<?php echo htmlspecialchars($user->username); ?>">
                                    <i class="fas fa-ban mr-2"></i>
                                    Ban
                                </button>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div class="flex justify-between items-center mt-6">
                    <div>
                        <span class="text-sm text-discord-lighter">Showing <span id="user-showing-count"><?php echo count($users); ?></span> of <span id="user-total-count"><?php echo $stats['users']['total']; ?></span> users</span>
                    </div>
                    <div class="flex space-x-2">
                        <button id="user-prev-page" class="discord-button bg-discord-dark disabled:opacity-50">
                            <i class="fas fa-chevron-left mr-2"></i>
                            Previous
                        </button>
                        <button id="user-next-page" class="discord-button bg-discord-dark disabled:opacity-50">
                            <i class="fas fa-chevron-right mr-2"></i>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="servers-section" class="admin-section hidden p-10">
            <div class="discord-header">
                <div>
                    <h1 class="discord-header-title">Server Management</h1>
                    <p class="text-discord-lighter">View and manage all servers</p>
                </div>
            </div>
            
            <div class="bg-discord-darker rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center">
                        <h3 class="text-lg font-medium">Servers</h3>
                    </div>
                    <div class="server-search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" id="server-search" placeholder="Search servers..." class="server-search-input">
                    </div>
                </div>
                
                <div id="servers-table-body"></div>
                
                <div class="flex justify-between items-center mt-6">
                    <div>
                        <span class="text-sm text-discord-lighter">Showing <span id="server-showing-count">0</span> of <span id="server-total-count">0</span> servers</span>
                    </div>
                    <div class="flex space-x-2">
                        <button id="server-prev-page" class="discord-button bg-discord-dark disabled:opacity-50">
                            <i class="fas fa-chevron-left mr-2"></i>
                            Previous
                        </button>
                        <button id="server-next-page" class="discord-button bg-discord-dark disabled:opacity-50">
                            <i class="fas fa-chevron-right mr-2"></i>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="nitro-section" class="admin-section hidden p-10">
            <div class="mb-8">
                <h1 class="text-2xl font-bold mb-2">Nitro Code Management</h1>
                <p class="text-discord-lighter">Generate and manage nitro subscription codes</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-discord-darker rounded-lg p-6">
                    <h3 class="text-lg font-medium mb-4">Generate New Code</h3>
                    <form id="generate-nitro-form" class="nitro-form">
                        <div class="mb-4">
                            <label for="user_search" class="block text-sm font-medium text-gray-300 mb-1">Assign to User (Optional)</label>
                            <div class="relative">
                                <input 
                                    type="text" 
                                    id="user_search" 
                                    placeholder="Search for user or leave empty for unassigned"
                                    class="w-full bg-discord-dark border border-discord-dark rounded-md p-2.5 text-white"
                                    autocomplete="off"
                                >
                                <input type="hidden" id="user_id" name="user_id">
                                <div id="user-search-results" class="absolute z-10 bg-discord-dark w-full max-h-60 overflow-y-auto rounded-md shadow-lg hidden">
                                    <div class="p-2 text-sm text-gray-400">Type to search users...</div>
                                </div>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">Search by username or email</div>
                            <div class="flex items-center mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                <i class="fas fa-info-circle text-blue-400 mr-2"></i>
                                <span class="text-xs text-blue-300">Users with existing Nitro will appear disabled and cannot be selected</span>
                            </div>
                        </div>
                        <button type="submit" class="bg-discord-blue hover:bg-discord-blue-dark text-white rounded-md px-4 py-2 w-full">
                            Generate Code
                        </button>
                    </form>
                </div>
                
                <!-- Nitro Stats Card -->
                <div class="bg-discord-darker rounded-lg p-6">
                    <h3 class="text-lg font-medium mb-4">Nitro Statistics</h3>
                    <div class="flex flex-col">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-discord-lighter">Active Codes</span>
                            <span class="text-xl font-bold" id="active-nitro-count">0</span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-discord-lighter">Used Codes</span>
                            <span class="text-yellow-400" id="used-nitro-count">0</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-discord-lighter">Total Codes</span>
                            <span class="text-blue-400" id="total-nitro-count">0</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-discord-darker rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium">Nitro Codes</h3>
                    <input type="text" id="nitro-search" placeholder="Search codes..." class="bg-discord-dark border-none rounded px-4 py-2 text-sm">
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-discord-lighter border-b border-discord-dark">
                                <th class="pb-3 font-medium">ID</th>
                                <th class="pb-3 font-medium">Code</th>
                                <th class="pb-3 font-medium">User</th>
                                <th class="pb-3 font-medium">Status</th>
                                <th class="pb-3 font-medium">Created</th>
                                <th class="pb-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="nitro-table-body">
                        </tbody>
                    </table>
                </div>
                
                <div class="flex justify-between items-center mt-4">
                    <div>
                        <span class="text-sm text-discord-lighter">Showing <span id="nitro-showing-count">0</span> of <span id="nitro-total-count">0</span> codes</span>
                    </div>
                    <div class="flex space-x-2">
                        <button id="nitro-prev-page" class="discord-button bg-discord-dark disabled:opacity-50">
                            <i class="fas fa-chevron-left mr-2"></i>
                            Previous
                        </button>
                        <button id="nitro-next-page" class="discord-button bg-discord-dark disabled:opacity-50">
                            <i class="fas fa-chevron-right mr-2"></i>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>



<!-- Discord-style confirmation modal -->
<div id="confirm-modal" class="hidden fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-discord-darker rounded-md w-full max-w-md p-6 relative z-10">
                    <div class="flex justify-between items-center mb-4">
                <h3 id="confirm-title" class="text-xl font-bold text-white">Confirm Action</h3>
                <button id="close-confirm-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        <div class="mb-6">
            <p id="confirm-message" class="text-discord-lighter">Are you sure you want to perform this action?</p>
        </div>
        <div class="flex justify-end space-x-3">
            <button id="cancel-confirm" class="px-4 py-2 bg-discord-dark-secondary hover:bg-discord-dark-hover text-white rounded-md transition-colors">
                Cancel
            </button>
            <button id="confirm-action" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
                Confirm
            </button>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
echo '<script src="' . asset('/js/api/user-admin-api.js') . '?v=' . time() . '"></script>';
echo '<script src="' . asset('/js/api/server-api.js') . '?v=' . time() . '" type="module"></script>';
echo '<script src="' . asset('/js/api/nitro-api.js') . '?v=' . time() . '" type="module"></script>';

require_once dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

