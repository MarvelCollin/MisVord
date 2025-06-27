<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section id="featured-cards" class="swipe-section featured-cards-section scroll-section min-h-screen relative flex items-center justify-center overflow-hidden py-16" data-section="featured-cards">
    <div class="cosmos-background">
        <div class="stars-layer">
            <?php for ($i = 0; $i < 40; $i++): ?>
                <div class="star small" style="top: <?php echo rand(5, 95) . '%; left: ' . rand(5, 95); ?>%;"></div>
            <?php endfor; ?>

            <?php for ($i = 0; $i < 20; $i++): ?>
                <div class="star medium" style="top: <?php echo rand(5, 95) . '%; left: ' . rand(5, 95); ?>%;"></div>
            <?php endfor; ?>

            <?php for ($i = 0; $i < 10; $i++): ?>
                <div class="star large" style="top: <?php echo rand(5, 95) . '%; left: ' . rand(5, 95); ?>%;"></div>
            <?php endfor; ?>
        </div>
    </div>

    <div class="nebula nebula-1"></div>
    <div class="nebula nebula-2"></div>
    <div class="nebula nebula-3"></div>

    <div class="container mx-auto px-4 relative z-10">


        <div class="cards-container relative">
            <div class="featured-card card-voice" data-tilt="true">
                <div class="card-background"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="app-icon">
                            <i class="fas fa-headset"></i>
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">Voice Chat</h3>
                            <span class="app-category">Communication</span>
                        </div>
                        <div class="card-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Active</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="app-description">High-quality voice communication with advanced audio controls and screen sharing capabilities</p>
                        <div class="app-stats">
                            <div class="stat">
                                <i class="fas fa-microphone"></i>
                                <span>Crystal Clear Audio</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-video"></i>
                                <span>Video Support</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-btn primary">
                            <i class="fas fa-headset"></i>
                            Join Voice Channel
                        </button>
                        <button class="card-btn secondary">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                <div class="card-glow"></div>
            </div>

            <div class="featured-card card-nitro" data-tilt="true">
                <div class="card-background"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="app-icon">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">Nitro Premium</h3>
                            <span class="app-category">Premium</span>
                        </div>
                        <div class="card-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Premium</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="app-description">Unlock exclusive features with Nitro codes including enhanced profiles and premium perks</p>
                        <div class="app-stats">
                            <div class="stat">
                                <i class="fas fa-star"></i>
                                <span>Exclusive Features</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-palette"></i>
                                <span>Custom Themes</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-btn primary">
                            <i class="fas fa-crown"></i>
                            Get Nitro
                        </button>
                        <button class="card-btn secondary">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="card-glow"></div>
            </div>

            <div class="featured-card card-bots" data-tilt="true">
                <div class="card-background"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="app-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">Smart Bots</h3>
                            <span class="app-category">Automation</span>
                        </div>
                        <div class="card-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Active</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="app-description">Create and manage intelligent bots for server automation and enhanced user engagement</p>
                        <div class="app-stats">
                            <div class="stat">
                                <i class="fas fa-cogs"></i>
                                <span>Auto Moderation</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-magic"></i>
                                <span>Custom Commands</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-btn primary">
                            <i class="fas fa-plus"></i>
                            Create Bot
                        </button>
                        <button class="card-btn secondary">
                            <i class="fas fa-book"></i>
                        </button>
                    </div>
                </div>
                <div class="card-glow"></div>
            </div>

            <div class="featured-card card-server" data-tilt="true">
                <div class="card-background"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="app-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">Server Manager</h3>
                            <span class="app-category">Management</span>
                        </div>
                        <div class="card-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Active</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="app-description">Comprehensive server administration tools with role management and member insights</p>
                        <div class="app-stats">
                            <div class="stat">
                                <i class="fas fa-users"></i>
                                <span>Member Control</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-chart-bar"></i>
                                <span>Analytics</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-btn primary">
                            <i class="fas fa-tools"></i>
                            Manage Server
                        </button>
                        <button class="card-btn secondary">
                            <i class="fas fa-question-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="card-glow"></div>
            </div>

            <div class="featured-card card-friends" data-tilt="true">
                <div class="card-background"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="app-icon">
                            <i class="fas fa-user-friends"></i>
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">Friends Network</h3>
                            <span class="app-category">Social</span>
                        </div>
                        <div class="card-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Active</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="app-description">Connect with friends through direct messages and private chat rooms with real-time notifications</p>
                        <div class="app-stats">
                            <div class="stat">
                                <i class="fas fa-message"></i>
                                <span>Direct Messages</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-bell"></i>
                                <span>Real-time Alerts</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-btn primary">
                            <i class="fas fa-user-plus"></i>
                            Add Friends
                        </button>
                        <button class="card-btn secondary">
                            <i class="fas fa-address-book"></i>
                        </button>
                    </div>
                </div>
                <div class="card-glow"></div>
            </div>

            <div class="featured-card card-explorer" data-tilt="true">
                <div class="card-background"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="app-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">Server Explorer</h3>
                            <span class="app-category">Discovery</span>
                        </div>
                        <div class="card-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Active</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="app-description">Discover and join public servers based on your interests with smart recommendation system</p>
                        <div class="app-stats">
                            <div class="stat">
                                <i class="fas fa-search"></i>
                                <span>Smart Discovery</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-compass"></i>
                                <span>Featured Servers</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-btn primary">
                            <i class="fas fa-explore"></i>
                            Explore Servers
                        </button>
                        <button class="card-btn secondary">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
                <div class="card-glow"></div>
            </div>
        </div>
    </div>

    <div class="cursor-particles"></div>
    <div class="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 to-purple-900 opacity-80"></div>

    <div class="cosmic-glow glow-1"></div>
    <div class="cosmic-glow glow-2"></div>
    <div class="cosmic-glow glow-3"></div>

    <div class="section-indicator">
        <span class="indicator-text">Extensions</span>
        <div class="indicator-line"></div>
    </div>
</section>