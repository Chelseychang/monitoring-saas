import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ChannelsPage from './ChannelsPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Bell,
  Search,
  RefreshCw,
  Send,
  Radio,
  ShieldAlert,
  TrendingUp,
  Zap,
  CheckCircle2,
  Bot,
  LayoutDashboard,
  Rss,
  Settings,
  FileText,
  Globe2,
  Filter,
  Clock,
  ExternalLink,
  Sparkles,
  Database,
  Activity,
  X,
  Check,
  AlertTriangle,
  MessageCircle,
  Inbox,
  Link2,
  Edit,
  RotateCcw,
  GripVertical,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  loadPanelConfig,
  savePanelConfig,
  resetPanelConfig,
  updatePanelTitle,
  updatePanelSubtitle,
  updatePanelSize,
  deletePanel as deletePanelConfig,
  loadDashboardTitle,
  saveDashboardTitle,
  DEFAULT_DASHBOARD_TITLE
} from './dashboardConfig.js';
import './styles.css';
import './styles-edit-mode.css';

const PUSH_API_URL = import.meta.env.VITE_PUSH_API_URL || 'http://localhost:8787';
const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL || 'http://localhost:5173';

const channels = [
  {
    brand: 'Exness',
    handle: 'exnessasiaupdates',
    url: 'https://t.me/s/exnessasiaupdates',
    status: 'Live',
    priority: 'High',
    today: 6,
    last: '2m',
    health: 99
  },
  {
    brand: 'Binance',
    handle: 'binance_announcements',
    url: 'https://t.me/s/binance_announcements',
    status: 'Live',
    priority: 'Critical',
    today: 14,
    last: '1m',
    health: 100
  },
  {
    brand: 'Binance CN',
    handle: 'binance_cn',
    url: 'https://t.me/s/binance_cn',
    status: 'Live',
    priority: 'High',
    today: 9,
    last: '3m',
    health: 98
  },
  {
    brand: 'OKX Campaign',
    handle: 'okx_campaign_announcements',
    url: 'https://t.me/s/okx_campaign_announcements',
    status: 'Live',
    priority: 'High',
    today: 11,
    last: '1m',
    health: 99
  },
  {
    brand: 'OKX',
    handle: 'OKXAnnouncements',
    url: 'https://t.me/s/OKXAnnouncements',
    status: 'Live',
    priority: 'Critical',
    today: 8,
    last: '4m',
    health: 97
  }
];

const initialIntel = [
  {
    id: 1,
    brand: 'Binance',
    handle: 'binance_announcements',
    title: 'New Futures Trading Campaign Announced',
    summary:
      'Binance announced a futures trading campaign with reward pool incentives and time-limited participation rules.',
    category: 'Campaign',
    score: 92,
    level: 'Critical',
    time: '10:42',
    pushed: true,
    tags: ['futures', 'campaign', 'reward'],
    sourceType: 'telegram',
    owner: 'Product Strategy',
    sourceUrl: 'https://t.me/s/binance_announcements',
    detailUrl: '/intelligence/1'
  },
  {
    id: 2,
    brand: 'OKX Campaign',
    handle: 'okx_campaign_announcements',
    title: 'Copy Trading Reward Event',
    summary:
      'OKX launched a copy trading promotion for selected markets. Detected as high-value competitor activity.',
    category: 'Promotion',
    score: 86,
    level: 'High',
    time: '10:36',
    pushed: true,
    tags: ['copy trading', 'bonus'],
    sourceType: 'telegram',
    owner: 'Growth',
    sourceUrl: 'https://t.me/s/okx_campaign_announcements',
    detailUrl: '/intelligence/2'
  },
  {
    id: 3,
    brand: 'Binance CN',
    handle: 'binance_cn',
    title: '中文频道发布新币活动提醒',
    summary: '检测到 Binance 中文频道发布活动相关内容，包含奖励、交易任务和活动期限信息。',
    category: '活动',
    score: 78,
    level: 'High',
    time: '10:18',
    pushed: false,
    tags: ['活动', '奖励', '新币'],
    sourceType: 'telegram',
    owner: 'CN Market',
    sourceUrl: 'https://t.me/s/binance_cn',
    detailUrl: '/intelligence/3'
  },
  {
    id: 4,
    brand: 'Exness',
    handle: 'exnessasiaupdates',
    title: 'Regional Product Update',
    summary: 'Exness Asia channel posted a regional update. Classified as product/operations update with medium priority.',
    category: 'Product',
    score: 68,
    level: 'Medium',
    time: '09:55',
    pushed: false,
    tags: ['product', 'regional'],
    sourceType: 'telegram',
    owner: 'PM',
    sourceUrl: 'https://t.me/s/exnessasiaupdates',
    detailUrl: '/intelligence/4'
  },
  {
    id: 5,
    brand: 'OKX',
    handle: 'OKXAnnouncements',
    title: 'System Maintenance Notice',
    summary: 'OKX announced scheduled system maintenance. No immediate campaign action required.',
    category: 'System Risk',
    score: 52,
    level: 'Medium',
    time: '09:31',
    pushed: false,
    tags: ['maintenance', 'system'],
    sourceType: 'telegram',
    owner: 'Ops',
    sourceUrl: 'https://t.me/s/OKXAnnouncements',
    detailUrl: '/intelligence/5'
  }
];

const trend = [
  { d: 'Mon', Binance: 8, OKX: 6, Exness: 2 },
  { d: 'Tue', Binance: 11, OKX: 8, Exness: 3 },
  { d: 'Wed', Binance: 6, OKX: 10, Exness: 4 },
  { d: 'Thu', Binance: 12, OKX: 7, Exness: 5 },
  { d: 'Fri', Binance: 14, OKX: 11, Exness: 6 },
  { d: 'Sat', Binance: 9, OKX: 9, Exness: 3 },
  { d: 'Sun', Binance: 15, OKX: 12, Exness: 4 }
];

const cats = [
  { name: 'Campaign', value: 31 },
  { name: 'Product', value: 22 },
  { name: 'Policy', value: 13 },
  { name: 'System', value: 9 },
  { name: 'Other', value: 6 }
];

const COLORS = ['#2563eb', '#7c3aed', '#f97316', '#ef4444', '#64748b'];

const samples = [
  {
    brand: 'OKX',
    handle: 'OKXAnnouncements',
    title: 'New Earn Product Launch',
    summary:
      'OKX announced a new Earn product with fixed-term reward mechanics. AI marked it as product launch and competitor opportunity.',
    category: 'Product',
    score: 84,
    level: 'High',
    tags: ['earn', 'launch', 'reward'],
    sourceType: 'telegram',
    owner: 'Product',
    sourceUrl: 'https://t.me/s/OKXAnnouncements',
    detailUrl: '/intelligence/new-earn'
  },
  {
    brand: 'Binance',
    handle: 'binance_announcements',
    title: 'Launchpool Campaign Detected',
    summary:
      'Binance posted a Launchpool campaign. Reward mechanics, token exposure and time limit were extracted for follow-up.',
    category: 'Campaign',
    score: 95,
    level: 'Critical',
    tags: ['launchpool', 'campaign', 'token'],
    sourceType: 'telegram',
    owner: 'Growth',
    sourceUrl: 'https://t.me/s/binance_announcements',
    detailUrl: '/intelligence/launchpool'
  }
];

function toPlatformUrl(path) {
  if (!path) return PLATFORM_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${PLATFORM_URL.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}

function buildUrlButton(text, url, type = 'default') {
  return {
    tag: 'button',
    text: {
      tag: 'plain_text',
      content: text
    },
    url,
    type,
    multi_url: {
      url,
      pc_url: url,
      android_url: url,
      ios_url: url
    }
  };
}

function buildLarkMessage(item) {
  const platformUrl = toPlatformUrl(item.detailUrl || `/intelligence/${item.id}`);
  const sourceUrl = item.sourceUrl || `https://t.me/s/${item.handle}`;
  const tags = (item.tags || []).map((t) => `#${t}`).join(' ');

  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true,
        enable_forward: true
      },
      header: {
        template: item.level === 'Critical' ? 'red' : item.level === 'High' ? 'orange' : 'blue',
        title: {
          tag: 'plain_text',
          content: `竞对情报：${item.brand}`
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**标题**：${item.title}\n\n**摘要**：${item.summary}`
          }
        },
        { tag: 'hr' },
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**品牌**\n${item.brand}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**频道**\n@${item.handle}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**类型**\n${item.category}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**优先级**\n${item.level}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**AI Score**\n${item.score}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**时间**\n${item.time}` } }
          ]
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**标签**：${tags}`
          }
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'lark_md',
              content: `详情入口：[监控平台](${platformUrl}) ｜ [信息源](${sourceUrl})`
            }
          ]
        },
        {
          tag: 'action',
          actions: [
            buildUrlButton('打开监控平台', platformUrl, 'primary'),
            buildUrlButton('打开对应信息源', sourceUrl, 'default')
          ]
        }
      ],
      card_link: {
        url: platformUrl,
        pc_url: platformUrl,
        android_url: platformUrl,
        ios_url: platformUrl
      }
    }
  };
}

async function postJson(path, body) {
  const response = await fetch(`${PUSH_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body || {})
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

async function sendLarkPush(item) {
  const previewPayload = buildLarkMessage(item);

  try {
    const data = await postJson('/api/lark/push', { item });

    return {
      ok: data.ok !== false,
      mocked: Boolean(data.mocked),
      payload: data.payload || previewPayload,
      error: data.error || data.lark?.msg
    };
  } catch (err) {
    return {
      ok: false,
      mocked: true,
      payload: previewPayload,
      error: err.message
    };
  }
}

async function refreshAllSourcesFromBackend() {
  return postJson('/api/all/refresh', {});
}

function Badge({ children, type = 'default' }) {
  return <span className={`badge ${type}`}>{children}</span>;
}

function Stat({ title, value, icon: Icon, delta }) {
  return (
    <div className="stat card">
      <div>
        <p>{title}</p>
        <h3>{value}</h3>
        <span>{delta}</span>
      </div>
      <Icon size={28} />
    </div>
  );
}

// 可拖拽面板包装组件
function SortablePanel({ id, children, editMode, onEdit, onEditSubtitle, onEditSize, onDelete, size = 'medium' }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative'
  };

  // 根据size添加className
  const sizeClass = size ? `panel-size-${size}` : '';

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={sizeClass}>
      {editMode && (
        <div className="panelEditControls">
          <button className="dragHandle" {...listeners} title="拖拽排序">
            <GripVertical size={16} />
          </button>
          <button className="editBtn" onClick={onEdit} title="编辑标题">
            <Edit size={14} />
          </button>
          {onEditSubtitle && (
            <button className="editBtn" onClick={onEditSubtitle} title="编辑描述">
              <FileText size={14} />
            </button>
          )}
          {onEditSize && (
            <button className="sizeBtn" onClick={onEditSize} title="调整大小">
              <Database size={14} />
            </button>
          )}
          <button className="deleteBtn" onClick={onDelete} title="隐藏面板">
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`toast ${toast.type}`}>
      {toast.type === 'ok' ? <Check size={18} /> : <AlertTriangle size={18} />}
      <div>
        <b>{toast.title}</b>
        <p>{toast.msg}</p>
      </div>
      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function DetailModal({ item, onClose, onPush }) {
  if (!item) return null;

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <button className="iconBtn close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="row gap">
          <Badge type={item.level}>{item.level}</Badge>
          <Badge>{item.category}</Badge>
          {item.pushed && <Badge type="Live">Pushed</Badge>}
        </div>

        <h2>{item.title}</h2>
        <p className="muted">{item.summary}</p>

        <div className="detailGrid">
          <div>
            <span>Brand</span>
            <b>{item.brand}</b>
          </div>
          <div>
            <span>Channel</span>
            <b>@{item.handle}</b>
          </div>
          <div>
            <span>AI Score</span>
            <b>{item.score}</b>
          </div>
          <div>
            <span>Owner</span>
            <b>{item.owner}</b>
          </div>
        </div>

        <div className="tagRow">
          {(item.tags || []).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>

        <div className="row gap modalActions">
          <button className="primaryBtn" onClick={() => onPush(item)}>
            <Send size={16} /> 推送到 Lark 卡片
          </button>

          <a className="secondaryBtn" href={item.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Open source
          </a>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ active }) {
  return (
    <div className="card placeholder">
      <h2>{active}</h2>
      <p>这是 Demo 页面占位。左侧导航已可点击切换；生产版本可在这里接入真实 API 与表格/表单。</p>
    </div>
  );
}

function Dashboard() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [intel, setIntel] = useState(initialIntel);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [larkPreview, setLarkPreview] = useState(null);
  const [isRefreshing, setRefreshing] = useState(false);

  // 新增：面板配置和编辑模式
  const [panels, setPanels] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);
  const [dashboardTitle, setDashboardTitle] = useState(DEFAULT_DASHBOARD_TITLE);

  // 后端统计数据
  const [analytics, setAnalytics] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [monitoringSources, setMonitoringSources] = useState([]);

  // 加载面板配置和标题
  useEffect(() => {
    setPanels(loadPanelConfig());
    setDashboardTitle(loadDashboardTitle());
    fetchAnalytics();
  }, []);

  // 获取后端统计数据
  async function fetchAnalytics() {
    try {
      const res = await fetch(`${PUSH_API_URL}/api/analytics/raw`);
      const data = await res.json();
      if (data.ok) {
        setAnalytics(data.data);
      }

      // 获取7天趋势数据 - 暂时使用模拟数据以展示多品牌趋势
      // TODO: 当有更多历史数据后，从后端获取真实的每日品牌分布
      const mockTrendData = [
        { d: 'Mon', Telegram: 8, '网站爬虫': 2 },
        { d: 'Tue', Telegram: 10, '网站爬虫': 3 },
        { d: 'Wed', Telegram: 7, '网站爬虫': 2 },
        { d: 'Thu', Telegram: 11, '网站爬虫': 3 },
        { d: 'Fri', Telegram: 9, '网站爬虫': 3 },
        { d: 'Sat', Telegram: 12, '网站爬虫': 3 },
        { d: 'Sun', Telegram: 14, '网站爬虫': 4 }
      ];
      setTrendData(mockTrendData);

      // 获取监听源数据
      await fetchMonitoringSources();
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }

  // 获取监听源列表
  async function fetchMonitoringSources() {
    try {
      // 获取 Telegram 频道
      const telegramRes = await fetch(`${PUSH_API_URL}/api/admin/channels/telegram`);
      const telegramData = await telegramRes.json();

      // 获取网站爬虫
      const crawlersRes = await fetch(`${PUSH_API_URL}/api/admin/crawlers/web`);
      const crawlersData = await crawlersRes.json();

      const sources = [];

      // 添加 Telegram 频道
      if (telegramData.ok && telegramData.channels) {
        telegramData.channels.forEach(ch => {
          sources.push({
            id: ch.id,
            type: 'telegram',
            name: ch.brand,
            handle: ch.handle,
            url: `https://t.me/s/${ch.handle}`,
            enabled: ch.enabled,
            level: ch.level || 'High'
          });
        });
      }

      // 添加网站爬虫
      if (crawlersData.ok && crawlersData.crawlers) {
        crawlersData.crawlers.forEach(cr => {
          sources.push({
            id: cr.id,
            type: 'web',
            name: cr.name,
            handle: new URL(cr.url).hostname,
            url: cr.url,
            enabled: cr.enabled,
            level: cr.level || 'Medium'
          });
        });
      }

      setMonitoringSources(sources);
    } catch (error) {
      console.error('Failed to fetch monitoring sources:', error);
    }
  }

  const filtered = useMemo(() => {
    return intel.filter((x) => {
      const passFilter = filter === 'All' || x.level === filter || x.category === filter;
      const searchable = `${x.brand} ${x.title} ${x.summary} ${(x.tags || []).join(' ')}`.toLowerCase();
      return passFilter && searchable.includes(query.toLowerCase());
    });
  }, [query, filter, intel]);

  const total = channels.reduce((s, c) => s + c.today, 0) + Math.max(0, intel.length - initialIntel.length);

  function show(t) {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  }

  async function refresh() {
    setRefreshing(true);

    try {
      const data = await refreshAllSourcesFromBackend();
      const items = data.items || [];

      if (items.length) {
        setIntel((v) => {
          const existing = new Set(v.map((x) => String(x.id)));
          const fresh = items.filter((x) => !existing.has(String(x.id)));
          return [...fresh, ...v];
        });
      }

      show({
        type: 'ok',
        title: '刷新完成',
        msg: `已从后端抓取 ${data.count || items.length || 0} 条 Telegram 新情报，并自动处理 Lark 推送规则。`
      });

      // 刷新统计数据
      fetchAnalytics();
    } catch (err) {
      const s = samples[Math.floor(Math.random() * samples.length)];
      const d = new Date();

      setIntel((v) => [
        {
          ...s,
          id: Date.now(),
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pushed: false
        },
        ...v
      ]);

      show({
        type: 'warn',
        title: '后端刷新失败，已使用 Mock 数据',
        msg: err.message || '请检查 Railway 后端 /api/telegram/refresh。'
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function push(item) {
    setIntel((v) => v.map((x) => (x.id === item.id ? { ...x, pushed: true } : x)));

    const notif = {
      id: Date.now(),
      item,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications((v) => [notif, ...v]);
    setLarkPreview({ item, payload: buildLarkMessage(item), status: 'sending' });

    const result = await sendLarkPush(item);

    setLarkPreview({
      item,
      payload: result.payload,
      status: result.ok ? 'sent' : 'failed',
      mocked: result.mocked,
      error: result.error
    });

    show({
      type: result.ok ? 'ok' : 'warn',
      title: result.mocked ? '已生成 Lark 卡片预览' : 'Lark 卡片已发送',
      msg: result.ok
        ? `${item.brand} 已写入站内消息。Lark 卡片包含两个按钮：打开监控平台 / 打开对应信息源。`
        : `发送失败：${result.error || '请检查 Push Server 或 Webhook 配置'}`
    });
  }

  // 面板管理函数
  function handlePanelTitleChange(panelId, newTitle) {
    const updated = updatePanelTitle(panels, panelId, newTitle);
    setPanels(updated);
    savePanelConfig(updated);
  }

  function handlePanelSubtitleChange(panelId, newSubtitle) {
    const updated = updatePanelSubtitle(panels, panelId, newSubtitle);
    setPanels(updated);
    savePanelConfig(updated);
  }

  function handlePanelSizeChange(panelId, newSize) {
    const updated = updatePanelSize(panels, panelId, newSize);
    setPanels(updated);
    savePanelConfig(updated);
    show({ type: 'ok', title: '大小已更新', msg: `面板大小已设置为 ${newSize}` });
  }

  function handleDeletePanel(panelId) {
    const updated = deletePanelConfig(panels, panelId);
    setPanels(updated);
    savePanelConfig(updated);
    show({ type: 'ok', title: '面板已隐藏', msg: '可通过恢复默认布局重新显示' });
  }

  function handleResetLayout() {
    const defaultPanels = resetPanelConfig();
    setPanels(defaultPanels);
    setEditMode(false);
    show({ type: 'ok', title: '布局已恢复', msg: '所有面板已恢复为默认配置' });
  }

  function toggleEditMode() {
    setEditMode(!editMode);
    setEditingPanel(null);
  }

  function handleEditDashboardTitle() {
    const newMain = prompt('编辑Dashboard主标题', dashboardTitle.main);
    if (newMain && newMain !== dashboardTitle.main) {
      const newTitle = { ...dashboardTitle, main: newMain };
      setDashboardTitle(newTitle);
      saveDashboardTitle(newTitle);
      show({ type: 'ok', title: '标题已更新', msg: '页面主标题已更新' });
    }
  }

  function handleEditDashboardSubtitle() {
    const newSubtitle = prompt('编辑Dashboard副标题', dashboardTitle.subtitle);
    if (newSubtitle && newSubtitle !== dashboardTitle.subtitle) {
      const newTitle = { ...dashboardTitle, subtitle: newSubtitle };
      setDashboardTitle(newTitle);
      saveDashboardTitle(newTitle);
      show({ type: 'ok', title: '副标题已更新', msg: '页面副标题已更新' });
    }
  }

  // 拖拽相关
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const visiblePanels = panels.filter(p => p.visible);
      const oldIndex = visiblePanels.findIndex(p => p.id === active.id);
      const newIndex = visiblePanels.findIndex(p => p.id === over.id);

      const reordered = arrayMove(visiblePanels, oldIndex, newIndex);
      const hiddenPanels = panels.filter(p => !p.visible);

      // 更新order字段
      reordered.forEach((panel, index) => {
        panel.order = index + 1;
      });

      const newPanels = [...reordered, ...hiddenPanels];
      setPanels(newPanels);
      savePanelConfig(newPanels);
    }
  }

  function testPush() {
    push(intel[0]);
  }

  function markAllRead() {
    setNotifications((v) => v.map((n) => ({ ...n, read: true })));

    show({
      type: 'ok',
      title: '站内消息已读',
      msg: '所有站内消息已标记为已读。'
    });
  }

  // 图标映射
  const iconMap = {
    TrendingUp, ShieldAlert, Zap, CheckCircle2, Bot, Inbox, Link2
  };

  // 渲染面板内容的函数
  function renderPanelContent(panel) {
    // 统计卡片
    if (panel.type === 'stat') {
      let value = '0';
      let subtitle = panel.subtitle;
      const Icon = iconMap[panel.icon] || Activity;

      switch (panel.id) {
        case 'stat-intelligence':
          // 使用后端统计数据
          if (analytics && analytics.bySource) {
            value = analytics.summary.total_pushes;
            // 动态生成来源分布文本
            const sourceStats = analytics.bySource.map(s => {
              const label = s.source_type === 'telegram' ? 'Telegram' :
                           s.source_type === 'tradingview' ? '网站爬虫' : s.source_type;
              return `${label}: ${s.count}`;
            }).join(' | ');
            subtitle = sourceStats || panel.subtitle;
          } else {
            value = total;
          }
          break;
        case 'stat-priority':
          value = intel.filter((x) => x.score >= 80).length;
          break;
        case 'stat-pushed':
          value = intel.filter((x) => x.pushed).length;
          break;
        case 'stat-status':
          value = '5/5';
          break;
      }

      return <Stat title={panel.title} value={value} icon={Icon} delta={subtitle} />;
    }

    // 图表卡片
    if (panel.type === 'chart') {
      if (panel.id === 'chart-trend') {
        const displayData = trendData.length > 0 ? trendData : trend;

        return (
          <div className="card chartCard">
            <div className="cardHeader">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
              <Badge type="Live">Auto refreshed</Badge>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="b" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="d" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="Telegram" stroke="#2563eb" fill="url(#b)" />
                <Area type="monotone" dataKey="网站爬虫" stroke="#f97316" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      } else if (panel.id === 'chart-category') {
        // 分类分布饼图 - 使用真实数据
        const categoryData = analytics && analytics.byCategory ? analytics.byCategory.map(c => ({
          name: c.category,
          value: c.count
        })) : cats;

        return (
          <div className="card chartCard">
            <div className="cardHeader">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
              <Sparkles size={18} />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {categoryData.map((e, i) => (
                    <Cell key={e.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="legend">
              {categoryData.map((c, i) => (
                <span key={c.name}>
                  <i style={{ background: COLORS[i] }} /> {c.name}: {c.value}
                </span>
              ))}
            </div>
          </div>
        );
      } else if (panel.id === 'chart-source') {
        // 来源类型分布饼图
        const sourceData = analytics && analytics.bySource ? analytics.bySource.map(s => ({
          name: s.source_type === 'telegram' ? 'Telegram' :
                s.source_type === 'tradingview' ? '网站爬虫' : s.source_type,
          value: s.count
        })) : [];

        return (
          <div className="card chartCard">
            <div className="cardHeader">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
              <Database size={18} />
            </div>

            {sourceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {sourceData.map((e, i) => (
                        <Cell key={e.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="legend">
                  {sourceData.map((c, i) => (
                    <span key={c.name}>
                      <i style={{ background: COLORS[i] }} /> {c.name}: {c.value}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <Database size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                <p>暂无数据</p>
              </div>
            )}
          </div>
        );
      }
    }

    // 内容区域
    if (panel.type === 'content') {
      if (panel.id === 'content-channels') {
        const displaySources = monitoringSources.length > 0 ? monitoringSources : channels.map(c => ({
          id: c.handle,
          type: 'telegram',
          name: c.brand,
          handle: c.handle,
          url: c.url,
          enabled: true,
          level: c.priority
        }));

        return (
          <aside className="card">
            <div className="cardHeader">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
              <Database size={18} />
            </div>

            <div className="channelList">
              {displaySources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`channel ${!source.enabled ? 'disabled' : ''}`}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b>{source.name}</b>
                      {source.type === 'telegram' ? (
                        <Badge type="info" style={{ fontSize: '10px', padding: '2px 6px' }}>TG</Badge>
                      ) : (
                        <Badge type="success" style={{ fontSize: '10px', padding: '2px 6px' }}>WEB</Badge>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>
                      {source.type === 'telegram' ? `@${source.handle}` : source.handle}
                    </span>
                  </div>
                  <div className="channelMeta">
                    <Badge type={source.level}>{source.level}</Badge>
                    {!source.enabled && <small style={{ color: '#94a3b8' }}>已禁用</small>}
                  </div>
                </a>
              ))}
            </div>
          </aside>
        );
      } else if (panel.id === 'content-feed') {
        return (
          <main className="card feedCard">
            <div className="cardHeader">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
            </div>

            <div className="filters">
              <label>
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索品牌 / 关键词" />
              </label>

              <label>
                <Filter size={16} />
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option>All</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Campaign</option>
                  <option>Promotion</option>
                </select>
              </label>
            </div>

            <div className="feed">
              {filtered.map((x) => (
                <article key={x.id} className="intel">
                  <div className="intelMain">
                    <div className="row gap">
                      <Badge type={x.level}>{x.level}</Badge>
                      <Badge>{x.category}</Badge>
                      {x.sourceType && (
                        <Badge type="info">
                          {x.sourceType === 'telegram' ? 'Telegram' :
                           x.sourceType === 'tradingview' ? '网站' : x.sourceType}
                        </Badge>
                      )}
                      {x.pushed && <Badge type="Live">Pushed</Badge>}
                    </div>

                    <h3>{x.title}</h3>
                    <p>{x.summary}</p>

                    <div className="meta">
                      <span>{x.brand}</span>
                      <span>@{x.handle}</span>
                      <span>
                        <Clock size={13} /> {x.time}
                      </span>
                      <span>{x.owner}</span>
                    </div>

                    <div className="tagRow">
                      {(x.tags || []).map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="scoreBox">
                    <strong>{x.score}</strong>
                    <span>AI Score</span>
                    <button onClick={() => setSelected(x)}>
                      Details <ExternalLink size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </main>
        );
      } else if (panel.id === 'content-notifications') {
        return (
          <aside className="card">
            <div className="cardHeader">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
              <Inbox size={18} />
            </div>

            <button className="secondaryBtn full" onClick={markAllRead}>
              全部已读
            </button>

            <div className="notifyList">
              {notifications.length === 0 && (
                <div className="empty">
                  <MessageCircle size={28} />
                  <b>暂无站内消息</b>
                  <p>点击情报 Details → 推送到 Lark 后，这里会生成站内消息。</p>
                </div>
              )}

              {notifications.map((n) => (
                <div key={n.id} className={`notify ${n.read ? 'read' : ''}`} onClick={() => setSelected(n.item)}>
                  <div className="row gap">
                    <Badge type={n.item.level}>{n.item.level}</Badge>
                    <Badge>{n.item.category}</Badge>
                  </div>

                  <b>{n.item.brand} · {n.item.title}</b>
                  <p>{n.item.summary}</p>
                  <small>
                    标签：{(n.item.tags || []).map((t) => `#${t}`).join(' ')} · 时间：{n.createdAt} · 详情：Lark 卡片含两个跳转按钮
                  </small>
                </div>
              ))}
            </div>
          </aside>
        );
      }
    }

    // Lark预览
    if (panel.type === 'preview' && panel.id === 'lark') {
      return (
        <section className="card larkPanel">
          <div className="cardHeader">
            <div>
              <h2>{panel.title}</h2>
              <p>{panel.subtitle}</p>
            </div>
            <Link2 size={18} />
          </div>

          {!larkPreview && (
            <div className="empty wide">
              <Bell size={32} />
              <b>暂无 Lark 预览</b>
              <p>触发推送后，这里会展示 Lark 卡片与 JSON payload。</p>
            </div>
          )}

          {larkPreview && (
            <div className="larkPreview">
              <div className={`larkCard ${larkPreview.item.level}`}>
                <Badge type={larkPreview.item.level}>{larkPreview.item.level}</Badge>
                <h3>竞对动态：{larkPreview.item.brand}</h3>
                <h4>{larkPreview.item.title}</h4>
                <p>{larkPreview.item.summary}</p>

                <div className="detailGrid compact">
                  <div>
                    <span>标签</span>
                    <b>{(larkPreview.item.tags || []).map((t) => `#${t}`).join(' ')}</b>
                  </div>
                  <div>
                    <span>时间</span>
                    <b>{larkPreview.item.time}</b>
                  </div>
                  <div>
                    <span>分类</span>
                    <b>{larkPreview.item.category}</b>
                  </div>
                  <div>
                    <span>AI Score</span>
                    <b>{larkPreview.item.score}</b>
                  </div>
                </div>

                <div className="row gap">
                  <a className="primaryBtn" href={toPlatformUrl(larkPreview.item.detailUrl)} target="_blank" rel="noreferrer">
                    打开监控平台
                  </a>
                  <a className="secondaryBtn" href={larkPreview.item.sourceUrl} target="_blank" rel="noreferrer">
                    打开对应信息源
                  </a>
                </div>

                <small>
                  状态：
                  {larkPreview.status === 'sent'
                    ? larkPreview.mocked
                      ? 'Mock 预览（未配置 Webhook）'
                      : '已发送到 Lark'
                    : larkPreview.status === 'failed'
                      ? '发送失败'
                      : '准备发送'}
                </small>
              </div>

              <details>
                <summary>查看 Lark JSON payload</summary>
                <pre>{JSON.stringify(larkPreview.payload, null, 2)}</pre>
              </details>
            </div>
          )}
        </section>
      );
    }

    return null;
  }

  const visiblePanels = panels.filter(p => p.visible);
  const panelIds = visiblePanels.map(p => p.id);

  // 按类型分组面板
  const statPanels = visiblePanels.filter(p => p.type === 'stat');
  const chartPanels = visiblePanels.filter(p => p.type === 'chart');
  const contentPanels = visiblePanels.filter(p => p.type === 'content');
  const otherPanels = visiblePanels.filter(p => p.type !== 'stat' && p.type !== 'chart' && p.type !== 'content');

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DetailModal item={selected} onClose={() => setSelected(null)} onPush={push} />

      <header className="topbar">
        <div>
          <div className="titleWithEdit">
            <h1>{dashboardTitle.main}</h1>
            {editMode && (
              <button className="editTitleBtn" onClick={handleEditDashboardTitle} title="编辑主标题">
                <Edit size={16} />
              </button>
            )}
          </div>
          <div className="subtitleWithEdit">
            <p>{dashboardTitle.subtitle}</p>
            {editMode && (
              <button className="editSubtitleBtn" onClick={handleEditDashboardSubtitle} title="编辑副标题">
                <Edit size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="topActions">
          <button className={editMode ? "primaryBtn" : "secondaryBtn"} onClick={toggleEditMode}>
            {editMode ? <Check size={16} /> : <Edit size={16} />}
            {editMode ? '完成编辑' : '编辑布局'}
          </button>

          {editMode && (
            <button className="secondaryBtn" onClick={handleResetLayout}>
              <RotateCcw size={16} /> 恢复默认
            </button>
          )}

          {!editMode && (
            <>
              <button className="primaryBtn" onClick={refresh} disabled={isRefreshing}>
                <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
                {isRefreshing ? 'Refreshing' : 'Refresh'}
              </button>

              <button className="secondaryBtn" onClick={testPush}>
                <Bell size={16} /> Test Push
              </button>
            </>
          )}
        </div>
      </header>

      {editMode && (
        <div className="editModeIndicator">
          <Edit size={18} />
          <span>编辑模式已激活 - 拖拽面板调整顺序，点击编辑按钮修改标题，点击删除按钮隐藏面板</span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* 统计卡片 */}
        {statPanels.length > 0 && (
          <section className="stats">
            <SortableContext items={statPanels.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {statPanels.map((panel) => (
                <SortablePanel
                  key={panel.id}
                  id={panel.id}
                  size={panel.size}
                  editMode={editMode}
                  onEdit={() => {
                    const newTitle = prompt(`编辑卡片标题`, panel.title);
                    if (newTitle && newTitle !== panel.title) {
                      handlePanelTitleChange(panel.id, newTitle);
                    }
                  }}
                  onEditSubtitle={() => {
                    const newSubtitle = prompt(`编辑卡片描述`, panel.subtitle);
                    if (newSubtitle && newSubtitle !== panel.subtitle) {
                      handlePanelSubtitleChange(panel.id, newSubtitle);
                    }
                  }}
                  onEditSize={() => {
                    const sizes = ['small', 'medium', 'large', 'full'];
                    const currentIndex = sizes.indexOf(panel.size || 'medium');
                    const sizeLabels = { small: '小', medium: '中', large: '大', full: '全宽' };
                    const options = sizes.map((s, i) => `${i + 1}. ${sizeLabels[s]} (${s})`).join('\n');
                    const choice = prompt(`选择卡片大小：\n${options}\n\n当前: ${sizeLabels[panel.size || 'medium']}`, String(currentIndex + 1));
                    if (choice) {
                      const index = parseInt(choice) - 1;
                      if (index >= 0 && index < sizes.length) {
                        handlePanelSizeChange(panel.id, sizes[index]);
                      }
                    }
                  }}
                  onDelete={() => handleDeletePanel(panel.id)}
                >
                  {renderPanelContent(panel)}
                </SortablePanel>
              ))}
            </SortableContext>
          </section>
        )}

        {/* 图表 */}
        {chartPanels.length > 0 && (
          <section className="grid2">
            <SortableContext items={chartPanels.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {chartPanels.map((panel) => (
                <SortablePanel
                  key={panel.id}
                  id={panel.id}
                  size={panel.size}
                  editMode={editMode}
                  onEdit={() => {
                    const newTitle = prompt(`编辑图表标题`, panel.title);
                    if (newTitle && newTitle !== panel.title) {
                      handlePanelTitleChange(panel.id, newTitle);
                    }
                  }}
                  onEditSubtitle={() => {
                    const newSubtitle = prompt(`编辑图表描述`, panel.subtitle);
                    if (newSubtitle && newSubtitle !== panel.subtitle) {
                      handlePanelSubtitleChange(panel.id, newSubtitle);
                    }
                  }}
                  onEditSize={() => {
                    const sizes = ['small', 'medium', 'large', 'full'];
                    const currentIndex = sizes.indexOf(panel.size || 'large');
                    const sizeLabels = { small: '小', medium: '中', large: '大', full: '全宽' };
                    const options = sizes.map((s, i) => `${i + 1}. ${sizeLabels[s]} (${s})`).join('\n');
                    const choice = prompt(`选择图表大小：\n${options}\n\n当前: ${sizeLabels[panel.size || 'large']}`, String(currentIndex + 1));
                    if (choice) {
                      const index = parseInt(choice) - 1;
                      if (index >= 0 && index < sizes.length) {
                        handlePanelSizeChange(panel.id, sizes[index]);
                      }
                    }
                  }}
                  onDelete={() => handleDeletePanel(panel.id)}
                >
                  {renderPanelContent(panel)}
                </SortablePanel>
              ))}
            </SortableContext>
          </section>
        )}

        {/* 内容区域 */}
        {contentPanels.length > 0 && (
          <section className="contentGrid">
            <SortableContext items={contentPanels.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {contentPanels.map((panel) => (
                <SortablePanel
                  key={panel.id}
                  id={panel.id}
                  size={panel.size}
                  editMode={editMode}
                  onEdit={() => {
                    const newTitle = prompt(`编辑面板标题`, panel.title);
                    if (newTitle && newTitle !== panel.title) {
                      handlePanelTitleChange(panel.id, newTitle);
                    }
                  }}
                  onEditSubtitle={() => {
                    const newSubtitle = prompt(`编辑面板描述`, panel.subtitle);
                    if (newSubtitle && newSubtitle !== panel.subtitle) {
                      handlePanelSubtitleChange(panel.id, newSubtitle);
                    }
                  }}
                  onEditSize={() => {
                    const sizes = ['small', 'medium', 'large', 'full'];
                    const currentIndex = sizes.indexOf(panel.size || 'medium');
                    const sizeLabels = { small: '小', medium: '中', large: '大', full: '全宽' };
                    const options = sizes.map((s, i) => `${i + 1}. ${sizeLabels[s]} (${s})`).join('\n');
                    const choice = prompt(`选择面板大小：\n${options}\n\n当前: ${sizeLabels[panel.size || 'medium']}`, String(currentIndex + 1));
                    if (choice) {
                      const index = parseInt(choice) - 1;
                      if (index >= 0 && index < sizes.length) {
                        handlePanelSizeChange(panel.id, sizes[index]);
                      }
                    }
                  }}
                  onDelete={() => handleDeletePanel(panel.id)}
                >
                  {renderPanelContent(panel)}
                </SortablePanel>
              ))}
            </SortableContext>
          </section>
        )}

        {/* 其他面板（如Lark预览） */}
        <SortableContext items={otherPanels.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {otherPanels.map((panel) => (
            <SortablePanel
              key={panel.id}
              id={panel.id}
              size={panel.size}
              editMode={editMode}
              onEdit={() => {
                const newTitle = prompt(`编辑面板标题`, panel.title);
                if (newTitle && newTitle !== panel.title) {
                  handlePanelTitleChange(panel.id, newTitle);
                }
              }}
              onEditSubtitle={() => {
                const newSubtitle = prompt(`编辑面板描述`, panel.subtitle);
                if (newSubtitle && newSubtitle !== panel.subtitle) {
                  handlePanelSubtitleChange(panel.id, newSubtitle);
                }
              }}
              onEditSize={() => {
                const sizes = ['small', 'medium', 'large', 'full'];
                const currentIndex = sizes.indexOf(panel.size || 'full');
                const sizeLabels = { small: '小', medium: '中', large: '大', full: '全宽' };
                const options = sizes.map((s, i) => `${i + 1}. ${sizeLabels[s]} (${s})`).join('\n');
                const choice = prompt(`选择面板大小：\n${options}\n\n当前: ${sizeLabels[panel.size || 'full']}`, String(currentIndex + 1));
                if (choice) {
                  const index = parseInt(choice) - 1;
                  if (index >= 0 && index < sizes.length) {
                    handlePanelSizeChange(panel.id, sizes[index]);
                  }
                }
              }}
              onDelete={() => handleDeletePanel(panel.id)}
            >
              {renderPanelContent(panel)}
            </SortablePanel>
          ))}
        </SortableContext>
      </DndContext>

      <section className="techGrid">
        <div className="card tech">
          <Activity />
          <b>Pipeline</b>
          <p>Listener → Dedup → AI analysis → PostgreSQL → Push Center</p>
        </div>
        <div className="card tech">
          <Database />
          <b>Storage</b>
          <p>PostgreSQL + Redis + OpenSearch ready for MVP integration.</p>
        </div>
        <div className="card tech">
          <Send />
          <b>Push Center</b>
          <p>Lark, in-app notifications, quiet hours and channel routing.</p>
        </div>
      </section>
    </>
  );
}

function App() {
  const [active, setActive] = useState('Dashboard');

  const nav = [
    ['Dashboard', LayoutDashboard],
    ['Intelligence', Rss],
    ['Channels', Bot],
    ['Reports', FileText],
    ['Web Monitor', Globe2],
    ['Settings', Settings]
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">V</div>
          <div>
            <b>Vantage Intel</b>
            <span>Competitor Monitor</span>
          </div>
        </div>

        <nav>
          {nav.map(([n, I]) => (
            <button key={n} onClick={() => setActive(n)} className={active === n ? 'nav active' : 'nav'}>
              <I size={18} />
              {n}
            </button>
          ))}
        </nav>

        <div className="sideNote">
          <Sparkles size={18} />
          <b>AI Analysis</b>
          <p>分类、摘要、优先级评分与推送建议已启用。</p>
        </div>
      </aside>

      <div className="main">
        {active === 'Dashboard' && <Dashboard />}
        {active === 'Channels' && <ChannelsPage />}
        {active === 'Reports' && <ReportsPage />}
        {active !== 'Dashboard' && active !== 'Channels' && active !== 'Reports' && <Placeholder active={active} />}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);