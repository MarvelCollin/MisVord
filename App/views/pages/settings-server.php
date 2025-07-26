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
$userRole = $settingsData['userRole'] ?? 'member';
$categories = $settingsData['categories'] ?? [];

$page_title = 'MisVord - Server Settings';
$body_class = 'bg-discord-dark text-white settings-page';
$page_css = 'settings-server';
$page_js = 'pages/settings-page';
$head_scripts = ['logger-init'];
$additional_js = ['components/servers/settings-server'];
$cache_buster = time();

ob_start();
?>

<meta name="server-id" content="<?php echo $serverId; ?>">
<meta name="user-role" content="<?php echo $userRole; ?>">
<meta name="user-id" content="<?php echo $_SESSION['user_id'] ?? ''; ?>">

<div class="flex flex-col lg:flex-row min-h-screen max-w-[1480px] mx-auto mt-2 md:mt-6 lg:mt-10 px-2 md:px-4">
    <div class="w-full lg:w-60 bg-discord-light border-b lg:border-b-0 lg:border-r border-discord-dark mb-4 lg:mb-0">
        <div class="p-3 md:p-4">
            <div class="text-sm font-semibold text-white truncate"><?php echo htmlspecialchars($server->name); ?></div>
            <div class="text-xs text-discord-lighter mt-1">Server Settings</div>
        </div>
        
        <nav class="mt-2 overflow-x-auto lg:overflow-x-visible">
            <ul class="flex lg:block space-x-2 lg:space-x-0 pb-2 lg:pb-0 px-2 lg:px-0">
                <li class="flex-shrink-0 lg:flex-shrink">
                    <a href="?server_id=<?php echo $serverId; ?>&section=profile" class="sidebar-item <?php echo $section === 'profile' ? 'active' : ''; ?> whitespace-nowrap">
                        <span class="lg:hidden">Profile</span>
                        <span class="hidden lg:inline">Server Profile</span>
                    </a>
                </li>
                
                <li class="mt-0 lg:mt-6 flex-shrink-0 lg:flex-shrink">
                    <div class="sidebar-category hidden lg:block">
                        <span>CHANNELS</span>
                    </div>
                </li>
                <li class="flex-shrink-0 lg:flex-shrink">
                    <a href="?server_id=<?php echo $serverId; ?>&section=channels" class="sidebar-item <?php echo $section === 'channels' ? 'active' : ''; ?> whitespace-nowrap">
                        <span class="lg:hidden">Channels</span>
                        <span class="hidden lg:inline">Channel Management</span>
                    </a>
                </li>
                
                <li class="mt-0 lg:mt-6 flex-shrink-0 lg:flex-shrink">
                    <div class="sidebar-category hidden lg:block">
                        <span>PEOPLE</span>
                    </div>
                </li>
                <li class="flex-shrink-0 lg:flex-shrink">
                    <a href="?server_id=<?php echo $serverId; ?>&section=roles" class="sidebar-item <?php echo $section === 'roles' ? 'active' : ''; ?> whitespace-nowrap">
                        Members
                    </a>
                </li>
                
                <li class="mt-0 lg:mt-6 flex-shrink-0 lg:flex-shrink">
                    <div class="sidebar-category hidden lg:block">
                        <span>DANGER ZONE</span>
                    </div>
                </li>
                <li class="flex-shrink-0 lg:flex-shrink">
                    <a href="?server_id=<?php echo $serverId; ?>&section=delete" class="sidebar-item text-discord-red <?php echo $section === 'delete' ? 'active' : ''; ?> whitespace-nowrap">
                        <span class="lg:hidden">Delete</span>
                        <span class="hidden lg:inline">Delete Server</span>
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <div class="flex-1 bg-discord-dark overflow-y-auto min-h-0">
        <?php if ($section === 'delete'): ?>
            <div class="p-4 md:p-6 lg:p-10 max-w-full lg:max-w-[740px]">
                <div class="mb-6 md:mb-8">
                    <h1 class="text-xl md:text-2xl font-bold mb-2 text-discord-red">Delete Server</h1>
                    <p class="text-sm md:text-base text-discord-lighter">This action is permanent and cannot be undone</p>
                </div>
                
                <div class="bg-discord-darker rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
                    <div class="bg-discord-red bg-opacity-10 text-discord-red border-l-4 border-discord-red px-3 md:px-4 py-2 md:py-3 rounded-r">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle h-4 w-4 md:h-5 md:w-5 mr-2 flex-shrink-0"></i>
                            <span class="font-medium text-sm md:text-base">This action cannot be undone</span>
                        </div>
                    </div>
                    
                    <p class="text-white text-sm md:text-base">
                        Deleting this server will:
                    </p>
                    
                    <ul class="ml-4 md:ml-6 space-y-2 text-discord-lighter text-sm md:text-base">
                        <li class="flex items-start">
                            <i class="fas fa-times h-3 w-3 md:h-4 md:w-4 mr-2 mt-1 text-discord-red flex-shrink-0"></i>
                            <span>Permanently delete all channels and their content</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-times h-3 w-3 md:h-4 md:w-4 mr-2 mt-1 text-discord-red flex-shrink-0"></i>
                            <span>Remove all members from the server</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-times h-3 w-3 md:h-4 md:w-4 mr-2 mt-1 text-discord-red flex-shrink-0"></i>
                            <span>Delete all server settings and custom emojis</span>
                        </li>
                    </ul>
                    
                    <div class="pt-4">
                        <button id="open-delete-modal" class="w-full sm:w-auto bg-discord-red hover:bg-red-700 text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-md transition-colors text-sm md:text-base">
                            Delete Server
                        </button>
                    </div>
                </div>
            </div>
        <?php elseif ($section === 'profile'): ?>       
            <div class="p-4 md:p-6 lg:p-10 max-w-full lg:max-w-[740px]">
                <div class="mb-6 md:mb-8">
                    <h1 class="text-xl md:text-2xl font-bold mb-2">Server Profile</h1>
                    <p class="text-sm md:text-base text-discord-lighter">Customize your server's appearance and profile information</p>
                </div>
                
                <form id="server-profile-form" class="space-y-6 md:space-y-8">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <div class="bg-discord-darker rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
                        <div class="form-group">
                            <label for="server-name" class="block text-sm font-medium text-white mb-2">Server Name</label>
                            <div class="flex flex-col sm:flex-row gap-2">
                                <input type="text" id="server-name" name="name" class="form-input bg-discord-dark-input text-white border-none focus:ring-2 focus:ring-discord-primary flex-grow text-sm md:text-base" value="<?php echo htmlspecialchars($server->name); ?>" data-original-value="<?php echo htmlspecialchars($server->name); ?>">
                                <button type="button" id="approve-server-name" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md hidden approve-btn flex-shrink-0">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="server-description" class="block text-sm font-medium text-white mb-2">Description</label>
                            <div class="flex flex-col sm:flex-row gap-2">
                                <textarea id="server-description" name="description" class="form-input bg-discord-dark-input text-white border-none h-20 md:h-24 resize-none focus:ring-2 focus:ring-discord-primary flex-grow text-sm md:text-base" placeholder="Tell people what your server is about..." data-original-value="<?php echo htmlspecialchars($server->description ?? ''); ?>"><?php echo htmlspecialchars($server->description ?? ''); ?></textarea>
                                <button type="button" id="approve-server-description" class="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md hidden approve-btn self-start flex-shrink-0">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                            <p class="text-xs text-discord-lighter mt-1">This description will be shown in server discovery and invites.</p>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-4 md:p-6">
                        <h3 class="text-base md:text-lg font-medium mb-4">Server Identity</h3>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                            <div class="form-group">
                                <label class="block text-sm font-medium text-white mb-2">Icon</label>
                                <p class="text-discord-lighter text-xs mb-3">Recommended: 512x512 or larger square image</p>
                                
                                <div id="server-icon-container" class="relative w-20 h-20 md:w-24 md:h-24 bg-discord-dark-input rounded-full overflow-hidden border border-discord-darker cursor-pointer hover:opacity-90 transition-opacity mx-auto lg:mx-0">
                                    <?php if ($server->image_url): ?>
                                        <img id="server-icon-preview" src="<?php echo htmlspecialchars($server->image_url); ?>" alt="Server Icon" class="w-full h-full object-cover">
                                    <?php else: ?>
                                        <div id="server-icon-placeholder" class="w-full h-full flex items-center justify-center">
                                            <img src="/public/assets/common/default-profile-picture.png" alt="Default Server Icon" class="w-full h-full object-cover">
                                        </div>
                                    <?php endif; ?>
                                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div class="text-white text-xs md:text-sm font-medium text-center px-1">CHANGE</div>
                                    </div>
                                </div>
                                <input type="file" id="server-icon-input" class="hidden" accept="image/jpeg,image/png,image/gif">
                            </div>
                            
                            <div class="form-group">
                                <label class="block text-sm font-medium text-white mb-2">Banner</label>
                                <p class="text-discord-lighter text-xs mb-3">Recommended: 960x540 or larger (16:9 ratio)</p>
                                
                                <div id="server-banner-container" class="relative w-full h-24 md:h-32 bg-discord-dark-input rounded-md overflow-hidden border border-discord-darker cursor-pointer hover:opacity-90 transition-opacity">
                                    <?php if ($server->banner_url): ?>
                                        <img id="server-banner-preview" src="<?php echo htmlspecialchars($server->banner_url); ?>" alt="Server Banner" class="w-full h-full object-cover">
                                    <?php else: ?>
                                        <div id="server-banner-placeholder" class="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#7a8087] to-[#36393f]">
                                            <div class="text-white text-xs md:text-sm font-medium text-center px-2">UPLOAD BANNER</div>
                                        </div>
                                    <?php endif; ?>
                                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div class="text-white text-xs md:text-sm font-medium text-center px-2">CHANGE BANNER</div>
                                    </div>
                                </div>
                                <input type="file" id="server-banner-input" class="hidden" accept="image/jpeg,image/png,image/gif">
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
                        <h3 class="text-base md:text-lg font-medium mb-4">Discovery Settings</h3>
                        
                        <div class="form-group">
                            <label for="is-public" class="flex items-start sm:items-center cursor-pointer">
                                <input type="checkbox" id="is-public" name="is_public" class="custom-checkbox absolute opacity-0 w-5 h-5 cursor-pointer z-10 mt-0.5 sm:mt-0" <?php echo $server->is_public ? 'checked' : ''; ?> data-original-value="<?php echo $server->is_public ? '1' : '0'; ?>">
                                <div class="checkbox-wrapper flex items-center justify-center w-5 h-5 bg-discord-dark-input rounded border border-discord-darker flex-shrink-0 mt-0.5 sm:mt-0">
                                    <svg class="checkbox-check w-3.5 h-3.5 text-white opacity-0 transform scale-50 transition-all duration-100" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <span class="ml-2 text-sm text-white" id="public-label"><?php echo $server->is_public ? 'Make this server private' : 'Make this server public'; ?></span>
                            </label>
                            <p class="text-discord-lighter text-xs ml-0 sm:ml-7 mt-2"><?php echo $server->is_public ? 'Your server is currently discoverable by anyone' : 'Your server is currently private and not discoverable'; ?></p>
                        </div>
                        
                        <div class="form-group">
                            <label for="server-category" class="block text-sm font-medium text-white mb-2">Category</label>
                            <div class="flex flex-col sm:flex-row gap-2">
                                <select id="server-category" name="category" class="form-input bg-discord-dark-input text-white border-none focus:ring-2 focus:ring-discord-primary flex-grow text-sm md:text-base" data-original-value="<?php echo htmlspecialchars($server->category ?? ''); ?>">
                                    <option value="">Select a category</option>
                                    <?php foreach ($categories as $value => $label): ?>
                                        <option value="<?php echo htmlspecialchars($value); ?>" <?php echo ($server->category === $value) ? 'selected' : ''; ?>><?php echo htmlspecialchars($label); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" id="approve-server-category" class="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md hidden approve-btn flex-shrink-0">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                            <p class="text-xs text-discord-lighter mt-1">Choose a category that best describes your server</p>
                        </div>
                    </div>
                    
                </form>
            </div>

        <?php elseif ($section === 'roles'): ?>
            <div class="p-4 md:p-6 lg:p-10 max-w-full lg:max-w-[740px]">
                <h1 class="text-xl md:text-2xl font-bold mb-2">Member Management</h1>
                <p class="text-sm md:text-base text-discord-lighter mb-4 md:mb-6">Promote or demote server members to manage permissions and access.</p>
                
                <div class="members-header-section">
                    <div class="members-controls flex flex-col sm:flex-row gap-3 mb-4">
                        <div class="search-container flex-grow">
                            <div class="search-input-wrapper relative">
                                <i class="fas fa-search search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-discord-lighter text-sm"></i>
                                <input type="text" id="member-search" class="w-full pl-10 pr-4 py-2 bg-discord-dark-input text-white rounded-md border border-discord-darker focus:ring-2 focus:ring-discord-primary text-sm" placeholder="Search members">
                            </div>
                        </div>
                        
                        <div class="controls-right">
                            <div id="member-filter" class="filter-dropdown-container relative">
                                <button type="button" class="filter-button flex items-center justify-between w-full sm:w-auto bg-discord-dark-input text-white px-4 py-2 rounded-md border border-discord-darker hover:bg-discord-bg-hover text-sm">
                                    <span class="filter-selected-text">All Members</span>
                                    <i class="fas fa-chevron-down filter-arrow ml-2 text-xs"></i>
                                </button>
                                
                                <div id="filter-dropdown" class="filter-dropdown absolute top-full right-0 mt-1 bg-discord-darker border border-discord-dark rounded-md shadow-lg z-20 min-w-[150px] hidden">
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="all">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="filter" checked class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>All Members</span>
                                    </div>
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="owner">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="filter" class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>Owners</span>
                                    </div>
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="admin">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="filter" class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>Admins</span>
                                    </div>
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="member">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="filter" class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>Members</span>
                                    </div>
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="bot">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="filter" class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>Bots</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="members-table-container bg-discord-darker rounded-lg overflow-hidden">
                    <div class="members-table-header hidden md:grid grid-cols-12 gap-4 p-4 bg-discord-bg-secondary text-discord-lighter text-xs font-semibold uppercase">
                        <div class="col-span-5">USER</div>
                        <div class="col-span-2">ROLE</div>
                        <div class="col-span-3">JOINED</div>
                        <div class="col-span-2">ACTIONS</div>
                    </div>

                    <div id="members-list" class="members-list-content min-h-[200px]">
                        <div class="loading-state flex items-center justify-center py-8">
                            <i class="fas fa-spinner fa-spin mr-3 text-discord-blurple"></i>
                            <span class="text-discord-lighter">Loading members...</span>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-discord-lighter mt-3">
                    <p><i class="fas fa-info-circle mr-1"></i> Only server owners can promote/demote members. Admins can kick members.</p>
                </div>
                                        
                <template id="member-template">
                    <div class="member-item grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-discord-dark hover:bg-discord-bg-hover transition-colors">
                        <div class="md:col-span-5 flex items-center">
                            <div class="member-avatar-wrapper flex items-center">
                                <div class="member-avatar w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                    <img src="" alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <div class="member-info min-w-0">
                                    <div class="member-username text-white font-medium text-sm md:text-base truncate"></div>
                                    <div class="member-discriminator text-discord-lighter text-xs truncate"></div>
                                </div>
                            </div>
                        </div>
                        <div class="md:col-span-2 flex items-center">
                            <div class="member-role-badge text-xs font-medium px-2 py-1 rounded-full"></div>
                        </div>
                        <div class="md:col-span-3 flex items-center">
                            <div class="member-joined text-discord-lighter text-xs md:text-sm"></div>
                        </div>
                        <div class="md:col-span-2 flex items-center justify-end md:justify-start">
                            <div class="member-actions flex gap-1 opacity-0 md:opacity-100">
                                <button class="promote-btn action-btn w-8 h-8 rounded-md bg-discord-bg-tertiary hover:bg-green-600 text-discord-lighter hover:text-white transition-colors text-xs" title="Promote Member">
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                                <button class="demote-btn action-btn w-8 h-8 rounded-md bg-discord-bg-tertiary hover:bg-yellow-600 text-discord-lighter hover:text-white transition-colors text-xs" title="Demote Member">
                                    <i class="fas fa-arrow-down"></i>
                                </button>
                                <button class="kick-btn action-btn w-8 h-8 rounded-md bg-discord-bg-tertiary hover:bg-red-600 text-discord-lighter hover:text-white transition-colors text-xs" title="Kick Member">
                                    <i class="fas fa-user-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div id="member-action-modal" class="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden p-4">
                <div class="modal-container bg-discord-darker rounded-lg max-w-md w-full mx-4">
                    <div class="modal-header flex items-center p-4 border-b border-discord-dark">
                        <div class="modal-icon w-10 h-10 bg-discord-blurple bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-user-cog text-discord-blurple"></i>
                        </div>
                        <h3 class="modal-title text-lg font-semibold text-white">Confirm Action</h3>
                    </div>
                    
                    <div class="modal-body p-4 space-y-4">
                        <div class="member-preview flex items-center p-3 bg-discord-bg-tertiary rounded-md">
                            <div class="member-avatar-small w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                
                            </div>
                            <div class="member-details min-w-0">
                                <div class="member-name text-white font-medium truncate"></div>
                                <div class="member-current-role text-discord-lighter text-sm truncate"></div>
                            </div>
                        </div>
                        
                        <div class="action-description">
                            <p class="action-message text-discord-lighter text-sm"></p>
                            <div class="role-change-preview hidden mt-3 p-3 bg-discord-bg-secondary rounded-md">
                                <div class="flex items-center justify-between">
                                    <div class="role-change-from text-center">
                                        <span class="role-label text-xs text-discord-lighter block mb-1">From:</span>
                                        <span class="role-badge from-role px-2 py-1 rounded-full text-xs font-medium"></span>
                                    </div>
                                    <div class="role-change-arrow mx-4">
                                        <i class="fas fa-arrow-right text-discord-lighter"></i>
                                    </div>
                                    <div class="role-change-to text-center">
                                        <span class="role-label text-xs text-discord-lighter block mb-1">To:</span>
                                        <span class="role-badge to-role px-2 py-1 rounded-full text-xs font-medium"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="warning-notice flex items-center p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-md">
                            <i class="fas fa-exclamation-triangle text-yellow-500 mr-2 flex-shrink-0"></i>
                            <span class="warning-text text-yellow-200 text-sm">This action cannot be undone.</span>
                        </div>
                    </div>
                    
                    <div class="modal-footer flex justify-end gap-3 p-4 border-t border-discord-dark">
                        <button class="modal-btn modal-btn-cancel px-4 py-2 text-discord-lighter hover:text-white bg-discord-bg-tertiary hover:bg-discord-bg-hover rounded-md transition-colors text-sm" id="modal-cancel-btn">
                            <i class="fas fa-times mr-2"></i>
                            Cancel
                        </button>
                        <button class="modal-btn modal-btn-confirm px-4 py-2 text-white bg-discord-blurple hover:bg-discord-blurple-dark rounded-md transition-colors text-sm" id="modal-confirm-btn">
                            <i class="fas fa-check mr-2"></i>
                            <span class="confirm-text">Confirm</span>
                        </button>
                    </div>
                </div>
            </div>

        <?php elseif ($section === 'channels'): ?>
            <div class="p-4 md:p-6 lg:p-10 max-w-full lg:max-w-[740px]">
                <h1 class="text-xl md:text-2xl font-bold mb-2">Channel Management</h1>
                <p class="text-sm md:text-base text-discord-lighter mb-4 md:mb-6">Manage channel names and settings for your server.</p>
                
                <div class="channels-header-section">
                    <div class="channels-controls flex flex-col sm:flex-row gap-3 mb-4">
                        <div class="search-container flex-grow">
                            <div class="search-input-wrapper relative">
                                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-discord-lighter text-sm"></i>
                                <input type="text" id="channel-search" class="w-full pl-10 pr-4 py-2 bg-discord-dark-input text-white rounded-md border border-discord-darker focus:ring-2 focus:ring-discord-primary text-sm" placeholder="Search channels">
                            </div>
                        </div>
                        
                        <div class="controls-right">
                            <div id="channel-filter" class="filter-dropdown-container relative">
                                <button type="button" class="filter-button flex items-center justify-between w-full sm:w-auto bg-discord-dark-input text-white px-4 py-2 rounded-md border border-discord-darker hover:bg-discord-bg-hover text-sm">
                                    <span class="filter-selected-text">All Channels</span>
                                    <i class="fas fa-chevron-down filter-arrow ml-2 text-xs"></i>
                                </button>
                                
                                <div id="channel-filter-dropdown" class="filter-dropdown absolute top-full right-0 mt-1 bg-discord-darker border border-discord-dark rounded-md shadow-lg z-20 min-w-[150px] hidden">
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="all">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="channel-filter" checked class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>All Channels</span>
                                    </div>
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="text">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="channel-filter" class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>Text Channels</span>
                                    </div>
                                    <div class="filter-option flex items-center px-3 py-2 hover:bg-discord-bg-hover cursor-pointer text-sm" data-filter="voice">
                                        <div class="radio-container mr-2">
                                            <input type="radio" name="channel-filter" class="radio-input sr-only">
                                            <div class="radio-dot w-3 h-3 rounded-full border border-discord-lighter"></div>
                                        </div>
                                        <span>Voice Channels</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="channels-table-container bg-discord-darker rounded-lg overflow-hidden">
                    <div class="channels-table-header hidden md:grid grid-cols-12 gap-4 p-4 bg-discord-bg-secondary text-discord-lighter text-xs font-semibold uppercase">
                        <div class="col-span-1"></div>
                        <div class="col-span-5">CHANNEL</div>
                        <div class="col-span-2">TYPE</div>
                        <div class="col-span-4">ACTIONS</div>
                    </div>

                    <div id="channels-list" class="channels-list-content min-h-[200px]">
                        <div class="channels-loading-state flex items-center justify-center py-8">
                            <i class="fas fa-spinner fa-spin mr-3 text-discord-blurple"></i>
                            <span class="text-discord-lighter">Loading channels...</span>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-discord-lighter mt-3">
                    <p><i class="fas fa-info-circle mr-1"></i> Only server owners and admins can manage channels.</p>
                </div>
                                        
                <template id="channel-template">
                    <div class="channel-item grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-discord-dark hover:bg-discord-bg-hover transition-colors">
                        <div class="md:col-span-1 flex items-center justify-center md:justify-start">
                            <div class="channel-icon-wrapper w-8 h-8 flex items-center justify-center">
                                <i class="channel-icon fas fa-hashtag text-discord-lighter"></i>
                            </div>
                        </div>
                        <div class="md:col-span-5 flex items-center">
                            <div class="channel-info min-w-0 flex-grow">
                                <div class="channel-name text-white font-medium text-sm md:text-base truncate"></div>
                            </div>
                        </div>
                        <div class="md:col-span-2 flex items-center">
                            <div class="channel-type-badge text px-2 py-1 bg-discord-bg-tertiary text-discord-lighter rounded-full text-xs font-medium">text</div>
                        </div>
                        <div class="md:col-span-4 flex items-center justify-end md:justify-start">
                            <div class="channel-actions flex gap-1 opacity-0 md:opacity-100">
                                <button class="channel-action-btn channel-edit-btn rename-btn w-8 h-8 rounded-md bg-discord-bg-tertiary hover:bg-blue-600 text-discord-lighter hover:text-white transition-colors text-xs" title="Rename Channel">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="channel-action-btn channel-delete-btn delete-btn w-8 h-8 rounded-md bg-discord-bg-tertiary hover:bg-red-600 text-discord-lighter hover:text-white transition-colors text-xs" title="Delete Channel">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div id="channel-action-modal" class="channel-modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden p-4">
                <div class="channel-modal-container bg-discord-darker rounded-lg max-w-md w-full mx-4">
                    <div class="channel-modal-header flex items-center p-4 border-b border-discord-dark">
                        <div class="channel-modal-icon w-10 h-10 bg-discord-blurple bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-cog text-discord-blurple"></i>
                        </div>
                        <h3 class="channel-modal-title text-lg font-semibold text-white">Confirm Action</h3>
                    </div>
                    
                    <div class="channel-modal-body p-4 space-y-4">
                        <div class="channel-preview flex items-center p-3 bg-discord-bg-tertiary rounded-md">
                            <div class="channel-icon-small w-10 h-10 bg-discord-bg-secondary rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                                <i class="fas fa-hashtag text-discord-lighter"></i>
                            </div>
                            <div class="channel-details min-w-0">
                                <div class="channel-modal-name text-white font-medium truncate"></div>
                            </div>
                        </div>
                        
                        <div class="action-description">
                            <p class="action-message text-discord-lighter text-sm"></p>
                            
                            <div class="rename-input-container hidden mt-3">
                                <div class="channel-edit-form">
                                    <div class="form-group">
                                        <label for="new-channel-name" class="block text-sm font-medium text-white mb-2">New Name</label>
                                        <input type="text" id="new-channel-name" class="form-input" placeholder="Enter new channel name">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="channel-modal-footer flex justify-end gap-3 p-4 border-t border-discord-dark">
                        <button class="channel-modal-btn channel-modal-btn-cancel px-4 py-2 text-discord-lighter hover:text-white bg-discord-bg-tertiary hover:bg-discord-bg-hover rounded-md transition-colors text-sm" id="channel-modal-cancel-btn">
                            Cancel
                        </button>
                        <button class="channel-modal-btn channel-modal-btn-confirm px-4 py-2 text-white bg-discord-blurple hover:bg-discord-blurple-dark rounded-md transition-colors text-sm" id="channel-modal-confirm-btn">
                            <span class="confirm-text">Confirm</span>
                        </button>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="p-4 md:p-6 lg:p-10 max-w-full lg:max-w-[740px]">
                <h1 class="text-xl md:text-2xl font-bold mb-4 md:mb-6"><?php echo ucfirst($section); ?></h1>
                <p class="text-sm md:text-base text-discord-lighter">This section is under development.</p>
                
                <div class="bg-discord-darker rounded-lg p-6 mt-6">
                    <p class="text-center text-discord-lighter">Coming soon!</p>
                </div>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="hidden xl:block w-80 bg-discord-dark border-l border-discord-dark">
        <div class="sticky top-6 p-4">
            <h3 class="text-sm font-semibold text-discord-lighter uppercase mb-4">Preview</h3>
            
            <div class="server-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
                <div class="server-banner h-32 md:h-40 <?php echo $server->banner_url ? '' : 'bg-gradient-to-b from-[#7a8087] to-[#36393f]'; ?>" 
                     <?php echo $server->banner_url ? 'style="background-image: url(\'' . htmlspecialchars($server->banner_url) . '\'); background-size: cover; background-position: center;"' : ''; ?>>
                    <div class="server-icon-preview absolute -bottom-6 md:-bottom-8 left-4 w-12 h-12 md:w-16 md:h-16 bg-discord-dark rounded-full border-4 border-[#1e1f22] overflow-hidden">
                        <?php if ($server->image_url): ?>
                            <img src="<?php echo htmlspecialchars($server->image_url); ?>" alt="Server Icon" class="w-full h-full object-cover">
                        <?php else: ?>
                            <img src="/public/assets/common/default-profile-picture.png" alt="Default Server Icon" class="w-full h-full object-cover">
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="server-info pt-8 md:pt-10 px-4 pb-4">
                    <h3 class="server-name text-white font-bold text-sm md:text-base truncate"><?php echo htmlspecialchars($server->name); ?></h3>
                    <?php if ($server->description): ?>
                        <div class="server-description text-xs text-discord-lighter mt-2 md:mt-3 line-clamp-3"><?php echo htmlspecialchars($server->description); ?></div>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="mt-4 text-xs text-discord-lighter">
                <p class="mb-2">This is how your server will appear to others.</p>
                <p>Changes will be applied after saving.</p>
            </div>
        </div>
    </div>
    
    <a href="/server/<?php echo $serverId; ?>" class="close-button fixed top-4 right-4 lg:top-6 lg:right-6 bg-discord-bg-tertiary hover:bg-discord-bg-hover text-discord-lighter hover:text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors z-30">
        <i class="fas fa-times text-sm"></i>
    </a>
</div>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

<?php include dirname(dirname(__DIR__)) . '/views/components/server/delete-server-modal.php'; ?>