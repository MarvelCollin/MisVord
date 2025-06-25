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
        this.scale = 1;
        this.imageOffset = { x: 0, y: 0 };

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
            
            this.options.container.classList.add('image-cutter-enabled');
            
            if (this.options.imageUrl) {
                this.createModal();
                this.loadImage(this.options.imageUrl);
            }
            
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
            this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            this.modal.style.display = 'none';
            this.modal.style.alignItems = 'center';
            this.modal.style.justifyContent = 'center';
            this.modal.style.zIndex = '1000';
            this.modal.style.padding = '20px';
            this.modal.style.backdropFilter = 'blur(5px)';
            this.modal.style.transition = 'opacity 0.3s ease';

            const modalContent = document.createElement('div');
            modalContent.className = 'image-cutter-modal-content';
            modalContent.style.backgroundColor = '#36393f';
            modalContent.style.borderRadius = '12px';
            modalContent.style.padding = '24px';
            modalContent.style.width = '100%';
            modalContent.style.maxWidth = '650px';
            modalContent.style.position = 'relative';
            modalContent.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
            modalContent.style.transform = 'scale(0.95)';
            modalContent.style.opacity = '0';
            modalContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

            const modalHeader = document.createElement('div');
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '20px';

            const modalTitle = document.createElement('h3');
            modalTitle.textContent = this.options.modalTitle || 'Crop Image';
            modalTitle.style.color = '#fff';
            modalTitle.style.margin = '0';
            modalTitle.style.fontSize = '20px';
            modalTitle.style.fontWeight = 'bold';

            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.color = '#999';
            closeButton.style.fontSize = '28px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.padding = '0';
            closeButton.style.marginLeft = '10px';
            closeButton.style.transition = 'color 0.2s ease';
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.color = '#fff';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.color = '#999';
            });
            closeButton.addEventListener('click', () => this.hideModal());

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            modalContent.appendChild(modalHeader);

            this.cutterContainer = document.createElement('div');
            this.cutterContainer.className = 'image-cutter-container';
            this.cutterContainer.style.position = 'relative';
            this.cutterContainer.style.width = '100%';
            this.cutterContainer.style.height = '450px';
            this.cutterContainer.style.backgroundColor = '#1e1e1e';
            this.cutterContainer.style.marginBottom = '20px';
            this.cutterContainer.style.overflow = 'hidden';
            this.cutterContainer.style.borderRadius = '8px';
            this.cutterContainer.style.boxShadow = 'inset 0 0 20px rgba(0, 0, 0, 0.4)';
            modalContent.appendChild(this.cutterContainer);

            this.imageElement = document.createElement('img');
            this.imageElement.style.position = 'absolute';
            this.imageElement.style.top = '0';
            this.imageElement.style.left = '0';
            this.imageElement.style.maxWidth = 'none';
            this.imageElement.style.maxHeight = 'none';
            this.imageElement.style.userSelect = 'none';
            this.imageElement.style.pointerEvents = 'none';
            this.cutterContainer.appendChild(this.imageElement);

            this.overlay = document.createElement('div');
            this.overlay.className = 'image-cutter-overlay';
            this.overlay.style.position = 'absolute';
            this.overlay.style.top = '0';
            this.overlay.style.left = '0';
            this.overlay.style.width = '100px';
            this.overlay.style.height = '100px';
            this.overlay.style.cursor = 'move';
            this.overlay.style.border = '2px solid #5865F2';
            this.overlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
            this.overlay.style.boxSizing = 'border-box';
            this.cutterContainer.appendChild(this.overlay);

            const infoSection = document.createElement('div');
            infoSection.style.display = 'flex';
            infoSection.style.alignItems = 'center';
            infoSection.style.justifyContent = 'center';
            infoSection.style.marginBottom = '20px';
            
            const infoIcon = document.createElement('div');
            infoIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            infoIcon.style.marginRight = '8px';
            infoIcon.style.color = '#5865F2';
            infoSection.appendChild(infoIcon);

            const infoText = document.createElement('p');
            infoText.textContent = this.options.type === 'profile' 
                ? 'Drag the corners to adjust the crop area. Profile images use a 1:1 ratio.' 
                : 'Drag the corners to adjust the crop area. Banners use a 2:1 ratio.';
            infoText.style.color = '#999';
            infoText.style.fontSize = '14px';
            infoText.style.margin = '0';
            infoText.style.textAlign = 'center';
            infoSection.appendChild(infoText);
            
            modalContent.appendChild(infoSection);

            this.createResizeHandles();

            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.gap = '12px';

            this.cancelButton = document.createElement('button');
            this.cancelButton.textContent = 'Cancel';
            this.cancelButton.style.backgroundColor = 'transparent';
            this.cancelButton.style.color = 'white';
            this.cancelButton.style.border = '1px solid #4f545c';
            this.cancelButton.style.borderRadius = '4px';
            this.cancelButton.style.padding = '10px 18px';
            this.cancelButton.style.cursor = 'pointer';
            this.cancelButton.style.fontSize = '14px';
            this.cancelButton.style.fontWeight = '500';
            this.cancelButton.style.transition = 'background-color 0.2s ease';
            this.cancelButton.addEventListener('mouseenter', () => {
                this.cancelButton.style.backgroundColor = '#4f545c';
            });
            this.cancelButton.addEventListener('mouseleave', () => {
                this.cancelButton.style.backgroundColor = 'transparent';
            });
            this.cancelButton.addEventListener('click', () => this.hideModal());
            buttonContainer.appendChild(this.cancelButton);

            this.applyButton = document.createElement('button');
            this.applyButton.textContent = 'Apply';
            this.applyButton.style.backgroundColor = '#5865F2';
            this.applyButton.style.color = 'white';
            this.applyButton.style.border = 'none';
            this.applyButton.style.borderRadius = '4px';
            this.applyButton.style.padding = '10px 18px';
            this.applyButton.style.cursor = 'pointer';
            this.applyButton.style.fontSize = '14px';
            this.applyButton.style.fontWeight = '500';
            this.applyButton.style.transition = 'background-color 0.2s ease';
            this.applyButton.addEventListener('mouseenter', () => {
                this.applyButton.style.backgroundColor = '#4752c4';
            });
            this.applyButton.addEventListener('mouseleave', () => {
                this.applyButton.style.backgroundColor = '#5865F2';
            });
            this.applyButton.addEventListener('click', () => this.applyCrop());
            buttonContainer.appendChild(this.applyButton);

            modalContent.appendChild(buttonContainer);

            this.modal.appendChild(modalContent);
            document.body.appendChild(this.modal);

            setTimeout(() => {
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }, 50);

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
            handle.style.width = '20px';
            handle.style.height = '20px';
            handle.style.backgroundColor = '#ffffff';
            handle.style.border = '2px solid #5865F2';
            handle.style.borderRadius = '50%';
            handle.style.zIndex = '10';
            handle.style.opacity = '0.8';
            handle.style.transition = 'transform 0.1s ease-in-out';
            handle.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.3)';
            handle.dataset.position = pos;
            
            handle.addEventListener('mouseenter', () => {
                handle.style.transform = 'scale(1.2)';
                handle.style.opacity = '1';
            });
            
            handle.addEventListener('mouseleave', () => {
                handle.style.transform = 'scale(1)';
                handle.style.opacity = '0.8';
            });
            
            switch(pos) {
                case 'nw': 
                    handle.style.top = '-10px'; 
                    handle.style.left = '-10px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'ne': 
                    handle.style.top = '-10px'; 
                    handle.style.right = '-10px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'se': 
                    handle.style.bottom = '-10px'; 
                    handle.style.right = '-10px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'sw': 
                    handle.style.bottom = '-10px'; 
                    handle.style.left = '-10px';
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
            this.updateImageDisplay();
        }
    }

    loadImage(url) {
        try {
            if (!url) {
                console.error('No image URL provided');
                return;
            }
            
            if (!this.modal) {
                this.createModal();
            }
            
            this.image = new Image();
            this.image.crossOrigin = "Anonymous";
            
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
            if (!this.modal) {
                this.createModal();
            }
            
            if (!this.modal) {
                console.error('Failed to create modal');
                return;
            }
            
            this.isActive = true;
            this.modal.style.display = 'flex';
            
            const modalContent = this.modal.querySelector('.image-cutter-modal-content');
            if (modalContent) {
                setTimeout(() => {
                    modalContent.style.transform = 'scale(1)';
                    modalContent.style.opacity = '1';
                }, 50);
            }
            
            if (!this.cutterContainer) {
                console.warn('Cutter container is missing, attempting to recreate modal content');
                this.recreateModalContent();
            }
            
            if (!this.cutterContainer) {
                console.error('Could not create cutter container');
                this.hideModal();
                return;
            }
            
            this.updateImageDisplay();
            this.attachEventListeners();
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error showing modal:', error);
            this.cleanupFailedModal();
        }
    }

    hideModal() {
        if (!this.isActive) return;
        
        try {
            const modalContent = this.modal?.querySelector('.image-cutter-modal-content');
            if (modalContent) {
                modalContent.style.transform = 'scale(0.95)';
                modalContent.style.opacity = '0';
                
                setTimeout(() => {
                    this.isActive = false;
                    if (this.modal) {
                        this.modal.style.display = 'none';
                    }
                    document.body.style.overflow = '';
                }, 300);
            } else {
                this.isActive = false;
                if (this.modal) {
                    this.modal.style.display = 'none';
                }
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('Error hiding modal:', error);
            this.isActive = false;
            if (this.modal) {
                this.modal.style.display = 'none';
            }
            document.body.style.overflow = '';
        }
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
        
        if (this.options.type === 'profile') {
            this.cropArea.height = this.cropArea.width;
        }
    }

    updateImageDisplay() {
        if (!this.isActive || !this.imageElement || !this.image.complete) return;
        
        try {
            const containerWidth = this.cutterContainer.offsetWidth;
            const containerHeight = this.cutterContainer.offsetHeight;
            const { width: imgWidth, height: imgHeight } = this.image;
            
            if (!containerWidth || !containerHeight || !imgWidth || !imgHeight) return;
            
            if (this.options.type === 'profile') {
                const size = Math.min(this.cropArea.width, this.cropArea.height);
                this.cropArea.width = size;
                this.cropArea.height = size;
            } else {
                this.cropArea.height = this.cropArea.width / 2;
            }
            
            const scaleX = containerWidth / imgWidth;
            const scaleY = containerHeight / imgHeight;
            this.scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = imgWidth * this.scale;
            const scaledHeight = imgHeight * this.scale;
            
            this.imageOffset.x = (containerWidth - scaledWidth) / 2;
            this.imageOffset.y = (containerHeight - scaledHeight) / 2;
            
            this.imageElement.src = this.image.src;
            this.imageElement.style.width = scaledWidth + 'px';
            this.imageElement.style.height = scaledHeight + 'px';
            this.imageElement.style.left = this.imageOffset.x + 'px';
            this.imageElement.style.top = this.imageOffset.y + 'px';
            
            this.updateCropOverlay();
        } catch (error) {
            console.error('Error updating image display:', error);
        }
    }

    updateCropOverlay() {
        if (!this.overlay) return;
        
        try {
            if (this.options.type === 'profile') {
                const size = Math.min(this.cropArea.width, this.cropArea.height);
                this.cropArea.width = size;
                this.cropArea.height = size;
            }
            
            const crop = {
                x: this.cropArea.x * this.scale + this.imageOffset.x,
                y: this.cropArea.y * this.scale + this.imageOffset.y,
                width: Math.max(this.cropArea.width * this.scale, 10),
                height: Math.max(this.cropArea.height * this.scale, 10)
            };
    
            this.overlay.style.left = `${crop.x}px`;
            this.overlay.style.top = `${crop.y}px`;
            this.overlay.style.width = `${crop.width}px`;
            this.overlay.style.height = `${crop.height}px`;
            this.overlay.style.border = '2px solid #5865F2';
            this.overlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
            this.overlay.style.boxSizing = 'border-box';
            this.overlay.style.borderRadius = this.options.type === 'profile' ? '50%' : '0';
            
            this.overlay.style.transition = 'border-color 0.2s ease';
            
            if (!this.statusText) {
                this.statusText = document.createElement('div');
                this.statusText.style.position = 'absolute';
                this.statusText.style.bottom = '-30px';
                this.statusText.style.left = '0';
                this.statusText.style.width = '100%';
                this.statusText.style.textAlign = 'center';
                this.statusText.style.color = 'white';
                this.statusText.style.fontSize = '12px';
                this.statusText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.statusText.style.padding = '2px 5px';
                this.statusText.style.borderRadius = '3px';
                this.overlay.appendChild(this.statusText);
            }
            
            if (this.options.type === 'profile') {
                this.statusText.textContent = `Size: ${Math.round(this.cropArea.width)}×${Math.round(this.cropArea.width)}px (1:1)`;
            } else {
                this.statusText.textContent = `Size: ${Math.round(this.cropArea.width)}×${Math.round(this.cropArea.height)}px (2:1)`;
            }
            
            if (!this.instructionText && this.cutterContainer) {
                this.instructionText = document.createElement('div');
                this.instructionText.style.position = 'absolute';
                this.instructionText.style.top = '10px';
                this.instructionText.style.left = '50%';
                this.instructionText.style.transform = 'translateX(-50%)';
                this.instructionText.style.color = 'white';
                this.instructionText.style.fontSize = '14px';
                this.instructionText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.instructionText.style.padding = '5px 10px';
                this.instructionText.style.borderRadius = '5px';
                this.instructionText.style.zIndex = '10';
                this.instructionText.textContent = this.options.type === 'profile' 
                    ? 'Drag corners to resize (1:1 ratio) • Drag center to move'
                    : 'Drag corners to resize (2:1 ratio) • Drag center to move';
                this.cutterContainer.appendChild(this.instructionText);
                
                setTimeout(() => {
                    if (this.instructionText) {
                        this.instructionText.style.transition = 'opacity 1s ease';
                        this.instructionText.style.opacity = '0';
                    }
                }, 3000);
            }
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
        
        const { width: imgWidth, height: imgHeight } = this.image;
        
        let newX = this.dragStart.cropX + deltaX / this.scale;
        let newY = this.dragStart.cropY + deltaY / this.scale;
        
        newX = Math.max(0, Math.min(imgWidth - this.cropArea.width, newX));
        newY = Math.max(0, Math.min(imgHeight - this.cropArea.height, newY));
        
        this.cropArea.x = newX;
        this.cropArea.y = newY;
        
        this.updateCropOverlay();
        e.preventDefault();
    }

    endDrag() {
        this.overlay.style.borderColor = '#5865F2';
        this.overlay.style.borderWidth = '2px';
        
        if (this.handles) {
            Object.values(this.handles).forEach(handle => {
                handle.style.transform = 'scale(1)';
                handle.style.opacity = '0.8';
                handle.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.3)';
            });
        }
        
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
        
        this.overlay.style.borderColor = '#5865F2';
        this.overlay.style.borderWidth = '3px';
        
        if (this.handles[position]) {
            this.handles[position].style.transform = 'scale(1.3)';
            this.handles[position].style.opacity = '1';
            this.handles[position].style.boxShadow = '0 0 0 3px rgba(88, 101, 242, 0.5)';
        }
        
        e.stopPropagation();
        e.preventDefault();
    }

    onResize(e) {
        if (!this.resizing) return;

        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        const { width: imgWidth, height: imgHeight } = this.image;
        
        const responsiveness = 1.2;
        const scaledDeltaX = deltaX / this.scale * responsiveness;
        const scaledDeltaY = deltaY / this.scale * responsiveness;
        
        const crop = { ...this.cropArea };
        
        if (this.options.type === 'profile') {
            let delta;
            
            switch (this.resizeHandle) {
                case 'nw': 
                    delta = Math.max(scaledDeltaX, scaledDeltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                    break;
                    
                case 'ne': 
                    delta = Math.max(-scaledDeltaX, scaledDeltaY);
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                    break;
                    
                case 'sw': 
                    delta = Math.max(scaledDeltaX, -scaledDeltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                    break;
                    
                case 'se': 
                    delta = Math.min(scaledDeltaX, scaledDeltaY);
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                    break;
            }
        } else {
            switch (this.resizeHandle) {
                case 'nw':
                    crop.x = this.dragStart.x + scaledDeltaX;
                    crop.width = this.dragStart.width - scaledDeltaX;
                    crop.height = crop.width / 2;
                    crop.y = this.dragStart.y + this.dragStart.height - crop.height;
                    break;
                    
                case 'ne':
                    crop.width = this.dragStart.width + scaledDeltaX;
                    crop.height = crop.width / 2;
                    crop.y = this.dragStart.y + this.dragStart.height - crop.height;
                    break;
                    
                case 'sw':
                    crop.x = this.dragStart.x + scaledDeltaX;
                    crop.width = this.dragStart.width - scaledDeltaX;
                    crop.height = crop.width / 2;
                    break;
                    
                case 'se':
                    crop.width = this.dragStart.width + scaledDeltaX;
                    crop.height = crop.width / 2;
                    break;
            }
        }
        
        const minSize = this.options.type === 'profile' ? 50 : 100;
        
        if (crop.width >= minSize && crop.height >= (this.options.type === 'profile' ? minSize : minSize / 2)) {
            if (crop.x < 0) crop.x = 0;
            if (crop.y < 0) crop.y = 0;
            if (crop.x + crop.width > imgWidth) crop.width = imgWidth - crop.x;
            if (crop.y + crop.height > imgHeight) crop.height = imgHeight - crop.y;
            
            if (this.options.type === 'profile') {
                const finalSize = Math.min(crop.width, crop.height, 
                                         imgWidth - crop.x, 
                                         imgHeight - crop.y);
                crop.width = finalSize;
                crop.height = finalSize;
            } else {
                crop.height = crop.width / 2;
            }
            
            this.cropArea = crop;
            this.updateCropOverlay();
            
            if (this.statusText) {
                if (this.options.type === 'profile') {
                    this.statusText.textContent = `Size: ${Math.round(crop.width)}×${Math.round(crop.width)}px (1:1)`;
                } else {
                    this.statusText.textContent = `Size: ${Math.round(crop.width)}×${Math.round(crop.height)}px (2:1)`;
                }
            }
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
            this.updateImageDisplay();
        }
    }

    recreateModalContent() {
        try {
            if (this.modal) {
                while (this.modal.firstChild) {
                    this.modal.removeChild(this.modal.firstChild);
                }
            } else {
                return;
            }
            
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
            
            const infoText = document.createElement('p');
            infoText.textContent = this.options.type === 'profile' 
                ? 'Drag to position and resize the crop area. Profile images use a 1:1 ratio.' 
                : 'Drag to position and resize the crop area. Banners use a 2:1 ratio.';
            infoText.style.color = '#999';
            infoText.style.fontSize = '14px';
            infoText.style.marginBottom = '16px';
            infoText.style.textAlign = 'center';
            modalContent.appendChild(infoText);
            
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
            
            this.imageElement = document.createElement('img');
            this.imageElement.style.position = 'absolute';
            this.imageElement.style.top = '0';
            this.imageElement.style.left = '0';
            this.imageElement.style.maxWidth = 'none';
            this.imageElement.style.maxHeight = 'none';
            this.imageElement.style.userSelect = 'none';
            this.imageElement.style.pointerEvents = 'none';
            this.cutterContainer.appendChild(this.imageElement);
            
            this.overlay = document.createElement('div');
            this.overlay.className = 'image-cutter-overlay';
            this.overlay.style.position = 'absolute';
            this.overlay.style.top = '0';
            this.overlay.style.left = '0';
            this.overlay.style.width = '100px';
            this.overlay.style.height = '100px';
            this.overlay.style.cursor = 'move';
            this.overlay.style.border = '2px solid #5865F2';
            this.overlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
            this.overlay.style.boxSizing = 'border-box';
            this.cutterContainer.appendChild(this.overlay);
            
            this.createResizeHandles();
        } catch (error) {
            console.error('Error recreating modal content:', error);
        }
    }
    
    cleanupFailedModal() {
        try {
            this.isActive = false;
            if (this.modal) {
                this.modal.style.display = 'none';
                
                if (this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
            }
            
            this.modal = null;
            this.cutterContainer = null;
            this.imageElement = null;
            this.overlay = null;
            
            document.body.style.overflow = '';
            
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
