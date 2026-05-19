export function analyzeTelegramMessage({ brand, handle, text, url, publishedAt }) {
  const lower = String(text || '').toLowerCase();

  const tags = [];

  if (/campaign|promotion|bonus|reward|airdrop|活动|奖励|空投|优惠/.test(lower)) {
    tags.push('campaign');
  }

  if (/listing|launch|launchpool|上线|新币|new product/.test(lower)) {
    tags.push('launch');
  }

  if (/futures|copy trading|earn|staking|跟单|理财|合约/.test(lower)) {
    tags.push('product');
  }

  if (/maintenance|system|downtime|维护|暂停|incident/.test(lower)) {
    tags.push('system');
  }

  const category =
    tags.includes('campaign') ? 'Campaign' :
    tags.includes('launch') ? 'Product Launch' :
    tags.includes('product') ? 'Product' :
    tags.includes('system') ? 'System Risk' :
    'Update';

  let score = 50;

  if (tags.includes('campaign')) score += 20;
  if (tags.includes('launch')) score += 15;
  if (tags.includes('product')) score += 10;
  if (/bonus|reward|airdrop|奖励|空投|\$|%/.test(lower)) score += 10;
  if (['Binance', 'OKX'].includes(brand)) score += 5;

  score = Math.min(score, 100);

  const level =
    score >= 85 ? 'Critical' :
    score >= 70 ? 'High' :
    'Medium';

  const id = `${handle}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    brand,
    handle,
    title: text.slice(0, 90) || `${brand} Telegram Update`,
    summary: text.slice(0, 300),
    category,
    score,
    level,
    time: new Date(publishedAt || Date.now()).toLocaleString('zh-CN', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: false
    }),
    tags: tags.length ? tags : ['telegram'],
    owner: 'Auto Monitor',
    sourceUrl: url,
    detailUrl: `/intelligence/${id}`,
    pushed: false
  };
}