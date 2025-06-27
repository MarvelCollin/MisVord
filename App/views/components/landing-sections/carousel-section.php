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

        <div class="book-container relative">
            <div class="book-spine">
                <div class="spine-title">MisVord Success</div>
                <div class="spine-author">Community Stories</div>
            </div>
            
            <div class="book-wrapper">
                <div class="book-cover">
                    <div class="cover-title">Success Stories</div>
                    <div class="cover-subtitle">Real Communities, Real Growth</div>
                    <div class="cover-decoration">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                    </div>
                </div>
                
                <div class="book-pages" id="carouselTrack">
                    <div class="book-page active" data-slide="0">
                        <div class="page-number">01</div>
                        <div class="page-header">
                            <div class="chapter-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <h3 class="chapter-title">Gaming Community</h3>
                        </div>
                        <div class="page-content">
                            <p class="story-text">In the heart of the digital realm, over 50,000 passionate gamers found their sanctuary. Through crystal-clear voice channels and seamless tournament organization, friendships were forged and legends were born.</p>
                            <div class="story-metrics">
                                <div class="metric-badge">
                                    <span class="metric-value">50K+</span>
                                    <span class="metric-label">Active Members</span>
                                </div>
                                <div class="metric-badge">
                                    <span class="metric-value">24/7</span>
                                    <span class="metric-label">Always Online</span>
                                </div>
                            </div>
                            <div class="page-footer">
                                <i class="fas fa-quote-left"></i>
                                <span>Where gamers become legends</span>
                            </div>
                        </div>
                    </div>

                    <div class="book-page" data-slide="1">
                        <div class="page-number">02</div>
                        <div class="page-header">
                            <div class="chapter-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h3 class="chapter-title">Study Groups</h3>
                        </div>
                        <div class="page-content">
                            <p class="story-text">Across universities worldwide, 15,000+ students discovered the power of collaborative learning. Screen sharing sessions and voice study groups transformed academic struggles into shared victories.</p>
                            <div class="story-metrics">
                                <div class="metric-badge">
                                    <span class="metric-value">15K+</span>
                                    <span class="metric-label">Students</span>
                                </div>
                                <div class="metric-badge">
                                    <span class="metric-value">95%</span>
                                    <span class="metric-label">Success Rate</span>
                                </div>
                            </div>
                            <div class="page-footer">
                                <i class="fas fa-quote-left"></i>
                                <span>Learning together, achieving more</span>
                            </div>
                        </div>
                    </div>

                    <div class="book-page" data-slide="2">
                        <div class="page-number">03</div>
                        <div class="page-header">
                            <div class="chapter-icon">
                                <i class="fas fa-music"></i>
                            </div>
                            <h3 class="chapter-title">Music Creators</h3>
                        </div>
                        <div class="page-content">
                            <p class="story-text">A symphony of creativity emerged as 25,000+ artists found their stage. High-quality audio channels became the canvas where over a million musical masterpieces were shared and celebrated.</p>
                            <div class="story-metrics">
                                <div class="metric-badge">
                                    <span class="metric-value">25K+</span>
                                    <span class="metric-label">Artists</span>
                                </div>
                                <div class="metric-badge">
                                    <span class="metric-value">1M+</span>
                                    <span class="metric-label">Tracks Shared</span>
                                </div>
                            </div>
                            <div class="page-footer">
                                <i class="fas fa-quote-left"></i>
                                <span>Music connects souls worldwide</span>
                            </div>
                        </div>
                    </div>

                    <div class="book-page" data-slide="3">
                        <div class="page-number">04</div>
                        <div class="page-header">
                            <div class="chapter-icon">
                                <i class="fas fa-code"></i>
                            </div>
                            <h3 class="chapter-title">Dev Teams</h3>
                        </div>
                        <div class="page-content">
                            <p class="story-text">Innovation thrived as 10,000+ developers united their skills. Through integrated bots and streamlined workflows, 500+ groundbreaking projects came to life, changing the digital landscape forever.</p>
                            <div class="story-metrics">
                                <div class="metric-badge">
                                    <span class="metric-value">10K+</span>
                                    <span class="metric-label">Developers</span>
                                </div>
                                <div class="metric-badge">
                                    <span class="metric-value">500+</span>
                                    <span class="metric-label">Projects</span>
                                </div>
                            </div>
                            <div class="page-footer">
                                <i class="fas fa-quote-left"></i>
                                <span>Code that shapes tomorrow</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="book-controls">
                <button class="page-turner prev" id="carouselPrev">
                    <i class="fas fa-chevron-left"></i>
                    <span>Previous</span>
                </button>
                <button class="page-turner next" id="carouselNext">
                    <span>Next</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="book-bookmark">
                <div class="bookmark active" data-slide="0">1</div>
                <div class="bookmark" data-slide="1">2</div>
                <div class="bookmark" data-slide="2">3</div>
                <div class="bookmark" data-slide="3">4</div>
            </div>
        </div>
    </div>

    <div class="section-indicator">
        <span class="indicator-text">Stories</span>
        <div class="indicator-line"></div>
    </div>
</section>
