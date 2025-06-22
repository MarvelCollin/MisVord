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

        this.init();
    }

    init() {
        if (!this.options.container) {
            console.error('Container element is required');
            return;
        }

        // Create UI
        this.createUI();

        // Load image if provided
        if (this.options.imageUrl) {
            this.loadImage(this.options.imageUrl);
        }
    }

    createUI() {
        const container = this.options.container;
        container.classList.add('image-cutter-container');
        container.style.position = 'relative';
        container.style.width = `${this.options.width}px`;
        container.style.height = `${this.options.height}px`;
        container.style.overflow = 'hidden';
        container.style.backgroundColor = '#1e1e1e';
        container.style.borderRadius = this.options.type === 'profile' ? '50%' : '8px';

        // Canvas for image
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        // Create crop overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'image-cutter-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.cursor = 'move';
        container.appendChild(this.overlay);

        // Add resize handles
        this.createResizeHandles();

        // Add placeholder message
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'image-cutter-placeholder';
        this.placeholder.style.position = 'absolute';
        this.placeholder.style.top = '50%';
        this.placeholder.style.left = '50%';
        this.placeholder.style.transform = 'translate(-50%, -50%)';
        this.placeholder.style.color = '#666';
        this.placeholder.style.fontSize = '14px';
        this.placeholder.style.textAlign = 'center';
        container.appendChild(this.placeholder);

        // Attach event listeners
        this.attachEventListeners();
    }

    createResizeHandles() {
        const positions = ['nw', 'ne', 'se', 'sw'];
        const handles = {};
        
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${pos}`;
            handle.style.position = 'absolute';
            handle.style.width = '10px';
            handle.style.height = '10px';
            handle.style.backgroundColor = '#ffffff';
            handle.style.border = '1px solid #5865F2';
            handle.style.borderRadius = '50%';
            handle.style.zIndex = '10';
            handle.dataset.position = pos;
            
            // Position handles
            switch(pos) {
                case 'nw': 
                    handle.style.top = '-5px'; 
                    handle.style.left = '-5px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'ne': 
                    handle.style.top = '-5px'; 
                    handle.style.right = '-5px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'se': 
                    handle.style.bottom = '-5px'; 
                    handle.style.right = '-5px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'sw': 
                    handle.style.bottom = '-5px'; 
                    handle.style.left = '-5px';
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

        // File drop and click to upload
        this.options.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.options.container.style.borderColor = '#5865F2';
        });
        
        this.options.container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.options.container.style.borderColor = '';
        });
        
        this.options.container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.options.container.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.loadImageFromFile(e.dataTransfer.files[0]);
            }
        });
        
        this.options.container.addEventListener('click', () => {
            if (!this.image.src) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    if (e.target.files && e.target.files[0]) {
                        this.loadImageFromFile(e.target.files[0]);
                    }
                };
                input.click();
            }
        });
    }

    loadImage(url) {
        this.image.onload = () => {
            this.placeholder.style.display = 'none';
            this.calculateInitialCrop();
            this.draw();
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

    calculateInitialCrop() {
        const { width: imgWidth, height: imgHeight } = this.image;
        const { width: containerWidth, height: containerHeight } = this.options;
        
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
        const { width: containerWidth, height: containerHeight } = this.options;
        const { width: imgWidth, height: imgHeight } = this.image;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, containerWidth, containerHeight);
        
        // Calculate scaling factors to fit the image in the container
        const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);
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
        const { width: containerWidth, height: containerHeight } = this.options;
        const { width: imgWidth, height: imgHeight } = this.image;
        const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);
        
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
        const { width: containerWidth, height: containerHeight } = this.options;
        const { width: imgWidth, height: imgHeight } = this.image;
        const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);
        
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
        this.options.container.style.borderRadius = type === 'profile' ? '50%' : '8px';
        this.overlay.style.borderRadius = type === 'profile' ? '50%' : '0';
        
        if (this.image.src) {
            this.calculateInitialCrop();
            this.draw();
        }
    }
}

// Example usage:
// const imageCutter = new ImageCutter({
//     container: document.getElementById('image-cutter'),
//     type: 'profile', // or 'banner'
//     width: 300,
//     height: 300,
//     onCrop: (result) => {
//         console.log(result.dataUrl);
//     }
// });

export default ImageCutter;
