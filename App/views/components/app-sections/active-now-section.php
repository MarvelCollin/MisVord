<?php
$currentUserId = $_SESSION['user_id'] ?? 0;
$activeUsers = [];

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
    
    $stmt = $pdo->prepare("
        SELECT u.*, a.* FROM users u 
        JOIN user_activities a ON u.id = a.user_id
        JOIN friend_list fl ON (u.id = fl.user_id2 OR u.id = fl.user_id)
        WHERE (fl.user_id = ? OR fl.user_id2 = ?) 
        AND fl.status = 'accepted'
        AND u.id != ?
        AND u.status = 'online'
        ORDER BY a.start_time DESC
        LIMIT 5
    ");
    $stmt->execute([$currentUserId, $currentUserId, $currentUserId]);
    $activeUsers = $stmt->fetchAll();
    
} catch (PDOException $e) {
    $activeUsers = [];
}
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4">
        <h2 class="font-semibold text-white">Active Now</h2>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4">
        <?php if (empty($activeUsers)): ?>
            <div class="rounded-md bg-discord-background p-4 text-center">
                <h3 class="font-semibold text-white mb-1">It's quiet for now...</h3>
                <p class="text-gray-400 text-sm">When friends start an activity, like playing a game or hanging out on voice, we'll show it here!</p>
            </div>
        <?php else: ?>
            <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Active Now</h3>
            
            <?php foreach ($activeUsers as $user): ?>
                <div class="mb-3 rounded-md bg-discord-background overflow-hidden">
                    <div class="p-3">
                        <div class="flex items-center mb-2">
                            <div class="relative mr-2">
                                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="<?php echo isset($user['avatar']) ? htmlspecialchars($user['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($user['username'] ?? 'U') . '&background=random'; ?>" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-discord-green"></span>
                            </div>
                            <div class="flex-1">
                                <div class="font-medium text-white text-sm"><?php echo htmlspecialchars($user['username']); ?></div>
                            </div>
                        </div>
                        
                        <?php 
                        $activityType = $user['type'] ?? 'playing';
                        $activityName = $user['name'] ?? 'Unknown Activity';
                        $activityImage = $user['image_url'] ?? '';
                        $activityDuration = time() - strtotime($user['start_time'] ?? 'now');
                        $hours = floor($activityDuration / 3600);
                        $minutes = floor(($activityDuration % 3600) / 60);
                        $durationText = '';
                        
                        if ($hours > 0) {
                            $durationText = $hours . 'h ' . $minutes . 'm';
                        } else {
                            $durationText = $minutes . ' minutes';
                        }
                        ?>
                        
                        <div class="flex items-center bg-discord-darker p-2 rounded">
                            <?php if (!empty($activityImage)): ?>
                                <img src="<?php echo htmlspecialchars($activityImage); ?>" alt="<?php echo htmlspecialchars($activityName); ?>" class="w-8 h-8 rounded mr-2">
                            <?php else: ?>
                                <div class="w-8 h-8 rounded bg-discord-dark flex items-center justify-center mr-2">
                                    <i class="fas fa-gamepad text-gray-400"></i>
                                </div>
                            <?php endif; ?>
                            
                            <div class="flex-1">
                                <div class="text-xs text-gray-400"><?php echo htmlspecialchars(ucfirst($activityType)); ?></div>
                                <div class="text-sm text-white font-medium truncate"><?php echo htmlspecialchars($activityName); ?></div>
                                <div class="text-xs text-gray-400">for <?php echo $durationText; ?></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker py-2 px-3 flex">
                        <button class="flex-1 bg-discord-background text-white text-xs py-1 rounded hover:bg-gray-600 font-medium">Join</button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>
