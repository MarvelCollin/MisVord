document.addEventListener("DOMContentLoaded", function () {
  window.logger.info("messaging", "Chat section initializing...");

  window.MisVordDebug = {
    initialized: false,
    messagingAvailable: false,
    errors: [],
    logs: [],

    log: function (message, data) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        data: data || {},
      };
      this.logs.push(logEntry);
      console.log(`[MisVordDebug] ${message}`, data);
      if (this.logs.length > 50) this.logs.shift();
    },
    error: function (message, error) {
      const errorEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        error: error ? error.toString() : "Unknown error",
        stack: error ? error.stack : "No stack trace",
      };
      this.errors.push(errorEntry);
      console.error(`[MisVordDebug] ${message}`, error);
      if (this.errors.length > 20) this.errors.shift();
    },

    getDebugInfo: function () {
      return {
        initialized: this.initialized,
        messagingAvailable: this.messagingAvailable,
        socketAvailable: typeof io !== "undefined",
        globalSocketManager: !!window.globalSocketManager,
        MisVordMessaging: !!window.MisVordMessaging,
        recentErrors: this.errors.slice(-5),
        recentLogs: this.logs.slice(-10),
      };
    },
  };

  const messageInput = document.getElementById("message-input");
  const characterCount = document.querySelector(".character-count");
  const characterCountContainer = document.querySelector(
    ".character-count-container"
  );
  const sendButton = document.getElementById("send-button");

  window.MisVordDebug.log("Chat elements check", {
    messageInput: !!messageInput,
    characterCount: !!characterCount,
    sendButton: !!sendButton,
    messageForm: !!document.getElementById("message-form"),
    chatMessages: !!document.getElementById("chat-messages"),
  });

  if (messageInput && sendButton) {
    window.MisVordDebug.log(
      "Message input and send button found - initializing chat interface"
    );

    messageInput.addEventListener("input", function (e) {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 160) + "px";

      const length = this.value.length;
      if (characterCount) {
        characterCount.textContent = length;

        if (length > 1900) {
          characterCountContainer?.classList.remove("hidden");
          characterCount.classList.add("text-red-400");
        } else if (length > 1500) {
          characterCountContainer?.classList.remove("hidden");
          characterCount.classList.remove("text-red-400");
        } else {
          characterCountContainer?.classList.add("hidden");
          characterCount.classList.remove("text-red-400");
        }
      }

      const hasContent = this.value.trim().length > 0;
      sendButton.disabled = !hasContent;
    });

    messageInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
          sendButton.click();
        }
      }
    });

    sendButton.addEventListener("click", async function (e) {
      e.preventDefault();
      const form = document.getElementById("message-form");
      if (form) {
        await handleMessageSubmit(form);
      }
    });

    sendButton.disabled = true;
  } else {
    window.MisVordDebug.log("Chat interface not available", {
      messageInput: !!messageInput,
      sendButton: !!sendButton,
      reason: "No active channel selected or channel is voice-only",
    });

    const currentPath = window.location.pathname;
    const serverMatch = currentPath.match(/^\/servers\/(\d+)$/);
    if (serverMatch && !window.location.search.includes("channel=")) {
      window.MisVordDebug.log(
        "Server page detected without channel parameter - this is expected behavior"
      );
    }
  }
  async function handleMessageSubmit(form) {
    const messageInput = form.querySelector("#message-input");
    const sendButton = form.querySelector("#send-button");
    const content = messageInput.value.trim();

    if (!content || content.length === 0) return;
    if (content.length > 2000) {
      window.MisVordDebug.error("Message too long", { length: content.length });
      return;
    }

    const formData = new FormData(form);
    const chatType = formData.get("chat_type");
    const chatId = formData.get("chat_id");

    window.MisVordDebug.log("Submitting message", {
      chatType,
      chatId,
      contentLength: content.length,
    });

    try {
      if (
        window.MisVordMessaging &&
        typeof window.MisVordMessaging.sendMessage === "function"
      ) {
        messageInput.value = "";
        messageInput.style.height = "auto";
        if (sendButton) sendButton.disabled = true;
        characterCountContainer?.classList.add("hidden");

        await window.MisVordMessaging.sendMessage(chatId, content, chatType);
      } else {
        throw new Error("MisVordMessaging not available");
      }
    } catch (error) {
      window.MisVordDebug.error("Message send failed", error);
      messageInput.value = content;
      if (sendButton) sendButton.disabled = false;
    }
  }

  const getMeta = (name) => {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute("content") : null;
  };

  const chatType = getMeta("chat-type") || "channel";
  const chatId =
    getMeta("chat-id") ||
    getMeta("channel-id") ||
    (messageInput
      ? messageInput.getAttribute("data-chat-id") ||
        messageInput.getAttribute("data-channel-id")
      : "");
  const channelId =
    getMeta("channel-id") || (chatType === "channel" ? chatId : "");
  const userId = getMeta("user-id");
  const username = getMeta("username");

  window.MisVordDebug.log("Socket connection data", {
    chatType,
    chatId,
    channelId,
    userId,
    username,
  });

  let socketData = document.getElementById("socket-data");
  if (!socketData) {
    socketData = document.createElement("div");
    socketData.id = "socket-data";
    socketData.style.display = "none";
    document.body.appendChild(socketData);
  }

  socketData.setAttribute("data-chat-type", chatType);
  socketData.setAttribute("data-chat-id", chatId);
  socketData.setAttribute("data-channel-id", channelId);
  socketData.setAttribute("data-user-id", userId);
  socketData.setAttribute("data-username", username);

  window.MisVordDebug.log(
    "Socket data element created/updated and added to DOM"
  );
  const urlParams = new URLSearchParams(window.location.search);
  const dmParam = urlParams.get("dm");
  if (dmParam) {
    window.MisVordDebug.log("Direct message parameter detected:", dmParam);

    socketData.setAttribute("data-chat-id", dmParam);
    socketData.setAttribute("data-chat-type", "direct");
    socketData.setAttribute("data-channel-id", "");

    const initDirectMessage = () => {
      if (window.MisVordMessaging && window.MisVordMessaging.initialized) {
        window.MisVordMessaging.setChatContext(dmParam, "direct");
        window.MisVordDebug.log(
          "✅ Direct message context set via MisVordMessaging"
        );
      } else if (
        window.unifiedChatManager &&
        window.unifiedChatManager.initialized
      ) {
        window.unifiedChatManager.switchToChat(dmParam, "direct");
        window.MisVordDebug.log(
          "✅ Direct message context set via unifiedChatManager"
        );
      } else {
        setTimeout(initDirectMessage, 100);
      }
    };

    setTimeout(initDirectMessage, 500);
  }

  if (typeof io !== "undefined") {
    window.MisVordDebug.log("Socket.IO is available");

    window.addEventListener("MisVordGlobalReady", function (event) {
      window.MisVordDebug.log("Global socket manager is ready:", event.detail);
      window.MisVordDebug.initialized = true;

      const socketStatus = document.querySelector(".socket-status");
      if (socketStatus && event.detail.socketManager.isReady()) {
        socketStatus.innerHTML =
          '<span class="text-green-500">•</span> <span class="ml-1">Connected</span>';
      }
    });

    if (window.globalSocketManager) {
      window.MisVordDebug.log("Global socket manager already available");
      window.MisVordDebug.initialized = true;

      const socketStatus = document.querySelector(".socket-status");
      if (socketStatus && window.globalSocketManager.isReady()) {
        socketStatus.innerHTML =
          '<span class="text-green-500">•</span> <span class="ml-1">Connected</span>';
      }
    }
  } else {
    window.MisVordDebug.error("Socket.IO not available - messaging disabled");

    const socketStatus = document.querySelector(".socket-status");
    if (socketStatus) {
      socketStatus.innerHTML =
        '<span class="text-red-500">•</span> <span class="ml-1">WebSocket required - please refresh</span>';
    }

    if (messageInput) {
      messageInput.disabled = true;
      messageInput.placeholder = "WebSocket connection required for messaging";
    }
  }

  const messagesContainer = document.getElementById("chat-messages");
  if (messagesContainer) {
    const hasMessages = messagesContainer.querySelector('[id^="msg-"]');
    if (hasMessages) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }

    const observer = new MutationObserver(() => {
      const isAtBottom =
        messagesContainer.scrollTop + messagesContainer.clientHeight >=
        messagesContainer.scrollHeight - 50;
      if (isAtBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });

    observer.observe(messagesContainer, {
      childList: true,
      subtree: true,
    });
  }

  window.MisVordDebug.log("Chat section initialization complete");

  let contextMenu = null;
  let currentMessageId = null;
  let currentMessageData = null;

  function initializeContextMenu() {
    contextMenu = document.getElementById("message-context-menu");
    if (!contextMenu) {
      window.MisVordDebug.error("Context menu element not found");
      return;
    }

    document.addEventListener("click", (e) => {
      if (!contextMenu.contains(e.target) && !e.target.closest(".more-btn")) {
        hideContextMenu();
      }
    });

    const messagesContainer = document.getElementById("chat-messages");
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", hideContextMenu);
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest(".more-btn")) {
        const btn = e.target.closest(".more-btn");
        showContextMenu(e, btn);
        e.preventDefault();
        e.stopPropagation();
      }
    });

    setupContextMenuHandlers();
  }

  function showContextMenu(event, button) {
    if (!contextMenu) return;

    currentMessageId = button.dataset.messageId;
    const isOwner = button.dataset.isOwner === "true";
    const userId = button.dataset.userId;

    currentMessageData = {
      id: currentMessageId,
      userId: userId,
      isOwner: isOwner,
    };

    updateContextMenuItems(isOwner);

    const rect = button.getBoundingClientRect();
    contextMenu.style.left = `${rect.left}px`;
    contextMenu.style.top = `${rect.bottom + 5}px`;

    const menuRect = contextMenu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (rect.left + menuRect.width > windowWidth) {
      contextMenu.style.left = `${windowWidth - menuRect.width - 10}px`;
    }

    if (rect.bottom + menuRect.height > windowHeight) {
      contextMenu.style.top = `${rect.top - menuRect.height - 5}px`;
    }

    contextMenu.classList.remove("hidden");
    window.MisVordDebug.log("Context menu shown for message", currentMessageId);
  }

  function hideContextMenu() {
    if (contextMenu) {
      contextMenu.classList.add("hidden");
      currentMessageId = null;
      currentMessageData = null;
    }
  }

  function updateContextMenuItems(isOwner) {
    const editBtn = contextMenu.querySelector(".edit-message-btn");
    const deleteBtn = contextMenu.querySelector(".delete-message-btn");

    if (editBtn) {
      editBtn.style.display = isOwner ? "flex" : "none";
    }
    if (deleteBtn) {
      deleteBtn.style.display = isOwner ? "flex" : "none";
    }
  }

  function setupContextMenuHandlers() {
    contextMenu.querySelectorAll(".emoji-btn[data-emoji]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const emoji = btn.dataset.emoji;
        addReaction(currentMessageId, emoji);
        hideContextMenu();
      });
    });

    const addReactionBtn = contextMenu.querySelector(".add-reaction-btn");
    if (addReactionBtn) {
      addReactionBtn.addEventListener("click", (e) => {
        showEmojiPicker();
        hideContextMenu();
      });
    }

    const editBtn = contextMenu.querySelector(".edit-message-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        editMessage(currentMessageId);
        hideContextMenu();
      });
    }

    const replyBtn = contextMenu.querySelector(".reply-message-btn");
    if (replyBtn) {
      replyBtn.addEventListener("click", (e) => {
        replyToMessage(currentMessageId);
        hideContextMenu();
      });
    }

    const forwardBtn = contextMenu.querySelector(".forward-message-btn");
    if (forwardBtn) {
      forwardBtn.addEventListener("click", (e) => {
        forwardMessage(currentMessageId);
        hideContextMenu();
      });
    }

    const copyTextBtn = contextMenu.querySelector(".copy-text-btn");
    if (copyTextBtn) {
      copyTextBtn.addEventListener("click", (e) => {
        copyMessageText(currentMessageId);
        hideContextMenu();
      });
    }

    const pinBtn = contextMenu.querySelector(".pin-message-btn");
    if (pinBtn) {
      pinBtn.addEventListener("click", (e) => {
        pinMessage(currentMessageId);
        hideContextMenu();
      });
    }

    const markUnreadBtn = contextMenu.querySelector(".mark-unread-btn");
    if (markUnreadBtn) {
      markUnreadBtn.addEventListener("click", (e) => {
        markMessageUnread(currentMessageId);
        hideContextMenu();
      });
    }

    const copyLinkBtn = contextMenu.querySelector(".copy-link-btn");
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", (e) => {
        copyMessageLink(currentMessageId);
        hideContextMenu();
      });
    }

    const speakBtn = contextMenu.querySelector(".speak-message-btn");
    if (speakBtn) {
      speakBtn.addEventListener("click", (e) => {
        speakMessage(currentMessageId);
        hideContextMenu();
      });
    }

    const deleteBtn = contextMenu.querySelector(".delete-message-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        deleteMessage(currentMessageId);
        hideContextMenu();
      });
    }

    const copyIdBtn = contextMenu.querySelector(".copy-id-btn");
    if (copyIdBtn) {
      copyIdBtn.addEventListener("click", (e) => {
        copyMessageId(currentMessageId);
        hideContextMenu();
      });
    }
  }

  function addReaction(messageId, emoji) {
    window.MisVordDebug.log("Adding reaction", { messageId, emoji });

    showToast(`Added ${emoji} reaction`);
  }

  function showEmojiPicker() {
    window.MisVordDebug.log("Opening emoji picker");

    showToast("Emoji picker coming soon!");
  }

  function editMessage(messageId) {
    window.MisVordDebug.log("Editing message", messageId);
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      const contentElement = messageElement.querySelector(".text-gray-300");
      if (contentElement) {
        const currentText = contentElement.textContent;
        const input = document.createElement("textarea");
        input.value = currentText;
        input.className =
          "w-full bg-discord-message-input text-white p-2 rounded resize-none";
        input.style.minHeight = "40px";

        contentElement.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
          const newContent = input.value.trim();
          if (newContent && newContent !== currentText) {
            updateMessage(messageId, newContent);
          }
          restoreMessageContent();
        };

        const restoreMessageContent = () => {
          const newContentElement = document.createElement("div");
          newContentElement.className = "text-gray-300 select-text break-words";
          newContentElement.textContent = input.value || currentText;
          input.replaceWith(newContentElement);
        };

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
          } else if (e.key === "Escape") {
            restoreMessageContent();
          }
        });

        input.addEventListener("blur", saveEdit);
      }
    }
  }

  function replyToMessage(messageId) {
    window.MisVordDebug.log("Replying to message", messageId);
    const messageInput = document.getElementById("message-input");
    if (messageInput) {
      messageInput.focus();
    }
    showToast("Reply feature coming soon!");
  }

  function forwardMessage(messageId) {
    window.MisVordDebug.log("Forwarding message", messageId);
    showToast("Forward feature coming soon!");
  }

  function copyMessageText(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      const contentElement = messageElement.querySelector(".text-gray-300");
      if (contentElement) {
        navigator.clipboard
          .writeText(contentElement.textContent)
          .then(() => {
            showToast("Message copied to clipboard");
          })
          .catch(() => {
            showToast("Failed to copy message");
          });
      }
    }
  }

  function pinMessage(messageId) {
    window.MisVordDebug.log("Pinning message", messageId);
    showToast("Pin feature coming soon!");
  }

  function markMessageUnread(messageId) {
    window.MisVordDebug.log("Marking message unread", messageId);
    showToast("Mark unread feature coming soon!");
  }

  function copyMessageLink(messageId) {
    const chatType = window.ChatData?.chatType || "channel";
    const targetId = window.ChatData?.targetId || "";
    const link = `${window.location.origin}/app#${chatType}/${targetId}/${messageId}`;

    navigator.clipboard
      .writeText(link)
      .then(() => {
        showToast("Message link copied to clipboard");
      })
      .catch(() => {
        showToast("Failed to copy message link");
      });
  }

  function speakMessage(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      const contentElement = messageElement.querySelector(".text-gray-300");
      if (contentElement && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          contentElement.textContent
        );
        speechSynthesis.speak(utterance);
        showToast("Speaking message...");
      } else {
        showToast("Text-to-speech not supported");
      }
    }
  }

  function deleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
      window.MisVordDebug.log("Deleting message", messageId);

      fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast("Message deleted");
            const messageElement = document.getElementById(`msg-${messageId}`);
            if (messageElement) {
              messageElement.remove();
            }
          } else {
            showToast("Failed to delete message");
          }
        })
        .catch((error) => {
          window.MisVordDebug.error("Error deleting message", error);
          showToast("Failed to delete message");
        });
    }
  }

  function copyMessageId(messageId) {
    navigator.clipboard
      .writeText(messageId)
      .then(() => {
        showToast("Message ID copied to clipboard");
      })
      .catch(() => {
        showToast("Failed to copy message ID");
      });
  }

  function updateMessage(messageId, content) {
    fetch(`/api/messages/${messageId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ content: content }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast("Message updated");
        } else {
          showToast("Failed to update message");

          location.reload();
        }
      })
      .catch((error) => {
        window.MisVordDebug.error("Error updating message", error);
        showToast("Failed to update message");
        location.reload();
      });
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-4 right-4 bg-discord-dark text-white px-4 py-2 rounded shadow-lg z-50";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  window.MisVordDebug.log("Initializing context menu...");
  initializeContextMenu();
});
