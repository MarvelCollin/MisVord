const db = require('../config/database');

const recentMessages = new Map();

function trackMessageProcessing(userId, timestamp, messageId, content) {
  const key = `${userId}-${timestamp}`;
  recentMessages.set(key, {
    messageId,
    content,
    timestamp: Date.now()
  });
  
  setTimeout(() => {
    recentMessages.delete(key);
  }, 10000);
}

function checkRecentDuplicate(userId, timestamp, content) {
  const key = `${userId}-${timestamp}`;
  const recent = recentMessages.get(key);
  
  if (recent && recent.content === content) {
    return recent.messageId;
  }
  
  return null;
}

async function saveMessage(channelId, userId, content, messageType = 'text') {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const sql = `
      INSERT INTO channel_messages 
      (channel_id, user_id, content, message_type, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      channelId,
      userId,
      content,
      messageType,
      timestamp
    ]);
    
    return {
      id: result.insertId,
      channel_id: channelId,
      user_id: userId,
      content,
      message_type: messageType,
      created_at: timestamp
    };
  } catch (error) {
    console.error('❌ Error saving message:', error);
    throw error;
  }
}

async function getChannelMessages(channelId, limit = 50) {
  try {
    const sql = `
      SELECT cm.*, u.username, u.avatar_url, u.discriminator 
      FROM channel_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.channel_id = ?
      ORDER BY cm.created_at DESC
      LIMIT ?
    `;
    
    const messages = await db.query(sql, [channelId, limit]);
    return messages.reverse();
  } catch (error) {
    console.error('❌ Error fetching channel messages:', error);
    throw error;
  }
}

module.exports = {
  trackMessageProcessing,
  checkRecentDuplicate,
  saveMessage,
  getChannelMessages
}; 