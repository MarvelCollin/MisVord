<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section id="carousel" class="swipe-section carousel-section scroll-section min-h-screen relative flex items-center justify-center overflow-hidden py-16" data-section="carousel">
    <div class="carousel-background">
        <div class="floating-elements">
            <?php for ($i = 0; $i < 15; $i++): ?>
                <div class="floating-shape shape-<?php echo ($i % 3) + 1; ?>" style="top: <?php echo rand(10, 90) . '%; left: ' . rand(10, 90); ?>%; animation-delay: <?php echo rand(0, 30) / 10; ?>s;"></div>
            <?php endfor; ?>
        </div>
        
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
    </div>

    <div class="container mx-auto px-4 relative z-10">
        <div class="text-center mb-16">
            <h2 class="text-5xl md:text-6xl font-bold text-white mb-6 carousel-title" data-animate="title">Success Stories</h2>
            <p class="text-xl text-gray-300 max-w-2xl mx-auto carousel-subtitle" data-animate="subtitle">See how communities thrive on MisVord platform</p>
        </div>

        <div class="carousel-container relative">
            <div class="carousel-track" id="carouselTrack">
                <div class="carousel-slide active" data-slide="0">
                    <div class="slide-content">
                        <div class="slide-image">
                            <div class="image-placeholder">
                                <i class="fas fa-users text-6xl text-purple-400"></i>
                            </div>
                        </div>
                        <div class="slide-text">
                            <h3 class="slide-title">Gaming Community</h3>
                            <p class="slide-description">Over 50,000 gamers connected through voice channels and organized tournaments</p>
                            <div class="slide-stats">
                                <div class="stat-item">
                                    <span class="stat-number">50K+</span>
                                    <span class="stat-label">Members</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">24/7</span>
                                    <span class="stat-label">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="carousel-slide" data-slide="1">
                    <div class="slide-content">
                        <div class="slide-image">
                            <div class="image-placeholder">
                                <i class="fas fa-graduation-cap text-6xl text-blue-400"></i>
                            </div>
                        </div>
                        <div class="slide-text">
                            <h3 class="slide-title">Study Groups</h3>
                            <p class="slide-description">Students collaborate on projects with screen sharing and voice study sessions</p>
                            <div class="slide-stats">
                                <div class="stat-item">
                                    <span class="stat-number">15K+</span>
                                    <span class="stat-label">Students</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">95%</span>
                                    <span class="stat-label">Success Rate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="carousel-slide" data-slide="2">
                    <div class="slide-content">
                        <div class="slide-image">
                            <div class="image-placeholder">
                                <i class="fas fa-music text-6xl text-green-400"></i>
                            </div>
                        </div>
                        <div class="slide-text">
                            <h3 class="slide-title">Music Creators</h3>
                            <p class="slide-description">Artists share their work and collaborate in real-time with high-quality audio</p>
                            <div class="slide-stats">
                                <div class="stat-item">
                                    <span class="stat-number">25K+</span>
                                    <span class="stat-label">Artists</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">1M+</span>
                                    <span class="stat-label">Tracks Shared</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="carousel-slide" data-slide="3">
                    <div class="slide-content">
                        <div class="slide-image">
                            <div class="image-placeholder">
                                <i class="fas fa-code text-6xl text-yellow-400"></i>
                            </div>
                        </div>
                        <div class="slide-text">
                            <h3 class="slide-title">Dev Teams</h3>
                            <p class="slide-description">Development teams streamline workflows with integrated bots and project management</p>
                            <div class="slide-stats">
                                <div class="stat-item">
                                    <span class="stat-number">10K+</span>
                                    <span class="stat-label">Developers</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">500+</span>
                                    <span class="stat-label">Projects</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="carousel-controls">
                <button class="carousel-nav prev" id="carouselPrev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-nav next" id="carouselNext">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="carousel-indicators">
                <div class="indicator active" data-slide="0"></div>
                <div class="indicator" data-slide="1"></div>
                <div class="indicator" data-slide="2"></div>
                <div class="indicator" data-slide="3"></div>
            </div>
        </div>
    </div>

    <div class="section-indicator">
        <span class="indicator-text">Stories</span>
        <div class="indicator-line"></div>
    </div>
</section>
