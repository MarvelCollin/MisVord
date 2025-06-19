<?php

if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section class="hero-section relative overflow-hidden min-h-screen py-20 md:py-0" id="parallax-hero">

    <div class="tornado-container">

        <div class="parallax-layer tornado-base" data-depth="0.2">
            <div class="tornado-funnel"></div>
        </div>

        <div class="parallax-layer tornado-debris" data-depth="0.4">
            <div class="debris-item" style="left:20%; top:25%; --rotate:22deg"></div>
            <div class="debris-item" style="left:65%; top:40%; --rotate:-15deg"></div>
            <div class="debris-item" style="left:35%; top:60%; --rotate:8deg"></div>
            <div class="debris-item" style="left:50%; top:30%; --rotate:-20deg"></div>
            <div class="debris-item" style="left:80%; top:70%; --rotate:12deg"></div>
        </div>

        <div class="parallax-layer tornado-clouds" data-depth="0.1">
            <div class="tornado-cloud" style="left:10%; top:15%; --scale:1.2; --opacity:0.6"></div>
            <div class="tornado-cloud" style="left:60%; top:10%; --scale:0.8; --opacity:0.4"></div>
            <div class="tornado-cloud" style="left:30%; top:5%; --scale:1.5; --opacity:0.5"></div>
            <div class="tornado-cloud" style="left:80%; top:20%; --scale:1.1; --opacity:0.3"></div>
        </div>

        <div class="parallax-layer lightning-layer" data-depth="0.05">
            <div class="lightning" id="lightning1"></div>
            <div class="lightning" id="lightning2"></div>
        </div>

        <div class="parallax-layer flying-objects" data-depth="0.3">
            <img src="<?php echo asset('/images/landing-page/flying-cat.webp'); ?>" alt="Flying Cat" class="tornado-object" data-top="30" data-left="25" data-delay="0.5" data-duration="8">
            <img src="<?php echo asset('/images/landing-page/box.webp'); ?>" alt="Box" class="tornado-object" data-top="45" data-left="70" data-delay="1.2" data-duration="6">
            <img src="<?php echo asset('/images/landing-page/green-egg.webp'); ?>" alt="Green Egg" class="tornado-object" data-top="55" data-left="40" data-delay="0.8" data-duration="7">
            <img src="<?php echo asset('/images/landing-page/thropy.webp'); ?>" alt="Trophy" class="tornado-object" data-top="35" data-left="60" data-delay="1.5" data-duration="9">
        </div>
    </div>

    <div class="container mx-auto px-4 relative z-10 h-screen flex flex-col justify-center">
        <div class="text-center max-w-4xl mx-auto glass-hero p-10 md:p-16 rounded-3xl">
            <h1 id="heroTitle" class="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight scramble-text" data-text="IMAGINE A PLACE...">
                IMAGINE A PLACE...
            </h1>

            <p class="text-xl md:text-2xl text-white mb-8 opacity-90 max-w-2xl mx-auto">
                ...where you can belong to a school club, a gaming group, or a worldwide art community. 
                Where just you and a handful of friends can spend time together. A place that makes it easy 
                to talk every day and hang out more often.
            </p>

            <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#download" class="download-btn bg-white text-black hover:text-blue-600 hover:shadow-lg transition-all py-4 px-8 rounded-full text-lg font-medium flex items-center">
                    <i class="fa-solid fa-download h-5 w-5 mr-2"></i>
                    Download for Windows
                </a>
                <a href="/login" class="open-browser-btn border border-white text-white hover:bg-white hover:bg-opacity-10 transition-all py-4 px-8 rounded-full text-lg font-medium">
                    Open misvord in your browser
                </a>
            </div>
        </div>

        <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
            <span class="text-white text-sm mb-2">Scroll to explore</span>
            <div class="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                <div class="w-1 h-2 bg-white rounded-full mt-2 animate-pulse"></div>
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
                                            <i class="fa-solid fa-play h-8 w-8 text-blue-500 text-3xl"></i>
                                        </div>
                                        <h5 class="font-medium text-sm">Gaming Group</h5>
                                        <p class="text-xs text-gray-500">12,543 members</p>
                                    </div>

                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200 relative">
                                        <div class="community-bubble absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                                            +3
                                        </div>
                                        <div class="w-full h-16 bg-green-100 rounded-md flex items-center justify-center mb-2">
                                            <i class="fa-solid fa-envelope h-8 w-8 text-green-500 text-3xl"></i>
                                        </div>
                                        <h5 class="font-medium text-sm">Art Community</h5>
                                        <p class="text-xs text-gray-500">8,721 members</p>
                                    </div>

                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div class="w-full h-16 bg-purple-100 rounded-md flex items-center justify-center mb-2">
                                            <i class="fa-solid fa-fire h-8 w-8 text-purple-500 text-3xl"></i>
                                        </div>
                                        <h5 class="font-medium text-sm">Cooking Club</h5>
                                        <p class="text-xs text-gray-500">5,318 members</p>
                                    </div>

                                    <div class="community-card bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div class="w-full h-16 bg-yellow-100 rounded-md flex items-center justify-center mb-2">
                                            <i class="fa-solid fa-file h-8 w-8 text-yellow-500 text-3xl"></i>
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

            <div class="nav-indicators flex justify-center mt-8 space-x-2">
                <button class="indicator active w-3 h-3 rounded-full bg-blue-500" data-index="0"></button>
                <button class="indicator w-3 h-3 rounded-full bg-gray-300" data-index="1"></button>
                <button class="indicator w-3 h-3 rounded-full bg-gray-300" data-index="2"></button>
            </div>

            <div class="carousel-navigation flex justify-center mt-4 space-x-4">
                <button class="prev-btn p-2 rounded-full bg-gray-200 disabled:opacity-50">
                    <i class="fa-solid fa-chevron-left h-6 w-6"></i>
                </button>
                <button class="next-btn p-2 rounded-full bg-gray-200">
                    <i class="fa-solid fa-chevron-right h-6 w-6"></i>
                </button>
            </div>
        </div>
    </div>
</section>

<section class="cta-section bg-gray-800 text-white py-20">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl font-bold mb-6">Ready to start your journey?</h2>
            <p class="text-xl mb-10">Join the millions already enjoying misvord today. Create your account and start connecting.</p>

            <a href="/register" class="bg-blue-500 hover:bg-blue-600 text-white py-4 px-8 rounded-full text-lg font-medium transition-all">
                Get Started
            </a>
        </div>
    </div>
</section>

<div class="particles-container fixed inset-0 pointer-events-none z-0"></div>