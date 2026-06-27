# Railway 持久化存储配置

## ⚠️ 问题说明

Railway 默认情况下，每次部署重启后容器文件系统会重置，导致 SQLite 数据库丢失。

**症状：**
- Lark 重复推送相同消息
- `seen_messages` 表每次重启后为空
- 去重机制失效

## ✅ 解决方案：挂载 Railway Volume

### 步骤 1：创建 Volume

1. 登录 Railway 控制台
2. 进入你的项目 → 选择 `web` 服务
3. 点击 **Settings** → **Volumes**
4. 点击 **+ New Volume**
5. 配置：
   - **Mount Path**: `/app/data`
   - **Name**: `sqlite-data`
6. 点击 **Add**

### 步骤 2：重新部署

创建 Volume 后，Railway 会自动重新部署服务。

### 步骤 3：验证

访问 `/health` 端点，检查数据库状态：

```bash
curl https://your-app.railway.app/health
```

应该看到：
```json
{
  "ok": true,
  "service": "telegram-monitoring-api",
  "webhookConfigured": true,
  ...
}
```

## 📊 数据持久化范围

挂载 `/app/data` 后，以下数据将持久化：

- ✅ `data/intelligence.db` - SQLite 数据库
- ✅ `seen_messages` 表 - 去重记录
- ✅ `push_log` 表 - 推送日志
- ✅ `ai_decision_log` 表 - AI 决策日志
- ✅ `telegram_channels` 表 - 频道配置
- ✅ `web_crawlers` 表 - 爬虫配置

## 🔍 故障排查

### 问题：Volume 挂载后仍然重复推送

**检查 1：确认 Volume 已挂载**
```bash
# 在 Railway Shell 中执行
ls -la /app/data
```

应该看到 `intelligence.db` 文件。

**检查 2：确认数据库有去重记录**
```bash
# 在 Railway Shell 中执行
sqlite3 /app/data/intelligence.db "SELECT COUNT(*) FROM seen_messages;"
```

应该 > 0。

**检查 3：确认只有 1 个实例运行**

在 `railway.json` 中已设置 `numReplicas: 1`，确保只有一个服务实例。

### 问题：Volume 空间不足

Railway Free Plan 提供 1GB Volume 空间。如果需要更多：

1. 在 Settings → Volumes 中查看使用量
2. 定期清理旧数据（数据保留策略）
3. 或升级到 Pro Plan

## 🚀 替代方案：使用云数据库

如果不想使用 Volume，可以迁移到云数据库：

### 方案 A：Railway Postgres（推荐）

1. 在项目中添加 Postgres 数据库服务
2. 修改 `database.js` 使用 `pg` 替代 `sql.js`
3. 设置环境变量 `DATABASE_URL`

### 方案 B：外部数据库

支持的云数据库：
- [Supabase](https://supabase.com) - Postgres（免费 500MB）
- [PlanetScale](https://planetscale.com) - MySQL（免费 5GB）
- [Turso](https://turso.tech) - SQLite（免费 500MB）

## 📝 当前配置

```json
{
  "deploy": {
    "numReplicas": 1  // 强制单实例运行
  }
}
```

这确保了：
- ✅ 只有一个服务实例访问数据库
- ✅ 避免多实例并发写入冲突
- ✅ 去重机制可靠工作

---

## 参考文档

- [Railway Volumes 官方文档](https://docs.railway.app/reference/volumes)
- [Railway Databases](https://docs.railway.app/databases/postgresql)
