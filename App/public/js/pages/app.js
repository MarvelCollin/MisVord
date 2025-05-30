/**
 * Main App Page JavaScript
 * Handles UI interactions for the main application page
 */

import { MiscVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('App page initialized');
    
    // Server creation modal functionality
    initServerCreationModal();
    
    // Initialize other features...
});

function initServerCreationModal() {
    const createServerButtons = document.querySelectorAll('[data-action="create-server"]');
    const createServerModal = document.getElementById('create-server-modal');
    const closeServerModalButton = document.getElementById('close-server-modal');
    
    if (createServerButtons.length && createServerModal) {
        // Open modal when clicking create server buttons
        createServerButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                createServerModal.classList.remove('hidden');
            });
        });
        
        // Close modal with close button
        if (closeServerModalButton) {
            closeServerModalButton.addEventListener('click', function() {
                createServerModal.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside
        createServerModal.addEventListener('click', function(e) {
            if (e.target === createServerModal) {
                createServerModal.classList.add('hidden');
            }
        });
        
        // Initialize form functionality
        initImageUpload();
        initFormSubmission();
        initDragAndDrop();
    }
}

// Image upload functionality for server creation
function initImageUpload() {
    const imagePreview = document.getElementById('server-image-preview');
    const imageInput = document.getElementById('server-image');
    const uploadButton = document.getElementById('upload-image-btn');
    
    if (!imagePreview || !imageInput || !uploadButton) return;
    
    uploadButton.addEventListener('click', () => {
        imageInput.click();
    });
    
    imagePreview.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Server Icon" class="w-full h-full object-cover">`;
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// Drag and drop functionality
function initDragAndDrop() {
    const dropArea = document.getElementById('server-image-preview');
    
    if (!dropArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files && files[0]) {
            const imageInput = document.getElementById('server-image');
            imageInput.files = files;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                dropArea.innerHTML = `<img src="${e.target.result}" alt="Server Icon" class="w-full h-full object-cover">`;
            };
            
            reader.readAsDataURL(files[0]);
        }
    }
}

// Form submission for server creation
function initFormSubmission() {
    const serverForm = document.getElementById('server-form');
    
    if (!serverForm) return;
    
    serverForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('create-server-btn');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';
        }
        
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
        
        if (successMessage) {
            successMessage.classList.add('hidden');
        }
        
        // Use MiscVordAjax instead of fetch directly
        MiscVordAjax.submitForm(serverForm, {
            onSuccess: function(response) {
                if (response.success) {
                    console.log('Server creation successful. Server data:', response.server);
                    
                    if (successMessage) {
                        successMessage.textContent = response.message;
                        successMessage.classList.remove('hidden');
                    }
                    
                    // Make sure we have a valid server ID
                    if (response.server && response.server.id) {
                        const serverId = response.server.id;
                        console.log(`Redirecting to server page with ID: ${serverId}`);
                        
                        // Show redirecting message
                        if (successMessage) {
                            successMessage.textContent = 'Server created successfully! Redirecting...';
                        }
                        
                        // Reset hidden state of modal before redirecting
                        if (document.getElementById('create-server-modal')) {
                            document.getElementById('create-server-modal').classList.add('hidden');
                        }
                        
                        // Redirect to the server page
                        window.location.href = `/server/${serverId}`;
                    }
                }
            },
            onError: function(error) {
                console.error('Server creation failed:', error);
                
                if (errorMessage) {
                    errorMessage.textContent = error.data?.message || 'An error occurred while creating the server.';
                    errorMessage.classList.remove('hidden');
                    serverForm.classList.add('error-shake');
                    
                    setTimeout(() => {
                        serverForm.classList.remove('error-shake');
                    }, 500);
                }
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Create Server';
                }
            }
        });
    });
} 