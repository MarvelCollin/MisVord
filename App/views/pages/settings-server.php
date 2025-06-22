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
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=roles" class="sidebar-item <?php echo $section === 'roles' ? 'active' : ''; ?>">
                        Roles
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=invites" class="sidebar-item <?php echo $section === 'invites' ? 'active' : ''; ?>">
                        Invites
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=access" class="sidebar-item <?php echo $section === 'access' ? 'active' : ''; ?>">
                        Access
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
                <p class="text-discord-lighter mb-6">Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages</p>
                
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
                    
                    <!-- Server Banner -->
                    <div class="form-group mt-8">
                        <label class="block text-sm font-medium text-white mb-2">Banner</label>
                        
                        <div class="grid grid-cols-5 gap-2 mb-4">
                            <div class="banner-color-option bg-gradient-to-b from-[#e3e5e8] to-[#c7ccd1] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#ff73fa] to-[#ff295b] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#ff4747] to-[#ff7b7b] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#faa61a] to-[#fbcf4c] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#ffd659] to-[#e7af27] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            
                            <div class="banner-color-option bg-gradient-to-b from-[#b78dff] to-[#9e55ff] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#46ddff] to-[#2ea6ff] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#45e5ce] to-[#1bdbb3] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#98ee99] to-[#57ba5e] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                            <div class="banner-color-option bg-gradient-to-b from-[#7a8087] to-[#36393f] h-16 rounded-md cursor-pointer border-2 border-transparent"></div>
                        </div>
                    </div>
                    
                    <!-- Traits Section -->
                    <div class="form-group mt-8">
                        <label class="block text-sm font-medium text-white mb-2">Traits</label>
                        <p class="text-discord-lighter text-sm mb-4">Add up to 5 traits to show off your server's interests and personality.</p>
                        
                        <div class="grid grid-cols-3 gap-4">
                            <div class="trait-card">
                                <div class="trait-emoji">
                                    <span class="text-xl">😊</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="trait-card">
                                <div class="trait-emoji">
                                    <span class="text-xl">😎</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="trait-card">
                                <div class="trait-emoji">
                                    <span class="text-xl">🤓</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="trait-card">
                                <div class="trait-emoji">
                                    <span class="text-xl">🎮</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="trait-card">
                                <div class="trait-emoji">
                                    <span class="text-xl">🎲</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                        </div>
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
            <div class="server-banner h-40 bg-gradient-to-b from-[#e3e5e8] to-[#c7ccd1] relative">
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
                    <span>10 Online</span>
                    <span class="mx-1">•</span>
                    <span>45 Members</span>
                </div>
                <div class="server-meta text-xs text-discord-lighter mt-1">Est. Feb 2024</div>
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
