<?php
$currentUserId = $_SESSION['user_id'] ?? 0;
$servers = $GLOBALS['userServers'] ?? [];

$currentServerId = isset($currentServer) ? $currentServer->id : null;
$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$isHomePage = !str_contains($currentPath, '/server/');
?>

t <div class="flex h-full">
    <div class="w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 space-y-2 overflow-y-auto">
        <a href="/home" class="group flex items-center justify-center relative">
            <div class="w-12 h-12 rounded-2xl <?php echo $isHomePage ? 'bg-discord-primary rounded-[16px]' : 'bg-discord-dark rounded-full hover:rounded-2xl hover:bg-discord-primary'; ?> flex items-center justify-center transition-all duration-200">
                <i class="fa-brands fa-discord text-white text-xl"></i>
            </div>
            <?php if ($isHomePage): ?>
                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"></div>
            <?php endif; ?>
        </a>
        
        <div class="w-8 h-0.5 bg-discord-dark rounded my-1"></div>
        
        <?php foreach ($servers as $server): ?>
            <?php 
            $isActive = (string)$currentServerId === (string)$server['id'];
            $serverInitials = substr($server['name'] ?? 'S', 0, 1);
            $serverImage = $server['image_url'] ?? '';
            ?>
            
            <div class="relative server-item my-2">
                <a href="/server/<?php echo $server['id']; ?>" class="block">
                    <div class="w-12 h-12 overflow-hidden <?php echo $isActive ? 'rounded-2xl bg-discord-primary' : 'rounded-full hover:rounded-2xl bg-discord-dark'; ?> transition-all duration-200 flex items-center justify-center">
                        <?php if (!empty($serverImage)): ?>
                            <img src="<?php echo htmlspecialchars($serverImage); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
                        <?php else: ?>
                            <span class="text-white font-bold text-xl"><?php echo htmlspecialchars($serverInitials); ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="server-tooltip"><?php echo htmlspecialchars($server['name']); ?></div>
                </a>
                <?php if ($isActive): ?>
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"></div>
                <?php else: ?>
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md scale-y-0 hover:scale-y-[0.5] transition-transform duration-150"></div>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
        
        <div class="server-item mt-2 relative">
            <button data-action="create-server" class="w-12 h-12 bg-discord-dark rounded-full flex items-center justify-center hover:bg-discord-primary transition-colors">
                <i class="fas fa-plus text-green-500"></i>
            </button>
            <div class="server-tooltip">Create a Server</div>
        </div>
        
        <div class="server-item relative">
            <a href="/explore-servers" class="block">
                <div class="w-12 h-12 rounded-full hover:rounded-2xl bg-discord-dark hover:bg-discord-green flex items-center justify-center transition-all duration-200">
                    <i class="fas fa-compass text-discord-green"></i>
                </div>
                <div class="server-tooltip">Explore Servers</div>
            </a>
        </div>
    </div>
    
    <?php if (isset($contentType) && $contentType === 'server' && isset($currentServer)): ?>
    <div class="w-60 bg-discord-dark flex flex-col">
        <div class="h-12 border-b border-black flex items-center px-4 shadow-sm relative">
            <h2 class="font-bold text-white truncate flex-1"><?php echo htmlspecialchars($currentServer->name ?? 'Server'); ?></h2>
            <button id="server-dropdown-btn" class="text-gray-400 hover:text-white focus:outline-none">
                <i class="fas fa-chevron-down"></i>
            </button>
            
            <!-- Server Dropdown Menu -->
            <div id="server-dropdown" class="server-dropdown">
                <div class="server-dropdown-item">
                    <i class="fas fa-user-plus"></i>
                    <span>Invite People</span>
                </div>
                
                <div class="server-dropdown-item">
                    <i class="fas fa-cog"></i>
                    <span>Server Settings</span>
                </div>
                
                <div class="server-dropdown-item">
                    <i class="fas fa-plus-circle"></i>
                    <span>Create Channel</span>
                </div>
                
                <div class="server-dropdown-item">
                    <i class="fas fa-folder-plus"></i>
                    <span>Create Category</span>
                </div>
                
                <div class="server-dropdown-separator"></div>
                
                <div class="server-dropdown-item">
                    <i class="fas fa-bell"></i>
                    <span>Notification Settings</span>
                </div>
                
                <div class="server-dropdown-separator"></div>
                
                <div class="server-dropdown-item">
                    <i class="fas fa-edit"></i>
                    <span>Edit Per-server Profile</span>
                </div>
                
                <div class="server-dropdown-separator"></div>
                
                <div class="server-dropdown-item danger-zone">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Leave Server</span>
                </div>
            </div>
        </div>
        
        <div class="flex-1 overflow-y-auto py-2 px-1">
            <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
        </div>
        
        <div class="p-2 bg-discord-darker flex items-center">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2">
                <img src="<?php echo isset($_SESSION['avatar']) ? htmlspecialchars($_SESSION['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($_SESSION['username'] ?? 'U') . '&background=random'; ?>" 
                     alt="Avatar" class="w-full h-full object-cover">
            </div>
            <div class="flex-1">
                <div class="text-sm text-white font-medium truncate"><?php echo htmlspecialchars($_SESSION['username'] ?? 'User'); ?></div>
                <div class="text-xs text-discord-lighter truncate">#<?php echo htmlspecialchars($_SESSION['tag'] ?? '0000'); ?></div>
            </div>
            <div class="flex space-x-1">
                <button class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-microphone"></i>
                </button>
                <button class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-headphones"></i>
                </button>
                <button class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </div>
    </div>
    <?php endif; ?>
</div>
