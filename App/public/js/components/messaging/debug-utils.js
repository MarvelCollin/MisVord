class DebugUtils {
  constructor(messaging) {
    this.messaging = messaging;
    this.errors = [];
    this.connectionHistory = [];
    this.debug = true;
  }

  log(...args) {
    if (window.logger) {
      window.logger.debug("messaging", ...args);
    } else {
      console.log("[MESSAGING]", ...args);
    }
  }

  error(...args) {
    if (window.logger) {
      window.logger.error("messaging", ...args);
    } else {
      console.error("[MESSAGING ERROR]", ...args);
    }
  }

  trackError(type, error) {
    const errorInfo = {
      type: type,
      message: error.message || error,
      stack: error.stack || "No stack trace",
      timestamp: new Date().toISOString(),
      connected: this.messaging.socketManager.connected,
      authenticated: this.messaging.socketManager.authenticated,
      activeChannel: this.messaging.activeChannel,
      userId: this.messaging.userId,
    };

    this.errors.push(errorInfo);
    this.error("🔴 Error tracked:", errorInfo);

    if (this.errors.length > 20) {
      this.errors.shift();
    }
  }

  trackConnection(event, data = {}) {
    const connectionInfo = {
      event: event,
      timestamp: new Date().toISOString(),
      socketId: this.messaging.socketManager.socket?.id || "none",
      connected: this.messaging.socketManager.connected,
      authenticated: this.messaging.socketManager.authenticated,
      data: data,
    };

    this.connectionHistory.push(connectionInfo);
    this.log("🔗 Connection tracked:", connectionInfo);

    if (this.connectionHistory.length > 50) {
      this.connectionHistory.shift();
    }
  }

  logSystemInfo() {
    this.log("📊 System Information:", {
      userAgent: navigator.userAgent,
      location: window.location.href,
      socketIOAvailable: typeof io !== "undefined",
      userId: this.messaging.getUserId(),
      username: this.messaging.getUsername(),
      activeChannel: this.messaging.getActiveChannelId(),
      timestamp: new Date().toISOString(),
    });
  }

  getDebugInfo() {
    return {
      initialized: this.messaging.initialized,
      connected: this.messaging.socketManager.connected,
      authenticated: this.messaging.socketManager.authenticated,
      userId: this.messaging.userId,
      username: this.messaging.username,
      activeChannel: this.messaging.activeChannel,
      activeChatRoom: this.messaging.activeChatRoom,
      chatType: this.messaging.chatType,
      socketExists: !!this.messaging.socketManager.socket,
      socketId: this.messaging.socketManager.socket
        ? this.messaging.socketManager.socket.id
        : "none",
      errors: this.errors.slice(-5),
      connectionHistory: this.connectionHistory.slice(-10),
      typingUsers: Array.from(
        this.messaging.typingManager.typingUsers.entries()
      ),
      hasMoreMessages: this.messaging.messageHandler.hasMoreMessages,
      loadingMessages: this.messaging.messageHandler.loadingMessages,
    };
  }

  exportDebugLog() {
    const debugData = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        userAgent: navigator.userAgent,
        location: window.location.href,
        socketIOAvailable: typeof io !== "undefined",
      },
      messagingState: this.getDebugInfo(),
      errors: this.errors,
      connectionHistory: this.connectionHistory,
      messageHistory: this.messaging.messageHandler.messageHistory,
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `misvord-messaging-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearDebugData() {
    this.errors = [];
    this.connectionHistory = [];
    this.messaging.messageHandler.messageHistory = [];
    this.log("🧹 Debug data cleared");
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

  setupDebugCommands() {
    if (typeof window !== "undefined") {
      window.debugMessaging = {
        getInfo: () => this.getDebugInfo(),
        exportLog: () => this.exportDebugLog(),
        clearData: () => this.clearDebugData(),
        reconnect: () => {
          if (this.messaging.socketManager.globalSocketManager) {
            this.messaging.socketManager.globalSocketManager.reconnect();
          }
        },
        sendTestMessage: (content = "Debug test message") => {
          const chatId =
            this.messaging.activeChannel || this.messaging.activeChatRoom;
          const chatType = this.messaging.chatType;
          if (chatId && chatType) {
            return this.messaging.messageHandler.sendMessage(
              chatType,
              chatId,
              content
            );
          } else {
            this.error("No active chat to send test message to");
          }
        },
      };

      this.log("🔧 Debug commands available via window.debugMessaging");
    }
  }
}

export default DebugUtils;
