export function getOpenAIAPIKey() {
  const rawKey = process.env.OPENAI_API_KEY;

  if (!rawKey) {
    return "";
  }

  return rawKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}
