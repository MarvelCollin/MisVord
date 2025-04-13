<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<div class="flex h-full">
    <!-- Server Sidebar - Contains server icons -->
    <div class="server-sidebar bg-[#202225] py-3 flex flex-col items-center space-y-2">
        <!-- Home/DM Button -->
        <div class="server-icon active-server p-1 mb-2">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#5865F2] hover:bg-[#5865F2]/90 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </div>
            <div class="absolute left-0 w-1 h-10 bg-white rounded-r-full"></div>
        </div>

        <div class="w-8 h-0.5 bg-gray-700 rounded-full mx-auto"></div>

        <!-- Servers -->
        <div class="server-icon p-1">
            <div class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-[#5865F2] hover:rounded-2xl transition-all duration-200">
                <span class="text-green-500 font-bold">BP</span>
            </div>
        </div>
        <div class="server-icon p-1">
            <div class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-[#5865F2] hover:rounded-2xl transition-all duration-200">
                <span class="text-indigo-500 font-bold">JS</span>
            </div>
        </div>
        <div class="server-icon p-1">
            <div class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-[#5865F2] hover:rounded-2xl transition-all duration-200">
                <span class="text-pink-500 font-bold">AI</span>
            </div>
        </div>
        
        <!-- Add Server Button - Now opens modal -->
        <div class="server-icon p-1 mt-2">
            <div id="addServerBtn" class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-green-500 hover:rounded-2xl transition-all duration-200 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </div>
        </div>
    </div>
    
    <!-- Channel Sidebar -->
    <div class="channel-sidebar bg-[#2f3136] w-60 flex flex-col">
        <!-- Server Header -->
        <div class="p-4 shadow-md">
            <h2 class="text-white font-semibold">Binus Server</h2>
        </div>
        
        <!-- Channel List -->
        <div class="flex-1 overflow-y-auto p-2">
            <div class="mb-4">
                <div class="text-xs font-semibold text-gray-400 px-2 flex justify-between items-center mb-1">
                    <span>TEXT CHANNELS</span>
                    <button class="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>
                
                <div class="text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer">
                    <span class="text-gray-400 mr-2">#</span>
                    general
                </div>
                <div class="text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer bg-gray-700">
                    <span class="text-gray-400 mr-2">#</span>
                    binus-pathing
                </div>
                <div class="text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer">
                    <span class="text-gray-400 mr-2">#</span>
                    off-topic
                </div>
            </div>
            
            <div class="mb-4">
                <div class="text-xs font-semibold text-gray-400 px-2 flex justify-between items-center mb-1">
                    <span>VOICE CHANNELS</span>
                    <button class="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>
                
                <div class="text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Lounge
                </div>
                <div class="text-gray-400 hover:text-white hover:bg-gray-700 rounded px-2 py-1 flex items-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Gaming
                </div>
            </div>
        </div>
    </div>
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
            
            <!-- Server Image Upload - Changed from URL to file upload -->
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
    
    // Open modal when add button is clicked
    addServerBtn.addEventListener('click', openModal);
    
    // Close modal when close button is clicked
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // Update image preview when file is selected
    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Server Icon Preview" class="w-full h-full object-cover">`;
            }
            
            reader.readAsDataURL(this.files[0]);
        } else {
            // Reset to default icon if no file selected
            imagePreview.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            `;
        }
    });
    
    // Handle form submission
    createServerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const submitBtn = document.getElementById('createServerBtn');
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
        `;

        // Send the server data via AJAX
        fetch('/api/servers', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add new server to the sidebar
                addNewServerToSidebar(data.server);
                
                // Reset form
                createServerForm.reset();
                imagePreview.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                `;
                
                // Show success notification
                showNotification('Server created successfully!');
                
                // Close modal
                closeModal();
            } else {
                // Show error notification
                showNotification('Error: ' + (data.message || 'Failed to create server'), 'error');
            }
        })
        .catch(error => {
            console.error('Error creating server:', error);
            showNotification('Error creating server. Please try again.', 'error');
        })
        .finally(() => {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Server';
        });
    });
    
    // Add new server to the sidebar
    function addNewServerToSidebar(server) {
        // Create server icon element
        const serverIcon = document.createElement('div');
        serverIcon.className = 'server-icon p-1';
        
        // Generate content based on whether there's an image
        if (server.image_url) {
            serverIcon.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-[#5865F2] hover:rounded-2xl transition-all duration-200 overflow-hidden">
                    <img src="${server.image_url}" alt="${server.name}" class="w-full h-full object-cover">
                </div>
            `;
        } else {
            // Use initials if no image
            const initials = server.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
            serverIcon.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-[#36393F] flex items-center justify-center hover:bg-[#5865F2] hover:rounded-2xl transition-all duration-200">
                    <span class="text-discord-blue font-bold">${initials}</span>
                </div>
            `;
        }
        
        // Add tooltip with server name and description
        serverIcon.title = server.description ? `${server.name}\n${server.description}` : server.name;
        
        // Insert before the "Add Server" button
        const addServerBtn = document.getElementById('addServerBtn');
        addServerBtn.parentNode.parentNode.insertBefore(serverIcon, addServerBtn.parentNode);
        
        // Add hover effect to the new server icon
        addServerHoverEffect(serverIcon);
        
        // Apply animation to the new server icon
        serverIcon.style.opacity = '0';
        serverIcon.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            serverIcon.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            serverIcon.style.opacity = '1';
            serverIcon.style.transform = 'scale(1)';
        }, 10);
    }
    
    // Add hover effect to server icons
    function addServerHoverEffect(serverIcon) {
        serverIcon.addEventListener('mouseenter', function() {
            const pill = document.createElement('div');
            pill.className = 'absolute left-0 w-1 h-5 bg-white rounded-r-full transition-all duration-200';
            pill.style.top = '15px';
            this.appendChild(pill);
        });
        
        serverIcon.addEventListener('mouseleave', function() {
            const pill = this.querySelector(':scope > div.absolute');
            if (pill) pill.remove();
        });
    }
    
    // Show notification function
    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg z-50 transform translate-y-10 opacity-0 transition-all duration-300`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-y-10', 'opacity-0');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
});
</script>
