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

async function saveDirectMessage(roomId, userId, content, messageType = 'text') {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // First, insert into messages table
    const messageSql = `
      INSERT INTO messages 
      (user_id, content, message_type, sent_at, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const messageResult = await db.query(messageSql, [
      userId,
      content,
      messageType,
      timestamp,
      timestamp,
      timestamp
    ]);
    
    const messageId = messageResult.insertId;
    
    // Then, link message to chat room
    const linkSql = `
      INSERT INTO chat_room_messages 
      (room_id, message_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?)
    `;
    
    await db.query(linkSql, [
      roomId,
      messageId,
      timestamp,
      timestamp
    ]);
    
    // Update chat room's updated_at timestamp
    const updateRoomSql = `
      UPDATE chat_rooms 
      SET updated_at = ? 
      WHERE id = ?
    `;
    
    await db.query(updateRoomSql, [timestamp, roomId]);
    
    return {
      id: messageId,
      room_id: roomId,
      user_id: userId,
      content,
      message_type: messageType,
      sent_at: timestamp,
      created_at: timestamp
    };
  } catch (error) {
    console.error('❌ Error saving direct message:', error);
    throw error;
  }
}

async function getDirectMessages(roomId, limit = 50) {
  try {
    const sql = `
      SELECT m.*, u.username, u.avatar_url, u.discriminator 
      FROM messages m
      JOIN chat_room_messages crm ON m.id = crm.message_id
      JOIN users u ON m.user_id = u.id
      WHERE crm.room_id = ?
      ORDER BY m.sent_at DESC
      LIMIT ?
    `;
    
    const messages = await db.query(sql, [roomId, limit]);
    return messages.reverse();
  } catch (error) {
    console.error('❌ Error fetching direct messages:', error);
    throw error;
  }
}

module.exports = {
  trackMessageProcessing,
  checkRecentDuplicate,
  saveMessage,
  getChannelMessages,
  saveDirectMessage,
  getDirectMessages
};