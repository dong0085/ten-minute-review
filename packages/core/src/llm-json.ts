export function parseJsonFromLlmText(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  return JSON.parse(trimmed);
}
