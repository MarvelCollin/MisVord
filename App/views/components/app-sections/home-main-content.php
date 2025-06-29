<?php
$activeTab = $GLOBALS['activeTab'] ?? 'online';
?>

<div class="flex-1 bg-discord-background flex flex-col">
    <div class="h-auto min-h-[48px] bg-discord-background border-b border-gray-800 flex items-center justify-between px-4 py-2">
        <div class="flex items-center">
            <i class="fa-solid fa-user-group text-[18px] text-gray-400 mr-2"></i>
            <span class="font-semibold text-white">Friends</span>
        </div>
        
        <div class="hidden md:flex items-center space-x-4 text-sm friends-desktop-tabs">
            <?php
            $tabs = [
                'online' => 'Online',
                'all' => 'All',
                'pending' => 'Pending'
            ];
            
            foreach ($tabs as $tab => $label) {
                $activeClass = ($activeTab === $tab) 
                    ? 'text-white bg-discord-primary hover:bg-discord-primary/90' 
                    : 'text-gray-300 hover:text-white hover:bg-discord-light';
                echo "<a href='/home/friends?tab={$tab}' class='{$activeClass} px-3 py-1 rounded' data-tab='{$tab}'>{$label}</a>";
            }
            
            $addFriendClass = ($activeTab === 'add-friend') 
                ? 'bg-discord-green hover:bg-discord-green/90' 
                : 'bg-discord-green hover:bg-discord-green/90';
            ?>
            <a href='/home/friends?tab=add-friend' class="<?php echo $addFriendClass; ?> text-white px-3 py-1 rounded" data-tab="add-friend">Add Friend</a>
        </div>
        
        <div class="md:hidden">
            <button id="friends-menu-toggle" class="text-gray-400 hover:text-white p-2 rounded-md hover:bg-discord-light">
                <i class="fa-solid fa-bars text-lg"></i>
            </button>
        </div>
    </div>
    
    <div id="friends-mobile-menu" class="hidden md:hidden bg-discord-dark border-b border-gray-800 p-3">
        <div class="flex flex-col space-y-2">
            <?php
            foreach ($tabs as $tab => $label) {
                $activeClass = ($activeTab === $tab) 
                    ? 'text-white bg-discord-primary' 
                    : 'text-gray-300 hover:text-white hover:bg-discord-light';
                echo "<a href='/home/friends?tab={$tab}' class='{$activeClass} px-3 py-2 rounded text-sm block text-center' data-tab='{$tab}'>{$label}</a>";
            }
            
            $addFriendClass = ($activeTab === 'add-friend') 
                ? 'bg-discord-green' 
                : 'bg-discord-green hover:bg-discord-green/90';
            ?>
            <a href='/home/friends?tab=add-friend' class="<?php echo $addFriendClass; ?> text-white px-3 py-2 rounded text-sm block text-center" data-tab="add-friend">Add Friend</a>
        </div>
    </div>

    <div class="tab-content <?php echo $activeTab === 'online' ? '' : 'hidden'; ?>" id="online-tab">
        <?php include dirname(__DIR__) . '/app-sections/home-content.php'; ?>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'all' ? '' : 'hidden'; ?>" id="all-tab">
        <div class="flex-1 p-2 sm:p-4 overflow-y-auto bg-discord-background">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                <h2 class="text-gray-400 font-bold text-xs uppercase">All Friends</h2>
                <div class="relative w-full sm:w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-2 sm:py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
                    <i class="fas fa-search absolute left-2.5 top-2.5 sm:top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            <div class="space-y-1" id="all-friends-container"></div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'pending' ? '' : 'hidden'; ?>" id="pending-tab">
        <div class="flex-1 p-2 sm:p-4 overflow-y-auto bg-discord-background">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                <h2 class="text-gray-400 font-bold text-xs uppercase">Pending</h2>
                <div class="relative w-full sm:w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-2 sm:py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
                    <i class="fas fa-search absolute left-2.5 top-2.5 sm:top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            <div class="space-y-4" id="pending-requests"></div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'add-friend' ? '' : 'hidden'; ?>" id="add-friend-tab">
        <div class="flex-1 p-2 sm:p-4 overflow-y-auto bg-discord-background">
            <h2 class="text-white font-bold text-lg mb-2">Add Friend</h2>
            <p class="text-gray-400 text-sm mb-4">You can add friends with their MisVord username or full username#discriminator.</p>
            
            <div class="bg-discord-dark p-3 rounded">
                <div class="border-b border-gray-700 pb-4">
                    <label class="text-gray-400 text-sm uppercase font-medium">Add Friend</label>
                    <div class="flex flex-col sm:flex-row mt-2 gap-2 sm:gap-0">
                        <input type="text" class="flex-1 bg-discord-dark text-white px-3 py-2 sm:rounded-l rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-discord-primary" 
                               placeholder="Username#XXXX" id="friend-username-input">
                        <button class="bg-discord-primary text-white px-4 py-2 sm:rounded-r rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" disabled id="send-friend-request">
                            Send Friend Request
                        </button>
                    </div>
                    <div class="text-discord-red text-sm mt-1 hidden" id="friend-request-error"></div>
                    <div class="text-discord-green text-sm mt-1 hidden" id="friend-request-success"></div>
                </div>
            </div>
        </div>
    </div>
</div> 