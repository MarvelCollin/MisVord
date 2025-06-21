export class ImageCutter {
    constructor(options = {}) {
        this.options = {
            aspectRatio: options.aspectRatio || null,
            minWidth: options.minWidth || 100,
            minHeight: options.minHeight || 100,
            maxWidth: options.maxWidth || 800,
            maxHeight: options.maxHeight || 800,
            onCrop: options.onCrop || function() {},
            onCancel: options.onCancel || function() {},
            type: options.type || null
        };
        
        if (this.options.type === 'banner') {
            this.options.aspectRatio = 2;
        } else if (this.options.type === 'avatar') {
            this.options.aspectRatio = 1;
        }
        
        this.cropArea = null;
        this.image = null;
        this.imageContainer = null;
        this.originalImage = null;
        this.modal = null;
        this.cropBox = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cropStartX = 0;
        this.cropStartY = 0;
        this.cropStartWidth = 0;
        this.cropStartHeight = 0;
        this.resizeHandle = null;
        this.imageWidth = 0;
        this.imageHeight = 0;
        this.imageLeft = 0;
        this.imageTop = 0;
        this.zoomLevel = 1;
        this.maxZoom = 3;
        this.minZoom = 0.5;
        this.zoomStep = 0.1;
    }
    
    open(imageFile) {
        if (!imageFile || !imageFile.type.match(/^image\//)) {
            console.error('Invalid image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.originalImage = imageFile;
            this.createModal(e.target.result);
        };
        reader.readAsDataURL(imageFile);
    }
    
    createModal(imageSrc) {
        this.modal = document.createElement('div');
        this.modal.className = 'image-cutter-modal fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-discord-dark rounded-lg p-4 w-full max-w-4xl relative';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        
        const title = document.createElement('h3');
        title.className = 'text-white text-lg font-medium';
        if (this.options.type === 'banner') {
            title.textContent = 'Crop Banner (2:1)';
        } else if (this.options.type === 'avatar') {
            title.textContent = 'Crop Profile Picture (1:1)';
        } else {
            title.textContent = 'Crop Image';
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'text-gray-400 hover:text-white';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => this.close());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'flex items-center mb-4 space-x-4';
        
        // Zoom controls
        const zoomControls = document.createElement('div');
        zoomControls.className = 'flex items-center space-x-2';
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'text-white bg-discord-dark-secondary p-1 rounded';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomOutBtn.addEventListener('click', () => this.zoom(-this.zoomStep));
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'text-white bg-discord-dark-secondary p-1 rounded';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomInBtn.addEventListener('click', () => this.zoom(this.zoomStep));
        
        const zoomLabel = document.createElement('span');
        zoomLabel.className = 'text-white text-sm';
        zoomLabel.textContent = '100%';
        this.zoomLabel = zoomLabel;
        
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(zoomLabel);
        zoomControls.appendChild(zoomInBtn);
        
        // Aspect ratio controls - only show if not enforcing a specific type
        if (!this.options.type) {
            const aspectControls = document.createElement('div');
            aspectControls.className = 'flex items-center space-x-2';
            
            const aspectLabel = document.createElement('span');
            aspectLabel.className = 'text-white text-sm';
            aspectLabel.textContent = 'Aspect Ratio:';
            
            const aspectSelect = document.createElement('select');
            aspectSelect.className = 'bg-discord-dark-secondary text-white text-sm p-1 rounded';
            
            const aspectOptions = [
                { value: 'free', label: 'Free' },
                { value: '1', label: '1:1 (Square)' },
                { value: '16/9', label: '16:9' },
                { value: '4/3', label: '4:3' },
                { value: '3/2', label: '3:2' },
                { value: '2', label: '2:1' }
            ];
            
            aspectOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.label;
                if ((this.options.aspectRatio === null && option.value === 'free') || 
                    (this.options.aspectRatio !== null && option.value === String(this.options.aspectRatio))) {
                    optElement.selected = true;
                }
                aspectSelect.appendChild(optElement);
            });
            
            aspectSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value === 'free') {
                    this.options.aspectRatio = null;
                } else {
                    this.options.aspectRatio = eval(value);
                }
                this.updateCropBoxWithAspectRatio();
            });
            
            aspectControls.appendChild(aspectLabel);
            aspectControls.appendChild(aspectSelect);
            controls.appendChild(aspectControls);
        }
        
        controls.appendChild(zoomControls);
        
        this.cropArea = document.createElement('div');
        this.cropArea.className = 'relative overflow-hidden bg-discord-dark-secondary rounded mb-4';
        this.cropArea.style.height = '400px';
        
        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'absolute inset-0 flex items-center justify-center';
        
        this.image = document.createElement('img');
        this.image.className = 'max-h-full';
        this.image.style.maxWidth = '100%';
        this.image.src = imageSrc;
        this.image.onload = () => {
            this.calculateImageDimensions();
            this.initCropBox();
        };
        
        // Add wheel event for zooming
        this.cropArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY || e.detail || e.wheelDelta;
            const zoomChange = delta > 0 ? -this.zoomStep : this.zoomStep;
            this.zoom(zoomChange);
        });
        
        this.imageContainer.appendChild(this.image);
        this.cropArea.appendChild(this.imageContainer);
        
        const buttons = document.createElement('div');
        buttons.className = 'flex justify-end space-x-3';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-4 py-2 bg-discord-dark-secondary text-white rounded hover:bg-opacity-80';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.close());
        
        const cropBtn = document.createElement('button');
        cropBtn.className = 'px-4 py-2 bg-discord-blue text-white rounded hover:bg-opacity-80';
        cropBtn.textContent = 'Crop';
        cropBtn.addEventListener('click', () => this.crop());
        
        buttons.appendChild(cancelBtn);
        buttons.appendChild(cropBtn);
        
        modalContent.appendChild(header);
        modalContent.appendChild(controls);
        modalContent.appendChild(this.cropArea);
        modalContent.appendChild(buttons);
        this.modal.appendChild(modalContent);
        
        document.body.appendChild(this.modal);
        
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    calculateImageDimensions() {
        const cropAreaRect = this.cropArea.getBoundingClientRect();
        const imgRect = this.image.getBoundingClientRect();
        
        this.imageWidth = imgRect.width;
        this.imageHeight = imgRect.height;
        this.imageLeft = (cropAreaRect.width - imgRect.width) / 2;
        this.imageTop = (cropAreaRect.height - imgRect.height) / 2;
        
        this.imageContainer.style.width = `${cropAreaRect.width}px`;
        this.imageContainer.style.height = `${cropAreaRect.height}px`;
    }
    
    zoom(change) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + change));
        if (newZoom === this.zoomLevel) return;
        
        const oldZoom = this.zoomLevel;
        this.zoomLevel = newZoom;
        
        // Update zoom label
        this.zoomLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        
        // Update image size
        this.image.style.transform = `scale(${this.zoomLevel})`;
        
        // Recalculate image dimensions
        this.calculateImageDimensions();
        
        // Adjust crop box position and size if needed
        if (this.cropBox) {
            const scaleRatio = this.zoomLevel / oldZoom;
            
            const cropLeft = parseInt(this.cropBox.style.left);
            const cropTop = parseInt(this.cropBox.style.top);
            const cropWidth = parseInt(this.cropBox.style.width);
            const cropHeight = parseInt(this.cropBox.style.height);
            
            // Adjust the crop box to maintain its relative position
            const centerX = cropLeft + cropWidth / 2;
            const centerY = cropTop + cropHeight / 2;
            
            const newCenterX = centerX * scaleRatio;
            const newCenterY = centerY * scaleRatio;
            
            const newLeft = Math.max(this.imageLeft, Math.min(this.imageLeft + this.imageWidth - cropWidth, newCenterX - cropWidth / 2));
            const newTop = Math.max(this.imageTop, Math.min(this.imageTop + this.imageHeight - cropHeight, newCenterY - cropHeight / 2));
            
            this.cropBox.style.left = `${newLeft}px`;
            this.cropBox.style.top = `${newTop}px`;
        }
    }
    
    initCropBox() {
        const cropAreaRect = this.cropArea.getBoundingClientRect();
        let initialWidth, initialHeight;
        
        if (this.options.type === 'banner') {
            initialWidth = Math.min(this.imageWidth, cropAreaRect.width * 0.8);
            initialHeight = initialWidth / 2;
        } else if (this.options.type === 'avatar') {
            initialWidth = Math.min(this.imageWidth, this.imageHeight) * 0.8;
            initialHeight = initialWidth;
        } else {
            initialWidth = Math.min(this.imageWidth, this.imageHeight) * 0.8;
            initialHeight = initialWidth;
            if (this.options.aspectRatio) {
                initialHeight = initialWidth / this.options.aspectRatio;
            }
        }
        
        const initialX = this.imageLeft + (this.imageWidth - initialWidth) / 2;
        const initialY = this.imageTop + (this.imageHeight - initialHeight) / 2;
        
        this.cropBox = document.createElement('div');
        this.cropBox.className = 'absolute border-2 border-white cursor-move';
        this.cropBox.style.width = `${initialWidth}px`;
        this.cropBox.style.height = `${initialHeight}px`;
        this.cropBox.style.left = `${initialX}px`;
        this.cropBox.style.top = `${initialY}px`;
        
        // For avatars, add a circular overlay
        if (this.options.type === 'avatar') {
            this.cropBox.style.borderRadius = '50%';
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black bg-opacity-50 pointer-events-none';
        overlay.style.boxShadow = `0 0 0 9999px rgba(0, 0, 0, 0.5)`;
        if (this.options.type === 'avatar') {
            overlay.style.borderRadius = '50%';
        }
        this.cropBox.appendChild(overlay);
        
        const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        const cursors = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'];
        
        positions.forEach((pos, index) => {
            const handle = document.createElement('div');
            handle.className = `absolute bg-white z-10`;
            handle.dataset.position = pos;
            handle.style.cursor = cursors[index];
            
            if (pos.includes('n') || pos.includes('s')) {
                if (pos === 'n' || pos === 's') {
                    handle.style.width = '20px';
                    handle.style.height = '7px';
                    handle.style.left = 'calc(50% - 10px)';
                } else {
                    handle.style.width = '10px';
                    handle.style.height = '10px';
                    handle.style.borderRadius = '50%';
                }
            }
            
            if (pos.includes('e') || pos.includes('w')) {
                if (pos === 'e' || pos === 'w') {
                    handle.style.width = '7px';
                    handle.style.height = '20px';
                    handle.style.top = 'calc(50% - 10px)';
                } else if (!handle.style.width) {
                    handle.style.width = '10px';
                    handle.style.height = '10px';
                    handle.style.borderRadius = '50%';
                }
            }
            
            switch(pos) {
                case 'nw':
                    handle.style.top = '-5px';
                    handle.style.left = '-5px';
                    break;
                case 'n':
                    handle.style.top = '-3px';
                    break;
                case 'ne':
                    handle.style.top = '-5px';
                    handle.style.right = '-5px';
                    break;
                case 'e':
                    handle.style.right = '-3px';
                    break;
                case 'se':
                    handle.style.bottom = '-5px';
                    handle.style.right = '-5px';
                    break;
                case 's':
                    handle.style.bottom = '-3px';
                    break;
                case 'sw':
                    handle.style.bottom = '-5px';
                    handle.style.left = '-5px';
                    break;
                case 'w':
                    handle.style.left = '-3px';
                    break;
            }
            
            handle.addEventListener('mousedown', (e) => this.startResize(e, pos));
            this.cropBox.appendChild(handle);
        });
        
        this.cropBox.addEventListener('mousedown', (e) => this.startDrag(e));
        
        this.cropArea.appendChild(this.cropBox);
    }
    
    updateCropBoxWithAspectRatio() {
        if (!this.cropBox) return;
        
        const currentWidth = parseInt(this.cropBox.style.width);
        const currentHeight = parseInt(this.cropBox.style.height);
        const currentLeft = parseInt(this.cropBox.style.left);
        const currentTop = parseInt(this.cropBox.style.top);
        
        let newWidth = currentWidth;
        let newHeight = currentHeight;
        
        if (this.options.aspectRatio) {
            // Maintain the current width and adjust height to match aspect ratio
            newHeight = newWidth / this.options.aspectRatio;
            
            // Check if the new height exceeds the image boundaries
            if (currentTop + newHeight > this.imageTop + this.imageHeight) {
                newHeight = (this.imageTop + this.imageHeight) - currentTop;
                newWidth = newHeight * this.options.aspectRatio;
            }
        }
        
        this.cropBox.style.width = `${newWidth}px`;
        this.cropBox.style.height = `${newHeight}px`;
        
        // For avatar type, keep circular mask
        if (this.options.type === 'avatar') {
            this.cropBox.style.borderRadius = '50%';
            const overlay = this.cropBox.querySelector('div');
            if (overlay) {
                overlay.style.borderRadius = '50%';
            }
        } else {
            this.cropBox.style.borderRadius = '0';
            const overlay = this.cropBox.querySelector('div');
            if (overlay) {
                overlay.style.borderRadius = '0';
            }
        }
    }
    
    startDrag(e) {
        if (e.target.dataset.position) return;
        
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.cropStartX = parseInt(this.cropBox.style.left);
        this.cropStartY = parseInt(this.cropBox.style.top);
        
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
        
        e.preventDefault();
    }
    
    handleDrag = (e) => {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        let newLeft = this.cropStartX + deltaX;
        let newTop = this.cropStartY + deltaY;
        
        const cropBoxRect = this.cropBox.getBoundingClientRect();
        
        const minLeft = this.imageLeft;
        const maxLeft = this.imageLeft + this.imageWidth - cropBoxRect.width;
        const minTop = this.imageTop;
        const maxTop = this.imageTop + this.imageHeight - cropBoxRect.height;
        
        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
        newTop = Math.max(minTop, Math.min(newTop, maxTop));
        
        this.cropBox.style.left = `${newLeft}px`;
        this.cropBox.style.top = `${newTop}px`;
    }
    
    stopDrag = () => {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.stopDrag);
    }
    
    startResize(e, position) {
        this.isResizing = true;
        this.resizeHandle = position;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.cropStartX = parseInt(this.cropBox.style.left);
        this.cropStartY = parseInt(this.cropBox.style.top);
        this.cropStartWidth = parseInt(this.cropBox.style.width);
        this.cropStartHeight = parseInt(this.cropBox.style.height);
        
        document.addEventListener('mousemove', this.handleResize);
        document.addEventListener('mouseup', this.stopResize);
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleResize = (e) => {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        let newLeft = this.cropStartX;
        let newTop = this.cropStartY;
        let newWidth = this.cropStartWidth;
        let newHeight = this.cropStartHeight;
        
        // Handle resize based on which handle was grabbed
        switch(this.resizeHandle) {
            case 'nw':
                newLeft = this.cropStartX + deltaX;
                newTop = this.cropStartY + deltaY;
                newWidth = this.cropStartWidth - deltaX;
                newHeight = this.cropStartHeight - deltaY;
                break;
            case 'n':
                newTop = this.cropStartY + deltaY;
                newHeight = this.cropStartHeight - deltaY;
                break;
            case 'ne':
                newTop = this.cropStartY + deltaY;
                newWidth = this.cropStartWidth + deltaX;
                newHeight = this.cropStartHeight - deltaY;
                break;
            case 'e':
                newWidth = this.cropStartWidth + deltaX;
                break;
            case 'se':
                newWidth = this.cropStartWidth + deltaX;
                newHeight = this.cropStartHeight + deltaY;
                break;
            case 's':
                newHeight = this.cropStartHeight + deltaY;
                break;
            case 'sw':
                newLeft = this.cropStartX + deltaX;
                newWidth = this.cropStartWidth - deltaX;
                newHeight = this.cropStartHeight + deltaY;
                break;
            case 'w':
                newLeft = this.cropStartX + deltaX;
                newWidth = this.cropStartWidth - deltaX;
                break;
        }
        
        // Enforce minimum dimensions
        if (newWidth < this.options.minWidth) {
            if (this.resizeHandle.includes('w')) {
                newLeft = this.cropStartX + this.cropStartWidth - this.options.minWidth;
            }
            newWidth = this.options.minWidth;
        }
        
        if (newHeight < this.options.minHeight) {
            if (this.resizeHandle.includes('n')) {
                newTop = this.cropStartY + this.cropStartHeight - this.options.minHeight;
            }
            newHeight = this.options.minHeight;
        }
        
        // Enforce aspect ratio if needed
        if (this.options.aspectRatio) {
            // Determine which dimension to prioritize based on the resize handle
            if (this.resizeHandle.includes('n') || this.resizeHandle.includes('s')) {
                // Vertical resize, prioritize height
                newWidth = newHeight * this.options.aspectRatio;
                
                // Adjust left position for west handles
                if (this.resizeHandle.includes('w')) {
                    newLeft = this.cropStartX + this.cropStartWidth - newWidth;
                }
            } else {
                // Horizontal or corner resize, prioritize width
                newHeight = newWidth / this.options.aspectRatio;
                
                // Adjust top position for north handles
                if (this.resizeHandle.includes('n')) {
                    newTop = this.cropStartY + this.cropStartHeight - newHeight;
                }
            }
        }
        
        // Enforce boundaries
        const minLeft = this.imageLeft;
        const maxRight = this.imageLeft + this.imageWidth;
        const minTop = this.imageTop;
        const maxBottom = this.imageTop + this.imageHeight;
        
        // Left boundary
        if (newLeft < minLeft) {
            const diff = minLeft - newLeft;
            newLeft = minLeft;
            if (this.options.aspectRatio && this.resizeHandle.includes('w')) {
                newWidth -= diff;
                newHeight = newWidth / this.options.aspectRatio;
                if (this.resizeHandle.includes('n')) {
                    newTop = this.cropStartY + this.cropStartHeight - newHeight;
                }
            } else if (!this.options.aspectRatio) {
                newWidth -= diff;
            }
        }
        
        // Right boundary
        if (newLeft + newWidth > maxRight) {
            const diff = (newLeft + newWidth) - maxRight;
            newWidth -= diff;
            if (this.options.aspectRatio) {
                newHeight = newWidth / this.options.aspectRatio;
                if (this.resizeHandle.includes('n')) {
                    newTop = this.cropStartY + this.cropStartHeight - newHeight;
                }
            }
        }
        
        // Top boundary
        if (newTop < minTop) {
            const diff = minTop - newTop;
            newTop = minTop;
            if (this.options.aspectRatio && this.resizeHandle.includes('n')) {
                newHeight -= diff;
                newWidth = newHeight * this.options.aspectRatio;
                if (this.resizeHandle.includes('w')) {
                    newLeft = this.cropStartX + this.cropStartWidth - newWidth;
                }
            } else if (!this.options.aspectRatio) {
                newHeight -= diff;
            }
        }
        
        // Bottom boundary
        if (newTop + newHeight > maxBottom) {
            const diff = (newTop + newHeight) - maxBottom;
            newHeight -= diff;
            if (this.options.aspectRatio) {
                newWidth = newHeight * this.options.aspectRatio;
                if (this.resizeHandle.includes('w')) {
                    newLeft = this.cropStartX + this.cropStartWidth - newWidth;
                }
            }
        }
        
        // Enforce max dimensions
        newWidth = Math.min(newWidth, this.options.maxWidth);
        newHeight = Math.min(newHeight, this.options.maxHeight);
        
        // Update crop box
        this.cropBox.style.left = `${newLeft}px`;
        this.cropBox.style.top = `${newTop}px`;
        this.cropBox.style.width = `${newWidth}px`;
        this.cropBox.style.height = `${newHeight}px`;
    }
    
    stopResize = () => {
        this.isResizing = false;
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);
    }
    
    handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            this.close();
        }
    }
    
    crop() {
        const imgRect = this.image.getBoundingClientRect();
        const cropBoxRect = this.cropBox.getBoundingClientRect();
        
        // Calculate the scale between natural image size and displayed image size
        const scaleX = this.image.naturalWidth / (this.imageWidth / this.zoomLevel);
        const scaleY = this.image.naturalHeight / (this.imageHeight / this.zoomLevel);
        
        // Calculate crop coordinates relative to the original image
        const cropLeft = (parseInt(this.cropBox.style.left) - this.imageLeft) * scaleX / this.zoomLevel;
        const cropTop = (parseInt(this.cropBox.style.top) - this.imageTop) * scaleY / this.zoomLevel;
        const cropWidth = parseInt(this.cropBox.style.width) * scaleX / this.zoomLevel;
        const cropHeight = parseInt(this.cropBox.style.height) * scaleY / this.zoomLevel;
        
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(
                img,
                cropLeft, cropTop, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );
            
            // For avatar, create a circular mask
            if (this.options.type === 'avatar') {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.beginPath();
                ctx.arc(cropWidth / 2, cropHeight / 2, cropWidth / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
            
            canvas.toBlob((blob) => {
                const croppedFile = new File([blob], this.originalImage.name, {
                    type: this.originalImage.type,
                    lastModified: new Date().getTime()
                });
                
                this.options.onCrop(croppedFile);
                this.close();
            }, this.originalImage.type);
        };
        
        img.src = URL.createObjectURL(this.originalImage);
    }
    
    close() {
        if (this.modal) {
            document.body.removeChild(this.modal);
            this.modal = null;
        }
        
        document.removeEventListener('keydown', this.handleKeyDown);
        this.options.onCancel();
    }
}

const style = document.createElement('style');
style.textContent = `
    .image-cutter-modal {
        z-index: 9999;
    }
    
    .image-cutter-modal img {
        user-select: none;
        -webkit-user-drag: none;
        transition: transform 0.2s ease-out;
    }
`;
document.head.appendChild(style);

export function openImageCutter(file, options = {}) {
    const cutter = new ImageCutter(options);
    cutter.open(file);
    return cutter;
}
