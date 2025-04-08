<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiscVord - Your Place to Talk and Hang Out</title>
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- GSAP for advanced animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/ScrollTrigger.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'discord-blue': '#5865F2',
                        'discord-bg': '#404EED',
                        'discord-dark': '#23272A',
                        'discord-light': '#F6F6F6',
                        'discord-pink': '#EB459E',
                        'discord-green': '#57F287'
                    },
                    fontFamily: {
                        whitney: ['Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
                    },
                    animation: {
                        float: 'float 6s ease-in-out infinite',
                        float2: 'float 8s ease-in-out infinite',
                        spin: 'spin 8s linear infinite',
                        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        bounce: 'bounce 2s infinite',
                        wobble: 'wobble 3s ease-in-out infinite',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-20px)' },
                        },
                        wobble: {
                            '0%, 100%': { transform: 'rotate(-3deg)' },
                            '50%': { transform: 'rotate(3deg)' },
                        }
                    },
                    backdropBlur: {
                      xs: '2px',
                    }
                }
            }
        }
    </script>
    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes wobble {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
        }
        
        @keyframes scale-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes glow {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(88, 101, 242, 0.7)); }
            50% { filter: drop-shadow(0 0 20px rgba(88, 101, 242, 0.9)); }
        }
        
        @keyframes shine {
            0% {
                background-position: -100% 0;
            }
            100% {
                background-position: 200% 0;
            }
        }
        
        /* Custom animations */
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
            animation: float 7s ease-in-out infinite;
            animation-delay: 2s;
        }
        
        .animate-spin-slow {
            animation: spin 12s linear infinite;
        }
        
        .animate-wobble {
            animation: wobble 3s ease-in-out infinite;
        }
        
        .animate-scale-pulse {
            animation: scale-pulse 3s ease-in-out infinite;
        }
        
        .animate-glow {
            animation: glow 3s ease-in-out infinite;
        }

        /* For smooth scrolling */
        html {
            scroll-behavior: smooth;
        }

        /* Full page background */
        body {
            background-image: url('<?php echo asset('/landing-page/background.png'); ?>');
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
            min-height: 100vh;
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        /* Modernized transparent container styles */
        .glass-nav {
            background: rgba(35, 39, 42, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .glass-hero {
            background: rgba(35, 39, 42, 0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }
        
        .content-card {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
        }
        
        .dark-content-card {
            background: rgba(35, 39, 42, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }
        
        /* Modern button styles */
        .discord-btn {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .discord-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            transition: 0.5s;
        }
        
        .discord-btn:hover::before {
            left: 100%;
        }
        
        .discord-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(88, 101, 242, 0.3);
        }
        
        /* Modern image styles */
        .modern-image {
            border-radius: 1.5rem;
            overflow: hidden;
            transform: perspective(1000px) rotateY(0deg);
            transition: transform 0.8s ease;
            box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
            position: relative;
        }
        
        .modern-image:hover {
            transform: perspective(1000px) rotateY(5deg);
        }
        
        .modern-image::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, transparent 65%, rgba(255, 255, 255, 0.2));
            pointer-events: none;
        }
        
        /* Text styles */
        .section-title {
            background: linear-gradient(90deg, #fff, #d7d9f2, #fff);
            background-size: 200% auto;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shine 8s linear infinite;
        }
        
        /* Neon effect */
        .neon-text {
            text-shadow: 0 0 10px rgba(88, 101, 242, 0.8), 
                         0 0 20px rgba(88, 101, 242, 0.5), 
                         0 0 30px rgba(88, 101, 242, 0.3);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
            background: #5865F2;
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #404EED;
        }
        
        /* Particle background */
        .particle {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            pointer-events: none;
        }
        
        /* Modern divider */
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
        }
    </style>
</head>
<body class="overflow-x-hidden text-white">
    <!-- Particle container for background effects -->
    <div id="particles-container" class="fixed inset-0 pointer-events-none z-0"></div>
    
    <!-- Header section with transparent navigation -->
    <header class="relative min-h-screen flex flex-col">
        <!-- Navigation bar with glass effect -->
        <nav class="fixed w-full z-50 px-6 md:px-10 py-4">
            <div class="max-w-7xl mx-auto glass-nav rounded-full px-6 py-3 flex justify-between items-center">
                <img src="<?php echo asset('/landing-page/main-logo.svg'); ?>" alt="MiscVord Logo" class="h-8 md:h-10 animate-glow">
                
                <!-- Desktop navigation links -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#" class="text-white hover:text-discord-blue transition-all duration-300">Download</a>
                    <a href="#" class="text-white hover:text-discord-blue transition-all duration-300">Nitro</a>
                    <a href="#" class="text-white hover:text-discord-blue transition-all duration-300">Discover</a>
                    <a href="#" class="text-white hover:text-discord-blue transition-all duration-300">Safety</a>
                    <a href="#" class="text-white hover:text-discord-blue transition-all duration-300">Support</a>
                </div>
                
                <!-- Mobile menu button -->
                <button class="md:hidden text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
                
                <!-- Login button -->
                <a href="#" class="hidden md:block bg-white bg-opacity-10 backdrop-blur-sm text-white font-medium px-6 py-2 rounded-full hover:bg-opacity-20 transition-all duration-300 transform hover:-translate-y-1">Login</a>
            </div>
        </nav>
        
        <!-- Animated floating elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <img src="<?php echo asset('/landing-page/flying-cat.webp'); ?>" alt="Flying Cat" 
                 class="absolute left-[15%] top-[15%] w-28 md:w-36 animate-float z-10" data-speed="0.3">
            
            <img src="<?php echo asset('/landing-page/robot.webp'); ?>" alt="Robot" 
                 class="absolute right-[15%] bottom-[25%] w-28 md:w-36 animate-float-delay z-10" data-speed="0.2">
            
            <img src="<?php echo asset('/landing-page/leaf.webp'); ?>" alt="Leaf" 
                 class="absolute left-[20%] bottom-[30%] w-20 md:w-24 animate-spin-slow z-10" data-speed="0.1">
                 
            <img src="<?php echo asset('/landing-page/box.webp'); ?>" alt="Box" 
                 class="absolute right-[25%] top-[30%] w-20 md:w-24 animate-wobble z-10" data-speed="0.15">
        </div>
        
        <!-- Hero content with transparent glass effect -->
        <div class="flex-1 flex items-center justify-center px-6 md:px-10 py-24">
            <div class="max-w-4xl glass-hero p-10 md:p-16 rounded-3xl text-center mt-16 relative overflow-hidden">
                <!-- Shimmering overlay -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 -translate-x-full animate-[shine_3s_infinite]"></div>
                
                <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-wide hero-title neon-text">IMAGINE A PLACE...</h1>
                <p class="text-lg md:text-xl max-w-3xl mx-auto mb-8 hero-text text-gray-200">
                    ...where you can belong to a school club, a gaming group, or a worldwide art community. 
                    Where just you and a handful of friends can spend time together. A place that makes it easy 
                    to talk every day and hang out more often.
                </p>
                
                <!-- Call to action buttons with enhanced hover effects -->
                <div class="flex flex-col md:flex-row justify-center gap-4 md:gap-6 hero-buttons">
                    <button class="discord-btn bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-medium transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download for Windows
                    </button>
                    <button class="discord-btn bg-discord-dark bg-opacity-50 backdrop-filter backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-medium transition-all">
                        Open MiscVord in your browser
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main content with transparent containers -->
    <main class="container mx-auto px-4 py-16 space-y-32">
        <!-- Feature section 1: Create an invite-only place -->
        <section class="flex flex-col md:flex-row items-center gap-8 md:gap-16 feature-section">
            <div class="w-full md:w-1/2 feature-image">
                <div class="modern-image">
                    <img src="<?php echo asset('/landing-page/actor.webp'); ?>" alt="Study group" class="w-full h-auto">
                </div>
            </div>
            <div class="w-full md:w-1/2 feature-content">
                <div class="content-card p-8 md:p-10 rounded-3xl">
                    <h2 class="text-3xl md:text-5xl font-bold mb-6 section-title">Create an invite-only place where you belong</h2>
                    <p class="text-lg md:text-xl text-gray-200">
                        MiscVord servers are organized into topic-based channels where you can collaborate, share, 
                        and just talk about your day without clogging up a group chat.
                    </p>
                </div>
            </div>
        </section>

        <!-- Feature section 2: Where hanging out is easy -->
        <section class="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 feature-section">
            <div class="w-full md:w-1/2 feature-content">
                <div class="content-card p-8 md:p-10 rounded-3xl">
                    <h2 class="text-3xl md:text-5xl font-bold mb-6 section-title">Where hanging out is easy</h2>
                    <p class="text-lg md:text-xl text-gray-200">
                        Grab a seat in a voice channel when you're free. Friends in your server can see 
                        you're around and instantly pop in to talk without having to call.
                    </p>
                </div>
            </div>
            <div class="w-full md:w-1/2 feature-image">
                <div class="modern-image">
                    <img src="<?php echo asset('/landing-page/actor-sit.webp'); ?>" alt="Voice channels" class="w-full h-auto">
                </div>
            </div>
        </section>

        <!-- Feature section 3: From few to a fandom -->
        <section class="flex flex-col md:flex-row items-center gap-8 md:gap-16 feature-section">
            <div class="w-full md:w-1/2 feature-image">
                <div class="modern-image">
                    <img src="<?php echo asset('/landing-page/hug.webp'); ?>" alt="Community" class="w-full h-auto">
                </div>
            </div>
            <div class="w-full md:w-1/2 feature-content">
                <div class="content-card p-8 md:p-10 rounded-3xl">
                    <h2 class="text-3xl md:text-5xl font-bold mb-6 section-title">From few to a fandom</h2>
                    <p class="text-lg md:text-xl text-gray-200">
                        Get any community running with moderation tools and custom member access. 
                        Give members special powers, set up private channels, and more.
                    </p>
                </div>
            </div>
        </section>

        <!-- Feature section 4: Reliable tech -->
        <section class="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 feature-section">
            <div class="w-full md:w-1/2 feature-content">
                <div class="content-card p-8 md:p-10 rounded-3xl">
                    <h2 class="text-3xl md:text-5xl font-bold mb-6 section-title">Reliable tech for staying close</h2>
                    <p class="text-lg md:text-xl text-gray-200">
                        Low-latency voice and video feels like you're in the same room. Wave hello over video, 
                        watch friends stream their games, or gather up and have a drawing session with screen share.
                    </p>
                </div>
            </div>
            <div class="w-full md:w-1/2 feature-image">
                <div class="modern-image">
                    <img src="<?php echo asset('/landing-page/computer.webp'); ?>" alt="Screen share" class="w-full h-auto">
                </div>
            </div>
        </section>

        <!-- Getting started section with animated elements -->
        <section class="py-16">
            <div class="max-w-4xl mx-auto dark-content-card p-10 md:p-16 rounded-3xl text-center relative overflow-hidden">
                <!-- Shimmering overlay -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-5 -translate-x-full animate-[shine_3s_infinite]"></div>
                
                <!-- Floating elements with advanced animations -->
                <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="Green Egg" 
                     class="absolute -left-6 top-1/4 w-20 md:w-24 animate-float hidden md:block" data-speed="0.2">
                
                <img src="<?php echo asset('/landing-page/thropy.webp'); ?>" alt="Trophy" 
                     class="absolute -right-6 bottom-1/4 w-20 md:w-24 animate-float-delay hidden md:block" data-speed="0.25">
                
                <div class="relative z-10 journey-content">
                    <h2 class="text-3xl md:text-5xl font-bold mb-8 neon-text">Ready to start your journey?</h2>
                    
                    <!-- Animated wiggle gif -->
                    <div class="relative inline-block animate-scale-pulse mb-10">
                        <img src="<?php echo asset('/landing-page/wiggle.gif'); ?>" alt="Wiggle" class="w-24 h-auto mx-auto">
                        <!-- Glow effect -->
                        <div class="absolute inset-0 rounded-full bg-discord-blue opacity-20 blur-xl -z-10 animate-pulse"></div>
                    </div>
                    
                    <!-- Call to action button with enhanced hover effect -->
                    <div class="mt-6">
                        <button class="discord-btn bg-discord-blue bg-opacity-70 hover:bg-opacity-90 backdrop-filter backdrop-blur-sm text-white px-10 py-5 rounded-full text-lg font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline mr-2 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download for Windows
                        </button>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer with transparent glass effect -->
    <footer class="glass-nav py-16 px-6 md:px-10 mt-20 border-t border-gray-700 border-opacity-30">
        <!-- Footer content -->
        <div class="max-w-7xl mx-auto">
            <!-- Footer top section -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-10 pb-10">
                <!-- Brand column -->
                <div class="col-span-2">
                    <h3 class="text-discord-blue text-4xl font-bold mb-6 neon-text">IMAGINE A PLACE</h3>
                    <!-- Language selector -->
                    <div class="flex items-center mb-6 hover:text-discord-blue transition-colors duration-300 cursor-pointer">
                        <img src="<?php echo asset('/landing-page/discord-logo.webp'); ?>" alt="US Flag" class="w-6 h-6 mr-2">
                        <span>English, USA</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    
                    <!-- Social media links with hover effects -->
                    <div class="flex space-x-6">
                        <a href="#" class="text-white hover:text-discord-blue transition-colors duration-300 transform hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22,3.999c-0.78,0.463-2.345,1.094-3.265,1.276c-0.027,0.007-0.049,0.016-0.075,0.023c-0.813-0.802-1.927-1.299-3.16-1.299 c-2.485,0-4.5,2.015-4.5,4.5c0,0.131-0.011,0.372,0,0.5c-3.353,0-5.905-1.756-7.735-4c-0.199,0.5-0.286,1.29-0.286,2.032 c0,1.401,1.095,2.777,2.8,3.63c-0.314,0.081-0.66,0.139-1.02,0.139c-0.581,0-1.196-0.153-1.759-0.617c0,0.017,0,0.033,0,0.051 c0,1.958,2.078,3.291,3.926,3.662c-0.375,0.221-1.131,0.243-1.5,0.243c-0.26,0-1.18-0.119-1.426-0.165 c0.514,1.605,2.368,2.507,4.135,2.539c-1.382,1.084-2.341,1.486-5.171,1.486H2C3.788,19.145,6.065,20,8.347,20 C15.777,20,20,14.337,20,8.999c0-0.086-0.002-0.266-0.005-0.447C19.995,8.534,20,8.517,20,8.499c0-0.027-0.008-0.053-0.008-0.08 c-0.003-0.136-0.006-0.263-0.009-0.329c0.79-0.57,1.475-1.281,2.017-2.091c-0.725,0.322-1.503,0.538-2.32,0.636 C20.514,6.135,21.699,4.943,22,3.999z"/>
                            </svg>
                        </a>
                        <a href="#" class="text-white hover:text-discord-blue transition-colors duration-300 transform hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.593,7.203c-0.23-0.858-0.905-1.535-1.762-1.766C18.265,5.007,12,5,12,5S5.736,4.993,4.169,5.404 c-0.84,0.229-1.534,0.921-1.766,1.778c-0.413,1.566-0.417,4.814-0.417,4.814s-0.004,3.264,0.406,4.814 c0.23,0.857,0.905,1.534,1.763,1.765c1.582,0.43,7.83,0.437,7.83,0.437s6.265,0.007,7.831-0.403 c0.856-0.23,1.534-0.906,1.767-1.763c0.414-1.565,0.417-4.812,0.417-4.812S22.02,8.769,21.593,7.203z M9.996,15.005l0.005-6 l5.207,3.005L9.996,15.005z"/>
                            </svg>
                        </a>
                        <a href="#" class="text-white hover:text-discord-blue transition-colors duration-300 transform hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2.163c3.204,0,3.584,0.012,4.85,0.07c3.252,0.148,4.771,1.691,4.919,4.919c0.058,1.265,0.069,1.645,0.069,4.849 c0,3.205-0.012,3.584-0.069,4.849c-0.149,3.225-1.664,4.771-4.919,4.919c-1.266,0.058-1.644,0.07-4.85,0.07 c-3.204,0-3.584-0.012-4.849-0.07c-3.26-0.149-4.771-1.699-4.919-4.92c-0.058-1.265-0.07-1.644-0.07-4.849 c0-3.204,0.013-3.583,0.07-4.849C2.381,3.924,3.896,2.38,7.151,2.232C8.417,2.175,8.796,2.163,12,2.163z M12,4.332 c-3.159,0-3.508,0.014-4.749,0.068c-2.222,0.102-3.249,1.142-3.35,3.35c-0.055,1.24-0.069,1.589-0.069,4.748 c0,3.159,0.014,3.508,0.069,4.748c0.101,2.207,1.127,3.249,3.35,3.35c1.24,0.055,1.589,0.069,4.749,0.069 c3.161,0,3.509-0.014,4.749-0.069c2.207-0.102,3.249-1.143,3.35-3.35c0.055-1.24,0.069-1.589,0.069-4.748 c0-3.159-0.014-3.508-0.069-4.748c-0.102-2.207-1.144-3.247-3.35-3.35C15.509,4.346,15.16,4.332,12,4.332z M12,7.163 c-3.204,0-5.803,2.598-5.803,5.803c0,3.204,2.598,5.803,5.803,5.803c3.204,0,5.803-2.598,5.803-5.803 C17.803,9.762,15.205,7.163,12,7.163z M12,16.102c-1.733,0-3.138-1.405-3.138-3.138c0-1.733,1.405-3.138,3.138-3.138 c1.733,0,3.138,1.405,3.138,3.138C15.138,14.698,13.733,16.102,12,16.102z"/>
                            </svg>
                        </a>
                    </div>
                </div>
                
                <!-- Links columns with hover effects -->
                <div class="footer-column">
                    <h4 class="text-discord-blue font-semibold mb-4">Product</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Download</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Nitro</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Status</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h4 class="text-discord-blue font-semibold mb-4">Company</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">About</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Jobs</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Brand</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h4 class="text-discord-blue font-semibold mb-4">Resources</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">College</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Support</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Safety</a></li>
                        <li><a href="#" class="hover:text-discord-blue transition-colors duration-300">Blog</a></li>
                    </ul>
                </div>
            </div>
            
            <!-- Divider -->
            <div class="divider my-8"></div>
            
            <!-- Footer bottom section -->
            <div class="flex flex-col md:flex-row justify-between items-center">
                <div>
                    <img src="<?php echo asset('/landing-page/main-logo.svg'); ?>" alt="MiscVord Logo" class="h-10 animate-glow">
                </div>
                <div class="mt-6 md:mt-0">
                    <button class="discord-btn bg-discord-blue bg-opacity-70 hover:bg-opacity-100 backdrop-filter backdrop-blur-sm text-white px-8 py-3 rounded-full font-medium">
                        Sign up
                    </button>
                </div>
            </div>
        </div>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize GSAP for advanced animations
            gsap.registerPlugin(ScrollTrigger);
            
            // Hero animations
            gsap.from(".hero-title", {
                opacity: 0,
                y: 50,
                duration: 1,
                ease: "power3.out"
            });
            
            gsap.from(".hero-text", {
                opacity: 0,
                y: 30,
                duration: 1,
                delay: 0.3,
                ease: "power3.out"
            });
            
            gsap.from(".hero-buttons", {
                opacity: 0,
                y: 30,
                duration: 1,
                delay: 0.6,
                ease: "power3.out"
            });
            
            // Feature section animations
            gsap.utils.toArray(".feature-section").forEach((section, i) => {
                // Staggered animation for alternating sections
                const direction = i % 2 === 0 ? 1 : -1;
                
                // Content animation
                gsap.from(section.querySelector(".feature-content"), {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 75%",
                        toggleActions: "play none none none"
                    },
                    x: 50 * direction,
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out"
                });
                
                // Image animation with slight delay
                gsap.from(section.querySelector(".feature-image"), {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 75%",
                        toggleActions: "play none none none"
                    },
                    x: -50 * direction,
                    opacity: 0,
                    duration: 1,
                    delay: 0.2,
                    ease: "power2.out"
                });
            });
            
            // Journey section animation
            gsap.from(".journey-content", {
                scrollTrigger: {
                    trigger: ".journey-content",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 50,
                duration: 1,
                ease: "power2.out"
            });
            
            // Parallax scrolling effect
            const parallaxElements = document.querySelectorAll('[data-speed]');
            
            window.addEventListener('scroll', function() {
                const scrollY = window.pageYOffset;
                
                parallaxElements.forEach(element => {
                    const speed = element.getAttribute('data-speed') || 0.3;
                    // Calculate transformation based on scroll position and speed
                    const yPos = -(scrollY * parseFloat(speed));
                    element.style.transform = `translateY(${yPos}px)`;
                });
            });
            
            // Mobile menu toggle
            const menuButton = document.querySelector('.md\\:hidden');
            menuButton.addEventListener('click', function() {
                alert("Mobile menu coming soon!");
            });
            
            // Smooth scroll functionality
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if (targetId !== '#') {
                        document.querySelector(targetId).scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Create particle background effect
            createParticles();
            
            // Add 3D tilt effect to images
            const images = document.querySelectorAll('.modern-image');
            images.forEach(image => {
                image.addEventListener('mousemove', function(e) {
                    const rect = image.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const xRotation = ((y - rect.height / 2) / rect.height) * 10;
                    const yRotation = ((x - rect.width / 2) / rect.width) * -10;
                    
                    image.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
                });
                
                image.addEventListener('mouseout', function() {
                    image.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                });
            });
        });
        
        // Function to create floating particles in the background
        function createParticles() {
            const container = document.getElementById('particles-container');
            const particleCount = 50;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                // Random position
                const posX = Math.random() * 100;
                const posY = Math.random() * 100;
                
                // Random size
                const size = Math.random() * 3 + 1;
                
                // Random opacity
                const opacity = Math.random() * 0.2 + 0.1;
                
                // Set particle properties
                particle.style.left = posX + '%';
                particle.style.top = posY + '%';
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.opacity = opacity;
                
                // Add animation with random duration
                const duration = Math.random() * 20 + 10;
                particle.style.animation = `float ${duration}s ease-in-out infinite`;
                particle.style.animationDelay = Math.random() * 10 + 's';
                
                // Add particle to container
                container.appendChild(particle);
            }
        }
    </script>
</body>
</html>