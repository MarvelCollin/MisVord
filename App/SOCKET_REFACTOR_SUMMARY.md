# Socket System Refactor - Collision Fixes

## Overview
Fixed collision issues in the Discord-like application's socket system by properly separating responsibilities between the PHP backend and Node.js socket server for user presence management.

## Key Changes Made

### 1. Socket Server (Node.js) - Enhanced User Presence Management

**File: `socket-server/services/userService.js`**
- Added in-memory presence tracking with `userPresence` Map
- Added activity details tracking with `activityDetails` Map
- Implemented real-time presence updates without constant database writes
- Added periodic database persistence (every 30 seconds)
- New methods:
  - `updateUserPresence()` - Updates presence in memory
  - `getUserPresence()` - Gets user presence data
  - `getAllOnlineUsers()` - Gets all online users
  - `updateUserActivity()` - Updates user activity
  - `persistAllPresenceData()` - Saves data to database

**File: `socket-server/controllers/socketController.js`**
- Added new socket event handlers:
  - `update-presence` - Real-time presence updates
  - `update-activity` - Activity updates
  - `get-online-users` - Request online users list
  - `get-user-presence` - Request specific user presence
- Changed event name from `user-status-changed` to `user-presence-changed`
- Added automatic presence persistence every 30 seconds
- Enhanced error handling with proper responses

**File: `socket-server/routes/api.js`**
- Added REST API endpoints for PHP backend integration:
  - `GET /api/online-users` - Get online users
  - `GET /api/user-presence/:userId` - Get user presence
  - `POST /api/update-presence` - Update user presence

### 2. PHP Backend - Delegated Real-time to Socket Server

**File: `controllers/UserPresenceController.php`**
- Modified to prioritize socket server for real-time updates
- Falls back to database operations if socket server unavailable
- Uses `emitCustomEvent()` to communicate with socket server
- Reduced database writes for real-time presence

**File: `controllers/SocketController.php`**
- Added new methods:
  - `updateUserStatus()` - Updated to use new socket API
  - `getOnlineUsers()` - Get online users from socket server
  - `getUserPresence()` - Get user presence from socket server
- Improved error handling and logging

**File: `utils/WebSocketClient.php`**
- Added new methods for presence management:
  - `updateUserPresence()` - Send presence updates
  - `getOnlineUsers()` - Request online users
  - `getUserPresence()` - Request user presence
- Updated request handling to support different endpoints
- Added GET request support

### 3. Client-side (JavaScript) - Unified Socket Communication

**File: `public/js/core/socket/socket-client.js`**
- Added presence event handlers:
  - `presence-changed` - When any user's presence changes
  - `presence-updated` - When own presence is updated
  - `activity-updated` - When activity is updated
  - `online-users` - Receive online users list
  - `user-presence` - Receive specific user presence
- New methods:
  - `updatePresence()` - Update user presence
  - `updateActivity()` - Update user activity
  - `getOnlineUsers()` - Request online users
  - `getUserPresence()` - Request user presence

**File: `public/js/core/socket/global-socket-manager.js`**
- Updated to use new socket client methods
- Enhanced presence tracking with socket integration
- Updated event names to match new system
- Added real-time presence update handlers

**File: `public/js/utils/socket-api.js`**
- Updated event name from `user-status-changed` to `user-presence-changed`

## Benefits of the Changes

### 1. **Eliminated Collisions**
- Clear separation: Socket server handles real-time presence, PHP handles business logic
- No more duplicate presence management systems
- Unified event naming convention

### 2. **Improved Performance**
- Real-time presence updates without database writes
- In-memory presence tracking for instant responses
- Periodic persistence reduces database load

### 3. **Better Scalability**
- Socket server can handle many concurrent presence updates
- Database only updated when necessary
- Fallback mechanism ensures reliability

### 4. **Enhanced User Experience**
- Instant presence updates across all connected clients
- Real-time activity tracking
- Reliable online/offline status

## Migration Notes

### Event Name Changes
- `user-status-changed` → `user-presence-changed`
- Added new events: `presence-updated`, `activity-updated`, `online-users`, `user-presence`

### API Changes
- PHP UserPresenceController now uses socket server for real-time updates
- New REST endpoints on socket server for PHP integration
- Enhanced WebSocketClient with presence-specific methods

### Database Changes
- Presence data is now primarily managed in-memory
- Database is updated periodically for persistence
- Real-time updates no longer require database writes

## Testing Recommendations

1. **Test presence updates** - Verify real-time status changes
2. **Test fallback behavior** - Ensure system works when socket server is down
3. **Test persistence** - Verify data is saved to database periodically
4. **Test multiple clients** - Ensure presence updates propagate correctly
5. **Test activity tracking** - Verify activity details are updated in real-time

## Future Improvements

1. **Redis Integration** - Consider Redis for distributed presence management
2. **Presence Expiry** - Implement automatic offline detection for stale connections
3. **Activity Types** - Expand activity tracking with predefined types
4. **Presence History** - Track presence changes over time for analytics
