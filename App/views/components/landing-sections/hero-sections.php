<section class="hero-section relative overflow-hidden bg-[#404EED] py-20 md:py-32">
    <!-- Background elements -->
    <div class="absolute inset-0 overflow-hidden">
        <div class="gradient-orb absolute -top-20 -left-20 w-64 h-64 rounded-full bg-purple-500 opacity-30 blur-3xl"></div>
        <div class="gradient-orb absolute top-40 right-20 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div class="gradient-orb absolute bottom-10 left-1/3 w-96 h-96 rounded-full bg-indigo-500 opacity-25 blur-3xl"></div>
        
        <!-- Floating elements -->
        <div class="hidden md:block">
            <img src="<?php echo asset('images/stars.svg'); ?>" class="floating-element absolute top-10 left-10 w-20 h-20" data-speed="0.2" data-amplitude="30" alt="Stars">
            <img src="<?php echo asset('images/cloud.svg'); ?>" class="floating-element absolute bottom-32 right-20 w-32 h-24" data-speed="0.15" data-amplitude="15" data-rotation="5" alt="Cloud">
            <img src="<?php echo asset('images/sparkles.svg'); ?>" class="floating-element absolute top-40 left-1/4 w-16 h-16" data-speed="0.3" data-amplitude="25" alt="Sparkles">
        </div>
    </div>

    <div class="container mx-auto px-4 relative z-10">
        <div class="text-center max-w-4xl mx-auto">
            <h1 id="heroTitle" class="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
                IMAGINE A PLACE...
            </h1>
            
            <p class="text-xl md:text-2xl text-white mb-8 opacity-90 max-w-2xl mx-auto">
                ...where you can belong to a school club, a gaming group, or a worldwide art community. 
                Where just you and a handful of friends can spend time together. A place that makes it easy 
                to talk every day and hang out more often.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#download" class="download-btn bg-white text-black hover:text-blue-600 hover:shadow-lg transition-all py-4 px-8 rounded-full text-lg font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                    Download for Windows
                </a>
                <a href="#browser" class="open-browser-btn border border-white text-white hover:bg-white hover:bg-opacity-10 transition-all py-4 px-8 rounded-full text-lg font-medium">
                    Open MiscVord in your browser
                </a>
            </div>
        </div>
    </div>

    <!-- Hero image -->
    <div class="container mx-auto px-4 mt-16 relative">
        <div class="max-w-6xl mx-auto relative">
            <img 
                src="<?php echo asset('images/hero-illustration.svg'); ?>" 
                class="w-full h-auto object-contain rounded-lg shadow-2xl hero-image transform transition-transform"
                alt="MiscVord Interface"
            >
            <!-- Floating chat bubbles -->
            <div class="message-bubble absolute left-1/4 -top-10 bg-white p-4 rounded-lg shadow-lg hidden md:block">
                <p class="text-sm">Welcome to MiscVord!</p>
            </div>
            <div class="message-bubble absolute right-1/4 top-20 bg-white p-4 rounded-lg shadow-lg hidden md:block">
                <p class="text-sm">Let's hang out! 🎮</p>
            </div>
        </div>
    </div>
</section>

<section class="features-section py-20 bg-white">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-5xl font-bold text-center mb-16">An invite-only place with plenty of room to talk</h2>
        
        <div class="carousel-section relative">
            <div class="carousel-container overflow-hidden">
                <div class="carousel-track flex transition-transform duration-500">
                    <!-- Feature Card: Chat -->
                    <div class="feature-card min-w-full md:min-w-[33.333%] px-4" data-feature="chat">
                        <div class="card-content bg-gray-100 rounded-2xl p-6 h-full">
                            <div class="card-header mb-6">
                                <h3 class="text-2xl font-bold mb-2">Text Chat</h3>
                                <p class="text-gray-600">Send messages, share media, and keep the conversation flowing</p>
                            </div>
                            
                            <div class="chat-demo bg-white rounded-lg p-4 shadow-md">
                                <div class="chat-message incoming mb-4">
                                    <div class="flex items-start">
                                        <div class="w-8 h-8 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div class="font-medium text-blue-500">CoolUser123</div>
                                            <div class="message-text bg-gray-100 p-2 rounded-lg mt-1">Hey everyone! Who's up for some gaming tonight?</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="chat-message outgoing mb-4">
                                    <div class="flex items-start justify-end">
                                        <div>
                                            <div class="font-medium text-right text-purple-500">You</div>
                                            <div class="message-text bg-purple-100 p-2 rounded-lg mt-1">Count me in! What time?</div>
                                        </div>
                                        <div class="w-8 h-8 rounded-full bg-purple-500 ml-3 flex-shrink-0"></div>
                                    </div>
                                </div>
                                
                                <div class="chat-message incoming">
                                    <div class="flex items-start">
                                        <div class="w-8 h-8 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div class="font-medium text-blue-500">CoolUser123</div>
                                            <div class="message-text bg-gray-100 p-2 rounded-lg mt-1">How about 8pm? I got the new expansion pack!</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Feature Card: Voice -->
                    <div class="feature-card min-w-full md:min-w-[33.333%] px-4" data-feature="voice">
                        <div class="card-content bg-gray-100 rounded-2xl p-6 h-full">
                            <div class="card-header mb-6">
                                <h3 class="text-2xl font-bold mb-2">Voice Channels</h3>
                                <p class="text-gray-600">Hang out with voice chat that feels like you're in the same room</p>
                            </div>
                            
                            <div class="voice-channel bg-white rounded-lg p-4 shadow-md">
                                <div class="voice-channel-header border-b pb-2 mb-4">
                                    <h4 class="font-medium">🔊 Gaming Voice Channel</h4>
                                </div>
                                
                                <div class="voice-users space-y-4">
                                    <div class="voice-user flex items-center speaking">
                                        <div class="w-10 h-10 rounded-full bg-green-500 mr-3 flex-shrink-0 flex items-center justify-center text-white font-bold">G</div>
                                        <div class="flex-grow">
                                            <div class="font-medium">GamerPro</div>
                                            <div class="audio-waves flex items-center space-x-1">
                                                <span class="inline-block w-1 bg-green-500"></span>
                                                <span class="inline-block w-1 bg-green-500"></span>
                                                <span class="inline-block w-1 bg-green-500"></span>
                                                <span class="inline-block w-1 bg-green-500"></span>
                                                <span class="inline-block w-1 bg-green-500"></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="voice-user flex items-center">
                                        <div class="w-10 h-10 rounded-full bg-purple-500 mr-3 flex-shrink-0 flex items-center justify-center text-white font-bold">Y</div>
                                        <div>
                                            <div class="font-medium">You</div>
                                        </div>
                                    </div>
                                    
                                    <div class="voice-user flex items-center">
                                        <div class="w-10 h-10 rounded-full bg-blue-500 mr-3 flex-shrink-0 flex items-center justify-center text-white font-bold">N</div>
                                        <div>
                                            <div class="font-medium">NightOwl</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Feature Card: Community -->
                    <div class="feature-card min-w-full md:min-w-[33.333%] px-4" data-feature="community">
                        <div class="card-content bg-gray-100 rounded-2xl p-6 h-full">
                            <div class="card-header mb-6">
                                <h3 class="text-2xl font-bold mb-2">Communities</h3>
                                <p class="text-gray-600">Join groups centered around your interests and passions</p>
                            </div>
                            
                            <div class="community-showcase bg-white rounded-lg p-4 shadow-md">
                                <div class="community-grid grid grid-cols-2 gap-4">
                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200 relative">
                                        <div class="community-bubble absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                            +1
                                        </div>
                                        <div class="w-full h-16 bg-blue-100 rounded-md flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                            </svg>
                                        </div>
                                        <h5 class="font-medium text-sm">Gaming Group</h5>
                                        <p class="text-xs text-gray-500">12,543 members</p>
                                    </div>
                                    
                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200 relative">
                                        <div class="community-bubble absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                                            +3
                                        </div>
                                        <div class="w-full h-16 bg-green-100 rounded-md flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h10v7h-2l-1 2H8l-1-2H4V6z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <h5 class="font-medium text-sm">Art Community</h5>
                                        <p class="text-xs text-gray-500">8,721 members</p>
                                    </div>
                                    
                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div class="w-full h-16 bg-purple-100 rounded-md flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <h5 class="font-medium text-sm">Cooking Club</h5>
                                        <p class="text-xs text-gray-500">5,318 members</p>
                                    </div>
                                    
                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div class="w-full h-16 bg-yellow-100 rounded-md flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <h5 class="font-medium text-sm">Study Group</h5>
                                        <p class="text-xs text-gray-500">3,954 members</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Navigation dots -->
            <div class="nav-indicators flex justify-center mt-8 space-x-2">
                <button class="indicator active w-3 h-3 rounded-full bg-blue-500" data-index="0"></button>
                <button class="indicator w-3 h-3 rounded-full bg-gray-300" data-index="1"></button>
                <button class="indicator w-3 h-3 rounded-full bg-gray-300" data-index="2"></button>
            </div>
            
            <!-- Navigation buttons -->
            <div class="carousel-navigation flex justify-center mt-4 space-x-4">
                <button class="prev-btn p-2 rounded-full bg-gray-200 disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button class="next-btn p-2 rounded-full bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</section>

<section class="cta-section bg-gray-800 text-white py-20">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl font-bold mb-6">Ready to start your journey?</h2>
            <p class="text-xl mb-10">Join the millions already enjoying MiscVord today. Create your account and start connecting.</p>
            
            <a href="/register" class="bg-blue-500 hover:bg-blue-600 text-white py-4 px-8 rounded-full text-lg font-medium transition-all">
                Get Started
            </a>
        </div>
    </div>
</section>

<div class="particles-container fixed inset-0 pointer-events-none z-0"></div>

<style>
    .hero-image {
        transition: transform 0.5s ease-in-out;
    }
    .hero-image:hover {
        transform: translateY(-10px);
    }
    
    .message-bubble {
        animation: float 5s ease-in-out infinite alternate;
    }
    
    .download-btn:hover {
        transform: translateY(-3px);
    }
    
    @keyframes float {
        0% {
            transform: translateY(0px);
        }
        100% {
            transform: translateY(-10px);
        }
    }
    
    .particle {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        animation: float-particle 15s infinite ease-in-out;
    }
    
    @keyframes float-particle {
        0%, 100% {
            transform: translate(0, 0);
        }
        25% {
            transform: translate(100px, 50px);
        }
        50% {
            transform: translate(50px, 100px);
        }
        75% {
            transform: translate(-50px, 50px);
        }
    }
    
    .trail-dot {
        pointer-events: none;
    }
    
    .char.scrambled {
        animation: scramble 0.8s linear;
    }
    
    @keyframes scramble {
        0% {
            transform: translateY(0) rotate(0);
            opacity: 1;
        }
        20% {
            transform: translateY(-10px) rotate(-3deg);
            opacity: 0.8;
        }
        40% {
            transform: translateY(5px) rotate(3deg);
            opacity: 0.6;
        }
        60% {
            transform: translateY(-5px) rotate(-2deg);
            opacity: 0.8;
        }
        80% {
            transform: translateY(2px) rotate(1deg);
            opacity: 0.9;
        }
        100% {
            transform: translateY(0) rotate(0);
            opacity: 1;
        }
    }
    
    .audio-waves span {
        display: inline-block;
        height: 5px;
        animation: wave 1s infinite ease-in-out;
    }
    
    .audio-waves span:nth-child(2) {
        animation-delay: 0.1s;
    }
    
    .audio-waves span:nth-child(3) {
        animation-delay: 0.2s;
    }
    
    .audio-waves span:nth-child(4) {
        animation-delay: 0.15s;
    }
    
    .audio-waves span:nth-child(5) {
        animation-delay: 0.25s;
    }
    
    @keyframes wave {
        0%, 100% {
            height: 5px;
        }
        50% {
            height: 15px;
        }
    }
    
    .community-bubble {
        animation: pulse 2s infinite ease-in-out;
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
</style>
