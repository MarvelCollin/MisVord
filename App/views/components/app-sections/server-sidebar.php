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

<?php if ($isExplorePage): ?>
<style>
/* Critical styles for server icons in explore page to prevent collapse */
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

<!-- Server Group Styling -->
<style>
/* Global Discord styling and variables */
:root {
    --discord-darker: #1e1f22;
    --discord-dark: #2b2d31;
    --discord-primary: #5865f2;
    --discord-green: #3ba55c;
    --discord-red: #ed4245;
    --discord-text-normal: #dcddde;
    --discord-text-muted: #a3a6aa;
}

/* Server list and server icon base styling */
.server-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    position: relative;
    width: 72px;
}

.server-icon {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

.server-icon a {
    display: block;
    width: 100%;
    height: 100%;
}

/* Server groups styling */
.server-group {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    align-items: center;
}

.group-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    height: 24px;
    cursor: pointer;
    user-select: none;
}

.group-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--discord-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;
}

.group-name:hover {
    color: var(--discord-text-normal);
}

.group-header i {
    font-size: 9px;
    color: var(--discord-text-muted);
}

.group-servers {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 8px;
    padding: 4px 0;
}

/* Drag and drop styling */
.server-icon.dragging {
    opacity: 0.4;
    cursor: grabbing;
}

.server-group.drag-over {
    background-color: rgba(88, 101, 242, 0.1);
}

.server-group.drag-over .group-servers {
    background-color: rgba(88, 101, 242, 0.2);
    border-radius: 4px;
}

.server-icon.drop-target::after {
    content: "";
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px dashed var(--discord-primary);
    border-radius: 50%;
    pointer-events: none;
    z-index: 10;
}

/* Divider styling */
.server-divider {
    height: 2px;
    width: 32px;
    background-color: #36393f;
    border-radius: 1px;
    margin: 4px 0;
}

/* Drop target styling for server list */
.server-list.drop-target::after {
    content: "";
    position: absolute;
    left: 16px;
    right: 16px;
    height: 2px;
    background-color: var(--discord-primary);
    bottom: 60px;
    transition: all 0.2s;
}

/* Active server styling */
.server-icon.active .server-button {
    border-radius: 16px !important;
    background-color: var(--discord-primary) !important;
}

.server-icon.active::before {
    content: "";
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 40px;
    background-color: white;
    border-radius: 0 4px 4px 0;
}

/* Basic hover effect for server icons */
.server-button {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #36393f;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    overflow: hidden;
}

.server-icon:not(.active):hover .server-button {
    border-radius: 16px;
    background-color: var(--discord-primary);
}

.server-icon:not(.active):hover::before {
    content: "";
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background-color: white;
    border-radius: 0 4px 4px 0;
    transition: height 0.2s;
}
</style>

<div class="flex h-full">
    <div class="w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 overflow-visible">
        <div id="server-list" class="server-list flex-1 overflow-y-auto">
            <!-- Home Button -->
            <div class="server-icon mb-2 <?php echo $isHomePage ? 'active' : ''; ?>">
                <a href="/home" class="server-button flex items-center justify-center">
                    <div class="server-button <?php echo $isHomePage ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark hover:bg-discord-primary hover:rounded-2xl'; ?> flex items-center justify-center">
                        <i class="fa-brands fa-discord text-white text-xl"></i>
                    </div>
                </a>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Home
                </div>
            </div>
            
            <!-- Server List Divider -->
            <?php if (!empty($servers)): ?>
            <div class="server-divider"></div>
            <?php endif; ?>
            
            <!-- Server Icons will be populated here -->
            <?php if (!empty($servers)): ?>
                <?php foreach ($servers as $server): ?>
                    <?php 
                    $isActive = (string)$currentServerId === (string)($server['id'] ?? $server->id);
                    $serverInitials = substr($server['name'] ?? $server->name ?? 'S', 0, 1);
                    $serverImage = $server['image_url'] ?? $server->image_url ?? '';
                    $serverId = $server['id'] ?? $server->id;
                    $serverName = $server['name'] ?? $server->name ?? 'Server';
                    ?>
                    
                    <div class="server-icon mb-2 <?php echo $isActive ? 'active' : ''; ?>" data-server-id="<?php echo $serverId; ?>">
                        <a href="/server/<?php echo $serverId; ?>" class="block">
                            <div class="server-button <?php echo $isActive ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark'; ?> flex items-center justify-center">
                                <?php if (!empty($serverImage)): ?>
                                    <img src="<?php echo htmlspecialchars($serverImage); ?>" alt="<?php echo htmlspecialchars($serverName); ?>" class="w-full h-full object-cover">
                                <?php else: ?>
                                    <span class="text-white font-bold text-xl"><?php echo htmlspecialchars($serverInitials); ?></span>
                                <?php endif; ?>
                            </div>
                        </a>
                        <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                            <?php echo htmlspecialchars($serverName); ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
            
            <!-- Add Server Button -->
            <div class="server-icon mt-2">
                <button data-action="create-server" class="server-button bg-discord-dark rounded-full hover:rounded-2xl hover:bg-discord-green border-none cursor-pointer outline-none">
                    <i class="fas fa-plus text-green-500 hover:text-white text-xl transition-colors duration-200"></i>
                </button>
                <div class="tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50">
                    Add a Server
                </div>
            </div>
            
            <!-- Explore Servers Button -->
            <div class="server-icon mt-2 <?php echo $isExplorePage ? 'active' : ''; ?>">
                <a href="/explore-servers" class="block">
                    <div class="server-button <?php echo $isExplorePage ? 'rounded-2xl bg-discord-primary' : 'rounded-full bg-discord-dark hover:bg-discord-green hover:rounded-2xl'; ?> flex items-center justify-center">
                        <i class="fas fa-compass <?php echo $isExplorePage ? 'text-white' : 'text-green-500 hover:text-white'; ?> text-xl transition-colors duration-200"></i>
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
    
    // Initialize tooltips
    document.querySelectorAll('.server-icon').forEach(icon => {
        const tooltip = icon.querySelector('.tooltip');
        if (tooltip) {
            icon.addEventListener('mouseenter', () => {
                tooltip.classList.remove('hidden');
            });
            
            icon.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
            });
        }
    });
});
</script>
