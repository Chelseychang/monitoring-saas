import { detectRegion } from './regionDetector.js';

export function analyzeTradingViewNews({ sourceName, title, summary, url, publishedAt }) {
  const text = `${title || ''} ${summary || ''}`;
  const lower = text.toLowerCase();
  const tags = [];

  if (/mcp|chatgpt|openai|ai|artificial intelligence/.test(lower)) tags.push('ai');
  if (/broker|trading platform|platform|cfd|forex|retail trading/.test(lower)) tags.push('broker');
  if (/crypto|bitcoin|ethereum|exchange|token|stablecoin/.test(lower)) tags.push('crypto');
  if (/launch|opens|rolls out|release|introduces|announces/.test(lower)) tags.push('launch');
  if (/regulat|license|asic|sec|fca|compliance/.test(lower)) tags.push('regulation');
  if (/partnership|integrat|server|api/.test(lower)) tags.push('integration');

  const category =
    tags.includes('ai') ? 'AI / Platform' :
    tags.includes('regulation') ? 'Regulation' :
    tags.includes('crypto') ? 'Crypto Market' :
    tags.includes('broker') ? 'Broker News' :
    tags.includes('launch') ? 'Product Launch' :
    'Market News';

  let score = 55;

  if (tags.includes('ai')) score += 18;
  if (tags.includes('broker')) score += 12;
  if (tags.includes('crypto')) score += 10;
  if (tags.includes('launch')) score += 10;
  if (tags.includes('regulation')) score += 14;
  if (tags.includes('integration')) score += 8;

  if (/reuters|bloomberg|financial magnates|coindesk|benzinga/i.test(sourceName || '')) {
    score += 8;
  }

  score = Math.min(score, 100);

  const level = score >= 85 ? 'Critical' : score >= 70 ? 'High' : 'Medium';

  const id = `tradingview-${Buffer.from(url || title || Date.now().toString()).toString('base64url').slice(0, 18)}`;

  // 检测区域
  const combinedText = `${title || ''} ${summary || ''}`;
  const region = detectRegion(combinedText);

  return {
    id,
    sourceType: 'tradingview',
    brand: sourceName || 'TradingView',
    handle: 'TradingView News',
    title: String(title || 'TradingView News').slice(0, 120),
    summary: String(summary || title || '').slice(0, 360),
    category,
    score,
    level,
    time: new Date(publishedAt || Date.now()).toLocaleString('zh-CN', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: false
    }),
    tags: tags.length ? ['tradingview', ...tags] : ['tradingview', 'news'],
    owner: 'Market Intelligence',
    sourceUrl: url,
    detailUrl: `/intelligence/${id}`,
    region,
    pushed: false
  };
}