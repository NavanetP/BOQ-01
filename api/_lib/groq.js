/**
 * Shared Groq API caller used by all serverless functions.
 * Handles rate-limit retries automatically.
 */

export async function callGroq({ systemPrompt, userPrompt, model, maxTokens = 4096 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const resolvedModel = model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const MAX_RETRIES = 4;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    const rawText = await groqRes.text();
    const data = JSON.parse(rawText);

    if (groqRes.status === 429) {
      const retryAfterHeader = groqRes.headers.get("retry-after");
      const waitSeconds = retryAfterHeader ? parseFloat(retryAfterHeader) : 25 * attempt;
      console.log(`[callGroq] Rate limited. Waiting ${waitSeconds}s (retry ${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
      continue;
    }

    if (!groqRes.ok) {
      throw new Error(data?.error?.message || `Groq HTTP ${groqRes.status}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned empty content");
    return content;
  }

  throw new Error(`Groq call failed after ${MAX_RETRIES} retries (rate limited)`);
}

export function parseBoqJson(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const boq = JSON.parse(cleaned);
  const required = [
    "summary",
    "segment",
    "compute",
    "storage",
    "network",
    "backup",
    "monitoring",
    "sql_database",
    "nosql_database",
  ];
  for (const key of required) {
    if (!(key in boq)) throw new Error(`Missing field: ${key}`);
  }
  return boq;
}
