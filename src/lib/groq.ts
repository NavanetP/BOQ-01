/**
 * Browser-side Groq API caller.
 * Uses VITE_GROQ_API_KEY — set this in Vercel Environment Variables.
 *
 * SECURITY NOTE: The API key is visible in the browser bundle.
 * Restrict it in the Groq dashboard to your Vercel domain only:
 * https://console.groq.com → API Keys → Allowed Origins
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq({
  systemPrompt,
  userPrompt,
  model,
  maxTokens = 4096,
}: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;
  if (!apiKey) {
    throw new Error(
      "VITE_GROQ_API_KEY is not set. Add it in Vercel → Settings → Environment Variables."
    );
  }

  const resolvedModel =
    model ||
    (import.meta.env.VITE_GROQ_MODEL as string) ||
    "llama-3.3-70b-versatile";

  const MAX_RETRIES = 4;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    const data = await res.json();

    if (res.status === 429) {
      const waitSeconds = parseFloat(res.headers.get("retry-after") ?? "") || 25 * attempt;
      console.warn(`[groq] Rate limited — waiting ${waitSeconds}s (attempt ${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
      continue;
    }

    if (!res.ok) {
      throw new Error(data?.error?.message || `Groq HTTP ${res.status}`);
    }

    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) throw new Error("Groq returned empty content");
    return content;
  }

  throw new Error(`Groq call failed after ${MAX_RETRIES} retries (rate limited)`);
}

const REQUIRED_BOQ_KEYS = [
  "summary",
  "segment",
  "compute",
  "storage",
  "network",
  "backup",
  "monitoring",
  "sql_database",
  "nosql_database",
] as const;

export function parseBoqJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const boq = JSON.parse(cleaned);
  for (const key of REQUIRED_BOQ_KEYS) {
    if (!(key in boq)) throw new Error(`Missing field: ${key}`);
  }
  return boq;
}
