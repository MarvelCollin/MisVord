<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

require_once dirname(dirname(__DIR__)) . '/controllers/SettingsController.php';
$settingsController = new SettingsController();
$settingsData = $settingsController->prepareSettingsData();

$server = $settingsData['server'];
$serverId = $settingsData['serverId'];
$section = $settingsData['section'] ?? 'profile';

$page_title = 'misvord - Server Settings';
$body_class = 'bg-discord-dark text-white';
$page_css = 'settings-server';
$page_js = 'pages/settings-page';
$head_scripts = ['logger-init'];
$additional_js = ['components/servers/settings-server'];

ob_start();
?>

<meta name="server-id" content="<?php echo $serverId; ?>">

<div class="flex min-h-screen max-w-[1480px] mx-auto">
    <!-- Left Sidebar with Settings Categories -->
    <div class="w-60 bg-discord-light border-r border-discord-dark">
        <div class="p-4">
            <div class="text-sm font-semibold text-white"><?php echo htmlspecialchars($server->name); ?></div>
            <div class="text-xs text-discord-lighter mt-1">Server Settings</div>
        </div>
        
        <nav class="mt-2">
            <ul>
                <!-- Server Settings Categories -->
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=profile" class="sidebar-item <?php echo $section === 'profile' ? 'active' : ''; ?>">
                        Server Profile
                    </a>
                </li>
                
                <!-- People Category -->
                <li class="mt-6">
                    <div class="sidebar-category">
                        <span>PEOPLE</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=members" class="sidebar-item <?php echo $section === 'members' ? 'active' : ''; ?>">
                        Members
                    </a>
                </li>
                
                <!-- Moderation Category -->
                <li class="mt-6">
                    <div class="sidebar-category">
                        <span>MODERATION</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=bans" class="sidebar-item <?php echo $section === 'bans' ? 'active' : ''; ?>">
                        Bans
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <?php if ($section === 'profile'): ?>
            <!-- Server Profile Section -->
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Server Profile</h1>
                <p class="text-discord-lighter mb-6">Customize your server's appearance and profile information</p>
                
                <form id="server-profile-form" class="space-y-8">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <!-- Server Name -->
                    <div class="form-group">
                        <label for="server-name" class="block text-sm font-medium text-white mb-2">Name</label>
                        <input type="text" id="server-name" name="name" class="form-input" value="<?php echo htmlspecialchars($server->name); ?>">
                    </div>
                    
                    <!-- Server Icon -->
                    <div class="form-group">
                        <label class="block text-sm font-medium text-white mb-2">Icon</label>
                        <p class="text-discord-lighter text-sm mb-2">We recommend an image of at least 512x512.</p>
                        
                        <div class="flex items-center space-x-4">
                            <div id="server-icon-container" class="relative w-24 h-24 bg-discord-dark-input rounded-full overflow-hidden border border-gray-700">
                                <?php if ($server->image_url): ?>
                                    <img id="server-icon-preview" src="<?php echo htmlspecialchars($server->image_url); ?>" alt="Server Icon" class="w-full h-full object-cover">
                                <?php else: ?>
                                    <div id="server-icon-placeholder" class="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                        <?php echo strtoupper(substr($server->name, 0, 1)); ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                            
                            <button type="button" id="change-server-icon-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md">
                                Change Server Icon
                            </button>
                            
                            <?php if ($server->image_url): ?>
                                <button type="button" id="remove-server-icon-btn" class="text-[#ed4245] hover:underline font-medium py-2 px-4">
                                    Remove Icon
                                </button>
                            <?php endif; ?>
                            
                            <input type="file" id="server-icon-input" name="server_icon" class="hidden" accept="image/*">
                        </div>
                    </div>
                    
                    <!-- Server Description -->
                    <div class="form-group">
                        <label for="server-description" class="block text-sm font-medium text-white mb-2">Description</label>
                        <textarea id="server-description" name="description" class="form-input h-24 resize-none" placeholder="Tell people what your server is about..."><?php echo htmlspecialchars($server->description ?? ''); ?></textarea>
                    </div>
                    
                    <!-- Server Privacy -->
                    <div class="form-group">
                        <label class="block text-sm font-medium text-white mb-2">Privacy Setting</label>
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" id="is-public" name="is_public" class="w-5 h-5" <?php echo $server->is_public ? 'checked' : ''; ?>>
                            <label for="is-public" class="text-sm text-white">Make this server public</label>
                        </div>
                        <p class="text-discord-lighter text-xs mt-1">Public servers can be found by anyone in Server Discovery</p>
                    </div>
                    
                    <!-- Server Category -->
                    <div class="form-group">
                        <label for="server-category" class="block text-sm font-medium text-white mb-2">Category</label>
                        <select id="server-category" name="category" class="form-input">
                            <option value="">Select a category</option>
                            <option value="gaming" <?php echo ($server->category === 'gaming') ? 'selected' : ''; ?>>Gaming</option>
                            <option value="music" <?php echo ($server->category === 'music') ? 'selected' : ''; ?>>Music</option>
                            <option value="education" <?php echo ($server->category === 'education') ? 'selected' : ''; ?>>Education</option>
                            <option value="science" <?php echo ($server->category === 'science') ? 'selected' : ''; ?>>Science & Tech</option>
                            <option value="entertainment" <?php echo ($server->category === 'entertainment') ? 'selected' : ''; ?>>Entertainment</option>
                        </select>
                    </div>
                    
                    <!-- Save Button -->
                    <div class="form-group mt-8">
                        <button type="submit" id="save-changes-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded-md">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        <?php else: ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-6"><?php echo ucfirst($section); ?></h1>
                <p class="text-discord-lighter">This section is under development.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Server Preview -->
    <div class="w-80 bg-discord-dark border-l border-discord-light p-6">
        <div class="server-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
            <!-- Server Banner Preview -->
            <div class="server-banner h-40 <?php echo $server->banner_url ? '' : 'bg-gradient-to-b from-[#7a8087] to-[#36393f]'; ?>" 
                 <?php echo $server->banner_url ? 'style="background-image: url(\'' . htmlspecialchars($server->banner_url) . '\'); background-size: cover; background-position: center;"' : ''; ?>>
                <!-- Server Icon Preview -->
                <div class="server-icon-preview absolute -bottom-8 left-4 w-16 h-16 bg-discord-dark rounded-full border-4 border-[#1e1f22] overflow-hidden">
                    <?php if ($server->image_url): ?>
                        <img src="<?php echo htmlspecialchars($server->image_url); ?>" alt="Server Icon" class="w-full h-full object-cover">
                    <?php else: ?>
                        <div class="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                            <?php echo strtoupper(substr($server->name, 0, 1)); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Server Info Preview -->
            <div class="server-info pt-10 px-4 pb-4">
                <h3 class="server-name text-white font-bold"><?php echo htmlspecialchars($server->name); ?></h3>
                <div class="server-meta flex items-center text-xs text-discord-lighter mt-1">
                    <span class="online-indicator inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    <span>Online</span>
                    <span class="mx-1">•</span>
                    <span>Members</span>
                </div>
                <?php if ($server->description): ?>
                    <div class="server-description text-xs text-discord-lighter mt-3"><?php echo htmlspecialchars($server->description); ?></div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- Close button to return to server page -->
    <div class="absolute top-0 right-0 flex items-center">
        <a href="/server/<?php echo $serverId; ?>" class="close-button flex items-center justify-center py-2 px-4">
            <div class="close-button-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <span class="close-button-text">ESC</span>
        </a>
    </div>
</div>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
