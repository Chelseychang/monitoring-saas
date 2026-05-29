import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { buildLarkCard, sendLarkItem } from './larkPush.js';
import { refreshTelegramChannels } from './telegramCrawler.js';
import { refreshTradingViewNews } from './tradingviewCrawler.js';
import { startCronJobs } from './cronJobs.js';

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
    telegramCronEnabled: process.env.ENABLE_TELEGRAM_CRON === 'true'
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

app.listen(PORT, () => {
  console.log(`Monitoring API running at http://localhost:${PORT}`);
  console.log(`Lark webhook configured: ${Boolean(process.env.LARK_WEBHOOK_URL)}`);
});

startCronJobs();