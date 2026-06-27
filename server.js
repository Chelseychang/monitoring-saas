import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { buildLarkCard, sendLarkItem } from './larkPush.js';
import { refreshTelegramChannels } from './telegramCrawler.js';
import { refreshTradingViewNews } from './tradingviewCrawler.js';
import { startCronJobs } from './cronJobs.js';
import { getAnalytics, cleanupOldRecords } from './database.js';
import { getMaskingConfig } from './dataMasking.js';
import {
  generateDailyReport,
  generateWeeklyReport,
  generateTrendReport,
  generateBrandComparisonReport,
  generateCategoryHeatmap,
  generateComplianceReport,
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
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || process.env.PUSH_SERVER_PORT || 8787;

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'telegram-monitoring-api',
    webhookConfigured: Boolean(process.env.LARK_WEBHOOK_URL),
    platformUrl: process.env.MONITORING_PLATFORM_URL || 'http://localhost:5173',
    telegramCronEnabled: process.env.ENABLE_TELEGRAM_CRON === 'true',
    p1Features: {
      dataMasking: process.env.ENABLE_DATA_MASKING !== 'false',
      auditLog: process.env.ENABLE_AUDIT_LOG !== 'false'
    }
  });
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

app.listen(PORT, () => {
  console.log(`Monitoring API running at http://localhost:${PORT}`);
  console.log(`Lark webhook configured: ${Boolean(process.env.LARK_WEBHOOK_URL)}`);
});

startCronJobs();