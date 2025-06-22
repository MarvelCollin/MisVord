/**
 * MisVord Image Cutter Component
 * A simple image cropping tool that supports different aspect ratios:
 * - Profile picture: 1:1 (circle)
 * - Banner: 2:1 (rectangle)
 */

class ImageCutter {
    constructor(options = {}) {
        this.options = {
            container: null,
            imageUrl: null,
            type: 'profile', // 'profile' or 'banner'
            onCrop: null,
            width: 300,
            height: 300,
            modalTitle: 'Crop Image',
            ...options
        };

        this.cropArea = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        this.image = new Image();
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizing = false;
        this.resizeHandle = null;
        this.isActive = false;
        this.modal = null;

        this.init();
    }

    init() {
        if (!this.options.container) {
            console.error('Container element is required');
            return;
        }

        // Create modal container for the cutter
        this.createModal();

        // Load image if provided
        if (this.options.imageUrl) {
            this.loadImage(this.options.imageUrl);
        }

        // Add click handler to container to open file selection
        this.options.container.addEventListener('click', (e) => {
            // Don't trigger if it's a file input click
            if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
                return;
            }
            
            // If we have an image already, show the cutter modal
            if (this.image.src) {
                this.showModal();
            }
        });
    }

    createModal() {
        // Check if modal already exists in document
        let existingModal = document.getElementById('image-cutter-modal');
        if (existingModal) {
            this.modal = existingModal;
            return;
        }

        // Create modal container
        this.modal = document.createElement('div');
        this.modal.id = 'image-cutter-modal';
        this.modal.className = 'image-cutter-modal';
        this.modal.style.position = 'fixed';
        this.modal.style.top = '0';
        this.modal.style.left = '0';
        this.modal.style.width = '100%';
        this.modal.style.height = '100%';
        this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.modal.style.display = 'none';
        this.modal.style.alignItems = 'center';
        this.modal.style.justifyContent = 'center';
        this.modal.style.zIndex = '1000';
        this.modal.style.padding = '20px';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'image-cutter-modal-content';
        modalContent.style.backgroundColor = '#36393f';
        modalContent.style.borderRadius = '8px';
        modalContent.style.padding = '20px';
        modalContent.style.width = '100%';
        modalContent.style.maxWidth = '600px';
        modalContent.style.position = 'relative';
        modalContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';

        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.style.display = 'flex';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.alignItems = 'center';
        modalHeader.style.marginBottom = '16px';

        const modalTitle = document.createElement('h3');
        modalTitle.textContent = this.options.modalTitle;
        modalTitle.style.color = '#fff';
        modalTitle.style.margin = '0';
        modalTitle.style.fontSize = '18px';
        modalTitle.style.fontWeight = 'bold';

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = '#999';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0';
        closeButton.style.marginLeft = '10px';
        closeButton.addEventListener('click', () => this.hideModal());

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        modalContent.appendChild(modalHeader);

        // Cutter container
        this.cutterContainer = document.createElement('div');
        this.cutterContainer.className = 'image-cutter-container';
        this.cutterContainer.style.position = 'relative';
        this.cutterContainer.style.width = '100%';
        this.cutterContainer.style.height = '400px';
        this.cutterContainer.style.backgroundColor = '#1e1e1e';
        this.cutterContainer.style.marginBottom = '16px';
        this.cutterContainer.style.overflow = 'hidden';
        this.cutterContainer.style.borderRadius = '4px';
        modalContent.appendChild(this.cutterContainer);

        // Canvas for image
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cutterContainer.offsetWidth || 500;
        this.canvas.height = this.cutterContainer.offsetHeight || 400;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.ctx = this.canvas.getContext('2d');
        this.cutterContainer.appendChild(this.canvas);

        // Create crop overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'image-cutter-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.cursor = 'move';
        this.cutterContainer.appendChild(this.overlay);

        // Info text
        const infoText = document.createElement('p');
        infoText.textContent = this.options.type === 'profile' 
            ? 'Drag to position and resize the crop area. Profile images use a 1:1 ratio.' 
            : 'Drag to position and resize the crop area. Banners use a 2:1 ratio.';
        infoText.style.color = '#999';
        infoText.style.fontSize = '14px';
        infoText.style.marginBottom = '16px';
        infoText.style.textAlign = 'center';
        modalContent.appendChild(infoText);

        // Add resize handles
        this.createResizeHandles();

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';

        // Cancel button
        this.cancelButton = document.createElement('button');
        this.cancelButton.textContent = 'Cancel';
        this.cancelButton.style.backgroundColor = '#36393f';
        this.cancelButton.style.color = 'white';
        this.cancelButton.style.border = '1px solid #4f545c';
        this.cancelButton.style.borderRadius = '4px';
        this.cancelButton.style.padding = '8px 16px';
        this.cancelButton.style.cursor = 'pointer';
        this.cancelButton.style.fontSize = '14px';
        this.cancelButton.addEventListener('click', () => this.hideModal());
        buttonContainer.appendChild(this.cancelButton);

        // Apply crop button
        this.applyButton = document.createElement('button');
        this.applyButton.textContent = 'Apply';
        this.applyButton.style.backgroundColor = '#5865F2';
        this.applyButton.style.color = 'white';
        this.applyButton.style.border = 'none';
        this.applyButton.style.borderRadius = '4px';
        this.applyButton.style.padding = '8px 16px';
        this.applyButton.style.cursor = 'pointer';
        this.applyButton.style.fontSize = '14px';
        this.applyButton.addEventListener('click', () => this.applyCrop());
        buttonContainer.appendChild(this.applyButton);

        modalContent.appendChild(buttonContainer);

        this.modal.appendChild(modalContent);
        document.body.appendChild(this.modal);

        // Close when clicking outside the modal content
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    createResizeHandles() {
        const positions = ['nw', 'ne', 'se', 'sw'];
        const handles = {};
        
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${pos}`;
            handle.style.position = 'absolute';
            handle.style.width = '14px';
            handle.style.height = '14px';
            handle.style.backgroundColor = '#ffffff';
            handle.style.border = '2px solid #5865F2';
            handle.style.borderRadius = '50%';
            handle.style.zIndex = '10';
            handle.dataset.position = pos;
            
            // Position handles
            switch(pos) {
                case 'nw': 
                    handle.style.top = '-7px'; 
                    handle.style.left = '-7px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'ne': 
                    handle.style.top = '-7px'; 
                    handle.style.right = '-7px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'se': 
                    handle.style.bottom = '-7px'; 
                    handle.style.right = '-7px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'sw': 
                    handle.style.bottom = '-7px'; 
                    handle.style.left = '-7px';
                    handle.style.cursor = 'nesw-resize';
                    break;
            }
            
            this.overlay.appendChild(handle);
            handles[pos] = handle;
        });
        
        this.handles = handles;
    }

    attachEventListeners() {
        // Drag events for the crop area
        this.overlay.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        // Resize events for handles
        Object.values(this.handles).forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResize(e, handle.dataset.position);
            });
        });

        // Window resize handler to redraw canvas if modal size changes
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        if (this.isActive && this.image.src) {
            // Update canvas size if container size changed
            this.canvas.width = this.cutterContainer.offsetWidth;
            this.canvas.height = this.cutterContainer.offsetHeight;
            this.draw();
        }
    }

    loadImage(url) {
        this.image = new Image();
        this.image.onload = () => {
            this.calculateInitialCrop();
            this.draw();
            // Automatically show modal when image is loaded
            this.showModal();
        };
        this.image.src = url;
    }

    loadImageFromFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => this.loadImage(e.target.result);
        reader.readAsDataURL(file);
    }

    showModal() {
        if (!this.image.src) return;
        
        this.isActive = true;
        this.modal.style.display = 'flex';
        // Make sure canvas size matches container
        this.canvas.width = this.cutterContainer.offsetWidth;
        this.canvas.height = this.cutterContainer.offsetHeight;
        this.draw();
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Block body scrolling
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.isActive = false;
        this.modal.style.display = 'none';
        
        // Restore body scrolling
        document.body.style.overflow = '';
    }

    applyCrop() {
        if (this.options.onCrop) {
            const result = this.getCroppedImage();
            this.options.onCrop(result);
        }
        
        // Create a custom event for the crop completion
        const event = new CustomEvent('imageCropComplete', {
            detail: { dataUrl: this.getCroppedImage().dataUrl }
        });
        this.options.container.dispatchEvent(event);
        
        this.hideModal();
    }

    calculateInitialCrop() {
        const { width: imgWidth, height: imgHeight } = this.image;
        
        let cropWidth, cropHeight;
        
        if (this.options.type === 'profile') {
            // For profile, ensure 1:1 aspect ratio
            cropWidth = cropHeight = Math.min(imgWidth, imgHeight);
        } else {
            // For banner, ensure 2:1 aspect ratio
            if (imgWidth / imgHeight > 2) {
                // Image is wider than 2:1
                cropHeight = imgHeight;
                cropWidth = imgHeight * 2;
            } else {
                // Image is taller than 2:1
                cropWidth = imgWidth;
                cropHeight = imgWidth / 2;
            }
        }
        
        // Center the crop area
        this.cropArea = {
            x: (imgWidth - cropWidth) / 2,
            y: (imgHeight - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
        };
    }

    draw() {
        if (!this.isActive) return;
        
        const { width: containerWidth, height: containerHeight } = this.canvas;
        const { width: imgWidth, height: imgHeight } = this.image;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, containerWidth, containerHeight);
        
        // Calculate scaling factors to fit the image in the container
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        // Center the image
        const offsetX = (containerWidth - scaledWidth) / 2;
        const offsetY = (containerHeight - scaledHeight) / 2;
        
        // Draw image
        this.ctx.drawImage(this.image, 0, 0, imgWidth, imgHeight, offsetX, offsetY, scaledWidth, scaledHeight);
        
        // Apply cropping overlay
        this.updateCropOverlay(offsetX, offsetY, scale);
    }

    updateCropOverlay(offsetX, offsetY, scale) {
        // Convert crop area to container coordinates
        const crop = {
            x: this.cropArea.x * scale + offsetX,
            y: this.cropArea.y * scale + offsetY,
            width: this.cropArea.width * scale,
            height: this.cropArea.height * scale
        };

        // Update overlay position and size
        this.overlay.style.left = `${crop.x}px`;
        this.overlay.style.top = `${crop.y}px`;
        this.overlay.style.width = `${crop.width}px`;
        this.overlay.style.height = `${crop.height}px`;
        this.overlay.style.border = '2px solid #5865F2';
        this.overlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
        this.overlay.style.boxSizing = 'border-box';
        this.overlay.style.borderRadius = this.options.type === 'profile' ? '50%' : '0';
    }

    startDrag(e) {
        if (this.resizing) return;
        
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX,
            y: e.clientY,
            cropX: this.cropArea.x,
            cropY: this.cropArea.y
        };
        
        e.preventDefault();
    }

    onDrag(e) {
        if (this.resizing) {
            this.onResize(e);
            return;
        }

        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        // Calculate scale to convert screen pixels to image pixels
        const { width: containerWidth, height: containerHeight } = this.canvas;
        const { width: imgWidth, height: imgHeight } = this.image;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Update crop area with constraints
        let newX = this.dragStart.cropX + deltaX / scale;
        let newY = this.dragStart.cropY + deltaY / scale;
        
        // Keep within image boundaries
        newX = Math.max(0, Math.min(imgWidth - this.cropArea.width, newX));
        newY = Math.max(0, Math.min(imgHeight - this.cropArea.height, newY));
        
        this.cropArea.x = newX;
        this.cropArea.y = newY;
        
        this.draw();
        e.preventDefault();
    }

    endDrag() {
        this.isDragging = false;
        this.resizing = false;
    }

    startResize(e, position) {
        this.resizing = true;
        this.resizeHandle = position;
        this.dragStart = {
            x: e.clientX,
            y: e.clientY,
            ...this.cropArea
        };
        
        e.stopPropagation();
        e.preventDefault();
    }

    onResize(e) {
        if (!this.resizing) return;

        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        // Calculate scale to convert screen pixels to image pixels
        const { width: containerWidth, height: containerHeight } = this.canvas;
        const { width: imgWidth, height: imgHeight } = this.image;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Scaled deltas
        const scaledDeltaX = deltaX / scale;
        const scaledDeltaY = deltaY / scale;
        
        // Make a copy of the crop area for calculations
        const crop = { ...this.cropArea };
        
        // Handle different resize corners and maintain aspect ratio
        switch (this.resizeHandle) {
            case 'nw':
                if (this.options.type === 'profile') {
                    // For profile, maintain 1:1 ratio
                    const delta = Math.max(scaledDeltaX, scaledDeltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                } else {
                    // For banner, maintain 2:1 ratio
                    crop.x = this.dragStart.x + scaledDeltaX;
                    crop.width = this.dragStart.width - scaledDeltaX;
                    crop.height = crop.width / 2;
                    crop.y = this.dragStart.y + this.dragStart.height - crop.height;
                }
                break;
                
            case 'ne':
                if (this.options.type === 'profile') {
                    // For profile, maintain 1:1 ratio
                    const delta = Math.max(-scaledDeltaX, scaledDeltaY);
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                } else {
                    // For banner, maintain 2:1 ratio
                    crop.width = this.dragStart.width + scaledDeltaX;
                    crop.height = crop.width / 2;
                    crop.y = this.dragStart.y + this.dragStart.height - crop.height;
                }
                break;
                
            case 'sw':
                if (this.options.type === 'profile') {
                    // For profile, maintain 1:1 ratio
                    const delta = Math.max(scaledDeltaX, -scaledDeltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                } else {
                    // For banner, maintain 2:1 ratio
                    crop.x = this.dragStart.x + scaledDeltaX;
                    crop.width = this.dragStart.width - scaledDeltaX;
                    crop.height = crop.width / 2;
                }
                break;
                
            case 'se':
                if (this.options.type === 'profile') {
                    // For profile, maintain 1:1 ratio
                    const delta = Math.min(scaledDeltaX, scaledDeltaY);
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                } else {
                    // For banner, maintain 2:1 ratio
                    crop.width = this.dragStart.width + scaledDeltaX;
                    crop.height = crop.width / 2;
                }
                break;
        }
        
        // Validate minimum size
        const minSize = this.options.type === 'profile' ? 50 : 100;
        if (crop.width >= minSize && crop.height >= minSize / 2) {
            // Ensure crop stays within image bounds
            if (crop.x < 0) crop.x = 0;
            if (crop.y < 0) crop.y = 0;
            if (crop.x + crop.width > imgWidth) crop.width = imgWidth - crop.x;
            if (crop.y + crop.height > imgHeight) crop.height = imgHeight - crop.y;
            
            // Update crop area if valid
            this.cropArea = crop;
            this.draw();
        }
        
        e.preventDefault();
    }

    getCroppedImage() {
        const canvas = document.createElement('canvas');
        const { width, height, x, y } = this.cropArea;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.image, x, y, width, height, 0, 0, width, height);
        
        return {
            dataUrl: canvas.toDataURL('image/png'),
            width: width,
            height: height
        };
    }

    getBlob(callback) {
        const canvas = document.createElement('canvas');
        const { width, height, x, y } = this.cropArea;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.image, x, y, width, height, 0, 0, width, height);
        
        canvas.toBlob(callback, 'image/png');
    }

    setType(type) {
        if (type !== 'profile' && type !== 'banner') {
            console.error('Invalid type. Must be "profile" or "banner"');
            return;
        }
        
        this.options.type = type;
        if (this.overlay) {
            this.overlay.style.borderRadius = type === 'profile' ? '50%' : '0';
        }
        
        if (this.image.src) {
            this.calculateInitialCrop();
            this.draw();
        }
    }
}

export default ImageCutter;
