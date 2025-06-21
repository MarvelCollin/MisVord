import { showToast } from '../../core/ui/toast.js';

class MessageHandler {
    constructor(messaging) {
        this.messaging = messaging;
        this.hasMoreMessages = true;
        this.loadingMessages = false;
        this.currentOffset = 0;
        this.messageHistory = [];
        this.isSubmitting = false;
        this.lastSubmitTime = 0;
    }

    async sendMessage(chatType, chatId, content, messageType = 'text', attachments = [], mentions = []) {
        if (!chatId || !content) {
            this.messaging.error('❌ Cannot send message: missing chatId or content');
            return;
        }

        if (this.isSubmitting) {
            this.messaging.log('⚠️ Already submitting a message, ignoring new send request');
            return;
        }

        const now = Date.now();
        if (now - this.lastSubmitTime < 1000) {
            this.messaging.log('⚠️ Rate limited: too soon since last message');
            return;
        }

        this.isSubmitting = true;
        this.lastSubmitTime = now;        try {
            const messageData = {
                content: content.trim(),
                message_type: messageType,
                attachments: attachments,
                mentions: mentions
            };

            if (chatType === 'direct') {
                messageData.target_type = 'dm';
                messageData.target_id = chatId;
            } else {
                messageData.target_type = 'channel';
                messageData.target_id = chatId;
            }

            this.messaging.log('📤 Sending message:', messageData);

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });            if (response.ok) {
                const result = await response.json();
                
                if (result.data && result.data.message) {
                    this.messaging.log('✅ Message sent successfully');
                    this.addMessageToContainerWithAnimation(result.data.message);
                } else {
                    this.messaging.log('✅ Message sent (no message data returned)');
                }

                this.trackMessage('MESSAGE_SENT', {
                    chatType: chatType,
                    chatId: chatId,
                    messageType: messageType
                });

                return result;
            } else {
                const error = await response.text();
                this.messaging.error('❌ Failed to send message:', error);
                showToast('Failed to send message', 'error');
                throw new Error(error);
            }
        } catch (error) {
            this.messaging.error('❌ Error sending message:', error);
            this.messaging.trackError('MESSAGE_SEND_FAILED', error);
            showToast('Failed to send message', 'error');
            throw error;
        } finally {
            this.isSubmitting = false;
        }
    }

    async sendRichMessage(chatType, chatId, messageData) {
        if (!chatId) {
            this.messaging.error('❌ Cannot send rich message: missing chatId');
            return;
        }

        const tempId = 'temp_' + Date.now();

        if (messageData.attachments && messageData.attachments.length > 0) {
            this.messaging.log('📎 Processing attachments for rich message...');
        }        try {
            const payload = {
                content: messageData.content || '',
                message_type: messageData.messageType || 'text',
                attachments: messageData.attachments || [],
                mentions: messageData.mentions || []
            };

            if (chatType === 'direct') {
                payload.target_type = 'dm';
                payload.target_id = chatId;
            } else {
                payload.target_type = 'channel';
                payload.target_id = chatId;
            }

            this.messaging.log('📤 Sending rich message:', payload);

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.data && result.data.message) {
                    this.messaging.log('✅ Rich message sent successfully');
                    this.addMessageToContainer(result.data.message);
                } else {
                    this.messaging.log('✅ Rich message sent (no message data returned)');
                }

                this.trackMessage('RICH_MESSAGE_SENT', {
                    chatType: chatType,
                    chatId: chatId,
                    messageType: messageData.messageType,
                    hasAttachments: !!(messageData.attachments && messageData.attachments.length > 0)
                });

                return result;
            } else {
                const error = await response.text();
                this.messaging.error('❌ Failed to send rich message:', error);
                throw new Error(error);
            }
        } catch (error) {
            this.messaging.error('❌ Error sending rich message:', error);
            this.messaging.trackError('RICH_MESSAGE_SEND_FAILED', error);
            throw error;
        }
    }

    createTempRichMessage(messageData, tempId) {
        return {
            id: tempId,
            content: messageData.content || '',
            user_id: this.messaging.userId,
            username: this.messaging.username,
            created_at: new Date().toISOString(),
            message_type: messageData.messageType || 'text',
            attachments: messageData.attachments || [],
            mentions: messageData.mentions || [],
            temp: true
        };
    }    addMessageToContainer(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            this.messaging.log('⚠️ Messages container not found');
            return;
        }

        let previousMessage = null;
        const existingMessages = messagesContainer.children;
        if (existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            if (lastMessage.dataset.userId) {
                previousMessage = {
                    user_id: lastMessage.dataset.userId,
                    created_at: lastMessage.dataset.createdAt
                };
            }
        }

        const isGrouped = this.shouldGroupMessage(message, previousMessage);
        const messageElement = this.createMessageElement(message, isGrouped);
        messageElement.dataset.createdAt = message.created_at || message.sent_at;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }createMessageElement(message, isGrouped = false) {
        const messageDiv = document.createElement('div');
        
        messageDiv.className = 'message-row hover:bg-gray-800/40 py-0.5 px-4 group relative';
        messageDiv.dataset.messageId = message.id;
        messageDiv.dataset.userId = message.user_id;
        
        const timestamp = this.formatSafeDate(message.created_at || message.sent_at);
        const fullTimestamp = this.formatFullDate(message.created_at || message.sent_at);
        const avatarUrl = message.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIwIiBmaWxsPSIjNTg2NUYyIi8+CiAgICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjE1IiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgogICAgPHBhdGggZD0iTTggMzJDOCAyNi41IDEyLjUgMjIgMTggMjJIMjJDMjcuNSAyMiAzMiAyNi41IDMyIDMyVjM1QzMyIDM2LjEgMzEuMSAzNyAzMCAzN0gxMEM4LjkgMzcgOCAzNi4xIDggMzVWMzJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';        if (isGrouped) {
            messageDiv.innerHTML = `
                <div class="ml-16 relative">
                    <span class="absolute left-[-60px] text-xs text-gray-500 opacity-0 group-hover:opacity-100 w-14 text-right pr-1 mt-0.5 transition-opacity">
                        ${timestamp}
                    </span>
                    <div class="text-sm text-gray-300 leading-5 break-words pr-16">
                        ${this.escapeHtml(message.content)}
                    </div>
                </div>
                <div class="message-actions absolute right-2 top-[-8px] opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 rounded shadow-lg flex items-center z-10">
                    <button class="reaction-btn p-1.5 hover:bg-gray-600 rounded text-sm" title="👍">👍</button>
                    <button class="reaction-btn p-1.5 hover:bg-gray-600 rounded text-sm" title="❤️">❤️</button>
                    <button class="reaction-btn p-1.5 hover:bg-gray-600 rounded text-sm font-bold" title="A">🅰️</button>
                    <button class="edit-btn p-1.5 hover:bg-gray-600 rounded" title="Edit Message">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                    </button>
                    <button class="reply-btn p-1.5 hover:bg-gray-600 rounded" title="Reply">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <button class="more-btn p-1.5 hover:bg-gray-600 rounded" title="More">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0 w-10 h-10 mr-4">
                        <img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(message.username)}" 
                             class="w-10 h-10 rounded-full">
                    </div>
                    <div class="flex-1 min-w-0 pr-16">
                        <div class="flex items-baseline mb-1">
                            <span class="font-medium text-white hover:underline cursor-pointer mr-2 text-sm">
                                ${this.escapeHtml(message.username)}
                            </span>
                            <span class="text-xs text-gray-500" title="${fullTimestamp}">
                                ${fullTimestamp}
                            </span>
                        </div>
                        <div class="text-sm text-gray-300 leading-5 break-words">
                            ${this.escapeHtml(message.content)}
                        </div>
                        ${message.attachments && message.attachments.length > 0 ? this.renderAttachments(message.attachments) : ''}
                    </div>
                </div>
                <div class="message-actions absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 rounded shadow-lg flex items-center z-10">
                    <button class="reaction-btn p-1.5 hover:bg-gray-600 rounded text-sm" title="👍">👍</button>
                    <button class="reaction-btn p-1.5 hover:bg-gray-600 rounded text-sm" title="❤️">❤️</button>
                    <button class="reaction-btn p-1.5 hover:bg-gray-600 rounded text-sm font-bold" title="A">🅰️</button>
                    <button class="edit-btn p-1.5 hover:bg-gray-600 rounded" title="Edit Message">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                    </button>
                    <button class="reply-btn p-1.5 hover:bg-gray-600 rounded" title="Reply">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <button class="more-btn p-1.5 hover:bg-gray-600 rounded" title="More">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                    </button>
                </div>
            `;
        }

        this.setupMessageActions(messageDiv, message);
        return messageDiv;
    }    formatFullDate(dateStr) {
        if (!dateStr) return 'Unknown time';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Unknown time';
        
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }setupMessageActions(messageDiv, message) {
        const moreBtn = messageDiv.querySelector('.more-btn');
        if (moreBtn) {
            moreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showContextMenu(e, message);
            });
        }

        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, message);
        });

        const reactionBtns = messageDiv.querySelectorAll('.reaction-btn');
        reactionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const emoji = btn.getAttribute('title');
                this.handleReactionClick(message.id, emoji);
            });
        });

        const editBtn = messageDiv.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleContextMenuAction('edit', message.id);
            });
        }

        const replyBtn = messageDiv.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleContextMenuAction('reply', message.id);
            });
        }
    }

    showContextMenu(event, message) {
        this.hideContextMenu();
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu fixed z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[220px]';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';

        const quickReactions = ['👍', '❤️', '🅰️', '🆈'];
          contextMenu.innerHTML = `
            <div class="px-3 py-2 border-b border-gray-700">
                <div class="flex space-x-1">
                    ${quickReactions.map(emoji => `
                        <button class="quick-reaction p-2 hover:bg-gray-700 rounded text-lg transition-colors" data-emoji="${emoji}">
                            ${emoji}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="py-1">
                <button class="context-item w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center text-sm">
                    <span class="mr-3">�</span>
                    Add Reaction
                </button>
                <button class="context-item w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center text-sm">
                    <svg class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                    Edit Message
                </button>
                <button class="context-item w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center text-sm">
                    <svg class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    Reply                </button>
                <button class="context-item w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center text-sm">
                    <svg class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5h-2v6z"/>
                    </svg>
                    Copy Text
                </button>
                <button class="context-item w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center text-sm">
                    <svg class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Pin Message
                </button>
                <div class="border-t border-gray-700 my-1"></div>
                <button class="context-item w-full text-left px-3 py-2 hover:bg-red-600 flex items-center text-red-400 text-sm">
                    <svg class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Delete Message
                </button>
                <div class="border-t border-gray-700 my-1"></div>
                <button class="context-item w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center text-xs text-gray-400">
                    <span class="mr-3">#</span>
                    Copy Message ID
                </button>
            </div>
        `;

        document.body.appendChild(contextMenu);        contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const quickReaction = e.target.closest('.quick-reaction');
            const contextItem = e.target.closest('.context-item');
            
            if (quickReaction) {
                const emoji = quickReaction.dataset.emoji;
                this.handleReactionClick(message.id, emoji);
                this.hideContextMenu();
            } else if (contextItem) {
                const text = contextItem.textContent.trim();
                let action = '';
                
                if (text.includes('Edit Message')) action = 'edit';
                else if (text.includes('Reply')) action = 'reply';                else if (text.includes('Delete Message')) action = 'delete';
                else if (text.includes('Copy Text')) action = 'copy';
                else if (text.includes('Pin Message')) action = 'pin';
                
                if (action) {
                    this.handleContextMenuAction(action, message.id);
                }
            }
        });

        const clickOutside = (e) => {
            if (!contextMenu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', clickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', clickOutside);
        }, 10);
    }

    hideContextMenu() {
        const existing = document.querySelector('.context-menu');
        if (existing) {
            existing.remove();
        }
    }

    addReaction(messageId, emoji) {
        this.messaging.log('Adding reaction:', emoji, 'to message:', messageId);
    }

    handleReactionClick(messageId, emoji) {
        this.messaging.log(`Adding reaction ${emoji} to message ${messageId}`);
        
        fetch('/api/chat/reaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_id: messageId,
                emoji: emoji
            })
        }).then(response => {
            if (response.ok) {
                this.messaging.log(`Reaction ${emoji} added successfully`);
            } else {
                this.messaging.error('Failed to add reaction');
            }
        }).catch(error => {
            this.messaging.error('Error adding reaction:', error);
        });
    }

    handleContextMenuAction(action, messageId) {
        this.hideContextMenu();
        
        switch(action) {
            case 'edit':
                this.editMessage(messageId);
                break;
            case 'reply':
                this.replyToMessage(messageId);
                break;
            case 'delete':
                this.deleteMessage(messageId);
                break;
            case 'copy':
                this.copyMessageText(messageId);
                break;
            case 'pin':
                this.pinMessage(messageId);
                break;
            default:
                this.messaging.log(`Unhandled context menu action: ${action}`);
        }
    }

    editMessage(messageId) {
        this.messaging.log(`Editing message ${messageId}`);
    }

    replyToMessage(messageId) {
        this.messaging.log(`Replying to message ${messageId}`);
    }

    deleteMessage(messageId) {
        this.messaging.log(`Deleting message ${messageId}`);
    }

    copyMessageText(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const contentElement = messageElement.querySelector('.text-sm.text-gray-300');
            if (contentElement) {
                navigator.clipboard.writeText(contentElement.textContent.trim()).then(() => {
                    this.messaging.log('Message text copied to clipboard');
                }).catch(err => {
                    this.messaging.error('Failed to copy text:', err);
                });
            }
        }
    }

    pinMessage(messageId) {
        this.messaging.log(`Pinning message ${messageId}`);
    }

    renderAttachments(attachments) {
        if (!attachments || attachments.length === 0) return '';
        
        return `
            <div class="message-attachments">
                ${attachments.map(attachment => `
                    <div class="attachment">
                        ${attachment.type === 'image' ? 
                            `<img src="${this.escapeHtml(attachment.url)}" alt="${this.escapeHtml(attachment.name)}" class="attachment-image">` :
                            `<a href="${this.escapeHtml(attachment.url)}" class="attachment-link">${this.escapeHtml(attachment.name)}</a>`
                        }
                    </div>
                `).join('')}
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }    onNewMessage(data) {
        this.messaging.log('📨 New message received:', data);
        
        if (data.type === 'new_message' && data.message) {
            const message = data.message;
            const isForCurrentChat = (data.target_type === 'channel' && data.target_id == this.messaging.activeChannel) ||
                                    (data.target_type === 'dm' && data.target_id == this.messaging.activeChatRoom);
            
            if (isForCurrentChat) {
                if (message.user_id === this.messaging.userId) {
                    this.messaging.log('📤 Own message received via socket, skipping display (already shown)');
                } else {
                    this.addMessageToContainerWithAnimation(message);
                }
            }
            
            this.trackMessage('MESSAGE_RECEIVED', {
                messageId: message.id,
                channelId: data.target_type === 'channel' ? data.target_id : null,
                chatRoomId: data.target_type === 'dm' ? data.target_id : null,
                fromUser: message.user_id
            });
        } else {
            const isForCurrentChat = (data.channelId && data.channelId == this.messaging.activeChannel) ||
                                    (data.chatRoomId && data.chatRoomId == this.messaging.activeChatRoom);
            
            if (isForCurrentChat) {
                if (data.user_id === this.messaging.userId) {
                    this.messaging.log('📤 Own message received via socket, skipping display (already shown)');
                } else {
                    this.addMessageToContainerWithAnimation(data);
                }
            }
            
            this.trackMessage('MESSAGE_RECEIVED', {
                messageId: data.id,
                channelId: data.channelId,
                chatRoomId: data.chatRoomId,
                fromUser: data.user_id
            });
        }
    }

    trackMessage(event, data = {}) {
        const messageInfo = {
            event: event,
            timestamp: new Date().toISOString(),
            activeChannel: this.messaging.activeChannel,
            activeChatRoom: this.messaging.activeChatRoom,
            chatType: this.messaging.chatType,
            data: data
        };

        this.messageHistory.push(messageInfo);
        this.messaging.log('📝 Message tracked:', messageInfo);

        if (this.messageHistory.length > 30) {
            this.messageHistory.shift();
        }
    }

    async loadMessages(chatType, chatId, offset = 0) {
        if (this.loadingMessages) {
            this.messaging.log('⏳ Already loading messages');
            return;
        }        this.loadingMessages = true;
        
        try {
            const routeChatType = chatType === 'direct' ? 'dm' : chatType;
            const endpoint = `/api/chat/${routeChatType}/${chatId}/messages?offset=${offset}`;
            const response = await fetch(endpoint);
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data && result.data.messages) {
                    const messages = result.data.messages;
                    
                    if (messages.length === 0) {
                        this.hasMoreMessages = false;
                    } else {
                        this.displayMessages(messages, offset === 0);
                        this.currentOffset += messages.length;
                    }
                }
            } else {
                this.messaging.error('Failed to load messages:', response.statusText);
            }
        } catch (error) {
            this.messaging.error('Error loading messages:', error);
        } finally {
            this.loadingMessages = false;
        }
    }    displayMessages(messages, clearFirst = false) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            this.messaging.error('❌ Messages container not found');
            return;
        }

        this.hideSkeletonLoader();

        if (clearFirst) {
            messagesContainer.innerHTML = '';
        }

        if (!messages || !Array.isArray(messages)) {
            this.messaging.log('⚠️ No valid messages to display');
            return;
        }

        if (messages.length === 0) {
            if (clearFirst) {
                messagesContainer.innerHTML = '<div class="p-4 text-center text-gray-500">No messages yet. Start the conversation!</div>';
            }
            return;
        }

        let previousMessage = null;
        const existingMessages = messagesContainer.children;
        if (existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            if (lastMessage.dataset.userId) {
                previousMessage = {
                    user_id: lastMessage.dataset.userId,
                    created_at: lastMessage.dataset.createdAt
                };
            }
        }

        messages.forEach((message, index) => {
            try {
                const isGrouped = this.shouldGroupMessage(message, previousMessage);
                const messageElement = this.createMessageElement(message, isGrouped);
                messageElement.dataset.createdAt = message.created_at || message.sent_at;
                messagesContainer.appendChild(messageElement);
                previousMessage = message;
            } catch (error) {
                this.messaging.error('❌ Error creating message element:', error);
            }
        });

        if (clearFirst) {
            this.messaging.log('✅ Messages displayed, scroll to bottom');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }    shouldGroupMessage(currentMessage, previousMessage) {
        if (!previousMessage) return false;
        
        if (currentMessage.user_id !== previousMessage.user_id) return false;
        
        const currentTime = new Date(currentMessage.created_at || currentMessage.sent_at);
        const previousTime = new Date(previousMessage.created_at || previousMessage.sent_at);
        const timeDiff = currentTime - previousTime;
        
        return timeDiff < 300000;
    }

    showSkeletonLoader() {
        const container = document.getElementById('chat-messages');
        if (!container) {
            this.messaging.error('❌ Chat messages container not found for skeleton loader');
            return;
        }

        // Remove existing skeleton to prevent duplicates
        this.hideSkeletonLoader();

        const skeleton = document.createElement('div');
        skeleton.id = 'skeleton-loader';
        skeleton.className = 'p-4 skeleton-loader';
        skeleton.innerHTML = `
            <div class="space-y-4">
                ${Array.from({length: 5}, () => `
                <div class="flex items-start animate-pulse">
                    <div class="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 mr-3"></div>
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center space-x-2">
                            <div class="h-4 w-20 bg-gray-700 rounded"></div>
                            <div class="h-3 w-16 bg-gray-800 rounded"></div>
                        </div>
                        <div class="h-4 w-3/4 bg-gray-700 rounded"></div>
                        <div class="h-4 w-1/2 bg-gray-700 rounded"></div>
                    </div>
                </div>
                `).join('')}
            </div>
        `;

        container.appendChild(skeleton);
        this.messaging.log('🔄 Skeleton loader shown');
    }

    hideSkeletonLoader() {
        const skeleton = document.getElementById('skeleton-loader');
        if (skeleton) {
            skeleton.remove();
            this.messaging.log('✅ Skeleton loader hidden');
        }
    }

    formatSafeDate(dateString) {
        if (!dateString) return '';

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', options);
        } catch (error) {
            this.messaging.error('❌ Error formatting date:', error);
            return dateString;
        }
    }    addMessageToContainerWithAnimation(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            this.messaging.log('⚠️ Messages container not found');
            return;
        }

        let previousMessage = null;
        const existingMessages = messagesContainer.children;
        if (existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            if (lastMessage.dataset.userId) {
                previousMessage = {
                    user_id: lastMessage.dataset.userId,
                    created_at: lastMessage.dataset.createdAt
                };
            }
        }

        const isGrouped = this.shouldGroupMessage(message, previousMessage);
        const messageElement = this.createMessageElement(message, isGrouped);
        messageElement.dataset.createdAt = message.created_at || message.sent_at;
        
        messageElement.classList.add('message-enter');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        messageElement.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        if (message.user_id === this.messaging.userId) {
            messageElement.classList.add('message-sent');
        }
        
        messagesContainer.appendChild(messageElement);
        
        requestAnimationFrame(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
            
            const avatar = messageElement.querySelector('img');
            if (avatar && !isGrouped) {
                avatar.classList.add('new-message');
                setTimeout(() => {
                    avatar.classList.remove('new-message');
                }, 600);
            }
            
            setTimeout(() => {
                messageElement.classList.remove('message-enter');
                messageElement.style.removeProperty('opacity');
                messageElement.style.removeProperty('transform');
                messageElement.style.removeProperty('transition');
            }, 400);
        });
        
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
        
        if (message.user_id !== this.messaging.userId) {
            this.playMessageSound();
        }
        
        this.messaging.log('💬 Message added with animation');
    }

    playMessageSound() {
        // Optional: Add a subtle sound effect for incoming messages
        // This can be customized based on user preferences
        try {
            if (this.messaging.config.soundEnabled) {
                const audio = new Audio('/assets/sounds/message.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {
                    // Ignore audio errors (autoplay restrictions, etc.)
                });
            }
        } catch (error) {
            // Ignore sound errors
        }
    }

    // Method to create a temporary message while sending
    createTemporaryMessage(content, chatType, chatId) {
        const tempMessage = {
            id: 'temp-' + Date.now(),
            content: content,
            user_id: this.messaging.userId,
            username: this.messaging.username,
            avatar_url: this.messaging.userAvatar,
            created_at: new Date().toISOString(),
            temp: true
        };

        const messageElement = this.createMessageElement(tempMessage);
        messageElement.classList.add('temp-message');
        messageElement.style.opacity = '0.7';
        
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        return messageElement;
    }

    removeTemporaryMessage(tempElement) {
        if (tempElement && tempElement.parentNode) {
            tempElement.style.transition = 'opacity 0.3s ease';
            tempElement.style.opacity = '0';
            setTimeout(() => {
                if (tempElement.parentNode) {
                    tempElement.parentNode.removeChild(tempElement);
                }
            }, 300);
        }
    }

    showTypingIndicator(username) {
        this.hideTypingIndicator();
        
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'typing-indicator flex items-center p-2 px-4 opacity-75';
        
        typingDiv.innerHTML = `
            <div class="flex-shrink-0 w-8 h-8 mr-3">
                <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <div class="typing-dots flex space-x-1">
                        <div class="typing-dot w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div class="typing-dot w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div class="typing-dot w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                </div>
            </div>
            <div class="text-sm text-gray-400">
                <strong>${this.escapeHtml(username)}</strong> is typing...
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.typingTimeout = setTimeout(() => {
            this.hideTypingIndicator();
        }, 5000);
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    handleTypingStart(username) {
        if (username !== this.messaging.username) {
            this.showTypingIndicator(username);
        }
    }

    handleTypingStop() {
        this.hideTypingIndicator();
    }
}

export default MessageHandler;
