/**
 * 数据迁移脚本：将硬编码的频道迁移到数据库
 * 用法：node migrate-channels.js
 */

import {
  getTelegramChannels,
  addTelegramChannel,
  getWebCrawlers,
  addWebCrawler
} from './database.js';

const HARDCODED_CHANNELS = [
  { brand: 'Exness', handle: 'exnessasiaupdates', level: 'High' },
  { brand: 'Binance', handle: 'binance', level: 'High' },
  { brand: 'Binance CN', handle: 'binance_cn', level: 'High' },
  { brand: 'OKX Campaign', handle: 'okx_campaign_announcements', level: 'High' },
  { brand: 'OKX', handle: 'OKXAnnouncements', level: 'Critical' }
];

const HARDCODED_CRAWLERS = [
  {
    name: 'TradingView News',
    url: 'https://www.tradingview.com/news/',
    crawler_type: 'tradingview',
    selector: null
  }
];

async function migrate() {
  console.log('🚀 开始数据迁移...\n');

  // 检查是否已迁移
  const existingChannels = getTelegramChannels();
  const existingCrawlers = getWebCrawlers();

  console.log(`📊 当前状态:`);
  console.log(`   Telegram 频道: ${existingChannels.length} 个`);
  console.log(`   网站爬虫: ${existingCrawlers.length} 个\n`);

  // 迁移 Telegram 频道
  let channelsMigrated = 0;
  for (const channel of HARDCODED_CHANNELS) {
    const exists = existingChannels.some(c => c.handle === channel.handle);
    if (!exists) {
      try {
        const id = addTelegramChannel(channel.brand, channel.handle, channel.level);
        console.log(`✅ 迁移 Telegram 频道: ${channel.brand} (@${channel.handle}) -> ${id}`);
        channelsMigrated++;
      } catch (error) {
        console.error(`❌ 迁移失败: ${channel.brand} - ${error.message}`);
      }
    } else {
      console.log(`⏭️  跳过已存在的频道: ${channel.brand} (@${channel.handle})`);
    }
  }

  // 迁移网站爬虫
  let crawlersMigrated = 0;
  for (const crawler of HARDCODED_CRAWLERS) {
    const exists = existingCrawlers.some(c => c.url === crawler.url);
    if (!exists) {
      try {
        const id = addWebCrawler(
          crawler.name,
          crawler.url,
          crawler.crawler_type,
          crawler.selector
        );
        console.log(`✅ 迁移网站爬虫: ${crawler.name} -> ${id}`);
        crawlersMigrated++;
      } catch (error) {
        console.error(`❌ 迁移失败: ${crawler.name} - ${error.message}`);
      }
    } else {
      console.log(`⏭️  跳过已存在的爬虫: ${crawler.name}`);
    }
  }

  console.log(`\n🎉 迁移完成!`);
  console.log(`   新增 Telegram 频道: ${channelsMigrated} 个`);
  console.log(`   新增网站爬虫: ${crawlersMigrated} 个`);

  // 显示最终状态
  const finalChannels = getTelegramChannels();
  const finalCrawlers = getWebCrawlers();

  console.log(`\n📊 最终状态:`);
  console.log(`   Telegram 频道: ${finalChannels.length} 个`);
  console.log(`   网站爬虫: ${finalCrawlers.length} 个`);

  console.log(`\n💡 提示: 迁移完成后，可以安全删除 telegramCrawler.js 中的 TELEGRAM_CHANNELS 数组`);
}

migrate();
