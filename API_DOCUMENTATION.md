# Telegram Monitoring API 文档

## P1 功能：数据脱敏 + 审计日志 + 数据分析

---

## 🔒 安全功能

### 数据脱敏 (Data Masking)

**功能**：自动脱敏推送内容中的敏感信息

**支持的脱敏模式**：
- ✅ 邮箱地址 → `[EMAIL_REDACTED]`
- ✅ 电话号码 → `[PHONE_REDACTED]`
- ✅ 加密货币钱包地址 → `[WALLET_REDACTED]`
- ✅ 信用卡号 → `[CARD_REDACTED]`
- ✅ IP地址 → `[IP_REDACTED]` (有白名单)
- ✅ 中国身份证号 → `[ID_REDACTED]`
- ✅ URL (非白名单域名) → `https://[DOMAIN_REDACTED]`

**配置**：
```bash
ENABLE_DATA_MASKING=true  # 启用脱敏
```

### 审计日志 (Audit Log)

**功能**：记录所有关键操作到SQLite数据库

**记录内容**：
- 推送日志 (push_log)
- AI决策日志 (ai_decision_log)
- 错误日志 (error_log)
- 数据脱敏日志 (masking_log)
- 去重记录 (seen_messages)

**配置**：
```bash
ENABLE_AUDIT_LOG=true     # 启用审计日志
DB_PATH=./data/intelligence.db  # 数据库路径
```

---

## 📊 数据分析 API

### 1. 获取原始分析数据

```
GET /api/analytics/raw?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**响应示例**：
```json
{
  "ok": true,
  "data": {
    "summary": {
      "total_pushes": 1234,
      "successful_pushes": 1200,
      "failed_pushes": 34,
      "avg_score": 78.5,
      "unique_brands": 25,
      "unique_categories": 8
    },
    "byBrand": [...],
    "byCategory": [...],
    "byHour": [...],
    "aiDecisions": [...],
    "masking": { "total_masked": 1234 },
    "errors": [...]
  }
}
```

### 2. 日报 (Daily Report)

```
GET /api/analytics/daily?date=YYYY-MM-DD
```

**响应示例**：
```json
{
  "ok": true,
  "report": {
    "title": "情报监控日报 - 2024-06-27",
    "period": { "date": "2024-06-27" },
    "overview": {
      "totalPushes": 150,
      "successRate": "98.7%",
      "avgScore": "82.3",
      "uniqueBrands": 12,
      "uniqueCategories": 5
    },
    "topBrands": [
      {
        "rank": 1,
        "brand": "Binance",
        "count": 45,
        "avgScore": "85.2",
        "successRate": "100%"
      }
    ],
    "categoryDistribution": [...],
    "hourlyActivity": [...],
    "aiDecisions": {...},
    "dataSecurity": { "maskedItems": 150 },
    "errors": { "total": 2, "breakdown": [...] }
  }
}
```

### 3. 周报 (Weekly Report)

```
GET /api/analytics/weekly?weekOffset=0
```

- `weekOffset=0`: 本周
- `weekOffset=1`: 上周
- `weekOffset=2`: 上上周

**响应示例**：
```json
{
  "ok": true,
  "report": {
    "title": "情报监控周报",
    "period": {
      "start": "2024-06-24",
      "end": "2024-06-30"
    },
    "overview": {
      "totalPushes": 980,
      "dailyAverage": "140.0",
      "successRate": "99.2%",
      "avgScore": "81.5"
    },
    "topBrands": [...],
    "categoryDistribution": [...],
    "aiDecisions": [...]
  }
}
```

### 4. 趋势分析 (Trend Report)

```
GET /api/analytics/trend?days=7
```

**响应示例**：
```json
{
  "ok": true,
  "report": {
    "title": "7天趋势分析",
    "period": {
      "days": 7,
      "start": "2024-06-21",
      "end": "2024-06-27"
    },
    "dailyData": [
      {
        "date": "2024-06-21",
        "totalPushes": 120,
        "avgScore": 79.5,
        "successRate": 98.3
      },
      ...
    ],
    "trends": {
      "pushVolume": "increasing",
      "avgScore": "stable",
      "successRate": "stable"
    }
  }
}
```

### 5. 品牌对比分析 (Brand Comparison)

```
POST /api/analytics/brand-comparison
Content-Type: application/json

{
  "brands": ["Binance", "OKX", "Exness"],
  "days": 30
}
```

**响应示例**：
```json
{
  "ok": true,
  "report": {
    "title": "品牌对比分析",
    "period": { "days": 30, ... },
    "brands": [
      {
        "brand": "Binance",
        "totalPushes": 450,
        "avgScore": "85.2",
        "successRate": "99.5%",
        "dailyAverage": "15.0"
      },
      ...
    ]
  }
}
```

### 6. 分类热力图 (Category Heatmap)

```
GET /api/analytics/category-heatmap?days=30
```

**响应示例**：
```json
{
  "ok": true,
  "report": {
    "title": "分类热力图",
    "period": { "days": 30 },
    "categories": [
      {
        "name": "AI / Platform",
        "count": 345,
        "intensity": 1.0,
        "avgScore": "88.5"
      },
      {
        "name": "Broker News",
        "count": 289,
        "intensity": 0.84,
        "avgScore": "82.1"
      }
    ]
  }
}
```

### 7. 合规审计报告 (Compliance Report)

```
GET /api/analytics/compliance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**响应示例**：
```json
{
  "ok": true,
  "report": {
    "title": "安全合规审计报告",
    "period": { "startDate": "2024-06-01", "endDate": "2024-06-27" },
    "compliance": {
      "totalOperations": 3500,
      "dataMasking": {
        "enabled": true,
        "maskedOperations": 3500,
        "coverageRate": "100%"
      },
      "auditLog": {
        "enabled": true,
        "recordedOperations": 3500
      },
      "errorRate": "0.97%"
    },
    "errors": {
      "total": 34,
      "breakdown": [
        { "error_type": "lark_timeout", "count": 20 },
        { "error_type": "network_error", "count": 14 }
      ],
      "criticalErrors": []
    },
    "recommendations": [
      {
        "level": "success",
        "message": "系统运行良好，合规指标健康"
      }
    ]
  }
}
```

### 8. 导出CSV

```
GET /api/analytics/export/csv?type=daily&date=YYYY-MM-DD
GET /api/analytics/export/csv?type=trend&days=7
```

**参数**：
- `type`: `daily` 或 `trend`
- `date`: 日期 (type=daily时)
- `days`: 天数 (type=trend时)

**响应**：CSV文件下载

---

## 🛠️ 管理员 API

### 9. 数据清理 (Cleanup)

```
POST /api/admin/cleanup
Content-Type: application/json

{
  "retentionDays": 90
}
```

**功能**：删除超过N天的旧记录

**响应示例**：
```json
{
  "ok": true,
  "deleted": 1250,
  "message": "Cleaned up 1250 records older than 90 days"
}
```

### 10. 获取脱敏配置

```
GET /api/config/masking
```

**响应示例**：
```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "patterns": [
      { "name": "email", "description": "Email addresses", "enabled": true },
      { "name": "phone", "description": "Phone numbers", "enabled": true },
      { "name": "crypto_wallet", "description": "Crypto wallet addresses", "enabled": true }
    ]
  }
}
```

---

## 🔍 健康检查

```
GET /health
```

**响应示例**：
```json
{
  "ok": true,
  "service": "telegram-monitoring-api",
  "webhookConfigured": true,
  "platformUrl": "https://your-domain.com",
  "telegramCronEnabled": true,
  "p1Features": {
    "dataMasking": true,
    "auditLog": true
  }
}
```

---

## 📈 使用示例

### JavaScript/Node.js

```javascript
// 获取日报
const response = await fetch('http://localhost:8787/api/analytics/daily');
const { report } = await response.json();
console.log(report.overview.totalPushes);

// 品牌对比
const comparison = await fetch('http://localhost:8787/api/analytics/brand-comparison', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brands: ['Binance', 'OKX'],
    days: 30
  })
});
const result = await comparison.json();
```

### cURL

```bash
# 获取今日日报
curl http://localhost:8787/api/analytics/daily

# 获取7天趋势
curl "http://localhost:8787/api/analytics/trend?days=7"

# 导出CSV
curl "http://localhost:8787/api/analytics/export/csv?type=daily" -o report.csv

# 数据清理
curl -X POST http://localhost:8787/api/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"retentionDays": 90}'
```

---

## 🎯 数据分析模版特性

### ✅ 已实现

1. **日报模版**：每日情报总结
2. **周报模版**：7天汇总分析
3. **趋势分析**：时间序列变化
4. **品牌对比**：多品牌横向对比
5. **分类热力图**：分类分布可视化
6. **合规审计**：安全合规状态报告
7. **CSV导出**：数据导出功能

### 📊 推荐可视化工具

- **前端**: Recharts (已安装)
- **BI工具**: Metabase, Superset
- **数据分析**: Excel, Python pandas
- **SQLite查看器**: DB Browser for SQLite

---

## 🚀 下一步建议

1. **前端集成**：创建React分析仪表板
2. **自动报告**：定时生成PDF报告并发送邮件
3. **告警系统**：异常指标实时告警
4. **多维度分析**：时间段对比、同环比分析
5. **用户权限**：管理员API添加认证

---

## 💡 快速开始

```bash
# 1. 启动服务
npm run dev:all

# 2. 测试P1功能
node testP1Features.js

# 3. 查看今日报告
curl http://localhost:8787/api/analytics/daily | jq .

# 4. 访问数据库
sqlite3 data/intelligence.db
> SELECT * FROM push_log LIMIT 5;
```
