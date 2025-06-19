const connectedUsers = new Map();
const userStatus = new Map();
const userPresence = new Map();
const activityDetails = new Map();

function addConnectedUser(socketId, userData) {
  const userId = userData.userId.toString();
  const user = {
    userId,
    username: userData.username,
    socketId,
    joinTime: Date.now(),
    lastActivity: Date.now()
  };
  
  connectedUsers.set(socketId, user);
  updateUserPresence(userId, 'online', userData.username);
  
  return user;
}

function removeConnectedUser(socketId) {
  const user = connectedUsers.get(socketId);
  if (user) {
    connectedUsers.delete(socketId);
    
    const userStillConnected = Array.from(connectedUsers.values())
      .some(u => u.userId === user.userId);
    
    if (!userStillConnected) {
      updateUserPresence(user.userId, 'offline', user.username);
      userPresence.delete(user.userId);
      activityDetails.delete(user.userId);
    }
    
    return user;
  }
  return null;
}

function getConnectedUser(socketId) {
  return connectedUsers.get(socketId);
}

function getUserSockets(userId) {
  return Array.from(connectedUsers.entries())
    .filter(([socketId, user]) => user.userId === userId.toString())
    .map(([socketId]) => socketId);
}

function updateUserStatus(userId, status) {
  userStatus.set(userId.toString(), {
    status,
    lastUpdated: Date.now()
  });
}

function updateUserPresence(userId, status, username = null, activity = null) {
  const userIdStr = userId.toString();
  const currentTime = Date.now();
  
  userPresence.set(userIdStr, {
    userId: userIdStr,
    username,
    status,
    lastSeen: currentTime,
    lastActivity: currentTime
  });
  
  if (activity !== null) {
    activityDetails.set(userIdStr, activity);
  }
  
  updateUserStatus(userId, status);
}

function getUserPresence(userId) {
  const presence = userPresence.get(userId.toString());
  const activity = activityDetails.get(userId.toString());
  
  if (!presence) {
    return { status: 'offline', lastSeen: null, activity: null };
  }
  
  return {
    ...presence,
    activity
  };
}

function getAllOnlineUsers() {
  const online = [];
  for (const [userId, presence] of userPresence.entries()) {
    if (presence.status !== 'offline') {
      online.push({
        ...presence,
        activity: activityDetails.get(userId) || null
      });
    }
  }
  return online;
}

function updateUserActivity(userId, activity) {
  const userIdStr = userId.toString();
  if (activity === null) {
    activityDetails.delete(userIdStr);
  } else {
    activityDetails.set(userIdStr, activity);
  }
  
  const presence = userPresence.get(userIdStr);
  if (presence) {
    presence.lastActivity = Date.now();
  }
}

function getUserStatus(userId) {
  return userStatus.get(userId.toString()) || { status: 'offline', lastUpdated: null };
}

function getUserById(userId) {
  return new Promise((resolve) => {
    resolve(null);
  });
}

module.exports = {
  connectedUsers,
  userStatus,
  userPresence,
  activityDetails,
  addConnectedUser,
  removeConnectedUser,
  getConnectedUser,
  getUserSockets,
  updateUserStatus,
  updateUserPresence,
  getUserPresence,
  getAllOnlineUsers,
  updateUserActivity,
  getUserStatus,
  getUserById
};