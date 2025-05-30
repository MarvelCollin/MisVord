<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';

// Get current user data if not already provided
if (!isset($currentUser) || empty($currentUser)) {
    $friendController = new FriendController();
    $friendData = $friendController->getUserFriends();
    $currentUser = $friendData['currentUser'];
}

// Get tooltip helper if available
$tooltipPath = dirname(__DIR__) . '/common/tooltip.php';
$hasTooltip = file_exists($tooltipPath);
if ($hasTooltip) {
    require_once $tooltipPath;
}
?>

<div class="p-2 bg-discord-darker flex items-center mt-auto">
    <div class="relative">
        <?php if ($hasTooltip): ?>
            <?php
                $userAvatarContent = '<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2">
                    <img src="' . (isset($currentUser['avatar_url']) ? htmlspecialchars($currentUser['avatar_url']) : 'https://ui-avatars.com/api/?name=' . urlencode($currentUser['username'] ?? $_SESSION['username'] ?? 'U') . '&background=random') . '" 
                         alt="Avatar" class="w-full h-full object-cover">
                </div>';
                
                echo tooltip($userAvatarContent, htmlspecialchars($currentUser['username'] ?? $_SESSION['username'] ?? 'User'), 'top');
            ?>
        <?php else: ?>
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2">
                <img src="<?php echo isset($currentUser['avatar_url']) ? htmlspecialchars($currentUser['avatar_url']) : 'https://ui-avatars.com/api/?name=' . urlencode($currentUser['username'] ?? $_SESSION['username'] ?? 'U') . '&background=random'; ?>" 
                     alt="Avatar" class="w-full h-full object-cover">
            </div>
        <?php endif; ?>
        
        <?php 
        $statusColor = 'bg-gray-500'; // offline by default
        if (isset($currentUser['status'])) {
            if ($currentUser['status'] === 'online') {
                $statusColor = 'bg-discord-green';
            } elseif ($currentUser['status'] === 'away') {
                $statusColor = 'bg-discord-yellow';
            } elseif ($currentUser['status'] === 'dnd') {
                $statusColor = 'bg-discord-red';
            }
        } else {
            // If no status is set, default to online
            $statusColor = 'bg-discord-green';
        }
        ?>
        <span class="absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker <?php echo $statusColor; ?>"></span>
    </div>
    
    <div class="flex-1">
        <div class="text-sm text-white font-medium truncate"><?php echo htmlspecialchars($currentUser['username'] ?? $_SESSION['username'] ?? 'User'); ?></div>
        <div class="text-xs text-discord-lighter truncate">#<?php echo htmlspecialchars($_SESSION['tag'] ?? rand(1000, 9999)); ?></div>
    </div>
    
    <div class="flex space-x-1">
        <?php if ($hasTooltip): ?>
            <?php
                $micContent = '<button class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-microphone"></i>
                </button>';
                echo tooltip($micContent, 'Mute', 'top');
                
                $headphonesContent = '<button class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-headphones"></i>
                </button>';
                echo tooltip($headphonesContent, 'Deafen', 'top');
                
                $settingsContent = '<button class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-cog"></i>
                </button>';
                echo tooltip($settingsContent, 'User Settings', 'top');
            ?>
        <?php else: ?>
            <button class="text-discord-lighter hover:text-white p-1" title="Mute">
                <i class="fas fa-microphone"></i>
            </button>
            <button class="text-discord-lighter hover:text-white p-1" title="Deafen">
                <i class="fas fa-headphones"></i>
            </button>
            <button class="text-discord-lighter hover:text-white p-1" title="User Settings">
                <i class="fas fa-cog"></i>
            </button>
        <?php endif; ?>
    </div>
</div> 