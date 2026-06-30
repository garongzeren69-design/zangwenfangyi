export function getDeepSeekAPIKey() {
  const rawKey = process.env.DEEPSEEK_API_KEY;

  if (!rawKey) {
    return "";
  }

  return rawKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}
