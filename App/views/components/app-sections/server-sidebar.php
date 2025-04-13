<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Get user servers
$currentUser = User::find($_SESSION['user_id'] ?? 0);
$servers = $currentUser ? $currentUser->servers() : [];

// Get current server ID from URL
$currentServerID = null;

// Check if the URL has a server ID parameter
if (isset($_GET['server'])) {
    $currentServerID = $_GET['server'];
} else {
    // Try to extract from URL path like /server/123
    $uri = $_SERVER['REQUEST_URI'];
    if (preg_match('/\/server\/(\d+)/', $uri, $matches)) {
        $currentServerID = $matches[1];
    }
}

// Get current server from GLOBALS
$currentServer = $GLOBALS['currentServer'] ?? null;

// Debugging
error_log("Current server ID: " . ($currentServerID ?? 'null'));
error_log("Current server object: " . ($currentServer ? json_encode(['id' => $currentServer->id, 'name' => $currentServer->name]) : 'null'));
?>

<div class="flex h-full">
    <!-- Server Sidebar - Contains server icons -->
    <div class="server-sidebar bg-[#202225] py-3 flex flex-col items-center space-y-2">
        <!-- Home/DM Button -->
        <div class="server-icon p-1 mb-2">
            <a href="/app" class="block w-12 h-12 rounded-2xl flex items-center justify-center bg-[#5865F2] hover:bg-[#5865F2]/90 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </a>
            <!-- Active indicator for home (only shown when no server is selected) -->
            <?php if (empty($currentServerID)): ?>
                <div class="absolute left-0 w-1 h-10 bg-white rounded-r-full"></div>
            <?php endif; ?>
        </div>

        <div class="w-8 h-0.5 bg-gray-700 rounded-full mx-auto"></div>

        <!-- Servers - Dynamically loaded from database -->
        <?php foreach ($servers as $server): ?>
            <div class="server-icon p-1 relative" title="<?php echo htmlspecialchars($server['name'] ?? 'Server'); ?>">
                <a href="/server/<?php echo $server['id']; ?>" class="block w-12 h-12 rounded-full hover:rounded-2xl flex items-center justify-center transition-all duration-200 group
                    <?php echo ($currentServerID == $server['id']) ? 'bg-discord-blue text-white' : 'bg-[#36393F] hover:bg-discord-blue text-gray-300 hover:text-white'; ?>">
                    <?php if (!empty($server['icon_url'])): ?>
                        <img src="<?php echo $server['icon_url']; ?>" alt="<?php echo htmlspecialchars($server['name'] ?? 'Server'); ?>" 
                             class="w-full h-full object-cover rounded-full group-hover:rounded-2xl transition-all duration-200">
                    <?php else: ?>
                        <span class="font-medium text-lg"><?php echo substr($server['name'] ?? 'S', 0, 1); ?></span>
                    <?php endif; ?>
                </a>
                
                <!-- Active server indicator - Only shown for current server -->
                <?php if ($currentServerID == $server['id']): ?>
                    <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-white rounded-r-full"></div>
                <?php endif; ?>
                
                <!-- Server tooltip -->
                <div class="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded scale-0 group-hover:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                    <?php echo htmlspecialchars($server['name'] ?? 'Server'); ?>
                    <span class="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-transparent border-r-black"></span>
                </div>
            </div>
        <?php endforeach; ?>
        
        <!-- Add Server Button - Opens modal -->
        <div class="server-icon p-1 mt-2">
            <div id="addServerBtn" class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-green-500 hover:rounded-2xl transition-all duration-200 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </div>
        </div>
    </div>
    
    <!-- Channel Section - Moved to channel-section.php component -->
    <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
</div>

<!-- Add Server Modal -->
<div id="addServerModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 hidden transition-all duration-300 ease-in-out">
    <div class="bg-[#36393F] rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0" id="modalContent">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Create a New Server</h3>
            <button id="closeModalBtn" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form id="createServerForm" action="/api/servers" method="POST" class="space-y-4" enctype="multipart/form-data">
            <!-- Server Name -->
            <div>
                <label for="serverName" class="block text-sm font-medium text-gray-300 mb-1">SERVER NAME <span class="text-red-500">*</span></label>
                <input 
                    type="text" 
                    id="serverName" 
                    name="name" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    required
                >
                <div class="text-xs text-gray-400 mt-1">Give your server a unique name to help members recognize it.</div>
            </div>
            
            <!-- Server Image Upload -->
            <div>
                <label for="serverImage" class="block text-sm font-medium text-gray-300 mb-1">SERVER IMAGE (OPTIONAL)</label>
                <div class="flex items-center space-x-4">
                    <div class="bg-[#202225] border border-[#40444b] rounded-full w-16 h-16 flex items-center justify-center overflow-hidden" id="imagePreview">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <input 
                            type="file" 
                            id="serverImage" 
                            name="image_file" 
                            accept="image/*" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all"
                        >
                        <p class="text-xs text-gray-400 mt-1">Upload an image for your server (optional).</p>
                    </div>
                </div>
            </div>
            
            <!-- Server Description -->
            <div>
                <label for="serverDescription" class="block text-sm font-medium text-gray-300 mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea 
                    id="serverDescription" 
                    name="description" 
                    rows="3" 
                    class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about your server"
                ></textarea>
            </div>
            
            <div class="pt-4">
                <button 
                    type="submit" 
                    class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all"
                    id="createServerBtn"
                >
                    Create Server
                </button>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const modal = document.getElementById('addServerModal');
    const modalContent = document.getElementById('modalContent');
    const addServerBtn = document.getElementById('addServerBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const createServerForm = document.getElementById('createServerForm');
    const imageInput = document.getElementById('serverImage');
    const imagePreview = document.getElementById('imagePreview');
    
    // Open modal function
    function openModal() {
        modal.classList.remove('hidden');
        // Use setTimeout to ensure transition works
        setTimeout(() => {
            modal.classList.add('opacity-100');
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    // Close modal function
    function closeModal() {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        modal.classList.remove('opacity-100');
        
        // Hide after animation completes
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    
    // Only set up event listeners if elements exist
    if (addServerBtn) {
        // Open modal when add button is clicked
        addServerBtn.addEventListener('click', openModal);
    }
    
    if (closeModalBtn) {
        // Close modal when close button is clicked
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    
    // Add hover effect to server icons
    document.querySelectorAll('.server-icon').forEach(icon => {
        // Skip if this is the currently selected server (it already has the indicator)
        if (icon.querySelector('.absolute')) return;
        
        icon.addEventListener('mouseenter', function() {
            // Create temporary hover indicator
            const indicator = document.createElement('div');
            indicator.className = 'absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-white rounded-r-full transition-all duration-300 hover-indicator';
            this.appendChild(indicator);
        });
        
        icon.addEventListener('mouseleave', function() {
            // Remove any temporary hover indicators
            const indicator = this.querySelector('.hover-indicator');
            if (indicator) indicator.remove();
        });
    });
});
</script>
