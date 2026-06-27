/**
 * Telegram Message Deduplication Store
 * 使用双层缓存策略：内存Set + SQLite持久化
 */

import { hasSeenMessagePersistent, markMessageSeenPersistent } from './database.js';

// 第一层：内存缓存（快速查询）
const seenMessages = new Set();

/**
 * 检查消息是否已见过
 * @param {string} messageId - Telegram消息ID
 * @returns {boolean}
 */
export function hasSeenMessage(messageId) {
  // 先查内存
  if (seenMessages.has(messageId)) {
    return true;
  }

  // 再查数据库（持久化）
  const inDb = hasSeenMessagePersistent(messageId);

  // 如果数据库中存在，回填到内存缓存
  if (inDb) {
    seenMessages.add(messageId);
  }

  return inDb;
}

/**
 * 标记消息已见过
 * @param {string} messageId - Telegram消息ID
 */
export function markMessageSeen(messageId) {
  // 同时写入内存和数据库
  seenMessages.add(messageId);
  markMessageSeenPersistent(messageId);
}

/**
 * 获取内存中的去重记录数
 * @returns {number}
 */
export function getSeenCount() {
  return seenMessages.size;
}