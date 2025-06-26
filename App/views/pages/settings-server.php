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
$body_class = 'bg-discord-dark text-white settings-page';
$page_css = 'settings-server';
$page_js = 'pages/settings-page';
$head_scripts = ['logger-init'];
$additional_js = ['components/servers/settings-server'];

ob_start();
?>

<meta name="server-id" content="<?php echo $serverId; ?>">

<div class="flex min-h-screen max-w-[1480px] mx-auto mt-10">
    <div class="w-60 bg-discord-light border-r border-discord-dark">
        <div class="p-4">
            <div class="text-sm font-semibold text-white"><?php echo htmlspecialchars($server->name); ?></div>
            <div class="text-xs text-discord-lighter mt-1">Server Settings</div>
        </div>
        
        <nav class="mt-2">
            <ul>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=profile" class="sidebar-item <?php echo $section === 'profile' ? 'active' : ''; ?>">
                        Server Profile
                    </a>
                </li>
                
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
                
                <li class="mt-6">
                    <div class="sidebar-category">
                        <span>DANGER ZONE</span>
                    </div>
                </li>
                <li>
                    <a href="?server_id=<?php echo $serverId; ?>&section=delete" class="sidebar-item text-discord-red <?php echo $section === 'delete' ? 'active' : ''; ?>">
                        Delete Server
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <?php if ($section === 'delete'): ?>
            <div class="p-10 max-w-[740px]">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold mb-2 text-discord-red">Delete Server</h1>
                    <p class="text-discord-lighter">This action is permanent and cannot be undone</p>
                </div>
                
                <div class="bg-discord-darker rounded-lg p-6 space-y-6">
                    <div class="bg-discord-red bg-opacity-10 text-discord-red border-l-4 border-discord-red px-4 py-3 rounded-r">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span class="font-medium">This action cannot be undone</span>
                        </div>
                    </div>
                    
                    <p class="text-white">
                        Deleting this server will:
                    </p>
                    
                    <ul class="ml-6 space-y-2 text-discord-lighter">
                        <li class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-discord-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Permanently delete all channels and their content
                        </li>
                        <li class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-discord-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Remove all members from the server
                        </li>
                        <li class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-discord-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Delete all server settings and custom emojis
                        </li>
                    </ul>
                    
                    <div class="pt-4">
                        <button id="open-delete-modal" class="bg-discord-red hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                            Delete Server
                        </button>
                    </div>
                </div>
            </div>
        <?php elseif ($section === 'profile'): ?>       
            <div class="p-10 max-w-[740px]">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold mb-2">Server Profile</h1>
                    <p class="text-discord-lighter">Customize your server's appearance and profile information</p>
                </div>
                
                <form id="server-profile-form" class="space-y-8">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <div class="bg-discord-darker rounded-lg p-6 space-y-6">
                        <div class="form-group">
                            <label for="server-name" class="block text-sm font-medium text-white mb-2">Server Name</label>
                            <input type="text" id="server-name" name="name" class="form-input bg-discord-dark-input text-white border-none focus:ring-2 focus:ring-discord-primary" value="<?php echo htmlspecialchars($server->name); ?>">
                        </div>
                        
                        <div class="form-group">
                            <label for="server-description" class="block text-sm font-medium text-white mb-2">Description</label>
                            <textarea id="server-description" name="description" class="form-input bg-discord-dark-input text-white border-none h-24 resize-none focus:ring-2 focus:ring-discord-primary" placeholder="Tell people what your server is about..."><?php echo htmlspecialchars($server->description ?? ''); ?></textarea>
                            <p class="text-xs text-discord-lighter mt-1">This description will be shown in server discovery and invites.</p>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-6">
                        <h3 class="text-lg font-medium mb-4">Server Identity</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label class="block text-sm font-medium text-white mb-2">Icon</label>
                                <p class="text-discord-lighter text-xs mb-3">Recommended: 512x512 or larger square image</p>
                                
                                <div id="server-icon-container" class="relative w-24 h-24 bg-discord-dark-input rounded-full overflow-hidden border border-discord-darker cursor-pointer hover:opacity-90 transition-opacity">
                                    <?php if ($server->image_url): ?>
                                        <img id="server-icon-preview" src="<?php echo htmlspecialchars($server->image_url); ?>" alt="Server Icon" class="w-full h-full object-cover">
                                    <?php else: ?>
                                        <div id="server-icon-placeholder" class="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                            <?php echo strtoupper(substr($server->name, 0, 1)); ?>
                                        </div>
                                    <?php endif; ?>
                                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div class="text-white text-sm font-medium">CHANGE</div>
                                    </div>
                                </div>
                                
                                <input type="file" id="server-icon-input" name="server_icon" class="hidden" accept="image/*">
                            </div>
                            
                            <div class="form-group">
                                <label class="block text-sm font-medium text-white mb-2">Banner</label>
                                <p class="text-discord-lighter text-xs mb-3">Recommended: 960x540 or larger (16:9 ratio)</p>
                                
                                <div id="server-banner-container" class="relative w-full h-32 bg-discord-dark-input rounded-md overflow-hidden border border-discord-darker cursor-pointer hover:opacity-90 transition-opacity">
                                    <?php if ($server->banner_url): ?>
                                        <img id="server-banner-preview" src="<?php echo htmlspecialchars($server->banner_url); ?>" alt="Server Banner" class="w-full h-full object-cover">
                                    <?php else: ?>
                                        <div id="server-banner-placeholder" class="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#7a8087] to-[#36393f]">
                                            <div class="text-white text-sm font-medium">UPLOAD BANNER</div>
                                        </div>
                                    <?php endif; ?>
                                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div class="text-white text-sm font-medium">CHANGE BANNER</div>
                                    </div>
                                </div>
                                
                                <input type="file" id="server-banner-input" name="server_banner" class="hidden" accept="image/*">
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-6 space-y-6">
                        <h3 class="text-lg font-medium mb-4">Discovery Settings</h3>
                        
                        <div class="form-group">
                            <div class="flex items-center space-x-3 mb-2">
                                <div class="relative inline-flex items-center">
                                    <input type="checkbox" id="is-public" name="is_public" class="custom-checkbox absolute opacity-0 w-0 h-0" <?php echo $server->is_public ? 'checked' : ''; ?>>
                                    <div class="checkbox-wrapper flex items-center justify-center w-5 h-5 bg-discord-dark-input rounded border border-discord-darker">
                                        <svg class="checkbox-check w-3.5 h-3.5 text-white opacity-0 transform scale-50 transition-all duration-100" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <label for="is-public" class="ml-2 text-sm text-white cursor-pointer">Make this server public</label>
                                </div>
                            </div>
                            <p class="text-discord-lighter text-xs ml-8">Public servers can be found by anyone in Server Discovery</p>
                        </div>
                        
                        <div class="form-group">
                            <label for="server-category" class="block text-sm font-medium text-white mb-2">Category</label>
                            <select id="server-category" name="category" class="form-input bg-discord-dark-input text-white border-none focus:ring-2 focus:ring-discord-primary">
                                <option value="">Select a category</option>
                                <option value="gaming" <?php echo ($server->category === 'gaming') ? 'selected' : ''; ?>>Gaming</option>
                                <option value="music" <?php echo ($server->category === 'music') ? 'selected' : ''; ?>>Music</option>
                                <option value="education" <?php echo ($server->category === 'education') ? 'selected' : ''; ?>>Education</option>
                                <option value="science" <?php echo ($server->category === 'science') ? 'selected' : ''; ?>>Science & Tech</option>
                                <option value="entertainment" <?php echo ($server->category === 'entertainment') ? 'selected' : ''; ?>>Entertainment</option>
                            </select>
                            <p class="text-xs text-discord-lighter mt-1">Choose a category that best describes your server</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end pt-4">
                        <button type="submit" id="save-changes-btn" class="bg-discord-primary hover:bg-discord-primary-dark text-white font-medium py-2 px-6 rounded-md transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        <?php elseif ($section === 'members'): ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Members</h1>
                <p class="text-discord-lighter mb-6">Manage members and their roles in your server</p>
                
                <div class="flex gap-4 mb-6">
                    <div class="relative flex-1">
                        <input type="text" id="member-search" class="form-input pl-10" placeholder="Search members">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-discord-lighter" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <div id="member-filter" class="relative inline-block">
                            <button type="button" class="bg-discord-darker flex items-center justify-between px-3 py-2 rounded-md text-white hover:bg-opacity-80 transition-colors min-w-[180px]">
                                <span class="filter-selected-text text-sm">Member Since (Newest first)</span>
                                <svg class="w-5 h-5 text-discord-lighter ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>

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
                
                <div class="bg-discord-darker rounded-md overflow-hidden">
                    <div class="p-4 border-b border-discord-dark flex items-center text-sm font-medium text-discord-lighter">
                        <div class="w-10">#</div>
                        <div class="flex-1">USERNAME</div>
                        <div class="w-32">ROLE</div>
                        <div class="w-40">JOINED</div>
                        <div class="w-24">ACTIONS</div>
                    </div>
                    
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
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Roles</h1>
                <p class="text-discord-lighter mb-6">Use roles to group your server members and assign permissions.</p>
                
                <div class="roles-header-section">
                    <div class="roles-controls">
                        <div class="search-container">
                            <div class="search-input-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" id="role-search" class="search-input" placeholder="Search roles">
                            </div>
                        </div>
                        
                        <div class="controls-right">
                            <div id="role-filter" class="filter-dropdown-container">
                                <button type="button" class="filter-button">
                                    <span class="filter-selected-text">Role Name (A-Z)</span>
                                    <svg class="filter-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                
                                <div id="filter-dropdown" class="filter-dropdown hidden">
                                    <div class="filter-option" data-filter="role-name-asc">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" checked class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Role Name (A-Z)</span>
                                    </div>
                                    <div class="filter-option" data-filter="role-name-desc">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Role Name (Z-A)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button type="button" id="create-role-btn" class="create-role-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" class="create-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Create Role</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="roles-table-container">
                    <div class="roles-table-header">
                        <div class="table-col table-col-icon">#</div>
                        <div class="table-col table-col-name">ROLE NAME</div>
                        <div class="table-col table-col-members">MEMBERS</div>
                        <div class="table-col table-col-actions">ACTIONS</div>
                    </div>

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
                                        
                <template id="role-template">
                    <div class="role-item">
                        <div class="table-col table-col-icon">
                            <div class="role-color"></div>
                        </div>
                        <div class="table-col table-col-name">
                            <div class="role-info">
                                <div class="role-name"></div>
                                <div class="role-permissions"></div>
                            </div>
                        </div>
                        <div class="table-col table-col-members">
                            <div class="role-member-count">0 members</div>
                        </div>
                        <div class="table-col table-col-actions">
                            <div class="role-actions">
                                <button class="edit-role-btn" title="Edit Role">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button class="delete-role-btn" title="Delete Role">
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
    
    <div class="w-80 bg-discord-dark border-l">
        <div class="sticky top-6">
            <h3 class="text-sm font-semibold text-discord-lighter uppercase mb-4">Preview</h3>
            
            <div class="server-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
                <div class="server-banner h-40 <?php echo $server->banner_url ? '' : 'bg-gradient-to-b from-[#7a8087] to-[#36393f]'; ?>" 
                     <?php echo $server->banner_url ? 'style="background-image: url(\'' . htmlspecialchars($server->banner_url) . '\'); background-size: cover; background-position: center;"' : ''; ?>>
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
            
            <div class="mt-4 text-xs text-discord-lighter">
                <p class="mb-2">This is how your server will appear to others.</p>
                <p>Changes will be applied after saving.</p>
            </div>
        </div>
    </div>
    
    <a href="/server/<?php echo $serverId; ?>" class="close-button">
        <div class="close-button-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>
        <span class="close-button-text">ESC</span>
    </a>
</div>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

<?php include dirname(dirname(__DIR__)) . '/views/components/server/delete-server-modal.php'; ?>
