<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';

$page_title = 'misvord - Chat & Share with Friends';
$body_class = 'bg-white';
$page_css = 'landing-page';
$page_js = 'pages/landing-page';
$additional_js = ['sections/hero-section'];

ob_start();
?>

<!-- Animated Background -->
<div class="landing-background"></div>

<!-- Hero Section - Full height without navbar -->
<section class="hero-section">
    <!-- Enhanced floating decorative elements -->
    <div class="floating-element floating-1"></div>
    <div class="floating-element floating-2"></div>
    <div class="floating-element floating-3"></div>
    <div class="floating-element floating-4"></div>

    <div class="hero-container">
        <div class="hero-title-section">
            <!-- Add explicit data-text attribute to ensure the scramble text works properly -->
            <h1 class="hero-title scramble-text" data-text="IMAGINE A PLACE...">
                IMAGINE A PLACE...
            </h1>
        </div>

        <div class="hero-content-wrapper">
            <div class="hero-content">
                <p class="hero-description">
                    ...where you can belong to a school club, a gaming group, or a worldwide art community. 
                    Where just you and a handful of friends can spend time together. A place that makes it 
                    easy to talk every day and hang out more often.
                </p>

                <!-- Add CTA buttons in hero section since navbar is removed -->
                <div class="hero-actions mt-8 flex flex-col sm:flex-row gap-4">
                    <a href="/login" class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        Open misvord
                    </a>
                    <a href="/register" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white/20 text-white font-medium rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-200">
                        Get Started
                    </a>
                </div>
            </div>

            <div class="hero-visual">
                <div class="discord-mockup">
                    <div class="mockup-header">
                        <div class="mockup-avatar">M</div>
                        <div class="mockup-info">
                            <h4>misvord Community</h4>
                            <p class="online-status">🟢 <span class="member-count-static">15,847</span> members online</p>
                        </div>
                    </div>
                    <!-- Properly set up chat container with a specific ID for the chat simulation to target -->
                    <div class="mockup-content" id="chatContainer">
                        <!-- Chat messages will be dynamically added here by JavaScript -->
                    </div>
                    <div class="chat-input-area">
                        <div class="typing-users">
                            <div class="typing-indicator hidden">
                                <div class="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span class="typing-text">Someone is typing...</span>
                            </div>
                        </div>
                        <div class="chat-input-box">
                            <input 
                                type="text" 
                                id="userMessageInput" 
                                placeholder="Message #general" 
                                maxlength="100" 
                                autocomplete="off"
                                spellcheck="false"
                            >
                            <button id="sendMessageBtn" type="button" aria-label="Send message">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22,2 15,22 11,13 2,9"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Feature Sections -->
<main class="main-content">
    <section class="scroll-reveal" id="features">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/feature-carousel.php'; ?>
    </section>

    <section class="scroll-reveal">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/section-1.php'; ?>
    </section>

    <section class="scroll-reveal">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/section-2.php'; ?>
    </section>

    <section class="scroll-reveal">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/section-3.php'; ?>
    </section>
</main>

<!-- Modern Footer -->
<footer class="modern-footer">
    <div class="footer-container">
        <div class="footer-content">
            <div class="footer-brand">
                <h3>IMAGINE A PLACE</h3>
                <div class="language-selector">
                    <img src="<?php echo asset('/images/landing-page/discord-logo.webp'); ?>" alt="Flag" width="24" height="18">
                    <span>English, USA</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                </div>
                <div class="social-links">
                    <a href="#" class="social-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                    </a>
                    <a href="#" class="social-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                            <circle cx="4" cy="4" r="2"/>
                        </svg>
                    </a>
                    <a href="#" class="social-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <polyline points="2,17 12,12 22,17"/>
                        </svg>
                    </a>
                </div>
            </div>

            <div class="footer-links">
                <div class="link-column">
                    <h4>Product</h4>
                    <a href="#">Download</a>
                    <a href="#">Nitro</a>
                    <a href="#">Status</a>
                </div>
                <div class="link-column">
                    <h4>Company</h4>
                    <a href="#">About</a>
                    <a href="#">Jobs</a>
                    <a href="#">Brand</a>
                    <a href="#">Newsroom</a>
                </div>
                <div class="link-column">
                    <h4>Resources</h4>
                    <a href="#">College</a>
                    <a href="#">Support</a>
                    <a href="#">Safety</a>
                    <a href="#">Blog</a>
                </div>
                <div class="link-column">
                    <h4>Policies</h4>
                    <a href="#">Terms</a>
                    <a href="#">Privacy</a>
                    <a href="#">Cookie Settings</a>
                    <a href="#">Guidelines</a>
                </div>
            </div>
        </div>

        <div class="footer-bottom">
            <img src="<?php echo asset('/assets/landing-page/main-logo.svg'); ?>" alt="misvord" height="32">
            <a href="/register" class="footer-cta">Sign up</a>
        </div>
    </div>
</footer>

<?php
$content = ob_get_clean();
require_once dirname(__DIR__) . '/layout/main-app.php';
?>