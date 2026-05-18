import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

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
  "database": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}]
}

Rules: realistic USD prices, respect compliance requirements, scale hardware to stated user count and budget.`;
}

function parseBoqJson(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const boq = JSON.parse(cleaned);
  const required = ["summary", "segment", "compute", "storage", "network", "backup", "monitoring", "database"];
  for (const key of required) {
    if (!(key in boq)) throw new Error(`Missing field: ${key}`);
  }
  return boq;
}

app.post("/api/generate-boq", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Groq API key is not configured. Add GROQ_API_KEY to .env" });
  }

  const { requirements, scale, budget, compliance, redundancy, segment } = req.body || {};
  if (!requirements?.trim()) {
    return res.status(400).json({ error: "Requirements are required." });
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildUserPrompt({ requirements, scale, budget, compliance, redundancy, segment }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      const msg = data?.error?.message || "Groq request failed";
      return res.status(groqRes.status).json({ error: msg });
    }

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(502).json({ error: "Empty response from Groq" });
    }

    const boq = parseBoqJson(raw);
    res.json({ boq });
  } catch (err) {
    console.error("BOQ generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate BOQ" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: "groq", hasKey: !!process.env.GROQ_API_KEY });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (Groq)`);
});
