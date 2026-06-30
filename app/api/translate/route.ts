import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `你是一名专业的藏文、中文、英文翻译。请将用户输入内容准确翻译成目标语言。
要求：
- 如果目标语言是中文，输出简体中文。
- 如果目标语言是英文，输出自然准确的英文。
- 如果目标语言是藏文，输出标准藏文。
- 保留佛教、藏文化、人名、地名、法本名词的准确性。
- 不要添加解释。
- 只输出译文。`;

type TranslateRequest = {
  text?: unknown;
  targetLanguage?: unknown;
};

function isSupportedTargetLanguage(language: string) {
  return ["Tibetan", "Chinese", "English"].includes(language);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务器未配置 OPENAI_API_KEY。" },
      { status: 500 }
    );
  }

  let body: TranslateRequest;

  try {
    body = (await request.json()) as TranslateRequest;
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const targetLanguage =
    typeof body.targetLanguage === "string" ? body.targetLanguage.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "请输入需要翻译的内容。" }, { status: 400 });
  }

  if (!isSupportedTargetLanguage(targetLanguage)) {
    return NextResponse.json({ error: "目标语言不受支持。" }, { status: 400 });
  }

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: SYSTEM_PROMPT,
        input: `目标语言：${targetLanguage}\n\n用户输入：\n${text}`,
        temperature: 0.2
      })
    });

    const data = (await openAIResponse.json()) as {
      output_text?: string;
      error?: { message?: string };
      output?: Array<{
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      }>;
    };

    if (!openAIResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenAI 翻译请求失败。" },
        { status: openAIResponse.status }
      );
    }

    const translation =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .map((content) => content.text || "")
        .join("")
        .trim();

    if (!translation) {
      return NextResponse.json({ error: "未收到有效译文。" }, { status: 502 });
    }

    return NextResponse.json({ translation });
  } catch {
    return NextResponse.json({ error: "服务器请求 OpenAI 失败。" }, { status: 502 });
  }
}
