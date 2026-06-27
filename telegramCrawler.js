import * as cheerio from 'cheerio';
import { analyzeTelegramMessage } from './telegramAnalyzer.js';
import { hasSeenMessage, markMessageSeen } from './telegramStore.js';
import { sendLarkItem } from './larkPush.js';
import { getTelegramChannels } from './database.js';

// 从数据库加载频道配置（阶段2：动态管理）
// 旧的硬编码配置已迁移到数据库
// export const TELEGRAM_CHANNELS = [...]

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

  // 从数据库读取启用的频道（阶段2：动态管理）
  const channels = getTelegramChannels().filter(ch => ch.enabled);

  for (const channel of channels) {
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