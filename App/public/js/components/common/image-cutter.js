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
        this.isActive = false;
        this.modal = null;
        this.scale = 1;
        this.imageOffset = { x: 0, y: 0 };
        this.sizeSlider = null;
        this.sizeValueDisplay = null;
        this.originalImageData = null;

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
                    } else if (this.options.fileInputSelector) {
                        const fileInput = document.querySelector(this.options.fileInputSelector);
                        if (fileInput) {
                            fileInput.click();
                        }
                    }
                } catch (error) {
                    console.error('Error in container click handler:', error);
                }
            });
        } catch (error) {
            console.error('Error initializing ImageCutter:', error);
        }
    }

    createSliderControls() {
        const controlsSection = document.createElement('div');
        controlsSection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #36393f;
            border-radius: 6px;
        `;
        
        const infoText = document.createElement('span');
        infoText.style.cssText = `
            color: #b9bbbe;
            font-size: 14px;
            text-align: center;
        `;
        infoText.textContent = this.options.type === 'profile' 
            ? 'Drag to move • Use slider to resize • 1:1 aspect ratio' 
            : 'Drag to move • Use slider to resize • 2:1 aspect ratio';
        controlsSection.appendChild(infoText);

        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            color: #b9bbbe;
            font-size: 14px;
            visibility: visible;
            opacity: 1;
            width: 100%;
        `;

        const sliderLabel = document.createElement('span');
        sliderLabel.textContent = 'Size:';
        sliderLabel.style.minWidth = '40px';
        sliderContainer.appendChild(sliderLabel);

        this.sizeSlider = document.createElement('input');
        this.sizeSlider.type = 'range';
        this.sizeSlider.min = '20';
        this.sizeSlider.max = '100';
        this.sizeSlider.value = '70';
        this.sizeSlider.style.cssText = `
            flex: 1;
            height: 6px;
            background: #40444b;
            border-radius: 3px;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            display: block;
            visibility: visible;
        `;

        this.ensureSliderStyles();

        this.sizeSlider.addEventListener('input', (e) => {
            this.updateCropSize(parseInt(e.target.value));
        });

        sliderContainer.appendChild(this.sizeSlider);

        const sliderValue = document.createElement('span');
        sliderValue.textContent = '70%';
        sliderValue.style.minWidth = '40px';
        sliderValue.style.textAlign = 'right';
        this.sizeValueDisplay = sliderValue;
        sliderContainer.appendChild(sliderValue);

        controlsSection.appendChild(sliderContainer);
        
        return controlsSection;
    }

    ensureSliderStyles() {
        if (document.getElementById('image-cutter-slider-styles')) {
            return;
        }

        const sliderStyle = document.createElement('style');
        sliderStyle.id = 'image-cutter-slider-styles';
        sliderStyle.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #5865f2;
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            }
            input[type="range"]::-webkit-slider-thumb:hover {
                background: #4752c4;
                transform: scale(1.1);
            }
            input[type="range"]::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #5865f2;
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                border: none;
            }
            input[type="range"]::-moz-range-thumb:hover {
                background: #4752c4;
                transform: scale(1.1);
            }
            @media (max-width: 768px) {
                input[type="range"]::-webkit-slider-thumb {
                    height: 24px;
                    width: 24px;
                }
                input[type="range"]::-moz-range-thumb {
                    height: 24px;
                    width: 24px;
                }
                .image-cutter-overlay {
                    touch-action: pan-x pan-y;
                }
            }
            @media (max-width: 480px) {
                .image-cutter-modal {
                    padding: 5px !important;
                }
                .image-cutter-modal-content {
                    border-radius: 6px !important;
                }
            }
        `;
        document.head.appendChild(sliderStyle);
    }

    createModal() {
        try {
            let existingModal = document.getElementById('image-cutter-modal');
            if (existingModal) {
                this.modal = existingModal;
                this.initializeSliderIfMissing();
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
                padding: 10px;
                backdrop-filter: blur(5px);
                box-sizing: border-box;
            `;

            const modalContent = document.createElement('div');
            modalContent.className = 'image-cutter-modal-content';
            
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            
            let maxWidth = '90vw';
            let padding = '16px';
            if (vw > 768) {
                maxWidth = '700px';
                padding = '24px';
            } else if (vw > 480) {
                maxWidth = '95vw';
                padding = '20px';
            }
            
            modalContent.style.cssText = `
                background-color: #2f3136;
                border-radius: 8px;
                padding: ${padding};
                width: 100%;
                max-width: ${maxWidth};
                max-height: 95vh;
                position: relative;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                box-sizing: border-box;
                overflow-y: auto;
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
            
            let titleFontSize = '18px';
            if (vw > 768) {
                titleFontSize = '20px';
            }
            
            modalTitle.style.cssText = `
                color: #fff;
                margin: 0;
                font-size: ${titleFontSize};
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
            
            let containerHeight = '400px';
            if (vh > 800) {
                containerHeight = '500px';
            } else if (vh > 600) {
                containerHeight = '350px';
            } else {
                containerHeight = '250px';
            }
            
            this.cutterContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: ${containerHeight};
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

            const controlsSection = this.createSliderControls();
            modalContent.appendChild(controlsSection);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            `;
            
            let buttonPadding = '10px 16px';
            let buttonFontSize = '14px';
            if (vw > 768) {
                buttonPadding = '12px 20px';
            } else if (vw <= 480) {
                buttonPadding = '8px 12px';
                buttonFontSize = '13px';
            }
            
            this.cancelButton = document.createElement('button');
            this.cancelButton.textContent = 'Cancel';
            this.cancelButton.style.cssText = `
                background-color: transparent;
                color: #b9bbbe;
                border: 1px solid #4f545c;
                border-radius: 4px;
                padding: ${buttonPadding};
                cursor: pointer;
                font-size: ${buttonFontSize};
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
                padding: ${buttonPadding};
                cursor: pointer;
                font-size: ${buttonFontSize};
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

    initializeSliderIfMissing() {
        if (!this.sizeSlider || !this.sizeSlider.parentElement) {
            const modalContent = this.modal.querySelector('.image-cutter-modal-content');
            if (modalContent) {
                const existingControls = modalContent.querySelector('.image-cutter-container').nextElementSibling;
                if (existingControls && existingControls.querySelector('input[type="range"]')) {
                    this.sizeSlider = existingControls.querySelector('input[type="range"]');
                    this.sizeValueDisplay = existingControls.querySelector('span:last-child');
                } else {
                    const cutterContainer = modalContent.querySelector('.image-cutter-container');
                    const buttonContainer = modalContent.querySelector('div:last-child');
                    if (cutterContainer && buttonContainer) {
                        const controlsSection = this.createSliderControls();
                        modalContent.insertBefore(controlsSection, buttonContainer);
                    }
                }
            }
        }
    }

    updateCropSize(percentage) {
        if (!this.image || !this.image.complete) return;
        
        const { width: imgWidth, height: imgHeight } = this.image;
        const scale = percentage / 100;
        
        let newWidth, newHeight;
        
        if (this.options.type === 'profile') {
            const maxSize = Math.min(imgWidth, imgHeight);
            newWidth = newHeight = maxSize * scale;
        } else {
            const maxSize = Math.min(imgWidth, imgHeight * 2);
            newWidth = maxSize * scale;
            newHeight = newWidth / 2;
        }
        
        const centerX = this.cropArea.x + this.cropArea.width / 2;
        const centerY = this.cropArea.y + this.cropArea.height / 2;
        
        this.cropArea = {
            x: Math.max(0, Math.min(imgWidth - newWidth, centerX - newWidth / 2)),
            y: Math.max(0, Math.min(imgHeight - newHeight, centerY - newHeight / 2)),
            width: newWidth,
            height: newHeight
        };
        
        this.updateCropOverlay();
        
        if (this.sizeValueDisplay) {
            this.sizeValueDisplay.textContent = percentage + '%';
        }
    }

    attachEventListeners() {
        this.overlay.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));

        this.overlay.addEventListener('touchstart', this.startDrag.bind(this));
        document.addEventListener('touchmove', this.onDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));

        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        if (this.isActive && this.image.src) {
            this.updateImageDisplay();
            this.updateModalResponsiveness();
        }
    }

    updateModalResponsiveness() {
        if (!this.modal || !this.isActive) return;
        
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        
        const modalContent = this.modal.querySelector('.image-cutter-modal-content');
        if (modalContent) {
            let maxWidth = '90vw';
            let padding = '16px';
            if (vw > 768) {
                maxWidth = '700px';
                padding = '24px';
            } else if (vw > 480) {
                maxWidth = '95vw';
                padding = '20px';
            }
            
            modalContent.style.maxWidth = maxWidth;
            modalContent.style.padding = padding;
        }
        
        if (this.cutterContainer) {
            let containerHeight = '400px';
            if (vh > 800) {
                containerHeight = '500px';
            } else if (vh > 600) {
                containerHeight = '350px';
            } else {
                containerHeight = '250px';
            }
            this.cutterContainer.style.height = containerHeight;
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
                this.recreateModalContent();
            }
            
            if (!this.cutterContainer) {
                console.error('Could not create cutter container');
                this.hideModal();
                return;
            }
            
            this.initializeSliderIfMissing();
            
            this.updateImageDisplay();
            this.attachEventListeners();
            
            this.initializeSliderValue();
            
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error showing modal:', error);
            this.cleanupFailedModal();
        }
    }

    initializeSliderValue() {
        if (this.sizeSlider && this.image && this.image.complete) {
            const { width: imgWidth, height: imgHeight } = this.image;
            const maxSize = this.options.type === 'profile' ? Math.min(imgWidth, imgHeight) : Math.min(imgWidth, imgHeight * 2);
            const currentSize = this.options.type === 'profile' ? this.cropArea.width : this.cropArea.width;
            const percentage = Math.round((currentSize / maxSize) * 100);
            this.sizeSlider.value = percentage;
            if (this.sizeValueDisplay) {
                this.sizeValueDisplay.textContent = percentage + '%';
            }
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

    getCroppedImage() {
        return new Promise((resolve) => {
            const { x, y, width, height } = this.cropArea;
            
            try {
                const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <defs>
                        <clipPath id="crop-path">
                            <rect x="0" y="0" width="${width}" height="${height}"/>
                        </clipPath>
                    </defs>
                    <image href="${this.image.src}" x="${-x}" y="${-y}" width="${this.image.width}" height="${this.image.height}" clip-path="url(#crop-path)" preserveAspectRatio="none"/>
                </svg>`;
                
                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const svgImage = new Image();
                svgImage.crossOrigin = "anonymous";
                
                svgImage.onload = () => {
                    URL.revokeObjectURL(url);
                    
                    const hiddenImg = document.createElement('img');
                    hiddenImg.style.cssText = `
                        position: absolute;
                        left: -10000px;
                        top: -10000px;
                        width: ${width}px;
                        height: ${height}px;
                    `;
                    hiddenImg.crossOrigin = "anonymous";
                    
                    hiddenImg.onload = () => {
                        document.body.appendChild(hiddenImg);
                        
                        setTimeout(() => {
                            try {
                                const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                                    <foreignObject width="100%" height="100%">
                                        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:url('${this.image.src}') ${-x}px ${-y}px no-repeat;background-size:${this.image.width}px ${this.image.height}px;"></div>
                                    </foreignObject>
                                </svg>`;
                                
                                const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(finalSvg);
                                
                                document.body.removeChild(hiddenImg);
                                
                                resolve({
                                    dataUrl: dataUrl,
                                    width: width,
                                    height: height
                                });
                            } catch (error) {
                                console.error('Error generating final image:', error);
                                document.body.removeChild(hiddenImg);
                                resolve({
                                    dataUrl: this.image.src,
                                    width: this.image.width,
                                    height: this.image.height
                                });
                            }
                        }, 50);
                    };
                    
                    hiddenImg.onerror = () => {
                        resolve({
                            dataUrl: this.image.src,
                            width: this.image.width,
                            height: this.image.height
                        });
                    };
                    
                    hiddenImg.src = url;
                };
                
                svgImage.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve({
                        dataUrl: this.image.src,
                        width: this.image.width,
                        height: this.image.height
                    });
                };
                
                svgImage.src = url;
                
            } catch (error) {
                console.error('Error in getCroppedImage:', error);
                resolve({
                    dataUrl: this.image.src,
                    width: this.image.width,
                    height: this.image.height
                });
            }
        });
    }

    getBlob(callback) {
        this.getCroppedImage().then(result => {
            fetch(result.dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const pngBlob = new Blob([blob], { type: 'image/png' });
                    callback(pngBlob);
                })
                .catch(error => {
                    console.error('Error converting to blob:', error);
                    const emptyBlob = new Blob([], { type: 'image/png' });
                    callback(emptyBlob);
                });
        });
    }

    applyCrop() {
        this.getCroppedImage().then(result => {
            if (this.options.onCrop) {
                this.options.onCrop(result);
            }
            
            const event = new CustomEvent('imageCropComplete', {
                detail: { dataUrl: result.dataUrl }
            });
            this.options.container.dispatchEvent(event);
            
            this.hideModal();
        });
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
        this.isDragging = true;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        this.dragStart = {
            x: clientX,
            y: clientY,
            cropX: this.cropArea.x,
            cropY: this.cropArea.y
        };
        
        this.overlay.style.borderColor = '#00d4aa';
        e.preventDefault();
    }

    onDrag(e) {
        if (!this.isDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const deltaX = (clientX - this.dragStart.x) / this.scale;
        const deltaY = (clientY - this.dragStart.y) / this.scale;
        
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
        this.isDragging = false;
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
            this.sizeSlider = null;
            this.sizeValueDisplay = null;
            
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

    setType(type) {
        if (type !== 'profile' && type !== 'banner') {
            console.error('Invalid type. Must be "profile" or "banner"');
            return;
        }
        
        this.options.type = type;
        
        if (this.overlay) {
            this.overlay.style.borderRadius = type === 'profile' ? '50%' : '0';
        }
        
        const infoText = this.modal?.querySelector('.image-cutter-modal-content span');
        if (infoText) {
            infoText.textContent = type === 'profile' 
                ? 'Drag to move • Use slider to resize • 1:1 aspect ratio' 
                : 'Drag to move • Use slider to resize • 2:1 aspect ratio';
        }
        
        if (this.image.src) {
            this.calculateInitialCrop();
            this.updateImageDisplay();
            this.initializeSliderValue();
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
            
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            
            const modalContent = document.createElement('div');
            modalContent.className = 'image-cutter-modal-content';
            
            let maxWidth = '90vw';
            let padding = '16px';
            if (vw > 768) {
                maxWidth = '700px';
                padding = '24px';
            } else if (vw > 480) {
                maxWidth = '95vw';
                padding = '20px';
            }
            
            modalContent.style.cssText = `
                background-color: #2f3136;
                border-radius: 8px;
                padding: ${padding};
                width: 100%;
                max-width: ${maxWidth};
                max-height: 95vh;
                position: relative;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                box-sizing: border-box;
                overflow-y: auto;
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
            
            let titleFontSize = '18px';
            if (vw > 768) {
                titleFontSize = '20px';
            }
            
            modalTitle.style.cssText = `
                color: #fff;
                margin: 0;
                font-size: ${titleFontSize};
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
            
            let containerHeight = '400px';
            if (vh > 800) {
                containerHeight = '500px';
            } else if (vh > 600) {
                containerHeight = '350px';
            } else {
                containerHeight = '250px';
            }
            
            this.cutterContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: ${containerHeight};
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

            const controlsSection = this.createSliderControls();
            modalContent.appendChild(controlsSection);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            `;
            
            let buttonPadding = '10px 16px';
            let buttonFontSize = '14px';
            if (vw > 768) {
                buttonPadding = '12px 20px';
            } else if (vw <= 480) {
                buttonPadding = '8px 12px';
                buttonFontSize = '13px';
            }
            
            this.cancelButton = document.createElement('button');
            this.cancelButton.textContent = 'Cancel';
            this.cancelButton.style.cssText = `
                background-color: transparent;
                color: #b9bbbe;
                border: 1px solid #4f545c;
                border-radius: 4px;
                padding: ${buttonPadding};
                cursor: pointer;
                font-size: ${buttonFontSize};
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
                padding: ${buttonPadding};
                cursor: pointer;
                font-size: ${buttonFontSize};
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
        } catch (error) {
            console.error('Error recreating modal content:', error);
        }
    }

    testBannerSlider() {
        return {
            type: this.options.type,
            sliderExists: !!this.sizeSlider,
            sliderVisible: this.sizeSlider ? this.sizeSlider.style.display !== 'none' : false,
            sliderValue: this.sizeSlider ? this.sizeSlider.value : null,
            modalActive: this.isActive,
            imageLoaded: this.image && this.image.complete,
            sliderParent: this.sizeSlider ? !!this.sizeSlider.parentElement : false,
            controlsSectionExists: !!document.querySelector('.image-cutter-modal-content')
        };
    }
}

export default ImageCutter;
