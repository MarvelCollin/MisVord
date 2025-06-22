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

<div class="flex min-h-screen">
    <!-- Left Sidebar with Settings Categories -->
    <div class="w-60 bg-discord-light border-r border-discord-dark">
        <div class="p-4">
            <div class="text-xs font-bold text-discord-lighter mb-2"><?php echo htmlspecialchars($server->name); ?></div>
        </div>
        
        <nav class="mt-2">
            <ul>
                <!-- Server Settings Categories -->
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=profile" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'profile' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Server Profile
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=tag" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'tag' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Server Tag
                        <span class="ml-2 text-xs bg-discord-primary text-white px-1 rounded">NEW</span>
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=engagement" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'engagement' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Engagement
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=perks" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'perks' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Boost Perks
                    </a>
                </li>
                
                <!-- Expression Category -->
                <li class="mt-6">
                    <div class="px-4 py-1">
                        <span class="text-xs font-bold text-discord-lighter">EXPRESSION</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=emoji" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'emoji' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Emoji
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=stickers" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'stickers' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Stickers
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=soundboard" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'soundboard' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Soundboard
                    </a>
                </li>
                
                <!-- People Category -->
                <li class="mt-6">
                    <div class="px-4 py-1">
                        <span class="text-xs font-bold text-discord-lighter">PEOPLE</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=members" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'members' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Members
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=roles" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'roles' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Roles
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=invites" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'invites' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Invites
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=access" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'access' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Access
                    </a>
                </li>
                
                <!-- Apps Category -->
                <li class="mt-6">
                    <div class="px-4 py-1">
                        <span class="text-xs font-bold text-discord-lighter">APPS</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=integrations" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'integrations' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Integrations
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=app-directory" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'app-directory' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        App Directory
                    </a>
                </li>
                
                <!-- Moderation Category -->
                <li class="mt-6">
                    <div class="px-4 py-1">
                        <span class="text-xs font-bold text-discord-lighter">MODERATION</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=safety" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'safety' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Safety Setup
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=audit-log" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'audit-log' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Audit Log
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=bans" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'bans' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Bans
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=automod" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'automod' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        AutoMod
                    </a>
                </li>
                
                <!-- Community & Status -->
                <li class="mt-6">
                    <a href="?server_id=<?php echo $serverId; ?>&section=community" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'community' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Enable Community
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=boost" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'boost' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Server Boost Status
                    </a>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=template" class="flex items-center p-2 px-4 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'template' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                        Server Template
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <?php if ($section === 'profile'): ?>
            <!-- Server Profile Section -->
            <div class="p-10">
                <h1 class="text-2xl font-bold mb-2">Server Profile</h1>
                <p class="text-discord-lighter mb-6">Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages</p>
                
                <form id="server-profile-form" class="space-y-8">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <!-- Server Name -->
                    <div class="form-group">
                        <label for="server-name" class="block text-sm font-medium text-white mb-2">Name</label>
                        <input type="text" id="server-name" name="name" class="bg-discord-dark-input text-white p-2 w-full max-w-md rounded-md focus:ring-2 focus:ring-discord-blue focus:outline-none border border-gray-700" value="<?php echo htmlspecialchars($server->name); ?>">
                    </div>
                    
                    <!-- Server Icon -->
                    <div class="form-group">
                        <label class="block text-sm font-medium text-white mb-2">Icon</label>
                        <p class="text-discord-lighter text-sm mb-2">We recommend an image of at least 512x512 for the server.</p>
                        
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
                            
                            <button type="button" id="change-server-icon-btn" class="bg-discord-blue hover:bg-discord-blue-dark text-white font-medium py-2 px-4 rounded-md">
                                Change Icon
                            </button>
                            
                            <?php if ($server->image_url): ?>
                                <button type="button" id="remove-server-icon-btn" class="bg-transparent hover:bg-discord-red/10 text-discord-red font-medium py-2 px-4 rounded-md">
                                    Remove
                                </button>
                            <?php endif; ?>
                            
                            <input type="file" id="server-icon-input" name="server_icon" class="hidden" accept="image/*">
                        </div>
                    </div>
                    
                    <!-- Server Banner -->
                    <div class="form-group mt-8">
                        <label class="block text-sm font-medium text-white mb-2">Banner</label>
                        
                        <div class="grid grid-cols-5 gap-2 mb-4">
                            <div class="bg-gradient-to-b from-[#e3e5e8] to-[#c7ccd1] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#ff73fa] to-[#ff295b] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#ff4747] to-[#ff7b7b] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#faa61a] to-[#fbcf4c] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#ffd659] to-[#e7af27] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            
                            <div class="bg-gradient-to-b from-[#b78dff] to-[#9e55ff] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#46ddff] to-[#2ea6ff] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#45e5ce] to-[#1bdbb3] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#98ee99] to-[#57ba5e] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                            <div class="bg-gradient-to-b from-[#7a8087] to-[#36393f] h-16 rounded-md cursor-pointer border-2 border-transparent hover:border-white"></div>
                        </div>
                    </div>
                    
                    <!-- Traits Section -->
                    <div class="form-group mt-8">
                        <label class="block text-sm font-medium text-white mb-2">Traits</label>
                        <p class="text-discord-lighter text-sm mb-4">Add up to 5 traits to show off your server's interests and personality.</p>
                        
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-discord-dark-input rounded-md p-4 flex items-center space-x-3 cursor-pointer border border-gray-700 hover:bg-discord-dark-hover">
                                <div class="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span class="text-xl">😊</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="bg-discord-dark-input rounded-md p-4 flex items-center space-x-3 cursor-pointer border border-gray-700 hover:bg-discord-dark-hover">
                                <div class="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span class="text-xl">😎</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="bg-discord-dark-input rounded-md p-4 flex items-center space-x-3 cursor-pointer border border-gray-700 hover:bg-discord-dark-hover">
                                <div class="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span class="text-xl">🤓</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="bg-discord-dark-input rounded-md p-4 flex items-center space-x-3 cursor-pointer border border-gray-700 hover:bg-discord-dark-hover">
                                <div class="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span class="text-xl">🎮</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                            
                            <div class="bg-discord-dark-input rounded-md p-4 flex items-center space-x-3 cursor-pointer border border-gray-700 hover:bg-discord-dark-hover">
                                <div class="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span class="text-xl">🎲</span>
                                </div>
                                <span class="text-discord-lighter">Add trait</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <button type="submit" class="bg-discord-blue hover:bg-discord-blue-dark text-white font-medium py-2 px-4 rounded-md">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        <?php else: ?>
            <div class="p-10">
                <h1 class="text-2xl font-bold mb-6"><?php echo ucfirst($section); ?></h1>
                <p class="text-discord-lighter">This section is under development.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Server Preview -->
    <div class="w-80 bg-discord-dark border-l border-discord-light p-6">
        <div class="bg-discord-light rounded-lg overflow-hidden">
            <!-- Server Banner Preview -->
            <div class="h-40 bg-gradient-to-b from-[#e3e5e8] to-[#c7ccd1] relative">
                <!-- Server Icon Preview -->
                <div class="absolute -bottom-8 left-4 w-16 h-16 bg-discord-dark rounded-full border-4 border-discord-dark overflow-hidden">
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
            <div class="pt-10 px-4 pb-4">
                <h3 class="text-white font-bold"><?php echo htmlspecialchars($server->name); ?></h3>
                <div class="flex items-center text-xs text-discord-lighter mt-1">
                    <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    <span>10 Online</span>
                    <span class="mx-1">•</span>
                    <span>45 Members</span>
                </div>
                <div class="text-xs text-discord-lighter mt-1">Est. Feb 2024</div>
            </div>
        </div>
    </div>
    
    <!-- Close button to return to server page -->
    <a href="/server/<?php echo $serverId; ?>" class="absolute top-4 right-4 w-8 h-8 bg-discord-dark rounded-full flex items-center justify-center hover:bg-discord-light">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </a>
</div>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
