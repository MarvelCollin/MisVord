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

<link rel="stylesheet" href="/public/css/server-sidebar.css">



<div class="flex h-full">
    <div class="w-[72px] sm:w-[72px] md:w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 overflow-visible transition-all duration-200">
        <div id="server-list" class="server-sidebar-list flex-1 overflow-y-auto">
            <div class="server-sidebar-icon mb-2 <?php echo $isHomePage ? 'active' : ''; ?>">
                <a href="/home" class="server-sidebar-button flex items-center justify-center">
                    <div class="server-sidebar-button <?php echo $isHomePage ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark hover:bg-discord-primary hover:rounded-2xl'; ?> flex items-center justify-center transition-all duration-200">
                        <img src="<?php echo asset('/common/main-logo.png'); ?>" alt="Home" class="discord-home-logo">
                    </div>
                </a>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Home
                </div>
            </div>
            
            <?php if (!empty($servers)): ?>
            <div class="server-sidebar-divider"></div>
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
                    
                    <div class="server-sidebar-icon mb-2 <?php echo $isActive ? 'active' : ''; ?>">
                        <a href="/server/<?php echo $serverId; ?>" class="block" data-server-id="<?php echo $serverId; ?>">
                            <div class="server-sidebar-button <?php echo $isActive ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark'; ?> flex items-center justify-center transition-all duration-200">
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
            
            <div class="server-sidebar-icon mt-2">
                <button data-action="create-server" class="discord-add-server-button">
                    <i class="fas fa-plus discord-add-server-icon"></i>
                </button>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Add a Server
                </div>
            </div>
            
            <div class="server-sidebar-icon mt-2 <?php echo $isExplorePage ? 'active' : ''; ?>">
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
    

</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    
    
    document.querySelectorAll('.server-sidebar-icon').forEach(icon => {
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

$additional_js = isset($additional_js) ? $additional_js : [];
$additional_js[] = 'components/servers/server-sidebar';
?>
