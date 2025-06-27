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
        <div class="text-center mb-16">
            <div class="crown-icon mb-6">
                <i class="fas fa-crown text-6xl"></i>
            </div>
            <h2 class="text-5xl md:text-6xl font-bold text-white mb-6 nitro-title" data-animate="title">
                <span class="gradient-text">MisVord Nitro</span>
            </h2>
            <p class="text-xl text-gray-300 max-w-2xl mx-auto nitro-subtitle" data-animate="subtitle">
                Unlock the full potential of your communication experience
            </p>
        </div>

        <div class="nitro-content">
            <div class="features-grid">
                <div class="feature-card" data-delay="0">
                    <div class="feature-icon">
                        <i class="fas fa-palette"></i>
                    </div>
                    <h3 class="feature-title">Custom Themes</h3>
                    <p class="feature-description">Personalize your interface with exclusive premium themes and color schemes</p>
                </div>

                <div class="feature-card" data-delay="100">
                    <div class="feature-icon">
                        <i class="fas fa-file-upload"></i>
                    </div>
                    <h3 class="feature-title">Larger Uploads</h3>
                    <p class="feature-description">Share files up to 100MB and stream in higher quality</p>
                </div>

                <div class="feature-card" data-delay="200">
                    <div class="feature-icon">
                        <i class="fas fa-user-crown"></i>
                    </div>
                    <h3 class="feature-title">Premium Badge</h3>
                    <p class="feature-description">Show off your premium status with exclusive badges and animations</p>
                </div>

                <div class="feature-card" data-delay="300">
                    <div class="feature-icon">
                        <i class="fas fa-magic"></i>
                    </div>
                    <h3 class="feature-title">Exclusive Features</h3>
                    <p class="feature-description">Access beta features and premium-only functionalities first</p>
                </div>

                <div class="feature-card" data-delay="400">
                    <div class="feature-icon">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3 class="feature-title">Enhanced Audio</h3>
                    <p class="feature-description">Crystal clear voice quality with noise suppression technology</p>
                </div>

                <div class="feature-card" data-delay="500">
                    <div class="feature-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h3 class="feature-title">Priority Support</h3>
                    <p class="feature-description">Get faster response times and dedicated premium support</p>
                </div>
            </div>

            <div class="pricing-section">
                <div class="pricing-card premium">
                    <div class="pricing-header">
                        <div class="crown-badge">
                            <i class="fas fa-crown"></i>
                        </div>
                        <h3 class="pricing-title">Nitro Premium</h3>
                        <div class="pricing-price">
                            <span class="currency">$</span>
                            <span class="amount">9.99</span>
                            <span class="period">/month</span>
                        </div>
                    </div>

                    <div class="pricing-features">
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>All premium features</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>Priority server access</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>Exclusive themes & badges</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>Enhanced file sharing</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>24/7 premium support</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>100MB file uploads</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>HD voice & video</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>Custom status & emojis</span>
                        </div>
                    </div>

                    <div class="pricing-footer">
                        <button class="nitro-btn primary">
                            <i class="fas fa-crown"></i>
                            <span>Get Nitro Now</span>
                            <div class="btn-glow"></div>
                        </button>
                        <p class="pricing-note">Start your premium journey today</p>
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
