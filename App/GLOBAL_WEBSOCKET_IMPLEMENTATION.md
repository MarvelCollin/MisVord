# MisVord Global WebSocket Implementation

## Overview

The MisVord application has been refactored to implement a **global WebSocket connection** that is always active for authenticated users across all pages. This system tracks all user activity and maintains a persistent connection to the Socket.IO server.

## Key Components

### 1. Global Socket Manager (`public/js/core/global-socket-manager.js`)

The central component that manages the global WebSocket connection:

**Features:**
- **Global Connection**: Establishes a single WebSocket connection that persists across all pages
- **User Activity Tracking**: Monitors page navigation, mouse/keyboard activity, and presence status
- **Automatic Presence Updates**: Updates user status (online/away/idle/offline) based on activity
- **Channel Management**: Provides methods to join/leave channels for messaging
- **Event Broadcasting**: Dispatches custom events for other components to listen to
- **Error Tracking**: Comprehensive error logging and connection history
- **Guest Mode**: Automatically disables for non-authenticated users

**Key Methods:**
- `init(userData)`: Initialize with user authentication data
- `joinChannel(channelId)`: Join a specific channel for messaging
- `sendMessage(channelId, content)`: Send messages through the global connection
- `updatePresence(status)`: Update user presence status
- `trackActivity(action, data)`: Track user activity
- `isReady()`: Check if ready for messaging operations

### 2. Updated Main Application (`public/js/main.js`)

Enhanced to initialize the global socket manager on every page load:

**New Functions:**
- `initGlobalSocketManager()`: Sets up global socket connection
- `getUserDataFromPage()`: Extracts user data from page meta tags/attributes

**User Data Detection Methods:**
1. Meta tags (`<meta name="user-id">`, `<meta name="username">`)
2. Data attributes on body/HTML elements
3. Hidden form inputs
4. Socket data elements

### 3. Refactored Messaging System (`public/js/components/messaging.js`)

Updated to use the global socket manager instead of creating its own connection:

**Changes:**
- Uses `globalSocketManager.socket` instead of creating own socket
- Waits for global socket manager to be ready before initializing
- Maintains backward compatibility with existing messaging functionality
- Falls back to direct socket connection if global manager unavailable

### 4. User Data Integration (`views/layout/head.php`)

Added meta tags to make user data available to JavaScript:

```php
<?php if (isset($_SESSION['user_id'])): ?>
<meta name="user-id" content="<?php echo htmlspecialchars($_SESSION['user_id']); ?>">
<meta name="username" content="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>">
<meta name="user-authenticated" content="true">
<?php else: ?>
<meta name="user-authenticated" content="false">
<?php endif; ?>
```

### 5. Socket Status Monitoring (`public/js/utils/socket-status.js`)

Debugging utility that provides:
- Real-time status monitoring of all socket-related systems
- Console commands for checking status (`window.checkSockets()`)
- Automatic monitoring in development mode
- Comprehensive status reports

### 6. Updated Script Loading (`views/layout/scripts.php`)

Ensures proper loading order:
1. Socket.IO library (non-module)
2. Socket Status Utility (debugging)
3. Main application (module with global socket manager)
4. Page-specific scripts

## How It Works

### For Authenticated Users

1. **Page Load**: On any page load, `main.js` extracts user data from meta tags
2. **Global Socket Init**: Creates `GlobalSocketManager` instance and initializes with user data
3. **Connection**: Establishes WebSocket connection to server with authentication
4. **Activity Tracking**: Begins tracking user activity, presence, and page navigation
5. **Messaging Ready**: Makes messaging capabilities available globally
6. **Event Broadcasting**: Dispatches events for other components to use

### For Guest Users

1. **Page Load**: Detects no user authentication data
2. **Disabled Mode**: Global socket manager goes into guest mode (no connection)
3. **API Compatibility**: Provides stub methods that return false/null for compatibility
4. **Landing Page**: Special handling to completely disable socket functionality

### Activity Tracking

The system automatically tracks:
- **Page Navigation**: Route changes, page loads/unloads
- **User Presence**: Online/away/idle/offline based on activity
- **Channel Activity**: Joining/leaving channels, sending messages
- **System Events**: Connection state changes, errors, authentication

## Benefits

### 1. **Always Connected**
- Users maintain WebSocket connection across all pages
- No need to reconnect when navigating between pages
- Immediate real-time updates regardless of current page

### 2. **Comprehensive Activity Tracking**
- Server can track all user activity across the application
- Better presence management and user status updates
- Enhanced analytics and user behavior insights

### 3. **Improved Performance**
- Single connection instead of multiple per-page connections
- Reduced connection overhead and server resources
- Faster message delivery and real-time features

### 4. **Better User Experience**
- Seamless real-time features across all pages
- Consistent presence status and notifications
- No connection delays when switching to chat features

### 5. **Developer Experience**
- Centralized WebSocket management
- Consistent API across all components
- Comprehensive debugging and monitoring tools
- Backward compatibility with existing code

## Usage Examples

### Check Global Socket Status
```javascript
// In browser console
window.checkSockets(); // Print detailed status

// Get status programmatically
const status = window.SocketStatus.getSimpleStatus();
console.log(status.globalSocketReady); // true/false
```

### Use Global Socket in Components
```javascript
// Check if ready
if (window.globalSocketManager && window.globalSocketManager.isReady()) {
    // Join a channel
    window.globalSocketManager.joinChannel('channel_123');
    
    // Send a message
    window.globalSocketManager.sendMessage('channel_123', 'Hello world!');
    
    // Track custom activity
    window.globalSocketManager.trackActivity('CUSTOM_ACTION', { data: 'value' });
}

// Listen for global events
window.addEventListener('globalSocketReady', (event) => {
    console.log('Global socket is ready:', event.detail);
});

window.addEventListener('messageReceived', (event) => {
    console.log('New message received:', event.detail);
});
```

### Access from Legacy Components
```javascript
// Existing messaging system automatically uses global socket
if (window.MisVordMessaging) {
    window.MisVordMessaging.sendMessage('channel_123', 'Hello!');
}
```

## Debugging

### Development Mode
- Auto-starts socket status monitoring
- Logs connection state changes
- Provides console utilities for debugging

### Production Mode
- Minimal logging
- Error tracking without verbose output
- Performance-optimized monitoring

### Console Commands
```javascript
// Check current status
window.checkSockets();

// Get detailed status object
window.SocketStatus.getFullStatus();

// Start manual monitoring
window.SocketStatus.startMonitoring(5000); // every 5 seconds

// Stop monitoring
window.SocketStatus.stopMonitoring();
```

## File Changes Summary

### New Files
- `public/js/core/global-socket-manager.js` - Main global socket manager
- `public/js/utils/socket-status.js` - Debugging and monitoring utility

### Modified Files
- `public/js/main.js` - Added global socket initialization
- `public/js/components/messaging.js` - Refactored to use global socket
- `views/layout/head.php` - Added user data meta tags
- `views/layout/scripts.php` - Updated script loading order
- `views/components/app-sections/chat-section.php` - Simplified initialization
- `views/pages/landing-page.php` - Added global socket manager disabling

### Unchanged Functionality
- All existing messaging features work as before
- Backward compatibility maintained
- No changes required to existing view templates
- Server-side Socket.IO handling remains the same

This implementation provides a robust, scalable foundation for real-time features while maintaining simplicity and backward compatibility.
