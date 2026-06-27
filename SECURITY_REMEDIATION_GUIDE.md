# 安全修复操作指南

本文档提供P0阶段剩余手动步骤的详细操作说明。

---

## 📋 待完成步骤清单

- [ ] 步骤1: 轮换Lark Bot密钥
- [ ] 步骤2: 在Railway设置新密钥
- [ ] 步骤3: 验证新密钥工作正常
- [ ] 步骤4: （可选）清理Git历史

---

## 🔄 步骤1: 轮换Lark Bot密钥

### 1.1 登录Lark开放平台

打开浏览器访问：
```
https://open.larksuite.com
```

### 1.2 找到你的Bot应用

1. 在控制台中找到 "telegram-saas-monitoring-bot"（或你的Bot名称）
2. 点击进入应用详情页

### 1.3 重新生成Secret

1. 点击左侧菜单 **"凭证与基础信息"** 或 **"Security Settings"**
2. 找到 **"Signing Secret"** 或 **"Verification Token"** 部分
3. 点击 **"重新生成"** 或 **"Regenerate"** 按钮
4. 确认操作
5. **立即复制新生成的Secret**（只显示一次）

### 1.4 保存新密钥

将新密钥临时保存到安全的地方（如密码管理器），格式示例：
```
新的LARK_BOT_SECRET: AbCdEf123456XyZ...
```

⚠️ **重要**: 
- 旧密钥（`jjoUi22cPeJ2eholSpRVBg`）现在已经失效
- 不要将新密钥提交到任何代码仓库

---

## 🚀 步骤2: 在Railway设置新密钥

### 2.1 登录Railway

打开浏览器访问：
```
https://railway.app
```

### 2.2 找到你的项目

1. 在Dashboard中找到 "telegram-saas-prod-demo"（或你的项目名称）
2. 点击进入项目

### 2.3 设置环境变量

1. 点击项目卡片进入详情页
2. 点击顶部标签 **"Variables"**
3. 找到或添加以下环境变量：

#### 方式A：编辑现有变量
如果 `LARK_BOT_SECRET` 已存在：
- 点击变量右侧的 **"..."** 菜单
- 选择 **"Edit"**
- 粘贴新的密钥值
- 点击 **"Update"**

#### 方式B：添加新变量
如果变量不存在：
- 点击 **"+ New Variable"**
- Variable Name: `LARK_BOT_SECRET`
- Variable Value: 粘贴新密钥
- 确保勾选 **"Is Secret"**（会在UI中掩码显示）
- 点击 **"Add"**

### 2.4 设置其他必要的环境变量

同样在Variables页面，确保以下变量已设置：

```
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR_ACTUAL_WEBHOOK_ID
MONITORING_PLATFORM_URL=https://your-vercel-app.vercel.app
ENABLE_DATA_MASKING=true
ENABLE_AUDIT_LOG=true
```

### 2.5 启用日志脱敏（推荐）

在Railway项目设置中：
1. 点击 **"Settings"** 标签
2. 找到 **"Logs"** 部分
3. 启用 **"Redact Secrets in Logs"**（如果可用）

### 2.6 触发重新部署

1. 保存环境变量后，Railway会自动触发重新部署
2. 等待部署完成（通常1-3分钟）
3. 在 **"Deployments"** 标签中查看部署状态

---

## ✅ 步骤3: 验证新密钥工作正常

### 3.1 等待部署完成

在Railway的 **"Deployments"** 页面，确认最新部署状态为 **"Success"**。

### 3.2 检查应用日志

1. 在Railway项目中点击 **"Logs"** 标签
2. 查看最新日志，确认：
   - 应用成功启动
   - 没有密钥相关的错误
   - 确认密钥在日志中被掩码（显示为 `[REDACTED]` 或 `***`）

### 3.3 测试Lark推送

#### 方式A：通过API测试
```bash
# 替换为你的Railway应用URL
RAILWAY_URL="https://your-app.railway.app"

curl -X POST "$RAILWAY_URL/api/lark/push" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "brand": "Test",
    "title": "Security Fix Test",
    "summary": "Testing new secret after rotation",
    "category": "System",
    "score": 85,
    "level": "High",
    "time": "2024-01-01 12:00:00",
    "tags": ["test", "security"],
    "sourceUrl": "https://example.com"
  }'
```

#### 方式B：通过前端测试
1. 访问你的前端应用（Vercel部署的URL）
2. 点击 "刷新Telegram频道" 或手动推送测试消息
3. 检查Lark群聊是否收到消息

### 3.4 预期结果

✅ **成功标志**:
- HTTP响应状态 200
- Railway日志显示 "Lark push successful"
- Lark群聊收到测试消息卡片
- 消息卡片包含两个按钮（"打开监控平台" 和 "打开对应信息源"）

❌ **失败标志**:
- HTTP响应状态 401/403 (认证失败)
- Railway日志显示 "signature verification failed"
- Lark群聊未收到消息

### 3.5 失败排查

如果验证失败，检查以下内容：

1. **密钥是否正确复制**
   - 没有多余的空格或换行符
   - 大小写正确

2. **Lark Bot是否启用了签名验证**
   - 如果未启用，将 `LARK_BOT_SECRET` 留空
   - 在Lark开放平台检查 "Security Settings"

3. **Webhook URL是否正确**
   - 在Railway中检查 `LARK_WEBHOOK_URL`
   - 在Lark开放平台复制正确的webhook URL

---

## 🧹 步骤4: （可选）清理Git历史

⚠️ **警告**: 此步骤会重写Git历史，需要团队协调。

### 4.0 前置条件检查

**首先检查是否需要此步骤**:

```bash
# 检查是否配置了远程仓库
git remote -v
```

**如果输出为空**: 
- 说明仓库仅在本地，**不需要**执行步骤4
- 跳过本节，直接进入"完成后的验证清单"

**如果有输出** (例如 `origin https://github.com/...`):
- 说明仓库已连接到远程
- 继续执行下面的步骤

### 4.1 何时需要清理Git历史

只有在以下情况下才需要执行：
- 代码仓库**已推送**到远程（GitHub/GitLab等）
- 代码仓库是公开的或将要公开
- 需要符合安全合规审计要求
- 担心历史提交中的密钥被滥用

如果仓库一直是私有的，且只有受信任的团队成员访问，也可以考虑跳过此步骤。

### 4.2 执行清理前的准备

1. **通知所有团队成员**
   - 告知即将重写Git历史
   - 要求暂停推送新代码

2. **创建备份**
   ```bash
   cd /Users/chelsey.chang/Desktop/telegram-saas-prod-demo
   git branch backup-$(date +%Y%m%d) main
   ```

3. **安装git-filter-repo**
   ```bash
   # macOS
   brew install git-filter-repo
   
   # 或使用pip
   pip3 install git-filter-repo
   ```

### 4.3 执行清理脚本

```bash
cd /Users/chelsey.chang/Desktop/telegram-saas-prod-demo
./scripts/clean-git-history.sh
```

脚本会：
- 提示确认操作
- 创建备份分支 `backup-before-cleanup`
- 从历史中移除所有 `.env` 文件
- 替换已知的泄露密钥为占位符
- 重写所有提交

### 4.4 验证清理结果

```bash
# 检查历史中是否还有泄露的密钥
git log -p --all | grep -i "jjoUi22cPeJ2eholSpRVBg"
# 应该返回0个结果

git log -p --all | grep -i "LARK_BOT_SECRET"
# 如果有结果，应该只显示 "SECRET_REMOVED" 或环境变量引用
```

### 4.5 配置远程仓库（如果尚未配置）

如果你还没有配置远程仓库：

```bash
# 添加远程仓库（根据实际情况修改URL）
git remote add origin https://github.com/YOUR_USERNAME/telegram-saas-prod-demo.git

# 或使用SSH
git remote add origin git@github.com:YOUR_USERNAME/telegram-saas-prod-demo.git

# 验证
git remote -v
```

### 4.6 强制推送到远程仓库

⚠️ **最后检查**: 确认所有团队成员已被通知

```bash
# 强制推送所有分支
git push origin --force --all

# 强制推送所有标签
git push origin --force --tags
```

### 4.7 团队成员重新克隆

所有团队成员需要：

1. **备份本地未推送的工作**
   ```bash
   git stash
   # 或提交到临时分支
   ```

2. **删除旧仓库**
   ```bash
   cd /path/to/telegram-saas-prod-demo
   cd ..
   rm -rf telegram-saas-prod-demo
   ```

3. **重新克隆**
   ```bash
   git clone <repository-url>
   cd telegram-saas-prod-demo
   ```

4. **恢复本地工作**
   ```bash
   # 如果使用了stash
   git stash pop
   ```

---

## 📊 完成后的验证清单

完成所有步骤后，运行以下命令验证：

```bash
cd /Users/chelsey.chang/Desktop/telegram-saas-prod-demo

# 1. 运行安全检查脚本
./scripts/verify-security.sh

# 2. 检查Git历史（如果执行了步骤4）
git log --oneline --all | head -n 20

# 3. 检查当前的环境变量配置
cat .env
# 应该显示空值或占位符

# 4. 测试应用启动
npm run dev:push
# 应该在localhost:8787成功启动
```

---

## 🆘 故障排查

### 问题1: Railway部署失败

**症状**: 保存环境变量后，部署失败

**可能原因**:
- 密钥格式错误
- 缺少必要的环境变量

**解决方案**:
1. 检查Railway的 "Deploy Logs"
2. 确认所有必要的环境变量都已设置
3. 重新部署: 在Deployments页面点击 "Redeploy"

### 问题2: Lark推送返回401错误

**症状**: API调用返回 `{"StatusCode":401}`

**可能原因**:
- 新密钥未生效
- 密钥复制错误
- Webhook URL错误

**解决方案**:
1. 在Railway中重新检查 `LARK_BOT_SECRET` 值
2. 在Lark开放平台重新复制密钥
3. 确认Webhook URL没有多余的空格

### 问题3: Pre-commit hook不工作

**症状**: 能够提交包含密钥的文件

**可能原因**:
- Hook文件没有执行权限
- Git hooks被禁用

**解决方案**:
```bash
# 添加执行权限
chmod +x .git/hooks/pre-commit

# 测试hook
./.git/hooks/pre-commit

# 如果使用了 --no-verify，移除该标志
git commit -m "test"  # 不要用 --no-verify
```

---

## 📞 需要帮助？

如果在执行过程中遇到问题，可以：

1. 查看Railway应用日志获取详细错误信息
2. 查看Lark开放平台的调试日志
3. 运行 `./scripts/verify-security.sh` 查看具体失败项
4. 检查 `.git/hooks/pre-commit` 是否可执行

---

## ✅ 完成确认

完成所有步骤后，你应该：

- [x] Lark Bot使用新的Secret
- [x] Railway环境变量已更新
- [x] 测试推送成功
- [x] 本地 .env 文件无硬编码密钥
- [x] Git历史已清理（如果执行了步骤4）
- [x] 安全检查脚本全部通过

**完成后，就可以继续进行 P1（数据脱敏和审计日志）的实施了！**
