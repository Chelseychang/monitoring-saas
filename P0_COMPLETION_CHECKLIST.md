# P0 完成清单

## 📋 快速操作清单

请按顺序完成以下步骤，完成后打勾 ✅

---

### 第一部分：轮换Lark密钥（预计5分钟）

- [ ] 1. 打开 https://open.larksuite.com
- [ ] 2. 进入Bot应用详情页
- [ ] 3. 找到 "Security Settings" 或 "凭证与基础信息"
- [ ] 4. 点击 "重新生成Secret"
- [ ] 5. **立即复制新密钥**（只显示一次）
- [ ] 6. 将新密钥保存到密码管理器（临时）

**新密钥（填写后删除此行）**: `_______________________`

---

### 第二部分：配置Railway环境变量（预计5分钟）

- [ ] 1. 打开 https://railway.app
- [ ] 2. 进入项目 "telegram-saas-prod-demo"
- [ ] 3. 点击 "Variables" 标签
- [ ] 4. 编辑或添加 `LARK_BOT_SECRET`
- [ ] 5. 粘贴新密钥（步骤1中获取的）
- [ ] 6. 确保勾选 "Is Secret"
- [ ] 7. 保存并等待自动部署（1-3分钟）

**其他必需的环境变量**:
- [ ] `LARK_WEBHOOK_URL` - webhook地址
- [ ] `MONITORING_PLATFORM_URL` - 前端URL
- [ ] `ENABLE_DATA_MASKING=true`
- [ ] `ENABLE_AUDIT_LOG=true`

---

### 第三部分：验证新密钥（预计3分钟）

- [ ] 1. 等待Railway部署完成（状态显示"Success"）
- [ ] 2. 检查Railway日志，确认无错误
- [ ] 3. 运行测试推送：

```bash
# 在终端执行（替换YOUR_RAILWAY_URL）
curl -X POST "https://YOUR_RAILWAY_URL/api/lark/push" \
  -H "Content-Type: application/json" \
  -d '{"brand":"Test","title":"密钥轮换测试","summary":"P0修复验证","score":80,"level":"High"}'
```

- [ ] 4. 确认Lark群聊收到测试消息
- [ ] 5. 确认Railway日志中密钥被掩码显示

**测试结果**: 
- [ ] ✅ 成功 - 收到消息
- [ ] ❌ 失败 - 查看 SECURITY_REMEDIATION_GUIDE.md 的故障排查部分

---

### 第四部分：本地安全验证（预计2分钟）

在项目目录运行：

```bash
cd /Users/chelsey.chang/Desktop/telegram-saas-prod-demo

# 运行安全检查
./scripts/verify-security.sh
```

- [ ] 所有检查项通过（0 Errors, 0 Warnings）

---

### （可选）第五部分：清理Git历史

⚠️ **仅在以下情况需要执行**:
- 仓库已推送到远程（GitHub/GitLab等）
- 仓库将要公开
- 合规审计要求

⚠️ **如果仓库仅在本地，可以跳过此步骤**

- [ ] 0. **前置条件**: 确认已配置远程仓库 (`git remote -v` 有输出)
- [ ] 1. 通知团队成员即将重写历史
- [ ] 2. 安装 git-filter-repo: `brew install git-filter-repo`
- [ ] 3. 运行清理脚本: `./scripts/clean-git-history.sh`
- [ ] 4. 验证: `git log -p --all | grep -i "jjoUi22cPeJ2eholSpRVBg"` 返回0结果
- [ ] 5. 强制推送: `git push origin --force --all` （需要先配置origin）
- [ ] 6. 通知团队重新克隆仓库

---

## ✅ 完成确认

当所有必需步骤完成后：

- [ ] Lark Bot已使用新密钥
- [ ] Railway环境变量已更新
- [ ] 测试推送成功
- [ ] 安全检查脚本通过
- [ ] 已删除本清单中临时记录的密钥

---

## 📄 相关文档

- 详细操作步骤: `SECURITY_REMEDIATION_GUIDE.md`
- 安全验证脚本: `scripts/verify-security.sh`
- Git历史清理: `scripts/clean-git-history.sh`

---

## 🎯 下一步

完成P0后，可以继续：

**P1 - 数据脱敏和审计日志**（预计2周）
- 实现敏感数据掩码（邮箱、电话、钱包地址）
- 建立SQLite审计日志系统
- 记录所有AI决策和推送操作

准备好后，告诉Claude继续实施P1！

---

**完成日期**: ___________
**操作人**: ___________
**验证人**: ___________
