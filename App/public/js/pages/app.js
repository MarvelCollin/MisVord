import { MisVordAjax } from '../core/ajax/ajax-handler.js';
import { showToast } from '../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.info('general', 'App page initialized');
    }

    initServerCreationModal();
    handleUrlParameters();
});

function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const dmParam = urlParams.get('dm');
    
    if (dmParam) {
        console.log('Direct message parameter detected on page load:', dmParam);
        
        const initDirectMessage = () => {
            if (window.unifiedChatManager && window.unifiedChatManager.initialized) {
                console.log('Switching to direct message:', dmParam);
                window.unifiedChatManager.switchToChat(dmParam, 'direct');
            } else {
                setTimeout(initDirectMessage, 200);
            }
        };
        
        setTimeout(initDirectMessage, 1000);
    }
}

function initServerCreationModal() {
    const createServerButtons = document.querySelectorAll('[data-action="create-server"]');
    const createServerModal = document.getElementById('create-server-modal');
    const closeServerModalButton = document.getElementById('close-server-modal');

    if (createServerButtons.length && createServerModal) {

        createServerButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                createServerModal.classList.remove('hidden');
            });
        });

        if (closeServerModalButton) {
            closeServerModalButton.addEventListener('click', function() {
                createServerModal.classList.add('hidden');
            });
        }

        createServerModal.addEventListener('click', function(e) {
            if (e.target === createServerModal) {
                createServerModal.classList.add('hidden');
            }
        });

        initImageUpload();
        initDragAndDrop();

    }
}

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