class FileUploadHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.currentFileUploads = [];
        this.currentFileUpload = null;
        this.currentModalFile = null;
    }

    handleFileSelection(file) {
        console.log('🔥 Handling file selection');
        
        if (!this.chatSection.fileUploadInput) {
            console.error('File upload input not found');
            return;
        }

        const files = this.chatSection.fileUploadInput.files;
        if (!files || files.length === 0) {
            console.log('No files selected');
            return;
        }

        const fileUploadArea = document.getElementById('file-upload-area');
        const fileUploadList = document.getElementById('file-upload-list');
        const fileCount = document.getElementById('file-count');
        
        if (!fileUploadArea || !fileUploadList) {
            console.error('File upload area elements not found');
            return;
        }

        fileUploadList.innerHTML = '';
        this.currentFileUploads = [];

        Array.from(files).forEach((file, index) => {
            if (file.size > (50 * 1024 * 1024)) {
                this.chatSection.showNotification(`File ${file.name} is too large. Maximum size is 50MB`, 'error');
                return;
            }

            const fileData = {
                name: file.name,        
                size: file.size,
                type: file.type,
                file: file,
                url: null,
                index: index
            };

            this.currentFileUploads.push(fileData);
            this.createFileCard(fileData, index);

            if (file.type.startsWith('image/')) {
                this.loadImagePreview(file, index);
            } else if (file.type.startsWith('text/') || this.isTextFile(file.name)) {
                this.loadTextPreview(file, index);
            }
        });

        if (this.currentFileUploads.length > 0) {
            fileUploadArea.classList.remove('hidden');
            fileCount.textContent = `${this.currentFileUploads.length} file${this.currentFileUploads.length !== 1 ? 's' : ''}`;
        }

        this.chatSection.updateSendButton();
        console.log('✅ File selection handled:', this.currentFileUploads.length, 'files');
    }

    createFileCard(fileData, index) {
        const fileUploadList = document.getElementById('file-upload-list');
        if (!fileUploadList) return;

        const card = document.createElement('div');
        card.className = 'file-upload-card bg-[#36393f] rounded-lg p-2 flex flex-col items-center gap-2 transition-all duration-200 hover:bg-[#42464d] relative group';
        card.style.width = '120px';
        card.style.minHeight = '120px';
        card.dataset.fileIndex = index;
        card.id = `file-card-${index}`;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'w-12 h-12 rounded-lg overflow-hidden bg-[#2b2d31] flex items-center justify-center flex-shrink-0';
        
        const icon = this.getFileIcon(fileData.type, fileData.name);
        iconContainer.innerHTML = icon;
        
        if (fileData.type.startsWith('image/')) {
            iconContainer.id = `file-icon-${index}`;
        }

        const fileName = document.createElement('div');
        fileName.className = 'text-[#f2f3f5] font-medium text-xs text-center leading-tight';
        fileName.style.wordBreak = 'break-word';
        fileName.style.lineHeight = '1.2';
        fileName.style.maxHeight = '2.4em';
        fileName.style.overflow = 'hidden';
        fileName.style.display = '-webkit-box';
        fileName.style.webkitLineClamp = '2';
        fileName.style.webkitBoxOrient = 'vertical';
        fileName.textContent = fileData.name;
        fileName.title = fileData.name;

        const fileSize = document.createElement('div');
        fileSize.className = 'text-[#b5bac1] text-xs text-center';
        fileSize.textContent = this.formatFileSize(fileData.size);

        // Action buttons (overlay)
        const actionButtons = document.createElement('div');
        actionButtons.className = 'absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200';

        const previewBtn = document.createElement('button');
        previewBtn.className = 'file-preview-btn w-6 h-6 bg-[#5865f2] hover:bg-[#4752c4] rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg';
        previewBtn.dataset.action = 'preview';
        previewBtn.dataset.fileIndex = index;
        previewBtn.title = 'Preview';
        previewBtn.innerHTML = '<i class="fas fa-eye text-xs"></i>';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove-btn w-6 h-6 bg-[#ed4245] hover:bg-[#dc2626] rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg';
        removeBtn.dataset.action = 'remove';
        removeBtn.dataset.fileIndex = index;
        removeBtn.title = 'Remove';
        removeBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';

        actionButtons.appendChild(previewBtn);
        actionButtons.appendChild(removeBtn);

        card.appendChild(iconContainer);
        card.appendChild(fileName);
        card.appendChild(fileSize);
        card.appendChild(actionButtons);
        fileUploadList.appendChild(card);

        this.addFileCardEventListeners(card, index);
    }

    getFileIcon(mimeType, fileName) {
        const isImage = mimeType.startsWith('image/');
        const isVideo = mimeType.startsWith('video/');
        const isAudio = mimeType.startsWith('audio/');
        const isPdf = mimeType === 'application/pdf';
        const isText = mimeType.startsWith('text/') || this.isTextFile(fileName);
        const isDoc = this.isDocFile(mimeType);
        const isExcel = this.isExcelFile(mimeType);

        if (isImage) {
            return '<i class="fas fa-image text-[#5865f2] text-xl"></i>';
        } else if (isVideo) {
            return '<i class="fas fa-play text-[#5865f2] text-xl"></i>';
        } else if (isAudio) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#7289da] flex items-center justify-center"><i class="fas fa-music text-white text-xl"></i></div>';
        } else if (isPdf) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#dc2626] to-[#ef4444] flex items-center justify-center"><i class="fas fa-file-pdf text-white text-xl"></i></div>';
        } else if (isText) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center"><i class="fas fa-file-text text-white text-xl"></i></div>';
        } else if (isDoc) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center"><i class="fas fa-file-word text-white text-xl"></i></div>';
        } else if (isExcel) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center"><i class="fas fa-file-excel text-white text-xl"></i></div>';
        } else {
            return '<i class="fas fa-file text-[#b5bac1] text-xl"></i>';
        }
    }

    isTextFile(fileName) {
        const textExtensions = ['txt', 'md', 'log', 'json', 'xml', 'csv', 'js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h'];
        const ext = fileName.split('.').pop().toLowerCase();
        return textExtensions.includes(ext);
    }

    isDocFile(mimeType) {
        return ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType);
    }

    isExcelFile(mimeType) {
        return ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType);
    }

    loadImagePreview(file, index) {
        const iconContainer = document.getElementById(`file-icon-${index}`);
        if (!iconContainer) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            iconContainer.style.backgroundImage = `url(${e.target.result})`;
            iconContainer.style.backgroundSize = 'cover';
            iconContainer.style.backgroundPosition = 'center';
            iconContainer.innerHTML = '';
        };
        reader.readAsDataURL(file);
    }

    addFileCardEventListeners(card, index) {
        const actionButtons = card.querySelectorAll('[data-action]');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const action = btn.dataset.action;
                const fileIndex = parseInt(btn.dataset.fileIndex);
                
                console.log('File action:', action, 'Index:', fileIndex);
                this.handleFileAction(action, fileIndex);
            });
        });
    }

    loadTextPreview(file, index) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const previewElement = document.getElementById(`file-preview-${index}`);
            if (previewElement) {
                const lines = content.split('\n').slice(0, 8);
                const preview = lines.map(line => line.length > 50 ? line.substring(0, 50) + '...' : line).join('\n');
                previewElement.textContent = preview;
            }
        };
        reader.readAsText(file);
    }

    setupFilePreviewEventListeners() {
        console.log('🔧 Setting up file preview event listeners');
        
        // Clear all files button
        const clearAllBtn = document.getElementById('clear-all-files');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                console.log('Clear all files clicked');
                this.removeAllFiles();
            });
        }

        // Modal event listeners
        if (this.chatSection.filePreviewModal) {
            console.log('Setting up modal event listeners');
            
            const closeBtn = this.chatSection.filePreviewModal.querySelector('#modal-close');
            const downloadBtn = this.chatSection.filePreviewModal.querySelector('#modal-download');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    console.log('Close button clicked');
                    this.closeFileModal();
                });
            }
            
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    console.log('Download button clicked');
                    this.downloadCurrentFile();
                });
            }

            // Close on background click
            this.chatSection.filePreviewModal.addEventListener('click', (e) => {
                if (e.target === this.chatSection.filePreviewModal) {
                    console.log('Modal background clicked');
                    this.closeFileModal();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !this.chatSection.filePreviewModal.classList.contains('opacity-0')) {
                    console.log('Escape key pressed');
                    this.closeFileModal();
                }
            });
        } else {
            console.error('File preview modal not found');
        }
        
        console.log('✅ File preview event listeners set up');
    }

    removeAllFiles() {
        console.log('🗑️ Removing all files');
        
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileUploadList = document.getElementById('file-upload-list');
        
        if (fileUploadList) {
            fileUploadList.innerHTML = '';
        }
        
        this.currentFileUploads = [];
        
        if (fileUploadArea) {
            fileUploadArea.classList.add('hidden');
        }
        
        if (this.chatSection.fileUploadInput) {
            this.chatSection.fileUploadInput.value = '';
        }
        
        this.chatSection.updateSendButton();
        console.log('✅ All files removed');
    }

    handleFileAction(action, fileIndex) {
        const fileData = this.currentFileUploads[fileIndex];
        if (!fileData) {
            console.error('File data not found for index:', fileIndex);
            return;
        }

        console.log('🎯 Handling file action:', action, 'for file:', fileData.name);

        switch (action) {
            case 'preview':
                this.openFilePreviewModal(fileData, fileIndex);
                break;
            case 'edit':
                this.editFile(fileData, fileIndex);
                break;
            case 'remove':
                this.removeFileFromUpload(fileIndex);
                break;
        }
    }

    openFilePreviewModal(fileData, fileIndex) {
        console.log('🎭 Opening file preview modal for:', fileData.name);
        
        if (!this.chatSection.filePreviewModal) {
            console.error('File preview modal not found');
            return;
        }

        const modal = this.chatSection.filePreviewModal;
        const modalContainer = modal.querySelector('#modal-container');
        const modalTitle = modal.querySelector('#modal-title');
        const modalContent = modal.querySelector('#modal-content');
        const modalFileIcon = modal.querySelector('#modal-file-icon');
        const modalFileInfo = modal.querySelector('#modal-file-info');
        const modalFooter = modal.querySelector('#modal-footer');
        
        if (!modalTitle || !modalContent) {
            console.error('Modal elements not found');
            return;
        }

        // Set file info
        modalTitle.textContent = fileData.name;
        modalFileIcon.innerHTML = this.getFileIcon(fileData.type, fileData.name).replace('text-xl', 'text-lg');
        
        if (modalFileInfo) {
            modalFileInfo.textContent = `${this.formatFileSize(fileData.size)} • ${fileData.type || 'Unknown type'}`;
        }

        // Clear content
        modalContent.innerHTML = '<div class="flex items-center justify-center h-64 text-[#b5bac1]"><div class="text-center"><i class="fas fa-spinner fa-spin text-3xl mb-2"></i><div>Loading...</div></div></div>';

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.remove('opacity-0', 'invisible');
            modal.classList.add('opacity-100', 'visible');
            modalContainer.classList.remove('scale-95');
            modalContainer.classList.add('scale-100');
        }, 10);

        // Load content based on file type
        this.loadModalContent(fileData, modalContent, modalFooter);
        
        this.currentModalFile = fileData;
        console.log('✅ Modal opened successfully');
    }

    loadModalContent(fileData, modalContent, modalFooter) {
        const isImage = fileData.type.startsWith('image/');
        const isVideo = fileData.type.startsWith('video/');
        const isAudio = fileData.type.startsWith('audio/');
        const isPdf = fileData.type === 'application/pdf';
        const isText = fileData.type.startsWith('text/') || this.isTextFile(fileData.name);

        if (isImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalContent.innerHTML = `
                    <div class="flex items-center justify-center min-h-64">
                        <img src="${e.target.result}" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" alt="${fileData.name}">
                    </div>
                `;
            };
            reader.readAsDataURL(fileData.file);
        } else if (isVideo) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalContent.innerHTML = `
                    <div class="flex items-center justify-center min-h-64">
                        <video controls class="max-w-full max-h-[70vh] rounded-lg shadow-lg" src="${e.target.result}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            };
            reader.readAsDataURL(fileData.file);
        } else if (isAudio) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-64 p-8">
                        <div class="w-32 h-32 bg-gradient-to-br from-[#5865f2] to-[#7289da] rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <i class="fas fa-music text-white text-4xl"></i>
                        </div>
                        <div class="text-center mb-6">
                            <h3 class="text-[#f2f3f5] font-semibold text-lg mb-2">${fileData.name}</h3>
                            <p class="text-[#b5bac1] text-sm">${this.formatFileSize(fileData.size)}</p>
                        </div>
                        <audio controls class="w-full max-w-md" src="${e.target.result}">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                `;
            };
            reader.readAsDataURL(fileData.file);
        } else if (isText) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lineCount = content.split('\n').length;
                modalContent.innerHTML = `
                    <div class="space-y-4">
                        <div class="flex items-center justify-between text-sm text-[#b5bac1] border-b border-[#3f4147] pb-2">
                            <span>${lineCount} lines</span>
                            <span>${fileData.type || 'Plain text'}</span>
                        </div>
                        <pre class="bg-[#1e1f22] p-4 rounded-lg text-[#dcddde] text-sm font-mono whitespace-pre-wrap max-h-96 overflow-auto border border-[#3f4147]">${content}</pre>
                    </div>
                `;
            };
            reader.readAsText(fileData.file);
        } else {
            const icon = this.getFileIcon(fileData.type, fileData.name);
            modalContent.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-64 p-8 text-center">
                    <div class="w-24 h-24 mb-6 flex items-center justify-center">
                        ${icon.replace('text-xl', 'text-5xl')}
                    </div>
                    <h3 class="text-[#f2f3f5] font-semibold text-lg mb-2">${fileData.name}</h3>
                    <p class="text-[#b5bac1] mb-4">${this.formatFileSize(fileData.size)}</p>
                    <p class="text-[#b5bac1] text-sm mb-6">Preview not available for this file type</p>
                    <button class="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors duration-200" onclick="window.chatSection.downloadCurrentFile()">
                        <i class="fas fa-download mr-2"></i>Download File
                    </button>
                </div>
            `;
            
            if (modalFooter) {
                modalFooter.classList.remove('hidden');
            }
        }
    }

    editFile(fileData, fileIndex) {
        console.log('Edit file:', fileData.name);
    }

    removeFileFromUpload(fileIndex) {
        console.log('🗑️ Removing file at index:', fileIndex);
        
        const fileUploadList = document.getElementById('file-upload-list');
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileCount = document.getElementById('file-count');
        
        if (fileUploadList) {
            const card = fileUploadList.querySelector(`[data-file-index="${fileIndex}"]`);
            if (card) {
                card.remove();
                console.log('File card removed from DOM');
            }
        }

        // Remove from array
        this.currentFileUploads.splice(fileIndex, 1);
        
        // Update indices for remaining cards
        const remainingCards = fileUploadList.querySelectorAll('.file-upload-card');
        remainingCards.forEach((card, newIndex) => {
            card.dataset.fileIndex = newIndex;
            card.id = `file-card-${newIndex}`;
            
            // Update all buttons in this card
            card.querySelectorAll('[data-file-index]').forEach(btn => {
                btn.dataset.fileIndex = newIndex;
            });
            
            // Update icon ID for images
            const iconContainer = card.querySelector('[id^="file-icon-"]');
            if (iconContainer) {
                iconContainer.id = `file-icon-${newIndex}`;
            }
        });

        // Update UI
        if (this.currentFileUploads.length === 0) {
            fileUploadArea.classList.add('hidden');
            if (this.chatSection.fileUploadInput) {
                this.chatSection.fileUploadInput.value = '';
            }
        } else {
            fileCount.textContent = `${this.currentFileUploads.length} file${this.currentFileUploads.length !== 1 ? 's' : ''}`;
        }

        this.chatSection.updateSendButton();
        console.log('✅ File removed. Remaining files:', this.currentFileUploads.length);
    }

    closeFileModal() {
        console.log('🎭 Closing file modal');
        if (this.chatSection.filePreviewModal) {
            const modal = this.chatSection.filePreviewModal;
            const modalContainer = modal.querySelector('#modal-container');
            
            modal.classList.remove('opacity-100', 'visible');
            modal.classList.add('opacity-0', 'invisible');
            modalContainer.classList.remove('scale-100');
            modalContainer.classList.add('scale-95');
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
            
            this.currentModalFile = null;
            console.log('✅ Modal closed');
        } else {
            console.error('File preview modal not found');
        }
    }

    downloadCurrentFile() {
        if (this.currentModalFile) {
            const url = URL.createObjectURL(this.currentModalFile.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentModalFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
    
    removeFileUpload() {
        this.currentFileUpload = null;
        this.currentFileUploads = [];
        
        const filePreview = document.getElementById('file-preview');
        const fileUpload = document.getElementById('file-upload');
        const previewsContainer = document.getElementById('file-previews-container');
        
        if (filePreview) filePreview.classList.add('hidden');
        if (fileUpload) fileUpload.value = '';
        if (previewsContainer) previewsContainer.innerHTML = '';
        
        this.chatSection.updateSendButton();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getFileTypeIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-file-image';
        if (mimeType.startsWith('video/')) return 'fas fa-file-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-file-audio';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'fas fa-file-archive';
        if (mimeType.includes('text/')) return 'fas fa-file-alt';
        if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('css')) return 'fas fa-file-code';
        
        return 'fas fa-file';
    }

    hasFiles() {
        return this.currentFileUploads && this.currentFileUploads.length > 0;
    }
}

export default FileUploadHandler; 