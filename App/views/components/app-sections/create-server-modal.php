<?php
?>
<div id="create-server-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between mb-6">
                    <h2 class="text-2xl font-bold">Create a Server</h2>
                    <button id="close-server-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="text-center mb-6">
                    <p class="text-gray-400">Your server is where you and your friends hang out. Make yours and start talking.</p>
                </div>
                
                <form id="server-form" action="/api/servers/create" method="POST" class="space-y-4" enctype="multipart/form-data">
                    <div class="flex flex-col items-center mb-6">
                        <div id="server-image-preview" class="w-24 h-24 rounded-full bg-discord-dark flex items-center justify-center cursor-pointer overflow-hidden mb-2">
                            <i class="fas fa-camera text-discord-lighter text-xl"></i>
                        </div>
                        <input type="file" id="server-image" name="image_file" class="hidden" accept="image/*">
                        <button type="button" id="upload-image-btn" class="text-sm text-discord-primary hover:underline">Upload Image</button>
                    </div>
                    
                    <div>
                        <label for="server-name" class="block text-sm font-medium text-gray-300 mb-1">SERVER NAME <span class="text-discord-red">*</span></label>
                        <input type="text" id="server-name" name="name" class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary" 
                               placeholder="Enter server name" required>
                    </div>
                    
                    <div>
                        <label for="server-description" class="block text-sm font-medium text-gray-300 mb-1">SERVER DESCRIPTION</label>
                        <textarea id="server-description" name="description" rows="3" class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary resize-none"
                                  placeholder="What's this server about? (optional)"></textarea>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="server-public" name="is_public" value="1" class="h-4 w-4 accent-discord-primary bg-discord-dark border-gray-700" checked>
                        <label for="server-public" class="ml-2 text-sm text-gray-300">Make this server public</label>
                        <span class="ml-2 text-gray-500 text-xs cursor-help" title="Public servers can be found by anyone in the server browser">
                            <i class="fas fa-question-circle"></i>
                        </span>
                    </div>
                    
                    <div class="pt-4">
                        <button type="submit" id="create-server-btn" class="w-full bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Create Server
                        </button>
                    </div>
                    
                    <div id="error-message" class="text-discord-red text-sm text-center mt-2 hidden"></div>
                    <div id="success-message" class="text-discord-green text-sm text-center mt-2 hidden"></div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('upload-image-btn');
    const imageInput = document.getElementById('server-image');
    const imagePreview = document.getElementById('server-image-preview');
    const serverForm = document.getElementById('server-form');
    
    // Handle image upload
    if (uploadBtn && imageInput) {
        uploadBtn.addEventListener('click', function() {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Server Image" class="w-full h-full object-cover">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
      // Handle form submission
    if (serverForm) {
        serverForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent other handlers
            
            const formData = new FormData(this);
            const errorDiv = document.getElementById('error-message');
            const successDiv = document.getElementById('success-message');
            const submitBtn = document.getElementById('create-server-btn');
            
            // Prevent double submission
            if (submitBtn.disabled) {
                return;
            }
            
            // Reset messages
            errorDiv.classList.add('hidden');
            successDiv.classList.add('hidden');
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            
            fetch('/api/servers/create', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response content type:', response.headers.get('content-type'));
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    return response.text().then(text => {
                        console.error('Expected JSON but got:', text);
                        throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`);
                    });
                }
                
                return response.json();
            })
            .then(data => {
                console.log('Server creation response:', data);
                
                if (data.success) {
                    successDiv.textContent = data.message || 'Server created successfully!';
                    successDiv.classList.remove('hidden');
                    
                    // Reset form
                    serverForm.reset();
                    imagePreview.innerHTML = '<i class="fas fa-camera text-discord-lighter text-xl"></i>';
                    
                    // Close modal and redirect
                    setTimeout(() => {
                        document.getElementById('create-server-modal').classList.add('hidden');
                        const serverId = data.data?.server_id || data.server_id;
                        if (serverId) {
                            window.location.href = `/server/${serverId}`;
                        } else {
                            window.location.href = '/app';
                        }
                    }, 1500);
                } else {
                    errorDiv.textContent = data.message || 'Failed to create server';
                    errorDiv.classList.remove('hidden');
                }
            })
            .catch(error => {
                console.error('Server creation error:', error);
                errorDiv.textContent = error.message || 'An error occurred while creating the server';
                errorDiv.classList.remove('hidden');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Server';
            });
        });
    }
});
</script>