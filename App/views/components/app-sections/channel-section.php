<?php
// Get current server from GLOBALS - set by ServerController
$currentServer = $GLOBALS['currentServer'] ?? null;

// Get channels and categories for this server
$channels = [];
$categories = [];

if ($currentServer) {
    // Get channels and categories from the server object if available
    $channels = $currentServer->channels();
    $categories = $currentServer->categories();
    
    // Organize channels by category
    $channelsByCategory = [];
    foreach ($channels as $channel) {
        $categoryId = $channel['category_id'] ?? 0; // Use 0 for uncategorized
        if (!isset($channelsByCategory[$categoryId])) {
            $channelsByCategory[$categoryId] = [];
        }
        $channelsByCategory[$categoryId][] = $channel;
    }
}
?>

<!-- Channel Section - Server name and channels list -->
<div class="channel-section w-60 bg-[#2F3136] flex flex-col">
    <!-- Server Name Header -->
    <div class="server-header h-12 shadow-md flex items-center px-4 border-b border-gray-900">
        <h2 class="text-white font-bold truncate">
            <?php echo $currentServer ? htmlspecialchars($currentServer->name) : 'MiscVord'; ?>
        </h2>
        <!-- Add a hidden input to store the server ID for JavaScript -->
        <input type="hidden" id="currentServerId" value="<?php echo $currentServer ? $currentServer->id : ''; ?>">
        <?php if ($currentServer): ?>
        <div class="ml-auto relative">
            <button id="serverSettingsBtn" class="text-gray-400 hover:text-white p-1 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <!-- Server Settings Dropdown Menu -->
            <div id="serverSettingsDropdown" class="absolute right-0 top-full mt-1 w-48 bg-[#202225] rounded-md shadow-lg z-10 hidden overflow-hidden border border-gray-800">
                <div class="py-1">
                    <button id="createChannelOption" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Create Channel
                    </button>
                    <button id="createCategoryOption" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Create Category
                    </button>
                    <div class="border-t border-gray-700 my-1"></div>
                    <button id="serverSettingsOption" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Server Settings
                    </button>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Channels Area with Scrolling -->
    <div class="flex-1 overflow-y-auto py-4 px-2 space-y-2">
        <?php if ($currentServer): ?>
            <!-- Uncategorized Channels -->
            <?php if (isset($channelsByCategory[0]) && !empty($channelsByCategory[0])): ?>
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
                    
                    <?php foreach ($channelsByCategory[0] as $channel): ?>
                        <div class="channel-item text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer" 
                             data-channel-id="<?php echo $channel['id']; ?>" 
                             data-channel-name="<?php echo htmlspecialchars($channel['name']); ?>"
                             data-channel-type="<?php echo $channel['type']; ?>">
                            <?php if ($channel['type'] === 'text'): ?>
                                <span class="text-gray-400 mr-2">#</span>
                            <?php else: ?>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            <?php endif; ?>
                            

                            <span class="truncate channel-name"><?php echo htmlspecialchars($channel['name']); ?></span>
                            
                            <?php if (!empty($channel['is_private'])): ?>
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
                        <span class="category-name truncate"><?php echo htmlspecialchars($category['name']); ?></span>
                        <div class="flex items-center">
                            <?php if (isset($isAdmin) && $isAdmin): ?>
                                <button class="add-channel-btn text-gray-400 hover:text-white mr-1" data-category="<?php echo $category['id']; ?>">
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
                        $categoryChannels = $channelsByCategory[$category['id']] ?? [];
                        foreach ($categoryChannels as $channel): 
                        ?>
                            <div class="channel-item text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer" 
                                 data-channel-id="<?php echo $channel['id']; ?>" 
                                 data-channel-name="<?php echo htmlspecialchars($channel['name']); ?>"
                                 data-channel-type="<?php echo $channel['type']; ?>">
                                <?php if ($channel['type'] === 'text'): ?>
                                    <span class="text-gray-400 mr-2">#</span>
                                <?php else: ?>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                <?php endif; ?>
                                
                                <span class="truncate channel-name"><?php echo htmlspecialchars($channel['name']); ?></span>
                                
                                <?php if (!empty($channel['is_private'])): ?>
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
    
    <!-- User Profile Section - Bottom bar with user controls -->
    <div class="user-profile-section h-14 bg-[#292B2F] flex items-center px-2 border-t border-gray-900">
        <div class="flex items-center px-2">
            <div class="relative mr-3">
                <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="<?php echo $_SESSION['username']; ?>'s Avatar" class="w-8 h-8 rounded-full">
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#292B2F]"></div>
            </div>
            <div class="flex-grow">
                <div class="text-white font-medium text-sm"><?php echo $_SESSION['username']; ?></div>
                <div class="text-gray-400 text-xs">#<?php echo substr(md5($_SESSION['user_id']), 0, 4); ?></div>
            </div>
            <div class="flex space-x-1">
                <button class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
                <button class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01.001-7.072m12.728 0a9 9 0 00-12.728 0" />
                    </svg>
                </button>
                <button class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Create Channel Modal -->
<div id="addChannelModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 hidden transition-all duration-300 ease-in-out">
    <div class="bg-[#36393F] rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0" id="channelModalContent">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Create Channel</h3>
            <button id="closeChannelModalBtn" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form id="createChannelForm" action="/api/channels" method="POST" class="space-y-4">
            <!-- Channel Type -->
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">CHANNEL TYPE</label>
                <div class="flex space-x-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="type" value="text" class="hidden" checked>
                        <div class="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center mr-2 radio-selector">
                            <div class="w-3 h-3 rounded-full bg-discord-blue opacity-0 transition-opacity"></div>
                        </div>
                        <span class="text-sm text-gray-200">Text</span>
                    </label>
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="type" value="voice" class="hidden">
                        <div class="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center mr-2 radio-selector">
                            <div class="w-3 h-3 rounded-full bg-discord-blue opacity-0 transition-opacity"></div>
                        </div>
                        <span class="text-sm text-gray-200">Voice</span>
                    </label>
                </div>
            </div>
            
            <!-- Channel Name -->
            <div>
                <label for="channelName" class="block text-sm font-medium text-gray-300 mb-1">CHANNEL NAME</label>
                <input 
                    type="text" 
                    id="channelName" 
                    name="name" 
                    placeholder="new-channel" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    required
                >
            </div>
            
            <!-- Channel Category -->
            <div>
                <label for="channelCategory" class="block text-sm font-medium text-gray-300 mb-1">CATEGORY</label>
                <select 
                    id="channelCategory" 
                    name="category_id" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all"
                >
                    <option value="">No Category</option>
                    <?php if (!empty($categories)): ?>
                        <?php foreach ($categories as $category): ?>
                            <option value="<?php echo $category['id']; ?>"><?php echo htmlspecialchars($category['name']); ?></option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
            </div>
            
            <input type="hidden" name="server_id" value="<?php echo $currentServer ? $currentServer->id : ''; ?>">
            
            <div class="pt-4 flex space-x-3">
                <button 
                    type="button" 
                    id="cancelChannelBtn"
                    class="py-2.5 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-all"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    class="flex-1 py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all"
                    id="createChannelBtn"
                >
                    Create Channel
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Create Category Modal -->
<div id="addCategoryModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 hidden transition-all duration-300 ease-in-out">
    <div class="bg-[#36393F] rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0" id="categoryModalContent">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Create Category</h3>
            <button id="closeCategoryModalBtn" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form id="createCategoryForm" action="/api/categories" method="POST" class="space-y-4">
            <!-- Category Name -->
            <div>
                <label for="categoryName" class="block text-sm font-medium text-gray-300 mb-1">CATEGORY NAME</label>
                <input 
                    type="text" 
                    id="categoryName" 
                    name="name" 
                    placeholder="NEW CATEGORY" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    required
                >
                <p class="text-xs text-gray-400 mt-1">Categories help organize channels in your server</p>
            </div>
            
            <input type="hidden" name="server_id" value="<?php echo $currentServer ? $currentServer->id : ''; ?>">
            
            <div class="pt-4 flex space-x-3">
                <button 
                    type="button" 
                    id="cancelCategoryBtn"
                    class="py-2.5 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-all"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    class="flex-1 py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all"
                    id="createCategoryBtn"
                >
                    Create Category
                </button>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const channelModal = document.getElementById('addChannelModal');
    const categoryModal = document.getElementById('addCategoryModal');
    const channelModalContent = document.getElementById('channelModalContent');
    const categoryModalContent = document.getElementById('categoryModalContent');
    
    // Dropdown elements
    const serverSettingsBtn = document.getElementById('serverSettingsBtn');
    const serverSettingsDropdown = document.getElementById('serverSettingsDropdown');
    const createChannelOption = document.getElementById('createChannelOption');
    const createCategoryOption = document.getElementById('createCategoryOption');
    const serverSettingsOption = document.getElementById('serverSettingsOption');
    
    // Channel modal buttons
    const closeChannelModalBtn = document.getElementById('closeChannelModalBtn');
    const cancelChannelBtn = document.getElementById('cancelChannelBtn');
    
    // Category modal buttons
    const closeCategoryModalBtn = document.getElementById('closeCategoryModalBtn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    
    // Forms
    const createChannelForm = document.getElementById('createChannelForm');
    const createCategoryForm = document.getElementById('createCategoryForm');
    
    // Toggle dropdown when clicking the settings button
    if (serverSettingsBtn && serverSettingsDropdown) {
        serverSettingsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            serverSettingsDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (!serverSettingsBtn.contains(e.target) && !serverSettingsDropdown.contains(e.target)) {
                serverSettingsDropdown.classList.add('hidden');
            }
        });
    }
    
    // Handle dropdown options
    if (createChannelOption) {
        createChannelOption.addEventListener('click', function() {
            serverSettingsDropdown.classList.add('hidden');
            openChannelModal();
        });
    }
    
    if (createCategoryOption) {
        createCategoryOption.addEventListener('click', function() {
            serverSettingsDropdown.classList.add('hidden');
            openCategoryModal();
        });
    }
    
    if (serverSettingsOption) {
        serverSettingsOption.addEventListener('click', function() {
            serverSettingsDropdown.classList.add('hidden');
            // Here you can add server settings functionality
            alert('Server settings coming soon!');
        });
    }
    
    // Radio button selectors for channel types
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        const selector = radio.parentElement.querySelector('.radio-selector > div');
        if (radio.checked) {
            selector.classList.remove('opacity-0');
        }
        
        radio.addEventListener('change', function() {
            // Hide all indicators
            document.querySelectorAll('.radio-selector > div').forEach(div => {
                div.classList.add('opacity-0');
            });
            
            // Show selected indicator
            if (this.checked) {
                selector.classList.remove('opacity-0');
            }
        });
    });
    
    // Channel Modal Functions
    function openChannelModal() {
        channelModal.classList.remove('hidden');
        // Use setTimeout to ensure transition works
        setTimeout(() => {
            channelModal.classList.add('opacity-100');
            channelModalContent.classList.remove('scale-95', 'opacity-0');
            channelModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    function closeChannelModal() {
        channelModalContent.classList.remove('scale-100', 'opacity-100');
        channelModalContent.classList.add('scale-95', 'opacity-0');
        
        // Hide after animation completes
        setTimeout(() => {
            channelModal.classList.add('hidden');
        }, 300);
    }
    
    // Category Modal Functions
    function openCategoryModal() {
        categoryModal.classList.remove('hidden');
        // Use setTimeout to ensure transition works
        setTimeout(() => {
            categoryModal.classList.add('opacity-100');
            categoryModalContent.classList.remove('scale-95', 'opacity-0');
            categoryModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    function closeCategoryModal() {
        categoryModalContent.classList.remove('scale-100', 'opacity-100');
        categoryModalContent.classList.add('scale-95', 'opacity-0');
        
        // Hide after animation completes
        setTimeout(() => {
            categoryModal.classList.add('hidden');
        }, 300);
    }
    
    // Set up channel modal event listeners
    if (closeChannelModalBtn) {
        closeChannelModalBtn.addEventListener('click', closeChannelModal);
    }
    
    if (cancelChannelBtn) {
        cancelChannelBtn.addEventListener('click', closeChannelModal);
    }
    
    if (channelModal) {
        channelModal.addEventListener('click', function(e) {
            if (e.target === channelModal) closeChannelModal();
        });
    }
    
    // Set up category modal event listeners
    if (closeCategoryModalBtn) {
        closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
    }
    
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    }
    
    if (categoryModal) {
        categoryModal.addEventListener('click', function(e) {
            if (e.target === categoryModal) closeCategoryModal();
        });
    }
    
    // Handle channel form submission
    if (createChannelForm) {
        createChannelForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = document.getElementById('createChannelBtn');
            
            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
            `;

            // Send the channel data via AJAX
            fetch('/api/channels', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success notification
                    showNotification('Channel created successfully!');
                    
                    // Close modal
                    closeChannelModal();
                    
                    // Reload the page to show the new channel
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Show error notification
                    showNotification('Error: ' + (data.message || 'Failed to create channel'), 'error');
                }
            })
            .catch(error => {
                console.error('Error creating channel:', error);
                showNotification('Error creating channel. Please try again.', 'error');
            })
            .finally(() => {
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Channel';
            });
        });
    }
    
    // Handle category form submission
    if (createCategoryForm) {
        createCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = document.getElementById('createCategoryBtn');
            
            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
            `;

            // Send the category data via AJAX
            fetch('/api/categories', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success notification
                    showNotification('Category created successfully!');
                    
                    // Close modal
                    closeCategoryModal();
                    
                    // Reload the page to show the new category
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Show error notification
                    showNotification('Error: ' + (data.message || 'Failed to create category'), 'error');
                }
            })
            .catch(error => {
                console.error('Error creating category:', error);
                showNotification('Error creating category. Please try again.', 'error');
            })
            .finally(() => {
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Category';
            });
        });
    }
    
    // Add click event listeners to channel items
    const channelItems = document.querySelectorAll('.channel-item');
    channelItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all channels
            document.querySelectorAll('.channel-item').forEach(channel => {
                channel.classList.remove('bg-[#42464D]', 'text-white');
            });
            
            // Add active class to clicked channel
            this.classList.add('bg-[#42464D]', 'text-white');
            
            // Get channel details
            const channelId = this.getAttribute('data-channel-id');
            const channelName = this.getAttribute('data-channel-name');
            const channelType = this.getAttribute('data-channel-type');
            
            // If voice channel, redirect to voice channel page
            if (channelType === 'voice') {
                window.location.href = `/voice/${channelId}`;
                return;
            }
            
            // Load channel messages
            if (typeof window.loadChannel === 'function') {
                window.loadChannel(channelId, channelName);
            }
        });
    });

    // Show notification function
    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('fixed', 'bottom-4', 'right-4', 'px-4', 'py-2', 'rounded', 'shadow-lg', 'text-white', 'transform', 'transition-all', 'duration-300', 'ease-in-out', 'translate-y-full', 'opacity-0', 'z-50');
        
        // Set style based on type
        if (type === 'success') {
            notification.classList.add('bg-green-500');
        } else {
            notification.classList.add('bg-red-500');
        }
        
        // Set content
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.remove('translate-y-full', 'opacity-0');
        }, 10);
        
        // Remove after timeout
        setTimeout(() => {
            notification.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
});
</script>
