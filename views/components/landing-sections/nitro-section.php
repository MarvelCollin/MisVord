<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section id="nitro" class="swipe-section nitro-section scroll-section min-h-screen relative flex items-center justify-center overflow-hidden py-16" data-section="nitro">
    <div class="nitro-background">
        <div class="premium-sparkles">
            <?php for ($i = 0; $i < 20; $i++): ?>
                <div class="sparkle sparkle-<?php echo ($i % 4) + 1; ?>" style="top: <?php echo rand(10, 90) . '%; left: ' . rand(10, 90); ?>%; animation-delay: <?php echo rand(0, 40) / 10; ?>s;"></div>
            <?php endfor; ?>
        </div>
        
        <div class="premium-glow glow-1"></div>
        <div class="premium-glow glow-2"></div>
        <div class="premium-glow glow-3"></div>
        <div class="premium-glow glow-4"></div>
    </div>

    <div class="container mx-auto px-4 relative z-10">
        <div class="nitro-content">
            <div class="title-section">
                <div class="rotated-title">
                    <h2 class="text-6xl md:text-7xl font-bold text-white nitro-title" data-animate="title">
                        <span class="gradient-text">MisVord Nitro</span>
                    </h2>
                </div>
            </div>

            <div class="hexagon-container">
                <div class="crown-center">
                    <div class="crown-icon">
                        <img src="/public/assets/common/nitro.webp" alt="Nitro Crown" class="w-8 h-8">
                    </div>
                </div>

                <div class="rotating-hexagons">
                    <div class="hexagon-grid">
                        <div class="hexagon-feature" data-delay="0" style="--rotation: 0deg">
                            <div class="hexagon-content">
                                <div class="feature-icon">
                                    <i class="fas fa-palette"></i>
                                </div>
                                <h3 class="feature-title">Custom Themes</h3>
                            </div>
                            <div class="hexagon-border"></div>
                        </div>
                        
                        <div class="hexagon-feature" data-delay="50" style="--rotation: 60deg">
                            <div class="hexagon-content">
                                <div class="feature-icon">
                                    <i class="fas fa-file-upload"></i>
                                </div>
                                <h3 class="feature-title">Larger Uploads</h3>
                            </div>
                            <div class="hexagon-border"></div>
                        </div>

                        <div class="hexagon-feature" data-delay="100" style="--rotation: 120deg">
                            <div class="hexagon-content">
                                <div class="feature-icon">
                                    <img src="/public/assets/common/nitro.webp" alt="Premium Badge" class="w-6 h-6">
                                </div>
                                <h3 class="feature-title">Premium Badge</h3>
                            </div>
                            <div class="hexagon-border"></div>
                        </div>

                        <div class="hexagon-feature" data-delay="150" style="--rotation: 180deg">
                            <div class="hexagon-content">
                                <div class="feature-icon">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <h3 class="feature-title">Exclusive Features</h3>
                            </div>
                            <div class="hexagon-border"></div>
                        </div>

                        <div class="hexagon-feature" data-delay="200" style="--rotation: 240deg">
                            <div class="hexagon-content">
                                <div class="feature-icon">
                                    <i class="fas fa-headset"></i>
                                </div>
                                <h3 class="feature-title">Enhanced Audio</h3>
                            </div>
                            <div class="hexagon-border"></div>
                        </div>

                        <div class="hexagon-feature" data-delay="250" style="--rotation: 300deg">
                            <div class="hexagon-content">
                                <div class="feature-icon">
                                    <i class="fas fa-bolt"></i>
                                </div>
                                <h3 class="feature-title">Priority Support</h3>
                            </div>
                            <div class="hexagon-border"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section-indicator">
        <span class="indicator-text">Premium</span>
        <div class="indicator-line"></div>
    </div>
</section>
