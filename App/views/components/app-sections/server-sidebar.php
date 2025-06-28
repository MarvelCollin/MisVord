<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/ServerController.php';

$serverController = new ServerController();
$serverData = $serverController->initSidebar();

$currentUserId = $_SESSION['user_id'] ?? 0;
$servers = $GLOBALS['userServers'] ?? [];

$currentServerId = isset($currentServer) ? $currentServer->id : null;
$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$isHomePage = !str_contains($currentPath, '/server/') && !str_contains($currentPath, '/explore');
$isExplorePage = str_contains($currentPath, '/explore');

if (!$currentServerId && preg_match('/\/server\/(\d+)/', $currentPath, $matches)) {
    $currentServerId = (int)$matches[1];
    $isHomePage = false;
}

$tooltipPath = dirname(dirname(__DIR__)) . '/components/common/tooltip.php';
if (file_exists($tooltipPath)) {
    require_once $tooltipPath;
}
?>

<!-- Load server sidebar CSS -->
<link rel="stylesheet" href="/public/css/server-sidebar.css">

<?php if ($isExplorePage): ?>
    <style>
        .sidebar-server-icon {
    display: block !important;
    position: relative !important;
    margin-bottom: 8px !important;
}

.sidebar-server-icon a div {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.sidebar-server-icon .absolute.left-0 {
    position: absolute !important;
}
</style>
<?php endif; ?>

<div class="flex h-full">
    <div class="w-[72px] sm:w-[72px] md:w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 overflow-visible transition-all duration-200">
        <div id="server-list" class="server-list flex-1 overflow-y-auto">
            <div class="server-icon mb-2 <?php echo $isHomePage ? 'active' : ''; ?>">
                <a href="/home" class="server-button flex items-center justify-center">
                    <div class="server-button <?php echo $isHomePage ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark hover:bg-discord-primary hover:rounded-2xl'; ?> flex items-center justify-center transition-all duration-200">
                        <img src="<?php echo asset('/common/main-logo.png'); ?>" alt="Home" class="discord-home-logo">
                    </div>
                </a>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Home
                </div>
            </div>
            
            <?php if (!empty($servers)): ?>
            <div class="server-divider"></div>
            <?php endif; ?>
            
            <?php if (!empty($servers)): ?>
                <?php foreach ($servers as $server): ?>
                    <?php 
                    $isActive = (string)$currentServerId === (string)($server['id'] ?? $server->id);
                    $serverName = $server['name'] ?? $server->name ?? 'Server';
                    $serverInitials = substr($serverName, 0, 1);
                    $serverImage = $server['image_url'] ?? $server->image_url ?? '';
                    $serverId = $server['id'] ?? $server->id;
                    ?>
                    
                    <div class="server-icon mb-2 <?php echo $isActive ? 'active' : ''; ?>">
                        <a href="/server/<?php echo $serverId; ?>" class="block" data-server-id="<?php echo $serverId; ?>">
                            <div class="server-button <?php echo $isActive ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark'; ?> flex items-center justify-center transition-all duration-200">
                                <?php if (!empty($serverImage)): ?>
                                    <img src="<?php echo htmlspecialchars($serverImage); ?>" alt="<?php echo htmlspecialchars($serverName); ?>" class="w-full h-full object-cover">
                                <?php else: ?>
                                    <span class="text-white font-bold text-xl sm:text-lg md:text-xl"><?php echo htmlspecialchars($serverInitials); ?></span>
                                <?php endif; ?>
                            </div>
                        </a>
                        <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                            <?php echo htmlspecialchars($serverName); ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
            
            <div class="server-icon mt-2">
                <button data-action="create-server" class="discord-add-server-button">
                    <i class="fas fa-plus discord-add-server-icon"></i>
                </button>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Add a Server
                </div>
            </div>
            
            <div class="server-icon mt-2 <?php echo $isExplorePage ? 'active' : ''; ?>">
                <a href="/explore-servers" class="block">
                    <div class="discord-explore-server-button <?php echo $isExplorePage ? 'active' : ''; ?>">
                        <i class="fas fa-compass discord-explore-server-icon"></i>
                    </div>
                </a>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Explore Public Servers
                </div>
            </div>
        </div>
    </div>
    
    <?php
    log_debug("Server sidebar debug", [
        'contentType' => $contentType ?? 'undefined',
        'currentServer' => isset($currentServer) ? 'set' : 'not set',
        'currentServer_type' => isset($currentServer) ? gettype($currentServer) : 'N/A'
    ]);
    ?>
    
    <?php if (isset($contentType) && $contentType === 'server' && isset($currentServer)): ?>
    <div class="w-60 bg-discord-dark flex flex-col">
        <div class="h-12 border-b border-black flex items-center px-4 shadow-sm relative">
            <h2 class="font-bold text-white truncate flex-1"><?php echo htmlspecialchars(is_array($currentServer) ? ($currentServer['name'] ?? 'Server') : ($currentServer->name ?? 'Server')); ?></h2>
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('Server sidebar loaded with servers:', <?php echo json_encode($servers); ?>);
    console.log('Current user ID:', <?php echo $currentUserId; ?>);
    console.log('Is home page:', <?php echo $isHomePage ? 'true' : 'false'; ?>);
    
    document.querySelectorAll('.server-icon').forEach(icon => {
        const tooltip = icon.querySelector('.tooltip');
        if (tooltip) {
            icon.addEventListener('mouseenter', () => {
                tooltip.classList.remove('hidden');
                tooltip.style.opacity = '1';
            });
            
            icon.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
                tooltip.style.opacity = '0';
            });
        }
    });
});
</script>

<?php
// Add server-sidebar.js to additional_js array for proper loading
$additional_js = isset($additional_js) ? $additional_js : [];
$additional_js[] = 'components/servers/server-sidebar';
?>
