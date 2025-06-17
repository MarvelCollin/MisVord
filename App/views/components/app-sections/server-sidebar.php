<?php
// Get data from global scope (set by controller)
$currentUserId = $_SESSION['user_id'] ?? 0;
$servers = $GLOBALS['userServers'] ?? [];

// If no servers loaded and we have a user ID, try to load them
if (empty($servers) && $currentUserId) {
    log_warning("No servers found in GLOBALS for user", ['user_id' => $currentUserId]);
}

$currentServerId = isset($currentServer) ? $currentServer->id : null;
$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$isHomePage = !str_contains($currentPath, '/server/');

// Include tooltip component
$tooltipPath = dirname(dirname(__DIR__)) . '/components/common/tooltip.php';
if (file_exists($tooltipPath)) {
    require_once $tooltipPath;
}
?>

<div class="flex h-full">
    <div class="w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 space-y-2 overflow-visible">
        <?php
        $homeContent = '<div class="relative">
            <a href="/home" class="group flex items-center justify-center relative w-12 h-12">
                <div class="w-12 h-12 rounded-2xl ' . ($isHomePage ? 'bg-discord-primary rounded-[16px]' : 'bg-discord-dark rounded-full hover:rounded-2xl hover:bg-discord-primary') . ' flex items-center justify-center transition-all duration-200">
                    <i class="fa-brands fa-discord text-white text-xl"></i>
                </div>
            </a>
            ' . ($isHomePage ? '<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"></div>' : '<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-md group-hover:h-5 transition-all duration-150"></div>') . '
        </div>';
        
        echo tooltip($homeContent, 'Home', 'right');
        ?>
        
        <!-- Only show separator if there are servers -->
        <?php if (!empty($servers)): ?>
        <div class="w-8 h-0.5 bg-discord-dark rounded my-1"></div>
        <?php endif; ?>
        
        <?php if (!empty($servers)): ?>
            <?php foreach ($servers as $server): ?>
                <?php 
                $isActive = (string)$currentServerId === (string)$server['id'];
                $serverInitials = substr($server['name'] ?? 'S', 0, 1);
                $serverImage = $server['image_url'] ?? '';
                ?>
                
                <?php
                $serverContent = '<div class="relative">
                    <a href="/server/' . $server['id'] . '" class="block group">
                        <div class="w-12 h-12 overflow-hidden ' . ($isActive ? 'rounded-2xl bg-discord-primary' : 'rounded-full hover:rounded-2xl bg-discord-dark') . ' transition-all duration-200 flex items-center justify-center">
                            ' . (!empty($serverImage) ? 
                                '<img src="' . htmlspecialchars($serverImage) . '" alt="' . htmlspecialchars($server['name']) . '" class="w-full h-full object-cover">' :
                                '<span class="text-white font-bold text-xl">' . htmlspecialchars($serverInitials) . '</span>') . '
                        </div>
                    </a>
                    ' . ($isActive ? '<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"></div>' : '<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-md group-hover:h-5 transition-all duration-150"></div>') . '
                </div>';
                
                echo tooltip($serverContent, htmlspecialchars($server['name']), 'right', 'mb-2');
            endforeach; ?>
        <?php endif; ?>
        
        <?php
        $createServerContent = '<button data-action="create-server" class="w-12 h-12 bg-discord-dark rounded-full hover:rounded-2xl flex items-center justify-center hover:bg-discord-green transition-all duration-200 border-none cursor-pointer outline-none">
            <i class="fas fa-plus text-green-500 hover:text-white text-xl transition-colors duration-200"></i>
        </button>';
        
        echo tooltip($createServerContent, 'Add a Server', 'right', 'mb-2');
        ?>
        
        <?php
        $exploreContent = '<a href="/explore-servers" class="block">
            <div class="w-12 h-12 rounded-full hover:rounded-2xl bg-discord-dark hover:bg-discord-green flex items-center justify-center transition-all duration-200">
                <i class="fas fa-compass text-green-500 hover:text-white text-xl transition-colors duration-200"></i>
            </div>
        </a>';
        
        echo tooltip($exploreContent, 'Explore Public Servers', 'right');
        ?>
    </div>
    
    <?php    log_debug("Server sidebar debug", [
        'contentType' => $contentType ?? 'undefined',
        'currentServer' => isset($currentServer) ? 'set' : 'not set',
        'currentServer_type' => isset($currentServer) ? gettype($currentServer) : 'N/A'
    ]);
    ?>
    
    <?php if (isset($contentType) && $contentType === 'server' && isset($currentServer)): ?>
    <div class="w-60 bg-discord-dark flex flex-col">
        <div class="h-12 border-b border-black flex items-center px-4 shadow-sm relative">
            <h2 class="font-bold text-white truncate flex-1"><?php echo htmlspecialchars($currentServer->name ?? 'Server'); ?></h2>
            <button id="server-dropdown-btn" class="text-gray-400 hover:text-white focus:outline-none w-5 h-5 flex items-center justify-center">
                <i class="fas fa-chevron-down text-sm"></i>
            </button>
            
            <div id="server-dropdown" class="hidden absolute right-2 top-12 w-56 bg-[#18191c] rounded-md shadow-lg z-50 py-2 text-gray-100 text-sm overflow-hidden">
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                    <i class="fas fa-user-plus w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                    <span>Invite People</span>
                </div>
                
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                    <i class="fas fa-cog w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                    <span>Server Settings</span>
                </div>
                
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                    <i class="fas fa-plus-circle w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                    <span>Create Channel</span>
                </div>
                
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                    <i class="fas fa-folder-plus w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                    <span>Create Category</span>
                </div>
                
                <div class="border-t border-gray-700 my-1"></div>
                
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                    <i class="fas fa-bell w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                    <span>Notification Settings</span>
                </div>
                
                <div class="border-t border-gray-700 my-1"></div>
                
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                    <i class="fas fa-edit w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                    <span>Edit Per-server Profile</span>
                </div>
                
                <div class="border-t border-gray-700 my-1"></div>
                
                <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-red-400 hover:text-white">
                    <i class="fas fa-sign-out-alt w-5 text-center mr-2.5 text-red-400 group-hover:text-white"></i>
                    <span>Leave Server</span>
                </div>
            </div>
        </div>
        
        <div class="flex-1 overflow-y-auto py-2 px-1">
            <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
        </div>
        
        <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
    </div>
    <?php else: ?>
    <!-- DEBUG: Not in server context -->
    <script>
        console.log('DEBUG: Not in server context', {
            contentType: '<?php echo $contentType ?? 'undefined'; ?>',
            currentServer: <?php echo isset($currentServer) ? 'true' : 'false'; ?>,
            currentPath: '<?php echo $_SERVER['REQUEST_URI'] ?? ''; ?>'
        });
    </script>
    <?php endif; ?>
</div>

<script>
// Enhanced debugging and better data loading
document.addEventListener('DOMContentLoaded', function() {
    console.log('Server sidebar loaded with servers:', <?php echo json_encode($servers); ?>);
    console.log('Current user ID:', <?php echo $currentUserId; ?>);
    console.log('Is home page:', <?php echo $isHomePage ? 'true' : 'false'; ?>);
});
</script>
