# 藏汉英互译在线网页

这是一个可部署到 Vercel 的 Next.js 应用，用于在线完成藏文、中文、英文互译。前端只调用本项目后端接口，OpenAI API Key 只从服务端环境变量读取，不会暴露到浏览器。

## 功能

- 输入藏文、中文、英文并自动识别输入语言
- 一键翻译成藏文、中文或英文
- 服务端 `/api/translate` 使用 OpenAI Responses API
- 服务端 `/api/tts` 使用 OpenAI Text-to-Speech API 返回音频
- 翻译结果复制与朗读
- loading、错误提示、空输入提示
- 手机端和电脑端自适应

## 本地开发

安装依赖：

```bash
npm install
```

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

```bash
OPENAI_API_KEY=your_api_key_here
```

启动开发环境：

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

## 构建

```bash
npm run build
```

生产模式启动：

```bash
npm run start
```

代码检查：

```bash
npm run lint
```

## Vercel 部署

1. 将代码推送到 GitHub、GitLab 或 Bitbucket。
2. 在 Vercel 创建新项目，并选择该仓库。
3. Framework Preset 选择 `Next.js`。
4. Build Command 使用默认值 `npm run build`。
5. 在 Vercel 项目设置中打开 `Settings` -> `Environment Variables`。
6. 添加环境变量：

```text
OPENAI_API_KEY=your_api_key_here
```

7. 保存后重新部署项目。

## Netlify 部署

Netlify 会自动识别 Next.js，并把 `/api/translate`、`/api/tts` 部署为服务端函数。项目已经包含 `netlify.toml`：

```toml
[build]
command = "npm run build"
publish = ".next"
```

部署后在 Netlify 后台添加环境变量：

1. 打开站点 `Site configuration`。
2. 进入 `Environment variables`。
3. 添加变量名：

```text
OPENAI_API_KEY
```

4. 变量值只填写 OpenAI API Key 本身，例如 `sk-proj-...`。不要填写 `Bearer sk-proj-...`，不要填写 Netlify token、GitHub token 或 ChatGPT 登录 token。
5. 变量 context 选择 `Production`，如果你在 Deploy Preview 测试，也要给 `Deploy Preview` 添加同一个变量。
6. 保存后必须重新部署一次。

## API

### POST `/api/translate`

请求：

```json
{
  "text": "你好",
  "targetLanguage": "Tibetan"
}
```

`targetLanguage` 支持：

- `Tibetan`
- `Chinese`
- `English`

响应：

```json
{
  "translation": "..."
}
```

### POST `/api/tts`

请求：

```json
{
  "text": "你好",
  "language": "Chinese"
}
```

`language` 支持：

- `Tibetan`
- `Chinese`
- `English`

响应为 `audio/mpeg` 音频流。
