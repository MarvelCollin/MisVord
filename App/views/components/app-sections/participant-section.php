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

function renderMemberSkeleton($count = 1, $isOffline = false) {
    $opacity = $isOffline ? 'opacity-50' : '';
    for ($i = 0; $i < $count; $i++) {
        echo '<div class="flex items-center px-2 py-1 rounded ' . $opacity . '">';
        echo '  <div class="relative mr-2">';
        echo '    <div class="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>';
        echo '    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-600 animate-pulse"></span>';
        echo '  </div>';
        echo '  <div class="h-4 bg-gray-700 rounded w-' . rand(16, 28) . ' animate-pulse"></div>';
        echo '</div>';
    }
}

function renderRoleSkeleton($count = 1) {
    for ($i = 0; $i < $count; $i++) {
        echo '<div class="mb-2">';
        echo '  <div class="flex items-center px-2 py-1">';
        echo '    <div class="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>';
        echo '    <div class="ml-auto h-3 bg-gray-700 rounded w-4 animate-pulse"></div>';
        echo '  </div>';
        renderMemberSkeleton(rand(3, 5));
        echo '</div>';
    }
}
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4">
        <input type="text" placeholder="Search" class="w-full bg-black bg-opacity-30 text-white text-sm rounded px-2 py-1 focus:outline-none">
    </div>
    
    <div class="participant-skeleton flex-1 overflow-y-auto p-2 skeleton-loader">
        <div class="mb-4">
            <div class="h-3 bg-gray-700 rounded w-28 ml-2 mb-3 animate-pulse"></div>
            <?php renderMemberSkeleton(6); ?>
        </div>
        
        <?php renderRoleSkeleton(2); ?>
        
        <div class="mt-4">
            <div class="h-3 bg-gray-700 rounded w-24 ml-2 mb-3 animate-pulse"></div>
            <?php renderMemberSkeleton(4, true); ?>
        </div>
    </div>
    
    <div class="participant-content flex-1 overflow-y-auto p-2 hidden" data-lazyload="participant-list">
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
                            $statusColor = 'bg-discord-green';
                            
                            switch ($member['status']) {
                                case 'appear':
                                    $statusColor = 'bg-discord-green';
                                    break;
                                case 'invisible':
                                    $statusColor = 'bg-gray-500';
                                    break;
                                case 'do_not_disturb':
                                    $statusColor = 'bg-discord-red';
                                    break;
                                case 'offline':
                                    $statusColor = 'bg-[#747f8d]';
                                    break;
                                case 'banned':
                                    $statusColor = 'bg-black';
                                    break;
                                default:
                                    $statusColor = 'bg-discord-green';
                            }
                        ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo getUserAvatar($member['avatar'] ?? '', $member['username'] ?? 'User'); ?>" 
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
                            $statusColor = 'bg-gray-500';
                            
                            switch ($member['status']) {
                                case 'appear':
                                    $statusColor = 'bg-discord-green';
                                    break;
                                case 'invisible':
                                    $statusColor = 'bg-gray-500';
                                    break;
                                case 'do_not_disturb':
                                    $statusColor = 'bg-discord-red';
                                    break;
                                case 'offline':
                                    $statusColor = 'bg-[#747f8d]';
                                    break;
                                case 'banned':
                                    $statusColor = 'bg-black';
                                    break;
                                default:
                                    $statusColor = 'bg-discord-green';
                            }
                        ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo getUserAvatar($member['avatar'] ?? '', $member['username'] ?? 'User'); ?>" 
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
                                        <img src="<?php echo getUserAvatar($member['avatar'] ?? '', $member['username'] ?? 'User'); ?>" 
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
                        $statusColor = 'bg-gray-500';
                        
                        switch ($member['status']) {
                            case 'appear':
                                $statusColor = 'bg-discord-green';
                                break;
                            case 'invisible':
                                $statusColor = 'bg-gray-500';
                                break;
                            case 'do_not_disturb':
                                $statusColor = 'bg-discord-red';
                                break;
                            case 'offline':
                                $statusColor = 'bg-[#747f8d]';
                                break;
                            case 'banned':
                                $statusColor = 'bg-black';
                                break;
                            default:
                                $statusColor = 'bg-discord-green';
                        }
                    ?>
                        <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group">
                            <div class="relative mr-2">
                                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="<?php echo getUserAvatar($member['avatar'] ?? '', $member['username'] ?? 'User'); ?>" 
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
                                        <img src="<?php echo getUserAvatar($member['avatar'] ?? '', $member['username'] ?? 'User'); ?>" 
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
    const participantSkeleton = document.querySelector('.participant-skeleton');
    const participantContent = document.querySelector('.participant-content');
    
    setTimeout(function() {
        if (participantSkeleton && participantContent) {
            participantSkeleton.classList.add('hidden');
            participantContent.classList.remove('hidden');
        }
        
        const participantContainer = document.querySelector('[data-lazyload="participant-list"]');
        if (participantContainer) {
            if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
                const isEmpty = <?php echo empty($members) ? 'true' : 'false'; ?>;
                window.LazyLoader.triggerDataLoaded('participant-list', isEmpty);
            }
        }
    }, 1000);
});

function toggleParticipantLoading(loading = true) {
    const participantSkeleton = document.querySelector('.participant-skeleton');
    const participantContent = document.querySelector('.participant-content');
    
    if (!participantSkeleton || !participantContent) return;
    
    if (loading) {
        participantSkeleton.classList.remove('hidden');
        participantContent.classList.add('hidden');
    } else {
        participantSkeleton.classList.add('hidden');
        participantContent.classList.remove('hidden');
    }
}

window.toggleParticipantLoading = toggleParticipantLoading;
</script>
