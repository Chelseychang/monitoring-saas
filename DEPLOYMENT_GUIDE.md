# 部署指南

## 🚀 快速部署

本项目已配置好 Railway 自动部署，推送到 GitHub 即可自动上线。

---

## 📋 部署前检查清单

### 1. 本地测试通过
- [ ] `npm run build` 构建成功
- [ ] `node server.js` 后端启动正常
- [ ] 前端访问 `http://localhost:5173` 正常
- [ ] Dashboard 数据展示正常
- [ ] Channels 管理功能正常
- [ ] Telegram 爬虫测试成功
- [ ] Lark 推送测试成功

### 2. 环境变量准备
```bash
# 必需环境变量
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR_WEBHOOK
LARK_BOT_SECRET=YOUR_SECRET

# 可选环境变量
PORT=8787
PUSH_MIN_SCORE=70
ENABLE_AUDIT_LOG=true
DB_PATH=./data/intelligence.db
```

### 3. 代码提交
```bash
git add .
git commit -m "feat: production ready deployment"
git push origin main
```

---

## 🌐 部署方案

### 方案 1：Railway（推荐 - 已配置）

**优点**：
- ✅ 零配置自动部署
- ✅ 免费额度（$5/月）
- ✅ 自动 HTTPS
- ✅ 环境变量管理
- ✅ 日志查看

**步骤**：

#### 1. 创建 Railway 项目
访问 https://railway.app

```bash
# 登录 Railway CLI（可选）
npm install -g @railway/cli
railway login

# 或直接在网页操作
```

#### 2. 连接 GitHub 仓库
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权并选择 `telegram-saas-prod-demo` 仓库
4. Railway 自动检测 `package.json` 并开始构建

#### 3. 配置环境变量
在 Railway 项目设置中添加：

```
Variables → Add Variable

LARK_WEBHOOK_URL = https://open.larksuite.com/open-apis/bot/v2/hook/...
LARK_BOT_SECRET = your_secret_here
PORT = 8787
NODE_ENV = production
```

#### 4. 配置前端 API 地址
在 Railway 部署完成后，复制生成的域名（如 `https://your-app.railway.app`）

更新前端环境变量：

创建 `.env.production` 文件：
```bash
VITE_API_URL=https://your-app.railway.app
```

重新提交代码：
```bash
git add .env.production
git commit -m "feat: configure production API"
git push origin main
```

#### 5. 验证部署
- 访问 `https://your-app.railway.app`
- 检查 Dashboard 是否正常显示
- 手动触发爬虫：`POST https://your-app.railway.app/api/telegram/refresh`

---

### 方案 2：Vercel（前端） + Railway（后端）

**适用场景**：前后端分离部署

#### 前端部署到 Vercel

1. 访问 https://vercel.com
2. Import Git Repository
3. 选择 `telegram-saas-prod-demo` 仓库
4. 配置构建设置：
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
5. 添加环境变量：
   ```
   VITE_API_URL = https://your-backend.railway.app
   ```
6. 点击 Deploy

#### 后端部署到 Railway

与方案 1 相同，但需要配置 CORS：

更新 `server.js`：
```javascript
const allowedOrigins = [
  'https://your-app.vercel.app',  // 添加 Vercel 域名
  'http://localhost:5173'
];
```

---

### 方案 3：Docker 容器部署

**适用场景**：自有服务器或云平台

#### 创建 Dockerfile

已提供 `Dockerfile`：
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# 构建前端
RUN npm run build

EXPOSE 8787

CMD ["node", "server.js"]
```

#### 构建并运行

```bash
# 构建镜像
docker build -t telegram-saas .

# 运行容器
docker run -d \
  -p 8787:8787 \
  -e LARK_WEBHOOK_URL=https://... \
  -e LARK_BOT_SECRET=your_secret \
  -v $(pwd)/data:/app/data \
  --name telegram-saas \
  telegram-saas

# 查看日志
docker logs -f telegram-saas
```

#### Docker Compose

创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8787:8787"
    environment:
      - LARK_WEBHOOK_URL=${LARK_WEBHOOK_URL}
      - LARK_BOT_SECRET=${LARK_BOT_SECRET}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

---

## 🔒 生产环境安全检查

### 1. 密钥管理
- [ ] LARK_BOT_SECRET 不在代码中
- [ ] `.env` 文件已加入 `.gitignore`
- [ ] Railway/Vercel 环境变量已配置
- [ ] 生产环境使用 Secret 类型存储密钥

### 2. CORS 配置
更新 `server.js` 的 CORS 白名单：
```javascript
const allowedOrigins = [
  'https://your-production-domain.com',
  'https://your-app.railway.app',
  'https://your-app.vercel.app',
  'http://localhost:5173'  // 开发环境保留
];
```

### 3. 数据库持久化
Railway 默认提供持久化存储，确保：
```javascript
// database.js 中
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'intelligence.db');
```

Railway 会自动持久化 `data/` 目录。

### 4. 日志管理
生产环境使用结构化日志：
```bash
# 安装 pino（可选）
npm install pino

# 或使用现有的 console.log
# Railway 自动收集并展示日志
```

---

## 📊 部署后验证

### 1. 健康检查
```bash
curl https://your-app.railway.app/health
# 期望返回：{"ok":true,"timestamp":"..."}
```

### 2. API 测试
```bash
# 测试获取频道列表
curl https://your-app.railway.app/api/admin/channels/telegram

# 测试手动爬取
curl -X POST https://your-app.railway.app/api/telegram/refresh
```

### 3. 前端访问
- 访问 `https://your-app.railway.app`
- 检查 Dashboard 数据加载
- 点击 Channels → 查看频道列表
- 测试添加/编辑/删除频道

### 4. Cron 任务验证
```bash
# 查看 Railway 日志
railway logs

# 期望每 5 分钟看到：
# [Cron] Refreshing Telegram channels...
# [Telegram] Fetched 25 messages from 5 channels
```

---

## 🔄 CI/CD 自动化

### GitHub Actions（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js 20
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 配置 Railway Token
1. Railway Dashboard → Project Settings → Tokens
2. Generate New Token
3. 复制 Token
4. GitHub 仓库 → Settings → Secrets → New secret
5. Name: `RAILWAY_TOKEN`, Value: 粘贴 Token

---

## 🐛 常见问题

### Q1: 部署后 API 404？

**原因**：前端 API 地址配置错误

**解决**：
```bash
# 检查 .env.production
VITE_API_URL=https://your-app.railway.app  # 确保正确

# 重新构建前端
npm run build
git add dist .env.production
git commit -m "fix: update API URL"
git push
```

### Q2: Cron 任务不执行？

**原因**：Railway 免费计划可能有限制

**解决**：
```bash
# 方案 1：使用外部 Cron 服务（如 cron-job.org）
# 定时访问：https://your-app.railway.app/api/telegram/refresh

# 方案 2：升级 Railway 付费计划
```

### Q3: 数据库数据丢失？

**原因**：SQLite 文件未持久化

**解决**：
```bash
# 确保 DB_PATH 在持久化目录
export DB_PATH=/app/data/intelligence.db

# Railway 配置 Volume（如果需要）
```

### Q4: CORS 错误？

**原因**：前端域名未加入白名单

**解决**：
```javascript
// server.js
const allowedOrigins = [
  'https://your-vercel-app.vercel.app',  // 添加前端域名
  // ...
];
```

---

## 📈 监控和维护

### 1. 日志监控
```bash
# Railway CLI
railway logs --tail 100

# 或在 Railway Dashboard 查看
```

### 2. 性能监控
使用 Railway 内置的 Metrics：
- CPU 使用率
- 内存使用率
- 请求延迟
- 错误率

### 3. 数据库备份
```bash
# 定期备份 SQLite 数据库
railway run "cp data/intelligence.db data/backup-$(date +%Y%m%d).db"
```

### 4. 更新部署
```bash
# 本地开发完成后
git add .
git commit -m "feat: new feature"
git push origin main

# Railway 自动检测并重新部署
```

---

## 💰 成本估算

### Railway 免费计划
- ✅ 免费额度：$5/月
- ✅ 执行时间：500小时/月
- ✅ 适合场景：中小型监控（<10万请求/月）

**预估成本**：
- 后端服务：24/7 运行，约 $3-5/月
- 数据库：SQLite 本地存储，免费
- **总计**：免费计划足够

### Railway Pro 计划（如需升级）
- 💵 $20/月起
- ✅ 无限执行时间
- ✅ 更高性能
- ✅ 优先支持

---

## 🎯 部署成功标准

- [ ] 前端可访问（Dashboard 正常显示）
- [ ] 后端 API 响应正常
- [ ] Channels 管理功能正常
- [ ] Cron 任务定时执行
- [ ] Lark 推送成功
- [ ] 数据持久化（重启后数据不丢失）
- [ ] 日志可查看
- [ ] HTTPS 正常

---

## 📚 相关资源

- [Railway 文档](https://docs.railway.app)
- [Vercel 文档](https://vercel.com/docs)
- [Docker 文档](https://docs.docker.com)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🆘 需要帮助？

1. **Railway 部署问题**：
   - 查看 Railway 日志
   - 检查环境变量配置
   - 确认端口配置（PORT=8787）

2. **API 连接问题**：
   - 检查 CORS 配置
   - 确认前端 API_BASE 地址
   - 测试 `/health` 端点

3. **Cron 任务问题**：
   - 检查 `cronJobs.js` 配置
   - 查看 Railway 日志确认执行
   - 手动触发测试

---

**最后更新**: 2026-06-27  
**部署平台**: Railway  
**预估成本**: 免费（Railway 免费计划）
