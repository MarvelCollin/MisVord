<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Use controller to handle business logic
require_once dirname(dirname(__DIR__)) . '/controllers/SettingsController.php';
$settingsController = new SettingsController();
$settingsData = $settingsController->prepareSettingsData();

// Extract data for the view
$server = $settingsData['server'];
$channel = $settingsData['channel'];
$serverId = $settingsData['serverId'];
$channelId = $settingsData['channelId'];
$section = $settingsData['section'];

// Page configuration
$page_title = 'misvord - Settings';
$body_class = 'bg-discord-dark text-white';
$page_css = 'settings-page';
$page_js = 'settings-page';
$additional_js = ['server-dropdown.js'];

// Start output buffering
ob_start();
?>

<div class="flex min-h-screen">
    <!-- Side Navigation -->
    <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/server-sidebar.php'; ?>
    
    <!-- Main Content -->
    <div class="flex-1 flex">
        <!-- Settings Sidebar -->
        <div class="w-64 bg-discord-light border-r border-discord-dark">
            <div class="p-4 border-b border-discord-dark">
                <?php if ($channel): ?>
                <h2 class="text-xl font-semibold">
                    <span class="text-discord-lighter">#</span> <?php echo htmlspecialchars($channel->name); ?>
                </h2>
                <?php else: ?>
                <h2 class="text-xl font-semibold"><?php echo htmlspecialchars($server->name); ?></h2>
                <?php endif; ?>
            </div>
            
            <nav class="mt-4">
                <ul>
                    <li>
                        <a href="?server_id=<?php echo $serverId; ?>&section=overview" class="flex items-center p-3 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'overview' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                            Overview
                        </a>
                    </li>
                    <li>
                        <a href="?server_id=<?php echo $serverId; ?>&section=permissions" class="flex items-center p-3 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'permissions' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                            Permissions
                        </a>
                    </li>
                    <li>
                        <a href="?server_id=<?php echo $serverId; ?>&section=invites" class="flex items-center p-3 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'invites' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                            Invites
                        </a>
                    </li>
                    <li>
                        <a href="?server_id=<?php echo $serverId; ?>&section=integrations" class="flex items-center p-3 text-discord-light-gray hover:bg-discord-dark-hover <?php echo $section === 'integrations' ? 'bg-discord-dark-hover text-white' : ''; ?>">
                            Integrations
                        </a>
                    </li>
                    <li class="mt-8">
                        <a href="#" id="delete-channel-btn" class="flex items-center p-3 text-red-500 hover:bg-red-500/10">
                            Delete Channel
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
        
        <!-- Settings Content -->
        <div class="flex-1 bg-discord-background overflow-y-auto">
            <?php if ($section === 'overview'): ?>
                <div class="p-8">
                    <h1 class="text-2xl font-bold mb-4">Overview</h1>
                    
                    <form id="channel-overview-form" class="space-y-6">
                        <div class="form-group">
                            <label for="channel-name" class="block text-sm font-medium text-discord-lighter mb-1">Channel Name</label>
                            <div class="relative">
                                <span class="absolute left-3 top-3 text-discord-lighter">#</span>
                                <input type="text" id="channel-name" name="channel_name" class="bg-discord-dark text-white pl-8 p-2 w-full rounded-md focus:ring-2 focus:ring-discord-blue focus:outline-none" value="<?php echo $channel ? htmlspecialchars($channel->name) : ''; ?>">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="channel-topic" class="block text-sm font-medium text-discord-lighter mb-1">Channel Topic</label>
                            <textarea id="channel-topic" name="channel_topic" class="bg-discord-dark text-white p-2 w-full rounded-md focus:ring-2 focus:ring-discord-blue focus:outline-none h-24"><?php echo $channel && $channel->topic ? htmlspecialchars($channel->topic) : ''; ?></textarea>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="bg-discord-blue hover:bg-discord-blue-dark text-white font-medium py-2 px-4 rounded-md">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            <?php elseif ($section === 'permissions'): ?>
                <div class="p-8">
                    <h1 class="text-2xl font-bold mb-2">Channel Permissions</h1>
                    <p class="text-discord-lighter mb-6">Use permissions to customize who can do what in this channel.</p>
                    
                    <div class="bg-discord-dark rounded-md p-4 mb-8 flex items-center">
                        <div class="flex items-center text-discord-blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <span class="font-medium">Permissions synced with category:</span>
                        </div>
                        <span class="ml-2 text-red-500 font-medium">IMPORTANT THINGS</span>
                    </div>
                    
                    <div class="bg-discord-dark rounded-md p-4 mb-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <span class="font-medium">Private Channel</span>
                            </div>
                            
                            <label class="switch">
                                <input type="checkbox" id="private-channel-toggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        
                        <p class="text-discord-lighter mt-2 text-sm">By making a channel private, only select members and roles will be able to view this channel.</p>
                    </div>
                    
                    <h3 class="text-lg font-semibold mb-4">Advanced Permissions</h3>
                    
                    <div class="bg-discord-dark rounded-md p-4">
                        <div class="flex items-center justify-between border-b border-discord-background pb-4 mb-4">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                    <span class="text-white font-bold">@</span>
                                </div>
                                <span>everyone</span>
                            </div>
                            
                            <button class="text-discord-blue hover:underline">Edit</button>
                        </div>
                        
                        <div class="permission-list space-y-4">
                            <div class="flex items-center justify-between">
                                <span>View Channel</span>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <span>Send Messages</span>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <span>Embed Links</span>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <span>Attach Files</span>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            <?php elseif ($section === 'invites'): ?>
                <div class="p-8">
                    <h1 class="text-2xl font-bold mb-6">Invites</h1>
                    
                    <button class="bg-discord-blue hover:bg-discord-blue-dark text-white font-medium py-2 px-4 rounded-md mb-6">
                        Create Invite
                    </button>
                    
                    <div class="bg-discord-dark rounded-md p-4">
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="font-semibold">https://misvord.com/join/abcdef123</h3>
                                    <div class="text-sm text-discord-lighter mt-1">
                                        <span>0 uses</span>
                                        <span class="mx-2">•</span>
                                        <span>Never expires</span>
                                    </div>
                                </div>
                                
                                <div class="flex items-center">
                                    <button class="text-discord-blue hover:underline mr-4">Edit</button>
                                    <button class="text-red-500 hover:underline">Revoke</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            <?php elseif ($section === 'integrations'): ?>
                <div class="p-8">
                    <h1 class="text-2xl font-bold mb-6">Integrations</h1>
                    
                    <div class="bg-discord-dark rounded-md p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-4 text-discord-lighter">
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <path d="M3 9h18"></path>
                            <path d="M9 21V9"></path>
                        </svg>
                        
                        <h3 class="text-xl font-semibold mb-2">No Integrations Yet</h3>
                        <p class="text-discord-lighter mb-4">Connect your server with apps from the App Directory.</p>
                        
                        <button class="bg-discord-blue hover:bg-discord-blue-dark text-white font-medium py-2 px-6 rounded-md">
                            Explore App Directory
                        </button>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Delete Channel Confirmation Modal -->
<div id="delete-channel-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-discord-dark rounded-lg max-w-md w-full p-6">
        <h3 class="text-xl font-bold mb-2">Delete Channel</h3>
        <p class="text-discord-lighter mb-6">Are you sure you want to delete this channel? This action cannot be undone.</p>
        
        <div class="flex justify-end space-x-3">
            <button id="cancel-delete-channel" class="px-4 py-2 text-white bg-discord-light hover:bg-discord-light-hover rounded-md">
                Cancel
            </button>
            <button id="confirm-delete-channel" class="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md">
                Delete Channel
            </button>
        </div>
    </div>
</div>

<style>
/* Toggle Switch Styles */
.switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #36393f;
    transition: .4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: #72767d;
    transition: .4s;
}

input:checked + .slider {
    background-color: #5865f2;
}

input:checked + .slider:before {
    transform: translateX(16px);
    background-color: white;
}

.slider.round {
    border-radius: 24px;
}

.slider.round:before {
    border-radius: 50%;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Delete channel modal functionality
    const deleteBtn = document.getElementById('delete-channel-btn');
    const deleteModal = document.getElementById('delete-channel-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-channel');
    const confirmDeleteBtn = document.getElementById('confirm-delete-channel');
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            deleteModal.classList.remove('hidden');
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.classList.add('hidden');
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            // Send delete request to server
            const channelId = '<?php echo $channelId; ?>';
            const serverId = '<?php echo $serverId; ?>';
            
            if (channelId) {
                fetch(`/api/channels/${channelId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = `/server/${serverId}`;
                    } else {
                        alert('Failed to delete channel: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while trying to delete the channel.');
                });
            }
        });
    }
});
</script>

<?php 
$content = ob_get_clean();
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?> 