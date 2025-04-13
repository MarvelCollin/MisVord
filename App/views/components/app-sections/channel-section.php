<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Get current server and its channels
$currentServer = $GLOBALS['currentServer'] ?? null;
$categories = [];
$uncategorizedChannels = [];

if ($currentServer) {
    require_once dirname(dirname(dirname(__DIR__))) . '/database/models/Category.php';
    require_once dirname(dirname(dirname(__DIR__))) . '/database/models/Channel.php';
    
    // Get categories for this server
    $categories = Category::getByServer($currentServer->id);
    
    // Get uncategorized channels (where category_id is null)
    $uncategorizedChannels = Channel::getUncategorizedByServer($currentServer->id);
    
    // Check if user is admin or owner to show admin controls
    $isAdmin = false;
    if (isset($_SESSION['user_id'])) {
        require_once dirname(dirname(dirname(__DIR__))) . '/database/models/UserServerMembership.php';
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $currentServer->id);
        $isAdmin = $membership && ($membership->role === 'admin' || $membership->role === 'owner');
    }
}
?>

<!-- Channel Sidebar -->
<div class="channel-sidebar bg-[#2f3136] w-60 flex flex-col">
    <!-- Server Header - Uses real data if available -->
    <div class="p-4 shadow-md flex justify-between items-center">
        <h2 class="text-white font-semibold truncate">
            <?php 
            echo isset($currentServer) && $currentServer ? 
                htmlspecialchars($currentServer->name) : 
                'MiscVord Server';
            ?>
        </h2>
        <?php if (isset($isAdmin) && $isAdmin): ?>
            <div class="relative">
                <button id="serverSettingsBtn" class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="serverSettingsDropdown" class="hidden absolute right-0 mt-2 w-48 bg-[#18191c] rounded-md shadow-lg z-10">
                    <div class="py-1">
                        <button id="createCategoryBtn" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#5865F2] hover:text-white">
                            Create Category
                        </button>
                        <button id="createChannelBtn" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#5865F2] hover:text-white">
                            Create Channel
                        </button>
                        <div class="border-t border-gray-700 my-1"></div>
                        <button id="serverInviteBtn" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#5865F2] hover:text-white">
                            Invite People
                        </button>
                        <button id="serverSettingsMenuBtn" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#5865F2] hover:text-white">
                            Server Settings
                        </button>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Channel List -->
    <div class="flex-1 overflow-y-auto p-2">
        <?php if ($currentServer): ?>
            <!-- Uncategorized Channels -->
            <?php if (!empty($uncategorizedChannels)): ?>
                <div class="mb-4">
                    <div class="text-xs font-semibold text-gray-400 px-2 flex justify-between items-center mb-1">
                        <span>CHANNELS</span>
                        <?php if (isset($isAdmin) && $isAdmin): ?>
                            <button class="add-channel-btn text-gray-400 hover:text-white" data-category="">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                        <?php endif; ?>
                    </div>
                    
                    <?php foreach ($uncategorizedChannels as $channel): ?>
                        <div class="channel-item text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer">
                            <?php if ($channel->type === 'text'): ?>
                                <span class="text-gray-400 mr-2">#</span>
                            <?php else: ?>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            <?php endif; ?>
                            
                            <span class="truncate"><?php echo htmlspecialchars($channel->name); ?></span>
                            
                            <?php if ($channel->is_private): ?>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            
            <!-- Categorized Channels -->
            <?php foreach ($categories as $category): ?>
                <div class="category-container mb-4">
                    <div class="text-xs font-semibold text-gray-400 px-2 flex justify-between items-center mb-1 cursor-pointer category-header">
                        <span class="category-name truncate"><?php echo htmlspecialchars($category->name); ?></span>
                        <div class="flex items-center">
                            <?php if (isset($isAdmin) && $isAdmin): ?>
                                <button class="add-channel-btn text-gray-400 hover:text-white mr-1" data-category="<?php echo $category->id; ?>">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                            <?php endif; ?>
                            <button class="category-collapse-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 category-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="category-channels">
                        <?php 
                        // Get channels for this category
                        $categoryChannels = Channel::getByCategoryId($category->id);
                        foreach ($categoryChannels as $channel): 
                        ?>
                            <div class="channel-item text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer">
                                <?php if ($channel->type === 'text'): ?>
                                    <span class="text-gray-400 mr-2">#</span>
                                <?php else: ?>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                <?php endif; ?>
                                
                                <span class="truncate"><?php echo htmlspecialchars($channel->name); ?></span>
                                
                                <?php if ($channel->is_private): ?>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="text-gray-400 text-sm p-4 text-center">
                Select a server to view channels
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Create Category Modal -->
<div id="createCategoryModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 hidden transition-all duration-300 ease-in-out">
    <div class="bg-[#36393F] rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0" id="categoryModalContent">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Create a New Category</h3>
            <button id="closeCategoryModalBtn" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form id="createCategoryForm" action="/api/categories" method="POST" class="space-y-4">
            <input type="hidden" name="server_id" value="<?php echo $currentServer ? $currentServer->id : ''; ?>">
            
            <!-- Category Name -->
            <div>
                <label for="categoryName" class="block text-sm font-medium text-gray-300 mb-1">CATEGORY NAME <span class="text-red-500">*</span></label>
                <input 
                    type="text" 
                    id="categoryName" 
                    name="name" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    required
                >
                <div class="text-xs text-gray-400 mt-1">Category names may contain letters, numbers, and spaces.</div>
            </div>
            
            <div class="pt-4">
                <button 
                    type="submit" 
                    class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all"
                    id="createCategoryBtn"
                >
                    Create Category
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Create Channel Modal -->
<div id="createChannelModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 hidden transition-all duration-300 ease-in-out">
    <div class="bg-[#36393F] rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0" id="channelModalContent">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Create a New Channel</h3>
            <button id="closeChannelModalBtn" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form id="createChannelForm" action="/api/channels" method="POST" class="space-y-4">
            <input type="hidden" name="server_id" value="<?php echo $currentServer ? $currentServer->id : ''; ?>">
            <input type="hidden" name="category_id" id="channelCategoryId" value="">
            
            <!-- Channel Type -->
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">CHANNEL TYPE</label>
                <div class="flex space-x-4">
                    <label class="inline-flex items-center">
                        <input type="radio" name="type" value="text" class="hidden" checked>
                        <div class="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center mr-2 channel-type-radio">
                            <div class="w-3 h-3 rounded-full bg-discord-blue hidden"></div>
                        </div>
                        <span class="text-white flex items-center">
                            <span class="mr-1.5">#</span> Text
                        </span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" name="type" value="voice" class="hidden">
                        <div class="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center mr-2 channel-type-radio">
                            <div class="w-3 h-3 rounded-full bg-discord-blue hidden"></div>
                        </div>
                        <span class="text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Voice
                        </span>
                    </label>
                </div>
            </div>
            
            <!-- Channel Name -->
            <div>
                <label for="channelName" class="block text-sm font-medium text-gray-300 mb-1">CHANNEL NAME <span class="text-red-500">*</span></label>
                <input 
                    type="text" 
                    id="channelName" 
                    name="name" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    required
                >
                <div class="text-xs text-gray-400 mt-1">Channel names can't contain spaces, and must be lowercase.</div>
            </div>
            
            <!-- Private Channel Switch -->
            <div>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-sm font-medium text-gray-300">PRIVATE CHANNEL</h3>
                        <p class="text-xs text-gray-400">Only selected members and roles can view this channel</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="is_private" value="true" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-discord-blue"></div>
                    </label>
                </div>
            </div>
            
            <!-- Category Selection -->
            <div>
                <label for="channelCategory" class="block text-sm font-medium text-gray-300 mb-1">CATEGORY (OPTIONAL)</label>
                <select 
                    id="channelCategory" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                >
                    <option value="">No Category</option>
                    <?php foreach ($categories as $category): ?>
                        <option value="<?php echo $category->id; ?>"><?php echo htmlspecialchars($category->name); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="pt-4">
                <button 
                    type="submit" 
                    class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all"
                    id="createChannelSubmitBtn"
                >
                    Create Channel
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Server Invite Modal -->
<div id="serverInviteModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 hidden transition-all duration-300 ease-in-out">
    <div class="bg-[#36393F] rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0" id="inviteModalContent">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Invite People</h3>
            <button id="closeInviteModalBtn" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div class="space-y-4">
            <p class="text-gray-300 text-sm">Share this link with others to grant access to this server</p>
            
            <div class="flex">
                <input 
                    type="text" 
                    id="inviteLink" 
                    class="flex-1 bg-[#202225] text-white border border-[#40444b] rounded-l-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    value="<?php echo $currentServer && $currentServer->invite_link ? getBaseUrl() . '/join/' . $currentServer->invite_link : 'No invite link available'; ?>" 
                    readonly
                >
                <button 
                    id="copyInviteBtn" 
                    class="bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-r-md px-4 transition-all"
                >
                    Copy
                </button>
            </div>
            
            <?php if ($currentServer && isset($isAdmin) && $isAdmin): ?>
                <button 
                    id="generateNewInviteBtn" 
                    class="w-full py-2 mt-2 bg-[#4f545c] hover:bg-[#4f545c]/90 text-white font-medium rounded-md transition-all text-sm"
                >
                    Generate a New Link
                </button>
            <?php endif; ?>
        </div>
    </div>
</div>
