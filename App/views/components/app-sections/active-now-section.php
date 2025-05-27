<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Get online friends from database
$currentUserId = $_SESSION['user_id'] ?? 0;
$onlineFriends = [];

try {
    $host = 'localhost';
    $port = 1003;
    $dbname = 'misvord';
    $username = 'root';
    $password = 'password';
    $charset = 'utf8mb4';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Get all friends who are online
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id2 
        WHERE fl.user_id = ? AND fl.status = 'accepted' AND u.status = 'online'
        UNION
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id 
        WHERE fl.user_id2 = ? AND fl.status = 'accepted' AND u.status = 'online'
    ");
    $stmt->execute([$currentUserId, $currentUserId]);
    $onlineFriends = $stmt->fetchAll();
    
} catch (PDOException $e) {
    // Fallback to empty arrays if database connection fails
    $onlineFriends = [];
}
?>

<!-- Right sidebar for active now friends -->
<div class="w-60 bg-[#2F3136] flex-shrink-0 p-4 border-l border-[#202225] hidden lg:block">
    <div class="flex justify-between items-center mb-3">
        <h2 class="font-semibold text-lg text-white">Active Now</h2>
    </div>
    
    <!-- Search bar -->
    <div class="relative mb-3">
        <?php 
        // Use the search bar component
        $placeholder = "Search";
        $iconPosition = "right";
        $bgColor = "bg-[#202225]";
        include dirname(__DIR__) . '/app-sections/search-bar.php';
        ?>
    </div>
    
    <!-- Active Friend Cards -->
    <div class="space-y-3">
        <?php if (empty($onlineFriends)): ?>
        <div class="bg-[#2B2D31] rounded-lg p-4 text-center">
            <p class="text-gray-300 text-sm mb-1">It's quiet for now...</p>
            <p class="text-gray-500 text-xs">When friends start an activity, like playing a game or hanging out on voice, we'll show it here!</p>
        </div>
        <?php else: ?>
            <?php foreach ($onlineFriends as $friend): ?>
                <!-- Card -->
                <div class="bg-[#2B2D31] rounded-lg p-3">
                    <div class="flex items-center mb-2">
                        <?php
                        // Use the avatar component
                        $user = $friend;
                        $size = 8;
                        $showStatus = true;
                        $customClasses = "mr-2";
                        include dirname(__DIR__) . '/app-sections/user-avatar.php';
                        ?>
                        <div>
                            <div class="font-medium text-white"><?php echo htmlspecialchars($friend['username']); ?></div>
                            <div class="text-xs text-gray-400">Online</div>
                        </div>
                    </div>
                    <div class="flex items-center text-sm bg-[#232428] rounded p-1.5">
                        <i class="fa-solid fa-circle text-[8px] text-[#43B581] mr-1.5"></i>
                        <span class="text-gray-300">Online</span>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div> 