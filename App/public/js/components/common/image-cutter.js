class ImageCutter {
    constructor(options = {}) {
        this.options = {
            container: null,
            imageUrl: null,
            type: 'profile',
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
        try {
            if (!this.options.container) {
                console.error('Container element is required for ImageCutter');
                return;
            }
            
            if (!(this.options.container instanceof Element)) {
                console.error('Container must be a DOM element');
                return;
            }
            
            // Add special class to container for identification
            this.options.container.classList.add('image-cutter-enabled');
            
            // Create modal only when needed to avoid unnecessary DOM creation
            if (this.options.imageUrl) {
                this.createModal();
                this.loadImage(this.options.imageUrl);
            }
            
            // Set up container click event
            this.options.container.addEventListener('click', (e) => {
                try {
                    if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
                        return;
                    }
                    
                    if (this.image && this.image.src) {
                        this.showModal();
                    }
                } catch (error) {
                    console.error('Error in container click handler:', error);
                }
            });
            
            // Add global error handler for the component
            window.addEventListener('error', (event) => {
                if (event.error && 
                    event.error.stack && 
                    event.error.stack.includes('image-cutter.js')) {
                    console.error('ImageCutter error caught:', event.error);
                    this.cleanupFailedModal();
                    event.preventDefault();
                }
            });
        } catch (error) {
            console.error('Error initializing ImageCutter:', error);
        }
    }

    createModal() {
        try {
            let existingModal = document.getElementById('image-cutter-modal');
            if (existingModal) {
                this.modal = existingModal;
                return;
            }

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

            const modalContent = document.createElement('div');
            modalContent.className = 'image-cutter-modal-content';
            modalContent.style.backgroundColor = '#36393f';
            modalContent.style.borderRadius = '8px';
            modalContent.style.padding = '20px';
            modalContent.style.width = '100%';
            modalContent.style.maxWidth = '600px';
            modalContent.style.position = 'relative';
            modalContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';

            const modalHeader = document.createElement('div');
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '16px';

            const modalTitle = document.createElement('h3');
            modalTitle.textContent = this.options.modalTitle || 'Crop Image';
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

            this.canvas = document.createElement('canvas');
            this.canvas.width = 500;
            this.canvas.height = 400;
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.ctx = this.canvas.getContext('2d');
            this.cutterContainer.appendChild(this.canvas);

            this.overlay = document.createElement('div');
            this.overlay.className = 'image-cutter-overlay';
            this.overlay.style.position = 'absolute';
            this.overlay.style.top = '0';
            this.overlay.style.left = '0';
            this.overlay.style.width = '100%';
            this.overlay.style.height = '100%';
            this.overlay.style.cursor = 'move';
            this.cutterContainer.appendChild(this.overlay);

            const infoText = document.createElement('p');
            infoText.textContent = this.options.type === 'profile' 
                ? 'Drag to position and resize the crop area. Profile images use a 1:1 ratio.' 
                : 'Drag to position and resize the crop area. Banners use a 2:1 ratio.';
            infoText.style.color = '#999';
            infoText.style.fontSize = '14px';
            infoText.style.marginBottom = '16px';
            infoText.style.textAlign = 'center';
            modalContent.appendChild(infoText);

            this.createResizeHandles();

            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.gap = '10px';

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

            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        } catch (error) {
            console.error('Error creating modal:', error);
        }
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
        this.overlay.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        Object.values(this.handles).forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResize(e, handle.dataset.position);
            });
        });

        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        if (this.isActive && this.image.src) {
            if (this.cutterContainer && this.cutterContainer.offsetWidth) {
                this.canvas.width = this.cutterContainer.offsetWidth;
                this.canvas.height = this.cutterContainer.offsetHeight;
            }
            this.draw();
        }
    }

    loadImage(url) {
        try {
            if (!url) {
                console.error('No image URL provided');
                return;
            }
            
            // Clean up any previous failed state
            if (!this.modal) {
                this.createModal();
            }
            
            this.image = new Image();
            this.image.crossOrigin = "Anonymous";  // Handle cross-origin images
            
            this.image.onload = () => {
                try {
                    if (this.image.width === 0 || this.image.height === 0) {
                        console.error('Loaded image has invalid dimensions');
                        return;
                    }
                    
                    this.calculateInitialCrop();
                    this.showModal();
                } catch (error) {
                    console.error('Error processing image:', error);
                    this.cleanupFailedModal();
                }
            };
            
            this.image.onerror = (error) => {
                console.error('Error loading image:', error);
                this.cleanupFailedModal();
            };
            
            this.image.src = url;
        } catch (error) {
            console.error('Error loading image:', error);
            this.cleanupFailedModal();
        }
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
        
        try {
            // Make sure the modal exists
            if (!this.modal) {
                this.createModal();
            }
            
            // Double check if modal was created successfully
            if (!this.modal) {
                console.error('Failed to create modal');
                return;
            }
            
            this.isActive = true;
            this.modal.style.display = 'flex';
            
            // If cutterContainer is missing, try to recover by recreating the inner modal content
            if (!this.cutterContainer) {
                console.warn('Cutter container is missing, attempting to recreate modal content');
                this.recreateModalContent();
            }
            
            // If still no cutterContainer after recovery attempt, give up
            if (!this.cutterContainer) {
                console.error('Could not create cutter container');
                this.hideModal();
                return;
            }
            
            // If canvas is missing or invalid, create a new one
            if (!this.canvas || !this.ctx) {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.width = '100%';
                this.canvas.style.height = '100%';
                this.cutterContainer.appendChild(this.canvas);
            }
            
            // Set canvas dimensions
            if (this.cutterContainer && this.cutterContainer.offsetWidth) {
                this.canvas.width = this.cutterContainer.offsetWidth;
                this.canvas.height = this.cutterContainer.offsetHeight || 400;
            } else {
                this.canvas.width = 500;
                this.canvas.height = 400;
            }
            
            this.draw();
            this.attachEventListeners();
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error showing modal:', error);
            this.cleanupFailedModal();
        }
    }

    hideModal() {
        this.isActive = false;
        this.modal.style.display = 'none';
        
        document.body.style.overflow = '';
    }

    applyCrop() {
        if (this.options.onCrop) {
            const result = this.getCroppedImage();
            this.options.onCrop(result);
        }
        
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
            cropWidth = cropHeight = Math.min(imgWidth, imgHeight);
        } else {
            if (imgWidth / imgHeight > 2) {
                cropHeight = imgHeight;
                cropWidth = imgHeight * 2;
            } else {
                cropWidth = imgWidth;
                cropHeight = imgWidth / 2;
            }
        }
        
        this.cropArea = {
            x: (imgWidth - cropWidth) / 2,
            y: (imgHeight - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
        };
    }

    draw() {
        if (!this.isActive || !this.canvas || !this.ctx || !this.image.complete) return;
        
        try {
            const { width: containerWidth, height: containerHeight } = this.canvas;
            const { width: imgWidth, height: imgHeight } = this.image;
            
            if (!containerWidth || !containerHeight || !imgWidth || !imgHeight) return;
            
            this.ctx.clearRect(0, 0, containerWidth, containerHeight);
            
            const scaleX = containerWidth / imgWidth;
            const scaleY = containerHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            const offsetX = (containerWidth - scaledWidth) / 2;
            const offsetY = (containerHeight - scaledHeight) / 2;
            
            this.ctx.drawImage(this.image, 0, 0, imgWidth, imgHeight, offsetX, offsetY, scaledWidth, scaledHeight);
            
            this.updateCropOverlay(offsetX, offsetY, scale);
        } catch (error) {
            console.error('Error drawing image:', error);
        }
    }

    updateCropOverlay(offsetX, offsetY, scale) {
        if (!this.overlay) return;
        
        try {
            const crop = {
                x: this.cropArea.x * scale + offsetX,
                y: this.cropArea.y * scale + offsetY,
                width: Math.max(this.cropArea.width * scale, 10),
                height: Math.max(this.cropArea.height * scale, 10)
            };
    
            this.overlay.style.left = `${crop.x}px`;
            this.overlay.style.top = `${crop.y}px`;
            this.overlay.style.width = `${crop.width}px`;
            this.overlay.style.height = `${crop.height}px`;
            this.overlay.style.border = '2px solid #5865F2';
            this.overlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
            this.overlay.style.boxSizing = 'border-box';
            this.overlay.style.borderRadius = this.options.type === 'profile' ? '50%' : '0';
        } catch (error) {
            console.error('Error updating crop overlay:', error);
        }
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
        
        const { width: containerWidth, height: containerHeight } = this.canvas;
        const { width: imgWidth, height: imgHeight } = this.image;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);
        
        let newX = this.dragStart.cropX + deltaX / scale;
        let newY = this.dragStart.cropY + deltaY / scale;
        
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
        
        const { width: containerWidth, height: containerHeight } = this.canvas;
        const { width: imgWidth, height: imgHeight } = this.image;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledDeltaX = deltaX / scale;
        const scaledDeltaY = deltaY / scale;
        
        const crop = { ...this.cropArea };
        
        switch (this.resizeHandle) {
            case 'nw':
                if (this.options.type === 'profile') {
                    const delta = Math.max(scaledDeltaX, scaledDeltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                } else {
                    crop.x = this.dragStart.x + scaledDeltaX;
                    crop.width = this.dragStart.width - scaledDeltaX;
                    crop.height = crop.width / 2;
                    crop.y = this.dragStart.y + this.dragStart.height - crop.height;
                }
                break;
                
            case 'ne':
                if (this.options.type === 'profile') {
                    const delta = Math.max(-scaledDeltaX, scaledDeltaY);
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                } else {
                    crop.width = this.dragStart.width + scaledDeltaX;
                    crop.height = crop.width / 2;
                    crop.y = this.dragStart.y + this.dragStart.height - crop.height;
                }
                break;
                
            case 'sw':
                if (this.options.type === 'profile') {
                    const delta = Math.max(scaledDeltaX, -scaledDeltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                } else {
                    crop.x = this.dragStart.x + scaledDeltaX;
                    crop.width = this.dragStart.width - scaledDeltaX;
                    crop.height = crop.width / 2;
                }
                break;
                
            case 'se':
                if (this.options.type === 'profile') {
                    const delta = Math.min(scaledDeltaX, scaledDeltaY);
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                } else {
                    crop.width = this.dragStart.width + scaledDeltaX;
                    crop.height = crop.width / 2;
                }
                break;
        }
        
        const minSize = this.options.type === 'profile' ? 50 : 100;
        if (crop.width >= minSize && crop.height >= minSize / 2) {
            if (crop.x < 0) crop.x = 0;
            if (crop.y < 0) crop.y = 0;
            if (crop.x + crop.width > imgWidth) crop.width = imgWidth - crop.x;
            if (crop.y + crop.height > imgHeight) crop.height = imgHeight - crop.y;
            
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

    recreateModalContent() {
        try {
            // Clean up the existing modal content
            if (this.modal) {
                while (this.modal.firstChild) {
                    this.modal.removeChild(this.modal.firstChild);
                }
            } else {
                return;
            }
            
            // Create new modal content container
            const modalContent = document.createElement('div');
            modalContent.className = 'image-cutter-modal-content';
            modalContent.style.backgroundColor = '#36393f';
            modalContent.style.borderRadius = '8px';
            modalContent.style.padding = '20px';
            modalContent.style.width = '100%';
            modalContent.style.maxWidth = '600px';
            modalContent.style.position = 'relative';
            modalContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
            
            // Create header
            const modalHeader = document.createElement('div');
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '16px';
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = this.options.modalTitle || 'Crop Image';
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
            
            // Create cutter container
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
            
            // Create info text
            const infoText = document.createElement('p');
            infoText.textContent = this.options.type === 'profile' 
                ? 'Drag to position and resize the crop area. Profile images use a 1:1 ratio.' 
                : 'Drag to position and resize the crop area. Banners use a 2:1 ratio.';
            infoText.style.color = '#999';
            infoText.style.fontSize = '14px';
            infoText.style.marginBottom = '16px';
            infoText.style.textAlign = 'center';
            modalContent.appendChild(infoText);
            
            // Create buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.gap = '10px';
            
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
            
            // Create canvas and overlay
            this.canvas = document.createElement('canvas');
            this.canvas.width = 500;
            this.canvas.height = 400;
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.ctx = this.canvas.getContext('2d');
            this.cutterContainer.appendChild(this.canvas);
            
            this.overlay = document.createElement('div');
            this.overlay.className = 'image-cutter-overlay';
            this.overlay.style.position = 'absolute';
            this.overlay.style.top = '0';
            this.overlay.style.left = '0';
            this.overlay.style.width = '100%';
            this.overlay.style.height = '100%';
            this.overlay.style.cursor = 'move';
            this.cutterContainer.appendChild(this.overlay);
            
            this.createResizeHandles();
        } catch (error) {
            console.error('Error recreating modal content:', error);
        }
    }
    
    cleanupFailedModal() {
        try {
            // Reset all component properties
            this.isActive = false;
            if (this.modal) {
                this.modal.style.display = 'none';
                
                // Try to remove from DOM if it exists
                if (this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
            }
            
            // Reset references to DOM elements
            this.modal = null;
            this.cutterContainer = null;
            this.canvas = null;
            this.ctx = null;
            this.overlay = null;
            
            document.body.style.overflow = '';
            
            // Try to notify user of error through the onCrop callback
            if (typeof this.options.onCrop === 'function') {
                this.options.onCrop({ 
                    error: true, 
                    message: 'Failed to process image'
                });
            }
        } catch (error) {
            console.error('Error cleaning up failed modal:', error);
        }
    }
}

export default ImageCutter;
