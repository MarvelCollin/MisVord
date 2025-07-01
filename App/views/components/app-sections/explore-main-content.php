<?php
$servers = $GLOBALS['servers'] ?? [];
$userServerId = $GLOBALS['userServerIds'] ?? [];
$featuredServers = $GLOBALS['featuredServers'] ?? [];
$categories = $GLOBALS['categories'] ?? [];

require_once dirname(__DIR__) . '/explore/server-card.php';
?>

<div class="flex-1 bg-discord-background overflow-y-auto">
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div class="mb-8 slide-up">
            <h1 class="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Explore Servers
            </h1>
            <p class="text-discord-lighter text-lg">Find and join amazing communities on misvord</p>
        </div>

        <div class="filter-section mb-8 slide-up">
            <div class="search-container">
                <input type="text" 
                       id="server-search" 
                       placeholder="Search for communities..." 
                       class="server-search">
                <i class="search-icon fas fa-search"></i>
            </div>
            
            <div class="filter-controls">
                <select id="category-filter" class="filter-dropdown">
                    <option value="">All Categories</option>
                    <?php foreach ($categories as $key => $name): ?>
                        <option value="<?php echo $key; ?>"><?php echo $name; ?></option>
                    <?php endforeach; ?>
                </select>

                <div class="sort-container">
                    <button id="sort-btn" class="sort-btn">
                        <i class="fas fa-sort-amount-down"></i>
                        <span>Sort</span>
                    </button>
                    <div id="sort-dropdown" class="sort-dropdown">
                        <div class="sort-option" data-sort="newest">
                            <i class="fas fa-calendar-plus"></i>
                            <span>Newest First</span>
                        </div>
                        <div class="sort-option" data-sort="oldest">
                            <i class="fas fa-calendar-minus"></i>
                            <span>Oldest First</span>
                        </div>
                        <div class="sort-option" data-sort="members-desc">
                            <i class="fas fa-users"></i>
                            <span>Most Members</span>
                        </div>
                        <div class="sort-option" data-sort="members-asc">
                            <i class="fas fa-user"></i>
                            <span>Least Members</span>
                        </div>
                        <div class="sort-option active" data-sort="alphabetical">
                            <i class="fas fa-sort-alpha-down"></i>
                            <span>A to Z</span>
                        </div>
                        <div class="sort-option" data-sort="alphabetical-desc">
                            <i class="fas fa-sort-alpha-up"></i>
                            <span>Z to A</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl lg:text-2xl font-bold text-white">Discover Communities</h2>
                <div class="flex items-center text-discord-lighter text-sm">
                    <i class="fas fa-compass mr-2"></i>
                    <span><?php echo count($servers); ?> servers available</span>
                </div>
            </div>
            <div class="grid-container server-grid" id="all-servers">
                <?php foreach ($servers as $server): ?>
                    <?php renderServerCard($server, $userServerId, false); ?>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>
