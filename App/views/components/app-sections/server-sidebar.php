<?php
$currentUserId = $_SESSION['user_id'] ?? 0;
$servers = [];

try {
    $host = 'localhost';
    $port = 1003;
    $dbname = 'misvord';
    $username = 'root';
    $password = 'password';
    $charset = 'utf8mb4';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    $stmt = $pdo->prepare("
        SELECT s.* FROM servers s 
        JOIN server_members sm ON s.id = sm.server_id 
        WHERE sm.user_id = ?
    ");
    $stmt->execute([$currentUserId]);
    $servers = $stmt->fetchAll();
} catch (PDOException $e) {
    $servers = [];
}

$currentServerId = $currentServer['id'] ?? null;
$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$isHomePage = !str_contains($currentPath, '/server/');
?>

<div class="flex h-full">
    <div class="w-[72px] bg-discord-darker flex flex-col items-center pt-3 pb-3 space-y-2 overflow-y-auto">
        <a href="/home" class="group flex items-center justify-center">
            <div class="w-12 h-12 rounded-2xl <?php echo $isHomePage ? 'bg-discord-primary rounded-[16px]' : 'bg-discord-dark rounded-full hover:rounded-2xl hover:bg-discord-primary'; ?> flex items-center justify-center transition-all duration-200">
                <i class="fa-brands fa-discord text-white text-xl"></i>
            </div>
            <?php if ($isHomePage): ?>
                <div class="absolute left-0 w-1 h-10 bg-white rounded-r-md"></div>
            <?php endif; ?>
        </a>
        
        <div class="w-8 h-0.5 bg-discord-dark rounded my-1"></div>
        
        <?php foreach ($servers as $server): ?>
            <?php 
            $isActive = $currentServerId === $server['id'];
            $serverInitials = substr($server['name'] ?? 'S', 0, 1);
            $serverImage = $server['image_url'] ?? '';
            ?>
            <a href="/server/<?php echo $server['id']; ?>" class="group flex items-center justify-center relative">
                <div class="w-12 h-12 overflow-hidden <?php echo $isActive ? 'rounded-2xl' : 'rounded-full hover:rounded-2xl'; ?> transition-all duration-200 bg-discord-dark flex items-center justify-center">
                    <?php if (!empty($serverImage)): ?>
                        <img src="<?php echo htmlspecialchars($serverImage); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
                    <?php else: ?>
                        <span class="text-white font-bold text-xl"><?php echo htmlspecialchars($serverInitials); ?></span>
                    <?php endif; ?>
                </div>
                <?php if ($isActive): ?>
                    <div class="absolute left-0 w-1 h-10 bg-white rounded-r-md"></div>
                <?php else: ?>
                    <div class="absolute left-0 w-1 h-10 bg-white rounded-r-md scale-y-0 group-hover:scale-y-[0.5] transition-transform duration-150"></div>
                <?php endif; ?>
            </a>
        <?php endforeach; ?>
        
        <div class="server-list-add mt-2">
            <button data-action="create-server" class="w-12 h-12 bg-discord-dark rounded-full flex items-center justify-center hover:bg-discord-primary transition-colors">
                <i class="fas fa-plus text-green-500"></i>
            </button>
        </div>
        
        <a href="/explore-servers" class="flex items-center justify-center">
            <div class="w-12 h-12 rounded-full hover:rounded-2xl bg-discord-dark hover:bg-discord-green flex items-center justify-center transition-all duration-200">
                <i class="fas fa-compass text-discord-green group-hover:text-white"></i>
            </div>
        </a>
    </div>
    
    <?php if (isset($contentType) && $contentType === 'server' && isset($currentServer)): ?>
    <div class="w-60 bg-discord-dark flex flex-col">
        <div class="h-12 border-b border-black flex items-center px-4 shadow-sm">
            <h2 class="font-bold text-white truncate flex-1"><?php echo htmlspecialchars($currentServer['name'] ?? 'Server'); ?></h2>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-chevron-down"></i>
            </button>
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
