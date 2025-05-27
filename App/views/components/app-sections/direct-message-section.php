<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Get current user ID from session
$currentUserId = $_SESSION['user_id'] ?? 0;

// Connect to database directly
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
    
    if (!$currentUser) {
        // Fallback to session data if user not found in database
        $currentUser = [
            'id' => $currentUserId,
            'username' => $_SESSION['username'] ?? 'Unknown',
            'status' => 'online'
        ];
    }

    // Get direct message users (friends)
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id2 
        WHERE fl.user_id = ? AND fl.status = 'accepted'
        UNION
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id 
        WHERE fl.user_id2 = ? AND fl.status = 'accepted'
        ORDER BY u.username ASC
    ");
    $stmt->execute([$currentUserId, $currentUserId]);
    $dmUsers = $stmt->fetchAll();

} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Database error in direct-message-section.php: " . $e->getMessage());
    
    // Fallback to sample data if database connection fails
    $currentUser = ['id' => $currentUserId, 'username' => $_SESSION['username'] ?? 'Unknown', 'status' => 'online'];
    $dmUsers = [];
}

// The direct message section HTML starts here
?>

<!-- Direct Message Section -->
<div class="channel-section w-60 bg-[#2F3136] flex flex-col">
    <!-- DM Header -->
    <div class="p-4 border-b border-[#202225]">
        <?php 
        // Use the search bar component
        $placeholder = "Find or start a conversation...";
        $iconPosition = "left";
        $bgColor = "bg-[#202225]";
        include dirname(__DIR__) . '/app-sections/search-bar.php';
        ?>
    </div>
    
    <!-- DM Channels Area with Scrolling -->
    <div class="flex-1 overflow-y-auto">
        <!-- Navigation Buttons -->
        <div class="px-2 py-3">
            <button class="flex items-center w-full px-2 py-1 text-gray-300 hover:text-white hover:bg-[#32353B] rounded">
                <i class="fa-solid fa-user-group text-[18px] w-5 text-center mr-2"></i>
                <span>Friends</span>
            </button>
        </div>

        <div class="px-2 pb-2">
            <button class="flex items-center w-full px-2 py-1 text-gray-300 hover:text-white hover:bg-[#32353B] rounded">
                <i class="fa-solid fa-bolt text-[18px] w-5 text-center mr-2"></i>
                <span>Premium</span>
            </button>
        </div>

        <div class="px-2 pb-3 border-b border-[#202225]">
            <button class="flex items-center w-full px-2 py-1 text-gray-300 hover:text-white hover:bg-[#32353B] rounded">
                <i class="fa-solid fa-bag-shopping text-[18px] w-5 text-center mr-2"></i>
                <span>Shop</span>
            </button>
        </div>
        
        <!-- Direct Messages Header -->
        <div class="px-2 py-2">
            <div class="flex justify-between items-center px-2 text-xs text-gray-400 font-semibold mb-1">
                <span>DIRECT MESSAGES</span>
                <button class="hover:text-gray-200 w-5 h-5 flex items-center justify-center">
                    <i class="fa-solid fa-plus text-[14px]"></i>
                </button>
            </div>
            
            <!-- DM Items -->
            <div class="space-y-1">
                <?php if (empty($dmUsers)): ?>
                <div class="px-2 py-2 text-sm text-gray-400">
                    No direct messages yet
                </div>
                <?php else: ?>
                    <?php foreach ($dmUsers as $user): ?>
                    <div class="flex items-center px-2 py-1 rounded hover:bg-[#32353B] cursor-pointer">
                        <?php 
                        // Use the avatar component with specific settings
                        $size = 8;
                        $showStatus = true;
                        $customClasses = "mr-3";
                        include dirname(__DIR__) . '/app-sections/user-avatar.php';
                        ?>
                        <span class="text-gray-300 truncate"><?php echo htmlspecialchars($user['username']); ?></span>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- User Profile Section - Include the user-profile-bar component -->
    <?php 
    $userData = $currentUser;
    include dirname(__DIR__) . '/app-sections/user-profile-bar.php';
    ?>
</div> 