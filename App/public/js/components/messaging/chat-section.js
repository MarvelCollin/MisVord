import { showToast } from '../../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat section script loaded via DOM content loaded');
    if (!window.chatSection && !isExcludedPage()) {
        initializeChatSection();
    }
});

function isExcludedPage() {
    const pageType = document.body.getAttribute('data-page');
    return pageType === 'admin' || pageType === 'nitro';
}

function initializeChatSection() {
    if (typeof window.ChatAPI === 'undefined') {
        console.log('ChatAPI not ready, retrying...', {
            ChatAPI: typeof window.ChatAPI,
            chatAPI: typeof window.chatAPI,
            loadedScripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('chat-api'))
        });
        setTimeout(initializeChatSection, 100);
        return;
    }
    
    console.log('✅ Initializing ChatSection with ChatAPI ready');
    const chatSection = new ChatSection();
    chatSection.init();
    window.chatSection = chatSection;
    
    // Make sure emoji reactions system is initialized
    if (typeof window.emojiReactions === 'undefined' || !window.emojiReactions.initialized) {
        console.log('Ensuring emoji reactions system is initialized from ChatSection');
        if (typeof window.initializeEmojiReactions === 'function') {
            window.initializeEmojiReactions();
        }
    }
}

console.log('Chat section script immediate execution');
if (document.readyState === 'complete' && !window.chatSection && !isExcludedPage()) {
    setTimeout(() => {
        console.log('Chat section delayed initialization');
        initializeChatSection();
    }, 100);
}

class ChatSection {
    constructor() {
        this.chatMessages = null;
        this.messageInput = null;
        this.sendButton = null;
        this.fileUploadInput = null;
        this.fileUploadPreview = null;
        this.contextMenu = null;
        this.currentFileUpload = null;
        this.currentEditingMessage = null;
        this.activeReplyingTo = null;
        this.activeMessageActions = null;
        this.typingTimeout = null;
        this.lastTypingUpdate = 0;
        this.typingDebounceTime = 2000;
        this.messagesLoaded = false;
        this.processedMessageIds = new Set();
        this.socketListenersSetup = false;
        this.typingUsers = new Map();
        this.joinedRooms = new Set();
        
        this.chatType = null;
        this.targetId = null;
        this.userId = null;
        this.username = null;
        this.avatar_url = null;
        
        this.chatBot = null;
        
        this.loadChatParams();
    }
    
    init() {
        console.log('Initializing ChatSection');
        this.loadElements();
        
        if (!this.chatMessages) {
            console.warn('Chat messages element not found, aborting ChatSection initialization');
            return;
        }
        
        this.ensureChatContainerStructure();
        
        const paramsLoaded = this.loadChatParams();
        
        if (!paramsLoaded) {
            console.error('Failed to load chat parameters, cannot initialize chat');
            this.showErrorMessage('Failed to initialize chat. Missing required parameters.');
            return;
        }
        
        if (this.chatType === 'direct' && this.targetId) {
            console.log(`Checking if target ID ${this.targetId} is valid room ID for direct messages`);
        }
        
                 const existingMessages = this.chatMessages.querySelectorAll('.message-group');
         if (existingMessages.length > 0) {
             console.log('Messages already rendered by PHP, marking processed and setting up listeners');
             existingMessages.forEach(group => {
                 const messageElements = group.querySelectorAll('.message-content');
                 messageElements.forEach(msgEl => {
                     const messageId = msgEl.dataset.messageId;
                     if (messageId) {
                         this.processedMessageIds.add(messageId);
                         
                         // Ensure hover actions work on PHP-rendered messages
                         msgEl.addEventListener('mouseover', () => this.showMessageActions(msgEl));
                         msgEl.addEventListener('mouseout', (e) => {
                             const relatedTarget = e.relatedTarget;
                             if (!msgEl.contains(relatedTarget) && !relatedTarget?.closest('.message-actions')) {
                                 this.hideMessageActions(msgEl);
                             }
                         });
                         
                         // Setup action buttons
                         const actionsContainer = msgEl.querySelector('.message-actions');
                         if (actionsContainer) {
                             const reactionBtn = actionsContainer.querySelector('.message-action-reaction');
                             const replyBtn = actionsContainer.querySelector('.message-action-reply');
                             const editBtn = actionsContainer.querySelector('.message-action-edit');
                             const moreBtn = actionsContainer.querySelector('.message-action-more');
                             
                             if (reactionBtn) reactionBtn.addEventListener('click', () => this.showEmojiPicker(messageId, reactionBtn));
                             if (replyBtn) replyBtn.addEventListener('click', () => this.replyToMessage(messageId));
                             if (editBtn) editBtn.addEventListener('click', () => this.editMessage(messageId));
                             if (moreBtn) moreBtn.addEventListener('click', (e) => this.showContextMenu(e.clientX, e.clientY, msgEl));
                         }
                     }
                 });
             });
             this.messagesLoaded = true;
             this.scrollToBottom();
         } else {
             this.showLoadingSkeletons();
             setTimeout(() => {
                 this.loadMessages();
             }, 100);
         }
        
        this.setupEventListeners();
        this.setupIoListeners();
        
        if (window.ChatBot) {
            this.chatBot = new window.ChatBot(this);
            this.chatBot.init();
        } else {
            console.warn('⚠️ ChatBot component not available');
        }
        
        console.log('ChatSection initialization complete');
    }
    
    ensureChatContainerStructure() {
        if (!this.chatMessages) return;
        
        let messagesContainer = this.chatMessages.querySelector('.messages-container');
        
        if (!messagesContainer) {
            this.chatMessages.style.position = 'relative';
            this.chatMessages.style.display = 'flex';
            this.chatMessages.style.flexDirection = 'column';
            
            messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages-container flex-1';
            messagesContainer.style.position = 'relative';
            messagesContainer.style.zIndex = '10';
            
            this.chatMessages.appendChild(messagesContainer);
        }
        
        this.messagesContainer = messagesContainer;
        this.initializeSkeletonLoader();
    }
    
    loadElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.fileUploadInput = document.getElementById('file-upload');
        this.fileUploadPreview = document.getElementById('file-preview');
        this.contextMenu = document.getElementById('message-context-menu');
        
        if (!this.chatMessages) {
            console.error('Chat messages element not found');
        }
        
        if (!this.messageInput) {
            console.error('Message input not found');
        }
        
        if (!this.sendButton) {
            console.error('Send button not found');
        }
        
        if (!this.fileUploadInput) {
            console.error('File upload input not found');
        }
        
        if (!this.fileUploadPreview) {
            console.error('File preview not found');
        }
    }
    
    initializeSkeletonLoader() {
        if (window.ChatSkeletonLoader) {
            const container = this.getMessagesContainer();
            this.skeletonLoader = new window.ChatSkeletonLoader(container);
        }
    }
    
    loadChatParams() {
        this.chatType = document.querySelector('meta[name="chat-type"]')?.content || 'channel';
        this.targetId = document.querySelector('meta[name="chat-id"]')?.content;
        this.userId = document.querySelector('meta[name="user-id"]')?.content;
        this.username = document.querySelector('meta[name="username"]')?.content;
        
        console.log(`Chat parameters loaded: type=${this.chatType}, target_id=${this.targetId}, user_id=${this.userId}`);
        
        if (!this.targetId) {
            console.error('Missing targetId in chat parameters');
            return false;
        }
        
        if (!this.userId) {
            console.error('Missing userId in chat parameters');
            return false;
        }
        
        return true;
    }
    
    setupEventListeners() {
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                } else if (e.key === 'Escape' && this.chatBot) {
                    this.chatBot.hideTitiBotSuggestions();
                } else {
                    this.handleTyping();
                }
            });
            
            this.messageInput.addEventListener('input', () => {
                this.resizeTextarea();
                this.updateSendButton();
            });
        }
        
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        if (this.fileUploadInput) {
            this.fileUploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelection(file);
                }
            });
        }
        
        if (this.fileUploadPreview) {
            this.fileUploadPreview.addEventListener('click', () => {
                this.removeFileUpload();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target) && this.contextMenuVisible && !this.contextMenuJustOpened) {
                console.log('🖱️ Clicked outside context menu, hiding it');
                this.hideContextMenu();
            }
            
            if (!e.target.closest('.message-actions') && this.activeMessageActions) {
                this.hideAllMessageActions();
            }
        });

        if (!this.chatMessages) return;

        this.chatMessages.addEventListener('contextmenu', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (messageContent) {
                console.log('🖱️ Right-click detected on message:', {
                    messageId: messageContent.dataset.messageId,
                    userId: messageContent.dataset.userId,
                    clickX: e.clientX,
                    clickY: e.clientY,
                    target: e.target
                });
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, messageContent);
            }
        });
        
        this.chatMessages.addEventListener('mouseover', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (messageContent) {
                this.showMessageActions(messageContent);
            }
        });

        this.chatMessages.addEventListener('mouseout', (e) => {
            const messageContent = e.target.closest('.message-content');
            const relatedTarget = e.relatedTarget;
            
            if (messageContent && !messageContent.contains(relatedTarget) && 
                !relatedTarget?.closest('.message-actions')) {
                this.hideMessageActions(messageContent);
            }
        });
        
        this.chatMessages.addEventListener('click', (e) => {
            const reactionBtn = e.target.closest('.message-action-reaction');
            const replyBtn = e.target.closest('.message-action-reply');
            const editBtn = e.target.closest('.message-action-edit');
            const moreBtn = e.target.closest('.message-action-more');
            
            if (reactionBtn) {
                console.log('😀 Reaction button clicked');
                const messageContent = reactionBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                
                if (window.emojiSocketHandler && typeof window.emojiSocketHandler.showMenu === 'function') {
                    const rect = reactionBtn.getBoundingClientRect();
                    const x = rect.left + window.scrollX;
                    const y = rect.bottom + window.scrollY + 5;
                    window.emojiSocketHandler.showMenu(messageId, x, y);
                } else {
                    this.showEmojiPicker(messageId, reactionBtn);
                }
            } else if (replyBtn) {
                console.log('💬 Reply button clicked');
                const messageContent = replyBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.replyToMessage(messageId);
            } else if (editBtn) {
                console.log('✏️ Edit button clicked');
                const messageContent = editBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.editMessage(messageId);
            } else if (moreBtn) {
                console.log('⋯ Three-dot (More) button clicked!', {
                    messageId: moreBtn.closest('.message-content')?.dataset.messageId,
                    buttonRect: moreBtn.getBoundingClientRect(),
                    clickEvent: e
                });
                e.stopPropagation();
                const messageContent = moreBtn.closest('.message-content');
                const rect = moreBtn.getBoundingClientRect();
                console.log('📍 Positioning context menu at:', {
                    x: rect.left,
                    y: rect.bottom + 5,
                    messageContent: messageContent
                });
                this.showContextMenu(rect.left, rect.bottom + 5, messageContent);
            }
        });
    }

    showContextMenu(x, y, messageContent) {
        console.log('🎯 showContextMenu called with:', {
            x, y,
            messageId: messageContent?.dataset.messageId,
            contextMenuExists: !!this.contextMenu,
            contextMenuVisible: this.contextMenuVisible
        });
        
        if (!this.contextMenu) {
            console.error('❌ Context menu element not found!');
            return;
        }
        
        const messageId = messageContent.dataset.messageId || '';
        const isOwnMessage = messageContent.dataset.userId === this.userId;

        // If same message menu is already visible, don't hide it immediately
        if (this.contextMenuVisible && this.contextMenu.dataset.messageId === messageId) {
            console.log('🔄 Same message context menu already visible, keeping it open');
            return;
        }
        
        console.log('👤 Message ownership check:', {
            messageUserId: messageContent.dataset.userId,
            currentUserId: this.userId,
            isOwnMessage: isOwnMessage
        });
        
        this.hideContextMenu();

        // Position menu at click location
        this.contextMenu.style.position = 'fixed';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.transform = 'none';
        this.contextMenu.style.zIndex = '2000';
        this.contextMenu.style.minWidth = '200px';
        
        console.log('📏 Context menu positioning:', {
            position: this.contextMenu.style.position,
            left: this.contextMenu.style.left,
            top: this.contextMenu.style.top,
            zIndex: this.contextMenu.style.zIndex
        });
        
        this.contextMenu.classList.remove('hidden');
        this.contextMenu.dataset.messageId = messageId;
        this.contextMenuVisible = true;
        
        // Ensure menu stays within viewport AFTER it's visible
        setTimeout(() => {
            const rect = this.contextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            console.log('📐 Viewport boundary check:', {
                menuRect: rect,
                viewportWidth,
                viewportHeight,
                wouldGoOffRight: x + rect.width > viewportWidth,
                wouldGoOffBottom: y + rect.height > viewportHeight
            });
            
            // Adjust horizontal position if menu goes off right edge
            if (x + rect.width > viewportWidth) {
                this.contextMenu.style.left = `${viewportWidth - rect.width - 10}px`;
                console.log('🔧 Adjusted horizontal position to:', this.contextMenu.style.left);
            }
            
            // Adjust vertical position if menu goes off bottom edge
            if (y + rect.height > viewportHeight) {
                this.contextMenu.style.top = `${y - rect.height}px`;
                console.log('🔧 Adjusted vertical position to:', this.contextMenu.style.top);
            }
        }, 10);
        
        console.log('✅ Context menu should now be visible:', {
            hasHiddenClass: this.contextMenu.classList.contains('hidden'),
            messageId: this.contextMenu.dataset.messageId,
            contextMenuVisible: this.contextMenuVisible,
            computedDisplay: window.getComputedStyle(this.contextMenu).display,
            computedVisibility: window.getComputedStyle(this.contextMenu).visibility,
            computedOpacity: window.getComputedStyle(this.contextMenu).opacity,
            computedZIndex: window.getComputedStyle(this.contextMenu).zIndex,
            allClasses: Array.from(this.contextMenu.classList),
            elementRect: this.contextMenu.getBoundingClientRect(),
            parentElement: this.contextMenu.parentElement?.tagName,
            inlineStyles: this.contextMenu.style.cssText
        });
        
        const editBtn = this.contextMenu.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.style.display = isOwnMessage ? 'flex' : 'none';
            console.log('✏️ Edit button visibility:', editBtn.style.display);
        }
        
        const deleteBtn = this.contextMenu.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.style.display = isOwnMessage ? 'flex' : 'none';
            console.log('🗑️ Delete button visibility:', deleteBtn.style.display);
        }
        
        this.setupContextMenuListeners();
        console.log('🎉 Context menu setup complete!');
        
        // Add a small delay before allowing clicks to close the menu
        this.contextMenuJustOpened = true;
        setTimeout(() => {
            this.contextMenuJustOpened = false;
        }, 200);
    }
    
    setupContextMenuListeners() {
        if (!this.contextMenu) return;
        
                        repliedMessage.classList.add('highlight-message');
                        setTimeout(() => {
                            repliedMessage.classList.remove('highlight-message');
                            }, 3000);
                        }, 100);
                    } else {
                        this.showNotification('Original message not found in current view', 'info');
                    }
                };

                replyContent.addEventListener('click', jumpToMessage);
                replyContent.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        jumpToMessage();
                    }
                });
            } else {
                const unavailableSpan = document.createElement('span');
                unavailableSpan.textContent = 'Loading reply...';
                unavailableSpan.style.color = '#72767d';
                unavailableSpan.style.fontSize = '12px';
                unavailableSpan.style.fontStyle = 'italic';
                replyContent.appendChild(unavailableSpan);

                // Fetch reply details on demand and update preview
                if (window.ChatAPI && typeof window.ChatAPI.getMessage === 'function') {
                    window.ChatAPI.getMessage(message.reply_message_id)
                        .then((msg) => {
                            if (msg && msg.content) {
                                unavailableSpan.remove();

                                const replyUsername = document.createElement('span');
                                replyUsername.className = 'text-[#5865f2] font-medium truncate';
                                replyUsername.textContent = msg.username || 'Unknown';

                                const replyMessage = document.createElement('div');
                                replyMessage.className = 'text-[#b5bac1] truncate';
                                replyMessage.textContent = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');

                                replyContent.appendChild(replyUsername);
                                replyContent.appendChild(replyMessage);
                            } else {
                                unavailableSpan.textContent = 'Original message not found';
                            }
                        })
                        .catch(() => {
                            unavailableSpan.textContent = 'Original message not found';
                        });
                }
            }
            
            replyContainer.appendChild(replyLine);
            replyContainer.appendChild(replyContent);
            messageElement.insertBefore(replyContainer, messageElement.firstChild);
        }
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-main-text text-[#dcddde]';
        
        if (message.content && message.content.trim() !== '') {
            contentElement.innerHTML = this.formatMessageContent(message.content);
        }
        
        if (message.attachment_url) {
            const attachmentContainer = document.createElement('div');
            attachmentContainer.className = 'message-attachment mt-2';
            
            if (message.message_type === 'image' || 
                (message.attachment_url && 
                 (/\.(jpeg|jpg|gif|png|webp)$/i.test(message.attachment_url) || 
                  message.attachment_url.includes('image/')))) {
                
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'image-attachment cursor-pointer relative';
                
                const image = document.createElement('img');
                image.className = 'max-w-md max-h-96 rounded-lg';
                image.src = message.attachment_url;
                image.alt = 'Image attachment';
                image.loading = 'lazy';
                image.onerror = function() {
                    this.onerror = null;
                    this.src = '/public/assets/common/default-profile-picture.png';
                    this.classList.add('w-16', 'h-16');
                    imageWrapper.classList.add('bg-[#2b2d31]', 'p-3', 'rounded-lg');
                    
                    const errorText = document.createElement('div');
                    errorText.className = 'text-sm text-[#b5bac1] mt-2';
                    errorText.textContent = 'Image failed to load';
                    imageWrapper.appendChild(errorText);
                };
                
                image.addEventListener('click', () => {
                    window.open(message.attachment_url, '_blank');
                });
                
                imageWrapper.appendChild(image);
                attachmentContainer.appendChild(imageWrapper);
                
            } else if (message.message_type === 'video' || 
                       (message.attachment_url && 
                        (/\.(mp4|webm|mov|avi|wmv)$/i.test(message.attachment_url) || 
                         message.attachment_url.includes('video/')))) {
                
                const videoWrapper = document.createElement('div');
                videoWrapper.className = 'video-attachment cursor-pointer relative';
                
                const video = document.createElement('video');
                video.className = 'max-w-md max-h-96 rounded-lg';
                video.src = message.attachment_url;
                video.controls = true;
                video.preload = 'metadata';
                video.onerror = function() {
                    this.onerror = null;
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'bg-[#2b2d31] p-3 rounded-lg flex items-center';
                    errorDiv.innerHTML = '<i class="fas fa-file-video text-2xl mr-2"></i><span>Video failed to load</span>';
                    videoWrapper.replaceWith(errorDiv);
                };
                
                videoWrapper.appendChild(video);
                attachmentContainer.appendChild(videoWrapper);
                
            } else {
                const fileLink = document.createElement('a');
                fileLink.href = message.attachment_url;
                fileLink.target = '_blank';
                fileLink.className = 'block no-underline';
                
                const fileContainer = document.createElement('div');
                fileContainer.className = 'bg-[#2b2d31] p-3 rounded-lg inline-flex items-center max-w-md hover:bg-[#36373d] transition-colors';
                
                const fileIconWrapper = document.createElement('div');
                fileIconWrapper.className = 'text-3xl text-[#b5bac1] mr-3';
                
                let fileIcon = 'fas fa-file';
                
                if (message.attachment_url) {
                    const extension = message.attachment_url.split('.').pop().toLowerCase();
                    
                    if (['doc', 'docx'].includes(extension)) fileIcon = 'fas fa-file-word';
                    else if (['xls', 'xlsx', 'csv'].includes(extension)) fileIcon = 'fas fa-file-excel';
                    else if (['ppt', 'pptx'].includes(extension)) fileIcon = 'fas fa-file-powerpoint';
                    else if (['pdf'].includes(extension)) fileIcon = 'fas fa-file-pdf';
                    else if (['zip', 'rar', 'tar', 'gz'].includes(extension)) fileIcon = 'fas fa-file-archive';
                    else if (['txt', 'log', 'md'].includes(extension)) fileIcon = 'fas fa-file-alt';
                    else if (['js', 'php', 'html', 'css', 'py', 'java', 'cpp', 'cs', 'rb'].includes(extension)) fileIcon = 'fas fa-file-code';
                    else if (['mp3', 'wav', 'ogg'].includes(extension)) fileIcon = 'fas fa-file-audio';
                    else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) fileIcon = 'fas fa-file-video';
                }
                
                fileIconWrapper.innerHTML = `<i class="${fileIcon}"></i>`;
                
                const fileInfoWrapper = document.createElement('div');
                fileInfoWrapper.className = 'overflow-hidden';
                
                const fileName = document.createElement('div');
                fileName.className = 'text-[#dcddde] font-medium text-sm truncate';
                fileName.textContent = message.attachment_url.split('/').pop() || 'File';
                
                const fileAction = document.createElement('div');
                fileAction.className = 'text-[#b5bac1] text-xs';
                fileAction.textContent = 'Click to download';
                
                fileInfoWrapper.appendChild(fileName);
                fileInfoWrapper.appendChild(fileAction);
                
                fileContainer.appendChild(fileIconWrapper);
                fileContainer.appendChild(fileInfoWrapper);
                
                fileLink.appendChild(fileContainer);
                attachmentContainer.appendChild(fileLink);
            }
            
            contentElement.appendChild(attachmentContainer);
        }
        
        messageElement.appendChild(contentElement);
        
        if (message.edited_at) {
            const editedBadge = document.createElement('span');
            editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
            editedBadge.textContent = '(edited)';
            contentElement.appendChild(editedBadge);
        }

        return messageElement;
    }
    
    formatMessageContent(content) {
        if (!content) return '';
        
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        let formattedContent = escapedContent
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<div class="bg-[#2b2d31] p-2 my-1 rounded text-sm font-mono"><code>$1</code></div>')
            .replace(/`(.*?)`/g, '<code class="bg-[#2b2d31] px-1 py-0.5 rounded text-sm font-mono">$1</code>');
            
        return formattedContent;
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const now = new Date();
            const isToday = date.getDate() === now.getDate() && 
                            date.getMonth() === now.getMonth() && 
                            date.getFullYear() === now.getFullYear();
            
            if (isToday) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        } catch (e) {
            console.error('Error formatting timestamp:', e);
            return '';
        }
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    resizeTextarea() {
        if (!this.messageInput) return;
        
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    }
    
    showLoadingIndicator() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="flex justify-center items-center h-full">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865f2]"></div>
                </div>
            `;
        }
    }
    
    hideLoadingIndicator() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
    }
    
    showErrorMessage(message) {
        if (this.chatMessages) {
            const errorElement = document.createElement('div');
            errorElement.className = 'text-[#ed4245] p-4 text-center';
            errorElement.textContent = message;
            
            this.chatMessages.appendChild(errorElement);
        }
        
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        
        let bgColor = 'bg-[#5865f2]';
        if (type === 'error') bgColor = 'bg-[#ed4245]';
        else if (type === 'warning') bgColor = 'bg-yellow-500';
        else if (type === 'info') bgColor = 'bg-blue-500';
        
        notification.className = `fixed bottom-28 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupIoListeners() {
        const self = this;
        
        // Ensure socket is ready before setting up listeners
        const setupSocketHandlers = function(io) {
            console.log('Setting up socket handlers for ChatSection');
            
            // Check if we're already listening to avoid duplicates
            if (self.socketListenersSetup) {
                console.log('Socket listeners already setup, skipping');
                return;
            }
            
            // Channel message handling
            io.on('new-channel-message', function(data) {
                console.log('Received new-channel-message:', data);
                
                if (self.chatType === 'channel' && data.channel_id == self.targetId) {
                    if (!self.processedMessageIds.has(data.id)) {
                        self.addMessage(data);
                        self.processedMessageIds.add(data.id);
                    }
                }
            });
            
            // DM message handling
            io.on('user-message-dm', function(data) {
                console.log('Received user-message-dm:', data);
                
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId) {
                    if (!self.processedMessageIds.has(data.id)) {
                        self.addMessage(data);
                        self.processedMessageIds.add(data.id);
                    }
                }
            });
            
            // Reaction handling
            io.on('reaction-added', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleReactionAdded(data);
                    }
                }
            });
            
            io.on('reaction-removed', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleReactionRemoved(data);
                    }
                }
            });
            
            io.on('message-updated', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleMessageUpdated(data);
                    }
                }
            });
            
            io.on('message-deleted', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleMessageDeleted(data);
                    }
                }
            });
            
            // Typing indicators
            io.on('user-typing', function(data) {
                if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                    self.showTypingIndicator(data.user_id, data.username);
                }
            });
            
            io.on('user-typing-dm', function(data) {        
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                    self.showTypingIndicator(data.user_id, data.username);
                }
            });
            
            io.on('user-stop-typing', function(data) {
                if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                    self.removeTypingIndicator(data.user_id);
                }
            });
            
            io.on('user-stop-typing-dm', function(data) {
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                    self.removeTypingIndicator(data.user_id);
                }
            });

            self.socketListenersSetup = true;
            console.log('Socket listeners setup complete');
        };
        
        // Check if socket is ready
        if (window.globalSocketManager && window.globalSocketManager.isReady() && window.globalSocketManager.io) {
            console.log('Socket is ready, setting up handlers immediately');
            setupSocketHandlers(window.globalSocketManager.io);
            
            // Join appropriate room using unified method
            this.joinChannel();
        } else {
            console.log('Socket not ready, waiting for socketAuthenticated event');
            
            // Listen for socket ready event
            const socketReadyHandler = (event) => {
                console.log('Socket authenticated event received in ChatSection');
                if (event.detail && event.detail.manager && event.detail.manager.io) {
                    setupSocketHandlers(event.detail.manager.io);
                    
                    // Join appropriate room using unified method
                    this.joinChannel();
                    
                    // Remove the event listener since we only need it once
                    window.removeEventListener('socketAuthenticated', socketReadyHandler);
                }
            };
            
            window.addEventListener('socketAuthenticated', socketReadyHandler);
            
            // Also try again in a few seconds in case the event was missed
            setTimeout(() => {
                if (!self.socketListenersSetup && window.globalSocketManager && window.globalSocketManager.isReady()) {
                    console.log('Retry: Setting up socket handlers after delay');
                    setupSocketHandlers(window.globalSocketManager.io);
                    
                    // Join appropriate room using unified method
                    self.joinChannel();
                }
            }, 3000);
        }
    }
    
    handleMessageUpdated(data) {
        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            const messageTextElement = messageElement.querySelector('.message-main-text');
            if (messageTextElement && data.message && data.message.content) {
                messageTextElement.innerHTML = this.formatMessageContent(data.message.content);
                
                let editedBadge = messageElement.querySelector('.edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                    editedBadge.textContent = '(edited)';
                    messageTextElement.appendChild(editedBadge);
                }
            }
        }
    }
    
    handleMessageDeleted(data) {
        const messageId = data.message_id;
        
        if (messageId) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            
            if (messageElement) {
                const messageGroup = messageElement.closest('.message-group');
                
                if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
                    messageGroup.remove();
                } else {
                    messageElement.remove();
                }
                
                this.processedMessageIds.delete(messageId);
                
                const remainingMessages = this.getMessagesContainer().querySelectorAll('.message-group');
                if (remainingMessages.length === 0) {
                    this.showEmptyState();
                }
            }
        }
    }
    
    handleMessagePinned(data) {
        const messageId = data.message_id;
        const username = data.username || 'Someone';
        
        // Add visual indicator to the message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            let pinIndicator = messageElement.querySelector('.pin-indicator');
            if (!pinIndicator) {
                pinIndicator = document.createElement('div');
                pinIndicator.className = 'pin-indicator text-xs text-[#faa61a] flex items-center mt-1';
                pinIndicator.innerHTML = '<i class="fas fa-thumbtack mr-1"></i>Pinned by ' + username;
                messageElement.appendChild(pinIndicator);
            }
        }
        
        // Show notification
        this.showNotification(`Message pinned by ${username}`, 'info');
        
        console.log(`📌 Message ${messageId} pinned by ${username}`);
    }
    
    handleMessageUnpinned(data) {
        const messageId = data.message_id;
        const username = data.username || 'Someone';
        
        // Remove visual indicator from the message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const pinIndicator = messageElement.querySelector('.pin-indicator');
            if (pinIndicator) {
                pinIndicator.remove();
            }
        }
        
        // Show notification
        this.showNotification(`Message unpinned by ${username}`, 'info');
        
        console.log(`📌 Message ${messageId} unpinned by ${username}`);
    }
    
    joinChannel() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('Socket not ready for room joining');
            return;
        }

        const roomType = this.chatType === 'channel' ? 'channel' : 'dm';
        const roomKey = `${roomType}-${this.targetId}`;
        
        if (!this.joinedRooms.has(roomKey)) {
            console.log(`🚪 Joining room: ${roomType} - ${this.targetId}`);
            
            // Use the new unified joinRoom method with source field
            const success = window.globalSocketManager.joinRoom(roomType, this.targetId);
            
            if (success) {
                this.joinedRooms.add(roomKey);
                console.log(`✅ Successfully joined ${roomType} room: ${this.targetId}`);
            } else {
                console.error(`❌ Failed to join ${roomType} room: ${this.targetId}`);
            }
        } else {
            console.log(`Already joined ${roomType} room: ${this.targetId}`);
        }
    }
    
    async loadMessages(offset = 0, limit = 20) {
        try {
            this.showLoadingSkeletons();
            
            console.log(`Loading messages for ${this.chatType} ${this.targetId}, offset: ${offset}, limit: ${limit}`);
            
            const params = new URLSearchParams({ offset, limit });
            const apiChatType = this.chatType === 'direct' ? 'dm' : this.chatType;
            
            let endpoint;
            if (this.chatType === 'direct' || this.chatType === 'dm') {
                endpoint = `/api/chat/dm/${this.targetId}/messages?${params.toString()}`;
            } else {
                endpoint = `/api/chat/${this.chatType}/${this.targetId}/messages?${params.toString()}`;
            }
            
            const messagesPromise = fetch(endpoint)
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 403) {
                            console.error(`🚨 403 ERROR: Access denied for ${this.chatType} ${this.targetId}`);
                            throw new Error('Access denied - you may not have permission to view this chat');
                        }
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const data = await messagesPromise;
            
            let messages = [];
            
            if (data.data && data.data.messages) {
                messages = data.data.messages;
                console.log(`Found ${messages.length} messages in response.data.messages`);
            } else if (data.messages) {
                messages = data.messages;
                console.log(`Found ${messages.length} messages in response.messages`);
            }
            
            if (messages && messages.length > 0) {
                const reactionPromises = [];
                const messagesToProcess = [];
                const messagesWithReactions = [];
                
                messages.forEach(msg => {
                    this.processedMessageIds.add(msg.id);
                    
                    const hasReactions = msg.has_reactions === true || 
                                        (Array.isArray(msg.reactions) && msg.reactions.length > 0) ||
                                        msg.reaction_count > 0;
                                        
                    if (hasReactions) {
                        messagesWithReactions.push(msg.id);
                        if (window.ChatAPI) {
                            const promise = window.ChatAPI.getMessageReactions(msg.id)
                                .then(reactions => {
                                    if (reactions && reactions.length > 0) {
                                        messagesToProcess.push({
                                            messageId: msg.id,
                                            reactions
                                        });
                                    }
                                })
                                .catch(err => console.error(`Error fetching reactions for message ${msg.id}:`, err));
                            reactionPromises.push(promise);
                        }
                    } else {
                        msg.reactions = [];
                    }
                });
                
                console.log(`📊 Starting to fetch reactions for ${messagesWithReactions.length} messages while skeletons are showing`);
                
                const minimumSkeletonTime = 800;
                const skeletonStartTime = Date.now();
                
                await Promise.race([
                    Promise.all(reactionPromises),
                    new Promise(resolve => setTimeout(resolve, 600))
                ]);
                
                messagesToProcess.forEach(item => {
                    const message = messages.find(m => m.id === item.messageId);
                    if (message) {
                        message.reactions = item.reactions || [];
                    }
                });
                
                const elapsedTime = Date.now() - skeletonStartTime;
                if (elapsedTime < minimumSkeletonTime) {
                    await new Promise(resolve => setTimeout(resolve, minimumSkeletonTime - elapsedTime));
                }
                
                this.hideEmptyState();
                this.renderMessages(messages);
                
                Promise.all(reactionPromises).then(() => {
                    messagesToProcess.forEach(item => {
                        if (window.emojiReactions && item.reactions?.length > 0) {
                            window.emojiReactions.updateReactionsDisplay(item.messageId, item.reactions);
                        }
                    });
                });
                
                this.scrollToBottom();
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
                this.showEmptyState();
            }
            
            this.messagesLoaded = true;
            
        } catch (error) {
            this.hideLoadingIndicator();
            console.error('Failed to load messages:', error);
            this.showErrorMessage(`Failed to load messages: ${error.message}`);
        }
    }
    
    showLoadingSkeletons() {
        if (this.skeletonLoader) {
            this.skeletonLoader.show();
        }
    }
    
    hideEmptyState() {
        if (!this.chatMessages) return false;
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        const emptyStates = this.chatMessages.querySelectorAll('#chat-empty-state');
        let removed = false;
        
        emptyStates.forEach(emptyState => {
            emptyState.remove();
            removed = true;
        });
        
        const allEmptyStateElements = this.chatMessages.querySelectorAll('[id*="empty"], .empty-state, .no-messages');
        allEmptyStateElements.forEach(element => {
            if (element.textContent.includes('No messages yet') || element.textContent.includes('Start the conversation')) {
                element.remove();
                removed = true;
            }
        });
        
        return removed;
    }
    
    showEmptyState() {
        if (!this.chatMessages) return;
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        this.ensureMessagesContainer();
        
        let emptyState = this.chatMessages.querySelector('#chat-empty-state');
        if (emptyState) {
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState = document.createElement('div');
        emptyState.id = 'chat-empty-state';
        emptyState.className = 'flex flex-col items-center justify-center p-8 text-[#b5bac1] h-full absolute inset-0 z-0';
        emptyState.innerHTML = `
            <i class="fas fa-comments text-6xl mb-4 opacity-50"></i>
            <p class="text-lg font-medium">No messages yet</p>
            <p class="text-sm mt-2">Start the conversation by sending a message!</p>
        `;
        
        this.chatMessages.style.position = 'relative';
        this.chatMessages.appendChild(emptyState);
        
        console.log('Empty state shown - messages-container preserved for first message');
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    debugContainerState() {
        console.log('🔍 === DEBUG: Current Container State ===');
        
        const state = {
            chatMessages: {
                exists: !!this.chatMessages,
                id: this.chatMessages?.id,
                children: this.chatMessages?.children.length || 0,
                innerHTML: this.chatMessages?.innerHTML.substring(0, 200) + '...'
            },
            messagesContainer: {
                exists: !!this.messagesContainer,
                className: this.messagesContainer?.className,
                children: this.messagesContainer?.children.length || 0,
                inDOM: this.messagesContainer ? document.contains(this.messagesContainer) : false,
                hasParent: !!this.messagesContainer?.parentNode,
                parentId: this.messagesContainer?.parentNode?.id
            },
            domQuery: {
                messagesContainerInDOM: !!document.querySelector('#chat-messages .messages-container'),
                chatMessagesInDOM: !!document.getElementById('chat-messages'),
                messageGroups: document.querySelectorAll('.message-group').length
            }
        };
        
        console.table(state.chatMessages);
        console.table(state.messagesContainer);
        console.table(state.domQuery);
        
        if (this.messagesContainer) {
            console.log('📦 Messages Container Element:', this.messagesContainer);
        } else {
            console.warn('⚠️ No messages container reference');
        }
        
        return state;
    }

    verifyMessageInDOM(messageId, expectedContainer) {
        console.log('🔍 Verifying message in DOM:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ Message element not found in DOM');
            return false;
        }
        
        const messageGroup = messageElement.closest('.message-group');
        if (!messageGroup) {
            console.error('❌ Message group not found');
            return false;
        }
        
        const actualContainer = messageGroup.parentNode;
        if (actualContainer !== expectedContainer) {
            console.error('❌ Message in wrong container:', {
                expected: expectedContainer.className,
                actual: actualContainer ? actualContainer.className : 'null'
            });
            return false;
        }
        
        const isVisible = messageGroup.offsetParent !== null;
        const hasContent = messageElement.textContent.trim().length > 0;
        
        const verification = {
            elementExists: !!messageElement,
            groupExists: !!messageGroup,
            correctContainer: actualContainer === expectedContainer,
            isVisible,
            hasContent,
            containerClass: actualContainer.className,
            messageText: messageElement.textContent.substring(0, 50)
        };
        
        console.log('📊 Message verification result:', verification);
        
        const success = verification.elementExists && 
                       verification.groupExists && 
                       verification.correctContainer && 
                       verification.isVisible;
        
        if (success) {
            console.log('✅ Message successfully verified in messages-container');
        } else {
            console.error('❌ Message verification failed');
        }
        
        return success;
    }
    
    forceTestContainerAppend() {
        console.log('🧪 FORCE TESTING CONTAINER APPEND...');
        
        const container = this.validateAndGetContainer();
        if (!container) {
            console.error('❌ Cannot test - no valid container');
            return false;
        }
        
        const testElement = document.createElement('div');
        testElement.style.background = 'red';
        testElement.style.height = '50px';
        testElement.style.width = '100%';
        testElement.textContent = 'TEST ELEMENT - FORCE APPEND';
        testElement.id = 'force-test-element';
        
        console.log('🧪 Attempting to append test element...');
        
        try {
            container.appendChild(testElement);
            
            const testSuccess = container.contains(testElement);
            console.log('🧪 Force test result:', {
                elementAppended: testSuccess,
                containerChildren: container.children.length,
                testElementInDOM: document.getElementById('force-test-element') !== null
            });
            
            if (testSuccess) {
                console.log('✅ FORCE TEST PASSED - Container can accept elements!');
                setTimeout(() => testElement.remove(), 2000);
                return true;
            } else {
                console.error('❌ FORCE TEST FAILED - Container cannot accept elements!');
                return false;
            }
        } catch (error) {
            console.error('❌ FORCE TEST ERROR:', error);
            return false;
        }
    }
    
    quickMessageTest() {
        console.log('🧪 QUICK MESSAGE TEST...');
        
        const testMessage = {
            id: 'test_' + Date.now(),
            content: 'TEST MESSAGE - If you see this, the system works!',
            user_id: this.userId,
            username: 'TEST USER',
            avatar_url: '/public/assets/common/default-profile-picture.png',
            sent_at: Date.now()
        };
        
        console.log('🧪 Adding test message...');
        this.addMessage(testMessage);
        
        setTimeout(() => {
            const testElement = document.querySelector(`[data-message-id="${testMessage.id}"]`);
            if (testElement) {
                console.log('✅ QUICK TEST PASSED - Test message visible!');
                setTimeout(() => {
                    const messageGroup = testElement.closest('.message-group');
                    if (messageGroup) messageGroup.remove();
                }, 3000);
                return true;
            } else {
                console.error('❌ QUICK TEST FAILED - Test message not found!');
                return false;
            }
        }, 100);
    }
    
    handleReactionAdded(data) {
        if (!data.message_id || !data.emoji) return;
        
        if (window.emojiReactions && typeof window.emojiReactions.handleReactionAdded === 'function') {
            window.emojiReactions.handleReactionAdded(data);
        } else {
            console.warn('emojiReactions not available for reaction update');
        }
    }
    
    handleReactionRemoved(data) {
        if (!data.message_id || !data.emoji) return;
        
        if (window.emojiReactions && typeof window.emojiReactions.handleReactionRemoved === 'function') {
            window.emojiReactions.handleReactionRemoved(data);
        } else {
            console.warn('emojiReactions not available for reaction update');
        }
    }

    prepareChatContainer() {
        if (!this.chatMessages) {
            console.error('❌ prepareChatContainer: chatMessages element not found');
            return;
        }
        
        console.log('🔧 Preparing chat container for message...');
        
        this.hideEmptyState();
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        const containerResult = this.ensureMessagesContainer();
        if (!containerResult) {
            console.error('❌ Failed to ensure messages container in prepareChatContainer');
            return;
        }
        
        const nonMessageElements = this.chatMessages.querySelectorAll(':not(.messages-container)');
        nonMessageElements.forEach(element => {
            if (element.id !== 'chat-empty-state' && 
                !element.classList.contains('message-group') && 
                !element.classList.contains('message-group-item') &&
                !element.classList.contains('messages-container')) {
                if (element.textContent.includes('No messages yet') || 
                    element.textContent.includes('Start the conversation') ||
                    element.querySelector('i.fa-comments')) {
                    console.log('🗑️ Removing interfering element:', element);
                    element.remove();
                }
            }
        });
        
        this.chatMessages.style.position = 'relative';
        
        const finalState = {
            chatMessagesExists: !!this.chatMessages,
            messagesContainerExists: !!this.messagesContainer,
            containerInDOM: this.messagesContainer ? document.contains(this.messagesContainer) : false,
            containerChildren: this.messagesContainer?.children.length || 0,
            chatMessagesChildren: this.chatMessages.children.length
        };
        
        console.log('📊 Chat container preparation complete:', finalState);
        console.log('✅ Messages-container ready for first message');
        
        if (!finalState.messagesContainerExists || !finalState.containerInDOM) {
            console.error('❌ Chat container preparation failed - container not ready');
        }
    }
}