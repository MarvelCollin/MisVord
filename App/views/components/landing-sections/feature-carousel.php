<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Feature Carousel Section -->
<section class="py-20 px-6 relative overflow-hidden" id="feature-carousel-section">
    <div class="container mx-auto">
        <!-- Section heading -->
        <div class="text-center mb-12">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 text-white section-title animated-fade-in">
                <span class="bg-gradient-to-r from-discord-green to-discord-blue bg-clip-text text-transparent">
                    Discord Features
                </span>
            </h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto animated-fade-in mb-2">
                Everything you need to create your community
            </p>
        </div>
        
        <!-- Feature carousel component with fixed structure -->
        <div class="feature-carousel relative rounded-2xl overflow-hidden shadow-2xl" tabindex="0">
            <div class="carousel-container">
                <div class="carousel-track flex transition-transform duration-500 ease-out">
                    <!-- Slide 1: Text Chat Feature -->
                    <div class="carousel-slide min-w-full px-4" aria-hidden="false" data-slide="0">
                        <!-- Content remains the same -->
                        <div class="carousel-content bg-gradient-to-br from-discord-dark to-[#42464D] rounded-xl overflow-hidden h-full">
                            <!-- ... existing slide 1 content ... -->
                            <div class="flex flex-col md:flex-row h-full">
                                <!-- Content side -->
                                <div class="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                                    <div class="feature-icon mb-6 w-16 h-16 rounded-full bg-discord-blue bg-opacity-20 flex items-center justify-center">
                                        <!-- Chat icon -->
                                        <svg class="w-8 h-8 text-discord-blue" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 12C21 16.9706 16.9706 21 12 21C10.2289 21 8.57736 20.5053 7.18491 19.6408L3 21L4.3592 16.8151C3.49466 15.4226 3 13.7711 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 12V12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M8 12V12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M16 12V12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <h3 class="text-2xl md:text-3xl font-bold mb-4 text-white">Text Chat</h3>
                                    <ul class="text-gray-300 space-y-3 mb-6 list-disc list-inside">
                                        <li>Create channels for different topics</li>
                                        <li>Share files, images, and videos</li>
                                        <li>Rich text formatting and emoji reactions</li>
                                        <li>Keep conversations organized with threads</li>
                                    </ul>
                                    <div class="mt-auto">
                                        <button class="discord-btn bg-discord-blue bg-opacity-70 hover:bg-opacity-100 text-white px-6 py-2 rounded-full text-lg font-medium mt-4">
                                            Learn More
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Visual side -->
                                <div class="md:w-1/2 bg-discord-dark p-6 flex items-center justify-center">
                                    <div class="chat-demo w-full max-w-md bg-[#36393f] rounded-lg shadow-xl overflow-hidden">
                                        <!-- ... chat demo content ... -->
                                        <!-- Chat header -->
                                        <div class="bg-[#2f3136] px-4 py-3 flex items-center border-b border-gray-900">
                                            <div class="text-white font-bold"># general</div>
                                            <div class="ml-auto text-gray-400 text-sm">3 online</div>
                                        </div>
                                        
                                        <!-- Chat messages -->
                                        <div class="p-4 space-y-4 h-64 overflow-y-auto">
                                            <!-- Message content -->
                                        </div>
                                        
                                        <!-- Chat input -->
                                        <div class="bg-[#40444b] p-4 flex items-center">
                                            <div class="bg-transparent text-gray-400 flex-grow rounded-md">Type a message...</div>
                                            <button class="ml-2 text-gray-400 hover:text-gray-200">
                                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Slide 2: Voice & Video Feature -->
                    <div class="carousel-slide min-w-full px-4" aria-hidden="true" data-slide="1">
                        <!-- Content remains the same -->
                        <div class="carousel-content bg-gradient-to-br from-discord-dark to-[#42464D] rounded-xl overflow-hidden h-full">
                            <!-- ... existing slide 2 content ... -->
                            <div class="flex flex-col md:flex-row h-full">
                                <!-- Similar structure as slide 1 -->
                                <div class="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                                    <div class="feature-icon mb-6 w-16 h-16 rounded-full bg-discord-green bg-opacity-20 flex items-center justify-center">
                                        <!-- Microphone icon -->
                                        <svg class="w-8 h-8 text-discord-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M19 10V12C19 16.4183 15.4183 20 11 20M5 10V12C5 16.4183 8.58172 20 13 20M12 20V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3 class="text-2xl md:text-3xl font-bold mb-4 text-white">Voice & Video</h3>
                                    <ul class="text-gray-300 space-y-3 mb-6 list-disc list-inside">
                                        <li>Crystal clear low-latency voice chat</li>
                                        <li>High-quality video calls with up to 25 users</li>
                                        <li>Screen sharing for presentations</li>
                                        <li>Built-in noise suppression</li>
                                    </ul>
                                    <div class="mt-auto">
                                        <button class="discord-btn bg-discord-green bg-opacity-70 hover:bg-opacity-100 text-white px-6 py-2 rounded-full text-lg font-medium mt-4">
                                            Learn More
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Voice channel demo -->
                                <div class="md:w-1/2 bg-discord-dark p-6 flex items-center justify-center">
                                    <!-- Voice UI content -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Slide 3: Community Tools Feature -->
                    <div class="carousel-slide min-w-full px-4" aria-hidden="true" data-slide="2">
                        <div class="carousel-content bg-gradient-to-br from-discord-dark to-[#42464D] rounded-xl overflow-hidden h-full">
                            <!-- ... existing slide 3 content ... -->
                            <div class="flex flex-col md:flex-row h-full">
                                <!-- Similar structure as previous slides -->
                                <div class="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                                    <div class="feature-icon mb-6 w-16 h-16 rounded-full bg-discord-pink bg-opacity-20 flex items-center justify-center">
                                        <!-- People icon -->
                                        <svg class="w-8 h-8 text-discord-pink" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M7 20V18C7 17.3438 7.12642 16.717 7.35625 16.1429M7.35625 16.1429C8.0935 14.301 9.89482 13 12 13C14.1052 13 15.9065 14.301 16.6438 16.1429M15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7ZM21 10C21 11.1046 20.1046 12 19 12C17.8954 12 17 11.1046 17 10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10ZM7 10C7 11.1046 6.10457 12 5 12C3.89543 12 3 11.1046 3 10C3 8.89543 3.89543 8 5 8C6.10457 8 7 8.89543 7 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3 class="text-2xl md:text-3xl font-bold mb-4 text-white">Community Tools</h3>
                                    <ul class="text-gray-300 space-y-3 mb-6 list-disc list-inside">
                                        <li>Create roles with custom permissions</li>
                                        <li>Set up advanced moderation tools</li>
                                        <li>Schedule community events</li>
                                        <li>Create forums for organized discussions</li>
                                    </ul>
                                    <div class="mt-auto">
                                        <button class="discord-btn bg-discord-pink bg-opacity-70 hover:bg-opacity-100 text-white px-6 py-2 rounded-full text-lg font-medium mt-4">
                                            Learn More
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Community tools demo -->
                                <div class="md:w-1/2 bg-discord-dark p-6 flex items-center justify-center">
                                    <!-- Community UI content -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Carousel navigation with better accessibility and visibility -->
            <div class="carousel-nav mt-8 flex flex-col items-center">
                <!-- Carousel dots with hover previews -->
                <div class="carousel-dots flex space-x-3 mb-4" role="tablist">
                    <button class="carousel-dot active" aria-label="View Text Chat feature" data-slide="0" title="Text Chat"></button>
                    <button class="carousel-dot" aria-label="View Voice & Video feature" data-slide="1" title="Voice & Video"></button>
                    <button class="carousel-dot" aria-label="View Community Tools feature" data-slide="2" title="Community Tools"></button>
                </div>
                
                <!-- Remove the progress indicator that was used for auto-rotation -->
                
                <!-- Navigation buttons with improved styling -->
                <div class="flex space-x-4">
                    <button id="carousel-prev" class="carousel-button carousel-prev bg-discord-dark hover:bg-discord-blue transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full" aria-label="Previous slide">
                        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button id="carousel-next" class="carousel-button carousel-next bg-discord-dark hover:bg-discord-blue transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full" aria-label="Next slide">
                        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Add CSS for carousel component -->
<style>
/* Feature carousel styling */
.feature-carousel {
    height: 550px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.carousel-container {
    height: 100%;
    overflow: hidden;
}

.carousel-track {
    height: 100%;
    transition: transform 0.5s ease-out;
}

.carousel-slide {
    height: 100%;
    opacity: 0.5;
    transition: opacity 0.5s ease;
}

.carousel-slide.active {
    opacity: 1;
}

.carousel-content {
    height: 100%;
    transform: scale(0.95);
    transition: transform 0.5s ease, box-shadow 0.5s ease;
}

.carousel-slide.active .carousel-content {
    transform: scale(1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* Voice bars animation */
.voice-bar {
    animation: voice-pulse 1s ease-in-out infinite alternate;
}

.voice-bar:nth-child(1) { animation-delay: 0s; }
.voice-bar:nth-child(2) { animation-delay: 0.15s; }
.voice-bar:nth-child(3) { animation-delay: 0.3s; }
.voice-bar:nth-child(4) { animation-delay: 0.45s; }

@keyframes voice-pulse {
    0% { height: 4px; }
    100% { height: 16px; }
}

/* Cursor blink animation */
.cursor-blink {
    display: inline-block;
    width: 2px;
    height: 1em;
    background-color: currentColor;
    margin-left: 2px;
    animation: blink 1s infinite;
    vertical-align: middle;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* Event card pulse animation */
.event-card {
    animation: event-pulse 3s ease-in-out infinite;
}

@keyframes event-pulse {
    0%, 100% { box-shadow: 0 0 0 rgba(88, 101, 242, 0); }
    50% { box-shadow: 0 0 10px rgba(88, 101, 242, 0.3); }
}

/* Enhanced dot navigation */
.carousel-dot {
    width: 30px;
    height: 5px;
    border-radius: 2.5px;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.carousel-dot:hover {
    background-color: rgba(255, 255, 255, 0.5);
    transform: scaleY(1.2);
}

.carousel-dot.active {
    width: 50px;
    background-color: #5865F2;
}

/* Button animations */
.carousel-button {
    transition: all 0.3s ease, transform 0.2s ease;
    position: relative;
    overflow: hidden;
}

.carousel-button:hover:not(:disabled) {
    transform: scale(1.1);
}

.carousel-button:active:not(:disabled) {
    transform: scale(0.95);
}

.carousel-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Button ripple effect */
.ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
}

@keyframes ripple {
    to {
        transform: scale(3);
        opacity: 0;
    }
}

/* Progress bar animation */
.carousel-progress {
    transition: width 5s linear;
}

/* Responsive styles */
@media (max-width: 768px) {
    .feature-carousel {
        height: auto;
        min-height: 650px;
    }
    
    .carousel-slide {
        padding: 0;
    }
    
    .carousel-content {
        height: auto;
        min-height: 650px;
    }
}
</style>

<!-- Simplified carousel JavaScript for more reliable operation -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the carousel with simple, reliable functionality
    initFeatureCarousel();
});

function initFeatureCarousel() {
    const carousel = document.querySelector('.feature-carousel');
    if (!carousel) return;
    
    // Select carousel elements
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    // Initialize state variables
    let currentSlide = 0;
    let isAnimating = false;
    const slideCount = slides.length;
    
    // Set initial state - first slide active
    slides[0].classList.add('active');
    slides[0].setAttribute('aria-hidden', 'false');
    
    // Navigation function - show specific slide
    function goToSlide(index) {
        if (isAnimating) return;
        if (index < 0) index = 0;
        if (index >= slideCount) index = slideCount - 1;
        
        isAnimating = true;
        
        // Update slide positions
        track.style.transform = `translateX(-${index * 100}%)`;
        
        // Update active states
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Update dot indicators
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Update current slide index
        currentSlide = index;
        
        // Re-enable animation after transition completes
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    // Add event listeners to navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            goToSlide(currentSlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            goToSlide(currentSlide + 1);
        });
    }
    
    // Add event listeners to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            goToSlide(index);
        });
    });
    
    // Add keyboard navigation
    carousel.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentSlide - 1);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentSlide + 1);
        }
    });
    
    // Add swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeDistance = touchStartX - touchEndX;
        
        if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance
            if (swipeDistance > 0 && currentSlide < slideCount - 1) {
                // Swipe left - go to next
                goToSlide(currentSlide + 1);
            } else if (swipeDistance < 0 && currentSlide > 0) {
                // Swipe right - go to previous
                goToSlide(currentSlide - 1);
            }
        }
    }
}
</script>
