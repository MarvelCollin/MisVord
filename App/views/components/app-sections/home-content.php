<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Get current user and friends from database
$currentUserId = $_SESSION['user_id'] ?? 0;
$friends = [];
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
    
    // Get current user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$currentUserId]);
    $currentUser = $stmt->fetch();
    
    // Get all friends
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id2 
        WHERE fl.user_id = ? AND fl.status = 'accepted'
        UNION
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id 
        WHERE fl.user_id2 = ? AND fl.status = 'accepted'
    ");
    $stmt->execute([$currentUserId, $currentUserId]);
    $friends = $stmt->fetchAll();
    
    // Filter online friends
    $onlineFriends = array_filter($friends, function($friend) {
        return $friend['status'] === 'online';
    });
    
} catch (PDOException $e) {
    // Fallback to empty arrays if database connection fails
    $currentUser = ['id' => $currentUserId, 'username' => $_SESSION['username'] ?? 'Unknown'];
    $friends = [];
    $onlineFriends = [];
}
?>

<!-- Friends Content -->
<div class="flex-1 p-4 overflow-y-auto bg-[#36393F]">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-gray-400 font-bold text-xs uppercase">Online — <?php echo count($onlineFriends); ?></h2>
        <div class="relative w-60">
            <?php 
            // Use the search bar component
            $placeholder = "Search";
            $iconPosition = "right";
            $bgColor = "bg-[#202225]";
            include dirname(__DIR__) . '/app-sections/search-bar.php';
            ?>
        </div>
    </div>

    <!-- Friend List -->
    <div class="space-y-1">
        <?php if (empty($friends)): ?>
        <div class="p-4 bg-[#2F3136] rounded text-center">
            <div class="mb-2 text-gray-400">
                <i class="fa-solid fa-user-group h-8 w-8"></i>
            </div>
            <p class="text-gray-300 mb-1">No friends found</p>
            <p class="text-gray-500 text-sm">Add some friends to get started!</p>
        </div>
        <?php else: ?>
            <?php foreach ($friends as $friend): ?>
                <?php 
                // Generate status text
                $statusText = 'Offline';
                if ($friend['status'] === 'online') {
                    $statusText = 'Online';
                } elseif ($friend['status'] === 'away') {
                    $statusText = 'Away';
                } elseif ($friend['status'] === 'dnd') {
                    $statusText = 'Do Not Disturb';
                }
                ?>
                <!-- Friend Item -->
                <div class="flex justify-between items-center p-2 rounded hover:bg-[#32353B]">
                    <div class="flex items-center">
                        <?php
                        // Use the avatar component
                        $user = $friend;
                        $size = 8;
                        $showStatus = true;
                        $customClasses = "mr-3";
                        include dirname(__DIR__) . '/app-sections/user-avatar.php';
                        ?>
                        <div>
                            <div class="font-medium text-white"><?php echo htmlspecialchars($friend['username']); ?></div>
                            <div class="text-xs text-gray-400"><?php echo htmlspecialchars($statusText); ?></div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-[#36393F] rounded-full">
                            <i class="fa-solid fa-message h-5 w-5"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-[#36393F] rounded-full">
                            <i class="fa-solid fa-ellipsis-vertical h-5 w-5"></i>
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div> 