<?php
if (!isset($currentServer) || empty($currentServer)) {
    return;
}

$currentServerId = $currentServer->id ?? 0;
$members = $GLOBALS['serverMembers'] ?? [];
$roles = $GLOBALS['serverRoles'] ?? [];

$membersById = [];
foreach ($members as $member) {
    $roleId = $member['role_id'] ?? 'default';
    if (!isset($membersById[$roleId])) {
        $membersById[$roleId] = [];
    }
    $membersById[$roleId][] = $member;
}

$onlineCount = array_reduce($members, function($count, $member) {
    return $count + ($member['status'] !== 'offline' ? 1 : 0);
}, 0);
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4">
        <input type="text" placeholder="Search" class="w-full bg-black bg-opacity-30 text-white text-sm rounded px-2 py-1 focus:outline-none">
    </div>
    
    <div class="flex-1 overflow-y-auto p-2" data-lazyload="participant-list">
        <?php if (!empty($roles)): ?>
            <?php 
            $hasDefaultRole = false;
            foreach ($roles as $role): 
                if ($role['name'] === '@everyone') {
                    $hasDefaultRole = true;
                    continue;
                }
                
                $roleMembers = $membersById[$role['id']] ?? [];
                if (empty($roleMembers)) continue;
                
                $onlineRoleMembers = array_filter($roleMembers, function($m) {
                    return $m['status'] !== 'offline';
                });
                
                if (empty($onlineRoleMembers)) continue;
            ?>
                <div class="mb-2">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase px-2 py-1">
                        <?php echo htmlspecialchars($role['name']); ?> — <?php echo count($onlineRoleMembers); ?>
                    </h3>
                    <div class="space-y-0.5">
                        <?php foreach ($onlineRoleMembers as $member):
                            $statusColor = 'bg-gray-500';
                            
                            if ($member['status'] === 'online') {
                                $statusColor = 'bg-discord-green';
                            } elseif ($member['status'] === 'away') {
                                $statusColor = 'bg-discord-yellow';
                            } elseif ($member['status'] === 'dnd') {
                                $statusColor = 'bg-discord-red';
                            }
                        ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo isset($member['avatar']) ? htmlspecialchars($member['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($member['username'] ?? 'U') . '&background=random'; ?>" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?>"></span>
                                </div>
                                <span class="text-gray-300 text-sm truncate"><?php echo htmlspecialchars($member['username']); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
            
            <?php
            $defaultMembers = [];
            if ($hasDefaultRole) {
                $defaultMembers = array_filter($members, function($member) use ($roles) {
                    foreach ($roles as $role) {
                        if ($role['name'] !== '@everyone' && isset($member['role_id']) && $member['role_id'] === $role['id']) {
                            return false;
                        }
                    }
                    return true;
                });
                
                $onlineDefaultMembers = array_filter($defaultMembers, function($m) {
                    return $m['status'] !== 'offline';
                });
                
                if (!empty($onlineDefaultMembers)):
            ?>
                <div class="mb-2">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase px-2 py-1">
                        Online — <?php echo count($onlineDefaultMembers); ?>
                    </h3>
                    <div class="space-y-0.5">
                        <?php foreach ($onlineDefaultMembers as $member):
                            $statusColor = 'bg-discord-green';
                            
                            if ($member['status'] === 'away') {
                                $statusColor = 'bg-discord-yellow';
                            } elseif ($member['status'] === 'dnd') {
                                $statusColor = 'bg-discord-red';
                            }
                        ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo isset($member['avatar']) ? htmlspecialchars($member['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($member['username'] ?? 'U') . '&background=random'; ?>" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?>"></span>
                                </div>
                                <span class="text-gray-300 text-sm truncate"><?php echo htmlspecialchars($member['username']); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php 
                endif;
                
                $offlineMembers = array_filter($members, function($m) {
                    return $m['status'] === 'offline';
                });
                
                if (!empty($offlineMembers)):
            ?>
                <div>
                    <h3 class="text-xs font-semibold text-gray-400 uppercase px-2 py-1">
                        Offline — <?php echo count($offlineMembers); ?>
                    </h3>
                    <div class="space-y-0.5">
                        <?php foreach ($offlineMembers as $member): ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo isset($member['avatar']) ? htmlspecialchars($member['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($member['username'] ?? 'U') . '&background=random'; ?>" 
                                             alt="Avatar" class="w-full h-full object-cover opacity-70">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500"></span>
                                </div>
                                <span class="text-gray-500 text-sm truncate"><?php echo htmlspecialchars($member['username']); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php 
                endif;
            }
            ?>
            
        <?php else: ?>
            <div class="px-2">
                <h3 class="text-xs font-semibold text-gray-400 uppercase py-1">
                    Online — <?php echo $onlineCount; ?>
                </h3>
                <div class="space-y-0.5">
                    <?php 
                    $onlineMembers = array_filter($members, function($m) {
                        return $m['status'] !== 'offline';
                    });
                    
                    foreach ($onlineMembers as $member):
                        $statusColor = 'bg-discord-green';
                        
                        if ($member['status'] === 'away') {
                            $statusColor = 'bg-discord-yellow';
                        } elseif ($member['status'] === 'dnd') {
                            $statusColor = 'bg-discord-red';
                        }
                    ?>
                        <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                            <div class="relative mr-2">
                                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="<?php echo isset($member['avatar']) ? htmlspecialchars($member['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($member['username'] ?? 'U') . '&background=random'; ?>" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?>"></span>
                            </div>
                            <span class="text-gray-300 text-sm truncate"><?php echo htmlspecialchars($member['username']); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <?php 
                $offlineMembers = array_filter($members, function($m) {
                    return $m['status'] === 'offline';
                });
                
                if (!empty($offlineMembers)):
                ?>
                    <h3 class="text-xs font-semibold text-gray-400 uppercase py-1 mt-4">
                        Offline — <?php echo count($offlineMembers); ?>
                    </h3>
                    <div class="space-y-0.5">
                        <?php foreach ($offlineMembers as $member): ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo isset($member['avatar']) ? htmlspecialchars($member['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($member['username'] ?? 'U') . '&background=random'; ?>" 
                                             alt="Avatar" class="w-full h-full object-cover opacity-70">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500"></span>
                                </div>
                                <span class="text-gray-500 text-sm truncate"><?php echo htmlspecialchars($member['username']); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const participantContainer = document.querySelector('[data-lazyload="participant-list"]');
    if (participantContainer) {
        const loadDelay = Math.floor(Math.random() * 400) + 600;
        
        setTimeout(function() {
            if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
                const isEmpty = <?php echo empty($members) ? 'true' : 'false'; ?>;
                window.LazyLoader.triggerDataLoaded('participant-list', isEmpty);
                console.log('Participant list loaded after ' + loadDelay + 'ms');
            } else {
                console.warn('LazyLoader.triggerDataLoaded not available yet');
            }
        }, loadDelay);
    }
});
</script>
