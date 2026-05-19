import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PUSH_SERVER_PORT || 8787;
const WEBHOOK_URL = process.env.LARK_WEBHOOK_URL || '';
const BOT_SECRET = process.env.LARK_BOT_SECRET || '';
const PLATFORM_URL = process.env.MONITORING_PLATFORM_URL || 'http://localhost:5173';

function sign(timestamp, secret) {
  const stringToSign = `${timestamp}\n${secret}`;
  return crypto.createHmac('sha256', stringToSign).digest('base64');
}

function normalizeUrl(base, path) {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}

function isPublicHttpUrl(url) {
  return /^https:\/\//i.test(url) || /^http:\/\//i.test(url);
}

function buildUrlButton(text, url, type = 'default') {
  return {
    tag: 'button',
    text: { tag: 'plain_text', content: text },
    type,
    url,
    multi_url: {
      url,
      pc_url: url,
      android_url: url,
      ios_url: url
    }
  };
}

function buildLarkCard(item) {
  const platformUrl = normalizeUrl(PLATFORM_URL, item.detailUrl || `/intelligence/${item.id}`);
  const sourceUrl = item.sourceUrl || `https://t.me/s/${item.handle}`;
  const tags = (item.tags || []).map((t) => `#${t}`).join(' ');
  const template = item.level === 'Critical' ? 'red' : item.level === 'High' ? 'orange' : 'blue';

  const actions = [];
  if (isPublicHttpUrl(platformUrl)) {
    actions.push(buildUrlButton('打开监控平台', platformUrl, 'primary'));
  }
  if (isPublicHttpUrl(sourceUrl)) {
    actions.push(buildUrlButton('打开对应信息源', sourceUrl, 'default'));
  }

  const elements = [
    {
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**标题**：${item.title || 'Untitled'}\n\n**摘要**：${item.summary || ''}`
      }
    },
    { tag: 'hr' },
    {
      tag: 'div',
      fields: [
        { is_short: true, text: { tag: 'lark_md', content: `**品牌**\n${item.brand || '-'}` } },
        { is_short: true, text: { tag: 'lark_md', content: `**频道**\n@${item.handle || '-'}` } },
        { is_short: true, text: { tag: 'lark_md', content: `**类型**\n${item.category || '-'}` } },
        { is_short: true, text: { tag: 'lark_md', content: `**优先级**\n${item.level || '-'}` } },
        { is_short: true, text: { tag: 'lark_md', content: `**AI Score**\n${item.score ?? '-'}` } },
        { is_short: true, text: { tag: 'lark_md', content: `**时间**\n${item.time || '-'}` } }
      ]
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `**标签**：${tags || '-'}` }
    },
    {
      tag: 'note',
      elements: [
        {
          tag: 'lark_md',
          content: `详情入口：${platformUrl ? `[监控平台](${platformUrl})` : '-'} ｜ ${sourceUrl ? `[信息源](${sourceUrl})` : '-'}`
        }
      ]
    }
  ];

  if (actions.length) {
    elements.push({ tag: 'action', actions });
  }

  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true,
        enable_forward: true
      },
      header: {
        template,
        title: {
          tag: 'plain_text',
          content: `竞对情报：${item.brand || 'Unknown Brand'}`
        }
      },
      elements,
      // Whole-card fallback link. Buttons should still show, but this keeps the card clickable.
      card_link: isPublicHttpUrl(platformUrl) ? {
        url: platformUrl,
        pc_url: platformUrl,
        android_url: platformUrl,
        ios_url: platformUrl
      } : undefined
    }
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, webhookConfigured: Boolean(WEBHOOK_URL), platformUrl: PLATFORM_URL });
});

app.post('/api/lark/preview', (req, res) => {
  res.json({ ok: true, payload: buildLarkCard(req.body.item || req.body) });
});

app.post('/api/lark/push', async (req, res) => {
  const item = req.body.item || req.body;
  const payload = buildLarkCard(item);

  if (!WEBHOOK_URL) {
    return res.status(200).json({ ok: true, mocked: true, message: 'LARK_WEBHOOK_URL is not configured. Returned preview payload only.', payload });
  }

  const body = { ...payload };
  if (BOT_SECRET) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    body.timestamp = timestamp;
    body.sign = sign(timestamp, BOT_SECRET);
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(response.ok ? 200 : 502).json({ ok: response.ok, lark: data, payload: body });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, payload: body });
  }
});

app.listen(PORT, () => {
  console.log(`Lark push server running at http://localhost:${PORT}`);
  console.log(`Webhook configured: ${Boolean(WEBHOOK_URL)}`);
});
