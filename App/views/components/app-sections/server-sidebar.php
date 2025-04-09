<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<div class="flex h-full">
    <!-- Server Sidebar - Contains server icons -->
    <div class="server-sidebar bg-gray-900 w-18 h-full flex flex-col items-center py-3 overflow-y-auto">
        <!-- Home Button -->
        <div class="server-icon home-icon mb-2">
            <div class="bg-gray-700 text-white h-12 w-12 rounded-2xl flex items-center justify-center hover:bg-indigo-500 hover:rounded-xl transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </div>
        </div>
        
        <!-- Server Divider -->
        <div class="w-8 h-0.5 bg-gray-700 rounded my-2"></div>
        
        <!-- Active Server (indicated by pill) -->
        <div class="server-icon active-server my-2 relative">
            <div class="absolute left-0 w-1 h-10 bg-white rounded-r-full"></div>
            <div class="bg-indigo-500 text-white h-12 w-12 rounded-2xl flex items-center justify-center">
                <span class="text-xl font-semibold">GS</span>
            </div>
        </div>
        
        <!-- Other Servers -->
        <div class="server-icon my-2">
            <div class="bg-gray-700 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-purple-600 hover:rounded-xl transition-all duration-200">
                <span class="text-xl font-semibold">MC</span>
            </div>
        </div>
        
        <div class="server-icon my-2">
            <div class="bg-gray-700 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-green-600 hover:rounded-xl transition-all duration-200">
                <span class="text-xl font-semibold">CS</span>
            </div>
        </div>
        
        <div class="server-icon my-2">
            <div class="bg-gray-700 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:rounded-xl transition-all duration-200">
                <span class="text-xl font-semibold">VL</span>
            </div>
        </div>
        
        <!-- Add Server Button -->
        <div class="server-icon mt-2">
            <div class="bg-gray-700 text-green-500 h-12 w-12 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white hover:rounded-xl transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </div>
        </div>
        
        <!-- Explore Public Servers -->
        <div class="server-icon mt-2">
            <div class="bg-gray-700 text-green-500 h-12 w-12 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white hover:rounded-xl transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
    </div>
    
    <!-- Include the Channel Section -->
    <?php include dirname(dirname(dirname(__DIR__))) . '/views/components/app-sections/channel-section.php'; ?>
</div>

<style>
    .server-sidebar {
        min-width: 4.5rem;
    }
    
    .server-icon {
        position: relative;
        display: flex;
        justify-content: center;
        width: 100%;
    }
    
    .server-icon.active-server > div {
        border-radius: 1rem !important;
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Server hover effects
        const serverIcons = document.querySelectorAll('.server-icon:not(.active-server)');
        serverIcons.forEach(server => {
            server.addEventListener('mouseenter', function() {
                const pill = document.createElement('div');
                pill.className = 'absolute left-0 w-1 h-5 bg-white rounded-r-full transition-all duration-200';
                pill.style.top = '15px';
                this.appendChild(pill);
            });
            
            server.addEventListener('mouseleave', function() {
                const pill = this.querySelector(':scope > div.absolute');
                if (pill) pill.remove();
            });
        });
    });
</script> 
