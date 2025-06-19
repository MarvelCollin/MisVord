class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.config = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false,
      path: '/socket.io'
    };
    
    this.eventHandlers = new Map();
    this.connectionPromise = null;
    this.authenticationPromise = null;
    
    this.userId = null;
    this.username = null;
    
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    
    this.debug = window.DEBUG_MODE || false;
  }

  init() {
    if (this.socket) {
      this.log('Socket already initialized');
      return Promise.resolve(this.socket);
    }
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.log('Initializing socket connection');
        
        if (!window.io) {
          return reject(new Error('Socket.io not loaded'));
        }        // Get socket configuration from meta tags or fallback to window/default values
        const socketHostMeta = document.querySelector('meta[name="socket-host"]');
        const socketPortMeta = document.querySelector('meta[name="socket-port"]');
        
        const host = socketHostMeta?.content || window.SOCKET_HOST || window.location.hostname;
        const port = socketPortMeta?.content || window.SOCKET_PORT || 1002;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${host}:${port}`;
        
        this.log(`Connecting to socket server at ${url}`);
        
        this.socket = window.io(url, this.config);
        
        this.setupEventListeners();
        this.socket.connect();
        
        resolve(this.socket);
      } catch (error) {
        this.error('Socket initialization error:', error);
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }
  setupEventListeners() {
    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', (reason) => this.handleDisconnect(reason));
    this.socket.on('connect_error', (error) => this.handleConnectError(error));
    this.socket.on('error', (error) => this.handleError(error));
    
    this.socket.on('authenticated', (data) => this.handleAuthenticated(data));
    this.socket.on('authentication-failed', (data) => this.handleAuthenticationFailed(data));
    
    this.socket.on('heartbeat-response', () => this.handleHeartbeatResponse());
    
    this.socket.on('user-presence-changed', (data) => this.handlePresenceChanged(data));
    this.socket.on('presence-updated', (data) => this.handlePresenceUpdated(data));
    this.socket.on('activity-updated', (data) => this.handleActivityUpdated(data));
    this.socket.on('online-users', (data) => this.handleOnlineUsers(data));
    this.socket.on('user-presence', (data) => this.handleUserPresence(data));
  }

  handleConnect() {
    this.connected = true;
    this.log('Socket connected:', this.socket.id);
    
    this.startHeartbeat();
    
    if (this.userId && this.username) {
      this.authenticate(this.userId, this.username);
    }
    
    this.emit('connection-event', { 
      status: 'connected', 
      socketId: this.socket.id 
    });
  }

  handleDisconnect(reason) {
    this.connected = false;
    this.authenticated = false;
    this.log('Socket disconnected:', reason);
    
    this.stopHeartbeat();
    
    this.emit('connection-event', { 
      status: 'disconnected', 
      reason 
    });
    
    if (reason === 'io server disconnect') {
      this.reconnect();
    }
  }

  handleConnectError(error) {
    this.error('Socket connection error:', error);
    
    this.emit('connection-event', { 
      status: 'error', 
      error: error.message 
    });
    
    this.reconnect();
  }

  handleError(error) {
    this.error('Socket error:', error);
    
    this.emit('connection-event', { 
      status: 'error', 
      error: error.message 
    });
  }

  handleAuthenticated(data) {
    this.authenticated = true;
    this.log('Socket authenticated:', data);
    
    if (this.authenticationPromise) {
      const { resolve } = this.authenticationPromise;
      resolve(data);
      this.authenticationPromise = null;
    }
    
    this.emit('auth-event', { 
      status: 'authenticated', 
      ...data 
    });
  }

  handleAuthenticationFailed(data) {
    this.authenticated = false;
    this.error('Socket authentication failed:', data);
    
    if (this.authenticationPromise) {
      const { reject } = this.authenticationPromise;
      reject(new Error(data.error || 'Authentication failed'));
      this.authenticationPromise = null;
    }
    
    this.emit('auth-event', { 
      status: 'failed', 
      ...data 
    });
  }

  handleHeartbeatResponse() {
    this.log('Heartbeat response received');
  }

  handlePresenceChanged(data) {
    this.log('User presence changed:', data);
    this.emit('presence-changed', data);
  }

  handlePresenceUpdated(data) {
    this.log('Presence updated:', data);
    this.emit('presence-update-success', data);
  }

  handleActivityUpdated(data) {
    this.log('Activity updated:', data);
    this.emit('activity-update-success', data);
  }

  handleOnlineUsers(data) {
    this.log('Online users received:', data);
    this.emit('online-users-received', data);
  }

  handleUserPresence(data) {
    this.log('User presence received:', data);
    this.emit('user-presence-received', data);
  }

  /**s
   * Start sending heartbeat messages
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.socket.emit('heartbeat');
      }
    }, 30000);
  }

  /**
   * Stop sending heartbeat messages
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect to the socket server
   */
  reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.log('Attempting to reconnect...');
      
      if (this.socket) {
        this.socket.connect();
      } else {
        this.init();
      }
    }, 2000);
  }

  /**
   * Authenticate the socket connection
   */
  authenticate(userId, username, token = null) {
    if (!this.connected) {
      this.userId = userId;
      this.username = username;
      return Promise.reject(new Error('Socket not connected'));
    }
    
    this.log(`Authenticating user: ${username} (${userId})`);
    
    this.authenticationPromise = {};
    const promise = new Promise((resolve, reject) => {
      this.authenticationPromise.resolve = resolve;
      this.authenticationPromise.reject = reject;
      
      this.socket.emit('authenticate', { userId, username, token });
      
      // Set a timeout for authentication
      setTimeout(() => {
        if (this.authenticationPromise) {
          reject(new Error('Authentication timed out'));
          this.authenticationPromise = null;
        }
      }, 10000);
    });
    
    return promise;
  }

  /**
   * Join a channel
   */
  joinChannel(channelId) {
    if (!this.connected || !this.authenticated) {
      return Promise.reject(new Error('Socket not connected or authenticated'));
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('channel-joined');
        this.off('channel-join-failed');
        reject(new Error('Join channel timed out'));
      }, 5000);
      
      const onJoined = (data) => {
        if (data.channelId === channelId) {
          clearTimeout(timeout);
          this.off('channel-joined', onJoined);
          this.off('channel-join-failed', onFailed);
          resolve(data);
        }
      };
      
      const onFailed = (data) => {
        clearTimeout(timeout);
        this.off('channel-joined', onJoined);
        this.off('channel-join-failed', onFailed);
        reject(new Error(data.error || 'Failed to join channel'));
      };
      
      this.on('channel-joined', onJoined);
      this.on('channel-join-failed', onFailed);
      
      this.socket.emit('join-channel', { channelId });
    });
  }

  /**
   * Leave a channel
   */
  leaveChannel(channelId) {
    if (!this.connected) {
      return Promise.reject(new Error('Socket not connected'));
    }
    
    this.socket.emit('leave-channel', { channelId });
    return Promise.resolve();
  }

  /**
   * Send a message to a channel
   */
  sendChannelMessage(channelId, content, messageType = 'text') {
    if (!this.connected || !this.authenticated) {
      return Promise.reject(new Error('Socket not connected or authenticated'));
    }
    
    const timestamp = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('message-sent-confirmation');
        this.off('message_error');
        reject(new Error('Send message timed out'));
      }, 10000);
      
      const onConfirmation = (data) => {
        if (data.tempId === tempId) {
          clearTimeout(timeout);
          this.off('message-sent-confirmation', onConfirmation);
          this.off('message_error', onError);
          resolve(data);
        }
      };
      
      const onError = (data) => {
        if (data.tempId === tempId) {
          clearTimeout(timeout);
          this.off('message-sent-confirmation', onConfirmation);
          this.off('message_error', onError);
          reject(new Error(data.error || 'Failed to send message'));
        }
      };
      
      this.on('message-sent-confirmation', onConfirmation);
      this.on('message_error', onError);
      
      this.socket.emit('channel-message', {
        channelId,
        content,
        messageType,
        timestamp,
        tempId
      });
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(channelId) {
    if (!this.connected || !this.authenticated) {
      return;
    }
    
    this.socket.emit('typing', { channelId });
  }

  /**
   * Send stop typing indicator
   */
  sendStopTyping(channelId) {
    if (!this.connected || !this.authenticated) {
      return;
    }
    
    this.socket.emit('stop-typing', { channelId });
  }

  /**
   * Update user presence status
   */
  updatePresence(status, activityDetails = null) {
    if (!this.connected || !this.authenticated) {
      this.error('Cannot update presence: not connected or authenticated');
      return false;
    }

    this.socket.emit('update-presence', {
      status,
      activityDetails
    });

    return true;
  }

  updateActivity(activityDetails) {
    if (!this.connected || !this.authenticated) {
      this.error('Cannot update activity: not connected or authenticated');
      return false;
    }

    this.socket.emit('update-activity', {
      activityDetails
    });

    return true;
  }

  getOnlineUsers() {
    if (!this.connected || !this.authenticated) {
      this.error('Cannot get online users: not connected or authenticated');
      return false;
    }

    this.socket.emit('get-online-users');
    return true;
  }

  getUserPresence(userId) {
    if (!this.connected || !this.authenticated) {
      this.error('Cannot get user presence: not connected or authenticated');
      return false;
    }

    this.socket.emit('get-user-presence', { userId });
    return true;
  }

  /**
   * Register an event handler
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
      
      if (this.socket) {
        this.socket.on(event, (data) => this.emit(event, data));
      }
    }
    
    this.eventHandlers.get(event).push(callback);
    return this;
  }

  /**
   * Remove an event handler
   */
  off(event, callback) {
    if (!this.eventHandlers.has(event)) {
      return this;
    }
    
    if (!callback) {
      this.eventHandlers.delete(event);
    } else {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      
      if (handlers.length === 0) {
        this.eventHandlers.delete(event);
      }
    }
    
    return this;
  }

  /**
   * Emit an event to all registered handlers
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          this.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
    
    return this;
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.connected = false;
    this.authenticated = false;
  }

  /**
   * Log message if debug is enabled
   */
  log(...args) {
    if (this.debug) {
      console.log('[SocketClient]', ...args);
    }
  }

  /**
   * Error log
   */
  error(...args) {
    console.error('[SocketClient]', ...args);
  }
}

// Create and export a singleton instance
const socketClient = new SocketClient();
export default socketClient;