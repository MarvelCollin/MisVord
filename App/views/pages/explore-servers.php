<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

require_once dirname(dirname(__DIR__)) . '/controllers/ExploreController.php';
$exploreController = new ExploreController();
$exploreData = $exploreController->prepareExploreData();

$userServers = $exploreData['userServers'];
$servers = $exploreData['servers'];
$userServerId = $exploreData['userServerIds'];
$featuredServers = $exploreData['featuredServers'];
$categories = $exploreData['categories'];

$page_title = 'misvord - Explore Servers';
$body_class = 'bg-discord-dark text-white';
$page_css = 'explore-servers';
$page_js = 'pages/explore-servers';
$head_scripts = ['logger-init'];
$additional_js = ['components/servers/server-dropdown'];
?>

<?php ob_start(); ?>

<div class="flex min-h-screen">
    <!-- Side Navigation -->
    <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/server-sidebar.php'; ?>

    <!-- Main Content -->
    <div class="flex-1 bg-discord-background overflow-y-auto">
        <div class="p-6 max-w-7xl mx-auto">
            <div class="mb-8">
                <h1 class="text-2xl font-bold mb-2">Explore Servers</h1>
                <p class="text-discord-lighter">Find and join communities on misvord</p>
            </div>

            <!-- Search and Filter -->
            <div class="mb-6 flex flex-wrap gap-4">
                <div class="relative flex-1 min-w-[200px]">
                    <input type="text" id="server-search" placeholder="Search servers" 
                           class="w-full bg-discord-dark text-white rounded-md px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-discord-primary">
                    <i class="fas fa-search absolute left-3 top-3 text-discord-lighter"></i>
                </div>

                <div class="flex gap-2">
                    <select id="category-filter" class="bg-discord-dark text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-discord-primary">
                        <option value="">All Categories</option>
                        <?php foreach ($categories as $key => $name): ?>
                            <option value="<?php echo $key; ?>"><?php echo $name; ?></option>
                        <?php endforeach; ?>
                    </select>

                    <button id="sort-btn" class="bg-discord-dark text-white rounded-md px-4 py-2 focus:outline-none hover:bg-discord-light">
                        <i class="fas fa-sort-amount-down mr-2"></i>Sort
                    </button>
                </div>
            </div>

            <!-- Featured Servers -->
            <div class="mb-8">
                <h2 class="text-lg font-bold mb-4">Featured Servers</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="featured-servers">
                    <?php 
                    foreach ($featuredServers as $server): 
                        $isMember = in_array($server['id'], $userServerId);
                    ?>
                        <div class="bg-discord-dark rounded-lg overflow-hidden hover:shadow-lg transition-shadow server-card">
                            <div class="h-32 bg-gradient-to-r from-purple-500 to-blue-500 relative">
                                <?php if (!empty($server['banner_url'])): ?>
                                    <img src="<?php echo htmlspecialchars($server['banner_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
                                <?php endif; ?>

                                <div class="absolute bottom-0 transform translate-y-1/2 left-4">
                                    <div class="w-16 h-16 rounded-2xl bg-discord-dark p-1">
                                        <?php if (!empty($server['image_url'])): ?>
                                            <img src="<?php echo htmlspecialchars($server['image_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover rounded-xl">
                                        <?php else: ?>
                                            <div class="w-full h-full bg-discord-primary rounded-xl flex items-center justify-center">
                                                <span class="text-white font-bold text-xl"><?php echo substr($server['name'], 0, 1); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 pt-10">
                                <h3 class="font-bold text-lg mb-1"><?php echo htmlspecialchars($server['name']); ?></h3>
                                <?php if (!empty($server['description'])): ?>
                                    <p class="text-discord-lighter text-sm mb-3 line-clamp-2"><?php echo htmlspecialchars($server['description']); ?></p>
                                <?php else: ?>
                                    <p class="text-discord-lighter text-sm mb-3">No description available</p>
                                <?php endif; ?>

                                <div class="flex items-center text-xs text-discord-lighter mb-4">
                                    <div class="flex items-center mr-4">
                                        <i class="fas fa-user-group mr-1"></i>
                                        <span><?php echo number_format($server['member_count']); ?> members</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="fas fa-circle text-discord-green mr-1 text-[8px]"></i>
                                        <span><?php echo rand(5, 50); ?> online</span>
                                    </div>
                                </div>

                                <?php if ($isMember): ?>
                                    <a href="/server/<?php echo $server['id']; ?>" class="block w-full bg-discord-green/30 text-discord-green text-center py-2 rounded-md hover:bg-discord-green/40 transition-colors">
                                        <i class="fas fa-check mr-2"></i>Joined
                                    </a>
                                <?php else: ?>
                                    <a href="/join/<?php echo $server['invite_link']; ?>" class="block w-full bg-discord-primary text-white text-center py-2 rounded-md hover:bg-discord-primary/90 transition-colors">
                                        Join Server
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <?php if (empty($featuredServers)): ?>
                        <div class="col-span-3 bg-discord-dark rounded-lg p-8 text-center">
                            <i class="fas fa-server text-4xl text-discord-lighter mb-4"></i>
                            <h3 class="text-xl font-bold mb-2">No Featured Servers</h3>
                            <p class="text-discord-lighter">There are no featured servers available right now.</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- All Available Servers -->
            <div>
                <h2 class="text-lg font-bold mb-4">All Servers</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="all-servers">
                    <?php foreach ($servers as $server): 
                        $isMember = in_array($server['id'], $userServerId);
                    ?>
                        <div class="bg-discord-dark rounded-lg overflow-hidden hover:shadow-lg transition-shadow server-card" data-category="<?php echo htmlspecialchars($server['category'] ?? ''); ?>">
                            <div class="p-4">
                                <div class="flex items-start mb-3">
                                    <div class="w-12 h-12 rounded-xl bg-discord-primary overflow-hidden mr-3 flex-shrink-0">
                                        <?php if (!empty($server['image_url'])): ?>
                                            <img src="<?php echo htmlspecialchars($server['image_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
                                        <?php else: ?>
                                            <div class="w-full h-full flex items-center justify-center">
                                                <span class="text-white font-bold text-xl"><?php echo substr($server['name'], 0, 1); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <div>
                                        <h3 class="font-bold server-name"><?php echo htmlspecialchars($server['name']); ?></h3>
                                        <div class="flex items-center text-xs text-discord-lighter mt-1">
                                            <span><?php echo number_format($server['member_count']); ?> members</span>
                                            <span class="mx-1.5">•</span>
                                            <span><?php echo rand(5, 50); ?> online</span>
                                        </div>
                                    </div>
                                </div>

                                <?php if (!empty($server['description'])): ?>
                                    <p class="text-discord-lighter text-sm mb-3 line-clamp-2 server-description"><?php echo htmlspecialchars($server['description']); ?></p>
                                <?php else: ?>
                                    <p class="text-discord-lighter text-sm mb-3">No description available</p>
                                <?php endif; ?>

                                <?php if ($isMember): ?>
                                    <a href="/server/<?php echo $server['id']; ?>" class="block w-full bg-discord-green/30 text-discord-green text-center py-1.5 text-sm rounded-md hover:bg-discord-green/40 transition-colors">
                                        <i class="fas fa-check mr-1"></i>Joined
                                    </a>
                                <?php else: ?>
                                    <a href="/join/<?php echo $server['invite_link']; ?>" class="block w-full bg-discord-primary text-white text-center py-1.5 text-sm rounded-md hover:bg-discord-primary/90 transition-colors">
                                        Join
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <?php if (empty($servers)): ?>
                        <div class="col-span-4 bg-discord-dark rounded-lg p-8 text-center">
                            <i class="fas fa-search text-4xl text-discord-lighter mb-4"></i>
                            <h3 class="text-xl font-bold mb-2">No Servers Found</h3>
                            <p class="text-discord-lighter">There are no public servers available right now.</p>
                            <a href="/create-server" class="inline-block mt-4 bg-discord-primary text-white px-4 py-2 rounded-md hover:bg-discord-primary/90 transition-colors">
                                Create Your Own Server
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>