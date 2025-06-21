import socketClient from "./socket-client.js";
import socketApi from "../../utils/socket-api.js";
import { showToast } from "../ui/toast.js";

// Ensure logger is available
if (typeof window !== "undefined" && !window.logger) {
  window.logger = {
    info: (module, ...args) =>
      console.log(`[${module.toUpperCase()}]`, ...args),
    debug: (module, ...args) =>
      console.log(`[${module.toUpperCase()}]`, ...args),
    warn: (module, ...args) =>
      console.warn(`[${module.toUpperCase()}]`, ...args),
    error: (module, ...args) =>
      console.error(`[${module.toUpperCase()}]`, ...args),
  };
}

/**
 * GlobalSocketManager
 * Manages WebSocket connections and events for the MisVord application
 */
class GlobalSocketManager {
  constructor() {
    this.config = {
      socketPort: 1002,
      socketPath: "/socket.io",
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 20000,
      debug: true,
    };

    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.initialized = false;

    this.userId = null;
    this.username = null;
    this.currentPage = window.location.pathname;
    this.sessionStartTime = Date.now();

    this.activityLog = [];
    this.connectionHistory = [];
    this.presenceData = {
      status: "online",
      activity: null,
      lastSeen: Date.now(),
    };
    this.debug = this.config.debug;
    this.isGuest = false;

    this.eventHandlers = {};

    this.currentUser = null;
    this.activeChannels = new Set();

    if (!window.GlobalSocketManager) {
      try {
        window.GlobalSocketManager = this;
      } catch (error) {
        this.error("Could not assign to window.GlobalSocketManager:", error);
      }
    }
  }

  log(message, ...args) {
    if (this.debug && typeof window !== "undefined" && window.logger) {
      window.logger.info("socket", message, ...args);
    } else if (this.debug) {
      console.log(`[SOCKET] ${message}`, ...args);
    }
  }

  error(message, ...args) {
    if (typeof window !== "undefined" && window.logger) {
      window.logger.error("socket", message, ...args);
    } else {
      console.error(`[SOCKET ERROR] ${message}`, ...args);
    }
  }

  /**
   * Initialize the socket manager
   * @param {Object} userData - User data for authentication
   * @returns {Promise} - Resolves when initialization is complete
   */
  init(userData = null) {
    if (this.initialized) {
      this.log("Already initialized, skipping duplicate initialization");
      return Promise.resolve();
    }
    if (!userData || !userData.user_id) {
      this.log("Guest user detected, socket connection disabled");
      this.isGuest = true;
      return Promise.resolve();
    }

    this.userId = userData.user_id;
    this.username = userData.username;

    this.log(
      "Initializing global WebSocket connection for user:",
      this.username
    );
    this.logSystemInfo();
    return this.initSocket()
      .then(() => {
        this.initPresenceTracking();
        this.initActivityTracking();

        this.log("✅ Global socket manager initialized successfully");
        this.initialized = true;

        // Start periodic check for messaging system connection
        this.startMessagingSystemMonitor();

        return this.initialized;
      })
      .catch((error) => {
        this.error("❌ Failed to initialize global socket manager:", error);
        this.trackError("GLOBAL_INIT_FAILED", error);
        throw error;
      });
  }
  initSocket() {
    if (typeof io === "undefined") {
      throw new Error("Socket.IO not available");
    }

    this.log("🔌 Connecting to WebSocket server...");

    // Get socket configuration from meta tags or use defaults
    const socketHost =
      document
        .querySelector('meta[name="socket-host"]')
        ?.getAttribute("content") || window.location.hostname;
    const socketPort =
      document
        .querySelector('meta[name="socket-port"]')
        ?.getAttribute("content") || this.config.socketPort;
    const socketUrl = `http://${socketHost}:${socketPort}`;

    this.log("🔗 Socket URL:", socketUrl);
    this.log("🔧 Socket Host:", socketHost);
    this.log("🔧 Socket Port:", socketPort);
    this.socket = io(socketUrl, {
      path: this.config.socketPath,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: this.config.reconnectAttempts,
      reconnectionDelay: this.config.reconnectDelay,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      closeOnBeforeunload: false,
    });

    this.setupSocketEventHandlers();

    return Promise.resolve();
  }
  setupSocketEventHandlers() {
    this.socket.on("connect", () => {
      this.log("🟢 Connected to WebSocket server");
      this.connected = true;
      this.reconnectAttempts = 0;
      this.trackConnection("CONNECTED");

      // Authenticate and handle the promise
      this.authenticate()
        .then((authData) => {
          this.log("✅ Authentication successful:", authData);
        })
        .catch((error) => {
          this.error("❌ Authentication failed:", error);
        });
    });
    this.socket.on("disconnect", (reason) => {
      this.log("🔴 Disconnected from WebSocket server:", reason);
      this.connected = false;
      this.authenticated = false;
      this.trackConnection("DISCONNECTED", { reason });

      // Dispatch disconnection event
      window.dispatchEvent(
        new CustomEvent("globalSocketDisconnected", {
          detail: { manager: this, reason: reason },
        })
      );
    });
    this.socket.on("connect_error", (error) => {
      this.error("🔴 Connection error:", error);
      this.error("🔧 Error details:", {
        type: error.type,
        message: error.message,
        description: error.description,
        context: error.context,
        socketUrl: socketUrl,
        socketPath: this.config.socketPath,
      });
      this.trackConnection("CONNECTION_ERROR", {
        error: error.message,
        type: error.type,
      });
    });

    this.socket.on("reconnect_error", (error) => {
      this.error("🔄 Reconnection error:", error);
      this.trackConnection("RECONNECT_ERROR", { error: error.message });
    });

    this.socket.on("reconnect_failed", () => {
      this.error("❌ Reconnection failed completely");
      this.trackConnection("RECONNECT_FAILED");
    });
    this.socket.on("authenticated", (data) => {
      this.log("✅ User authenticated:", data);
      this.authenticated = true;
      this.trackConnection("AUTHENTICATED", data);
      this.updatePresence("online");
      this.getOnlineUsers();

      setInterval(() => this.sendHeartbeat(), this.config.heartbeatInterval);

      // Dispatch event that socket manager is ready
      this.dispatchEvent("globalSocketReady", { manager: this });

      // Also dispatch to window for messaging system
      window.dispatchEvent(
        new CustomEvent("globalSocketConnected", {
          detail: { manager: this, connected: true, authenticated: true },
        })
      );

      // Force messaging system connection if it exists
      this.connectMessagingSystem();
    });

    // Force messaging system connection
    this.connectMessagingSystem = () => {
      setTimeout(() => {
        if (window.MisVordMessaging) {
          this.log("🔧 Forcing messaging system connection...");
          if (window.MisVordMessaging.waitingForGlobalSocket) {
            this.log("📨 Messaging system is waiting - connecting now");
            if (window.MisVordMessaging.setupGlobalSocketManager) {
              window.MisVordMessaging.setupGlobalSocketManager(this);
              window.MisVordMessaging.waitingForGlobalSocket = false;
            } else if (window.MisVordMessaging.connectToGlobalSocketManager) {
              window.MisVordMessaging.connectToGlobalSocketManager();
            }
          } else if (!window.MisVordMessaging.connected) {
            this.log(
              "📨 Messaging system not connected - attempting connection"
            );
            if (window.MisVordMessaging.connectToGlobalSocketManager) {
              window.MisVordMessaging.connectToGlobalSocketManager();
            }
          } else {
            this.log("📨 Messaging system already connected");
          }
        } else {
          this.log(
            "📨 Messaging system not found - will connect when available"
          );
        }
      }, 500);
    };

    this.socket.on("authentication-failed", (data) => {
      this.error("❌ Authentication failed:", data);
      this.authenticated = false;
      this.trackConnection("AUTH_FAILED", data);
    });
    this.socket.on("user-presence-changed", (data) => {
      this.log("👤 User presence changed:", data);
      this.dispatchEvent("userPresenceChanged", data);
    });

    this.socket.on("user-activity-changed", (data) => {
      this.log("🏃 User activity changed:", data);
      this.dispatchEvent("userActivityChanged", data);

      if (data.user_id !== this.userId) {
        const activityText = data.activity_details
          ? `is ${data.activity_details}`
          : "changed activity";
        showToast(`${data.username} ${activityText}`);
      }
    });

    this.socket.on("user-activity", (data) => {
      this.log("🏃 User activity:", data);
      this.dispatchEvent("userActivity", data);
    });

    this.socket.on("message-received", (data) => {
      this.log("💬 Message received:", data);
      this.dispatchEvent("messageReceived", data);
    });

    this.socket.on("typing-start", (data) => {
      this.dispatchEvent("typingStart", data);
    });

    this.socket.on("typing-stop", (data) => {
      this.dispatchEvent("typingStop", data);
    });

    this.socket.on("group-server-created", (data) => {
      this.log("📁 Group server created:", data);
      this.dispatchEvent("groupServerCreated", data);
      showToast(`New server created: ${data.server_name}`);
    });

    this.socket.on("group-server-updated", (data) => {
      this.log("📝 Group server updated:", data);
      this.dispatchEvent("groupServerUpdated", data);
      showToast(`Server updated: ${data.server_name}`);
    });

    this.socket.on("group-server-deleted", (data) => {
      this.log("🗑️ Group server deleted:", data);
      this.dispatchEvent("groupServerDeleted", data);
      showToast(`Server deleted: ${data.server_name}`);
    });

    this.socket.on("role-created", (data) => {
      this.log("👑 Role created:", data);
      this.dispatchEvent("roleCreated", data);
      showToast(`New role created: ${data.role.name}`);
    });

    this.socket.on("role-updated", (data) => {
      this.log("👑 Role updated:", data);
      this.dispatchEvent("roleUpdated", data);
      showToast(`Role updated: ${data.role.name}`);
    });

    this.socket.on("role-deleted", (data) => {
      this.log("👑 Role deleted:", data);
      this.dispatchEvent("roleDeleted", data);
      showToast(`Role deleted: ${data.role_name}`);
    });

    this.socket.on("user-role-assigned", (data) => {
      this.log("👤 User role assigned:", data);
      this.dispatchEvent("userRoleAssigned", data);

      if (data.user_id === this.userId) {
        showToast(`You received the ${data.role_name} role`);
      }
    });

    this.socket.on("user-role-removed", (data) => {
      this.log("👤 User role removed:", data);
      this.dispatchEvent("userRoleRemoved", data);

      if (data.user_id === this.userId) {
        showToast(`Your ${data.role_name} role was removed`);
      }
    });

    this.socket.on("emoji-created", (data) => {
      this.log("😀 Emoji created:", data);
      this.dispatchEvent("emojiCreated", data);
      showToast(`New emoji added: ${data.emoji.name}`);
    });

    this.socket.on("emoji-updated", (data) => {
      this.log("😀 Emoji updated:", data);
      this.dispatchEvent("emojiUpdated", data);
    });

    this.socket.on("emoji-deleted", (data) => {
      this.log("😀 Emoji deleted:", data);
      this.dispatchEvent("emojiDeleted", data);
    });

    this.socket.on("reaction-added", (data) => {
      this.log("👍 Reaction added:", data);
      this.dispatchEvent("reactionAdded", data);
    });

    this.socket.on("reaction-removed", (data) => {
      this.log("👎 Reaction removed:", data);
      this.dispatchEvent("reactionRemoved", data);
    });

    // Friend events
    this.socket.on("friend-request-received", (data) => {
      this.log("👋 Friend request received:", data);
      this.dispatchEvent("friendRequestReceived", data);
      showToast(`${data.sender_username} sent you a friend request!`);
    });

    this.socket.on("friend-request-accepted", (data) => {
      this.log("✅ Friend request accepted:", data);
      this.dispatchEvent("friendRequestAccepted", data);
      showToast(`${data.recipient_username} accepted your friend request!`);
    });

    this.socket.on("friend-request-declined", (data) => {
      this.log("❌ Friend request declined:", data);
      this.dispatchEvent("friendRequestDeclined", data);
    });

    this.socket.on("friend-removed", (data) => {
      this.log("💔 Friend removed:", data);
      this.dispatchEvent("friendRemoved", data);
    });

    // User presence events
    this.socket.on("user-status-changed", (data) => {
      this.log("👤 User status changed:", data);
      this.dispatchEvent("userStatusChanged", data);

      if (data.user_id !== this.userId && data.status === "online") {
        showToast(`${data.username} is now online`);
      }
    });
  }
  authenticate() {
    if (!this.socket || !this.connected) {
      this.error("❌ Cannot authenticate: not connected");
      return Promise.reject(new Error("Socket not connected"));
    }

    this.log("🔐 Authenticating user...");

    const authData = {
      userId: this.userId,
      username: this.username,
      sessionStartTime: this.sessionStartTime,
      currentPage: this.currentPage,
    };

    this.log("📤 Sending authentication data:", authData);

    return new Promise((resolve, reject) => {
      // Set up one-time listeners for authentication response
      const authTimeout = setTimeout(() => {
        this.error("❌ Authentication timeout");
        reject(new Error("Authentication timeout"));
      }, 10000);

      const handleAuthSuccess = (data) => {
        clearTimeout(authTimeout);
        this.socket.off("authentication-failed", handleAuthFailed);
        resolve(data);
      };

      const handleAuthFailed = (error) => {
        clearTimeout(authTimeout);
        this.socket.off("authenticated", handleAuthSuccess);
        reject(new Error(error.error || "Authentication failed"));
      };

      this.socket.once("authenticated", handleAuthSuccess);
      this.socket.once("authentication-failed", handleAuthFailed);

      // Send authentication request
      this.socket.emit("authenticate", authData);
    });
  }
  initPresenceTracking() {
    socketClient.on("presence-changed", (data) => {
      this.handlePresenceUpdate(data);
    });

    socketClient.on("presence-update-success", (data) => {
      this.presenceData.status = data.status;
      if (data.activityDetails !== undefined) {
        this.presenceData.activity = data.activityDetails;
      }
      this.log("✅ Presence updated successfully:", data);
    });

    socketClient.on("activity-update-success", (data) => {
      this.presenceData.activity = data.activityDetails;
      this.log("✅ Activity updated successfully:", data);
    });

    socketClient.on("online-users-received", (data) => {
      this.handleOnlineUsersUpdate(data.users);
    });
    document.addEventListener("visibilitychange", () => {
      if (this.isReady() && document.visibilityState === "visible") {
        this.updatePresence("online");
        this.trackActivity("PAGE_VISIBLE");
      } else if (this.isReady()) {
        this.updatePresence("away");
        this.trackActivity("PAGE_HIDDEN");
      }
    });

    let activityTimeout;
    const resetActivityTimer = () => {
      if (!this.isReady()) return;

      clearTimeout(activityTimeout);
      this.updatePresence("online");

      activityTimeout = setTimeout(() => {
        if (this.isReady()) {
          this.updatePresence("idle");
        }
      }, 300000);
    };

    document.addEventListener("mousemove", resetActivityTimer);
    document.addEventListener("keypress", resetActivityTimer);
    document.addEventListener("click", resetActivityTimer);
  }

  initActivityTracking() {
    this.trackActivity("PAGE_LOAD", { page: this.currentPage });

    window.addEventListener("beforeunload", () => {
      this.trackActivity("PAGE_UNLOAD", { page: this.currentPage });
      this.updatePresence("offline");
    });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.onRouteChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.onRouteChange();
    };

    window.addEventListener("popstate", () => {
      this.onRouteChange();
    });
  }

  onRouteChange() {
    const newPage = window.location.pathname;
    if (newPage !== this.currentPage) {
      this.trackActivity("ROUTE_CHANGE", {
        from: this.currentPage,
        to: newPage,
      });
      this.currentPage = newPage;
    }
  }
  updatePresence(status, activity = null) {
    if (
      !socketClient ||
      !socketClient.connected ||
      !socketClient.authenticated
    ) {
      this.log("⚠️ Cannot update presence: socket not ready");
      return Promise.resolve();
    }

    const result = socketClient.updatePresence(status, activity);
    if (result) {
      this.presenceData.status = status;
      this.presenceData.activity = activity;
      this.presenceData.lastSeen = Date.now();
      this.log("👤 Presence update sent:", { status, activity });
    }

    return Promise.resolve();
  }

  setActivity(activityDetails) {
    if (
      !socketClient ||
      !socketClient.connected ||
      !socketClient.authenticated
    ) {
      this.log("⚠️ Cannot set activity: socket not ready");
      return Promise.resolve(false);
    }

    const result = socketClient.updateActivity(activityDetails);
    if (result) {
      this.presenceData.activity = activityDetails;
      this.log("🎮 Activity update sent:", activityDetails);
    }

    return Promise.resolve(result);
  }

  clearActivity() {
    return this.setActivity(null);
  }

  getOnlineUsers() {
    if (
      !socketClient ||
      !socketClient.connected ||
      !socketClient.authenticated
    ) {
      this.log("⚠️ Cannot get online users: socket not ready");
      return Promise.resolve([]);
    }

    const result = socketClient.getOnlineUsers();
    if (result) {
      this.log("👥 Requested online users list");
    }

    return Promise.resolve(result);
  }

  getUserPresence(userId) {
    if (
      !socketClient ||
      !socketClient.connected ||
      !socketClient.authenticated
    ) {
      this.log("⚠️ Cannot get user presence: socket not ready");
      return Promise.resolve(null);
    }

    const result = socketClient.getUserPresence(userId);
    if (result) {
      this.log("👤 Requested presence for user:", userId);
    }

    return Promise.resolve(result);
  }

  handlePresenceUpdate(data) {
    this.log("👤 Received presence update:", data);
    this.dispatchEvent("presenceChanged", data);
  }
  handleOnlineUsersUpdate(users) {
    this.log("👥 Received online users update:", users);
    this.dispatchEvent("onlineUsersChanged", { users });
  }

  trackActivity(action, data = {}) {
    const activityData = {
      action,
      data,
      timestamp: Date.now(),
      page: this.currentPage,
      userId: this.userId,
    };

    this.activityLog.push(activityData);
    this.log("🏃 Activity tracked:", activityData);

    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }

    if (this.socket && this.connected && this.authenticated) {
      this.socket.emit("user-activity", activityData);
    }
  }

  sendHeartbeat() {
    if (this.socket && this.connected && this.authenticated) {
      this.socket.emit("heartbeat", {
        userId: this.userId,
        timestamp: Date.now(),
        page: this.currentPage,
      });
    }
  }

  joinChannel(channelId) {
    if (!this.socket || !this.connected || !this.authenticated) {
      this.error("❌ Cannot join channel: not connected or authenticated");
      return Promise.resolve(false);
    }

    this.socket.emit("join-channel", channelId);
    this.trackActivity("CHANNEL_JOIN", { channelId });
    this.log("🏠 Joined channel:", channelId);
    this.activeChannels.add(channelId);
    return Promise.resolve(true);
  }

  leaveChannel(channelId) {
    if (!this.socket || !this.connected || !this.authenticated) {
      return Promise.resolve(false);
    }

    this.socket.emit("leave-channel", channelId);
    this.trackActivity("CHANNEL_LEAVE", { channelId });
    this.log("🚪 Left channel:", channelId);
    this.activeChannels.delete(channelId);
    return Promise.resolve(true);
  }
  sendMessage(chatId, content, chatType = "channel") {
    if (!this.socket || !this.connected || !this.authenticated) {
      this.error("❌ Cannot send message: not connected or authenticated");
      return Promise.resolve(false);
    }

    const tempId = "temp_" + Date.now();
    const timestamp = new Date().toISOString();

    if (chatType === "direct") {
      // Send direct message
      const messageData = {
        roomId: chatId,
        content,
        messageType: "text",
        timestamp,
        tempId,
      };

      this.socket.emit("direct-message", messageData);
      this.trackActivity("DIRECT_MESSAGE_SENT", { roomId: chatId });
      this.log("📤 Direct message sent:", messageData);
    } else {
      // Send channel message
      const messageData = {
        channelId: chatId,
        content,
        messageType: "text",
        timestamp,
        tempId,
      };

      this.socket.emit("channel-message", messageData);
      this.trackActivity("MESSAGE_SENT", { channelId: chatId });
      this.log("📤 Channel message sent:", messageData);
    }

    return Promise.resolve(tempId);
  }

  dispatchEvent(eventName, detail = {}) {
    try {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
      this.log(`📡 Dispatched event: ${eventName}`, detail);
    } catch (error) {
      this.error("Failed to dispatch event:", error);
    }
  }

  trackConnection(event, data = {}) {
    const connectionInfo = {
      event: event,
      timestamp: new Date().toISOString(),
      socketId: this.socket?.id || "none",
      connected: this.connected,
      authenticated: this.authenticated,
      data: data,
    };

    this.connectionHistory.push(connectionInfo);
    this.log("🔗 Connection event:", connectionInfo);

    if (this.connectionHistory.length > 50) {
      this.connectionHistory.shift();
    }
  }

  trackError(type, error) {
    const errorInfo = {
      type: type,
      message: error.message || error,
      stack: error.stack || "No stack trace",
      timestamp: new Date().toISOString(),
      connected: this.connected,
      authenticated: this.authenticated,
      userId: this.userId,
    };

    this.error("🔴 Error tracked:", errorInfo);
  }

  logSystemInfo() {
    this.log("📊 System Information:", {
      userAgent: navigator.userAgent,
      location: window.location.href,
      socketIOAvailable: typeof io !== "undefined",
      userId: this.userId,
      username: this.username,
      timestamp: new Date().toISOString(),
    });
  }

  getStatus() {
    return {
      initialized: this.initialized,
      connected: this.connected,
      authenticated: this.authenticated,
      isGuest: this.isGuest,
      userId: this.userId,
      username: this.username,
      currentPage: this.currentPage,
      presenceData: this.presenceData,
      recentActivity: this.activityLog.slice(-10),
      connectionHistory: this.connectionHistory.slice(-10),
    };
  }

  /**
   * Get the socket instance if connected and authenticated
   * @returns {Object|null} Socket instance or null if not ready
   */
  getSocket() {
    if (this.socket && this.connected && this.authenticated) {
      return this.socket;
    }
    return null;
  }

  /**
   * Check if the global socket is ready for use
   * @returns {boolean} True if connected and authenticated
   */
  isReady() {
    return this.connected && this.authenticated;
  }

  /**
   * Wait for the socket to be ready (connected and authenticated)
   * @param {number} timeout - Timeout in milliseconds (default: 10000)
   * @returns {Promise} Resolves when ready, rejects on timeout
   */
  waitForReady(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (this.isReady()) {
        resolve(this);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error("Socket ready timeout"));
      }, timeout);

      const checkReady = () => {
        if (this.isReady()) {
          clearTimeout(timeoutId);
          resolve(this);
        }
      };

      // Listen for authenticated event
      this.socket?.on("authenticated", checkReady);

      // Also check on connect in case already authenticated
      this.socket?.on("connect", () => {
        setTimeout(checkReady, 100); // Small delay for authentication
      });
    });
  }

  /**
   * Monitor and auto-connect messaging system
   */
  startMessagingSystemMonitor() {
    let checkCount = 0;
    const maxChecks = 10; // Check for 10 seconds

    const checkMessaging = () => {
      checkCount++;

      if (window.MisVordMessaging) {
        if (window.MisVordMessaging.waitingForGlobalSocket && this.isReady()) {
          this.log("🔧 Found waiting messaging system, connecting...");

          return; // Stop checking
        } else if (window.MisVordMessaging.connected) {
          this.log("✅ Messaging system already connected");
          return; // Stop checking
        }
      }

      if (checkCount < maxChecks) {
        setTimeout(checkMessaging, 1000);
      } else {
        this.log(
          "⏰ Stopped messaging system monitoring after " +
            maxChecks +
            " checks"
        );
      }
    };

    // Start checking after a short delay
    setTimeout(checkMessaging, 1000);
  }
}

// Create and export a singleton instance
const globalSocketManager = new GlobalSocketManager();

// Export both named and default exports for compatibility
export { GlobalSocketManager };
export default globalSocketManager;
