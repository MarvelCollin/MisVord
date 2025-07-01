<?php
function renderServerCard($server, $userServerId, $isFeatured = false) {
    $serverId = $server['id'];
    $isMember = in_array($serverId, $userServerId);
    $cardClass = 'explore-server-card server-card bg-discord-dark rounded-xl overflow-hidden transition-all cursor-pointer group';
    ?>
    <div class="<?php echo $cardClass; ?>" data-server-id="<?php echo $serverId; ?>" data-category="<?php echo htmlspecialchars($server['category'] ?? ''); ?>">
        <div class="server-banner h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 relative overflow-hidden">
            <?php if (!empty($server['banner_url'])): ?>
                <img src="<?php echo htmlspecialchars($server['banner_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover">
            <?php endif; ?>
            
            <?php if ($isFeatured): ?>
                <div class="featured-badge">
                    <i class="fas fa-crown mr-1"></i>Featured
                </div>
            <?php endif; ?>
        </div>

        <div class="relative px-5 pt-5 pb-5">
            <div class="explore-server-icon-small server-icon-small absolute -top-8 left-5 w-16 h-16">
                <div class="w-full h-full rounded-xl bg-discord-dark p-1 shadow-xl relative overflow-hidden">
                    <?php if (!empty($server['image_url'])): ?>
                        <img src="<?php echo htmlspecialchars($server['image_url']); ?>" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover rounded-lg server-icon">
                    <?php else: ?>
                        <img src="/public/assets/common/default-profile-picture.png" alt="<?php echo htmlspecialchars($server['name']); ?>" class="w-full h-full object-cover rounded-lg server-icon">
                    <?php endif; ?>
                    <div class="absolute inset-0 ring-2 ring-white/20 rounded-lg"></div>
                </div>
            </div>

            <div class="mt-8 pl-2">
                <h3 class="server-name font-bold text-lg mb-2 text-white transition-colors"><?php echo htmlspecialchars($server['name'] ?? 'Unknown Server'); ?></h3>
                
                <?php if (!empty($server['description'])): ?>
                    <p class="server-description text-discord-lighter text-sm mb-4 line-clamp-2 leading-relaxed"><?php echo htmlspecialchars($server['description']); ?></p>
                <?php else: ?>
                    <p class="server-description text-discord-lighter text-sm mb-4">No description available</p>
                <?php endif; ?>

                <div class="server-stats flex items-center text-xs text-discord-lighter mb-4">
                    <span class="font-medium"><?php echo number_format($server['member_count'] ?? 0); ?> members</span>
                    <span class="mx-2">•</span>
                    <div class="flex items-center">
                        <div class="online-dot"></div>
                        <span class="font-medium"><?php echo rand(5, 50); ?> online</span>
                    </div>
                </div>

                <div class="mt-4">
                    <?php if ($isMember): ?>
                        <button onclick="event.preventDefault(); event.stopPropagation();" 
                               class="join-server-btn w-full bg-discord-green/20 text-discord-green text-center py-2.5 text-sm rounded-lg hover:bg-discord-green/30 transition-all font-semibold border border-discord-green/30" 
                               data-server-id="<?php echo $serverId; ?>">
                            <i class="fas fa-check mr-2"></i>Joined
                        </button>
                    <?php else: ?>
                        <button onclick="event.preventDefault(); event.stopPropagation();" 
                               class="join-server-btn w-full bg-discord-primary text-white text-center py-2.5 text-sm rounded-lg hover:bg-discord-primary/90 transition-all font-semibold" 
                               data-server-id="<?php echo $serverId; ?>">
                            <i class="fas fa-plus mr-2"></i>Join Server
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
    <?php
}
?> 