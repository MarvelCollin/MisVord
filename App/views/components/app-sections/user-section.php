<?php
/**
 * User Section Component
 * Displays users/members list in the right sidebar
 */

// Get server members if we have a current server
$onlineUsers = [];
$offlineUsers = [];
$currentServer = $GLOBALS['currentServer'] ?? null;

if ($currentServer) {
    require_once dirname(dirname(dirname(__DIR__))) . '/database/models/User.php';
    require_once dirname(dirname(dirname(__DIR__))) . '/database/models/UserServerMembership.php';
    
    $serverMembers = $currentServer->members();
    
    // Split members by status and role
    $ownerData = null;
    $adminData = [];
    $regularOnline = [];
    
    foreach ($serverMembers as $member) {
        // Add role information
        if ($member['role'] === 'owner') {
            $ownerData = $member;
        } elseif ($member['role'] === 'admin' && ($member['status'] === 'online' || $member['status'] === 'away')) {
            $adminData[] = $member;
        } elseif ($member['status'] === 'online' || $member['status'] === 'away') {
            $regularOnline[] = $member;
        } else {
            $offlineUsers[] = $member;
        }
    }
    
    // First add owner if exists and is online
    if ($ownerData && ($ownerData['status'] === 'online' || $ownerData['status'] === 'away')) {
        $onlineUsers[] = $ownerData;
    }
    
    // Add admins
    foreach ($adminData as $admin) {
        $onlineUsers[] = $admin;
    }
    
    // Add regular online users
    foreach ($regularOnline as $user) {
        $onlineUsers[] = $user;
    }
    
    // If owner is offline, add to offline users
    if ($ownerData && $ownerData['status'] !== 'online' && $ownerData['status'] !== 'away') {
        $offlineUsers[] = $ownerData;
    }
}

// Helper function to get user initials
function getUserInitials($username) {
    $words = explode(' ', $username);
    $initials = '';
    
    foreach ($words as $word) {
        if (!empty($word)) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
    }
    
    return $initials ? substr($initials, 0, 2) : 'U';
}
?>

<div class="user-section">
    <!-- Section Headers -->
    <div class="role-category">
        <h3>ONLINE — <?php echo count($onlineUsers); ?></h3>
        
        <!-- Online Users -->
        <div class="user-list">
            <?php if (empty($onlineUsers)): ?>
                <div class="user">
                    <div class="user-details">
                        <span class="username">No online users</span>
                    </div>
                </div>
            <?php else: ?>
                <?php foreach ($onlineUsers as $user): ?>
                    <div class="user">
                        <div class="user-avatar <?php echo $user['role'] === 'owner' ? 'owner' : ($user['role'] === 'admin' ? 'admin' : ($user['role'] === 'moderator' ? 'mod' : '')); ?>">
                            <span><?php echo getUserInitials($user['username']); ?></span>
                        </div>
                        <div class="user-details">
                            <span class="username <?php echo $user['role'] === 'owner' ? 'owner-name' : ($user['role'] === 'admin' ? 'admin-name' : ($user['role'] === 'moderator' ? 'mod-name' : '')); ?>">
                                <?php echo htmlspecialchars($user['username']); ?>
                                <?php if ($user['id'] == $_SESSION['user_id']): ?> (You)<?php endif; ?>
                            </span>
                            <span class="user-status">
                                <?php 
                                    if ($user['status'] === 'away') echo 'Away';
                                    elseif ($user['status'] === 'dnd') echo 'Do Not Disturb';
                                    else echo 'Online'; 
                                ?>
                            </span>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Offline Section -->
    <div class="role-category offline">
        <h3>OFFLINE — <?php echo count($offlineUsers); ?></h3>
        
        <!-- Offline Users -->
        <div class="user-list">
            <?php if (empty($offlineUsers)): ?>
                <div class="user offline-user">
                    <div class="user-details">
                        <span class="username offline-name">No offline users</span>
                    </div>
                </div>
            <?php else: ?>
                <?php foreach ($offlineUsers as $user): ?>
                    <div class="user offline-user">
                        <div class="user-avatar offline">
                            <span><?php echo getUserInitials($user['username']); ?></span>
                        </div>
                        <span class="username offline-name">
                            <?php echo htmlspecialchars($user['username']); ?>
                            <?php if ($user['id'] == $_SESSION['user_id']): ?> (You)<?php endif; ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <style>
        .user-section {
            width: 240px;
            background-color: var(--discord-secondary);
            height: 100%;
            padding: 16px 8px;
            overflow-y: auto;
            flex-shrink: 0;
        }

        .role-category h3 {
            color: var(--discord-channels);
            font-size: 12px;
            font-weight: 600;
            padding: 8px;
            margin-bottom: 4px;
        }

        .user-list {
            margin-bottom: 16px;
        }

        .user {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
        }

        .user:hover {
            background-color: rgba(79,84,92,0.3);
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #7289da;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-size: 12px;
            margin-right: 8px;
            position: relative;
        }

        .user-avatar.owner {
            background-color: #faa61a;
        }

        .user-avatar.admin {
            background-color: #ed4245;
        }

        .user-avatar.mod {
            background-color: #5865f2;
        }

        .user-avatar.offline {
            background-color: #747f8d;
        }

        .user-avatar::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 10px;
            height: 10px;
            background-color: var(--discord-green);
            border-radius: 50%;
            border: 2px solid var(--discord-secondary);
        }

        .user-avatar.offline::after {
            background-color: #747f8d;
        }

        .user-details {
            display: flex;
            flex-direction: column;
        }

        .username {
            font-weight: 600;
            font-size: 14px;
        }

        .owner-name {
            color: #faa61a;
        }

        .admin-name {
            color: #ed4245;
        }

        .mod-name {
            color: #5865f2;
        }

        .offline-name {
            color: #96989d;
        }

        .user-status {
            color: var(--discord-channels);
            font-size: 12px;
        }

        .offline-user {
            opacity: 0.6;
        }
    </style>
</div>
