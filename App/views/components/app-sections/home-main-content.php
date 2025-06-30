<?php
$activeTab = $GLOBALS['activeTab'] ?? 'online';
$friends = $GLOBALS['friends'] ?? [];
$onlineFriends = $GLOBALS['onlineFriends'] ?? [];
$pendingRequests = $GLOBALS['pendingRequests'] ?? [];
$sentRequests = $GLOBALS['sentRequests'] ?? [];
$pendingCount = $GLOBALS['pendingCount'] ?? 0;
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
                    
                $displayLabel = $label;
                if ($tab === 'pending' && $pendingCount > 0) {
                    $displayLabel .= ' <span class="bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1">' . $pendingCount . '</span>';
                }
                
                echo "<button class='{$activeClass} px-3 py-1 rounded' data-tab='{$tab}'>{$displayLabel}</button>";
            }
            
            $addFriendClass = ($activeTab === 'add-friend') 
                ? 'bg-discord-green hover:bg-discord-green/90' 
                : 'bg-discord-green hover:bg-discord-green/90';
            ?>
            <button class="<?php echo $addFriendClass; ?> text-white px-3 py-1 rounded" data-tab="add-friend">Add Friend</button>
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
                    
                $displayLabel = $label;
                if ($tab === 'pending' && $pendingCount > 0) {
                    $displayLabel .= ' <span class="bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1">' . $pendingCount . '</span>';
                }
                
                echo "<button class='{$activeClass} px-3 py-2 rounded text-sm block text-center w-full' data-tab='{$tab}'>{$displayLabel}</button>";
            }
            
            $addFriendClass = ($activeTab === 'add-friend') 
                ? 'bg-discord-green' 
                : 'bg-discord-green hover:bg-discord-green/90';
            ?>
            <button class="<?php echo $addFriendClass; ?> text-white px-3 py-2 rounded text-sm block text-center w-full" data-tab="add-friend">Add Friend</button>
        </div>
    </div>

    <div class="tab-content <?php echo $activeTab === 'online' ? '' : 'hidden'; ?>" id="online-tab">
        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-gray-400 font-bold text-xs uppercase">Online — <span id="online-count"><?php echo count($onlineFriends); ?></span></h2>
                <div class="relative w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="online-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>

            <div class="space-y-1" id="online-friends-container">
                <?php if (empty($onlineFriends)): ?>
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends online</p>
                    <p class="text-gray-500 text-sm">Friends will appear here when they come online</p>
                </div>
                <?php else: ?>
                    <?php foreach ($onlineFriends as $friend): ?>
                        <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light group friend-item" 
                             data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"
                             data-username="<?php echo htmlspecialchars($friend['username']); ?>">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo htmlspecialchars($friend['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-discord-green"></span>
                                </div>
                                <div>
                                    <div class="font-medium text-white"><?php echo htmlspecialchars($friend['username']); ?></div>
                                    <div class="text-xs text-gray-400">Online</div>
                                </div>
                            </div>
                            <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message" onclick="createDirectMessage('<?php echo htmlspecialchars($friend['id']); ?>')">
                                    <i class="fa-solid fa-message"></i>
                                </button>
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'all' ? '' : 'hidden'; ?>" id="all-tab">
        <div class="flex-1 p-2 sm:p-4 overflow-y-auto bg-discord-background">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                <h2 class="text-gray-400 font-bold text-xs uppercase">All Friends — <?php echo count($friends); ?></h2>
                <div class="relative w-full sm:w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-2 sm:py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="all-search">
                    <i class="fas fa-search absolute left-2.5 top-2.5 sm:top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            
            <div class="space-y-1" id="all-friends-container">
                <?php if (empty($friends)): ?>
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends found</p>
                    <p class="text-gray-500 text-sm">Add some friends to get started!</p>
                </div>
                <?php else: ?>
                    <?php foreach ($friends as $friend): ?>
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded hover:bg-discord-light group friend-item gap-2 sm:gap-0" 
                             data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"
                             data-username="<?php echo htmlspecialchars($friend['username']); ?>">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo htmlspecialchars($friend['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-500"></span>
                                </div>
                                <div>
                                    <div class="font-medium text-white friend-name text-sm sm:text-base"><?php echo htmlspecialchars($friend['username']); ?></div>
                                    <div class="text-xs text-gray-400 friend-status">Offline</div>
                                </div>
                            </div>
                            <div class="flex space-x-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full text-sm" title="Message" onclick="createDirectMessage('<?php echo htmlspecialchars($friend['id']); ?>')">
                                    <i class="fa-solid fa-message"></i>
                                </button>
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full text-sm" title="More">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'pending' ? '' : 'hidden'; ?>" id="pending-tab">
        <div class="flex-1 p-2 sm:p-4 overflow-y-auto bg-discord-background">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                <h2 class="text-gray-400 font-bold text-xs uppercase">Pending</h2>
                <div class="relative w-full sm:w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-2 sm:py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="pending-search">
                    <i class="fas fa-search absolute left-2.5 top-2.5 sm:top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            
            <div class="space-y-4" id="pending-requests">
                <?php if (!empty($pendingRequests)): ?>
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — <?php echo count($pendingRequests); ?></h3>
                    <div class="space-y-2">
                        <?php foreach ($pendingRequests as $request): ?>
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-discord-dark rounded gap-3 sm:gap-0">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                        <img src="<?php echo htmlspecialchars($request['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                        <div class="font-medium text-white text-sm sm:text-base"><?php echo htmlspecialchars($request['username']); ?></div>
                                        <div class="text-xs text-gray-400">Incoming Friend Request</div>
                                    </div>
                                </div>
                                <div class="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                                    <button class="bg-discord-green hover:bg-discord-green/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-2 sm:py-1 text-sm order-1 sm:order-none transition-colors"
                                            onclick="acceptFriendRequest('<?php echo htmlspecialchars($request['friendship_id']); ?>')">Accept</button>
                                    <button class="bg-discord-dark hover:bg-discord-light disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md px-3 py-2 sm:py-1 text-sm border border-gray-600 order-2 sm:order-none transition-colors"
                                            onclick="ignoreFriendRequest('<?php echo htmlspecialchars($request['friendship_id']); ?>')">Ignore</button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($sentRequests)): ?>
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — <?php echo count($sentRequests); ?></h3>
                    <div class="space-y-2">
                        <?php foreach ($sentRequests as $request): ?>
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-discord-dark rounded gap-3 sm:gap-0">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                        <img src="<?php echo htmlspecialchars($request['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                        <div class="font-medium text-white text-sm sm:text-base"><?php echo htmlspecialchars($request['username']); ?></div>
                                        <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                                    </div>
                                </div>
                                <div class="self-start sm:self-auto">
                                    <button class="bg-discord-red hover:bg-discord-red/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-2 sm:py-1 text-sm w-full sm:w-auto transition-colors"
                                            onclick="cancelFriendRequest('<?php echo htmlspecialchars($request['id']); ?>')">Cancel</button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                
                <?php if (empty($pendingRequests) && empty($sentRequests)): ?>
                    <div class="p-4 bg-discord-dark rounded text-center">
                        <div class="mb-2 text-gray-400">
                            <i class="fa-solid fa-clock text-3xl"></i>
                        </div>
                        <p class="text-gray-300 mb-1">No pending friend requests</p>
                        <p class="text-gray-500 text-sm">Friend requests will appear here</p>
                    </div>
                <?php endif; ?>
            </div>
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
                        <button class="bg-discord-primary hover:bg-discord-primary/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 sm:rounded-r rounded font-medium text-sm sm:text-base transition-colors" disabled id="send-friend-request">
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

 