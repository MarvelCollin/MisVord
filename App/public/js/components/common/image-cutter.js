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
        this.minSize = 60;

        this.init();
    }

    init() {
        try {
            if (!this.options.container || !(this.options.container instanceof Element)) {
                console.error('Valid container element is required for ImageCutter');
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
            this.modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
                backdrop-filter: blur(5px);
            `;

            const modalContent = document.createElement('div');
            modalContent.className = 'image-cutter-modal-content';
            modalContent.style.cssText = `
                background-color: #2f3136;
                border-radius: 8px;
                padding: 24px;
                width: 100%;
                max-width: 700px;
                position: relative;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            `;

            const modalHeader = document.createElement('div');
            modalHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            `;

            const modalTitle = document.createElement('h3');
            modalTitle.textContent = this.options.modalTitle || 'Crop Image';
            modalTitle.style.cssText = `
                color: #fff;
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            `;

            const closeButton = document.createElement('button');
            closeButton.innerHTML = '✕';
            closeButton.style.cssText = `
                background: none;
                border: none;
                color: #b9bbbe;
                font-size: 20px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            `;
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.backgroundColor = '#f04747';
                closeButton.style.color = '#fff';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.backgroundColor = 'transparent';
                closeButton.style.color = '#b9bbbe';
            });
            closeButton.addEventListener('click', () => this.hideModal());

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            modalContent.appendChild(modalHeader);

            this.cutterContainer = document.createElement('div');
            this.cutterContainer.className = 'image-cutter-container';
            this.cutterContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 500px;
                background-color: #18191c;
                margin-bottom: 20px;
                overflow: hidden;
                border-radius: 6px;
                border: 2px solid #40444b;
            `;
            modalContent.appendChild(this.cutterContainer);

            this.imageElement = document.createElement('img');
            this.imageElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                max-width: none;
                max-height: none;
                user-select: none;
                pointer-events: none;
            `;
            this.cutterContainer.appendChild(this.imageElement);

            this.overlay = document.createElement('div');
            this.overlay.className = 'image-cutter-overlay';
            this.overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100px;
                height: 100px;
                cursor: move;
                border: 3px solid #5865f2;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
                box-sizing: border-box;
                transition: border-color 0.2s ease;
            `;
            this.cutterContainer.appendChild(this.overlay);

            const infoSection = document.createElement('div');
            infoSection.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                color: #b9bbbe;
                font-size: 14px;
            `;
            
            const infoText = document.createElement('span');
            infoText.textContent = this.options.type === 'profile' 
                ? 'Drag to move • Drag corners to resize • 1:1 aspect ratio' 
                : 'Drag to move • Drag corners to resize • 2:1 aspect ratio';
            infoSection.appendChild(infoText);
            modalContent.appendChild(infoSection);

            this.createResizeHandles();

            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            `;

            this.cancelButton = document.createElement('button');
            this.cancelButton.textContent = 'Cancel';
            this.cancelButton.style.cssText = `
                background-color: transparent;
                color: #b9bbbe;
                border: 1px solid #4f545c;
                border-radius: 4px;
                padding: 12px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            `;
            this.cancelButton.addEventListener('mouseenter', () => {
                this.cancelButton.style.backgroundColor = '#4f545c';
                this.cancelButton.style.color = '#fff';
            });
            this.cancelButton.addEventListener('mouseleave', () => {
                this.cancelButton.style.backgroundColor = 'transparent';
                this.cancelButton.style.color = '#b9bbbe';
            });
            this.cancelButton.addEventListener('click', () => this.hideModal());
            buttonContainer.appendChild(this.cancelButton);

            this.applyButton = document.createElement('button');
            this.applyButton.textContent = 'Apply';
            this.applyButton.style.cssText = `
                background-color: #5865f2;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 12px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s ease;
            `;
            this.applyButton.addEventListener('mouseenter', () => {
                this.applyButton.style.backgroundColor = '#4752c4';
            });
            this.applyButton.addEventListener('mouseleave', () => {
                this.applyButton.style.backgroundColor = '#5865f2';
            });
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
        this.handles = {};
        
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${pos}`;
            handle.style.cssText = `
                position: absolute;
                width: 32px;
                height: 32px;
                background-color: #5865f2;
                border: 3px solid #ffffff;
                border-radius: 50%;
                z-index: 20;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            `;
            handle.dataset.position = pos;
            
            handle.addEventListener('mouseenter', () => {
                handle.style.transform = 'scale(1.2)';
                handle.style.backgroundColor = '#4752c4';
            });
            
            handle.addEventListener('mouseleave', () => {
                if (!this.resizing || this.resizeHandle !== pos) {
                    handle.style.transform = 'scale(1)';
                    handle.style.backgroundColor = '#5865f2';
                }
            });
            
            switch(pos) {
                case 'nw': 
                    handle.style.top = '-16px'; 
                    handle.style.left = '-16px';
                    handle.style.cursor = 'nw-resize';
                    break;
                case 'ne': 
                    handle.style.top = '-16px'; 
                    handle.style.right = '-16px';
                    handle.style.cursor = 'ne-resize';
                    break;
                case 'se': 
                    handle.style.bottom = '-16px'; 
                    handle.style.right = '-16px';
                    handle.style.cursor = 'se-resize';
                    break;
                case 'sw': 
                    handle.style.bottom = '-16px'; 
                    handle.style.left = '-16px';
                    handle.style.cursor = 'sw-resize';
                    break;
            }
            
            this.overlay.appendChild(handle);
            this.handles[pos] = handle;
        });
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
            this.isActive = false;
            if (this.modal) {
                this.modal.style.display = 'none';
            }
            document.body.style.overflow = '';
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
        
        let cropSize = Math.min(imgWidth, imgHeight) * 0.7;
        
        if (this.options.type === 'profile') {
            this.cropArea = {
                x: (imgWidth - cropSize) / 2,
                y: (imgHeight - cropSize) / 2,
                width: cropSize,
                height: cropSize
            };
        } else {
            cropSize = Math.min(imgWidth, imgHeight * 2) * 0.7;
            this.cropArea = {
                x: (imgWidth - cropSize) / 2,
                y: (imgHeight - cropSize / 2) / 2,
                width: cropSize,
                height: cropSize / 2
            };
        }
    }

    updateImageDisplay() {
        if (!this.isActive || !this.imageElement || !this.image.complete) return;
        
        try {
            const containerWidth = this.cutterContainer.offsetWidth;
            const containerHeight = this.cutterContainer.offsetHeight;
            const { width: imgWidth, height: imgHeight } = this.image;
            
            if (!containerWidth || !containerHeight || !imgWidth || !imgHeight) return;
            
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
            const crop = {
                x: this.cropArea.x * this.scale + this.imageOffset.x,
                y: this.cropArea.y * this.scale + this.imageOffset.y,
                width: this.cropArea.width * this.scale,
                height: this.cropArea.height * this.scale
            };
    
            this.overlay.style.left = `${crop.x}px`;
            this.overlay.style.top = `${crop.y}px`;
            this.overlay.style.width = `${crop.width}px`;
            this.overlay.style.height = `${crop.height}px`;
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
        
        this.overlay.style.borderColor = '#00d4aa';
        e.preventDefault();
    }

    onDrag(e) {
        if (this.resizing) {
            this.onResize(e);
            return;
        }

        if (!this.isDragging) return;
        
        const deltaX = (e.clientX - this.dragStart.x) / this.scale;
        const deltaY = (e.clientY - this.dragStart.y) / this.scale;
        
        const { width: imgWidth, height: imgHeight } = this.image;
        
        let newX = this.dragStart.cropX + deltaX;
        let newY = this.dragStart.cropY + deltaY;
        
        newX = Math.max(0, Math.min(imgWidth - this.cropArea.width, newX));
        newY = Math.max(0, Math.min(imgHeight - this.cropArea.height, newY));
        
        this.cropArea.x = newX;
        this.cropArea.y = newY;
        
        this.updateCropOverlay();
        e.preventDefault();
    }

    endDrag() {
        this.overlay.style.borderColor = '#5865f2';
        
        if (this.handles && this.resizeHandle) {
            this.handles[this.resizeHandle].style.transform = 'scale(1)';
            this.handles[this.resizeHandle].style.backgroundColor = '#5865f2';
        }
        
        this.isDragging = false;
        this.resizing = false;
        this.resizeHandle = null;
    }

    startResize(e, position) {
        this.resizing = true;
        this.resizeHandle = position;
        this.dragStart = {
            x: e.clientX,
            y: e.clientY,
            ...this.cropArea
        };
        
        this.overlay.style.borderColor = '#00d4aa';
        
        if (this.handles[position]) {
            this.handles[position].style.transform = 'scale(1.3)';
            this.handles[position].style.backgroundColor = '#00d4aa';
        }
        
        e.stopPropagation();
        e.preventDefault();
    }

    onResize(e) {
        if (!this.resizing) return;

        const deltaX = (e.clientX - this.dragStart.x) / this.scale;
        const deltaY = (e.clientY - this.dragStart.y) / this.scale;
        
        const { width: imgWidth, height: imgHeight } = this.image;
        let crop = { ...this.cropArea };
        
        if (this.options.type === 'profile') {
            let delta = 0;
            
            switch (this.resizeHandle) {
                case 'nw': 
                    delta = Math.min(deltaX, deltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                    break;
                    
                case 'ne': 
                    delta = Math.max(-deltaX, deltaY);
                    crop.y = this.dragStart.y + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                    break;
                    
                case 'sw': 
                    delta = Math.max(deltaX, -deltaY);
                    crop.x = this.dragStart.x + delta;
                    crop.width = this.dragStart.width - delta;
                    crop.height = crop.width;
                    break;
                    
                case 'se': 
                    delta = Math.min(deltaX, deltaY);
                    crop.width = this.dragStart.width + delta;
                    crop.height = crop.width;
                    break;
            }
        } else {
            switch (this.resizeHandle) {
                case 'nw':
                    crop.x = this.dragStart.x + deltaX;
                    crop.y = this.dragStart.y + deltaY;
                    crop.width = this.dragStart.width - deltaX;
                    crop.height = crop.width / 2;
                    break;
                    
                case 'ne':
                    crop.y = this.dragStart.y + deltaY;
                    crop.width = this.dragStart.width + deltaX;
                    crop.height = crop.width / 2;
                    break;
                    
                case 'sw':
                    crop.x = this.dragStart.x + deltaX;
                    crop.width = this.dragStart.width - deltaX;
                    crop.height = crop.width / 2;
                    break;
                    
                case 'se':
                    crop.width = this.dragStart.width + deltaX;
                    crop.height = crop.width / 2;
                    break;
            }
        }
        
        if (crop.width >= this.minSize && crop.height >= this.minSize) {
            crop.x = Math.max(0, Math.min(imgWidth - crop.width, crop.x));
            crop.y = Math.max(0, Math.min(imgHeight - crop.height, crop.y));
            
            if (crop.x + crop.width <= imgWidth && crop.y + crop.height <= imgHeight) {
                this.cropArea = crop;
                this.updateCropOverlay();
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
            modalContent.style.cssText = `
                background-color: #2f3136;
                border-radius: 8px;
                padding: 24px;
                width: 100%;
                max-width: 700px;
                position: relative;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            `;
            
            const modalHeader = document.createElement('div');
            modalHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            `;
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = this.options.modalTitle || 'Crop Image';
            modalTitle.style.cssText = `
                color: #fff;
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            `;
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '✕';
            closeButton.style.cssText = `
                background: none;
                border: none;
                color: #b9bbbe;
                font-size: 20px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
            `;
            closeButton.addEventListener('click', () => this.hideModal());
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            modalContent.appendChild(modalHeader);
            
            this.cutterContainer = document.createElement('div');
            this.cutterContainer.className = 'image-cutter-container';
            this.cutterContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 500px;
                background-color: #18191c;
                margin-bottom: 20px;
                overflow: hidden;
                border-radius: 6px;
                border: 2px solid #40444b;
            `;
            modalContent.appendChild(this.cutterContainer);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            `;
            
            this.cancelButton = document.createElement('button');
            this.cancelButton.textContent = 'Cancel';
            this.cancelButton.style.cssText = `
                background-color: transparent;
                color: #b9bbbe;
                border: 1px solid #4f545c;
                border-radius: 4px;
                padding: 12px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            `;
            this.cancelButton.addEventListener('click', () => this.hideModal());
            buttonContainer.appendChild(this.cancelButton);
            
            this.applyButton = document.createElement('button');
            this.applyButton.textContent = 'Apply';
            this.applyButton.style.cssText = `
                background-color: #5865f2;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 12px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            `;
            this.applyButton.addEventListener('click', () => this.applyCrop());
            buttonContainer.appendChild(this.applyButton);
            
            modalContent.appendChild(buttonContainer);
            this.modal.appendChild(modalContent);
            
            this.imageElement = document.createElement('img');
            this.imageElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                max-width: none;
                max-height: none;
                user-select: none;
                pointer-events: none;
            `;
            this.cutterContainer.appendChild(this.imageElement);
            
            this.overlay = document.createElement('div');
            this.overlay.className = 'image-cutter-overlay';
            this.overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100px;
                height: 100px;
                cursor: move;
                border: 3px solid #5865f2;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
                box-sizing: border-box;
            `;
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
