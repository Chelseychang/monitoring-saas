/**
 * 智能 Selector 分析器
 * 自动识别网站结构，推荐最佳 CSS Selector
 */

import * as cheerio from 'cheerio';
// import Anthropic from '@anthropic-ai/sdk'; // 可选：用于 AI 增强分析

/**
 * 分析网站结构，推荐 Selector
 * @param {string} url - 网站 URL
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeWebsiteStructure(url) {
  const result = {
    url,
    analyzed: false,
    selectors: [],
    preview: [],
    recommendation: null,
    error: null
  };

  try {
    // 1. 获取网页内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IntelligenceCrawler/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. 智能检测可能的 Selector
    const candidates = await detectSelectors($);

    // 3. 为每个候选 Selector 生成预览
    for (const candidate of candidates) {
      try {
        const elements = $(candidate.selector);
        const preview = [];

        elements.slice(0, 3).each((i, el) => {
          const $el = $(el);
          const title = extractTitle($el);
          const text = $el.text().trim().substring(0, 150);
          const link = extractLink($el, url);

          preview.push({ title, text, link });
        });

        result.selectors.push({
          selector: candidate.selector,
          count: elements.length,
          confidence: candidate.confidence,
          reason: candidate.reason,
          preview
        });
      } catch (selectorError) {
        // 某些 selector 可能不被 Cheerio 支持（如 :ltr, :rtl）
        console.warn(`Skipping selector "${candidate.selector}": ${selectorError.message}`);
        continue;
      }
    }

    // 4. 推荐最佳 Selector
    if (result.selectors.length > 0) {
      result.recommendation = result.selectors[0];
      result.analyzed = true;
    }

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * 清理 class 名称，移除不支持的伪类和特殊字符
 */
function sanitizeClassName(className) {
  if (!className) return null;

  // 移除不支持的伪类（:ltr, :rtl, :dir() 等）
  const cleaned = className
    .split(' ')
    .filter(c => c && !c.includes(':') && !c.includes('[') && !c.includes('('))
    .map(c => c.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned[0] : null;
}

/**
 * 检测可能的 Selector（按置信度排序）
 */
async function detectSelectors($) {
  const candidates = [];

  // 策略 1：语义化标签（最稳定）
  if ($('article').length >= 3 && $('article').length <= 50) {
    candidates.push({
      selector: 'article',
      confidence: 0.9,
      reason: '检测到语义化 <article> 标签（最稳定）'
    });
  }

  // 策略 2：常见新闻类名
  const commonClasses = [
    'news-item', 'post', 'article-card', 'story-card',
    'news-card', 'post-item', 'article-item', 'entry'
  ];

  for (const cls of commonClasses) {
    const selector = `.${cls}`;
    const count = $(selector).length;
    if (count >= 3 && count <= 50) {
      candidates.push({
        selector,
        confidence: 0.8,
        reason: `检测到常见新闻类名 "${cls}"`
      });
    }
  }

  // 策略 3：包含 "article/post/news" 的 class（部分匹配）
  $('[class*="article"], [class*="post"], [class*="news"]').each((i, el) => {
    const rawClassName = $(el).attr('class');
    const className = sanitizeClassName(rawClassName);

    if (!className) return;

    const selector = `.${className}`;

    try {
      const count = $(selector).length;
      if (count >= 3 && count <= 50 && !candidates.some(c => c.selector === selector)) {
        candidates.push({
          selector,
          confidence: 0.7,
          reason: `检测到包含新闻关键词的类名 "${className}"`
        });
      }
    } catch (error) {
      // 选择器不支持，跳过
      return;
    }
  });

  // 策略 4：结构模式识别（相同标签重复出现）
  const structurePatterns = [
    { tag: 'div', minDepth: 2, maxDepth: 4 },
    { tag: 'section', minDepth: 1, maxDepth: 3 }
  ];

  for (const pattern of structurePatterns) {
    const elements = $(pattern.tag);
    const groups = new Map();

    elements.each((i, el) => {
      const $el = $(el);
      const structure = getStructureSignature($el);
      if (!groups.has(structure)) {
        groups.set(structure, []);
      }
      groups.get(structure).push(el);
    });

    // 找到重复次数最多的结构
    for (const [structure, els] of groups) {
      if (els.length >= 5 && els.length <= 50) {
        const $first = $(els[0]);
        const rawClassName = $first.attr('class');
        const className = sanitizeClassName(rawClassName);

        if (className) {
          const selector = `.${className}`;
          try {
            // 验证 selector 是否有效
            const testCount = $(selector).length;
            if (testCount > 0 && !candidates.some(c => c.selector === selector)) {
              candidates.push({
                selector,
                confidence: 0.6,
                reason: `检测到重复结构模式（${els.length} 个相似元素）`
              });
            }
          } catch (error) {
            // 选择器不支持，跳过
            continue;
          }
        }
      }
    }
  }

  // 策略 5：链接密集区域（新闻列表通常有很多链接）
  const containers = $('div, section, main, ul');
  const linkDensity = [];

  containers.each((i, el) => {
    const $el = $(el);
    const links = $el.find('a').length;
    const children = $el.children().length;

    if (links >= 5 && children >= 3) {
      const className = $el.attr('class')?.split(' ')[0];
      if (className) {
        const childSelector = `.${className} > *`;
        const count = $(childSelector).length;

        if (count >= 3 && !candidates.some(c => c.selector === childSelector)) {
          linkDensity.push({
            selector: childSelector,
            confidence: 0.5,
            reason: `检测到链接密集区域（${links} 个链接）`,
            density: links / children
          });
        }
      }
    }
  });

  linkDensity.sort((a, b) => b.density - a.density);
  candidates.push(...linkDensity.slice(0, 2));

  // 按置信度排序
  candidates.sort((a, b) => b.confidence - a.confidence);

  // 最多返回前 5 个
  return candidates.slice(0, 5);
}

/**
 * 提取元素的结构签名（用于识别重复模式）
 */
function getStructureSignature($el) {
  const children = $el.children();
  const tags = [];

  children.each((i, child) => {
    tags.push(child.tagName);
  });

  return tags.join(',');
}

/**
 * 提取标题
 */
function extractTitle($el) {
  // 尝试多种方式提取标题
  const title =
    $el.find('h1').first().text().trim() ||
    $el.find('h2').first().text().trim() ||
    $el.find('h3').first().text().trim() ||
    $el.find('h4').first().text().trim() ||
    $el.find('a').first().text().trim() ||
    $el.find('[class*="title"]').first().text().trim() ||
    $el.text().trim().split('\n')[0].substring(0, 100);

  return title || '(无标题)';
}

/**
 * 提取链接
 */
function extractLink($el, baseUrl) {
  const href =
    $el.attr('href') ||
    $el.find('a').first().attr('href');

  if (!href) return null;

  // 处理相对路径
  if (href.startsWith('/')) {
    const url = new URL(baseUrl);
    return `${url.origin}${href}`;
  }

  if (href.startsWith('http')) {
    return href;
  }

  return null;
}

/**
 * 使用 AI 分析（可选，需要 Claude API）
 * 注意：需要安装 @anthropic-ai/sdk 并配置 ANTHROPIC_API_KEY
 */
export async function analyzeWithAI(url, htmlSnippet) {
  // 暂时禁用 AI 分析，使用基于规则的分析即可
  return {
    analyzed: false,
    error: 'AI analysis not configured (optional feature)'
  };

  /* 如需启用，请：
   * 1. npm install @anthropic-ai/sdk
   * 2. 设置环境变量 ANTHROPIC_API_KEY
   * 3. 取消注释下面的代码
   */

  // if (!process.env.ANTHROPIC_API_KEY) {
  //   return {
  //     analyzed: false,
  //     error: 'ANTHROPIC_API_KEY not configured'
  //   };
  // }

  // try {
  //   const Anthropic = (await import('@anthropic-ai/sdk')).default;
  //   const client = new Anthropic({
  //     apiKey: process.env.ANTHROPIC_API_KEY
  //   });
  //   // ... AI 分析代码
  // } catch (error) {
  //   return {
  //     analyzed: false,
  //     error: error.message
  //   };
  // }
}

/**
 * 测试 Selector 并返回预览
 */
export async function testSelector(url, selector) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IntelligenceCrawler/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const elements = $(selector);

    const preview = [];
    elements.slice(0, 5).each((i, el) => {
      const $el = $(el);
      preview.push({
        title: extractTitle($el),
        text: $el.text().trim().substring(0, 200),
        link: extractLink($el, url),
        html: $el.html()?.substring(0, 300)
      });
    });

    return {
      success: true,
      count: elements.length,
      preview
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
