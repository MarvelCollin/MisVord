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
        <div class="text-center mb-12">
            <div class="crown-icon mb-4">
                <i class="fas fa-crown text-5xl"></i>
            </div>
            <h2 class="text-4xl md:text-5xl font-bold text-white mb-4 nitro-title" data-animate="title">
                <span class="gradient-text">MisVord Nitro</span>
            </h2>
            <p class="text-lg text-gray-300 max-w-2xl mx-auto nitro-subtitle" data-animate="subtitle">
                Unlock the full potential of your communication experience
            </p>
        </div>

        <div class="nitro-timeline">
            <div class="timeline-track">
                <div class="timeline-line"></div>
                
                <div class="timeline-feature" data-delay="0">
                    <div class="timeline-point">
                        <div class="point-icon">
                            <i class="fas fa-palette"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <h3 class="feature-title">Custom Themes</h3>
                        <p class="feature-description">Personalize your interface with exclusive premium themes</p>
                    </div>
                </div>

                <div class="timeline-feature" data-delay="100">
                    <div class="timeline-point">
                        <div class="point-icon">
                            <i class="fas fa-file-upload"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <h3 class="feature-title">Larger Uploads</h3>
                        <p class="feature-description">Share files up to 100MB in size</p>
                    </div>
                </div>

                <div class="timeline-feature" data-delay="200">
                    <div class="timeline-point">
                        <div class="point-icon">
                            <i class="fas fa-user-crown"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <h3 class="feature-title">Premium Badge</h3>
                        <p class="feature-description">Show off your premium status</p>
                    </div>
                </div>

                <div class="timeline-feature" data-delay="300">
                    <div class="timeline-point">
                        <div class="point-icon">
                            <i class="fas fa-magic"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <h3 class="feature-title">Exclusive Features</h3>
                        <p class="feature-description">Access beta features first</p>
                    </div>
                </div>

                <div class="timeline-feature" data-delay="400">
                    <div class="timeline-point">
                        <div class="point-icon">
                            <i class="fas fa-headset"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <h3 class="feature-title">Enhanced Audio</h3>
                        <p class="feature-description">Crystal clear voice quality</p>
                    </div>
                </div>

                <div class="timeline-feature" data-delay="500">
                    <div class="timeline-point">
                        <div class="point-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <h3 class="feature-title">Priority Support</h3>
                        <p class="feature-description">Get faster response times</p>
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
