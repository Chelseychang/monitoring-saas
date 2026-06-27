/**
 * Data Masking Module
 * P1 Security Feature: 脱敏敏感信息（邮箱、电话、钱包地址等）
 */

import { logMasking } from './database.js';

const ENABLED = process.env.ENABLE_DATA_MASKING !== 'false';

/**
 * 脱敏模式配置
 */
const MASKING_PATTERNS = {
  // 邮箱地址
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    replacement: '[EMAIL_REDACTED]',
    description: 'Email addresses'
  },

  // 电话号码（国际格式）
  phone: {
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    replacement: '[PHONE_REDACTED]',
    description: 'Phone numbers'
  },

  // 加密货币钱包地址
  crypto_wallet: {
    regex: /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/g,
    replacement: '[WALLET_REDACTED]',
    description: 'Crypto wallet addresses'
  },

  // 信用卡号（简单匹配）
  credit_card: {
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
    description: 'Credit card numbers'
  },

  // IP地址
  ip_address: {
    regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    replacement: '[IP_REDACTED]',
    description: 'IP addresses',
    // 白名单：不脱敏这些IP
    whitelist: ['127.0.0.1', '0.0.0.0', '255.255.255.255']
  },

  // 身份证号（中国）
  id_card_cn: {
    regex: /\b[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]\b/g,
    replacement: '[ID_REDACTED]',
    description: 'Chinese ID card numbers'
  },

  // 价格信息（可选，保留货币符号）
  price: {
    regex: /\$[\d,]+(\.\d{2})?|\d+(\.\d{2})?\s?(USD|EUR|CNY|GBP)/gi,
    replacement: (match) => {
      // 保留货币符号，只掩盖数字
      if (match.startsWith('$')) return '$[AMOUNT]';
      const currency = match.match(/(USD|EUR|CNY|GBP)/i)?.[1];
      return currency ? `[AMOUNT] ${currency}` : '[AMOUNT]';
    },
    description: 'Price amounts',
    enabled: false // 默认不启用（价格通常不算敏感信息）
  }
};

/**
 * URL脱敏（智能处理）
 */
function maskUrl(url) {
  // 白名单：官方域名不脱敏
  const whitelist = [
    'binance.com', 'okx.com', 'exness.com', 'tradingview.com',
    'coinbase.com', 'kraken.com', 'bybit.com',
    'twitter.com', 'x.com', 'telegram.org', 't.me'
  ];

  try {
    const urlObj = new URL(url);
    const isWhitelisted = whitelist.some(domain => urlObj.hostname.includes(domain));

    if (isWhitelisted) {
      return url; // 保留白名单URL
    }

    // 非白名单URL：保留协议和顶级域，掩盖具体路径
    return `${urlObj.protocol}//[DOMAIN_REDACTED]`;
  } catch {
    // 不是有效URL，返回原文
    return url;
  }
}

/**
 * 脱敏单个字段
 */
function maskField(text, patterns = null) {
  if (!text || typeof text !== 'string') return text;

  const patternsToUse = patterns || Object.keys(MASKING_PATTERNS);
  const matched = [];
  let maskedText = text;

  for (const patternName of patternsToUse) {
    const pattern = MASKING_PATTERNS[patternName];

    // 跳过禁用的模式
    if (pattern.enabled === false) continue;

    // 处理白名单
    if (pattern.whitelist) {
      const whitelistSet = new Set(pattern.whitelist);
      maskedText = maskedText.replace(pattern.regex, (match) => {
        if (whitelistSet.has(match)) return match;
        matched.push(patternName);
        return typeof pattern.replacement === 'function'
          ? pattern.replacement(match)
          : pattern.replacement;
      });
    } else {
      // 没有白名单，直接替换
      const before = maskedText;
      maskedText = maskedText.replace(
        pattern.regex,
        typeof pattern.replacement === 'function'
          ? pattern.replacement
          : pattern.replacement
      );

      if (before !== maskedText) {
        matched.push(patternName);
      }
    }
  }

  // URL脱敏（非白名单）
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  maskedText = maskedText.replace(urlRegex, (match) => {
    const masked = maskUrl(match);
    if (masked !== match) matched.push('url');
    return masked;
  });

  return { text: maskedText, matched: [...new Set(matched)] };
}

/**
 * 脱敏整个对象（支持递归）
 */
export function maskItem(item, options = {}) {
  if (!ENABLED) {
    return item; // 脱敏功能禁用，返回原对象
  }

  const {
    patterns = null, // 指定要使用的脱敏模式
    fields = ['title', 'summary', 'content'], // 需要脱敏的字段
    logToDb = true // 是否记录到数据库
  } = options;

  const maskedItem = { ...item };
  const maskedFields = [];
  const allMatchedPatterns = new Set();

  for (const field of fields) {
    if (maskedItem[field] && typeof maskedItem[field] === 'string') {
      const result = maskField(maskedItem[field], patterns);
      maskedItem[field] = result.text;

      if (result.matched.length > 0) {
        maskedFields.push(field);
        result.matched.forEach(p => allMatchedPatterns.add(p));
      }
    }
  }

  // 记录脱敏日志
  if (logToDb && maskedFields.length > 0) {
    logMasking(item.id, maskedFields, [...allMatchedPatterns]);
  }

  return maskedItem;
}

/**
 * 批量脱敏
 */
export function maskItems(items, options = {}) {
  if (!ENABLED) return items;
  return items.map(item => maskItem(item, options));
}

/**
 * 仅用于测试的函数：检测敏感信息但不脱敏
 */
export function detectSensitiveInfo(text) {
  if (!text || typeof text !== 'string') return [];

  const detected = [];

  for (const [name, pattern] of Object.entries(MASKING_PATTERNS)) {
    if (pattern.enabled === false) continue;

    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      detected.push({
        type: name,
        count: matches.length,
        description: pattern.description,
        samples: matches.slice(0, 2) // 只返回前2个样本
      });
    }
  }

  return detected;
}

/**
 * 获取脱敏配置
 */
export function getMaskingConfig() {
  return {
    enabled: ENABLED,
    patterns: Object.entries(MASKING_PATTERNS).map(([name, config]) => ({
      name,
      description: config.description,
      enabled: config.enabled !== false
    }))
  };
}

export { MASKING_PATTERNS };
