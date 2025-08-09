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



$maxServersToShow = 10; 
if (count($servers) > $maxServersToShow) {
    $servers = array_slice($servers, 0, $maxServersToShow);
}
?>

<link rel="stylesheet" href="/public/css/server-sidebar.css">


<div id="tooltip-container" style="position: fixed; top: 0; left: 0; width: 100%; height: 0; z-index: 99999; pointer-events: none;"></div>

<div class="flex h-full">
    <div class="w-16 sm:w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 transition-all duration-200 h-full" style="height: 100vh; overflow: hidden;">
        <div id="server-list" class="server-sidebar-list flex-1 w-full">
            <div class="server-sidebar-icon <?php echo $isHomePage ? 'active' : ''; ?>">
                <a href="/home" class="block">
                    <div class="server-sidebar-button flex items-center justify-center transition-all duration-200">
                        <img src="<?php echo asset('/common/default-profile-picture.png'); ?>" alt="Home" class="discord-home-logo w-6 h-6 sm:w-8 sm:h-8">
                    </div>
                </a>
                <div class="tooltip hidden absolute left-12 sm:left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Home
                </div>
                <?php if ($isHomePage): ?>
                <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 sm:h-10 bg-white rounded-r-full"></div>
                <?php endif; ?>
            </div>
            
            <?php if (!empty($servers)): ?>
            <div class="server-sidebar-divider w-6 sm:w-8 h-0.5 bg-gray-600 rounded-full mx-auto"></div>
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
                    
                    <div class="server-sidebar-icon <?php echo $isActive ? 'active' : ''; ?>" data-server-id="<?php echo $serverId; ?>">
                        <a href="/server/<?php echo $serverId; ?>" class="block server-link" data-server-id="<?php echo $serverId; ?>">
                            <div class="server-sidebar-button flex items-center justify-center transition-all duration-200">
                                <?php if (!empty($serverImage)): ?>
                                    <img src="<?php echo htmlspecialchars($serverImage); ?>" alt="<?php echo htmlspecialchars($serverName); ?>" class="w-full h-full object-cover rounded-full">
                                <?php else: ?>
                                    <span class="text-white font-bold text-lg sm:text-xl"><?php echo htmlspecialchars($serverInitials); ?></span>
                                <?php endif; ?>
                            </div>
                        </a>
                        <div class="tooltip hidden absolute left-12 sm:left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                            <?php echo htmlspecialchars($serverName); ?>
                        </div>
                        <?php if ($isActive): ?>
                        <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 sm:h-10 bg-white rounded-r-full"></div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
            
            <div class="server-sidebar-icon">
                <button data-action="create-server" class="discord-add-server-button">
                    <i class="fas fa-plus discord-add-server-icon text-sm sm:text-base"></i>
                </button>
                <div class="tooltip hidden absolute left-12 sm:left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Add a Server
                </div>
            </div>
            
            <div class="server-sidebar-icon <?php echo $isExplorePage ? 'active' : ''; ?>">
                <a href="/explore-servers" class="block">
                    <div class="discord-explore-server-button <?php echo $isExplorePage ? 'active' : ''; ?>">
                        <i class="fas fa-compass discord-explore-server-icon text-sm sm:text-base"></i>
                    </div>
                </a>
                <div class="tooltip hidden absolute left-12 sm:left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Explore Public Servers
                </div>
                <?php if ($isExplorePage): ?>
                <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 sm:h-10 bg-white rounded-r-full"></div>
                <?php endif; ?>
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
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {

    


    setTimeout(() => {
        const tooltipContainer = document.getElementById('tooltip-container');
        if (tooltipContainer) {
            document.querySelectorAll('.tooltip').forEach(tooltip => {
                const clone = tooltip.cloneNode(true);
                tooltipContainer.appendChild(clone);
                tooltip.style.display = 'none';
                tooltip.setAttribute('data-has-clone', 'true');
            });
        }
    }, 500);
});


window.mouseX = 0;
window.mouseY = 0;
document.addEventListener('mousemove', (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
});

document.addEventListener('scroll', () => {
    if (window.hideAllTooltips) {
        window.hideAllTooltips();
    }
});
</script>

<?php
$additional_js = isset($additional_js) ? $additional_js : [];
$additional_js[] = 'components/servers/server-sidebar';
$additional_js[] = 'components/servers/server-drag';
?>
