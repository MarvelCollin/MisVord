<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';

if (!isset($currentUser) || empty($currentUser)) {
    $friendController = new FriendController();
    $friendData = $friendController->getUserFriends();
    $currentUser = $friendData['currentUser'];
}

$tooltipPath = dirname(__DIR__) . '/common/tooltip.php';
$hasTooltip = file_exists($tooltipPath);
if ($hasTooltip) {
    require_once $tooltipPath;
}
?>

<div class="p-2 bg-discord-darker flex items-center mt-auto">
    <div class="relative">        <?php if ($hasTooltip): ?>
            <?php
                $userAvatar = ($currentUser && isset($currentUser->avatar_url) && $currentUser->avatar_url) ? $currentUser->avatar_url : asset('/common/main-logo.png');
                $userName = ($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User');
                $userDiscriminator = ($currentUser && isset($currentUser->discriminator)) ? $currentUser->discriminator : ($_SESSION['discriminator'] ?? '0000');
                
                $userAvatarContent = '<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2">
                    <img src="' . htmlspecialchars($userAvatar) . '" 
                         alt="Avatar" class="w-full h-full object-cover">
                </div>';
                
                echo tooltip($userAvatarContent, htmlspecialchars($userName) . '#' . htmlspecialchars($userDiscriminator), 'top');
            ?>        <?php else: ?>
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2">
                <img src="<?php echo ($currentUser && isset($currentUser->avatar_url) && $currentUser->avatar_url) ? htmlspecialchars($currentUser->avatar_url) : asset('/common/main-logo.png'); ?>" 
                     alt="Avatar" class="w-full h-full object-cover">
            </div>
        <?php endif; ?>
          <?php 
        $statusColor = 'bg-gray-500';
        if ($currentUser && isset($currentUser->status)) {
            if ($currentUser->status === 'online') {
                $statusColor = 'bg-discord-green';
            } elseif ($currentUser->status === 'away') {
                $statusColor = 'bg-discord-yellow';
            } elseif ($currentUser->status === 'dnd') {
                $statusColor = 'bg-discord-red';
            }
        } else {
            $statusColor = 'bg-discord-green';
        }
        ?>
        <span class="absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker <?php echo $statusColor; ?>"></span>
    </div>
    
    <div class="flex-1">
        <div class="text-sm text-white font-medium truncate"><?php echo htmlspecialchars(($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User')); ?></div>
        <div class="text-xs text-discord-lighter truncate">#<?php echo htmlspecialchars($_SESSION['discriminator'] ?? rand(1000, 9999)); ?></div>
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
                
                $settingsContent = '<a href="/settings/user" class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-cog"></i>
                </a>';
                echo tooltip($settingsContent, 'User Settings', 'top');
            ?>
        <?php else: ?>
            <button class="text-discord-lighter hover:text-white p-1" title="Mute">
                <i class="fas fa-microphone"></i>
            </button>
            <button class="text-discord-lighter hover:text-white p-1" title="Deafen">
                <i class="fas fa-headphones"></i>
            </button>
            <a href="/settings/user" class="text-discord-lighter hover:text-white p-1" title="User Settings">
                <i class="fas fa-cog"></i>
            </a>
        <?php endif; ?>
    </div>
</div> 