import cron from 'node-cron';
import { refreshTelegramChannels } from './telegramCrawler.js';
import { refreshTradingViewNews } from './tradingviewCrawler.js';

const ENABLE_TELEGRAM_CRON = process.env.ENABLE_TELEGRAM_CRON === 'true';
const TELEGRAM_CRON = process.env.TELEGRAM_CRON || '*/5 * * * *';

const ENABLE_TRADINGVIEW_CRON = process.env.ENABLE_TRADINGVIEW_CRON === 'true';
const TRADINGVIEW_CRON = process.env.TRADINGVIEW_CRON || '*/10 * * * *';

export function startCronJobs() {

  // Telegram
  if (ENABLE_TELEGRAM_CRON) {

    console.log(
      `[Cron] Telegram cron enabled: ${TELEGRAM_CRON}`
    );

    cron.schedule(TELEGRAM_CRON, async () => {

      console.log(
        '[Cron] Refresh Telegram channels started.'
      );

      try {

        const result =
          await refreshTelegramChannels({
            push: true
          });

        console.log(
          `[Cron] Telegram refresh done. New items: ${result.count}`
        );

      } catch (error) {

        console.error(
          '[Cron] Telegram refresh failed:',
          error.message
        );

      }
    });
  }

  // TradingView
  if (ENABLE_TRADINGVIEW_CRON) {

    console.log(
      `[Cron] TradingView cron enabled: ${TRADINGVIEW_CRON}`
    );

    cron.schedule(TRADINGVIEW_CRON, async () => {

      console.log(
        '[Cron] Refresh TradingView news started.'
      );

      try {

        const result =
          await refreshTradingViewNews({
            push: true
          });

        console.log(
          `[Cron] TradingView refresh done. New items: ${result.count}`
        );

      } catch (error) {

        console.error(
          '[Cron] TradingView refresh failed:',
          error.message
        );

      }
    });
  }

  if (
    !ENABLE_TELEGRAM_CRON &&
    !ENABLE_TRADINGVIEW_CRON
  ) {
    console.log(
      '[Cron] All cron jobs disabled.'
    );
  }
}