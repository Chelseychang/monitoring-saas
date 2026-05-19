# Telegram SaaS Demo V4 - Lark Buttons

基于 V3 Demo 升级：Lark 推送卡片加入两个跳转按钮：

1. 打开监控平台
2. 打开对应信息源（Telegram source）

同时保留站内消息中心。

## 运行前端 Demo

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:5173
```

此时如果没有启动 Push Server，点击推送会生成 Lark JSON 预览，不会真的发送。

## 配置真实 Lark Webhook Bot

复制环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/xxxxxxxx
LARK_BOT_SECRET=
MONITORING_PLATFORM_URL=http://localhost:5173
PUSH_SERVER_PORT=8787
VITE_PUSH_API_URL=http://localhost:8787
```

如果你的 Lark Bot 开启了签名校验，把 `LARK_BOT_SECRET` 填上。

## 同时启动前端和 Lark Push Server

```bash
npm run dev:all
```

然后在 Demo 里点击：

```text
Details -> 推送到 Lark 卡片
```

Lark 群里会收到 interactive card，卡片包含：

- 标签
- 时间
- 分类
- AI Score
- 打开监控平台按钮
- 打开对应信息源按钮

## 单独启动 Push Server

```bash
npm run dev:push
```

健康检查：

```text
http://localhost:8787/health
```

## 注意

Lark / Feishu 自定义机器人支持通过消息卡片按钮跳转 URL，但不支持在点击按钮后回调服务器处理业务逻辑；如需点击回调，需要升级为自建 Lark App。


## V5 Lark Button Fix

如果 Lark 卡片没有显示按钮，通常是以下原因之一：

1. `MONITORING_PLATFORM_URL` 使用了 `http://localhost:5173`。Lark 客户端无法访问本机地址，建议改成 Vercel、内网可访问域名、ngrok 或 Cloudflare Tunnel 的 HTTPS 地址。
2. 没有重启 Push Server。修改 `.env` 后需要重新运行 `npm run dev:all`。
3. 旧版本 payload 被浏览器缓存或旧 server.js 仍在运行。

V5 已对按钮做了兼容增强：

- button 同时带 `url` 和 `multi_url`
- card 顶部也带 `card_link`
- note 区域加入 Markdown 链接作为兜底

推荐配置：

```env
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/xxxx
LARK_BOT_SECRET=
MONITORING_PLATFORM_URL=https://your-public-monitoring-domain.com
VITE_PLATFORM_URL=https://your-public-monitoring-domain.com
VITE_PUSH_API_URL=http://localhost:8787
```
