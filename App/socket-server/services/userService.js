const db = require('../config/database');

const connectedUsers = new Map();
const userStatus = new Map();

function addConnectedUser(socketId, userData) {
  connectedUsers.set(socketId, {
    userId: userData.userId.toString(),
    username: userData.username,
    joinTime: Date.now()
  });
  
  updateUserStatus(userData.userId, 'online');
  
  return connectedUsers.get(socketId);
}

function removeConnectedUser(socketId) {
  const user = connectedUsers.get(socketId);
  if (user) {
    connectedUsers.delete(socketId);
    
    const userStillConnected = Array.from(connectedUsers.values())
      .some(u => u.userId === user.userId);
    
    if (!userStillConnected) {
      updateUserStatus(user.userId, 'offline');
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

function getUserStatus(userId) {
  return userStatus.get(userId.toString()) || { status: 'offline', lastUpdated: null };
}

async function saveUserStatus(userId, status) {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const sql = `
      INSERT INTO user_presence (user_id, status, last_seen) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      status = VALUES(status), 
      last_seen = VALUES(last_seen)
    `;
    
    await db.query(sql, [userId, status, timestamp]);
    return true;
  } catch (error) {
    console.error('❌ Error saving user status:', error);
    return false;
  }
}

async function getUserById(userId) {
  try {
    const sql = 'SELECT id, username, discriminator, avatar_url FROM users WHERE id = ?';
    const users = await db.query(sql, [userId]);
    return users[0] || null;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return null;
  }
}

module.exports = {
  connectedUsers,
  userStatus,
  addConnectedUser,
  removeConnectedUser,
  getConnectedUser,
  getUserSockets,
  updateUserStatus,
  getUserStatus,
  saveUserStatus,
  getUserById
}; 