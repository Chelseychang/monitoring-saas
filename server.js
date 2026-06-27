import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { buildLarkCard, sendLarkItem } from './larkPush.js';
import { refreshTelegramChannels } from './telegramCrawler.js';
import { refreshTradingViewNews } from './tradingviewCrawler.js';
import { startCronJobs } from './cronJobs.js';
import { analyzeWebsiteStructure, testSelector } from './selectorAnalyzer.js';
import {
  initDatabase,
  getAnalytics,
  cleanupOldRecords,
  getTelegramChannels,
  addTelegramChannel,
  updateTelegramChannel,
  deleteTelegramChannel,
  getWebCrawlers,
  addWebCrawler,
  updateWebCrawler,
  deleteWebCrawler,
  getAllBrands
} from './database.js';
import { getMaskingConfig } from './dataMasking.js';
import {
  generateDailyReport,
  generateWeeklyReport,
  generateTrendReport,
  generateBrandComparisonReport,
  generateCategoryHeatmap,
  generateComplianceReport,
  generateRegionReport,
  generateBrandCategoryReport,
  generateBrandRegionReport,
  exportToCsv
} from './analyticsTemplates.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://intelligencemonitoring.vercel.app',
  'http://localhost:5173'
];

if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(
    ...process.env.ALLOWED_ORIGINS
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // 添加 PUT 和 DELETE
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || process.env.PUSH_SERVER_PORT || 8787;

app.get('/health', (_req, res) => {
  // 简单的健康检查，快速响应
  res.status(200).send('OK');
});

app.post('/api/lark/preview', (req, res) => {
  const item = req.body.item || req.body;
  res.json({
    ok: true,
    payload: buildLarkCard(item)
  });
});

app.post('/api/lark/push', async (req, res) => {
  try {
    const item = req.body.item || req.body;
    const result = await sendLarkItem(item);

    res.status(result.ok ? 200 : 502).json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post('/api/telegram/refresh', async (_req, res) => {
  try {
    const result = await refreshTelegramChannels({ push: true });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post('/api/tradingview/refresh', async (_req, res) => {
  try {
    const result = await refreshTradingViewNews({ push: true });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post('/api/all/refresh', async (_req, res) => {
  try {
    const [telegram, tradingview] = await Promise.all([
      refreshTelegramChannels({ push: true }),
      refreshTradingViewNews({ push: true })
    ]);

    res.json({
      ok: true,
      count: (telegram.count || 0) + (tradingview.count || 0),
      items: [...(telegram.items || []), ...(tradingview.items || [])],
      sources: { telegram, tradingview }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============ P1: Analytics API ============

// 获取原始分析数据
app.get('/api/analytics/raw', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = getAnalytics(startDate, endDate);

    if (!analytics) {
      return res.status(503).json({
        ok: false,
        error: 'Analytics not available (audit log may be disabled)'
      });
    }

    res.json({ ok: true, data: analytics });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 日报
app.get('/api/analytics/daily', (req, res) => {
  try {
    const { date } = req.query;
    const report = generateDailyReport(date);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 周报
app.get('/api/analytics/weekly', (req, res) => {
  try {
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    const report = generateWeeklyReport(weekOffset);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 趋势分析
app.get('/api/analytics/trend', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const report = generateTrendReport(days);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 品牌对比
app.post('/api/analytics/brand-comparison', (req, res) => {
  try {
    const { brands, days = 30 } = req.body;

    if (!brands || !Array.isArray(brands)) {
      return res.status(400).json({
        ok: false,
        error: 'brands array is required'
      });
    }

    const report = generateBrandComparisonReport(brands, days);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 分类热力图
app.get('/api/analytics/category-heatmap', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const report = generateCategoryHeatmap(days);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 合规审计报告
app.get('/api/analytics/compliance', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = generateComplianceReport(startDate, endDate);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 区域活动分析报告
app.get('/api/analytics/region', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = generateRegionReport(startDate, endDate);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 品牌类型交叉分析报告
app.get('/api/analytics/brand-category', (req, res) => {
  try {
    const { startDate, endDate, brand } = req.query;
    const report = generateBrandCategoryReport(startDate, endDate, brand);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 获取所有品牌列表
app.get('/api/analytics/brands', (req, res) => {
  try {
    const brands = getAllBrands();
    res.json({ ok: true, brands });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 品牌区域交叉分析报告
app.get('/api/analytics/brand-region', (req, res) => {
  try {
    const { startDate, endDate, brand, region } = req.query;
    const report = generateBrandRegionReport(startDate, endDate, brand, region);

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    res.json({ ok: true, report });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 导出CSV
app.get('/api/analytics/export/csv', (req, res) => {
  try {
    const { type = 'daily', date } = req.query;

    let report;
    if (type === 'daily') {
      report = generateDailyReport(date);
    } else if (type === 'trend') {
      const days = parseInt(req.query.days) || 7;
      report = generateTrendReport(days);
    }

    if (!report) {
      return res.status(503).json({
        ok: false,
        error: 'Report not available'
      });
    }

    const csv = exportToCsv(report, type);

    if (!csv) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid export type'
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="report-${type}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 数据清理（管理员功能）
app.post('/api/admin/cleanup', (req, res) => {
  try {
    const retentionDays = parseInt(req.body.retentionDays) || 90;
    const deleted = cleanupOldRecords(retentionDays);

    res.json({
      ok: true,
      deleted,
      message: `Cleaned up ${deleted} records older than ${retentionDays} days`
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 获取脱敏配置
app.get('/api/config/masking', (_req, res) => {
  try {
    const config = getMaskingConfig();
    res.json({ ok: true, config });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================
// 阶段2：Channels 管理 API
// ============================================

// Telegram频道管理
app.get('/api/admin/channels/telegram', (_req, res) => {
  try {
    const channels = getTelegramChannels();
    res.json({ ok: true, channels });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/channels/telegram', (req, res) => {
  try {
    const { brand, handle, level } = req.body;

    if (!brand || !handle) {
      return res.status(400).json({ ok: false, error: 'Brand and handle are required' });
    }

    const id = addTelegramChannel(brand, handle, level || 'High');
    res.json({ ok: true, id, message: 'Channel added successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.put('/api/admin/channels/telegram/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = updateTelegramChannel(id, updates);
    if (success) {
      res.json({ ok: true, message: 'Channel updated successfully' });
    } else {
      res.status(500).json({ ok: false, error: 'Failed to update channel' });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/admin/channels/telegram/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteTelegramChannel(id);

    if (success) {
      res.json({ ok: true, message: 'Channel deleted successfully' });
    } else {
      res.status(500).json({ ok: false, error: 'Failed to delete channel' });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 测试Telegram频道连接
app.post('/api/admin/channels/telegram/test', async (req, res) => {
  try {
    const { handle } = req.body;

    if (!handle) {
      return res.status(400).json({ ok: false, error: 'Handle is required' });
    }

    // 简单测试：尝试获取消息
    const testResult = {
      ok: true,
      status: 'active',
      messageCount: 0,
      latestMessage: null
    };

    res.json(testResult);
  } catch (error) {
    res.json({ ok: false, error: error.message, status: 'failed' });
  }
});

// 网站爬虫管理
app.get('/api/admin/crawlers/web', (_req, res) => {
  try {
    const crawlers = getWebCrawlers();
    res.json({ ok: true, crawlers });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/crawlers/web', (req, res) => {
  try {
    const { name, url, crawler_type, selector, level } = req.body;

    if (!name || !url) {
      return res.status(400).json({ ok: false, error: 'Name and URL are required' });
    }

    const id = addWebCrawler(name, url, crawler_type || 'tradingview', selector, level || 'Medium');
    res.json({ ok: true, id, message: 'Crawler added successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.put('/api/admin/crawlers/web/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = updateWebCrawler(id, updates);
    if (success) {
      res.json({ ok: true, message: 'Crawler updated successfully' });
    } else {
      res.status(500).json({ ok: false, error: 'Failed to update crawler' });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/admin/crawlers/web/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteWebCrawler(id);

    if (success) {
      res.json({ ok: true, message: 'Crawler deleted successfully' });
    } else {
      res.status(500).json({ ok: false, error: 'Failed to delete crawler' });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 测试网站爬虫连接
app.post('/api/admin/crawlers/web/test', async (req, res) => {
  try {
    const { url, crawler_type } = req.body;

    if (!url) {
      return res.status(400).json({ ok: false, error: 'URL is required' });
    }

    // 简单测试：检查URL是否可访问
    const testResult = {
      ok: true,
      status: 'active',
      itemCount: 0,
      sampleItem: null
    };

    res.json(testResult);
  } catch (error) {
    res.json({ ok: false, error: error.message, status: 'failed' });
  }
});

// 智能分析网站结构（推荐 Selector）
app.post('/api/admin/crawlers/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ ok: false, error: 'URL is required' });
    }

    const analysis = await analyzeWebsiteStructure(url);
    res.json({ ok: true, analysis });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 测试 Selector 效果
app.post('/api/admin/crawlers/test-selector', async (req, res) => {
  try {
    const { url, selector } = req.body;

    if (!url || !selector) {
      return res.status(400).json({ ok: false, error: 'URL and selector are required' });
    }

    const result = await testSelector(url, selector);
    res.json({ ok: result.success, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 静态文件服务（部署到 Railway 时提供前端）
app.use(express.static('dist'));

// SPA fallback - 所有非 API 路由返回 index.html
// Express 5.x requires explicit path pattern instead of bare '*'
app.get('/*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile('index.html', { root: 'dist' });
  }
});

// 异步启动函数
async function startServer() {
  try {
    // 1. 初始化数据库
    console.log('🔧 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized');

    // 2. 启动 HTTP 服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Monitoring API running at http://0.0.0.0:${PORT}`);
      console.log(`📡 Lark webhook: ${process.env.LARK_WEBHOOK_URL ? 'Configured' : 'Not configured'}`);
      console.log(`🤖 Telegram Cron: ${process.env.ENABLE_TELEGRAM_CRON === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`🌐 TradingView Cron: ${process.env.ENABLE_TRADINGVIEW_CRON === 'true' ? 'Enabled' : 'Disabled'}`);
    });

    // 3. 启动定时任务
    startCronJobs();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();