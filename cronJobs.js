import cron from 'node-cron';
import { refreshTelegramChannels } from './telegramCrawler.js';

const ENABLE_TELEGRAM_CRON = process.env.ENABLE_TELEGRAM_CRON === 'true';
const TELEGRAM_CRON = process.env.TELEGRAM_CRON || '*/5 * * * *';

export function startCronJobs() {
  if (!ENABLE_TELEGRAM_CRON) {
    console.log('[Cron] Telegram cron disabled.');
    return;
  }

  console.log(`[Cron] Telegram cron enabled: ${TELEGRAM_CRON}`);

  cron.schedule(TELEGRAM_CRON, async () => {
    console.log('[Cron] Refresh Telegram channels started.');

    try {
      const result = await refreshTelegramChannels({ push: true });
      console.log(`[Cron] Refresh done. New items: ${result.count}`);
    } catch (error) {
      console.error('[Cron] Refresh failed:', error.message);
    }
  });
}