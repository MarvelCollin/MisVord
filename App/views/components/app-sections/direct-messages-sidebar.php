<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';

$friendController = new FriendController();
$friendData = $friendController->getUserFriends();

$currentUser = $friendData['currentUser'];
$friends = $friendData['friends'];
$onlineFriends = $friendData['onlineFriends'];

$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$tooltipPath = dirname(dirname(__DIR__)) . '/components/common/tooltip.php';
if (file_exists($tooltipPath)) {
    require_once $tooltipPath;
}
?>

<div class="w-60 bg-discord-dark flex flex-col">

    <div class="p-3">
        <div class="w-full bg-discord-darker rounded px-2 py-1.5 flex items-center">
            <input type="text" placeholder="Find or start a conve..." class="w-full bg-transparent border-0 text-sm text-discord-lighter focus:outline-none">
        </div>
    </div>

    <div class="px-2 mb-2">

        <div class="flex items-center p-2 rounded hover:bg-discord-light text-white cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                <i class="fas fa-user-friends"></i>
            </div>
            <span class="font-medium">Friends</span>
        </div>

        <div class="flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1 relative">
            <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                <i class="fas fa-gift"></i>
            </div>
            <span class="font-medium">Nitro</span>
            <span class="ml-auto text-xs bg-discord-blurple text-white px-1.5 py-0.5 rounded-md">1 WEEK FREE</span>
        </div>
    </div>

    <div class="px-4 mt-1 flex items-center justify-between">
        <h3 class="uppercase text-discord-lighter font-semibold text-xs tracking-wider">Direct Messages</h3>
        <button class="text-discord-lighter hover:text-white text-lg">
            <i class="fas fa-plus"></i>
        </button>
    </div>

    <div class="px-2 mt-1 flex-grow overflow-y-auto">
        <?php if (empty($friends)): ?>
            <div class="text-discord-lighter text-xs p-2">
                No friends to message yet. Add some friends!
            </div>
        <?php else: ?>
            <?php foreach ($friends as $index => $friend): ?>
                <?php 
                $statusColor = 'bg-gray-500'; 
                if ($friend['status'] === 'online') {
                    $statusColor = 'bg-discord-green';
                } elseif ($friend['status'] === 'away') {
                    $statusColor = 'bg-discord-yellow';
                } elseif ($friend['status'] === 'dnd') {
                    $statusColor = 'bg-discord-red';
                }

                $specialLabel = null;
                if ($index === 1) {
                    $specialLabel = '<span class="ml-auto flex items-center text-xs bg-discord-darker px-1.5 py-0.5 rounded text-blue-400 font-medium"><i class="fas fa-code mr-1"></i> CODE</span>';
                } elseif ($index === 2) {
                    $specialLabel = '<span class="ml-auto flex items-center text-xs bg-discord-darker px-1.5 py-0.5 rounded text-purple-400 font-medium">DF</span>';
                }
                ?>
                <div class="flex items-center p-1.5 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer group">
                    <div class="relative mr-3">
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="<?php echo isset($friend['avatar_url']) ? htmlspecialchars($friend['avatar_url']) : 'https://ui-avatars.com/api/?name=' . urlencode($friend['username'] ?? 'U') . '&background=random'; ?>" 
                                alt="Avatar" class="w-full h-full object-cover">
                        </div>
                        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?>"></span>
                    </div>
                    <span class="font-medium truncate"><?php echo htmlspecialchars($friend['username']); ?></span>

                    <?php if ($specialLabel): ?>
                        <?php echo $specialLabel; ?>
                    <?php else: ?>

                    <div class="ml-auto hidden group-hover:flex items-center space-x-1">
                        <button class="text-discord-lighter hover:text-white p-1 rounded hover:bg-discord-background">
                            <i class="fas fa-phone-alt text-xs"></i>
                        </button>
                        <button class="text-discord-lighter hover:text-white p-1 rounded hover:bg-discord-background">
                            <i class="fas fa-video text-xs"></i>
                        </button>
                    </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>