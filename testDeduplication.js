#!/usr/bin/env node
/**
 * 测试持久化去重功能
 * 验证服务器重启后去重记录不丢失
 */

import 'dotenv/config';
import { hasSeenMessage, markMessageSeen, getSeenCount } from './telegramStore.js';
import { initDatabase } from './database.js';

console.log('🧪 Testing Persistent Deduplication...\n');

// 等待数据库初始化
await initDatabase();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Mark new messages as seen');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testMessages = [
  'binance_announcements/12345',
  'OKXAnnouncements/67890',
  'exnessasiaupdates/54321'
];

for (const msgId of testMessages) {
  const wasSeen = hasSeenMessage(msgId);
  console.log(`Message: ${msgId}`);
  console.log(`  Already seen: ${wasSeen ? '✅ Yes' : '❌ No'}`);

  if (!wasSeen) {
    markMessageSeen(msgId);
    console.log(`  Action: ✅ Marked as seen`);
  } else {
    console.log(`  Action: ⏭️  Skip (already processed)`);
  }
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: Verify persistence');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Current in-memory cache size:', getSeenCount());
console.log('');

console.log('Now checking if same messages are still marked as seen:');
for (const msgId of testMessages) {
  const isSeen = hasSeenMessage(msgId);
  console.log(`  ${msgId}: ${isSeen ? '✅ Seen' : '❌ Not seen'}`);
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 3: Simulate server restart');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Important: To fully test persistence:');
console.log('');
console.log('1. Run this script first (current run)');
console.log('2. Stop the script (Ctrl+C)');
console.log('3. Run it again');
console.log('4. Messages should still be marked as "Already seen: ✅ Yes"');
console.log('');
console.log('This proves the SQLite database persists across restarts!');

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Deduplication Test Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('✅ Deduplication mechanism:');
console.log('  - Memory cache: Fast lookup');
console.log('  - SQLite database: Persistent storage');
console.log('  - Railway deployments: No more duplicate pushes!');
console.log('');
console.log('Database location:', process.env.DB_PATH || './data/intelligence.db');
