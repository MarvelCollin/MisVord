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

<div class="flex min-h-screen mx-auto mt-10">
    <div class="w-60 bg-discord-light border-r border-discord-dark lg:w-60 md:w-48 sm:w-full sm:border-r-0 sm:border-b sm:border-discord-dark">
        <div class="p-4">
            <div class="text-sm font-semibold text-white"><?php echo htmlspecialchars($server->name); ?></div>
            <div class="text-xs text-discord-lighter mt-1">Server Settings</div>
        </div>
        
        <nav class="mt-2 pb-4 sm:pb-0">
            <ul class="sm:flex sm:flex-row sm:justify-around sm:px-4">
                <li class="sm:flex-1">
                    <a href="?server_id=<?php echo $serverId; ?>&section=profile" class="sidebar-item <?php echo $section === 'profile' ? 'active' : ''; ?> sm:text-center sm:px-2">
                        <span class="sm:text-xs lg:text-sm">Server Profile</span>
                    </a>
                </li>
                
                <li class="mt-6 sm:mt-0 sm:hidden">
                    <div class="sidebar-category">
                        <span>CHANNELS</span>
                    </div>
                </li>
                <li class="sm:flex-1">
                    <a href="?server_id=<?php echo $serverId; ?>&section=channels" class="sidebar-item <?php echo $section === 'channels' ? 'active' : ''; ?> sm:text-center sm:px-2">
                        <span class="sm:text-xs lg:text-sm">Channels</span>
                    </a>
                </li>
                
                <li class="mt-6 sm:mt-0 sm:hidden">
                    <div class="sidebar-category">
                        <span>PEOPLE</span>
                    </div>
                </li>
                <li class="sm:flex-1">
                    <a href="?server_id=<?php echo $serverId; ?>&section=roles" class="sidebar-item <?php echo $section === 'roles' ? 'active' : ''; ?> sm:text-center sm:px-2">
                        <span class="sm:text-xs lg:text-sm">Members</span>
                    </a>
                </li>
                
                <li class="mt-6 sm:mt-0 sm:hidden">
                    <div class="sidebar-category">
                        <span>DANGER ZONE</span>
                    </div>
                </li>
                <li class="sm:flex-1">
                    <a href="?server_id=<?php echo $serverId; ?>&section=delete" class="sidebar-item text-discord-red <?php echo $section === 'delete' ? 'active' : ''; ?> sm:text-center sm:px-2">
                        <span class="sm:text-xs lg:text-sm">Delete</span>
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <?php if ($section === 'delete'): ?>
            <div class="p-10 max-w-[740px] sm:p-4 sm:max-w-none">
                <div class="mb-8 sm:mb-6">
                    <h1 class="text-2xl font-bold mb-2 text-discord-red sm:text-xl">Delete Server</h1>
                    <p class="text-discord-lighter sm:text-sm">This action is permanent and cannot be undone</p>
                </div>
                
                <div class="bg-discord-darker rounded-lg p-6 space-y-6 sm:p-4 sm:space-y-4">
                    <div class="bg-discord-red bg-opacity-10 text-discord-red border-l-4 border-discord-red px-4 py-3 rounded-r sm:px-3 sm:py-2">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle h-5 w-5 mr-2 sm:h-4 sm:w-4"></i>
                            <span class="font-medium sm:text-sm">This action cannot be undone</span>
                        </div>
                    </div>
                    
                    <p class="text-white sm:text-sm">
                        Deleting this server will:
                    </p>
                    
                    <ul class="ml-6 space-y-2 text-discord-lighter sm:ml-4 sm:space-y-1 sm:text-sm">
                        <li class="flex items-center">
                            <i class="fas fa-times h-4 w-4 mr-2 text-discord-red sm:h-3 sm:w-3"></i>
                            Permanently delete all channels and their content
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-times h-4 w-4 mr-2 text-discord-red sm:h-3 sm:w-3"></i>
                            Remove all members from the server
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-times h-4 w-4 mr-2 text-discord-red sm:h-3 sm:w-3"></i>
                            Delete all server settings and custom emojis
                        </li>
                    </ul>
                    
                    <div class="pt-4 sm:pt-3">
                        <button id="open-delete-modal" class="bg-discord-red hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition-colors sm:py-3 sm:px-4 sm:w-full sm:text-base">
                            Delete Server
                        </button>
                    </div>
                </div>
            </div>
        <?php elseif ($section === 'profile'): ?>       
            <div class="p-10 max-w-[740px] sm:p-4 sm:max-w-none">
                <div class="mb-8 sm:mb-6">
                    <h1 class="text-2xl font-bold mb-2 sm:text-xl">Server Profile</h1>
                    <p class="text-discord-lighter sm:text-sm">Customize your server's appearance and profile information</p>
                </div>
                
                <form id="server-profile-form" class="space-y-8 sm:space-y-6">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <div class="bg-discord-darker rounded-lg p-6 space-y-6 sm:p-4 sm:space-y-4">
                        <div class="form-group">
                            <label for="server-name" class="block text-sm font-medium text-white mb-2">Server Name</label>
                            <div class="flex sm:flex-col sm:gap-2">
                                <input type="text" id="server-name" name="name" class="form-input bg-discord-dark-input text-white border-none focus:ring-2 focus:ring-discord-primary flex-grow" value="<?php echo htmlspecialchars($server->name); ?>" data-original-value="<?php echo htmlspecialchars($server->name); ?>">
                                <button type="button" id="approve-server-name" class="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md hidden approve-btn sm:ml-0 sm:w-full">
                                    <i class="fas fa-check mr-2 sm:mr-1"></i><span class="hidden sm:inline">Update Name</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="server-description" class="block text-sm font-medium text-white mb-2">Description</label>
                            <div class="flex sm:flex-col sm:gap-2">
                                <textarea id="server-description" name="description" class="form-input bg-discord-dark-input text-white border-none h-24 resize-none focus:ring-2 focus:ring-discord-primary flex-grow" placeholder="Tell people what your server is about..." data-original-value="<?php echo htmlspecialchars($server->description ?? ''); ?>"><?php echo htmlspecialchars($server->description ?? ''); ?></textarea>
                                <button type="button" id="approve-server-description" class="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 rounded-md hidden approve-btn self-start mt-0 sm:ml-0 sm:w-full sm:self-auto sm:mt-0">
                                    <i class="fas fa-check mr-2 sm:mr-1"></i><span class="hidden sm:inline">Update Description</span>
                                </button>
                            </div>
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
                                        <div id="server-icon-placeholder" class="w-full h-full flex items-center justify-center">
                                            <img src="/public/assets/common/default-profile-picture.png" alt="Default Server Icon" class="w-full h-full object-cover">
                                        </div>
                                    <?php endif; ?>
                                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div class="text-white text-sm font-medium">CHANGE</div>
                                    </div>
                                </div>
                                <input type="file" id="server-icon-input" class="hidden" accept="image/jpeg,image/png,image/gif">
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
                                <input type="file" id="server-banner-input" class="hidden" accept="image/jpeg,image/png,image/gif">
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-6 space-y-6">
                        <h3 class="text-lg font-medium mb-4">Discovery Settings</h3>
                        
                        <div class="form-group">
                            <label for="is-public" class="flex items-center cursor-pointer">
                                <input type="checkbox" id="is-public" name="is_public" class="custom-checkbox absolute opacity-0 w-5 h-5 cursor-pointer z-10" <?php echo $server->is_public ? 'checked' : ''; ?> data-original-value="<?php echo $server->is_public ? '1' : '0'; ?>">
                                <div class="checkbox-wrapper flex items-center justify-center w-5 h-5 bg-discord-dark-input rounded border border-discord-darker">
                                    <svg class="checkbox-check w-3.5 h-3.5 text-white opacity-0 transform scale-50 transition-all duration-100" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <span class="ml-2 text-sm text-white" id="public-label"><?php echo $server->is_public ? 'Make this server private' : 'Make this server public'; ?></span>
                            </label>
                            <p class="text-discord-lighter text-xs ml-8"><?php echo $server->is_public ? 'Your server is currently discoverable by anyone' : 'Your server is currently private and not discoverable'; ?></p>
                        </div>
                        
                        <div class="form-group">
                            <label for="server-category" class="block text-sm font-medium text-white mb-2">Category</label>
                            <div class="flex">
                                <select id="server-category" name="category" class="form-input bg-discord-dark-input text-white border-none focus:ring-2 focus:ring-discord-primary flex-grow" data-original-value="<?php echo htmlspecialchars($server->category ?? ''); ?>">
                                    <option value="">Select a category</option>
                                    <?php foreach ($categories as $value => $label): ?>
                                        <option value="<?php echo htmlspecialchars($value); ?>" <?php echo ($server->category === $value) ? 'selected' : ''; ?>><?php echo htmlspecialchars($label); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" id="approve-server-category" class="ml-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 rounded-md hidden approve-btn">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                            <p class="text-xs text-discord-lighter mt-1">Choose a category that best describes your server</p>
                        </div>
                    </div>
                    
                </form>
            </div>

        <?php elseif ($section === 'roles'): ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Member Management</h1>
                <p class="text-discord-lighter mb-6">Promote or demote server members to manage permissions and access.</p>
                
                <div class="members-header-section">
                    <div class="members-controls">
                        <div class="search-container">
                            <div class="search-input-wrapper">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" id="member-search" class="search-input" placeholder="Search members">
                            </div>
                        </div>
                        
                        <div class="controls-right">
                            <div id="member-filter" class="filter-dropdown-container">
                                <button type="button" class="filter-button">
                                    <span class="filter-selected-text">All Members</span>
                                    <i class="fas fa-chevron-down filter-arrow"></i>
                                </button>
                                
                                <div id="filter-dropdown" class="filter-dropdown hidden">
                                    <div class="filter-option" data-filter="all">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" checked class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>All Members</span>
                                    </div>
                                    <div class="filter-option" data-filter="owner">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Owners</span>
                                    </div>
                                    <div class="filter-option" data-filter="admin">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Admins</span>
                                    </div>
                                    <div class="filter-option" data-filter="member">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Members</span>
                                    </div>
                                    <div class="filter-option" data-filter="bot">
                                        <div class="radio-container">
                                            <input type="radio" name="filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Bots</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="members-table-container">
                    <div class="members-table-header">
                        <div class="table-col table-col-avatar">USER</div>
                        <div class="table-col table-col-role">ROLE</div>
                        <div class="table-col table-col-joined">JOINED</div>
                        <div class="table-col table-col-actions">ACTIONS</div>
                    </div>

                    <div id="members-list" class="members-list-content">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin mr-3"></i>
                            <span>Loading members...</span>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-discord-lighter mt-3">
                    <p><i class="fas fa-info-circle mr-1"></i> Only server owners can promote/demote members. Admins can kick members.</p>
                </div>
                                        
                <template id="member-template">
                    <div class="member-item">
                        <div class="table-col table-col-avatar">
                            <div class="member-avatar-wrapper">
                                <div class="member-avatar">
                                    <img src="" alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <div class="member-info">
                                    <div class="member-username"></div>
                                    <div class="member-discriminator"></div>
                                </div>
                            </div>
                        </div>
                        <div class="table-col table-col-role">
                            <div class="member-role-badge"></div>
                        </div>
                        <div class="table-col table-col-joined">
                            <div class="member-joined"></div>
                        </div>
                        <div class="table-col table-col-actions">
                            <div class="member-actions">
                                <button class="promote-btn action-btn" title="Promote Member">
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                                <button class="demote-btn action-btn" title="Demote Member">
                                    <i class="fas fa-arrow-down"></i>
                                </button>
                                <button class="kick-btn action-btn" title="Kick Member">
                                    <i class="fas fa-user-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            
            <div id="member-action-modal" class="modal-overlay hidden">
                <div class="modal-container">
                    <div class="modal-header">
                        <div class="modal-icon">
                            <i class="fas fa-user-cog"></i>
                        </div>
                        <h3 class="modal-title">Confirm Action</h3>
                    </div>
                    
                    <div class="modal-body">
                        <div class="member-preview">
                            <div class="member-avatar-small">
                                
                            </div>
                            <div class="member-details">
                                <div class="member-name"></div>
                                <div class="member-current-role"></div>
                            </div>
                        </div>
                        
                        <div class="action-description">
                            <p class="action-message"></p>
                            <div class="role-change-preview hidden">
                                <div class="role-change-from">
                                    <span class="role-label">From:</span>
                                    <span class="role-badge from-role"></span>
                                </div>
                                <div class="role-change-arrow">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                                <div class="role-change-to">
                                    <span class="role-label">To:</span>
                                    <span class="role-badge to-role"></span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="warning-notice">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span class="warning-text">This action cannot be undone.</span>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-cancel" id="modal-cancel-btn">
                            <i class="fas fa-times mr-2"></i>
                            Cancel
                        </button>
                        <button class="modal-btn modal-btn-confirm" id="modal-confirm-btn">
                            <i class="fas fa-check mr-2"></i>
                            <span class="confirm-text">Confirm</span>
                        </button>
                    </div>
                </div>
            </div>

        <?php elseif ($section === 'channels'): ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">Channel Management</h1>
                <p class="text-discord-lighter mb-6">Manage channel names and settings for your server.</p>
                
                <div class="channels-header-section">
                    <div class="channels-controls">
                        <div class="search-container">
                            <div class="search-input-wrapper">
                                <input type="text" id="channel-search" class="search-input" placeholder="Search channels">
                            </div>
                        </div>
                        
                        <div class="controls-right">
                            <div id="channel-filter" class="filter-dropdown-container">
                                <button type="button" class="filter-button">
                                    <span class="filter-selected-text">All Channels</span>
                                    <i class="fas fa-chevron-down filter-arrow"></i>
                                </button>
                                
                                <div id="channel-filter-dropdown" class="filter-dropdown hidden">
                                    <div class="filter-option" data-filter="all">
                                        <div class="radio-container">
                                            <input type="radio" name="channel-filter" checked class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>All Channels</span>
                                    </div>
                                    <div class="filter-option" data-filter="text">
                                        <div class="radio-container">
                                            <input type="radio" name="channel-filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Text Channels</span>
                                    </div>
                                    <div class="filter-option" data-filter="voice">
                                        <div class="radio-container">
                                            <input type="radio" name="channel-filter" class="radio-input">
                                            <div class="radio-dot"></div>
                                        </div>
                                        <span>Voice Channels</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="channels-table-container">
                    <div class="channels-table-header">
                        <div class="channel-table-col channel-table-col-icon"></div>
                        <div class="channel-table-col channel-table-col-name">CHANNEL</div>
                        <div class="channel-table-col channel-table-col-type">TYPE</div>
                        <div class="channel-table-col channel-table-col-actions">ACTIONS</div>
                    </div>

                    <div id="channels-list" class="channels-list-content">
                        <div class="channels-loading-state">
                            <i class="fas fa-spinner fa-spin mr-3"></i>
                            <span>Loading channels...</span>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-discord-lighter mt-3">
                    <p><i class="fas fa-info-circle mr-1"></i> Only server owners and admins can manage channels.</p>
                </div>
                                        
                <template id="channel-template">
                    <div class="channel-item">
                        <div class="channel-icon-wrapper">
                            <i class="channel-icon fas fa-hashtag"></i>
                        </div>
                        <div class="channel-info">
                            <div class="channel-name"></div>
                        </div>
                        <div class="channel-type-badge text"></div>
                        <div class="channel-actions">
                            <button class="channel-action-btn channel-edit-btn rename-btn" title="Rename Channel">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="channel-action-btn channel-delete-btn delete-btn" title="Delete Channel">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </template>
            </div>

            
            <div id="channel-action-modal" class="channel-modal-overlay hidden">
                <div class="channel-modal-container">
                    <div class="channel-modal-header">
                        <div class="channel-modal-icon">
                            <i class="fas fa-cog"></i>
                        </div>
                        <h3 class="channel-modal-title">Confirm Action</h3>
                    </div>
                    
                    <div class="channel-modal-body">
                        <div class="channel-preview">
                            <div class="channel-icon-small">
                                <i class="fas fa-hashtag"></i>
                            </div>
                            <div class="channel-details">
                                <div class="channel-modal-name"></div>
                            </div>
                        </div>
                        
                        <div class="action-description">
                            <p class="action-message"></p>
                            
                            <div class="rename-input-container hidden">
                                <div class="channel-edit-form">
                                    <div class="form-group">
                                        <label for="new-channel-name" class="form-label">New Name</label>
                                        <input type="text" id="new-channel-name" class="form-input" placeholder="Enter new channel name">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="channel-modal-footer">
                        <button class="channel-modal-btn channel-modal-btn-cancel" id="channel-modal-cancel-btn">
                            Cancel
                        </button>
                        <button class="channel-modal-btn channel-modal-btn-confirm" id="channel-modal-confirm-btn">
                            <span class="confirm-text">Confirm</span>
                        </button>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-6"><?php echo ucfirst($section); ?></h1>
                <p class="text-discord-lighter">This section is under development.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="w-80 bg-discord-dark border-l hidden lg:block">
        <div class="sticky top-6 p-4">
            <h3 class="text-sm font-semibold text-discord-lighter uppercase mb-4">Preview</h3>
            
            <div class="server-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
                <div class="server-banner h-40 <?php echo $server->banner_url ? '' : 'bg-gradient-to-b from-[#7a8087] to-[#36393f]'; ?>" 
                     <?php echo $server->banner_url ? 'style="background-image: url(\'' . htmlspecialchars($server->banner_url) . '\'); background-size: cover; background-position: center;"' : ''; ?>>
                    <div class="server-icon-preview absolute -bottom-8 left-4 w-16 h-16 bg-discord-dark rounded-full border-4 border-[#1e1f22] overflow-hidden">
                        <?php if ($server->image_url): ?>
                            <img src="<?php echo htmlspecialchars($server->image_url); ?>" alt="Server Icon" class="w-full h-full object-cover">
                        <?php else: ?>
                            <img src="/public/assets/common/default-profile-picture.png" alt="Default Server Icon" class="w-full h-full object-cover">
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="server-info pt-10 px-4 pb-4">
                    <h3 class="server-name text-white font-bold"><?php echo htmlspecialchars($server->name); ?></h3>
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
            <i class="fas fa-times"></i>
        </div>
        <span class="close-button-text hidden sm:inline">ESC</span>
    </a>
</div>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

<?php include dirname(dirname(__DIR__)) . '/views/components/server/delete-server-modal.php'; ?>
