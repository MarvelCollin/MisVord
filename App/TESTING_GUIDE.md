# 🎯 Voice Presence Testing Guide

## ✅ Pre-Test Verification

**Servers Status:**
- ✅ PHP Server: Running on `localhost:1001`
- ✅ Socket Server: Running on `localhost:1002`
- ✅ Application: Ready at `http://localhost:1001`

## 🚀 Quick Test Instructions

### Step 1: Open Application
1. Navigate to `http://localhost:1001` in your browser
2. Login to your account
3. Join a server that has voice channels

### Step 2: Open Developer Tools
1. Press `F12` to open developer console
2. Go to the **Console** tab
3. Verify no major errors are present

### Step 3: Run Automated Test
```javascript
// Copy and paste this into the console:
window.testVoicePresenceFlow()
```

**Expected Output:**
- ✅ Initial state checking
- ✅ Voice join simulation
- ✅ Voice leave simulation
- ✅ All UI sections verified
- ✅ Test completed successfully

### Step 4: Manual Voice Test
1. **Join a voice channel** by clicking on a voice channel in the sidebar
2. **Observe your presence status** in the participant section (should show "In Voice")
3. **Check the active now section** (if visible, should show "In Voice Call")
4. **Leave the voice channel** by clicking the disconnect button
5. **Verify status resets** to previous state

## 🔍 Detailed Testing

### Debug Functions Available

#### `window.testVoicePresenceFlow()`
**Purpose:** Comprehensive end-to-end test
**What it does:**
- Checks initial presence state
- Simulates joining voice call
- Verifies UI updates in all components
- Simulates leaving voice call
- Confirms status reset

#### `window.debugVoicePresenceFlow()`
**Purpose:** Detailed presence flow debugging
**What it does:**
- Shows presence update pipeline
- Traces event flow through components
- Provides technical debugging info

#### `GlobalPresenceManager.enableDebugMode()`
**Purpose:** Enable detailed logging
**Usage:**
```javascript
GlobalPresenceManager.enableDebugMode()
```

### Manual Testing Checklist

#### ✅ Initial State
- [ ] User is logged in
- [ ] Participant section is visible
- [ ] Current user appears in participant list
- [ ] Status shows "Online" or current activity

#### ✅ Voice Join Test
- [ ] Click on a voice channel to join
- [ ] Status changes to "In Voice" in participant section
- [ ] Active now section shows "In Voice Call" (if present)
- [ ] No errors in console
- [ ] Change happens immediately or within 1-2 seconds

#### ✅ Voice Leave Test
- [ ] Click disconnect button to leave voice
- [ ] Status reverts to previous state ("Online")
- [ ] Active now section updates accordingly
- [ ] No errors in console
- [ ] Change happens immediately

#### ✅ UI Consistency
- [ ] Participant section shows correct status
- [ ] Active now section shows correct activity
- [ ] Status is consistent across all UI components
- [ ] No duplicate or conflicting information

## 🐛 Troubleshooting

### Common Issues

#### Test Function Not Found
```javascript
// If window.testVoicePresenceFlow is undefined, try:
setTimeout(() => window.testVoicePresenceFlow(), 2000)
```

#### No Voice Channels Available
1. Create a voice channel: Server Settings → Channels → Create Channel → Voice
2. Or use an existing server with voice channels

#### Status Not Updating
1. Check console for errors
2. Verify socket connection: Look for "Socket connected" messages
3. Try refreshing the page
4. Re-run the test function

#### Socket Connection Issues
1. Verify socket server is running: `http://localhost:1002/health`
2. Check browser console for WebSocket errors
3. Restart socket server if needed

### Debug Commands

```javascript
// Check socket connection
window.GlobalSocketManager?.isConnected()

// Check current presence
window.GlobalSocketManager?.getCurrentUserPresence()

// Check user ID
window.GlobalSocketManager?.getCurrentUserId()

// Manual presence update
window.GlobalSocketManager?.updatePresence({ type: 'In Voice Call' })
```

## 📊 Expected Results

### ✅ Successful Test
- Automated test passes all steps
- Manual voice join/leave works correctly
- Status updates immediately in all UI components
- No console errors
- Consistent behavior across page refreshes

### ❌ Failed Test Indicators
- Test function reports failures
- Status doesn't update when joining/leaving voice
- Console shows errors related to presence or sockets
- UI components show different statuses for the same user
- Long delays (>3 seconds) in status updates

## 🎉 Success Criteria

The fix is successful when:
1. ✅ Automated test passes completely
2. ✅ Manual voice join shows "In Voice" status immediately
3. ✅ Manual voice leave resets status correctly
4. ✅ All UI components show consistent information
5. ✅ No errors in browser console
6. ✅ Behavior is reliable across multiple tests

---

**Status:** 🟢 READY FOR TESTING
**Servers:** 🟢 RUNNING
**Implementation:** ✅ COMPLETE

**Next:** Run the tests above and verify all success criteria are met!
