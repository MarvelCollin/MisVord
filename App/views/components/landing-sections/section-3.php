<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section class="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#2f3136] to-[#36393f]">
    <div class="container mx-auto relative z-10">
        <div class="text-center mb-16">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 text-white section-title animated-fade-in">
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Ready to get started?
                </span>
            </h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto animated-fade-in mb-8">
                Join millions of people using misvord to connect with their communities and friends.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="/register" class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Started Free
                </a>
                <a href="/login" class="inline-flex items-center px-8 py-4 border-2 border-white/20 text-white font-medium rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-200">
                    Already have an account?
                </a>
            </div>
        </div>
    </div>
</section>
