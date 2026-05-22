# AI 产品经理思维训练器

一个面向 AI 产品经理能力训练的响应式 Web MVP，支持选择题快练、案例深训、AI 评分、面试官追问、参考答案和成长记录。

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量：

```bash
cp .env.example .env.local
```

3. 配置 Supabase：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. 配置默认 AI Provider：

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

当前实现使用 OpenAI-compatible Chat Completions 接口，因此可以配置 DeepSeek：

```dotenv
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=你的 DeepSeek API Key
AI_MODEL=deepseek-v4-flash
```

也可以使用 `deepseek-v4-pro` 等 DeepSeek 当前可用模型；不要把 `AI_BASE_URL` 写成模型页或控制台地址。

5. 应用数据库迁移：

```bash
supabase db push
```

6. 启动开发服务：

```bash
npm run dev
```

## Vercel 部署

在 Vercel Project Settings 中配置与 `.env.example` 对应的环境变量。Supabase Auth 的 Site URL 和 Redirect URLs 需要加入 Vercel 部署域名。

## 验证

```bash
npm run typecheck
npm run test
npm run build
```
