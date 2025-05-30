/**
 * Messaging functionality for MiscVord
 * Handles message operations like send, edit, delete, etc.
 */

import { MiscVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initMessagingSystem();
});

/**
 * Initialize messaging system functionality
 */
function initMessagingSystem() {
    // Message input form
    initMessageForm();
    
    // Message edit buttons
    initMessageEditButtons();
    
    // Message delete buttons
    initMessageDeleteButtons();
    
    // Scrolling behavior for message containers
    initMessageScrolling();
}

/**
 * Initialize message form
 */
function initMessageForm() {
    const messageForm = document.getElementById('message-form');
    
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const textarea = this.querySelector('textarea');
            const message = textarea.value.trim();
            const channelId = this.getAttribute('data-channel-id');
            
            if (!message) {
                return;
            }
            
            sendMessage(channelId, message);
            textarea.value = '';
        });
        
        // Handle Shift+Enter for new line
        const textarea = messageForm.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const event = new Event('submit', { cancelable: true });
                    messageForm.dispatchEvent(event);
                }
            });
        }
    }
}

/**
 * Initialize message edit buttons
 */
function initMessageEditButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-message-btn')) {
            const button = e.target.closest('.edit-message-btn');
            const messageId = button.getAttribute('data-message-id');
            const messageElement = document.getElementById(`message-${messageId}`);
            
            if (messageElement) {
                startEditingMessage(messageElement);
            }
        }
    });
}

/**
 * Initialize message delete buttons
 */
function initMessageDeleteButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-message-btn')) {
            const button = e.target.closest('.delete-message-btn');
            const messageId = button.getAttribute('data-message-id');
            
            if (confirm('Are you sure you want to delete this message?')) {
                deleteMessage(messageId);
            }
        }
    });
}

/**
 * Initialize message container scrolling behavior
 */
function initMessageScrolling() {
    const messageContainer = document.querySelector('.message-container');
    
    if (messageContainer) {
        // Scroll to bottom on load
        scrollToBottom(messageContainer);
        
        // Auto-scroll on new messages only if near bottom
        messageContainer.addEventListener('DOMNodeInserted', function(e) {
            // Check if the inserted node is a message
            if (e.target.classList && e.target.classList.contains('message')) {
                // Only auto-scroll if already near the bottom
                const isNearBottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight < 100;
                
                if (isNearBottom) {
                    scrollToBottom(messageContainer);
                }
            }
        });
    }
}

/**
 * Scroll element to bottom
 * @param {HTMLElement} element - Element to scroll
 */
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

/**
 * Send a message
 * @param {string} channelId - Channel ID
 * @param {string} content - Message content
 */
function sendMessage(channelId, content) {
    MiscVordAjax.post(`/api/channels/${channelId}/messages`, {
        content: content
    }, {
        onSuccess: function(response) {
            if (response.success) {
                // Message will be added by WebSocket
                // But we could add it directly for quicker feedback
                if (response.data && response.data.message) {
                    addMessageToUI(response.data.message);
                }
            }
        },
        // Don't show toast for successful message sending
        showToast: false
    });
}

/**
 * Start editing a message
 * @param {HTMLElement} messageElement - Message element
 */
function startEditingMessage(messageElement) {
    // Get message content
    const contentContainer = messageElement.querySelector('.message-content');
    if (!contentContainer) return;
    
    const originalContent = contentContainer.textContent;
    const messageId = messageElement.getAttribute('data-message-id');
    
    // Create edit form
    const editForm = document.createElement('form');
    editForm.className = 'edit-message-form';
    editForm.innerHTML = `
        <textarea class="message-edit-textarea w-full bg-discord-dark border border-gray-600 rounded-md p-2 text-white">${originalContent}</textarea>
        <div class="flex justify-end mt-2">
            <button type="button" class="cancel-edit-btn text-gray-400 mr-2">Cancel</button>
            <button type="submit" class="bg-discord-blue text-white px-3 py-1 rounded-md">Save</button>
        </div>
    `;
    
    // Replace content with edit form
    contentContainer.innerHTML = '';
    contentContainer.appendChild(editForm);
    
    // Focus textarea
    const textarea = editForm.querySelector('textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    // Handle cancel
    editForm.querySelector('.cancel-edit-btn').addEventListener('click', function() {
        contentContainer.innerHTML = originalContent;
    });
    
    // Handle submit
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newContent = textarea.value.trim();
        
        if (newContent && newContent !== originalContent) {
            updateMessage(messageId, newContent);
        } else {
            contentContainer.innerHTML = originalContent;
        }
    });
}

/**
 * Update a message
 * @param {string} messageId - Message ID
 * @param {string} content - New content
 */
function updateMessage(messageId, content) {
    MiscVordAjax.put(`/api/messages/${messageId}`, {
        content: content
    }, {
        onSuccess: function(response) {
            if (response.success && response.data.message) {
                // Update the message in UI
                updateMessageInUI(response.data.message);
            }
        }
    });
}

/**
 * Delete a message
 * @param {string} messageId - Message ID
 */
function deleteMessage(messageId) {
    MiscVordAjax.delete(`/api/messages/${messageId}`, {
        onSuccess: function(response) {
            if (response.success) {
                // Remove message from UI (if not already removed by WebSocket)
                const messageElement = document.getElementById(`message-${messageId}`);
                if (messageElement) {
                    messageElement.remove();
                }
            }
        }
    });
}

/**
 * Add a message to the UI
 * @param {Object} message - Message object
 */
function addMessageToUI(message) {
    const messageContainer = document.querySelector('.message-container');
    if (!messageContainer) return;
    
    const messageElement = createMessageElement(message);
    messageContainer.appendChild(messageElement);
    
    // Scroll to bottom if already near bottom
    const isNearBottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight < 100;
    if (isNearBottom) {
        scrollToBottom(messageContainer);
    }
}

/**
 * Update a message in the UI
 * @param {Object} message - Message object
 */
function updateMessageInUI(message) {
    const messageElement = document.getElementById(`message-${message.id}`);
    if (!messageElement) return;
    
    const contentContainer = messageElement.querySelector('.message-content');
    if (contentContainer) {
        contentContainer.textContent = message.content;
    }
    
    // Add edited indicator if not already present
    if (message.edited_at) {
        const editedIndicator = messageElement.querySelector('.edited-indicator');
        if (!editedIndicator) {
            const timeElement = messageElement.querySelector('.message-time');
            if (timeElement) {
                const editedSpan = document.createElement('span');
                editedSpan.className = 'edited-indicator text-gray-500 text-xs ml-1';
                editedSpan.textContent = '(edited)';
                timeElement.appendChild(editedSpan);
            }
        }
    }
}

/**
 * Create a message element
 * @param {Object} message - Message object
 * @returns {HTMLElement} - Message element
 */
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = 'message flex p-2 hover:bg-discord-light/10 transition-colors group';
    div.id = `message-${message.id}`;
    div.setAttribute('data-message-id', message.id);
    div.setAttribute('data-user-id', message.user.id);
    
    const currentUserId = document.body.getAttribute('data-user-id');
    const isOwnMessage = currentUserId && currentUserId === message.user.id;
    
    div.innerHTML = `
        <div class="flex-shrink-0 mr-3">
            <img src="${message.user.avatar_url || '/public/assets/default-avatar.png'}" alt="${message.user.username}" class="w-10 h-10 rounded-full">
        </div>
        <div class="flex-grow">
            <div class="flex items-center">
                <span class="font-medium text-white">${message.user.username}</span>
                <span class="message-time text-gray-400 text-xs ml-2">${message.formatted_time}</span>
            </div>
            <div class="message-content text-gray-200 break-words whitespace-pre-wrap">${message.content}</div>
        </div>
        ${isOwnMessage ? `
        <div class="message-actions opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <button class="edit-message-btn text-gray-400 hover:text-white mr-2" data-message-id="${message.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-message-btn text-gray-400 hover:text-red-500" data-message-id="${message.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        ` : ''}
    `;
    
    return div;
} 