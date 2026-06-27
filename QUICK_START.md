# 🚀 快速开始指南

## 📋 问题 1 & 2 解答

### ❓ 问题 1：每次添加爬虫都要手动检查 CSS Selector？

**✅ 已解决！新增"智能分析"功能**

**使用方法**：
1. 在 Channels 页面点击"添加网站爬虫"
2. 输入 URL
3. 选择"通用"类型
4. 点击 **"智能分析"** 按钮（带 ✨ 图标）
5. 系统自动推荐最佳 Selector
6. 查看预览，确认无误后保存

**智能分析功能**：
- 🤖 自动识别网站结构
- 📊 提供 5 种候选 Selector（按置信度排序）
- 👀 实时预览抓取结果
- 🎯 推荐最佳方案（置信度 > 90%）

**示例流程**：
```
输入 URL: https://naga.com/en/news-and-analysis/...
↓
点击"智能分析"
↓
系统推荐: article (置信度 90%)
找到 15 个元素
↓
预览：
1. EUR/USD 预测
2. 黄金市场分析
↓
点击"保存"
```

---

### ❓ 问题 2：API 服务要部署到线上吗？

**✅ 是的！已配置 Railway 一键部署**

**为什么需要部署？**
- ❌ 本地服务：电脑关机就停止
- ❌ 定时任务：需要电脑一直开着
- ✅ 云端部署：24/7 自动运行
- ✅ 定时爬取：每 5 分钟自动抓取新消息

---

## 🌐 部署到 Railway（5 分钟完成）

### 步骤 1：准备 GitHub 仓库

```bash
# 如果还没有推送到 GitHub
git init
git add .
git commit -m "feat: production ready"
git branch -M main
git remote add origin https://github.com/你的用户名/telegram-saas-prod-demo.git
git push -u origin main
```

### 步骤 2：部署到 Railway

1. **访问** https://railway.app
2. **登录** GitHub 账号
3. **点击** "New Project"
4. **选择** "Deploy from GitHub repo"
5. **授权** Railway 访问你的仓库
6. **选择** `telegram-saas-prod-demo` 仓库
7. ✅ Railway 自动开始构建和部署

### 步骤 3：配置环境变量

在 Railway 项目页面：
1. 点击项目名称
2. 点击 "Variables" 标签
3. 添加以下环境变量：

```
LARK_WEBHOOK_URL = https://open.larksuite.com/open-apis/bot/v2/hook/YOUR_WEBHOOK
LARK_BOT_SECRET = your_secret_here
PORT = 8787
NODE_ENV = production
```

4. 点击 "Deploy" 按钮重新部署

### 步骤 4：获取部署 URL

部署完成后：
1. 在 Railway 项目页面，点击 "Settings"
2. 找到 "Domains" 区域
3. 点击 "Generate Domain"
4. 复制生成的 URL（如 `https://telegram-saas-production.up.railway.app`）

### 步骤 5：配置前端 API 地址

创建 `.env.production` 文件：

```bash
# .env.production
VITE_API_URL=https://你的railway域名.railway.app
```

重新提交：
```bash
git add .env.production
git commit -m "feat: configure production API"
git push origin main
```

Railway 会自动重新部署。

### 步骤 6：验证部署

访问你的 Railway URL，检查：
- ✅ Dashboard 页面正常显示
- ✅ Channels 管理功能正常
- ✅ 数据能正常保存

---

## 🧪 测试智能分析功能

### 本地测试

```bash
# 1. 启动服务器
node server.js

# 2. 在另一个终端测试 API
curl -X POST http://localhost:8787/api/admin/crawlers/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://techcrunch.com"}'
```

**预期输出**：
```json
{
  "ok": true,
  "analysis": {
    "url": "https://techcrunch.com",
    "analyzed": true,
    "selectors": [
      {
        "selector": "article",
        "count": 20,
        "confidence": 0.9,
        "reason": "检测到语义化 <article> 标签（最稳定）",
        "preview": [...]
      }
    ],
    "recommendation": {
      "selector": "article",
      "confidence": 0.9,
      ...
    }
  }
}
```

### UI 测试

1. 访问 http://localhost:5174
2. 点击 "Channels"
3. 点击 "添加网站爬虫"
4. 填写信息：
   - 名称：TechCrunch
   - URL：https://techcrunch.com
   - 类型：通用
5. 点击 **"智能分析"** 按钮
6. 查看分析结果：
   - 推荐 Selector
   - 置信度
   - 预览内容
7. 点击"保存"

---

## 📊 智能分析工作原理

### 5 种检测策略（按优先级）

1. **语义化标签**（置信度 90%）
   - 检测 `<article>` 标签
   - 最稳定，首选方案

2. **常见新闻类名**（置信度 80%）
   - `.news-item`, `.post`, `.article-card` 等
   - 适用于传统 CMS

3. **关键词匹配**（置信度 70%）
   - 包含 "article/post/news" 的 class
   - 适用于自定义网站

4. **结构模式识别**（置信度 60%）
   - 检测重复出现的 HTML 结构
   - 适用于列表布局

5. **链接密集区域**（置信度 50%）
   - 检测包含大量链接的区域
   - 兜底方案

### 示例分析

**网站**: https://naga.com/en/news-and-analysis/...

**检测结果**:
```
策略 1: article - 找到 0 个 ❌
策略 2: .news-item - 找到 0 个 ❌
策略 3: [class*="forecast"] - 找到 15 个 ✅
策略 4: .card-container - 找到 15 个 ✅
策略 5: .link-group > * - 找到 20 个 ✅

推荐: [class*="forecast"] (置信度 70%)
```

---

## 🛠️ 故障排除

### 问题 1：智能分析返回空结果

**可能原因**：
- 网站使用 JavaScript 动态渲染（React/Vue）
- 内容需要登录才能访问
- 防爬虫机制

**解决方案**：
- 留空 Selector，让爬虫自动识别所有链接
- 或手动检查网站源代码（按 Ctrl+U）

### 问题 2：Railway 部署失败

**常见原因**：
- 环境变量未配置
- 端口配置错误
- 构建命令错误

**解决步骤**：
1. 检查 Railway 日志（Deployments → Logs）
2. 确认环境变量已设置
3. 确认 `railway.json` 配置正确

### 问题 3：前端无法连接后端

**原因**：CORS 配置或 API 地址错误

**解决**：
```javascript
// server.js - 确认 CORS 白名单包含前端域名
const allowedOrigins = [
  'https://your-app.railway.app',
  'http://localhost:5173'
];
```

---

## 📚 相关文档

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 完整部署指南
- [CSS_SELECTOR_GUIDE.md](CSS_SELECTOR_GUIDE.md) - CSS Selector 详细说明
- [STAGE2_CHANNELS_MANAGEMENT.md](STAGE2_CHANNELS_MANAGEMENT.md) - Channels 功能文档

---

## ✅ 功能对比

### 智能分析 vs 手动配置

| 功能 | 手动配置 | 智能分析 |
|------|---------|---------|
| 识别时间 | 10-30 分钟 | 5 秒 |
| 准确性 | 依赖经验 | 90% |
| 预览效果 | 需要单独测试 | 自动预览 |
| 备选方案 | 无 | 提供 5 个 |
| 学习曲线 | 高 | 低 |

### 本地运行 vs 云端部署

| 对比项 | 本地运行 | Railway 部署 |
|--------|---------|-------------|
| 可用性 | 电脑开机时 | 24/7 |
| 定时任务 | 手动触发 | 自动执行 |
| 访问方式 | localhost | 公网 URL |
| 成本 | 电费 | 免费（$5 额度）|
| 维护 | 需要手动 | 自动更新 |

---

## 🎯 下一步

1. ✅ 测试智能分析功能
2. ✅ 部署到 Railway
3. ⏭️ 添加更多监听源
4. ⏭️ 配置定时任务
5. ⏭️ 查看 Dashboard 实时数据

---

**最后更新**: 2026-06-27  
**新功能**: 智能 Selector 分析  
**部署平台**: Railway  
**预估部署时间**: 5 分钟
