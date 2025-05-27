<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

if (!isset($pdo)) {
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
    } catch (PDOException $e) {
    }
}

$currentUserId = $_SESSION['user_id'] ?? 0;
$currentUser = null;

if (isset($userData) && is_array($userData)) {
    $currentUser = $userData;
} 
else {
    try {
        if (isset($pdo)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$currentUserId]);
            $currentUser = $stmt->fetch();
        }
    } catch (PDOException $e) {
    }
}

if (!$currentUser) {
    $currentUser = [
        'id' => $currentUserId,
        'username' => $_SESSION['username'] ?? 'Unknown',
        'status' => 'online'
    ];
}

$firstLetter = mb_substr($currentUser['username'], 0, 1);

$statusClass = 'bg-gray-500';
if ($currentUser['status'] === 'online') {
    $statusClass = 'bg-green-500';
} elseif ($currentUser['status'] === 'away') {
    $statusClass = 'bg-yellow-500';
} elseif ($currentUser['status'] === 'dnd') {
    $statusClass = 'bg-red-500';
}

$colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500'];
$colorIndex = $currentUser['id'] % count($colors);
$bgColor = $colors[$colorIndex];
?>

<!-- User Profile Bar -->
<div class="user-profile-bar bg-[#292B2F] h-14 px-2 flex items-center border-t border-[#202225]">
    <!-- User avatar and status -->
    <div class="flex-shrink-0">
        <?php
        // Get current user data
        $currentUser = isset($userData) ? $userData : [
            'id' => $_SESSION['user_id'] ?? 0,
            'username' => $_SESSION['username'] ?? 'User',
            'avatar_url' => $_SESSION['avatar_url'] ?? '',
            'status' => 'online'
        ];
        
        // Use the avatar component
        $user = $currentUser;
        $size = 8;
        $showStatus = true;
        $customClasses = "mr-2";
        include dirname(__DIR__) . '/app-sections/user-avatar.php';
        ?>
    </div>
    
    <!-- User info -->
    <div class="flex-1 min-w-0">
        <div class="text-white font-medium truncate"><?php echo htmlspecialchars($currentUser['username']); ?></div>
        <div class="text-xs text-gray-400 truncate">
            <?php 
            // Format status text
            $statusText = 'Online';
            if ($currentUser['status'] === 'away') {
                $statusText = 'Away';
            } elseif ($currentUser['status'] === 'dnd') {
                $statusText = 'Do Not Disturb';
            } elseif ($currentUser['status'] === 'offline') {
                $statusText = 'Offline';
            }
            echo htmlspecialchars($statusText); 
            ?>
        </div>
    </div>
    
    <!-- Action buttons -->
    <div class="flex space-x-1">
        <button id="micToggle" title="Toggle Mute" class="p-2 text-gray-400 hover:text-white">
            <i class="fa-solid fa-microphone h-5 w-5"></i>
        </button>
        <button id="speakerToggle" title="Toggle Sound" class="p-2 text-gray-400 hover:text-white">
            <i class="fa-solid fa-headphones h-5 w-5"></i>
        </button>
        <button id="settingsBtn" title="User Settings" class="p-2 text-gray-400 hover:text-white">
            <i class="fa-solid fa-gear h-5 w-5"></i>
        </button>
    </div>
</div> 