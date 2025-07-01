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
                <div class="flex items-center gap-2 mb-2">
                    <h3 class="server-name font-bold text-lg text-white transition-colors flex-1"><?php echo htmlspecialchars($server['name'] ?? 'Unknown Server'); ?></h3>
                    <?php if (!empty($server['category'])): ?>
                        <span class="category-badge"><?php echo htmlspecialchars(ucfirst($server['category'])); ?></span>
                    <?php endif; ?>
                </div>
                
                <?php if (!empty($server['description'])): ?>
                    <p class="server-description text-discord-lighter text-sm mb-3 line-clamp-2 leading-relaxed"><?php echo htmlspecialchars($server['description']); ?></p>
                <?php else: ?>
                    <p class="server-description text-discord-lighter text-sm mb-3">No description available</p>
                <?php endif; ?>
                
                <?php if (!empty($server['created_at'])): ?>
                    <div class="server-created text-xs text-discord-lighter mb-3 flex items-center">
                        <i class="fas fa-calendar-plus mr-1"></i>
                        <span>Created <?php echo date('M j, Y', strtotime($server['created_at'])); ?></span>
                    </div>
                <?php endif; ?>

                <div class="server-stats flex items-center text-xs text-discord-lighter mb-4">
                    <span class="font-medium"><?php echo number_format($server['member_count'] ?? 0); ?> members</span>
                </div>

                <div class="mt-4 space-y-2">
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
                    
                    <?php if (!empty($server['invite_link'])): ?>
                        <button onclick="event.preventDefault(); event.stopPropagation(); navigator.clipboard.writeText('<?php echo htmlspecialchars($server['invite_link']); ?>'); if(window.showToast) window.showToast('Invite link copied!', 'success');" 
                               class="w-full bg-discord-lighter/10 text-discord-lighter text-center py-2 text-xs rounded-lg hover:bg-discord-lighter/20 transition-all font-medium border border-discord-lighter/20">
                            <i class="fas fa-link mr-1"></i>Copy Invite
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
    <?php
}
?> 