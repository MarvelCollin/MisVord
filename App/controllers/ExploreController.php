<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/BaseController.php';

class ExploreController extends BaseController
{

    private $serverRepository;
    private $userServerMembershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }
    
    public function getPublicServers()
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $servers = [];
        $userServerId = [];        try {
            $servers = $this->serverRepository->getPublicServersWithMemberCount();
            
            $servers = array_map(function($server) {
                if (!is_array($server)) {
                    return (array) $server;
                }
                return $server;
            }, $servers);
            
            $userServerId = $this->userServerMembershipRepository->getServerIdsForUser($currentUserId);
        } catch (Exception $e) {
            log_error("Error fetching public servers", ['error' => $e->getMessage()]);
            $servers = [];
            $userServerId = [];
        }

        return [
            'servers' => $servers,
            'userServerIds' => $userServerId
        ];
    }

    private function getFeaturedServers($limit = 3)
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $featuredServers = [];
        $userServerId = [];        
        
        try {
            $featuredServers = $this->serverRepository->getFeaturedServersWithMemberCount($limit);
            
            $featuredServers = array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $featuredServers);
            
            $userServerId = $this->userServerMembershipRepository->getServerIdsForUser($currentUserId);
        } catch (Exception $e) {
            log_error("Error fetching featured servers", ['error' => $e->getMessage()]);
            $featuredServers = [];
            $userServerId = [];
        }

        return [
            'featuredServers' => $featuredServers,
            'userServerIds' => $userServerId
        ];
    }

    public function prepareExploreData()
    {

        $currentUserId = $_SESSION['user_id'] ?? 0;

        $userServers = $this->serverRepository->getForUser($currentUserId);
        $userServers = array_map(function($server) {
            return is_array($server) ? $server : (array) $server;
        }, $userServers);
        
        $GLOBALS['userServers'] = $userServers;        
        $allServersData = $this->getPublicServers();
        $featuredServersData = $this->getFeaturedServers(3);

        $categories = [
            'gaming' => 'Gaming',
            'music' => 'Music',
            'education' => 'Education',
            'science' => 'Science & Tech',
            'entertainment' => 'Entertainment',
            'community' => 'Community'
        ];

        return [
            'userServers' => $userServers,
            'servers' => $allServersData['servers'],
            'userServerIds' => $allServersData['userServerIds'],
            'featuredServers' => $featuredServersData['featuredServers'],
            'categories' => $categories,
            'currentUserId' => $currentUserId
        ];
    }

    public function getExploreLayout()
    {
        $this->requireAuth();

        try {
            if (!$this->isAjaxRequest()) {
                header('HTTP/1.1 400 Bad Request');
                exit('AJAX request required');
            }

            $exploreData = $this->prepareExploreData();
            
            $userServers = $exploreData['userServers'];
            $servers = $exploreData['servers'];
            $userServerId = $exploreData['userServerIds'];
            $featuredServers = $exploreData['featuredServers'];
            $categories = $exploreData['categories'];

            ob_start();
            ?>
            <?php include __DIR__ . '/../views/components/app-sections/server-sidebar.php'; ?>

            <div class="flex-1 bg-discord-background overflow-y-auto">
                <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <div class="mb-8 slide-up">
                        <h1 class="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Explore Servers
                        </h1>
                        <p class="text-discord-lighter text-lg">Find and join amazing communities on misvord</p>
                    </div>

                    <div class="mb-8 filter-section flex flex-col sm:flex-row gap-4 slide-up">
                        <div class="search-container flex-1 min-w-0">
                            <input type="text" id="server-search" placeholder="Search for communities..." 
                                   class="server-search w-full bg-discord-dark text-white rounded-lg px-4 py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-discord-primary transition-all">
                            <i class="search-icon fas fa-search"></i>
                        </div>

                        <div class="flex gap-3">
                            <select id="category-filter" class="filter-dropdown bg-discord-dark text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-discord-primary min-w-[140px]">
                                <option value="">All Categories</option>
                                <?php foreach ($categories as $key => $name): ?>
                                    <option value="<?php echo $key; ?>"><?php echo $name; ?></option>
                                <?php endforeach; ?>
                            </select>

                            <button id="sort-btn" class="sort-btn bg-discord-dark text-white rounded-lg px-5 py-3 focus:outline-none hover:bg-discord-light transition-all flex items-center gap-2">
                                <i class="fas fa-sort-amount-down"></i>
                                <span class="hidden sm:inline">Sort</span>
                            </button>
                        </div>
                    </div>

                    <div class="mb-10 fade-in">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl lg:text-2xl font-bold text-white">Featured Servers</h2>
                            <div class="flex items-center text-discord-lighter text-sm">
                                <i class="fas fa-star text-yellow-400 mr-2"></i>
                                <span>Hand-picked communities</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="featured-servers">
                            <?php 
                            foreach ($featuredServers as $server): 
                                $isMember = in_array($server['id'], $userServerId);
                            ?>
                                <div class="server-card bg-discord-dark rounded-xl overflow-hidden transition-all cursor-pointer group"
                                     data-server-id="<?php echo $server['id']; ?>" data-category="<?php echo htmlspecialchars($server['category'] ?? ''); ?>">
                                    <div class="server-banner h-36 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 relative overflow-hidden">
                                        <?php if (!empty($server['banner_url'])): ?>
                                            <img src="<?php echo htmlspecialchars($server['banner_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
                                        <?php endif; ?>
                                        
                                        <div class="featured-badge">
                                            <i class="fas fa-crown mr-1"></i>Featured
                                        </div>
                                    </div>

                                    <div class="relative px-6 pt-4 pb-6">
                                        <div class="server-icon absolute -top-10 left-6">
                                            <div class="w-18 h-18 rounded-2xl bg-discord-dark p-1 shadow-xl">
                                                <?php if (!empty($server['image_url'])): ?>
                                                    <img src="<?php echo htmlspecialchars($server['image_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover rounded-xl">
                                                <?php else: ?>
                                                    <div class="w-full h-full bg-discord-primary rounded-xl flex items-center justify-center">
                                                        <span class="text-white font-bold text-2xl"><?php echo substr($server['name'], 0, 1); ?></span>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>

                                        <div class="mt-8">
                                            <h3 class="server-name font-bold text-xl mb-2 text-white transition-colors"><?php echo htmlspecialchars($server['name']); ?></h3>
                                            <?php if (!empty($server['description'])): ?>
                                                <p class="server-description text-discord-lighter text-sm mb-4 line-clamp-2 leading-relaxed"><?php echo htmlspecialchars($server['description']); ?></p>
                                            <?php else: ?>
                                                <p class="server-description text-discord-lighter text-sm mb-4">No description available</p>
                                            <?php endif; ?>

                                            <div class="server-stats flex items-center text-xs text-discord-lighter mb-5">
                                                <div class="flex items-center mr-6">
                                                    <i class="fas fa-users mr-2 text-discord-primary"></i>
                                                    <span class="font-medium"><?php echo number_format($server['member_count']); ?> members</span>
                                                </div>
                                                <div class="flex items-center">
                                                    <div class="online-dot"></div>
                                                    <span class="font-medium"><?php echo rand(5, 50); ?> online</span>
                                                </div>
                                            </div>

                                            <?php if ($isMember): ?>
                                                <button onclick="event.preventDefault(); event.stopPropagation();" 
                                                       class="join-server-btn w-full bg-discord-green/20 text-discord-green text-center py-3 rounded-lg hover:bg-discord-green/30 transition-all font-semibold text-sm border border-discord-green/30" 
                                                       data-server-id="<?php echo $server['id']; ?>" disabled>
                                                    <i class="fas fa-check mr-2"></i>Joined
                                                </button>
                                            <?php else: ?>
                                                <button onclick="event.preventDefault(); event.stopPropagation();" 
                                                       class="join-server-btn w-full bg-discord-primary text-white text-center py-3 rounded-lg hover:bg-discord-primary/90 transition-all font-semibold text-sm" 
                                                       data-server-id="<?php echo $server['id']; ?>">
                                                    <i class="fas fa-plus mr-2"></i>Join Server
                                                </button>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>

                            <?php if (empty($featuredServers)): ?>
                                <div class="col-span-full bg-discord-dark rounded-xl p-12 text-center">
                                    <div class="w-20 h-20 bg-discord-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-star text-3xl text-discord-primary"></i>
                                    </div>
                                    <h3 class="text-xl font-bold mb-2">No Featured Servers</h3>
                                    <p class="text-discord-lighter">Check back later for hand-picked communities.</p>
                                </div>
                            <?php endif; ?>
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
                                <?php 
                                $serverId = $server['id'];
                                $isMember = in_array($serverId, $userServerId);
                                ?>
                                <div class="server-card bg-discord-dark rounded-xl overflow-hidden transition-all cursor-pointer group" 
                                     data-server-id="<?php echo $serverId; ?>" data-category="<?php echo htmlspecialchars($server['category'] ?? ''); ?>">
                                    <div class="p-5">
                                        <div class="flex items-start mb-4">
                                            <div class="w-14 h-14 rounded-xl bg-discord-primary overflow-hidden mr-4 flex-shrink-0 shadow-lg">
                                                <?php if (!empty($server['image_url'])): ?>
                                                    <img src="<?php echo htmlspecialchars($server['image_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
                                                <?php else: ?>
                                                    <div class="w-full h-full flex items-center justify-center">
                                                        <span class="text-white font-bold text-lg"><?php echo substr($server['name'] ?? 'N', 0, 1); ?></span>
                                                    </div>
                                                <?php endif; ?>
                                            </div>

                                            <div class="flex-1 min-w-0">
                                                <h3 class="server-name font-bold text-lg mb-1 text-white transition-colors truncate"><?php echo htmlspecialchars($server['name'] ?? 'Unknown Server'); ?></h3>
                                                <div class="server-stats flex items-center text-xs text-discord-lighter">
                                                    <span class="font-medium"><?php echo number_format($server['member_count'] ?? 0); ?> members</span>
                                                    <span class="mx-2">•</span>
                                                    <div class="flex items-center">
                                                        <div class="online-dot"></div>
                                                        <span class="font-medium"><?php echo rand(5, 50); ?> online</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <?php if (!empty($server['description'])): ?>
                                            <p class="server-description text-discord-lighter text-sm mb-4 line-clamp-2 leading-relaxed"><?php echo htmlspecialchars($server['description']); ?></p>
                                        <?php else: ?>
                                            <p class="server-description text-discord-lighter text-sm mb-4">No description available</p>
                                        <?php endif; ?>

                                        <?php if ($isMember): ?>
                                            <button onclick="event.preventDefault(); event.stopPropagation();" 
                                                   class="join-server-btn w-full bg-discord-green/20 text-discord-green text-center py-2.5 text-sm rounded-lg hover:bg-discord-green/30 transition-all font-semibold border border-discord-green/30" 
                                                   data-server-id="<?php echo $serverId; ?>" disabled>
                                                <i class="fas fa-check mr-2"></i>Joined
                                            </button>
                                        <?php else: ?>
                                            <button onclick="event.preventDefault(); event.stopPropagation();" 
                                                   class="join-server-btn w-full bg-discord-primary text-white text-center py-2.5 text-sm rounded-lg hover:bg-discord-primary/90 transition-all font-semibold" 
                                                   data-server-id="<?php echo $serverId; ?>">
                                                <i class="fas fa-plus mr-2"></i>Join
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>

                            <?php if (empty($servers)): ?>
                                <div class="col-span-full bg-discord-dark rounded-xl p-12 text-center">
                                    <div class="w-20 h-20 bg-discord-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-search text-3xl text-discord-primary"></i>
                                    </div>
                                    <h3 class="text-xl font-bold mb-2">No Servers Found</h3>
                                    <p class="text-discord-lighter mb-6">There are no public servers available right now.</p>
                                    <a href="#" onclick="event.preventDefault(); if(window.showCreateServerModal) window.showCreateServerModal();" class="inline-flex items-center gap-2 bg-discord-primary text-white px-6 py-3 rounded-lg hover:bg-discord-primary/90 transition-colors font-semibold">
                                        <i class="fas fa-plus"></i>
                                        Create Your Own Server
                                    </a>
                                </div>
                            <?php endif; ?>
                        </div>

                        <div id="loading-skeleton" class="loading-grid hidden">
                            <?php for ($i = 0; $i < 8; $i++): ?>
                                <div class="skeleton-card">
                                    <div class="skeleton skeleton-banner"></div>
                                    <div class="p-5 relative">
                                        <div class="skeleton skeleton-icon"></div>
                                        <div class="pt-8">
                                            <div class="skeleton skeleton-text w-3/4 mb-3"></div>
                                            <div class="skeleton skeleton-text small mb-2"></div>
                                            <div class="skeleton skeleton-text small mb-4"></div>
                                            <div class="skeleton skeleton-text w-full h-10 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                            <?php endfor; ?>
                        </div>
                    </div>
                </div>

                <script>
                if (typeof window.initExplorePage === 'function') {
                    window.initExplorePage();
                } else {
                    document.addEventListener('DOMContentLoaded', function() {
                        if (typeof window.initExplorePage === 'function') {
                            window.initExplorePage();
                        }
                    });
                }
                </script>
            </div>
            <?php
            $html = ob_get_clean();
            echo $html;
            exit;

        } catch (Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo 'Failed to load explore layout: ' . $e->getMessage();
            exit;
        }
    }
}
