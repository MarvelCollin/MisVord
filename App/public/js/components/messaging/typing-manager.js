class TypingManager {
    constructor(messaging) {
        this.messaging = messaging;
        this.typingUsers = new Map();
        this.typingTimeout = null;
        this.isTyping = false;
        this.typingDebounceTime = 2000;
    }

    startTyping(chatType, chatId) {
        if (!this.messaging.socket || !this.messaging.connected) {
            return;
        }

        if (!this.isTyping) {
            this.isTyping = true;
            
            const typingData = {
                userId: this.messaging.userId,
                username: this.messaging.username
            };            if (chatType === 'channel') {
                typingData.channelId = chatId;
                this.messaging.socket.emit('typing', typingData);
            } else if (chatType === 'direct') {
                typingData.chatRoomId = chatId;
                this.messaging.socket.emit('user_typing_dm', typingData);
            }

            this.messaging.log('⌨️ Started typing in', chatType, chatId);
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping(chatType, chatId);
        }, this.typingDebounceTime);
    }

    stopTyping(chatType, chatId) {
        if (!this.messaging.socket || !this.messaging.connected || !this.isTyping) {
            return;
        }

        this.isTyping = false;
        clearTimeout(this.typingTimeout);

        const typingData = {
            userId: this.messaging.userId,
            username: this.messaging.username
        };        if (chatType === 'channel') {
            typingData.channelId = chatId;
            this.messaging.socket.emit('stop-typing', typingData);
        } else if (chatType === 'direct') {
            typingData.chatRoomId = chatId;
            this.messaging.socket.emit('user_stop_typing_dm', typingData);
        }

        this.messaging.log('✋ Stopped typing in', chatType, chatId);
    }

    onUserTyping(data) {
        if (data.userId === this.messaging.userId) {
            return;
        }

        const key = this.getTypingKey(data);
        
        if (!this.typingUsers.has(key)) {
            this.typingUsers.set(key, {
                userId: data.userId,
                username: data.username,
                timestamp: Date.now()
            });

            this.updateTypingIndicator();
            this.messaging.log('⌨️ User started typing:', data.username);
        }

        setTimeout(() => {
            this.typingUsers.delete(key);
            this.updateTypingIndicator();
        }, this.typingDebounceTime + 500);
    }

    onUserStopTyping(data) {
        if (data.userId === this.messaging.userId) {
            return;
        }

        const key = this.getTypingKey(data);
        
        if (this.typingUsers.has(key)) {
            this.typingUsers.delete(key);
            this.updateTypingIndicator();
            this.messaging.log('✋ User stopped typing:', data.username);
        }
    }

    getTypingKey(data) {
        if (data.channelId) {
            return `channel_${data.channelId}_${data.userId}`;
        } else if (data.chatRoomId) {
            return `dm_${data.chatRoomId}_${data.userId}`;
        }
        return `unknown_${data.userId}`;
    }    updateTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (!typingIndicator) {
            return;
        }

        const currentChatUsers = Array.from(this.typingUsers.values()).filter(user => {
            const key = this.getTypingKey({
                userId: user.userId,
                channelId: this.messaging.activeChannel,
                chatRoomId: this.messaging.activeChatRoom
            });
            return this.typingUsers.has(key);
        });

        if (currentChatUsers.length === 0) {
            typingIndicator.style.display = 'none';
            typingIndicator.classList.add('hidden');
        } else {
            const usernames = currentChatUsers.map(user => user.username);
            let text = '';
            
            if (usernames.length === 1) {
                text = `${usernames[0]} is typing...`;
            } else if (usernames.length === 2) {
                text = `${usernames[0]} and ${usernames[1]} are typing...`;
            } else {
                text = `${usernames[0]} and ${usernames.length - 1} others are typing...`;
            }

            const textSpan = typingIndicator.querySelector('span:last-child');
            if (textSpan) {
                textSpan.textContent = text;
            }
            
            typingIndicator.style.display = 'flex';
            typingIndicator.classList.remove('hidden');
        }
    }

    clearTypingUsers() {
        this.typingUsers.clear();
        this.updateTypingIndicator();
    }

    setupTypingEvents() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) {
            return;
        }

        let inputTimeout;

        messageInput.addEventListener('input', () => {
            if (messageInput.value.trim().length > 0) {
                this.startTyping(this.messaging.chatType, this.getCurrentChatId());
            }

            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                if (messageInput.value.trim().length === 0) {
                    this.stopTyping(this.messaging.chatType, this.getCurrentChatId());
                }
            }, 500);
        });

        messageInput.addEventListener('blur', () => {
            this.stopTyping(this.messaging.chatType, this.getCurrentChatId());
        });

        document.addEventListener('beforeunload', () => {
            this.stopTyping(this.messaging.chatType, this.getCurrentChatId());
        });
    }

    getCurrentChatId() {
        return this.messaging.chatType === 'channel' ? 
            this.messaging.activeChannel : 
            this.messaging.activeChatRoom;
    }
}

export default TypingManager;
