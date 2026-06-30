import { NextResponse } from "next/server";
import { getOpenAIAPIKey } from "@/lib/openai";

export const runtime = "nodejs";

type TtsRequest = {
  text?: unknown;
  language?: unknown;
};

function isSupportedLanguage(language: string) {
  return ["Tibetan", "Chinese", "English"].includes(language);
}

export async function POST(request: Request) {
  const apiKey = getOpenAIAPIKey();

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务器未配置 OPENAI_API_KEY。" },
      { status: 500 }
    );
  }

  let body: TtsRequest;

  try {
    body = (await request.json()) as TtsRequest;
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const language = typeof body.language === "string" ? body.language.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "请输入需要朗读的内容。" }, { status: 400 });
  }

  if (!isSupportedLanguage(language)) {
    return NextResponse.json({ error: "朗读语言不受支持。" }, { status: 400 });
  }

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input: text,
        response_format: "mp3"
      })
    });

    if (!openAIResponse.ok) {
      const errorData = (await openAIResponse.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      return NextResponse.json(
        { error: errorData?.error?.message || "OpenAI 朗读请求失败。" },
        { status: openAIResponse.status }
      );
    }

    const audio = await openAIResponse.arrayBuffer();

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "服务器请求 OpenAI 失败。" }, { status: 502 });
  }
}
