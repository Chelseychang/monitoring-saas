# 🎯 Telegram SaaS 监控平台

多源金融情报监控系统 - 自动爬取 Telegram 频道和金融网站，智能分析并推送到飞书。

![Dashboard](https://img.shields.io/badge/Dashboard-Customizable-blue)
![Channels](https://img.shields.io/badge/Channels-Dynamic-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

---

## ✨ 核心功能

### 🎨 Dashboard 可定制化
- ✅ 拖拽调整面板顺序
- ✅ 编辑标题和描述
- ✅ 调整面板大小（4 种尺寸）
- ✅ 删除/恢复面板
- ✅ 配置自动保存到 localStorage

### 📡 Channels 动态管理
- ✅ 添加/编辑/删除 Telegram 频道
- ✅ 添加/编辑/删除网站爬虫
- ✅ **智能 Selector 分析**（5 种检测策略）
- ✅ 测试连接状态
- ✅ 启用/禁用开关
- ✅ 配置持久化到 SQLite

### 🤖 智能分析
- 🎯 自动识别网站结构
- 📊 提供 5 种候选 Selector
- 👀 实时预览抓取结果
- ⚡ 5 秒完成分析

### 🔔 实时监控
- 📱 Telegram 频道监听（每 5 分钟）
- 🌐 TradingView 新闻爬取（每 10 分钟）
- 🔍 AI 智能分析和评分
- 📤 飞书自动推送（≥70 分）

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.template .env
# 编辑 .env，填入飞书 Webhook URL 和 Secret

# 3. 启动后端服务
node server.js

# 4. 启动前端开发服务器（新终端）
npm run dev

# 5. 访问
# 前端：http://localhost:5173
# 后端：http://localhost:8787
```

### 生产部署

**推荐：Railway 一键部署**

详见 → **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

```bash
# 1. 推送到 GitHub
git push origin main

# 2. Railway 自动检测并部署
# 3. 配置环境变量（Railway Dashboard）
# 4. 访问生成的 URL
```

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| **[QUICK_START.md](QUICK_START.md)** | 5 分钟快速上手 |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 完整部署指南 |
| **[CSS_SELECTOR_GUIDE.md](CSS_SELECTOR_GUIDE.md)** | CSS Selector 使用指南 |
| **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** | API 接口文档 |

---

## 🛠️ 技术栈

### 前端
- **React** - UI 框架
- **Vite** - 构建工具
- **Recharts** - 图表库
- **@dnd-kit** - 拖拽功能
- **Lucide React** - 图标库

### 后端
- **Node.js** - 运行时
- **Express** - Web 框架
- **SQLite (sql.js)** - 数据库
- **Cheerio** - HTML 解析
- **node-cron** - 定时任务

### 部署
- **Railway** - 应用托管
- **GitHub** - 代码仓库
- **Lark/飞书** - 消息推送

---

## 🔒 环境变量

### 必需

```bash
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR_WEBHOOK
LARK_BOT_SECRET=your_secret_from_lark_dashboard
```

### 可选

```bash
PORT=8787
PUSH_MIN_SCORE=70
ENABLE_AUDIT_LOG=true
DB_PATH=./data/intelligence.db
NODE_ENV=production
```

---

## 📈 功能规划

### ✅ 已完成
- [x] Dashboard 完全可定制化
- [x] Channels 动态管理
- [x] 智能 Selector 分析
- [x] 数据持久化到 SQLite
- [x] CORS 完整支持

### 🚧 开发中
- [ ] 多源数据统计（阶段 3）
- [ ] Reports 智能分析（阶段 4）
- [ ] 批量操作
- [ ] 频道分组

---

## 📄 许可证

MIT License

---

**最后更新**: 2026-06-27  
**版本**: v1.0.0 (Stage 1 & 2)  
**状态**: ✅ Production Ready
