import { showToast } from "../../core/ui/toast.js";

class MessageHandler {
  constructor(messaging) {
    this.messaging = messaging;
    this.hasMoreMessages = true;
    this.loadingMessages = false;
    this.currentOffset = 0;
    this.messageHistory = [];
    this.isSubmitting = false;
    this.lastSubmitTime = 0;
    this.typingTimeout = null;
  }

  async sendMessage(
    chatType,
    chatId,
    content,
    messageType = "text",
    attachments = [],
    mentions = []
  ) {
    if (!chatId || !content) {
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const now = Date.now();
    if (now - this.lastSubmitTime < 1000) {
      // 1-second cooldown
      return;
    }

    this.isSubmitting = true;
    this.lastSubmitTime = now;
    try {
      const messageData = {
        content: content.trim(),
        message_type: messageType,
        attachments: attachments,
        mentions: mentions,
        target_type: chatType === "direct" ? "dm" : "channel",
        target_id: chatId,
      };

      console.log("🚀 SENDING MESSAGE DATA:", messageData);
      console.log("🎯 Chat Type:", chatType, "Chat ID:", chatId);

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.data && result.data.message) {
          this.addMessageToContainerWithAnimation(result.data.message);
        }

        this.trackMessage("MESSAGE_SENT", {
          chatType: chatType,
          chatId: chatId,
          messageType: messageType,
        });

        return result;
      } else {
        const error = await response.text();
        showToast("Failed to send message", "error");
        throw new Error(error);
      }
    } catch (error) {
      showToast("Failed to send message", "error");
      console.error("Error sending message:", error);
      throw error;
    } finally {
      this.isSubmitting = false;
    }
  }
  onNewMessage(data) {
    console.log("📨 NEW MESSAGE RECEIVED:", data);

    if (!data) {
      console.log("❌ REJECTED: Missing data");
      return;
    }
    
    let isForCurrentChat = false;
    let targetId = null;
    let chatType = null;
    
    // Standardize the data structure
    if (data.chatRoomId || data.roomId) {
      targetId = data.chatRoomId || data.roomId;
      chatType = "direct";
      isForCurrentChat = String(targetId) === String(this.messaging.activeChatRoom);
    } else if (data.channelId) {
      targetId = data.channelId;
      chatType = "channel";
      isForCurrentChat = String(targetId) === String(this.messaging.activeChannel);
    } else {
      console.log("❌ REJECTED: Missing target ID (chatRoomId, roomId or channelId)");
      return;
    }
    
    const isOwnMessage = String(data.user_id) === String(this.messaging.userId);
    
    // Standardize timestamp handling
    data.timestamp = data.timestamp || data.created_at || data.sent_at || new Date().toISOString();

    console.log("🔍 MESSAGE CHECK:", {
      targetId: targetId,
      chatType: chatType,
      activeChannel: this.messaging.activeChannel,
      activeChatRoom: this.messaging.activeChatRoom,
      isForCurrentChat: isForCurrentChat,
      messageUserId: data.user_id,
      currentUserId: this.messaging.userId,
      isOwnMessage: isOwnMessage,
    });

    // Always display messages for current chat, even if they're our own
    // (except for temp messages that will be handled separately)
    if (isForCurrentChat && !data.temp) {
      console.log("✅ DISPLAYING MESSAGE");
      this.addMessageToContainerWithAnimation(data);
    } else if (!isForCurrentChat) {
      console.log("❌ MESSAGE REJECTED: Not for current chat");
    }

    this.trackMessage("MESSAGE_RECEIVED", {
      messageId: data.id,
      targetId: targetId,
      chatType: chatType,
      fromUser: data.user_id,
      isForCurrentChat: isForCurrentChat,
      isOwnMessage: isOwnMessage
    });
  }

  trackMessage(event, data = {}) {
    const messageInfo = {
      event: event,
      timestamp: new Date().toISOString(),
      activeChannel: this.messaging.activeChannel,
      activeChatRoom: this.messaging.activeChatRoom,
      chatType: this.messaging.chatType,
      data: data,
    };

    this.messageHistory.push(messageInfo);

    if (this.messageHistory.length > 30) {
      this.messageHistory.shift();
    }
  }

  async loadMessages(chatType, chatId, offset = 0) {
    if (this.loadingMessages) {
      return;
    }

    this.loadingMessages = true;
    this.showSkeletonLoader();

    try {
      const routeChatType = chatType === "direct" ? "dm" : chatType;
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
        } else {
          this.displayMessages([], offset === 0); // Clear and show empty message
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      showToast("Error loading messages", "error");
    } finally {
      this.loadingMessages = false;
      this.hideSkeletonLoader();
    }
  }

  displayMessages(messages, clearFirst = false) {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    if (clearFirst) {
      messagesContainer.innerHTML = "";
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      if (clearFirst) {
        messagesContainer.innerHTML =
          '<div class="p-4 text-center text-gray-500">No messages yet. Start the conversation!</div>';
      }
      return;
    }

    let previousMessage = null;
    if (!clearFirst && messagesContainer.children.length > 0) {
      const lastMessageEl =
        messagesContainer.children[messagesContainer.children.length - 1];
      if (lastMessageEl.dataset.userId) {
        previousMessage = {
          user_id: lastMessageEl.dataset.userId,
          created_at: lastMessageEl.dataset.createdAt,
        };
      }
    }

    messages.forEach((message) => {
      const isGrouped = this.shouldGroupMessage(message, previousMessage);
      const messageElement = this.createMessageElement(message, isGrouped);
      messageElement.dataset.createdAt = message.created_at || message.sent_at;
      messagesContainer.appendChild(messageElement);
      previousMessage = message;
    });

    if (clearFirst) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  addMessageToContainerWithAnimation(message) {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    // If the "No messages yet" placeholder is there, remove it.
    const placeholder = messagesContainer.querySelector(".text-center");
    if (placeholder) placeholder.remove();

    let previousMessage = null;
    const existingMessages = messagesContainer.children;
    if (existingMessages.length > 0) {
      const lastMessage = existingMessages[existingMessages.length - 1];
      if (lastMessage.dataset.userId) {
        previousMessage = {
          user_id: lastMessage.dataset.userId,
          created_at: lastMessage.dataset.createdAt,
        };
      }
    }

    const isGrouped = this.shouldGroupMessage(message, previousMessage);
    const messageElement = this.createMessageElement(message, isGrouped);
    messageElement.dataset.createdAt = message.created_at || message.sent_at;

    messageElement.style.opacity = "0";
    messageElement.style.transform = "translateY(20px)";
    messageElement.style.transition = "opacity 0.4s ease, transform 0.4s ease";

    messagesContainer.appendChild(messageElement);

    requestAnimationFrame(() => {
      messageElement.style.opacity = "1";
      messageElement.style.transform = "translateY(0)";
    });

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });

    if (String(message.user_id) !== String(this.messaging.userId)) {
      this.playMessageSound();
    }
  }

  createMessageElement(message, isGrouped = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className =
      "message-row hover:bg-gray-800/40 py-0.5 px-4 group relative";
    messageDiv.dataset.messageId = message.id;
    messageDiv.dataset.userId = message.user_id;

    const time = new Date(
      message.created_at || message.sent_at
    ).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const fullTimestamp = this.formatFullDate(
      message.created_at || message.sent_at
    );
    const avatarUrl =
      message.avatar_url ||
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIwIiBmaWxsPSIjNTg2NUYyIi8+CiAgICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjE1IiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgogICAgPHBhdGggZD0iTTggMzJDOCAyNi41IDEyLjUgMjIgMTggMjJIMjJDMjcuNSAyMiAzMiAyNi41IDMyIDMyVjM1QzMyIDM2LjEgMzEuMSAzNyAzMCAzN0gxMEM4LjkgMzcgOCAzNi4xIDggMzVWMzJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";

    if (isGrouped) {
      messageDiv.innerHTML = `
                <div class="ml-16 relative">
                    <span class="absolute left-[-60px] text-xs text-gray-500 opacity-0 group-hover:opacity-100 w-14 text-right pr-1 mt-0.5 transition-opacity">
                        ${time}
                    </span>
                    <div class="text-sm text-gray-300 leading-5 break-words pr-16">
                        ${this.escapeHtml(message.content)}
                    </div>
                </div>
            `;
    } else {
      messageDiv.classList.add("mt-3");
      messageDiv.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0 w-10 h-10 mr-4">
                        <img src="${this.escapeHtml(
                          avatarUrl
                        )}" alt="${this.escapeHtml(message.username)}" 
                             class="w-10 h-10 rounded-full">
                    </div>
                    <div class="flex-1 min-w-0 pr-16">
                        <div class="flex items-baseline mb-1">
                            <span class="font-medium text-white hover:underline cursor-pointer mr-2 text-sm">
                                ${this.escapeHtml(message.username)}
                            </span>
                            <span class="text-xs text-gray-500" title="${fullTimestamp}">
                                ${time}
                            </span>
                        </div>
                        <div class="text-sm text-gray-300 leading-5 break-words">
                            ${this.escapeHtml(message.content)}
                        </div>
                    </div>
                </div>
            `;
    }
    return messageDiv;
  }

  shouldGroupMessage(currentMessage, previousMessage) {
    if (!previousMessage || !currentMessage) return false;
    if (String(currentMessage.user_id) !== String(previousMessage.user_id))
      return false;

    const currentTime = new Date(
      currentMessage.created_at || currentMessage.sent_at
    );
    const previousTime = new Date(
      previousMessage.created_at || previousMessage.sent_at
    );
    const timeDiff = (currentTime - previousTime) / 1000; // difference in seconds

    return timeDiff < 300; // Group if messages are within 5 minutes
  }

  showSkeletonLoader() {
    const container = document.getElementById("chat-messages");
    if (!container || document.getElementById("skeleton-loader")) return;

    container.innerHTML = ""; // Clear previous content
    const skeleton = document.createElement("div");
    skeleton.id = "skeleton-loader";
    skeleton.className = "p-4 space-y-4";
    skeleton.innerHTML = Array.from({ length: 8 })
      .map(
        () => `
            <div class="flex items-start animate-pulse">
                <div class="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 mr-4"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 w-24 bg-gray-700 rounded"></div>
                    <div class="h-4 w-3/4 bg-gray-700 rounded"></div>
                </div>
            </div>
        `
      )
      .join("");
    container.appendChild(skeleton);
  }

  hideSkeletonLoader() {
    const skeleton = document.getElementById("skeleton-loader");
    if (skeleton) {
      skeleton.remove();
    }
  }

  formatFullDate(dateStr) {
    if (!dateStr) return "Unknown time";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return dateStr;
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  playMessageSound() {
    try {
      if (this.messaging.config && this.messaging.config.soundEnabled) {
        const audio = new Audio("/assets/sounds/message.mp3");
        audio.volume = 0.3;
        audio.play().catch((error) => console.log("Audio play failed:", error));
      }
    } catch (error) {
      console.error("Could not play sound:", error);
    }
  }

  showTypingIndicator(username) {
    this.hideTypingIndicator(); // Ensure only one indicator is shown

    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    const typingDiv = document.createElement("div");
    typingDiv.id = "typing-indicator";
    typingDiv.className =
      "typing-indicator flex items-center p-2 px-4 text-sm text-gray-400";
    typingDiv.innerHTML = `
            <div class="typing-dots flex space-x-1 mr-2">
                <div class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                <div class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
            </div>
            <strong>${this.escapeHtml(username)}</strong> 
        `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.typingTimeout = setTimeout(() => this.hideTypingIndicator(), 5000);
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  handleTypingStart(username) {
    if (String(username) !== String(this.messaging.username)) {
      this.showTypingIndicator(username);
    }
  }

  handleTypingStop() {
    this.hideTypingIndicator();
  }

  createTemporaryMessage(content, chatType, chatId) {
    const tempMessage = {
      id: "temp-" + Date.now(),
      content: content,
      user_id: this.messaging.userId,
      username: this.messaging.username,
      avatar_url: this.messaging.userAvatar,
      created_at: new Date().toISOString(),
      temp: true,
    };

    const messageElement = this.createMessageElement(tempMessage);
    messageElement.classList.add("temp-message");
    messageElement.style.opacity = "0.7";

    const messagesContainer = document.getElementById("chat-messages");
    if (messagesContainer) {
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    return messageElement;
  }

  removeTemporaryMessage(tempElement) {
    if (tempElement && tempElement.parentNode) {
      tempElement.style.transition = "opacity 0.3s ease";
      tempElement.style.opacity = "0";
      setTimeout(() => {
        if (tempElement.parentNode) {
          tempElement.parentNode.removeChild(tempElement);
        }
      }, 300);
    }
  }
}

export default MessageHandler;
