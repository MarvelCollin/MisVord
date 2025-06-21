class UnifiedChatManager {
  constructor() {
    this.chatContainer = document.querySelector(".flex-col.flex-1");
    this.currentChatType = null;
    this.currentChatId = null;
    this.chatAPI = window.ChatAPI;
    this.socketAPI = window.socketAPI;
    this.messaging = null;
    this.initialized = false;

    this.init();

    window.unifiedChatManager = this;
  }

  init() {
    this.setupEventListeners();

    const waitForMessaging = () => {
      if (window.MisVordMessaging) {
        this.messaging = window.MisVordMessaging;
        this.initialized = true;
        console.log("✅ UnifiedChatManager initialized with messaging system");
      } else {
        setTimeout(waitForMessaging, 100);
      }
    };

    waitForMessaging();
  }

  setupEventListeners() {
    document.addEventListener("globalSocketReady", () => {
      this.socketReady = true;
    });

    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.chatType && event.state.chatId) {
        this.switchToChat(event.state.chatId, event.state.chatType, false);
      }
    });
  }

  async switchToChat(chatId, chatType = "channel", updateHistory = true) {
    if (!chatId) return;

    this.currentChatType = chatType;
    this.currentChatId = chatId;

    try {
      let chatData, messages;

      if (chatType === "channel") {
        const response = await fetch(`/api/channels/${chatId}`);
        const channelData = await response.json();

        if (!channelData.success) {
          throw new Error(channelData.message || "Failed to load channel");
        }

        chatData = channelData.data;

        const messagesResponse = await fetch(
          `/api/channels/${chatId}/messages`
        );
        const messagesData = await messagesResponse.json();
        messages = messagesData.data || [];
      } else if (chatType === "direct" || chatType === "dm") {
        const response = await fetch(`/api/chat/dm/${chatId}`);
        const dmData = await response.json();

        if (!dmData.success) {
          throw new Error(dmData.message || "Failed to load direct message");
        }

        chatData = dmData;

        const messagesResponse = await fetch(`/api/chat/dm/${chatId}/messages`);
        const messagesData = await messagesResponse.json();
        messages = messagesData.messages || [];
      }

      this.updateChatUI(chatId, chatType, chatData, messages);

      if (updateHistory) {
        const url =
          chatType === "channel"
            ? `/server/${chatData.server_id || "direct"}?channel=${chatId}`
            : `/app?dm=${chatId}`;

        window.history.pushState({ chatId, chatType }, "", url);
      }

      return true;
    } catch (error) {
      console.error("Error switching chat:", error);
      return false;
    }
  }

  updateChatUI(chatId, chatType, chatData, messages) {
    window.GLOBALS = window.GLOBALS || {};
    window.GLOBALS.chatType = chatType;
    window.GLOBALS.targetId = chatId;
    window.GLOBALS.chatData = chatData;
    window.GLOBALS.messages = messages;

    const routeChatType = chatType === "direct" ? "dm" : chatType;
    const endpoint = `/api/chat/render/${routeChatType}/${chatId}`;

    fetch(endpoint)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        this.chatContainer.innerHTML = html;

        setTimeout(() => {
          if (window.MisVordMessaging) {
            window.MisVordMessaging.initMessageForm();
            window.MisVordMessaging.setChatContext(chatId, chatType);
            console.log("✅ Messaging context updated for:", chatType, chatId);
          } else {
            console.warn(
              "⚠️ MisVordMessaging not available after chat UI update"
            );
          }

          const existingScript = document.querySelector(
            'script[src*="chat-section.js"]'
          );
          if (!existingScript) {
            const script = document.createElement("script");
            script.src = `/public/js/components/messaging/chat-section.js?v=${Date.now()}`;
            script.onload = function () {
              console.log("Chat section script loaded");
              if (window.MisVordMessaging) {
                window.MisVordMessaging.setChatContext(chatId, chatType);
              }
            };
            document.head.appendChild(script);
          } else if (window.MisVordMessaging) {
            window.MisVordMessaging.setChatContext(chatId, chatType);
          }
        }, 100);

        if (this.messaging && this.messaging.switchToChat) {
          this.messaging.switchToChat(chatId, chatType);
        }

        if (this.socketAPI && this.socketReady) {
          if (chatType === "channel") {
            this.socketAPI.joinChannel(chatId);
          } else if (chatType === "direct" || chatType === "dm") {
            this.socketAPI.joinDMRoom(chatId);
          }
        }
      })
      .catch((error) => {
        console.error("Error loading chat section:", error);
        this.chatContainer.innerHTML =
          '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Error loading chat</div>';
      });
  }

  async createDirectMessage(friendId) {
    if (!friendId) return false;

    try {
      console.log("Creating direct message with friend ID:", friendId);

      const response = await fetch("/api/chat/dm/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ friend_id: friendId }),
        credentials: "same-origin",
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an HTML error page instead of JSON");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create direct message");
      }

      console.log("Full response data:", data);
      console.log("data.data:", data.data);
      console.log("data.data.data:", data.data?.data);
      console.log("data.data.data.chat_room:", data.data?.data?.chat_room);

      let chatRoom = null;
      if (data.data && data.data.chat_room) {
        chatRoom = data.data.chat_room;
        console.log("Found chat room in data.data.chat_room:", chatRoom);
      } else if (data.data && data.data.id) {
        chatRoom = data.data;
        console.log("Found chat room in data.data:", chatRoom);
      } else if (data.chat_room) {
        chatRoom = data.chat_room;
        console.log("Found chat room in data.chat_room:", chatRoom);
      }

      console.log("Final chatRoom object:", chatRoom);
      console.log("chatRoom.id:", chatRoom?.id);

      if (!chatRoom || !chatRoom.id) {
        console.error("Invalid response structure:", data);
        console.error("chatRoom is:", chatRoom);
        throw new Error("Invalid chat room data received from server");
      }

      return await this.switchToChat(chatRoom.id, "direct");
    } catch (error) {
      console.error("Error creating direct message:", error);
      if (window.showToast) {
        window.showToast(
          "Failed to create direct message: " + error.message,
          "error"
        );
      }
      return false;
    }
  }

  async openDirectMessage(friendId) {
    try {
      console.log("Opening direct message with friend ID:", friendId);

      const response = await fetch(`/api/chat/dm/room?friend_id=${friendId}`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an HTML error page instead of JSON");
      }

      const data = await response.json();

      if (data.success && data.data && data.data.chat_room) {
        return await this.switchToChat(data.data.chat_room.id, "direct");
      } else {
        return await this.createDirectMessage(friendId);
      }
    } catch (error) {
      console.error("Error opening direct message:", error);
      return await this.createDirectMessage(friendId);
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  new UnifiedChatManager();
});
