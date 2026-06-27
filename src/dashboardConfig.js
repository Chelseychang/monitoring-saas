/**
 * Dashboard Panel Configuration
 * 面板配置管理，支持自定义布局
 */

export const DEFAULT_PANELS = [
  // 统计卡片（4个）
  {
    id: 'stat-intelligence',
    type: 'stat',
    visible: true,
    order: 1,
    title: '今日新增情报',
    subtitle: 'telegram messages',
    icon: 'TrendingUp',
    editable: true,
    size: 'medium' // small, medium, large, full
  },
  {
    id: 'stat-priority',
    type: 'stat',
    visible: true,
    order: 2,
    title: '高优先级事件',
    subtitle: 'critical alerts',
    icon: 'ShieldAlert',
    editable: true,
    size: 'medium'
  },
  {
    id: 'stat-pushed',
    type: 'stat',
    visible: true,
    order: 3,
    title: '已触发推送',
    subtitle: 'Lark + 站内消息',
    icon: 'Zap',
    editable: true,
    size: 'medium'
  },
  {
    id: 'stat-status',
    type: 'stat',
    visible: true,
    order: 4,
    title: '监听状态',
    subtitle: 'healthy channels',
    icon: 'CheckCircle2',
    editable: true,
    size: 'medium'
  },

  // 图表（2个）
  {
    id: 'chart-trend',
    type: 'chart',
    visible: true,
    order: 5,
    title: '7 日品牌动态趋势',
    subtitle: 'Daily captured intelligence by competitor brand',
    editable: true,
    size: 'large'
  },
  {
    id: 'chart-category',
    type: 'chart',
    visible: true,
    order: 6,
    title: '分类分布',
    subtitle: 'AI classified categories',
    editable: true,
    size: 'large'
  },

  // 内容区域（3个）
  {
    id: 'content-channels',
    type: 'content',
    visible: true,
    order: 7,
    title: '监听频道',
    subtitle: 'Telegram source health',
    editable: true,
    size: 'medium'
  },
  {
    id: 'content-feed',
    type: 'content',
    visible: true,
    order: 8,
    title: '实时情报信息流',
    subtitle: 'Search, filter and triage competitor movements',
    editable: true,
    size: 'large'
  },
  {
    id: 'content-notifications',
    type: 'content',
    visible: true,
    order: 9,
    title: '站内消息中心',
    subtitle: '普通情报默认进入站内消息；高优先级可同时推送 Lark。',
    editable: true,
    size: 'medium'
  },

  // Lark预览
  {
    id: 'lark',
    type: 'preview',
    visible: true,
    order: 10,
    title: 'Lark 消息预览',
    subtitle: '消息包含标签、时间、详情，并提供两个跳转按钮。',
    editable: true,
    size: 'full'
  }
];

// Dashboard页面标题配置
export const DEFAULT_DASHBOARD_TITLE = {
  main: '多源金融情报监控 Dashboard',
  subtitle: 'Telegram + TradingView financial intelligence monitoring with AI scoring and Lark push.'
};

const TITLE_STORAGE_KEY = 'dashboardTitle';

/**
 * 加载Dashboard标题
 */
export function loadDashboardTitle() {
  try {
    const saved = localStorage.getItem(TITLE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { ...DEFAULT_DASHBOARD_TITLE };
  } catch (error) {
    console.error('Failed to load dashboard title:', error);
    return { ...DEFAULT_DASHBOARD_TITLE };
  }
}

/**
 * 保存Dashboard标题
 */
export function saveDashboardTitle(title) {
  try {
    localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify(title));
  } catch (error) {
    console.error('Failed to save dashboard title:', error);
  }
}

const STORAGE_KEY = 'dashboardPanels';

/**
 * 从 localStorage 加载面板配置
 * @returns {Array} 面板配置数组
 */
export function loadPanelConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const panels = JSON.parse(saved);
      // 确保所有默认面板都存在（处理版本升级）
      const savedIds = new Set(panels.map(p => p.id));
      const missingPanels = DEFAULT_PANELS.filter(p => !savedIds.has(p.id));
      return [...panels, ...missingPanels].sort((a, b) => a.order - b.order);
    }
  } catch (error) {
    console.error('Failed to load panel config:', error);
  }
  return [...DEFAULT_PANELS];
}

/**
 * 保存面板配置到 localStorage
 * @param {Array} panels - 面板配置数组
 */
export function savePanelConfig(panels) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  } catch (error) {
    console.error('Failed to save panel config:', error);
  }
}

/**
 * 重置到默认配置
 * @returns {Array} 默认配置的副本
 */
export function resetPanelConfig() {
  const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_PANELS));
  savePanelConfig(defaultCopy);
  return defaultCopy;
}

/**
 * 更新面板顺序
 * @param {Array} panels - 当前面板配置
 * @param {number} fromIndex - 源索引
 * @param {number} toIndex - 目标索引
 * @returns {Array} 新的面板配置
 */
export function reorderPanels(panels, fromIndex, toIndex) {
  const visiblePanels = panels.filter(p => p.visible);
  const hiddenPanels = panels.filter(p => !p.visible);

  const result = Array.from(visiblePanels);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // 更新 order 字段
  result.forEach((panel, index) => {
    panel.order = index + 1;
  });

  return [...result, ...hiddenPanels];
}

/**
 * 更新面板标题
 * @param {Array} panels - 当前面板配置
 * @param {string} panelId - 面板ID
 * @param {string} newTitle - 新标题
 * @returns {Array} 新的面板配置
 */
export function updatePanelTitle(panels, panelId, newTitle) {
  return panels.map(panel =>
    panel.id === panelId ? { ...panel, title: newTitle } : panel
  );
}

/**
 * 更新面板副标题
 * @param {Array} panels - 当前面板配置
 * @param {string} panelId - 面板ID
 * @param {string} newSubtitle - 新副标题
 * @returns {Array} 新的面板配置
 */
export function updatePanelSubtitle(panels, panelId, newSubtitle) {
  return panels.map(panel =>
    panel.id === panelId ? { ...panel, subtitle: newSubtitle } : panel
  );
}

/**
 * 更新面板大小
 * @param {Array} panels - 当前面板配置
 * @param {string} panelId - 面板ID
 * @param {string} newSize - 新大小 (small, medium, large, full)
 * @returns {Array} 新的面板配置
 */
export function updatePanelSize(panels, panelId, newSize) {
  return panels.map(panel =>
    panel.id === panelId ? { ...panel, size: newSize } : panel
  );
}

/**
 * 删除（隐藏）面板
 * @param {Array} panels - 当前面板配置
 * @param {string} panelId - 面板ID
 * @returns {Array} 新的面板配置
 */
export function deletePanel(panels, panelId) {
  return panels.map(panel =>
    panel.id === panelId ? { ...panel, visible: false } : panel
  );
}

/**
 * 恢复面板
 * @param {Array} panels - 当前面板配置
 * @param {string} panelId - 面板ID
 * @returns {Array} 新的面板配置
 */
export function restorePanel(panels, panelId) {
  return panels.map(panel =>
    panel.id === panelId ? { ...panel, visible: true } : panel
  );
}
