# 玄学前沿期刊群 - 部署指南

## Cloudflare 资源配置

部署前需要在 Cloudflare Dashboard 创建以下资源：

### 1. 创建 D1 数据库

```bash
wrangler d1 create journal-db
```

将返回的 `database_id` 填入 `wrangler.json` 的 `d1_databases[0].database_id`。

初始化数据库：
```bash
wrangler d1 execute journal-db --file=./migrations/001_initial.sql
wrangler d1 execute journal-db --file=./migrations/002_seed_editorial_board.sql
wrangler d1 execute journal-db --file=./migrations/003_fix_editorial_board.sql
wrangler d1 execute journal-db --file=./migrations/004_auth_fallback_tables.sql
wrangler d1 execute journal-db --file=./migrations/005_user_roles.sql
wrangler d1 execute journal-db --file=./migrations/006_board_application_orcid.sql
wrangler d1 execute journal-db --file=./migrations/007_password_reset_tokens.sql
```

### 2. 创建 R2 存储桶

```bash
wrangler r2 bucket create journal-manuscripts
```

### 3. 创建 KV 命名空间

```bash
wrangler kv namespace create SESSIONS_KV
```

将返回的 `id` 填入 `wrangler.json` 的 `kv_namespaces[0].id`。

### 4. 更新 wrangler.json

将上述 ID 填入 `wrangler.json`：

```json
{
  "d1_databases": [
    {
      "database_id": "YOUR_D1_DATABASE_ID"
    }
  ],
  "kv_namespaces": [
    {
      "id": "YOUR_KV_NAMESPACE_ID"
    }
  ],
  "vars": {
    "EMAIL_FROM": "noreply@rubbishpublishing.org",
    "SITE_NAME": "玄学前沿期刊群",
    "SITE_URL": "https://rubbishpublishing.org",
    "ORCID_CLIENT_ID": "YOUR_ORCID_CLIENT_ID",
    "ORCID_CLIENT_SECRET": "YOUR_ORCID_CLIENT_SECRET"
  }
}
```

### 5. 配置邮件发送（Cloudflare 自动 + MailChannels）

对于已验证域名 `rubbishpublishing.org`，可直接使用 `noreply@rubbishpublishing.org` 发信。
系统会优先使用 `RESEND_API_KEY`（若已配置），否则自动回退到 MailChannels。

在 Cloudflare DNS 中建议保留 SPF 记录（若不存在请添加）：
```
v=spf1 include:relay.mailchannels.net ~all
```

### 6. 部署

```bash
npm run build
wrangler deploy
```

或通过 Cloudflare Pages 部署（推荐）：
- 连接 GitHub 仓库
- 构建命令：`npm run build`
- 输出目录：`dist`

## 本地开发

```bash
npm install
npm run dev
```

注意：本地开发时 KV/D1/R2 通过 `platformProxy` 模拟，无法发送真实邮件。
验证码功能在本地开发时使用固定码 `123456`。

## 功能说明

### 用户角色
- **作者**：投递稿件、跟踪审稿状态、提交修改稿
- **编辑**：管理期刊稿件、分配审稿人、做出录用决定、发布文章
- **审稿人**：查看分配稿件、提交审稿意见

### 稿件流程
1. 作者投递 → R2 存储
2. 编辑初审（可直接拒稿）→ 分配审稿人
3. 审稿人下载稿件 → 提交审稿意见（PDF + 文字）
4. 编辑综合意见 → 接受/修改/拒稿 → 邮件通知作者
5. 修改循环直至接受
6. 编辑上传终稿（可选）→ 正式发布

### 数据库结构
见 `migrations/001_initial.sql`
