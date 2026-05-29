import * as cheerio from 'cheerio';
import { analyzeTradingViewNews } from './tradingviewAnalyzer.js';
import { hasSeenMessage, markMessageSeen } from './telegramStore.js';
import { sendLarkItem } from './larkPush.js';

const TRADINGVIEW_NEWS_URL = process.env.TRADINGVIEW_NEWS_URL || 'https://www.tradingview.com/news/';
const TRADINGVIEW_LIMIT = Number(process.env.TRADINGVIEW_LIMIT || 8);
const PUSH_MIN_SCORE = Number(process.env.PUSH_MIN_SCORE || 70);

function absoluteTradingViewUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `https://www.tradingview.com${path}`;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sourceNameFromUrl(url) {
  const match = String(url || '').match(/\/news\/([^:/]+):/i);
  if (!match) return 'TradingView';

  return match[1]
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractNewsLinks(html) {
  const $ = cheerio.load(html);
  const links = [];

  $('a[href^="/news/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href === '/news/' || href.includes('/news/?') || href.includes('/news/#')) return;

    const url = absoluteTradingViewUrl(href);
    if (!links.includes(url)) links.push(url);
  });

  return links.slice(0, TRADINGVIEW_LIMIT);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 TelegramMonitoringSaaS/1.0',
      Accept: 'text/html,application/xhtml+xml'
    }
  });

  if (!response.ok) {
    throw new Error(`TradingView fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function fetchTradingViewArticle(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title = cleanText(
    $('h1').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text()
  ).replace(/— TradingView News$/i, '').trim();

  const summary = cleanText(
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('article').text() ||
    $('body').text()
  ).slice(0, 600);

  return analyzeTradingViewNews({
    sourceName: sourceNameFromUrl(url),
    title,
    summary,
    url,
    publishedAt: new Date().toISOString()
  });
}

export async function refreshTradingViewNews({ push = true } = {}) {
  const newItems = [];
  const errors = [];

  const html = await fetchHtml(TRADINGVIEW_NEWS_URL);
  const links = extractNewsLinks(html);

  for (const url of links) {
    const uniqueKey = `tradingview:${url}`;
    if (hasSeenMessage(uniqueKey)) continue;

    try {
      const item = await fetchTradingViewArticle(url);
      markMessageSeen(uniqueKey);
      newItems.push(item);

      if (push && item.score >= PUSH_MIN_SCORE) {
        await sendLarkItem(item);
      }
    } catch (error) {
      errors.push({ url, error: error.message });
    }
  }

  return {
    ok: errors.length === 0,
    source: 'tradingview',
    count: newItems.length,
    items: newItems,
    errors
  };
}