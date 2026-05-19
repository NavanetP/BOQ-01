import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SYSTEM_PROMPT = `You are a senior datacentre architect and presales engineer.
Generate detailed Bills of Quantities (BOQ) for enterprise data centre infrastructure.
Always respond with valid JSON only — no markdown, no code fences, no extra text.
Use realistic USD pricing. Include 3-6 items per category scaled to customer needs.`;

function buildUserPrompt({
  requirements,
  scale,
  budget,
  compliance,
  redundancy,
  segment,
}) {
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
  const required = [
    "summary",
    "segment",
    "compute",
    "storage",
    "network",
    "backup",
    "monitoring",
    "database",
  ];
  for (const key of required) {
    if (!(key in boq)) throw new Error(`Missing field: ${key}`);
  }
  return boq;
}

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: "groq", hasKey: !!process.env.GROQ_API_KEY });
});

// ── Main BOQ endpoint ─────────────────────────────────────────
app.post("/api/generate-boq", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "GROQ_API_KEY is not set in Railway Variables" });
  }

  const { requirements, scale, budget, compliance, redundancy, segment } =
    req.body || {};
  if (!requirements?.trim()) {
    return res.status(400).json({ error: "Requirements are required." });
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  // Step 1: call Groq
  let groqRes;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: buildUserPrompt({
              requirements,
              scale,
              budget,
              compliance,
              redundancy,
              segment,
            }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });
  } catch (networkErr) {
    console.error("Network error reaching Groq:", networkErr.message);
    return res
      .status(502)
      .json({ error: "Cannot reach Groq API: " + networkErr.message });
  }

  // Step 2: read body as TEXT first — never .json() directly
  let rawText;
  try {
    rawText = await groqRes.text();
    console.log("Groq HTTP status:", groqRes.status);
    console.log("Groq response preview:", rawText.slice(0, 300));
  } catch (readErr) {
    console.error("Failed to read Groq body:", readErr.message);
    return res.status(502).json({ error: "Failed to read Groq response body" });
  }

  // Step 3: parse the Groq envelope
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    console.error("Groq returned non-JSON body:", rawText.slice(0, 300));
    return res
      .status(502)
      .json({ error: "Groq returned non-JSON: " + rawText.slice(0, 120) });
  }

  if (!groqRes.ok) {
    const msg = data?.error?.message || `Groq error ${groqRes.status}`;
    return res.status(groqRes.status).json({ error: msg });
  }

  // Step 4: extract content
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    console.error(
      "No content field in Groq response:",
      JSON.stringify(data).slice(0, 300),
    );
    return res.status(502).json({ error: "Groq returned empty content" });
  }

  // Step 5: parse BOQ JSON
  let boq;
  try {
    boq = parseBoqJson(raw);
  } catch (boqErr) {
    console.error(
      "BOQ parse error:",
      boqErr.message,
      "| raw:",
      raw.slice(0, 300),
    );
    return res
      .status(502)
      .json({ error: "BOQ parse failed: " + boqErr.message });
  }

  return res.json({ boq });
});

// ── Serve React frontend from dist/ ───────────────────────────
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`BOQ API running on port ${PORT}`);
});
