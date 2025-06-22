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
        <?php elseif ($section === 'members'): ?>
            <!-- Members Section -->
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Members</h1>
                <p class="text-discord-lighter mb-6">Manage members and their roles in your server</p>
                
                <!-- Search and Filter Bar -->
                <div class="flex gap-4 mb-6">
                    <!-- Search Bar -->
                    <div class="relative flex-1">
                        <input type="text" id="member-search" class="form-input pl-10" placeholder="Search members">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-discord-lighter" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Filter Options -->
                    <div class="flex gap-2">
                        <!-- Sort Dropdown -->
                        <div id="member-filter" class="relative inline-block">
                            <button type="button" class="bg-discord-darker flex items-center justify-between px-3 py-2 rounded-md text-white hover:bg-opacity-80 transition-colors min-w-[180px]">
                                <span class="filter-selected-text text-sm">Member Since (Newest first)</span>
                                <svg class="w-5 h-5 text-discord-lighter ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div id="filter-dropdown" class="filter-dropdown hidden absolute z-10 w-full mt-1 rounded-md shadow-lg bg-discord-darker border border-gray-700 overflow-hidden">
                                <div class="py-1">
                                    <div class="filter-option px-3 py-2 text-white hover:bg-discord-primary hover:text-white cursor-pointer flex items-center gap-3" data-filter="member-newest">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" checked class="w-4 h-4 accent-[#5865f2]">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span class="text-sm">Member Since (Newest first)</span>
                                    </div>
                                    <div class="filter-option px-3 py-2 text-white hover:bg-discord-primary hover:text-white cursor-pointer flex items-center gap-3" data-filter="member-oldest">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="w-4 h-4 accent-[#5865f2]">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span class="text-sm">Member Since (Oldest first)</span>
                                    </div>
                                    <div class="filter-option px-3 py-2 text-white hover:bg-discord-primary hover:text-white cursor-pointer flex items-center gap-3" data-filter="discord-newest">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="w-4 h-4 accent-[#5865f2]">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span class="text-sm">Joined Discord (Newest first)</span>
                                    </div>
                                    <div class="filter-option px-3 py-2 text-white hover:bg-discord-primary hover:text-white cursor-pointer flex items-center gap-3" data-filter="discord-oldest">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="w-4 h-4 accent-[#5865f2]">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span class="text-sm">Joined Discord (Oldest first)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Members List -->
                <div class="bg-discord-darker rounded-md overflow-hidden">
                    <div class="p-4 border-b border-discord-dark flex items-center text-sm font-medium text-discord-lighter">
                        <div class="w-10">#</div>
                        <div class="flex-1">USERNAME</div>
                        <div class="w-32">ROLE</div>
                        <div class="w-40">JOINED</div>
                        <div class="w-24">ACTIONS</div>
                    </div>
                    
                    <!-- Members will be loaded here via JavaScript -->
                    <div id="members-list" class="max-h-[500px] overflow-y-auto">
                        <div class="flex items-center justify-center p-8 text-discord-lighter">
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading members...</span>
                        </div>
                    </div>
                </div>
                
                <!-- Member Template (for JavaScript) -->
                <template id="member-template">
                    <div class="member-item p-4 border-b border-discord-dark flex items-center hover:bg-discord-dark">
                        <div class="w-10 flex items-center justify-center">
                            <div class="member-avatar w-8 h-8 rounded-full bg-discord-dark overflow-hidden">
                                <img src="" alt="Avatar" class="w-full h-full object-cover">
                            </div>
                        </div>
                        <div class="flex-1 flex items-center">
                            <div>
                                <div class="member-username font-medium"></div>
                                <div class="member-discriminator text-xs text-discord-lighter"></div>
                            </div>
                            <div class="member-status ml-2 flex items-center">
                                <span class="status-indicator w-2 h-2 rounded-full"></span>
                            </div>
                        </div>
                        <div class="w-32">
                            <div class="member-role px-2 py-1 rounded text-xs inline-block"></div>
                        </div>
                        <div class="w-40 text-sm text-discord-lighter member-joined"></div>
                        <div class="w-24 flex space-x-2">
                            <button class="edit-role-btn p-2 rounded hover:bg-discord-light" title="Edit Role">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button class="kick-member-btn p-2 rounded hover:bg-discord-light" title="Kick Member">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        <?php elseif ($section === 'roles'): ?>
            <!-- Roles Section -->
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Roles</h1>
                <p class="text-discord-lighter mb-6">Use roles to group your server members and assign permissions.</p>
                
                <!-- Search and Filter Bar -->
                <div class="flex gap-4 mb-6">
                    <!-- Search Bar -->
                    <div class="relative flex-1">
                        <input type="text" id="role-search" class="form-input pl-10" placeholder="Search roles">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-discord-lighter" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Filter Options -->
                    <div class="flex gap-2">
                        <!-- Sort Dropdown -->
                        <div id="role-filter" class="relative inline-block">
                            <button type="button" class="bg-discord-darker flex items-center justify-between px-3 py-2 rounded-md text-white hover:bg-opacity-80 transition-colors min-w-[180px]">
                                <span class="filter-selected-text text-sm">Role Name (A-Z)</span>
                                <svg class="w-5 h-5 text-discord-lighter ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div id="filter-dropdown" class="filter-dropdown hidden absolute z-10 w-full mt-1 rounded-md shadow-lg bg-discord-darker border border-gray-700 overflow-hidden">
                                <div class="py-1">
                                    <div class="filter-option px-3 py-2 text-white hover:bg-discord-primary hover:text-white cursor-pointer flex items-center gap-3" data-filter="role-name-asc">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" checked class="w-4 h-4 accent-[#5865f2]">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span class="text-sm">Role Name (A-Z)</span>
                                    </div>
                                    <div class="filter-option px-3 py-2 text-white hover:bg-discord-primary hover:text-white cursor-pointer flex items-center gap-3" data-filter="role-name-desc">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="w-4 h-4 accent-[#5865f2]">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span class="text-sm">Role Name (Z-A)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Create Role Button -->
                        <button type="button" id="create-role-btn" class="create-role-btn flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Role
                        </button>
                    </div>
                </div>
                
                <!-- Roles List -->
                <div class="bg-discord-darker rounded-md overflow-hidden">
                    <div class="p-4 border-b border-discord-dark flex items-center text-sm font-medium text-discord-lighter">
                        <div class="w-10">#</div>
                        <div class="flex-1">ROLE NAME</div>
                        <div class="w-32">PERMISSIONS</div>
                        <div class="w-40">ACTIONS</div>
                    </div>
                    
                    <!-- Roles will be loaded here via JavaScript -->
                    <div id="roles-list" class="max-h-[500px] overflow-y-auto">
                        <div class="flex items-center justify-center p-8 text-discord-lighter">
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading roles...</span>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-discord-lighter mt-3">
                    <p>Members use the color of the highest role they have on the list. Drag roles to reorder them.</p>
                    <a href="#" class="text-blue-400 hover:underline">Need help with permissions?</a>
                </div>
                
                <!-- Role Template (for JavaScript) -->
                <template id="role-template">
                    <div class="role-item p-4 border-b border-discord-dark flex items-center hover:bg-discord-dark">
                        <div class="w-10 flex items-center justify-center">
                            <div class="role-color w-3 h-3 rounded-full bg-gray-500"></div>
                        </div>
                        <div class="flex-1">
                            <div class="role-name font-medium"></div>
                            <div class="role-permissions text-xs text-discord-lighter"></div>
                        </div>
                        <div class="w-32 text-xs text-discord-lighter role-member-count">
                            0 members
                        </div>
                        <div class="w-40">
                            <div class="role-actions flex space-x-2">
                                <button class="edit-role-btn p-2 rounded hover:bg-discord-light" title="Edit Role">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button class="delete-role-btn p-2 rounded hover:bg-discord-light" title="Delete Role">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
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
