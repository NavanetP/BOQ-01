import { callGroq, parseBoqJson } from "./_lib/groq.js";

const SYSTEM_PROMPT = `You are a senior datacentre architect and presales engineer.
Generate detailed Bills of Quantities (BOQ) for enterprise data centre infrastructure.
Always respond with valid JSON only — no markdown, no code fences, no extra text.
Use realistic USD pricing. Include 3-6 items per category scaled to customer needs.`;

function buildUserPrompt({ requirements, scale, budget, compliance, redundancy, segment }) {
  return `Generate a detailed BOQ in strict JSON.

REQUIREMENTS:
${requirements}

Scale: ${scale}
Budget: ${budget}
Compliance: ${compliance}
Redundancy: ${redundancy}${segment ? `\nSegment: ${segment}` : ""}

Return exactly this JSON shape:
{
  "summary": "2-3 sentence overview",
  "segment": "segment name",
  "compute": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why for this customer"}],
  "storage": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}],
  "network": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}],
  "backup": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}],
  "monitoring": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}],
  "sql_database": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}],
  "nosql_database": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}]
}

Rules: realistic USD prices, respect compliance requirements, scale hardware to stated user count and budget.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Content-Type", "application/json");

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set in Vercel Environment Variables." });
  }

  const { requirements, scale, budget, compliance, redundancy, segment } = req.body || {};
  if (!requirements?.trim()) {
    return res.status(400).json({ error: "Requirements are required." });
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  let raw;
  try {
    raw = await callGroq({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt({ requirements, scale, budget, compliance, redundancy, segment }),
      model,
      maxTokens: 4096,
    });
  } catch (err) {
    console.error("[generate-boq] Groq call failed:", err.message);
    return res.status(502).json({ error: "Groq API error: " + err.message });
  }

  let boq;
  try {
    boq = parseBoqJson(raw);
  } catch (err) {
    console.error("[generate-boq] Parse error:", err.message, "| raw:", raw.slice(0, 300));
    return res.status(502).json({ error: "BOQ parse failed: " + err.message });
  }

  return res.json({ boq });
}
