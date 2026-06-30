"use client";

import { useMemo, useRef, useState } from "react";

type Language = "tibetan" | "chinese" | "english";

const languageLabels: Record<Language, string> = {
  tibetan: "藏文",
  chinese: "中文",
  english: "英文"
};

const languageNames: Record<Language, string> = {
  tibetan: "Tibetan",
  chinese: "Chinese",
  english: "English"
};

const targetButtons: Array<{ language: Language; label: string }> = [
  { language: "tibetan", label: "翻译成藏文" },
  { language: "chinese", label: "翻译成中文" },
  { language: "english", label: "翻译成英文" }
];

function detectInputLanguage(text: string) {
  if (/[\u0f00-\u0fff]/.test(text)) {
    return "藏文";
  }

  if (/[\u3400-\u9fff]/.test(text)) {
    return "中文";
  }

  if (/[A-Za-z]/.test(text)) {
    return "英文";
  }

  return "自动识别";
}

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState<Language | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [lastTarget, setLastTarget] = useState<Language>("chinese");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const inputLanguage = useMemo(() => detectInputLanguage(text), [text]);

  async function translate(targetLanguage: Language) {
    const trimmed = text.trim();
    setCopied(false);
    setError("");

    if (!trimmed) {
      setResult("");
      setError("请输入需要翻译的内容。");
      return;
    }

    setLoadingTarget(targetLanguage);
    setLastTarget(targetLanguage);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: trimmed,
          targetLanguage: languageNames[targetLanguage]
        })
      });

      const data = (await response.json()) as { translation?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "翻译失败，请稍后再试。");
      }

      setResult(data.translation?.trim() || "");
    } catch (translationError) {
      setResult("");
      setError(
        translationError instanceof Error
          ? translationError.message
          : "翻译失败，请稍后再试。"
      );
    } finally {
      setLoadingTarget(null);
    }
  }

  async function copyResult() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function speakResult() {
    if (!result.trim()) {
      setError("请先完成翻译，再播放朗读。");
      return;
    }

    setSpeaking(true);
    setError("");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: result.trim(),
          language: languageNames[lastTarget]
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "朗读生成失败，请稍后再试。");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setSpeaking(false);
        setError("音频播放失败，请重试。");
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (speechError) {
      setSpeaking(false);
      setError(speechError instanceof Error ? speechError.message : "朗读生成失败，请稍后再试。");
    }
  }

  const isBusy = loadingTarget !== null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-stone-300/70 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#9a4d2f] uppercase">
            Tibetan Chinese English
          </p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">
            藏汉英互译在线网页
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-stone-600 sm:text-right">
          面向藏文文化、学习与交流场景，支持自动识别输入语言、互译、复制与朗读。
        </p>
      </header>

      <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[28rem] flex-col rounded-lg border border-stone-300/80 bg-white/78 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="source-text" className="text-base font-semibold text-stone-950">
              输入内容
            </label>
            <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-sm text-stone-600">
              已识别：{inputLanguage}
            </span>
          </div>

          <textarea
            id="source-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="请输入藏文、中文或英文..."
            className="min-h-72 flex-1 resize-none rounded-md border border-stone-300 bg-white p-4 text-lg leading-8 text-stone-950 outline-none transition focus:border-[#a9472a] focus:ring-4 focus:ring-[#a9472a]/15"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {targetButtons.map((button) => (
              <button
                key={button.language}
                type="button"
                onClick={() => translate(button.language)}
                disabled={isBusy}
                className="min-h-12 rounded-md bg-[#8f3f2b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#743321] disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {loadingTarget === button.language ? "翻译中..." : button.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-[28rem] flex-col rounded-lg border border-stone-300/80 bg-[#1f2933] p-4 text-white shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">翻译结果</h2>
              <p className="mt-1 text-sm text-stone-300">目标语言：{languageLabels[lastTarget]}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyResult}
                disabled={!result}
                className="min-h-10 rounded-md border border-white/20 px-3 py-2 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {copied ? "已复制" : "复制"}
              </button>
              <button
                type="button"
                onClick={speakResult}
                disabled={!result || speaking}
                className="min-h-10 rounded-md bg-[#d8b35d] px-3 py-2 text-sm font-semibold text-stone-950 transition hover:bg-[#c7a14f] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {speaking ? "朗读中..." : "朗读"}
              </button>
            </div>
          </div>

          <div className="flex flex-1 rounded-md border border-white/10 bg-black/16 p-4">
            {result ? (
              <p className="whitespace-pre-wrap text-xl leading-9 text-stone-50">{result}</p>
            ) : (
              <p className="self-center text-base leading-7 text-stone-300">
                译文会显示在这里。输入文本后选择目标语言即可开始。
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
