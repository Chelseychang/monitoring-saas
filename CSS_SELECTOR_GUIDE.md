# CSS Selector 使用指南

## 📖 什么是 CSS Selector？

CSS Selector 是用于定位 HTML 元素的选择器语法，告诉爬虫"去哪里找内容"。

---

## 🎯 基础语法

### 1. Class 选择器（最常用）
```css
.news-item
```
匹配：`<div class="news-item">...</div>`

### 2. ID 选择器
```css
#main-content
```
匹配：`<div id="main-content">...</div>`

### 3. 标签选择器
```css
article
```
匹配：所有 `<article>` 标签

### 4. 属性选择器
```css
[data-type="news"]
```
匹配：`<div data-type="news">...</div>`

### 5. 组合选择器
```css
.news-list > .item
```
匹配：`.news-list` 下的直接 `.item` 子元素

---

## 🔧 如何获取 Selector？

### 方法 1：浏览器开发者工具（推荐）

**步骤**：
1. 打开目标网站（如 https://naga.com/...）
2. 右键点击新闻标题 → **"检查"**（或按 F12）
3. 在 Elements/元素 面板中，右键高亮的 HTML 元素
4. 选择 **"Copy"** → **"Copy selector"**
5. 粘贴到表单中

**示例**：
```
复制结果：
#root > div > main > div.news-list > article:nth-child(1)

简化为：
article
或
.news-list > article
```

### 方法 2：查看源代码

按 `Ctrl+U`（Mac: `Cmd+Option+U`）查看网页源代码，找到新闻列表的结构：

```html
<!-- 示例网站结构 -->
<div class="news-container">
  <article class="news-card">
    <h2>新闻标题 1</h2>
    <p>新闻摘要...</p>
  </article>
  <article class="news-card">
    <h2>新闻标题 2</h2>
    <p>新闻摘要...</p>
  </article>
</div>
```

**对应 Selector**：
```css
.news-card
或
article.news-card
或
.news-container > article
```

---

## 🧪 测试工具

使用项目提供的测试脚本验证 Selector：

```bash
node test-selector.js <URL> <Selector>

# 示例
node test-selector.js "https://example.com/news" "article"
node test-selector.js "https://example.com/news" ".news-item"
```

**输出**：
```
✅ 找到 15 个匹配元素

📄 匹配元素预览：

1. 美联储加息预期升温
   市场普遍预计美联储将在下次会议上加息 25 个基点...

2. 欧元兑美元走势分析
   欧元近期持续走弱，分析师认为...
```

---

## 🌐 常见网站类型

### 1. 静态网站（WordPress、传统 CMS）

**特征**：查看源代码能看到完整 HTML

**示例**：
```html
<div class="post-list">
  <article class="post">...</article>
  <article class="post">...</article>
</div>
```

**Selector**：
```
article.post
或
.post
```

### 2. 动态渲染网站（React、Vue、Next.js）

**特征**：查看源代码只看到 `<div id="root"></div>`

**示例网站**：
- Naga (https://naga.com) - Next.js
- Medium - React
- Twitter/X - React

**问题**：内容通过 JavaScript 动态加载，简单爬虫抓不到

**解决方案**：
1. **留空 Selector** - 让爬虫解析所有链接
2. **使用 API** - 找到网站的数据接口
3. **使用浏览器自动化**（未来功能）

---

## 📝 配置示例

### 示例 1：TechCrunch
```json
{
  "name": "TechCrunch",
  "url": "https://techcrunch.com",
  "crawler_type": "generic",
  "selector": "article"
}
```

### 示例 2：WordPress 博客
```json
{
  "name": "Example Blog",
  "url": "https://blog.example.com",
  "crawler_type": "generic",
  "selector": ".post-item"
}
```

### 示例 3：留空自动识别
```json
{
  "name": "Dynamic Site",
  "url": "https://example.com/news",
  "crawler_type": "generic",
  "selector": ""
}
```
**适用场景**：
- 动态渲染网站
- 不确定 Selector
- 让爬虫自动提取所有链接

---

## ⚠️ 常见问题

### Q1: 为什么我的 Selector 匹配 0 个元素？

**可能原因**：
1. **网站使用动态渲染** - 内容通过 JS 加载
   - 解决：留空 Selector
2. **Selector 拼写错误** - 多了空格或符号
   - 解决：使用浏览器"Copy selector"功能
3. **Class 名动态生成** - 如 `class="sc-a1b2c3d4"`
   - 解决：使用标签选择器（`article`）

### Q2: 匹配了太多元素（100+）？

**可能原因**：Selector 太宽泛

**解决**：
```css
/* 太宽泛 */
a

/* 更精确 */
.news-list > a
或
article a
```

### Q3: 网站结构经常变化怎么办？

**建议**：使用语义化标签，更稳定
```css
/* 推荐：语义化标签 */
article
section
main

/* 不推荐：动态 class */
.sc-a1b2c3d4-0
```

---

## 🎓 进阶技巧

### 1. 部分匹配
```css
/* 匹配 class 包含 "news" 的元素 */
[class*="news"]

/* 匹配 href 包含 "/news/" 的链接 */
a[href*="/news/"]
```

### 2. 排除元素
```css
/* 排除广告 */
article:not(.ad)
```

### 3. 多个选择器
```css
/* 匹配任意一个 */
article, .news-item, .post
```

---

## 🚀 实战案例

### 案例 1：Naga News

**URL**: https://naga.com/en/news-and-analysis/categories/forecast/page/1

**问题**：Next.js 动态渲染，查看源代码无内容

**解决方案**：
```json
{
  "name": "Naga News",
  "url": "https://naga.com/en/news-and-analysis/categories/forecast/page/1",
  "crawler_type": "generic",
  "selector": ""  // 留空，让爬虫自动解析
}
```

### 案例 2：TradingView

**URL**: https://www.tradingview.com/news/

**特点**：已内置专用爬虫

**配置**：
```json
{
  "name": "TradingView News",
  "url": "https://www.tradingview.com/news/",
  "crawler_type": "tradingview",  // 使用专用类型
  "selector": null  // 不需要
}
```

---

## 📊 Selector 复杂度对比

| Selector | 复杂度 | 稳定性 | 适用场景 |
|----------|--------|--------|----------|
| `article` | ⭐ | ⭐⭐⭐⭐ | 语义化网站 |
| `.news-item` | ⭐⭐ | ⭐⭐⭐ | 传统 CMS |
| `#main > .list > .item` | ⭐⭐⭐ | ⭐⭐ | 精确控制 |
| `[class*="dynamic"]` | ⭐⭐⭐⭐ | ⭐ | 动态 class |
| 留空 | ⭐ | ⭐⭐⭐⭐⭐ | 动态渲染 |

---

## ✅ 最佳实践

### 推荐做法
✅ 使用语义化标签（`article`, `section`）  
✅ 使用稳定的 class 名（`.post`, `.news-item`）  
✅ 使用测试工具验证  
✅ 不确定时留空  

### 避免做法
❌ 使用动态生成的 class（`.sc-a1b2c3d4`）  
❌ 过度复杂的嵌套（`#a > .b > .c > .d`）  
❌ 不测试直接上线  
❌ 依赖 `:nth-child()`（易变）  

---

## 🛠️ 调试技巧

### 1. 逐步简化
```css
/* 从复杂开始 */
#root > div.container > main > section.news > article.post

/* 逐步简化 */
section.news > article.post
.news > .post
article.post
article

/* 找到最简且有效的 */
article ✅
```

### 2. 浏览器控制台测试
```javascript
// 打开网站，按 F12，在 Console 输入：
document.querySelectorAll('article').length
// 输出：15  ← 找到 15 个元素

document.querySelectorAll('.news-item').length
// 输出：0   ← 没有匹配
```

### 3. 检查是否动态渲染
```javascript
// 查看源代码（Ctrl+U）
// 如果看到：
<div id="root"></div>  // ← 动态渲染
<div id="__next"></div>  // ← Next.js

// 而不是完整 HTML，说明内容动态加载
// 建议：留空 Selector
```

---

## 📚 参考资源

- [MDN CSS Selectors](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Selectors)
- [W3Schools CSS Selector Reference](https://www.w3schools.com/cssref/css_selectors.php)
- [CSS Selector Cheat Sheet](https://www.w3schools.com/cssref/css_selectors.asp)

---

## 🤝 需要帮助？

如果不确定某个网站的 Selector，可以：

1. 使用测试工具：
   ```bash
   node test-selector.js <URL> <Selector>
   ```

2. 留空让爬虫自动识别

3. 查看网站源代码（按 `Ctrl+U`）

4. 在浏览器中使用"Copy selector"功能

---

**最后更新**: 2026-06-27  
**版本**: 1.0
