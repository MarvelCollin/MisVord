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

        <div class="simple-book">
            <div class="book-cover" id="bookCover">
                <h3>Success Stories</h3>
                <p>Click to open</p>
            </div>
            
            <div class="book-content" id="bookContent">
                <div class="page active" data-page="0">
                    <h4>🎮 Gaming Community</h4>
                    <p>Over 50,000 passionate gamers have found their digital home, connecting through crystal-clear voice channels and competitive tournaments.</p>
                </div>
                <div class="page" data-page="1">
                    <h4>📚 Study Groups</h4>
                    <p>15,000+ students worldwide collaborate on projects, sharing screens and knowledge to achieve academic excellence together.</p>
                </div>
                <div class="page" data-page="2">
                    <h4>🎵 Music Creators</h4>
                    <p>A vibrant community of 25,000+ artists sharing their musical masterpieces and collaborating in real-time.</p>
                </div>
            </div>
            
            <div class="book-nav" id="bookNav">
                <button id="prevPage">←</button>
                <span id="pageIndicator">1 / 3</span>
                <button id="nextPage">→</button>
            </div>
        </div>
    </div>

    <div class="section-indicator">
        <span class="indicator-text">Stories</span>
        <div class="indicator-line"></div>
    </div>
</section>
