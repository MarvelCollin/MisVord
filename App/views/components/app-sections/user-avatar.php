<?php
$user = $user ?? [
    'id' => 0,
    'username' => 'User',
    'avatar_url' => '',
    'status' => 'offline'
];

$size = $size ?? 8;
$showStatus = $showStatus ?? true;
$statusSize = $statusSize ?? 3;
$borderSize = $borderSize ?? 2;
$customClasses = $customClasses ?? '';

$username = $user['username'] ?? 'User';
$firstLetter = mb_substr($username, 0, 1);

$statusClass = 'bg-gray-500';
if ($user['status'] === 'online') {
    $statusClass = 'bg-[#43B581]';
} elseif ($user['status'] === 'away') {
    $statusClass = 'bg-[#FAA61A]';
} elseif ($user['status'] === 'dnd') {
    $statusClass = 'bg-[#F04747]';
}

function getAvatarColorClass($username) {
    $colors = [
        'bg-[#5865F2]',
        'bg-[#57F287]',
        'bg-[#FEE75C]',
        'bg-[#EB459E]',
        'bg-[#ED4245]',
    ];
    
    if (strtolower($username) === 'koline') {
        return $colors[0];
    }
    else if (strtolower($username) === 'aldric') {
        return $colors[1];
    }
    else if (strtolower($username) === 'chann') {
        return $colors[2];
    }
    else if (strtolower($username) === 'faust') {
        return $colors[3];
    }
    
    $hash = crc32($username);
    $index = abs($hash) % count($colors);
    return $colors[$index];
}

$bgColor = getAvatarColorClass($username);

$userColors = [
    'aldric' => 'bg-purple-500',
    'chann' => 'bg-red-500',
    'faust' => 'bg-yellow-500'
];

$lowerUsername = strtolower($username);
if (isset($userColors[$lowerUsername])) {
    $bgColor = $userColors[$lowerUsername];
}
?>

<div class="relative <?php echo $customClasses; ?>">
    <?php if (!empty($user['avatar_url'])): ?>
        <img src="<?php echo htmlspecialchars($user['avatar_url']); ?>" 
             alt="<?php echo htmlspecialchars($username); ?>'s Avatar" 
             class="w-<?php echo $size; ?> h-<?php echo $size; ?> rounded-full object-cover">
    <?php else: ?>
        <div class="w-<?php echo $size; ?> h-<?php echo $size; ?> rounded-full <?php echo $bgColor; ?> flex items-center justify-center text-white">
            <?php echo htmlspecialchars(strtoupper($firstLetter)); ?>
        </div>
    <?php endif; ?>
    
    <?php if ($showStatus): ?>
        <div class="absolute bottom-0 right-0 w-<?php echo $statusSize; ?> h-<?php echo $statusSize; ?> <?php echo $statusClass; ?> rounded-full border-<?php echo $borderSize; ?> border-[#292B2F]"></div>
    <?php endif; ?>
</div> 