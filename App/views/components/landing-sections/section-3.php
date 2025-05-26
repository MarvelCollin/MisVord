<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Feature section 3: From few to a fandom - Interactive Card Grid Layout -->
<section class="feature-section-3 py-20 px-6 relative overflow-hidden">
    <!-- Floating particles background -->
    <div class="particles-container"></div>
    
    <!-- Background blur elements -->
    <div class="bg-blur-circle bg-circle-1"></div>
    <div class="bg-blur-circle bg-circle-2"></div>

    <div class="container mx-auto relative z-10">
        <!-- Section Heading with Typing Animation -->
        <div class="text-center mb-16 typing-container">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 gradient-text-green section-title-3">
                <span class="typing-text">From few to a fandom</span>
                <span class="cursor">|</span>
            </h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
                Build a community of any size with specialized tools
            </p>
        </div>
        
        <!-- Interactive Grid Layout -->
        <div class="feature-grid">
            <!-- Main Feature Image -->
            <div class="feature-main">
                <div class="feature-img-container hover-scale">
                    <img src="<?php echo asset('/landing-page/hug.webp'); ?>" alt="Community" class="main-image">
                    <div class="img-overlay">
                        <div class="overlay-content">
                            <h3 class="text-2xl font-bold mb-3">Community Tools</h3>
                            <p>Build and manage your community with powerful moderation features</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Cards -->
            <div class="feature-cards">
                <!-- Card 1: Moderation Tools -->
                <div class="feature-card hover-glow" data-feature="moderation">
                    <div class="card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <div class="card-content">
                        <h4 class="text-xl font-bold mb-2">Moderation Tools</h4>
                        <p class="text-gray-300">Customize member permissions, create private channels, and more.</p>
                    </div>
                    <div class="card-number">01</div>
                </div>
                
                <!-- Card 2: Custom Roles -->
                <div class="feature-card hover-glow" data-feature="roles">
                    <div class="card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <div class="card-content">
                        <h4 class="text-xl font-bold mb-2">Custom Roles</h4>
                        <p class="text-gray-300">Create custom roles with unique permissions and color-coding.</p>
                    </div>
                    <div class="card-number">02</div>
                </div>
                
                <!-- Card 3: Server Insights -->
                <div class="feature-card hover-glow" data-feature="analytics">
                    <div class="card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div class="card-content">
                        <h4 class="text-xl font-bold mb-2">Server Insights</h4>
                        <p class="text-gray-300">Track engagement and growth with detailed analytics.</p>
                    </div>
                    <div class="card-number">03</div>
                </div>
                
                <!-- Card 4: Customization -->
                <div class="feature-card hover-glow" data-feature="custom">
                    <div class="card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 001 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                    </div>
                    <div class="card-content">
                        <h4 class="text-xl font-bold mb-2">Custom Branding</h4>
                        <p class="text-gray-300">Personalize your server with custom icons, banners, and emoji.</p>
                    </div>
                    <div class="card-number">04</div>
                </div>
            </div>
            
            <!-- Feature Detail Expanded View -->
            <div class="feature-detail glass-panel">
                <!-- Moderation Tools Detail -->
                <div class="feature-detail-content" data-feature="moderation">
                    <div class="detail-header">
                        <h3 class="text-2xl font-bold mb-4">Advanced Moderation Tools</h3>
                        <button class="close-detail">×</button>
                    </div>
                    <div class="detail-body">
                        <div class="detail-media">
                            <div class="detail-img-container">
                                <div class="mod-dashboard">
                                    <div class="mod-header">Moderation Dashboard</div>
                                    <div class="mod-tools">
                                        <div class="mod-tool">
                                            <div class="tool-icon ban-icon">🚫</div>
                                            <div class="tool-label">Ban</div>
                                        </div>
                                        <div class="mod-tool">
                                            <div class="tool-icon mute-icon">🔇</div>
                                            <div class="tool-label">Mute</div>
                                        </div>
                                        <div class="mod-tool">
                                            <div class="tool-icon warn-icon">⚠️</div>
                                            <div class="tool-label">Warn</div>
                                        </div>
                                        <div class="mod-tool">
                                            <div class="tool-icon log-icon">📝</div>
                                            <div class="tool-label">Logs</div>
                                        </div>
                                    </div>
                                    <div class="mod-stats">
                                        <div class="stat-item">
                                            <div class="stat-value">367</div>
                                            <div class="stat-label">Members</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value">12</div>
                                            <div class="stat-label">Mods</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value">98%</div>
                                            <div class="stat-label">Safety</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-text">
                            <p class="mb-4">MiscVord gives you powerful tools to manage your community efficiently:</p>
                            <ul class="feature-list">
                                <li>Automated content moderation with custom filters</li>
                                <li>Tiered permission system to delegate responsibilities</li>
                                <li>Comprehensive audit logs to track all moderation actions</li>
                                <li>Customizable verification levels for new members</li>
                                <li>Timeout features to temporarily restrict disruptive users</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Roles Detail -->
                <div class="feature-detail-content hidden" data-feature="roles">
                    <div class="detail-header">
                        <h3 class="text-2xl font-bold mb-4">Customizable Roles System</h3>
                        <button class="close-detail">×</button>
                    </div>
                    <div class="detail-body">
                        <div class="detail-media">
                            <div class="detail-img-container">
                                <div class="roles-dashboard">
                                    <div class="roles-header">Server Roles</div>
                                    <div class="roles-list">
                                        <div class="role admin">
                                            <div class="role-color" style="background-color: #FF5555;"></div>
                                            <div class="role-name">Admin</div>
                                            <div class="role-count">3 members</div>
                                        </div>
                                        <div class="role moderator">
                                            <div class="role-color" style="background-color: #5865F2;"></div>
                                            <div class="role-name">Moderator</div>
                                            <div class="role-count">8 members</div>
                                        </div>
                                        <div class="role vip">
                                            <div class="role-color" style="background-color: #EB459E;"></div>
                                            <div class="role-name">VIP</div>
                                            <div class="role-count">25 members</div>
                                        </div>
                                        <div class="role regular">
                                            <div class="role-color" style="background-color: #57F287;"></div>
                                            <div class="role-name">Regular</div>
                                            <div class="role-count">332 members</div>
                                        </div>
                                    </div>
                                    <div class="role-permissions">
                                        <div class="perm-header">Role Permissions</div>
                                        <div class="perm-list">
                                            <div class="perm-item">Manage Channels ✓</div>
                                            <div class="perm-item">Kick Members ✓</div>
                                            <div class="perm-item">Ban Members ✓</div>
                                            <div class="perm-item">Manage Messages ✓</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-text">
                            <p class="mb-4">Create a structured community with a custom role hierarchy:</p>
                            <ul class="feature-list">
                                <li>Create unlimited roles with custom colors and names</li>
                                <li>Fine-grained permission control for each role</li>
                                <li>Hierarchical role system with inheritance</li>
                                <li>Assign roles automatically based on activity or criteria</li>
                                <li>Display roles prominently with custom hoisting options</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Analytics Detail -->
                <div class="feature-detail-content hidden" data-feature="analytics">
                    <div class="detail-header">
                        <h3 class="text-2xl font-bold mb-4">Comprehensive Server Insights</h3>
                        <button class="close-detail">×</button>
                    </div>
                    <div class="detail-body">
                        <div class="detail-media">
                            <div class="detail-img-container">
                                <div class="analytics-dashboard">
                                    <div class="analytics-header">Server Insights</div>
                                    <div class="analytics-chart">
                                        <div class="chart-bars">
                                            <div class="chart-bar" style="height: 30%"></div>
                                            <div class="chart-bar" style="height: 45%"></div>
                                            <div class="chart-bar" style="height: 60%"></div>
                                            <div class="chart-bar" style="height: 75%"></div>
                                            <div class="chart-bar" style="height: 65%"></div>
                                            <div class="chart-bar" style="height: 80%"></div>
                                            <div class="chart-bar active" style="height: 90%"></div>
                                        </div>
                                        <div class="chart-labels">
                                            <span>Mon</span>
                                            <span>Tue</span>
                                            <span>Wed</span>
                                            <span>Thu</span>
                                            <span>Fri</span>
                                            <span>Sat</span>
                                            <span>Sun</span>
                                        </div>
                                    </div>
                                    <div class="analytics-stats">
                                        <div class="stat-item growth">
                                            <div class="stat-value">+24%</div>
                                            <div class="stat-label">Growth</div>
                                        </div>
                                        <div class="stat-item active">
                                            <div class="stat-value">187</div>
                                            <div class="stat-label">Active</div>
                                        </div>
                                        <div class="stat-item messages">
                                            <div class="stat-value">2.4K</div>
                                            <div class="stat-label">Messages</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-text">
                            <p class="mb-4">Gain valuable insights into your community's growth and engagement:</p>
                            <ul class="feature-list">
                                <li>Track member growth and retention over time</li>
                                <li>Monitor channel activity and engagement metrics</li>
                                <li>Analyze peak usage times to schedule events</li>
                                <li>Identify your most active members and channels</li>
                                <li>Export detailed reports for community planning</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Customization Detail -->
                <div class="feature-detail-content hidden" data-feature="custom">
                    <div class="detail-header">
                        <h3 class="text-2xl font-bold mb-4">Personalized Server Experience</h3>
                        <button class="close-detail">×</button>
                    </div>
                    <div class="detail-body">
                        <div class="detail-media">
                            <div class="detail-img-container">
                                <div class="custom-dashboard">
                                    <div class="custom-header">Server Customization</div>
                                    <div class="custom-preview">
                                        <div class="server-preview">
                                            <div class="preview-icon">M</div>
                                            <div class="preview-banner"></div>
                                            <div class="preview-name">MiscVord</div>
                                        </div>
                                    </div>
                                    <div class="custom-options">
                                        <div class="custom-option">
                                            <div class="option-icon">🖼️</div>
                                            <div class="option-label">Banner</div>
                                        </div>
                                        <div class="custom-option">
                                            <div class="option-icon">😀</div>
                                            <div class="option-label">Emoji</div>
                                        </div>
                                        <div class="custom-option">
                                            <div class="option-icon">🎭</div>
                                            <div class="option-label">Theme</div>
                                        </div>
                                        <div class="custom-option">
                                            <div class="option-icon">🏆</div>
                                            <div class="option-label">Boost</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-text">
                            <p class="mb-4">Make your server unique with extensive customization options:</p>
                            <ul class="feature-list">
                                <li>Upload custom emoji and stickers for your community</li>
                                <li>Design personalized server icons and banners</li>
                                <li>Create custom invite backgrounds for new members</li>
                                <li>Set up server boosts to unlock premium features</li>
                                <li>Customize welcome messages and automated responses</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Community Size Progression Showcase -->
        <div class="community-progression mt-20">
            <h3 class="text-2xl font-bold mb-8 text-center">From small groups to massive communities</h3>
            
            <div class="progression-stages">
                <div class="stage">
                    <div class="stage-icon small-community">
                        <div class="community-icon">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </div>
                    </div>
                    <div class="stage-label">Small Group</div>
                    <div class="stage-members">5-50 members</div>
                </div>
                
                <div class="progression-arrow">→</div>
                
                <div class="stage">
                    <div class="stage-icon medium-community">
                        <div class="community-icon">
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span>
                        </div>
                    </div>
                    <div class="stage-label">Growing Community</div>
                    <div class="stage-members">50-500 members</div>
                </div>
                
                <div class="progression-arrow">→</div>
                
                <div class="stage">
                    <div class="stage-icon large-community">
                        <div class="community-icon">
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            <span class="dot"></span><span class="dot"></span>
                        </div>
                    </div>
                    <div class="stage-label">Thriving Community</div>
                    <div class="stage-members">500+ members</div>
                </div>
            </div>
            
            <div class="call-to-action mt-10 text-center">
                <a href="#" class="cta-button">
                    Start Your Community
                    <span class="button-glow"></span>
                </a>
            </div>
        </div>
    </div>
</section>

<style>
/* Section 3 specific styles */
.feature-section-3 {
    min-height: 100vh;
    position: relative;
}

.gradient-text-green {
    background: linear-gradient(to right, #57F287, #5865F2);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
}

/* Floating particles background */
.particles-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
}

/* Background blur circles */
.bg-blur-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;
    z-index: 0;
}

.bg-circle-1 {
    top: -10%;
    right: -5%;
    width: 40%;
    height: 40%;
    background: #57F287;
}

.bg-circle-2 {
    bottom: -5%;
    left: -10%;
    width: 50%;
    height: 50%;
    background: #5865F2;
}

/* Typing animation styles */
.typing-container {
    position: relative;
    display: inline-block;
}

.cursor {
    display: inline-block;
    width: 3px;
    opacity: 0;
}

.cursor.active {
    opacity: 1;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* Feature grid layout */
.feature-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
    margin-top: 50px;
}

/* Main feature image */
.feature-main {
    position: relative;
    width: 100%;
}

.feature-img-container {
    position: relative;
    overflow: hidden;
    border-radius: 15px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.main-image {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.5s ease;
}

.hover-scale:hover .main-image {
    transform: scale(1.05);
}

.img-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    padding: 30px 20px 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.feature-img-container:hover .img-overlay {
    opacity: 1;
}

/* Feature cards */
.feature-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.feature-card {
    background: rgba(30, 30, 40, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 25px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
}

.hover-glow:hover {
    box-shadow: 0 0 25px rgba(87, 242, 135, 0.3);
    transform: translateY(-5px);
}

.card-icon {
    color: #57F287;
    margin-bottom: 15px;
    transition: transform 0.3s ease;
}

.feature-card:hover .card-icon {
    transform: scale(1.1);
}

.card-number {
    position: absolute;
    bottom: 15px;
    right: 15px;
    font-size: 36px;
    font-weight: bold;
    opacity: 0.2;
    transition: opacity 0.3s ease;
}

.feature-card:hover .card-number {
    opacity: 0.4;
}

/* Feature detail expanded view */
.feature-detail {
    margin-top: 30px;
    background: rgba(30, 30, 40, 0.8);
    backdrop-filter: blur(15px);
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    height: 0;
    opacity: 0;
    transition: all 0.5s ease;
}

.feature-detail.active {
    height: auto;
    opacity: 1;
    padding: 30px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.feature-detail-content {
    width: 100%;
}

.feature-detail-content.hidden {
    display: none;
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.close-detail {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
}

.close-detail:hover {
    background: rgba(255, 255, 255, 0.1);
}

.detail-body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

@media (min-width: 768px) {
    .detail-body {
        grid-template-columns: 1fr 1fr;
    }
}

.detail-img-container {
    min-height: 300px;
    background: rgba(20, 20, 30, 0.5);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.feature-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.feature-list li {
    position: relative;
    padding-left: 25px;
    margin-bottom: 10px;
}

.feature-list li::before {
    content: "→";
    position: absolute;
    left: 0;
    color: #57F287;
}

/* Moderation dashboard style */
.mod-dashboard, .roles-dashboard, .analytics-dashboard, .custom-dashboard {
    width: 100%;
    height: 100%;
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.mod-header, .roles-header, .analytics-header, .custom-header {
    font-weight: bold;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 15px;
}

.mod-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
}

.mod-tool {
    background: rgba(40, 40, 50, 0.8);
    border-radius: 8px;
    padding: 10px;
    width: calc(50% - 8px);
    display: flex;
    align-items: center;
    gap: 10px;
}

.tool-icon {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
}

.ban-icon {
    background: rgba(255, 100, 100, 0.2);
}

.mute-icon {
    background: rgba(88, 101, 242, 0.2);
}

.warn-icon {
    background: rgba(255, 212, 100, 0.2);
}

.log-icon {
    background: rgba(87, 242, 135, 0.2);
}

.mod-stats, .analytics-stats {
    display: flex;
    justify-content: space-around;
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #57F287;
}

.stat-label {
    font-size: 14px;
    color: #aaa;
}

/* Role dashboard styles */
.roles-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
}

.role {
    display: flex;
    align-items: center;
    padding: 8px;
    background: rgba(40, 40, 50, 0.8);
    border-radius: 6px;
}

.role-color {
    width: 15px;
    height: 15px;
    border-radius: 4px;
    margin-right: 10px;
}

.role-name {
    flex: 1;
    font-weight: bold;
}

.role-count {
    font-size: 12px;
    color: #aaa;
}

.role-permissions {
    margin-top: auto;
    background: rgba(40, 40, 50, 0.6);
    border-radius: 8px;
    padding: 10px;
}

.perm-header {
    font-weight: bold;
    margin-bottom: 8px;
}

.perm-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.perm-item {
    font-size: 12px;
}

/* Analytics dashboard styles */
.analytics-chart {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

.chart-bars {
    display: flex;
    align-items: flex-end;
    height: 150px;
    gap: 8px;
    margin-bottom: 8px;
}

.chart-bar {
    flex: 1;
    background: rgba(88, 101, 242, 0.5);
    border-radius: 3px 3px 0 0;
    transition: height 0.3s ease, background 0.3s ease;
}

.chart-bar.active {
    background: rgba(88, 101, 242, 0.9);
}

.chart-bar:hover {
    background: #5865F2;
}

.chart-labels {
    display: flex;
    justify-content: space-between;
}

.chart-labels span {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: #aaa;
}

/* Customization dashboard styles */
.custom-preview {
    display: flex;
    justify-content: center;
    margin: 20px 0;
}

.server-preview {
    width: 160px;
    height: 200px;
    background: rgba(40, 40, 50, 0.8);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.preview-icon {
    width: 60px;
    height: 60px;
    background: #5865F2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    position: absolute;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    top: 80px;
    z-index: 2;
    border: 4px solid rgba(40, 40, 50, 0.8);
}

.preview-banner {
    height: 60px;
    width: 100%;
    background: linear-gradient(135deg, #5865F2, #57F287);
}

.preview-name {
    margin-top: 40px;
    text-align: center;
    font-weight: bold;
}

.custom-options {
    display: flex;
    justify-content: space-around;
    margin-top: auto;
    padding-top: 20px;
}

.custom-option {
    text-align: center;
    cursor: pointer;
}

.option-icon {
    font-size: 20px;
    margin-bottom: 5px;
}

/* Community progression styles */
.community-progression {
    margin-top: 80px;
}

.progression-stages {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

.stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.stage-icon {
    width: 100px;
    height: 100px;
    background: rgba(30, 30, 40, 0.6);
    border-radius: 50%;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.community-icon {
    position: relative;
    width: 80%;
    height: 80%;
}

.dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #5865F2;
    border-radius: 50%;
}

.small-community .dot:nth-child(1) { top: 40%; left: 40%; }
.small-community .dot:nth-child(2) { top: 30%; left: 60%; }
.small-community .dot:nth-child(3) { top: 50%; left: 50%; }
.small-community .dot:nth-child(4) { top: 60%; left: 30%; }
.small-community .dot:nth-child(5) { top: 70%; left: 60%; }

.medium-community .dot {
    width: 6px;
    height: 6px;
}

.medium-community .dot:nth-child(1) { top: 20%; left: 20%; }
.medium-community .dot:nth-child(2) { top: 30%; left: 40%; }
.medium-community .dot:nth-child(3) { top: 25%; left: 70%; }
.medium-community .dot:nth-child(4) { top: 40%; left: 50%; }
.medium-community .dot:nth-child(5) { top: 50%; left: 20%; }
.medium-community .dot:nth-child(6) { top: 60%; left: 60%; }
.medium-community .dot:nth-child(7) { top: 70%; left: 30%; }
.medium-community .dot:nth-child(8) { top: 75%; left: 50%; }
.medium-community .dot:nth-child(9) { top: 80%; left: 70%; }
.medium-community .dot:nth-child(10) { top: 50%; left: 75%; }

.large-community .dot {
    width: 4px;
    height: 4px;
}

.large-community .community-icon {
    animation: slow-rotation 20s linear infinite;
}

@keyframes slow-rotation {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.progression-arrow {
    font-size: 24px;
    color: #5865F2;
}

.stage-label {
    font-weight: bold;
    margin-bottom: 5px;
}

.stage-members {
    font-size: 14px;
    color: #aaa;
}

/* Call to action button */
.cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #5865F2, #57F287);
    color: white;
    padding: 15px 30px;
    border-radius: 30px;
    font-weight: bold;
    font-size: 18px;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(88, 101, 242, 0.4);
}

.cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(88, 101, 242, 0.6);
}

.button-glow {
    position: absolute;
    top: 0;
    left: -50%;
    width: 50%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    transform: skewX(-25deg);
    animation: button-glow 3s infinite;
}

@keyframes button-glow {
    0% { left: -50%; }
    100% { left: 150%; }
}

/* Media queries for responsiveness */
@media screen and (min-width: 768px) {
    .feature-grid {
        grid-template-columns: repeat(12, 1fr);
    }
    
    .feature-main {
        grid-column: span 8;
    }
    
    .feature-cards {
        grid-column: span 4;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    }
    
    .feature-detail {
        grid-column: 1 / -1;
    }
}

/* Additional particle animation */
@keyframes particleFloat {
    0%, 100% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0.6;
    }
    33% {
        transform: translateY(-20px) rotate(120deg);
        opacity: 1;
    }
    66% {
        transform: translateY(20px) rotate(240deg);
        opacity: 0.8;
    }
}

/* Smooth animations for all interactive elements */
.stage, .feature-card, .chart-bar {
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px) scale(1.02);
}

/* Enhanced particle styles */
.particle {
    z-index: 1;
}

/* Responsive animations */
@media (prefers-reduced-motion: reduce) {
    .particle {
        animation: none;
    }
    
    .stage {
        transform: none !important;
        opacity: 1 !important;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Create particles
    createParticles();
    
    // Typing animation for section title
    const typingText = document.querySelector('.typing-text');
    const cursor = document.querySelector('.cursor');
    
    if (typingText && cursor) {
        const originalText = typingText.textContent;
        
        function startTypingAnimation() {
            typingText.textContent = '';
            cursor.classList.add('active');
            
            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < originalText.length) {
                    typingText.textContent += originalText.charAt(i);
                    i++;
                } else {
                    clearInterval(typingInterval);
                    setTimeout(() => {
                        cursor.classList.remove('active');
                    }, 1500);
                }
            }, 100);
        }
        
        // Start typing animation when section is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startTypingAnimation();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(document.querySelector('.feature-section-3'));
    }
    
    // Feature card interaction
    const featureCards = document.querySelectorAll('.feature-card');
    const featureDetail = document.querySelector('.feature-detail');
    const closeButtons = document.querySelectorAll('.close-detail');
    const featureDetailContents = document.querySelectorAll('.feature-detail-content');
    
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.getAttribute('data-feature');
            
            // Hide all detail contents
            featureDetailContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show the selected detail content
            const targetContent = document.querySelector(`.feature-detail-content[data-feature="${feature}"]`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
            
            // Show the detail container
            featureDetail.classList.add('active');
            
            // Scroll to the detail container
            setTimeout(() => {
                featureDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        });
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            featureDetail.classList.remove('active');
        });
    });
    
    // Create glowing particles for the background
    function createParticles() {
        const container = document.querySelector('.particles-container');
        if (!container) return;
        
        const particleCount = 40;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random size
            const size = Math.random() * 4 + 1;
            
            // Random position
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            // Random color between blue and green
            const hue = Math.random() * 60 + 180; // 180 (blue) to 240 (green)
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${posX}%;
                top: ${posY}%;
                background: hsla(${hue}, 80%, 70%, 0.6);
                border-radius: 50%;
                box-shadow: 0 0 ${size * 2}px hsla(${hue}, 80%, 70%, 0.8);
                pointer-events: none;
            `;
            
            // Animation properties
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 5;
            
            particle.style.animation = `particleFloat ${duration}s ease-in-out infinite`;
            particle.style.animationDelay = `${delay}s`;
            
            container.appendChild(particle);
        }
    }
    
    // Interactive animations for community progression
    const stages = document.querySelectorAll('.stage');
    
    stages.forEach((stage, index) => {
        // Add hover effect
        stage.addEventListener('mouseenter', () => {
            const icon = stage.querySelector('.stage-icon');
            const label = stage.querySelector('.stage-label');
            
            // Smooth scale animation
            icon.style.transform = 'scale(1.1)';
            icon.style.transition = 'transform 0.3s ease';
            
            label.style.color = '#57F287';
            label.style.fontWeight = 'bold';
            label.style.transition = 'color 0.3s ease, font-weight 0.3s ease';
        });
        
        stage.addEventListener('mouseleave', () => {
            const icon = stage.querySelector('.stage-icon');
            const label = stage.querySelector('.stage-label');
            
            icon.style.transform = 'scale(1)';
            label.style.color = 'white';
            label.style.fontWeight = 'bold';
        });
        
        // Add scroll animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate stage appearance
                    stage.style.opacity = '0';
                    stage.style.transform = 'translateY(30px)';
                    stage.style.transition = 'all 0.8s ease';
                    
                    setTimeout(() => {
                        stage.style.opacity = '1';
                        stage.style.transform = 'translateY(0)';
                    }, index * 200);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(stage);
    });
    
    // Animate the chart bars
    const chartBars = document.querySelectorAll('.analytics-chart .chart-bar');
    if (chartBars.length > 0) {
        const chartObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    chartBars.forEach((bar, i) => {
                        const originalHeight = bar.style.height;
                        bar.style.height = '0%';
                        bar.style.transition = 'height 1s ease';
                        
                        setTimeout(() => {
                            bar.style.height = originalHeight;
                        }, i * 100);
                    });
                    chartObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        const analyticsContainer = document.querySelector('.analytics-dashboard');
        if (analyticsContainer) {
            chartObserver.observe(analyticsContainer);
        }
    }
});
</script>