<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>
<!-- Participants List -->
<div class="w-60 bg-[#2f3136] overflow-y-auto">
    <!-- Search Bar -->
    <div class="p-3">
        <div class="bg-[#202225] rounded flex items-center px-2">
            <input type="text" placeholder="Search" class="bg-transparent border-none w-full py-1 px-1 text-sm text-gray-200 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
    </div>
    
    <div class="p-3 pt-0">
        <!-- Online Users -->
        <div class="mb-2">
            <div class="text-xs font-semibold text-gray-400 mb-1 mt-3 uppercase">Online — 3</div>
            
            <div class="text-gray-300 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div class="flex-grow">JohnDev</div>
            </div>
            <div class="text-gray-300 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div class="flex-grow">SarahCodes</div>
            </div>
            <div class="text-gray-300 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div class="flex-grow"><?php echo $_SESSION['username']; ?></div>
            </div>
        </div>
        
        <!-- Offline Users -->
        <div>
            <div class="text-xs font-semibold text-gray-400 mb-1 mt-3 uppercase">Offline — 2</div>
            
            <div class="text-gray-400 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                <div class="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                <div class="flex-grow">BinusStudent</div>
            </div>
            <div class="text-gray-400 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                <div class="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                <div class="flex-grow">DevMaster</div>
            </div>
        </div>
    </div>
</div>
