<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Participants Section - Online users list -->
<div class="participants-section h-full overflow-y-auto">
    <!-- Roles and Members -->
    <div class="px-3 py-4">
        <div class="role-group mb-6">
            <h3 class="text-gray-400 text-xs font-semibold uppercase mb-2">Online — 6</h3>
            
            <!-- Server Owner -->
            <div class="user-item">
                <div class="avatar-wrapper">
                    <div class="status-indicator online"></div>
                    <img src="<?php echo asset('/landing-page/discord-logo.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full">
                </div>
                <div class="user-details">
                    <span class="username text-emerald-400">GameMaster</span>
                    <div class="user-activity text-gray-500 text-xs">Playing Valorant</div>
                </div>
                <div class="ml-auto">
                    <div class="badge owner-badge" title="Server Owner">👑</div>
                </div>
            </div>
            
            <!-- Moderators -->
            <div class="user-item">
                <div class="avatar-wrapper">
                    <div class="status-indicator online"></div>
                    <img src="<?php echo asset('/landing-page/robot.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full">
                </div>
                <div class="user-details">
                    <span class="username text-purple-400">CodeWizard</span>
                    <div class="user-activity text-gray-500 text-xs">Coding</div>
                </div>
                <div class="ml-auto">
                    <div class="badge mod-badge" title="Moderator">🛡️</div>
                </div>
            </div>
            
            <!-- Regular Members -->
            <div class="user-item">
                <div class="avatar-wrapper">
                    <div class="status-indicator online"></div>
                    <img src="<?php echo asset('/landing-page/wumpus_happy.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full">
                </div>
                <div class="user-details">
                    <span class="username text-blue-400">NinjaPlayer</span>
                    <div class="user-activity text-gray-500 text-xs">In Voice Chat</div>
                </div>
            </div>
            
            <div class="user-item">
                <div class="avatar-wrapper">
                    <div class="status-indicator idle"></div>
                    <img src="<?php echo asset('/landing-page/flying-cat.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full">
                </div>
                <div class="user-details">
                    <span class="username text-pink-400">ProGamer2025</span>
                </div>
            </div>
            
            <div class="user-item">
                <div class="avatar-wrapper">
                    <div class="status-indicator online"></div>
                    <img src="<?php echo asset('/landing-page/thropy.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full">
                </div>
                <div class="user-details">
                    <span class="username text-yellow-400">StreamerExtraordinaire</span>
                    <div class="user-activity text-gray-500 text-xs">Streaming on Twitch</div>
                </div>
            </div>
            
            <div class="user-item">
                <div class="avatar-wrapper">
                    <div class="status-indicator dnd"></div>
                    <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full">
                </div>
                <div class="user-details">
                    <span class="username text-indigo-400">You</span>
                    <div class="user-activity text-gray-500 text-xs">Do Not Disturb</div>
                </div>
            </div>
        </div>
        
        <div class="role-group">
            <h3 class="text-gray-400 text-xs font-semibold uppercase mb-2">Offline — 3</h3>
            
            <div class="user-item offline">
                <div class="avatar-wrapper">
                    <div class="status-indicator offline"></div>
                    <img src="<?php echo asset('/landing-page/actor.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full opacity-60">
                </div>
                <div class="user-details">
                    <span class="username text-gray-400">CasualGamer</span>
                </div>
            </div>
            
            <div class="user-item offline">
                <div class="avatar-wrapper">
                    <div class="status-indicator offline"></div>
                    <img src="<?php echo asset('/landing-page/hug.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full opacity-60">
                </div>
                <div class="user-details">
                    <span class="username text-gray-400">EpicSniper</span>
                </div>
            </div>
            
            <div class="user-item offline">
                <div class="avatar-wrapper">
                    <div class="status-indicator offline"></div>
                    <img src="<?php echo asset('/landing-page/leaf.webp'); ?>" alt="User Avatar" class="w-8 h-8 rounded-full opacity-60">
                </div>
                <div class="user-details">
                    <span class="username text-gray-400">StrategyMaster</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.participants-section {
    background-color: #2f3136;
    width: 240px;
    min-width: 240px;
}

.user-item {
    display: flex;
    align-items: center;
    padding: 6px 0;
    margin: 1px 0;
    border-radius: 4px;
    cursor: pointer;
}

.user-item:hover {
    background-color: rgba(79, 84, 92, 0.16);
}

.avatar-wrapper {
    position: relative;
    margin-right: 12px;
}

.status-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #2f3136;
}

.status-indicator.online {
    background-color: #3ba55d;
}

.status-indicator.idle {
    background-color: #faa81a;
}

.status-indicator.dnd {
    background-color: #ed4245;
}

.status-indicator.offline {
    background-color: #747f8d;
}

.user-details {
    overflow: hidden;
}

.username {
    display: block;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-activity {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.badge {
    font-size: 12px;
}

.offline .username,
.offline .user-activity {
    opacity: 0.6;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to user items
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const username = this.querySelector('.username');
            username.style.textDecoration = 'underline';
        });
        
        item.addEventListener('mouseleave', function() {
            const username = this.querySelector('.username');
            username.style.textDecoration = 'none';
        });
    });
    
    // Show user info on click
    userItems.forEach(item => {
        item.addEventListener('click', function() {
            const username = this.querySelector('.username').textContent;
            // This would typically open a user profile modal, but we'll just log for now
            console.log(`Viewing profile: ${username}`);
        });
    });
});
</script>
