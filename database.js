/**
 * SQLite Database Module for Audit Logging
 * P1 Security Feature: 记录所有关键操作用于合规审计
 * 使用 sql.js (纯JavaScript，无需编译)
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'intelligence.db');
const ENABLED = process.env.ENABLE_AUDIT_LOG !== 'false';

let SQL = null;
let db = null;

/**
 * 初始化数据库
 */
export async function initDatabase() {
  if (!ENABLED) {
    console.log('⚠️  Audit log disabled (ENABLE_AUDIT_LOG=false)');
    return null;
  }

  if (db) return db;

  try {
    // 初始化sql.js
    if (!SQL) {
      SQL = await initSqlJs();
    }

    // 确保data目录存在
    const dataDir = dirname(DB_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // 加载或创建数据库
    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('✅ Database loaded:', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('✅ Database created:', DB_PATH);
    }

    // 创建表结构
    db.run(`
      CREATE TABLE IF NOT EXISTS push_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        score INTEGER,
        title TEXT,
        summary TEXT,
        source_type TEXT,
        region TEXT,
        pushed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        lark_response TEXT,
        success INTEGER DEFAULT 1,
        error_message TEXT
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_push_log_item_id ON push_log(item_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_push_log_pushed_at ON push_log(pushed_at);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_push_log_brand ON push_log(brand);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_push_log_region ON push_log(region);`);

    // 迁移：为已存在的数据库添加 region 列
    try {
      db.run(`ALTER TABLE push_log ADD COLUMN region TEXT;`);
      console.log('✅ Migration: Added region column to push_log');
    } catch (e) {
      // 列已存在，忽略错误
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS ai_decision_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        decision TEXT,
        reason TEXT,
        metadata TEXT,
        decided_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_decision_item_id ON ai_decision_log(item_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_decision_decided_at ON ai_decision_log(decided_at);`);

    db.run(`
      CREATE TABLE IF NOT EXISTS error_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_type TEXT,
        error_message TEXT,
        stack_trace TEXT,
        context TEXT,
        occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_error_log_occurred_at ON error_log(occurred_at);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_error_log_type ON error_log(error_type);`);

    db.run(`
      CREATE TABLE IF NOT EXISTS masking_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        masked_fields TEXT,
        patterns_matched TEXT,
        masked_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_masking_log_item_id ON masking_log(item_id);`);

    db.run(`
      CREATE TABLE IF NOT EXISTS seen_messages (
        message_key TEXT PRIMARY KEY,
        first_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_seen_messages_first_seen ON seen_messages(first_seen_at);`);

    // 阶段2：Telegram频道配置表
    db.run(`
      CREATE TABLE IF NOT EXISTS telegram_channels (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        handle TEXT NOT NULL UNIQUE,
        level TEXT DEFAULT 'High',
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_telegram_channels_enabled ON telegram_channels(enabled);`);

    // 阶段2：网站爬虫配置表
    db.run(`
      CREATE TABLE IF NOT EXISTS web_crawlers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        crawler_type TEXT DEFAULT 'tradingview',
        selector TEXT,
        level TEXT DEFAULT 'Medium',
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_web_crawlers_enabled ON web_crawlers(enabled);`);

    // 迁移：为已存在的 web_crawlers 表添加 level 列
    try {
      db.run(`ALTER TABLE web_crawlers ADD COLUMN level TEXT DEFAULT 'Medium';`);
      console.log('✅ Migration: Added level column to web_crawlers');
    } catch (e) {
      // 列已存在，忽略错误
    }

    // 持久化到磁盘
    saveDatabase();

    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    return null;
  }
}

/**
 * 保存数据库到磁盘
 */
function saveDatabase() {
  if (!db || !ENABLED) return;

  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('Failed to save database:', error.message);
  }
}

/**
 * 记录推送日志
 */
export function logPush(item, larkResponse, success = true, errorMessage = null) {
  if (!ENABLED || !db) return;

  try {
    db.run(
      `INSERT INTO push_log (
        item_id, brand, category, score, title, summary, source_type, region,
        lark_response, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.brand || null,
        item.category || null,
        item.score || null,
        item.title || null,
        item.summary || null,
        item.sourceType || null,
        item.region || 'Global',
        JSON.stringify(larkResponse),
        success ? 1 : 0,
        errorMessage
      ]
    );

    saveDatabase();
  } catch (error) {
    console.error('Failed to log push:', error.message);
  }
}

/**
 * 记录AI决策日志
 */
export function logAiDecision(itemId, score, decision, metadata = {}) {
  if (!ENABLED || !db) return;

  try {
    db.run(
      `INSERT INTO ai_decision_log (item_id, score, decision, reason, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        itemId,
        score,
        decision,
        metadata.reason || null,
        JSON.stringify(metadata)
      ]
    );

    saveDatabase();
  } catch (error) {
    console.error('Failed to log AI decision:', error.message);
  }
}

/**
 * 记录错误日志
 */
export function logError(errorType, errorMessage, stackTrace = null, context = {}) {
  if (!ENABLED || !db) return;

  try {
    db.run(
      `INSERT INTO error_log (error_type, error_message, stack_trace, context)
       VALUES (?, ?, ?, ?)`,
      [errorType, errorMessage, stackTrace, JSON.stringify(context)]
    );

    saveDatabase();
  } catch (error) {
    console.error('Failed to log error:', error.message);
  }
}

/**
 * 记录数据脱敏日志
 */
export function logMasking(itemId, maskedFields, patternsMatched) {
  if (!ENABLED || !db) return;

  try {
    db.run(
      `INSERT INTO masking_log (item_id, masked_fields, patterns_matched)
       VALUES (?, ?, ?)`,
      [itemId, JSON.stringify(maskedFields), JSON.stringify(patternsMatched)]
    );

    saveDatabase();
  } catch (error) {
    console.error('Failed to log masking:', error.message);
  }
}

/**
 * 持久化去重：检查消息是否已见过
 */
export function hasSeenMessagePersistent(messageKey) {
  if (!ENABLED || !db) return false;

  try {
    const result = db.exec('SELECT 1 FROM seen_messages WHERE message_key = ?', [messageKey]);
    return result.length > 0 && result[0].values.length > 0;
  } catch (error) {
    console.error('Failed to check seen message:', error.message);
    return false;
  }
}

/**
 * 持久化去重：标记消息已见过
 */
export function markMessageSeenPersistent(messageKey) {
  if (!ENABLED || !db) return;

  try {
    db.run(
      `INSERT OR REPLACE INTO seen_messages (message_key, last_seen_at)
       VALUES (?, CURRENT_TIMESTAMP)`,
      [messageKey]
    );

    saveDatabase();
  } catch (error) {
    console.error('Failed to mark message as seen:', error.message);
  }
}

/**
 * 数据分析查询：获取统计数据
 */
export function getAnalytics(startDate = null, endDate = null) {
  if (!ENABLED || !db) return null;

  try {
    const dateFilter = startDate && endDate
      ? `WHERE pushed_at BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    // 推送统计
    const pushStatsResult = db.exec(`
      SELECT
        COUNT(*) as total_pushes,
        SUM(success) as successful_pushes,
        COUNT(*) - SUM(success) as failed_pushes,
        AVG(score) as avg_score,
        COUNT(DISTINCT brand) as unique_brands,
        COUNT(DISTINCT category) as unique_categories
      FROM push_log
      ${dateFilter}
    `);

    const pushStats = pushStatsResult[0]?.values[0] || [0, 0, 0, 0, 0, 0];
    const summary = {
      total_pushes: pushStats[0],
      successful_pushes: pushStats[1],
      failed_pushes: pushStats[2],
      avg_score: pushStats[3],
      unique_brands: pushStats[4],
      unique_categories: pushStats[5]
    };

    // 按品牌统计
    const byBrandResult = db.exec(`
      SELECT
        brand,
        COUNT(*) as count,
        AVG(score) as avg_score,
        SUM(success) as successful
      FROM push_log
      ${dateFilter}
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 10
    `);

    const byBrand = (byBrandResult[0]?.values || []).map(row => ({
      brand: row[0],
      count: row[1],
      avg_score: row[2],
      successful: row[3]
    }));

    // 按分类统计
    const byCategoryResult = db.exec(`
      SELECT
        category,
        COUNT(*) as count,
        AVG(score) as avg_score
      FROM push_log
      ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
    `);

    const byCategory = (byCategoryResult[0]?.values || []).map(row => ({
      category: row[0],
      count: row[1],
      avg_score: row[2]
    }));

    // 按时间统计（每小时）
    const byHourResult = db.exec(`
      SELECT
        strftime('%Y-%m-%d %H:00', pushed_at) as hour,
        COUNT(*) as count,
        AVG(score) as avg_score
      FROM push_log
      ${dateFilter}
      GROUP BY hour
      ORDER BY hour DESC
      LIMIT 24
    `);

    const byHour = (byHourResult[0]?.values || []).map(row => ({
      hour: row[0],
      count: row[1],
      avg_score: row[2]
    }));

    // AI决策统计
    const aiDecisionsResult = db.exec(`
      SELECT
        decision,
        COUNT(*) as count
      FROM ai_decision_log
      ${dateFilter.replace('pushed_at', 'decided_at')}
      GROUP BY decision
    `);

    const aiDecisions = (aiDecisionsResult[0]?.values || []).map(row => ({
      decision: row[0],
      count: row[1]
    }));

    // 数据脱敏统计
    const maskingStatsResult = db.exec(`
      SELECT COUNT(*) as total_masked
      FROM masking_log
      ${dateFilter.replace('pushed_at', 'masked_at')}
    `);

    const maskingStats = {
      total_masked: maskingStatsResult[0]?.values[0]?.[0] || 0
    };

    // 错误统计
    const errorStatsResult = db.exec(`
      SELECT
        error_type,
        COUNT(*) as count
      FROM error_log
      ${dateFilter.replace('pushed_at', 'occurred_at')}
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 5
    `);

    const errors = (errorStatsResult[0]?.values || []).map(row => ({
      error_type: row[0],
      count: row[1]
    }));

    // 按区域统计
    const byRegionResult = db.exec(`
      SELECT
        region,
        COUNT(*) as count,
        AVG(score) as avg_score
      FROM push_log
      ${dateFilter}
      GROUP BY region
      ORDER BY count DESC
    `);

    const byRegion = (byRegionResult[0]?.values || []).map(row => ({
      region: row[0] || 'Global',
      count: row[1],
      avg_score: row[2]
    }));

    // 按来源类型统计
    const bySourceResult = db.exec(`
      SELECT
        COALESCE(source_type, 'unknown') as source_type,
        COUNT(*) as count,
        AVG(score) as avg_score
      FROM push_log
      ${dateFilter}
      GROUP BY source_type
      ORDER BY count DESC
    `);

    const bySource = (bySourceResult[0]?.values || []).map(row => ({
      source_type: row[0],
      count: row[1],
      avg_score: row[2]
    }));

    return {
      summary,
      byBrand,
      byCategory,
      byHour,
      byRegion,
      bySource,
      aiDecisions,
      masking: maskingStats,
      errors,
      period: { startDate, endDate }
    };
  } catch (error) {
    console.error('Failed to get analytics:', error.message);
    return null;
  }
}

/**
 * 获取品牌 × 类型交叉分析数据
 */
export function getBrandCategoryMatrix(startDate = null, endDate = null, brandFilter = null) {
  if (!ENABLED || !db) return null;

  try {
    let dateFilter = '';
    let brandFilterSql = '';

    if (startDate && endDate) {
      dateFilter = `WHERE pushed_at BETWEEN '${startDate}' AND '${endDate}'`;
    }

    if (brandFilter && brandFilter !== 'all') {
      brandFilterSql = dateFilter ? `AND brand = '${brandFilter}'` : `WHERE brand = '${brandFilter}'`;
    }

    const sql = `
      SELECT
        brand,
        category,
        COUNT(*) as count,
        AVG(score) as avg_score
      FROM push_log
      ${dateFilter} ${brandFilterSql}
      GROUP BY brand, category
      ORDER BY brand, count DESC
    `;

    const result = db.exec(sql);

    if (!result[0]) return [];

    return result[0].values.map(row => ({
      brand: row[0] || 'Unknown',
      category: row[1] || 'Unknown',
      count: row[2],
      avg_score: row[3]
    }));
  } catch (error) {
    console.error('Failed to get brand-category matrix:', error.message);
    return [];
  }
}

/**
 * 获取品牌 × 区域交叉分析数据
 */
export function getBrandRegionMatrix(startDate = null, endDate = null, brandFilter = null, regionFilter = null) {
  if (!ENABLED || !db) return null;

  try {
    let filters = [];

    if (startDate && endDate) {
      filters.push(`pushed_at BETWEEN '${startDate}' AND '${endDate}'`);
    }

    if (brandFilter && brandFilter !== 'all') {
      filters.push(`brand = '${brandFilter}'`);
    }

    if (regionFilter && regionFilter !== 'all') {
      filters.push(`region = '${regionFilter}'`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
      SELECT
        brand,
        region,
        COUNT(*) as count,
        AVG(score) as avg_score
      FROM push_log
      ${whereClause}
      GROUP BY brand, region
      ORDER BY brand, count DESC
    `;

    const result = db.exec(sql);

    if (!result[0]) return [];

    return result[0].values.map(row => ({
      brand: row[0] || 'Unknown',
      region: row[1] || 'Global',
      count: row[2],
      avg_score: row[3]
    }));
  } catch (error) {
    console.error('Failed to get brand-region matrix:', error.message);
    return [];
  }
}

/**
 * 获取所有品牌列表
 */
export function getAllBrands() {
  if (!ENABLED || !db) return [];

  try {
    const result = db.exec(`
      SELECT DISTINCT brand
      FROM push_log
      WHERE brand IS NOT NULL
      ORDER BY brand
    `);

    if (!result[0]) return [];

    return result[0].values.map(row => row[0]);
  } catch (error) {
    console.error('Failed to get brands:', error.message);
    return [];
  }
}

/**
 * 清理旧数据（数据保留策略）
 */
export function cleanupOldRecords(retentionDays = 90) {
  if (!ENABLED || !db) return 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString();

    let totalDeleted = 0;

    const tables = [
      { name: 'push_log', dateColumn: 'pushed_at' },
      { name: 'ai_decision_log', dateColumn: 'decided_at' },
      { name: 'error_log', dateColumn: 'occurred_at' },
      { name: 'masking_log', dateColumn: 'masked_at' }
    ];

    for (const table of tables) {
      const before = db.exec(`SELECT COUNT(*) FROM ${table.name}`)[0].values[0][0];
      db.run(`DELETE FROM ${table.name} WHERE ${table.dateColumn} < ?`, [cutoffStr]);
      const after = db.exec(`SELECT COUNT(*) FROM ${table.name}`)[0].values[0][0];
      totalDeleted += (before - after);
    }

    // 清理去重记录（只保留最近30天）
    const seenCutoff = new Date();
    seenCutoff.setDate(seenCutoff.getDate() - 30);
    const seenBefore = db.exec('SELECT COUNT(*) FROM seen_messages')[0].values[0][0];
    db.run('DELETE FROM seen_messages WHERE first_seen_at < ?', [seenCutoff.toISOString()]);
    const seenAfter = db.exec('SELECT COUNT(*) FROM seen_messages')[0].values[0][0];
    totalDeleted += (seenBefore - seenAfter);

    saveDatabase();

    console.log(`✅ Cleaned up ${totalDeleted} old records (older than ${retentionDays} days)`);
    return totalDeleted;
  } catch (error) {
    console.error('Failed to cleanup old records:', error.message);
    return 0;
  }
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

// ============================================
// 阶段2：Telegram Channels CRUD
// ============================================

/**
 * 获取所有Telegram频道
 */
export function getTelegramChannels() {
  if (!db) return [];
  try {
    const result = db.exec('SELECT * FROM telegram_channels ORDER BY created_at DESC');
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (error) {
    console.error('Failed to get telegram channels:', error.message);
    return [];
  }
}

/**
 * 添加Telegram频道
 */
export function addTelegramChannel(brand, handle, level = 'High') {
  if (!db) return null;
  try {
    const id = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.run(
      'INSERT INTO telegram_channels (id, brand, handle, level) VALUES (?, ?, ?, ?)',
      [id, brand, handle, level]
    );
    saveDatabase();
    return id;
  } catch (error) {
    console.error('Failed to add telegram channel:', error.message);
    throw error;
  }
}

/**
 * 更新Telegram频道
 */
export function updateTelegramChannel(id, updates) {
  if (!db) return false;
  try {
    const fields = [];
    const values = [];

    if (updates.brand !== undefined) { fields.push('brand = ?'); values.push(updates.brand); }
    if (updates.handle !== undefined) { fields.push('handle = ?'); values.push(updates.handle); }
    if (updates.level !== undefined) { fields.push('level = ?'); values.push(updates.level); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(
      `UPDATE telegram_channels SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Failed to update telegram channel:', error.message);
    return false;
  }
}

/**
 * 删除Telegram频道
 */
export function deleteTelegramChannel(id) {
  if (!db) return false;
  try {
    db.run('DELETE FROM telegram_channels WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Failed to delete telegram channel:', error.message);
    return false;
  }
}

// ============================================
// 阶段2：Web Crawlers CRUD
// ============================================

/**
 * 获取所有网站爬虫
 */
export function getWebCrawlers() {
  if (!db) return [];
  try {
    const result = db.exec('SELECT * FROM web_crawlers ORDER BY created_at DESC');
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (error) {
    console.error('Failed to get web crawlers:', error.message);
    return [];
  }
}

/**
 * 添加网站爬虫
 */
export function addWebCrawler(name, url, crawlerType = 'tradingview', selector = null, level = 'Medium') {
  if (!db) return null;
  try {
    const id = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.run(
      'INSERT INTO web_crawlers (id, name, url, crawler_type, selector, level) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, url, crawlerType, selector, level]
    );
    saveDatabase();
    return id;
  } catch (error) {
    console.error('Failed to add web crawler:', error.message);
    throw error;
  }
}

/**
 * 更新网站爬虫
 */
export function updateWebCrawler(id, updates) {
  if (!db) return false;
  try {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.url !== undefined) { fields.push('url = ?'); values.push(updates.url); }
    if (updates.crawler_type !== undefined) { fields.push('crawler_type = ?'); values.push(updates.crawler_type); }
    if (updates.selector !== undefined) { fields.push('selector = ?'); values.push(updates.selector); }
    if (updates.level !== undefined) { fields.push('level = ?'); values.push(updates.level); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(
      `UPDATE web_crawlers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Failed to update web crawler:', error.message);
    return false;
  }
}

/**
 * 删除网站爬虫
 */
export function deleteWebCrawler(id) {
  if (!db) return false;
  try {
    db.run('DELETE FROM web_crawlers WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Failed to delete web crawler:', error.message);
    return false;
  }
}

// 初始化数据库 - 延迟到服务器启动前
// await initDatabase(); // 移除顶层 await，改为在 server.js 中显式调用
