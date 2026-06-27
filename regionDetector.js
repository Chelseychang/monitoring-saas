/**
 * 区域检测模块
 * 从消息内容中识别地理区域
 */

// 区域关键词映射
const REGION_PATTERNS = {
  CN: [
    /中国|中文|大陆|mainland|简体|繁體|繁体/i,
    /CNY|人民币|rmb/i,
    /微信|支付宝|wechat|alipay/i
  ],

  LATAM: [
    /拉美|拉丁美洲|latin\s*america|latam/i,
    /巴西|brazil|阿根廷|argentina|墨西哥|mexico/i,
    /智利|chile|哥伦比亚|colombia|秘鲁|peru/i,
    /委内瑞拉|venezuela|厄瓜多尔|ecuador/i,
    /BRL|ARS|MXN|CLP|COP/i  // 货币代码
  ],

  MENA: [
    /中东|北非|middle\s*east|mena/i,
    /阿联酋|uae|迪拜|dubai|阿布扎比|abu\s*dhabi/i,
    /沙特|saudi|卡塔尔|qatar|科威特|kuwait/i,
    /埃及|egypt|土耳其|turkey|以色列|israel/i,
    /伊朗|iran|伊拉克|iraq|叙利亚|syria/i,
    /AED|SAR|QAR|KWD|EGP|TRY/i  // 货币代码
  ],

  ASIA: [
    /亚洲|asia|东南亚|southeast\s*asia/i,
    /日本|japan|韩国|korea|新加坡|singapore/i,
    /泰国|thailand|越南|vietnam|马来西亚|malaysia/i,
    /印尼|indonesia|菲律宾|philippines|印度|india/i,
    /香港|hong\s*kong|台湾|taiwan|澳门|macau/i,
    /JPY|KRW|SGD|THB|VND|MYR|INR|HKD|TWD/i  // 货币代码
  ],

  EU: [
    /欧洲|europe|eu|欧盟|european\s*union/i,
    /英国|uk|united\s*kingdom|britain/i,
    /德国|germany|法国|france|意大利|italy/i,
    /西班牙|spain|荷兰|netherlands|瑞士|switzerland/i,
    /波兰|poland|瑞典|sweden|挪威|norway/i,
    /EUR|GBP|CHF|SEK|NOK|PLN/i  // 货币代码
  ],

  US: [
    /美国|usa|united\s*states|america/i,
    /加拿大|canada|北美|north\s*america/i,
    /纽约|new\s*york|洛杉矶|los\s*angeles|旧金山|san\s*francisco/i,
    /多伦多|toronto|温哥华|vancouver/i,
    /USD|CAD/i  // 货币代码
  ]
};

/**
 * 检测消息的地理区域
 * @param {string} text - 消息文本（标题 + 摘要）
 * @returns {string} 区域代码
 */
export function detectRegion(text) {
  if (!text) return 'Global';

  const normalizedText = String(text).toLowerCase();

  // 按优先级检查（更具体的区域优先）
  const regions = ['CN', 'LATAM', 'MENA', 'ASIA', 'EU', 'US'];

  for (const region of regions) {
    const patterns = REGION_PATTERNS[region];

    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return region;
      }
    }
  }

  // 未匹配到任何区域，返回全球
  return 'Global';
}

/**
 * 获取区域显示名称
 * @param {string} regionCode - 区域代码
 * @returns {string} 显示名称
 */
export function getRegionLabel(regionCode) {
  const labels = {
    'CN': '🇨🇳 中国大陆',
    'LATAM': '🌎 拉美地区',
    'MENA': '🕌 中东北非',
    'ASIA': '🌏 亚洲其他',
    'EU': '🇪🇺 欧洲',
    'US': '🇺🇸 北美',
    'Global': '🌍 全球'
  };

  return labels[regionCode] || regionCode;
}

/**
 * 获取所有支持的区域
 * @returns {Array} 区域列表
 */
export function getAllRegions() {
  return [
    { code: 'CN', label: getRegionLabel('CN') },
    { code: 'LATAM', label: getRegionLabel('LATAM') },
    { code: 'MENA', label: getRegionLabel('MENA') },
    { code: 'ASIA', label: getRegionLabel('ASIA') },
    { code: 'EU', label: getRegionLabel('EU') },
    { code: 'US', label: getRegionLabel('US') },
    { code: 'Global', label: getRegionLabel('Global') }
  ];
}
