import { showToast } from "../../core/ui/toast.js";
import socketApi from "../../utils/socket-api.js";
import SocketManager from "./socket-manager.js";
import MessageHandler from "./message-handler.js";
import TypingManager from "./typing-manager.js";
import DebugUtils from "./debug-utils.js";
import FormHandler from "./form-handler.js";

class MisVordMessaging {
  constructor() {
    this.config = {
      socketPort: 1002,
      socketPath: "/socket.io",
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 20000,
      debug: true,
    };

    this.initialized = false;
    this.activeChannel = null;
    this.activeChatRoom = null;
    this.chatType = null;
    this.userId = null;
    this.username = null;

    this.hasMoreMessages = true;
    this.loadingMessages = false;
    this.currentOffset = 0;

    this.debugUtils = new DebugUtils(this);
    this.socketManager = new SocketManager(this);
    this.messageHandler = new MessageHandler(this);
    this.typingManager = new TypingManager(this);
    this.formHandler = new FormHandler(this);

    window.MisVordMessaging = this;
    this.debugUtils.log(
      "MisVordMessaging instance created and registered globally (using global socket manager)"
    );

    this.debugUtils.setupDebugCommands();
  }

  log(...args) {
    this.debugUtils.log(...args);
  }

  error(...args) {
    this.debugUtils.error(...args);
  }

  trackError(type, error) {
    this.debugUtils.trackError(type, error);
  }

  trackConnection(event, data = {}) {
    this.debugUtils.trackConnection(event, data);
  }

  trackMessage(event, data = {}) {
    this.messageHandler.trackMessage(event, data);
  }

  isVoiceChannel() {
    const url = window.location.pathname;
    return url.includes("/voice/") || url.includes("voice-channel");
  }
  init() {
    if (this.initialized) {
      this.log("Already initialized, skipping duplicate initialization");
      return;
    }

    if (this.isVoiceChannel()) {
      this.log("Voice channel detected, skipping messaging initialization");
      return;
    }

    // Check for messaging elements, but be more lenient for app pages with dynamic content
    const messageContainer = document.getElementById("chat-messages");
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const isAppPage = window.location.pathname.includes("/app");

    if (!messageContainer && !messageForm && !messageInput && !isAppPage) {
      this.log(
        "No messaging elements found and not on app page, skipping messaging initialization"
      );
      return;
    }

    this.log("Initializing messaging system with global socket manager...");
    this.debugUtils.logSystemInfo();

    try {
      // Always try to connect to global socket manager
      this.socketManager.connectToGlobalSocketManager();

      // Initialize form handler and typing manager if elements exist
      if (messageForm || messageInput) {
        this.formHandler.initMessageForm();
        this.typingManager.setupTypingEvents();
      }

      // Initialize message container if it exists
      if (messageContainer) {
        this.initMessageContainer();
      }

      this.log("✅ Messaging system initialized successfully");
      this.initialized = true;

      this.debugUtils.dispatchEvent("misVordReady", { messaging: this });
    } catch (error) {
      this.error("❌ Failed to initialize messaging system:", error);
      this.trackError("INIT_FAILED", error);
    }
  }

  initMessageContainer() {
    const messageContainer = document.getElementById("chat-messages");
    if (!messageContainer) {
      this.log("⚠️ Message container not found");
      return;
    }

    this.log("📦 Setting up message container...");

    messageContainer.addEventListener("scroll", () => {
      if (
        messageContainer.scrollTop === 0 &&
        this.messageHandler.hasMoreMessages &&
        !this.messageHandler.loadingMessages
      ) {
        this.loadMoreMessages();
      }
    });

    this.log("✅ Message container initialized");
  }

  async loadMoreMessages() {
    const chatId = this.getCurrentChatId();
    const chatType = this.chatType;

    if (!chatId || !chatType) {
      return;
    }

    await this.messageHandler.loadMessages(
      chatType,
      chatId,
      this.messageHandler.currentOffset
    );
  }

  getCurrentChatId() {
    return this.chatType === "channel"
      ? this.activeChannel
      : this.activeChatRoom;
  }

  authenticate() {
    this.socketManager.authenticate();
  }

  joinChannel(channelId) {
    this.socketManager.joinChannel(channelId);
  }
  joinDMRoom(chatRoomId) {
    console.log(
      "🏠 MisVordMessaging.joinDMRoom called with chatRoomId:",
      chatRoomId
    );
    console.log("🔍 ROOM JOIN DEBUG - Current state:", {
      userId: this.userId,
      username: this.username,
      activeChatRoom: this.activeChatRoom,
      chatType: this.chatType,
      socketConnected: this.socketManager?.connected,
      hasSocket: !!this.socketManager?.socket,
    });

    // Set the active chat room immediately
    this.activeChatRoom = chatRoomId;
    this.chatType = "direct";

    console.log(
      "🔍 ROOM JOIN - Updated active chat room to:",
      this.activeChatRoom
    );

    this.socketManager.joinDMRoom(chatRoomId);

    // Add a verification step after attempting to join
    setTimeout(() => {
      console.log("🔍 ROOM JOIN VERIFICATION - After 2 seconds:", {
        activeChatRoom: this.activeChatRoom,
        chatType: this.chatType,
        expectedRoom: `dm-room-${chatRoomId}`,
      });
    }, 2000);
  }
  leaveDMRoom(chatRoomId) {
    this.socketManager.leaveDMRoom(chatRoomId);
  }

  initMessageForm() {
    this.formHandler.initMessageForm();
  }

  async sendMessage(
    chatType,
    chatId,
    content,
    messageType = "text",
    attachments = [],
    mentions = []
  ) {
    return await this.messageHandler.sendMessage(
      chatType,
      chatId,
      content,
      messageType,
      attachments,
      mentions
    );
  }

  async sendRichMessage(chatType, chatId, messageData) {
    return await this.messageHandler.sendRichMessage(
      chatType,
      chatId,
      messageData
    );
  }

  onNewMessage(data) {
    this.messageHandler.onNewMessage(data);
  }

  onUserTyping(data) {
    this.typingManager.onUserTyping(data);
  }

  onUserStopTyping(data) {
    this.typingManager.onUserStopTyping(data);
  }

  startTyping(chatType, chatId) {
    this.typingManager.startTyping(chatType, chatId);
  }

  stopTyping(chatType, chatId) {
    this.typingManager.stopTyping(chatType, chatId);
  }
  onUserStatusChange(data) {
    this.log("👤 User status changed:", data);
  }

  onChannelJoined(data) {
    this.log("🏠 Joined channel:", data.channelId);
    this.activeChannel = data.channelId;
    this.chatType = "channel";
    this.trackConnection("CHANNEL_JOINED", data);
    this.updateStatus("joined");
  }

  onChannelLeft(data) {
    this.log("👋 Left channel:", data.channelId);
    this.activeChannel = null;
    this.trackConnection("CHANNEL_LEFT", data);
  }

  onDMRoomJoined(data) {
    this.log("💬 Joined DM room:", data.chatRoomId || data.roomId);
    this.activeChatRoom = data.chatRoomId || data.roomId;
    this.chatType = "direct";
    this.trackConnection("DM_ROOM_JOINED", data);
    this.updateStatus("joined");
  }

  onDMRoomLeft(data) {
    this.log("👋 Left DM room:", data.chatRoomId || data.roomId);
    this.activeChatRoom = null;
    this.trackConnection("DM_ROOM_LEFT", data);
  }

  updateStatus(status) {
    const statusElement = document.getElementById("connection-status");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `connection-status ${status}`;
    }
  }

  getUserId() {
    if (this.userId) return this.userId;

    const userIdElement = document.querySelector("[data-user-id]");
    if (userIdElement) {
      return userIdElement.dataset.userId;
    }

    if (window.globalUser && window.globalUser.id) {
      return window.globalUser.id;
    }

    return null;
  }

  getUsername() {
    if (this.username) return this.username;

    const usernameElement = document.querySelector("[data-username]");
    if (usernameElement) {
      return usernameElement.dataset.username;
    }

    if (window.globalUser && window.globalUser.username) {
      return window.globalUser.username;
    }

    return null;
  }

  getActiveChannelId() {
    if (this.activeChannel) return this.activeChannel;

    const channelElement = document.querySelector("[data-channel-id]");
    if (channelElement) {
      return channelElement.dataset.channelId;
    }

    const urlMatch = window.location.pathname.match(/\/channels\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    return null;
  }

  getActiveChatRoomId() {
    if (this.activeChatRoom) return this.activeChatRoom;

    const chatRoomElement = document.querySelector("[data-chat-room-id]");
    if (chatRoomElement) {
      return chatRoomElement.dataset.chatRoomId;
    }

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("dm");
  }

  cleanup() {
    this.log("🧹 Cleaning up messaging system...");

    if (this.socketManager.syncInterval) {
      clearInterval(this.socketManager.syncInterval);
    }

    this.typingManager.clearTypingUsers();
    this.socketManager.waitingForGlobalSocket = false;

    this.log("✅ Messaging system cleaned up");
  }

  reconnect() {
    this.log("🔄 Attempting to reconnect...");
    if (this.socketManager.globalSocketManager) {
      this.socketManager.globalSocketManager.reconnect();
    }
  }

  getDebugInfo() {
    return this.debugUtils.getDebugInfo();
  }
  async switchToChat(chatId, chatType = "channel") {
    this.log("🔄 Switching to chat:", chatId, "Type:", chatType);

    this.setChatContext(chatId, chatType);

    this.hasMoreMessages = true;
    this.loadingMessages = false;
    this.currentOffset = 0;

    // Join the appropriate socket room
    await this.joinSocketRoom(chatId, chatType);

    await this.loadMessages(chatId, chatType);

    this.updateChatUI(chatId, chatType);
  }

  async joinSocketRoom(chatId, chatType) {
    if (!this.socket || !this.connected) {
      this.log("⚠️ Cannot join room: socket not connected");
      return;
    }

    try {
      if (chatType === "channel") {
        this.log("🔌 Joining channel room:", chatId);
        this.socket.emit("join-channel", { channelId: chatId });
      } else if (chatType === "direct" || chatType === "dm") {
        this.log("🔌 Joining DM room:", chatId);
        this.socket.emit("join-dm-room", { roomId: chatId });
      }
    } catch (error) {
      this.log("❌ Failed to join socket room:", error);
    }
  }

  setChatContext(chatId, chatType) {
    this.activeChannel = chatType === "channel" ? chatId : null;
    this.activeChatRoom =
      chatType === "direct" || chatType === "dm" ? chatId : null;
    this.chatType = chatType;

    this.log("📍 Chat context set:", {
      activeChannel: this.activeChannel,
      activeChatRoom: this.activeChatRoom,
      chatType: this.chatType,
    });
  }
  async loadMessages(chatId, chatType) {
    if (this.loadingMessages) {
      this.log("Already loading messages, skipping...");
      return;
    }

    this.loadingMessages = true;
    this.messageHandler.showSkeletonLoader();

    try {
      const routeChatType = chatType === "direct" ? "dm" : chatType;
      const endpoint = `/api/chat/${routeChatType}/${chatId}/messages`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.messages) {
        this.messageHandler.displayMessages(data.data.messages, true);
        this.log(
          `📥 Loaded ${data.data.messages.length} messages for ${chatType} ${chatId}`
        );
      } else {
        this.messageHandler.hideSkeletonLoader();
      }
    } catch (error) {
      this.error("Failed to load messages:", error);
      this.trackError("load_messages", error);
      this.messageHandler.hideSkeletonLoader();
    } finally {
      this.loadingMessages = false;
    }
  }

  updateChatUI(chatId, chatType) {
    const messageInput = document.getElementById("message-input");
    if (messageInput) {
      messageInput.setAttribute("data-chat-id", chatId);
      messageInput.setAttribute("data-chat-type", chatType);
    }

    const chatContainer = document.getElementById("chat-messages");
    if (chatContainer) {
      chatContainer.setAttribute("data-chat-id", chatId);
      chatContainer.setAttribute("data-chat-type", chatType);
    }
    this.log("🎨 Chat UI updated for:", chatType, chatId);
  }

  // Debug method to test message sending
  testMessageSending(content = "Test message from debug") {
    if (!this.activeChannel && !this.activeChatRoom) {
      this.error("❌ No active chat to send test message to");
      return;
    }

    const chatId = this.activeChannel || this.activeChatRoom;
    const chatType = this.activeChannel ? "channel" : "direct";

    this.log("🧪 Testing message sending:", { chatId, chatType, content });

    return this.messageHandler
      .sendMessage(chatType, chatId, content)
      .then(() => {
        this.log("✅ Test message sent successfully");
      })
      .catch((error) => {
        this.error("❌ Test message failed:", error);
      });
  }

  // Debug method to simulate receiving a message
  simulateIncomingMessage(content = "Simulated incoming message") {
    const simulatedMessage = {
      id: "sim-" + Date.now(),
      content: content,
      user_id: "other-user",
      username: "Test User",
      avatar_url:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIwIiBmaWxsPSIjNTg2NUYyIi8+CiAgICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjE1IiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgogICAgPHBhdGggZD0iTTggMzJDOCAyNi41IDEyLjUgMjIgMTggMjJIMjJDMjcuNSAyMiAzMiAyNi41IDMyIDMyVjM1QzMyIDM2LjEgMzEuMSAzNyAzMCAzN0gxMEM4LjkgMzcgOCAzNi4xIDggMzVWMzJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
      created_at: new Date().toISOString(),
      channelId: this.activeChannel,
      chatRoomId: this.activeChatRoom,
    };

    this.log("🎭 Simulating incoming message:", simulatedMessage);
    this.onNewMessage(simulatedMessage);
  }

  get socket() {
    return this.socketManager.socket;
  }

  get connected() {
    return this.socketManager.connected;
  }

  get authenticated() {
    return this.socketManager.authenticated;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "🔄 MisVordMessaging DOMContentLoaded - checking initialization..."
  );

  // Only initialize if we're not already initialized and we have the necessary elements
  if (!window.MisVordMessaging) {
    console.log("📝 Creating new MisVordMessaging instance...");
    const messaging = new MisVordMessaging();
    messaging.init();
  } else if (!window.MisVordMessaging.initialized) {
    console.log(
      "📝 MisVordMessaging exists but not initialized, initializing..."
    );
    window.MisVordMessaging.init();
  } else {
    console.log("✅ MisVordMessaging already initialized");
  }
});

// Also initialize when MainModulesReady event is fired (for compatibility)
window.addEventListener("MainModulesReady", () => {
  console.log(
    "🔄 MisVordMessaging MainModulesReady - checking initialization..."
  );

  if (!window.MisVordMessaging || !window.MisVordMessaging.initialized) {
    const messaging = window.MisVordMessaging || new MisVordMessaging();
    console.log("📝 Initializing MisVordMessaging via MainModulesReady...");
    messaging.init();
  }
});

// Add a fallback timer-based initialization for edge cases
setTimeout(() => {
  if (window.MisVordMessaging && !window.MisVordMessaging.initialized) {
    console.log("⏰ Timer-based MisVordMessaging initialization fallback...");
    window.MisVordMessaging.init();
  }
}, 2000);

export default MisVordMessaging;
