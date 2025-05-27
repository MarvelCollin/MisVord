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
                <i class="fa-solid fa-house h-7 w-7 text-white"></i>
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
                <i class="fa-solid fa-plus h-6 w-6 text-green-500 hover:text-white"></i>
            </div>
        </div>
    </div>
    
    <!-- Channel Section - Moved to channel-section.php component -->
    <?php include dirname(__DIR__) . '/app-sections/channel-section.php'; ?>
</div>

<!-- Add Server Modal -->
<div id="addServerModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 hidden transition-all duration-300 ease-in-out backdrop-blur-sm p-4">
    <div class="bg-gradient-to-br from-[#2b2d31] to-[#36393F] rounded-xl p-4 sm:p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 shadow-xl border border-gray-700/30 max-h-[90vh] overflow-y-auto" id="modalContent">
        <!-- Header -->
        <div class="flex flex-col items-center text-center mb-4 relative">
            <button id="closeModalBtn" class="absolute right-0 top-0 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/40 p-2">
                <i class="fa-solid fa-xmark h-5 w-5"></i>
            </button>
            
            <div class="mb-3 bg-discord-blue/10 p-3 sm:p-4 rounded-full">
                <i class="fa-solid fa-server text-discord-blue text-2xl sm:text-3xl"></i>
            </div>
            
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-1">Create Your Server</h3>
            <p class="text-gray-400 text-xs sm:text-sm max-w-xs">Your server is where you and your friends hang out.</p>
        </div>
        
        <!-- Progress steps -->
        <div class="flex justify-center mb-4">
            <div class="flex items-center space-x-1">
                <div class="step-indicator step-active" data-step="1"></div>
                <div class="w-8 h-0.5 bg-gray-600"></div>
                <div class="step-indicator" data-step="2"></div>
            </div>
        </div>
        
        <!-- Server Creation Form -->
        <form id="createServerForm" action="/api/servers" method="POST" class="space-y-4" enctype="multipart/form-data">
            <!-- Step 1: Basic Info -->
            <div id="step1" class="step-content">
                <!-- Server Name -->
                <div class="space-y-2 mb-4">
                    <label for="serverName" class="block text-sm font-medium text-gray-300">SERVER NAME <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <input 
                            type="text" 
                            id="serverName" 
                            name="name" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2 pl-9 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            required
                            placeholder="My Awesome Server"
                        >
                        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <i class="fa-solid fa-hashtag"></i>
                        </div>
                    </div>
                    <div class="text-xs text-gray-400">Give your server a unique name.</div>
                </div>
                
                <!-- Server Type Selection -->
                <div class="space-y-2 mb-6">
                    <label class="block text-sm font-medium text-gray-300">SERVER TYPE</label>
                    
                    <div class="grid grid-cols-2 gap-2">
                        <div class="server-type-option cursor-pointer bg-[#202225] hover:bg-[#2a2c31] border border-[#40444b] rounded-md p-2 transition-colors">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-400 mr-2"></div>
                                <div>
                                    <p class="text-xs sm:text-sm font-medium text-white">Gaming</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="server-type-option cursor-pointer bg-[#202225] hover:bg-[#2a2c31] border border-[#40444b] rounded-md p-2 transition-colors">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-400 mr-2"></div>
                                <div>
                                    <p class="text-xs sm:text-sm font-medium text-white">Study Group</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="server-type-option cursor-pointer bg-[#202225] hover:bg-[#2a2c31] border border-[#40444b] rounded-md p-2 transition-colors">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-400 mr-2"></div>
                                <div>
                                    <p class="text-xs sm:text-sm font-medium text-white">Friends</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="server-type-option cursor-pointer bg-[#202225] hover:bg-[#2a2c31] border border-[#40444b] rounded-md p-2 transition-colors">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-400 mr-2"></div>
                                <div>
                                    <p class="text-xs sm:text-sm font-medium text-white">Other</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end">
                    <button 
                        type="button" 
                        id="nextStepBtn"
                        class="py-2 px-4 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all flex items-center space-x-2"
                    >
                        <span>Next</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
            
            <!-- Step 2: Optional Settings -->
            <div id="step2" class="step-content hidden">
                <!-- Server Image Upload -->
                <div class="flex flex-col items-center mb-4">
                    <div class="group relative mb-2">
                        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#202225] border-2 border-dashed border-gray-600 hover:border-discord-blue flex items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer" id="imagePreview">
                            <i class="fa-solid fa-image h-8 w-8 text-gray-400 group-hover:text-discord-blue transition-colors"></i>
                            <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <i class="fa-solid fa-camera text-white"></i>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            id="serverImage" 
                            name="image_file" 
                            accept="image/*" 
                            class="hidden"
                        >
                    </div>
                    <label for="serverImage" class="text-discord-blue text-sm font-medium cursor-pointer hover:underline">
                        Upload an icon
                    </label>
                </div>
                
                <!-- Server Description -->
                <div class="space-y-2 mb-6">
                    <label for="serverDescription" class="block text-sm font-medium text-gray-300">DESCRIPTION <span class="text-gray-500">(optional)</span></label>
                    <div class="relative">
                        <textarea 
                            id="serverDescription" 
                            name="description" 
                            rows="2" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2 pl-9 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all resize-none"
                            placeholder="Tell us about your server..."
                        ></textarea>
                        <div class="absolute left-3 top-3 text-gray-400">
                            <i class="fa-solid fa-comment"></i>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-between">
                    <button 
                        type="button" 
                        id="prevStepBtn"
                        class="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-all"
                    >
                        <i class="fa-solid fa-arrow-left mr-1"></i>
                        <span>Back</span>
                    </button>
                    
                    <button 
                        type="submit" 
                        class="py-2 px-4 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all flex items-center space-x-2"
                        id="createServerBtn"
                    >
                        <span>Create Server</span>
                        <i class="fa-solid fa-check"></i>
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<style>
.step-indicator {
    @apply w-3 h-3 rounded-full bg-gray-600 transition-all duration-300;
}
.step-indicator.step-active {
    @apply bg-discord-blue;
}
</style>

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
    const serverTypeOptions = document.querySelectorAll('.server-type-option');
    
    // Step navigation
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const prevStepBtn = document.getElementById('prevStepBtn');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    
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
            // Reset to step 1
            showStep(1);
        }, 300);
    }
    
    // Step navigation
    function showStep(stepNumber) {
        if (stepNumber === 1) {
            step1.classList.remove('hidden');
            step2.classList.add('hidden');
        } else if (stepNumber === 2) {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        }
        
        // Update step indicators
        stepIndicators.forEach(indicator => {
            const step = parseInt(indicator.dataset.step);
            if (step <= stepNumber) {
                indicator.classList.add('step-active');
            } else {
                indicator.classList.remove('step-active');
            }
        });
    }
    
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', function() {
            // Validate first step
            const serverNameInput = document.getElementById('serverName');
            if (!serverNameInput.value.trim()) {
                serverNameInput.classList.add('border-red-500');
                serverNameInput.focus();
                setTimeout(() => {
                    serverNameInput.classList.remove('border-red-500');
                }, 3000);
                return;
            }
            
            showStep(2);
        });
    }
    
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', function() {
            showStep(1);
        });
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
    
    // Image preview functionality
    if (imageInput && imagePreview) {
        imagePreview.addEventListener('click', function() {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    imagePreview.innerHTML = '';
                    imagePreview.style.backgroundImage = `url('${e.target.result}')`;
                    imagePreview.style.backgroundSize = 'cover';
                    imagePreview.style.backgroundPosition = 'center';
                    
                    // Add overlay with camera icon
                    const overlay = document.createElement('div');
                    overlay.className = 'absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all';
                    overlay.innerHTML = '<i class="fa-solid fa-camera text-white"></i>';
                    imagePreview.appendChild(overlay);
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Server type selection
    if (serverTypeOptions && serverTypeOptions.length > 0) {
        serverTypeOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected state from all options
                serverTypeOptions.forEach(opt => {
                    const radioIndicator = opt.querySelector('.flex-shrink-0');
                    radioIndicator.className = 'flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-400 mr-2';
                    opt.classList.remove('border-discord-blue');
                });
                
                // Add selected state to clicked option
                const radioIndicator = this.querySelector('.flex-shrink-0');
                radioIndicator.className = 'flex-shrink-0 w-3 h-3 rounded-full border-2 border-discord-blue mr-2 bg-discord-blue';
                this.classList.add('border-discord-blue');
            });
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
