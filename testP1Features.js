#!/usr/bin/env node
/**
 * P1功能测试脚本
 * 测试数据脱敏和审计日志
 */

import 'dotenv/config';
import { maskItem, detectSensitiveInfo } from './dataMasking.js';
import { logPush, logAiDecision, getAnalytics, initDatabase } from './database.js';

console.log('🧪 Testing P1 Features...\n');

// 等待数据库初始化
await initDatabase();

// 测试1: 数据脱敏
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Data Masking');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testItem = {
  id: 'test-123',
  brand: 'TestBrand',
  category: 'AI / Platform',
  score: 85,
  title: 'Contact us at support@example.com or call +1-555-1234',
  summary: 'Send payment to wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0 or email admin@test.com',
  sourceType: 'telegram'
};

console.log('Original item:');
console.log('  Title:', testItem.title);
console.log('  Summary:', testItem.summary);
console.log('');

// 检测敏感信息
const detected = detectSensitiveInfo(testItem.title + ' ' + testItem.summary);
console.log('Detected sensitive info:');
detected.forEach(d => {
  console.log(`  - ${d.description}: ${d.count} match(es)`);
  console.log(`    Samples:`, d.samples.join(', '));
});
console.log('');

// 脱敏处理
const maskedItem = maskItem(testItem, {
  fields: ['title', 'summary'],
  logToDb: true
});

console.log('Masked item:');
console.log('  Title:', maskedItem.title);
console.log('  Summary:', maskedItem.summary);
console.log('');

if (maskedItem.title.includes('[EMAIL_REDACTED]')) {
  console.log('✅ Email masking works!');
} else {
  console.log('❌ Email masking failed');
}

if (maskedItem.title.includes('[PHONE_REDACTED]')) {
  console.log('✅ Phone masking works!');
} else {
  console.log('❌ Phone masking failed');
}

if (maskedItem.summary.includes('[WALLET_REDACTED]')) {
  console.log('✅ Crypto wallet masking works!');
} else {
  console.log('❌ Crypto wallet masking failed');
}

console.log('');

// 测试2: 审计日志
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: Audit Logging');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 记录AI决策
logAiDecision(testItem.id, testItem.score, 'pushed', {
  brand: testItem.brand,
  category: testItem.category,
  reason: 'Score 85 >= threshold 70'
});
console.log('✅ Logged AI decision');

// 记录推送
logPush(maskedItem, { statusCode: 200, message: 'Success' }, true, null);
console.log('✅ Logged push event');

console.log('');

// 测试3: 数据分析
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 3: Analytics');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const analytics = getAnalytics();

if (analytics) {
  console.log('Summary:');
  console.log('  Total pushes:', analytics.summary.total_pushes);
  console.log('  Successful:', analytics.summary.successful_pushes);
  console.log('  Avg score:', analytics.summary.avg_score?.toFixed(1) || 'N/A');
  console.log('  Unique brands:', analytics.summary.unique_brands);
  console.log('');

  console.log('By Brand:');
  analytics.byBrand.slice(0, 3).forEach(b => {
    console.log(`  - ${b.brand}: ${b.count} pushes (avg: ${b.avg_score?.toFixed(1)})`);
  });
  console.log('');

  console.log('AI Decisions:');
  analytics.aiDecisions.forEach(d => {
    console.log(`  - ${d.decision}: ${d.count} times`);
  });
  console.log('');

  console.log('Masking Stats:');
  console.log('  Items masked:', analytics.masking.total_masked);
  console.log('');

  console.log('✅ Analytics working!');
} else {
  console.log('❌ Analytics not available (audit log may be disabled)');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 P1 Features Test Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Next steps:');
console.log('1. Start the server: npm run dev:all');
console.log('2. Test push API: POST http://localhost:8787/api/lark/push');
console.log('3. View analytics: GET http://localhost:8787/api/analytics/daily');
console.log('4. Export CSV: GET http://localhost:8787/api/analytics/export/csv');
