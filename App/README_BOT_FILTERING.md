# Bot Filtering Implementation Guide

## Overview
This system stores bots as regular users in the `users` table with `status = 'bot'` to distinguish them from regular users. Comprehensive filtering has been implemented to ensure bots don't appear in normal user social interactions.

## Database Schema
- **Table**: `users`
- **Bot Identifier**: `status = 'bot'`
- **User Statuses**: `'appear', 'invisible', 'do_not_disturb', 'offline'` (for regular users)
- **Bot Creation**: Use `User::createBot($data)` or `UserRepository::createBot($data)`

## Implemented Bot Filtering

### 1. UserRepository.php - Core Query Methods
**All user search and listing operations exclude bots:**

- ✅ `searchByUsername()` - Added `->where('status', '!=', 'bot')`
- ✅ `paginate()` - Added `->where('status', '!=', 'bot')` 
- ✅ `search()` - Added `->where('status', '!=', 'bot')`
- ✅ `countSearch()` - Added `->where('status', '!=', 'bot')`
- ✅ `countRecentUsers()` - Added `->where('status', '!=', 'bot')`
- ✅ `countActiveUsers()` - Added `->where('status', '!=', 'bot')`

**New bot management methods:**
- ✅ `getBots($limit)` - Get all bot users
- ✅ `countBots()` - Count total bots
- ✅ `countRegularUsers()` - Count users excluding bots
- ✅ `createBot($data)` - Create bot users

### 2. User.php Model - Relationship Methods
**Friend relationships exclude bots:**

- ✅ `friends()` - Added `->where('u.status', '!=', 'bot')` to both queries
- ✅ `isBot()` - Helper method to check if user is a bot
- ✅ `createBot($data)` - Static method to create bot users

### 3. UserController.php - Public API Methods
**User profile and interaction protection:**

- ✅ `getUserProfile()` - Prevents viewing bot profiles (returns 404)
- ✅ `getMutualRelations()` - Skips bots in mutual friends calculation
- ✅ `updateStatus()` - Prevents bots from updating status via regular endpoint

### 4. FriendController.php - Friend Management
**Friend operations exclude bots:**

- ✅ `sendFriendRequest()` - Prevents sending friend requests to bots
- ✅ All friend searches use `UserRepository::searchByUsername()` (already filtered)

### 5. FriendList.php Model - Friend Data Methods
**Core friend data methods exclude bots:**

- ✅ `getUserFriends()` - Added `->where('u.status', '!=', 'bot')` to both queries
- ✅ `getPendingRequests()` - Added `->where('u.status', '!=', 'bot')`
- ✅ `getSentRequests()` - Added `->where('u.status', '!=', 'bot')`

### 6. FriendListRepository.php - Repository Methods
**Repository operations exclude bots:**

- ✅ `getBlockedUsers()` - Added `AND u.status != 'bot'` to raw SQL

## Bot Management Usage

### Creating Bots
```php
// Method 1: Using User model
$bot = User::createBot([
    'username' => 'MyBot',
    'email' => 'bot@example.com',
    'display_name' => 'My Bot'
]);

// Method 2: Using UserRepository
$userRepo = new UserRepository();
$bot = $userRepo->createBot([
    'username' => 'MyBot',
    'email' => 'bot@example.com'
]);
```

### Checking if User is Bot
```php
$user = $userRepository->find($userId);
if ($user->isBot()) {
    // Handle bot user
}
```

### Getting Bot Statistics
```php
$userRepo = new UserRepository();
$totalBots = $userRepo->countBots();
$regularUsers = $userRepo->countRegularUsers();
$allBots = $userRepo->getBots(50); // Get up to 50 bots
```

## Areas Where Bots Are Filtered Out

### ❌ Bots will NOT appear in:
- User search results
- Friend lists
- Friend requests (sending/receiving)
- Mutual friends calculations
- User profile views (404 error)
- Admin user listings
- User statistics (registration, activity)
- Blocked users lists
- Pending friend requests

### ✅ Bots CAN still:
- Exist in the database
- Be retrieved by ID (if you know the ID)
- Have their own status managed via admin/bot-specific endpoints
- Be counted separately using bot-specific methods

## Security Considerations

1. **Profile Protection**: Bot profiles return 404 to prevent discovery
2. **Friend Protection**: No friend requests can be sent to/from bots
3. **Search Protection**: Bots don't appear in any user searches
4. **Status Protection**: Bots can't update status via regular user endpoints

## Future Bot Integration

When creating your BotController, you can:

1. Use `UserRepository::getBots()` to list all bots
2. Use `User::createBot()` to create new bots
3. Create bot-specific status update methods
4. Implement bot-specific API endpoints that bypass user filtering

## Admin Panel Integration

The admin panel will automatically exclude bots from:
- User listings
- User searches  
- User statistics
- Ban/unban operations (since bots use different status values)

If you need to manage bots in admin panel, create separate bot management sections using the bot-specific methods. 