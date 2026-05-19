import * as cheerio from 'cheerio';
import { analyzeTelegramMessage } from './telegramAnalyzer.js';
import { hasSeenMessage, markMessageSeen } from './telegramStore.js';
import { sendLarkItem } from './larkPush.js';

export const TELEGRAM_CHANNELS = [
  { brand: 'Exness', handle: 'exnessasiaupdates', level: 'High' },
  { brand: 'Binance', handle: 'binance_announcements', level: 'Critical' },
  { brand: 'Binance CN', handle: 'binance_cn', level: 'High' },
  { brand: 'OKX Campaign', handle: 'okx_campaign_announcements', level: 'High' },
  { brand: 'OKX', handle: 'OKXAnnouncements', level: 'Critical' }
];

const PUSH_MIN_SCORE = Number(process.env.PUSH_MIN_SCORE || 70);

export async function fetchTelegramChannel(channel) {
  const url = `https://t.me/s/${channel.handle}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 TelegramMonitoringBot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Telegram fetch failed: ${channel.handle}, status=${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const messages = [];

  $('.tgme_widget_message').each((_, el) => {
    const messageId = $(el).attr('data-post');
    if (!messageId) return;

    const text = $(el).find('.tgme_widget_message_text').text().trim();
    if (!text) return;

    const publishedAt = $(el).find('time').attr('datetime');
    const sourceUrl = `https://t.me/${messageId}`;

    messages.push({
      messageId,
      text,
      publishedAt,
      sourceUrl
    });
  });

  return messages;
}

export async function refreshTelegramChannels({ push = true, limitPerChannel = 5 } = {}) {
  const newItems = [];
  const errors = [];

  for (const channel of TELEGRAM_CHANNELS) {
    try {
      const messages = await fetchTelegramChannel(channel);
      const latest = messages.slice(-limitPerChannel);

      for (const message of latest) {
        const uniqueKey = message.messageId;

        if (hasSeenMessage(uniqueKey)) continue;

        markMessageSeen(uniqueKey);

        const item = analyzeTelegramMessage({
          brand: channel.brand,
          handle: channel.handle,
          text: message.text,
          url: message.sourceUrl,
          publishedAt: message.publishedAt
        });

        newItems.push(item);

        if (push && item.score >= PUSH_MIN_SCORE) {
          await sendLarkItem(item);
        }
      }
    } catch (error) {
      console.error('[Telegram Refresh Error]', channel.handle, error.message);
      errors.push({
        channel: channel.handle,
        error: error.message
      });
    }
  }

  return {
    ok: true,
    count: newItems.length,
    items: newItems,
    errors
  };
}