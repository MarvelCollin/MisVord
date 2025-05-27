<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';

$page_title = 'MiscVord - Where Communities Thrive';
$page_css = 'landing-page';
$page_js = 'landing-page';
$body_class = 'modern-landing';

ob_start();
?>

<!-- Animated Background -->
<div class="landing-background"></div>

<!-- Modern Simplified Navbar -->
<nav class="discord-nav" id="mainNav">
    <div class="nav-container">
        <a href="/" class="nav-logo">
            <img src="<?php echo asset('/images/landing-page/main-logo.png'); ?>" alt="MiscVord">
            <span class="hidden md:inline font-bold">MiscVord</span>
        </a>

        <ul class="nav-links" id="navLinks">
            <li><a href="#features" class="nav-link">Features</a></li>
            <li><a href="#safety" class="nav-link">Safety</a></li>
            <li><a href="#community" class="nav-link">Community</a></li>
            <li><a href="#support" class="nav-link">Support</a></li>
            <li><a href="#blog" class="nav-link">Blog</a></li>
        </ul>

        <div class="nav-actions">
            <a href="/login" class="nav-cta">Open MiscVord</a>
            <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        </div>
    </div>
</nav>

<!-- Hero Section - Completely Redesigned -->
<section class="hero-section">
    <!-- Enhanced floating decorative elements -->
    <div class="floating-element floating-1"></div>
    <div class="floating-element floating-2"></div>
    <div class="floating-element floating-3"></div>
    <div class="floating-element floating-4"></div>

    <div class="hero-container">
        <div class="hero-title-section">
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
            </div>

            <div class="hero-visual">
                <div class="discord-mockup">
                    <div class="mockup-header">
                        <div class="mockup-avatar">M</div>
                        <div class="mockup-info">
                            <h4>MiscVord Community</h4>
                            <p class="online-status">🟢 <span class="member-count">15,847</span> members online</p>
                        </div>
                    </div>
                    <div class="mockup-content" id="chatContainer">
                        <!-- Chat messages will be dynamically added here -->
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
            <img src="<?php echo asset('/images/landing-page/main-logo.png'); ?>" alt="MiscVord" height="32">
            <a href="/register" class="footer-cta">Sign up</a>
        </div>
    </div>
</footer>

<?php
$content = ob_get_clean();
require_once dirname(__DIR__) . '/layout/main-app.php';
?>