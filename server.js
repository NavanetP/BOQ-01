import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Catalogue file helpers ────────────────────────────────────
const CATALOGUE_PATH = path.join(__dirname, "data", "catalogue.json");

function readCatalogue() {
  try {
    const raw = fs.readFileSync(CATALOGUE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read catalogue.json:", err.message);
    return null;
  }
}

function writeCatalogue(data) {
  fs.mkdirSync(path.dirname(CATALOGUE_PATH), { recursive: true });
  fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

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
  "sql_database": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}],
  "nosql_database": [{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why"}]
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
    "sql_database",
    "nosql_database",
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

  // Call Groq via shared helper
  let raw;
  try {
    raw = await callGroq({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt({ requirements, scale, budget, compliance, redundancy, segment }),
      model,
      maxTokens: 4096,
    });
  } catch (networkErr) {
    console.error("Groq call failed:", networkErr.message);
    return res.status(502).json({ error: "Groq API error: " + networkErr.message });
  }

  // Parse BOQ JSON
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

// ── Shared Groq caller with rate-limit retry ──────────────────
async function callGroq({ systemPrompt, userPrompt, model, maxTokens = 4096 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

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
        model: model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    const rawText = await groqRes.text();
    const data = JSON.parse(rawText);

    // Rate limited — parse retry-after and wait
    if (groqRes.status === 429) {
      const retryAfterHeader = groqRes.headers.get("retry-after");
      const waitSeconds = retryAfterHeader
        ? parseFloat(retryAfterHeader)
        : (25 * attempt); // fallback: wait 25s, 50s, 75s...
      console.log(`[callGroq] Rate limited. Waiting ${waitSeconds}s before retry ${attempt}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, waitSeconds * 1000));
      continue;
    }

    if (!groqRes.ok) throw new Error(data?.error?.message || `Groq HTTP ${groqRes.status}`);

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned empty content");
    return content;
  }
  throw new Error(`Groq call failed after ${MAX_RETRIES} retries (rate limit)`);
}

// ── Generic JSON file reader helper ──────────────────────────
function readJsonFile(filename) {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data", filename), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err.message);
    return null;
  }
}

// ── GET /api/segment-recommendations ─────────────────────────
app.get("/api/segment-recommendations", (_req, res) => {
  const data = readJsonFile("segment-recommendations.json");
  if (!data) {
    return res.status(500).json({ error: "segment-recommendations.json not found or unreadable." });
  }
  return res.json(data);
});

// ── GET /api/server-brands ────────────────────────────────────
app.get("/api/server-brands", (_req, res) => {
  const data = readJsonFile("server-brands.json");
  if (!data) {
    return res.status(500).json({ error: "server-brands.json not found or unreadable." });
  }
  return res.json(data);
});

// ── GET /api/server-options ───────────────────────────────────
app.get("/api/server-options", (_req, res) => {
  const data = readJsonFile("server-options.json");
  if (!data) {
    return res.status(500).json({ error: "server-options.json not found or unreadable." });
  }
  return res.json(data);
});

// ── GET /api/catalogue ────────────────────────────────────────
// Returns the full catalogue from data/catalogue.json
app.get("/api/catalogue", (_req, res) => {
  const catalogue = readCatalogue();
  if (!catalogue) {
    return res.status(500).json({ error: "Catalogue file not found or unreadable." });
  }
  return res.json(catalogue);
});

// ── PUT /api/catalogue ────────────────────────────────────────
// Saves a full or partial catalogue update (admin use).
// Body: { categories: { [categoryKey]: { items: [...] } } }
app.put("/api/catalogue", (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid body." });
  }

  const current = readCatalogue();
  if (!current) return res.status(500).json({ error: "Cannot read current catalogue." });

  // Merge incoming categories over existing ones
  if (incoming.categories) {
    for (const [catKey, catData] of Object.entries(incoming.categories)) {
      if (current.categories[catKey]) {
        // Merge items: update matching ids, append new ones
        const existingMap = new Map(current.categories[catKey].items.map((i) => [i.id, i]));
        for (const item of catData.items || []) {
          existingMap.set(item.id, { ...existingMap.get(item.id), ...item });
        }
        current.categories[catKey].items = Array.from(existingMap.values());
      } else {
        current.categories[catKey] = catData;
      }
    }
  }

  current.metadata = {
    ...current.metadata,
    lastFullUpdate: new Date().toISOString(),
  };

  try {
    writeCatalogue(current);
  } catch (err) {
    return res.status(500).json({ error: "Failed to write catalogue: " + err.message });
  }

  return res.json({ ok: true, message: "Catalogue updated.", metadata: current.metadata });
});

// ── POST /api/refresh-all ─────────────────────────────────────
// Uses Groq to refresh ALL data files with current 2025-2026
// market data: catalogue prices, server models/prices,
// CPU/GPU/RAM options, and segment recommendations.
// Body: { target?: "catalogue"|"server-brands"|"server-options"|"all" }
app.post("/api/refresh-all", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY is not set." });

  const { target = "all" } = req.body || {};
  const now = new Date().toISOString();
  const results = {};
  const errors = {};

  // ── Helper: write any data file ──
  const writeDataFile = (filename, data) => {
    const filepath = path.join(__dirname, "data", filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  };

  // ── 1. Refresh catalogue prices ──────────────────────────────
  if (target === "all" || target === "catalogue") {
    const catalogue = readCatalogue();
    if (catalogue) {
      const catErrors = {};
      for (const [catKey, catData] of Object.entries(catalogue.categories)) {
        const itemSummary = catData.items.map(i => ({
          id: i.id, name: i.name, brand: i.brand || "generic",
          spec: i.spec, currentPrice: i.unitPrice
        }));
        try {
          const raw = await callGroq({
            systemPrompt: `You are a senior enterprise IT pricing analyst with deep knowledge of 2025-2026 OEM list prices for Dell, HPE, Lenovo, Cisco, VMware, Palo Alto, Fortinet, F5, Juniper, Aruba, Oracle, Microsoft, Red Hat, and Nutanix.
Always respond with valid JSON only. No markdown, no code fences.`,
            userPrompt: `Update these ${catData.label} product prices to reflect current 2025-2026 enterprise list pricing.

Products to review:
${JSON.stringify(itemSummary, null, 2)}

Return EXACTLY this JSON shape with the SAME number of items and SAME ids:
{
  "items": [
    { "id": "product-id", "unitPrice": 12345, "spec": "updated spec if changed", "priceNote": "source/reason" }
  ]
}

Rules:
- Use realistic 2025-2026 USD enterprise LIST prices (not street price, not discounted)
- Update spec if the product has been refreshed (e.g. new gen NVMe, higher port speeds)
- Free/included products stay at 0
- priceNote: cite the product line version, e.g. "Dell PowerStore 2024 list" or "Cisco Catalyst 9300X refresh"`,
            maxTokens: 2048,
          });
          const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
          if (!Array.isArray(parsed.items)) throw new Error("No items array");
          const map = new Map(parsed.items.map(i => [i.id, i]));
          catalogue.categories[catKey].items = catData.items.map(item => {
            const u = map.get(item.id);
            if (!u) return item;
            return { ...item, unitPrice: u.unitPrice ?? item.unitPrice, spec: u.spec || item.spec, priceNote: u.priceNote, lastUpdated: now, source: "ai-refresh-2025" };
          });
          results[`catalogue.${catKey}`] = { updated: parsed.items.length };
          console.log(`[refresh-all] catalogue.${catKey} done`);
          // Pace calls to avoid rate limits (free tier: 12K TPM)
          await new Promise(r => setTimeout(r, 6000));
        } catch (err) {
          catErrors[catKey] = err.message;
          console.error(`[refresh-all] catalogue.${catKey} failed:`, err.message);
        }
      }
      catalogue.metadata.lastFullUpdate = now;
      writeCatalogue(catalogue);
      if (Object.keys(catErrors).length) errors.catalogue = catErrors;
    }
  }

  // ── 2. Refresh server brands & models ────────────────────────
  if (target === "all" || target === "server-brands") {
    try {
      const raw = await callGroq({
        systemPrompt: `You are a senior datacenter presales engineer with expertise in Dell PowerEdge, HPE ProLiant, and Lenovo ThinkSystem server portfolios as of 2025-2026.
Always respond with valid JSON only. No markdown, no code fences.`,
        userPrompt: `Generate a complete and current server brands catalogue for enterprise datacenter presales as of 2025-2026.

Include EXACTLY these brands: dell, hp, lenovo.

For each brand include:
- label: brand display name
- logo: short uppercase abbreviation (e.g. "DELL", "HPE", "LENOVO")  
- color: brand hex color
- series: object with series names as keys, each containing a "models" array

Each model must have:
- id: kebab-case identifier (e.g. "dell-r760")
- name: full product name
- formFactor: "1U", "2U", "4U" etc
- basePrice: realistic 2025-2026 USD list price (base config, no CPU/RAM)
- tier: "Entry", "Mid-range", "High-end", or "Mission Critical"

Include these specific series:
Dell: "PowerEdge R-Series (Rack)" (R260 through R960, XE8640, XE9680), "PowerEdge T-Series (Tower)" (T150 through T550)
HPE: "ProLiant DL-Series (Rack)" (DL20 through DL580 Gen11), "ProLiant ML-Series (Tower)" (ML30, ML110, ML350)
Lenovo: "ThinkSystem SR-Series (Rack)" (SR250 V3 through SR950 V3, SR670 V3 GPU), "ThinkSystem ST-Series (Tower)" (ST250 V3, ST550)

Return the COMPLETE JSON object with all brands, series and models.`,
        maxTokens: 4096,
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      // Validate structure
      if (!parsed.dell || !parsed.hp || !parsed.lenovo) throw new Error("Missing required brands in response");
      writeDataFile("server-brands.json", parsed);
      results["server-brands"] = { brands: Object.keys(parsed).length };
      console.log("[refresh-all] server-brands done");
      // Pace between large calls
      await new Promise(r => setTimeout(r, 8000));
    } catch (err) {
      errors["server-brands"] = err.message;
      console.error("[refresh-all] server-brands failed:", err.message);
    }
  }

  // ── 3. Refresh server component options (CPU/RAM/GPU/etc) ────
  if (target === "all" || target === "server-options") {
    try {
      const raw = await callGroq({
        systemPrompt: `You are a senior datacenter hardware specialist with deep knowledge of Intel Xeon, AMD EPYC, NVIDIA GPU, DDR5 memory, and NVMe storage pricing as of 2025-2026.
Always respond with valid JSON only. No markdown, no code fences.`,
        userPrompt: `Generate a complete and current server configuration options catalogue for enterprise datacenter presales as of 2025-2026.

Return a JSON object with EXACTLY these keys, each being an array of option objects:
{
  "cpuOptions": {
    "intel": [ array of Intel Xeon Scalable options ],
    "amd": [ array of AMD EPYC 9004 series options ]
  },
  "ramOptions": [ DDR5 ECC RDIMM capacity options ],
  "storageOptions": [ local storage options: NVMe, SAS SSD, SATA SSD, HDD RAID ],
  "nicOptions": [ NIC options: 1GbE through 100GbE ],
  "gpuOptions": [ GPU options including "No GPU" through H100/H200 ],
  "osOptions": [ OS options: bare metal, Windows Server, RHEL, SLES, ESXi ],
  "supportOptions": [ support contract options: 1yr NBD through 5yr 24x7 ],
  "psuOptions": [ PSU options: single, redundant, titanium ]
}

Each option object must have:
- id: kebab-case string identifier
- label: human-readable label with key specs
- priceAdder: realistic 2025-2026 USD price ADDER over base server price

Intel Xeon: include Xeon Silver 4510/4516, Gold 5415+/6438N/6438Y/6448Y/6454S, Platinum 8452Y/8460Y/8470/8480+/8592+
AMD EPYC: include 9124/9224/9254/9354/9374F/9454/9554/9654/9754
NVIDIA GPU: include none, L4(24GB), L40S(48GB), A30(24GB), H100 NVMe(80GB), H200(141GB), B200(192GB)
RAM: 64GB through 6TB in DDR5 ECC increments
NVMe storage: from 2x480GB SATA SSD through 8x7.68TB NVMe U.2`,
        maxTokens: 4096,
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (!parsed.cpuOptions || !parsed.ramOptions || !parsed.gpuOptions) throw new Error("Missing required option arrays");
      writeDataFile("server-options.json", parsed);
      results["server-options"] = {
        cpuIntel: parsed.cpuOptions?.intel?.length,
        cpuAmd: parsed.cpuOptions?.amd?.length,
        gpus: parsed.gpuOptions?.length,
        ramTiers: parsed.ramOptions?.length,
      };
      console.log("[refresh-all] server-options done");
    } catch (err) {
      errors["server-options"] = err.message;
      console.error("[refresh-all] server-options failed:", err.message);
    }
  }

  return res.json({
    ok: Object.keys(errors).length === 0,
    updatedAt: now,
    results,
    errors: Object.keys(errors).length ? errors : undefined,
  });
});

// ── POST /api/catalogue/refresh ───────────────────────────────
// Uses Groq to suggest refreshed prices for a category (or all).
// Body: { category?: string }   — omit category to refresh all
app.post("/api/catalogue/refresh", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set." });
  }

  const catalogue = readCatalogue();
  if (!catalogue) return res.status(500).json({ error: "Cannot read catalogue." });

  const { category } = req.body || {};

  // Build list of categories to refresh
  const targetKeys = category
    ? [category]
    : Object.keys(catalogue.categories);

  const invalidKeys = targetKeys.filter((k) => !catalogue.categories[k]);
  if (invalidKeys.length) {
    return res.status(400).json({ error: `Unknown categories: ${invalidKeys.join(", ")}` });
  }

  const results = {};
  const errors = {};

  for (const catKey of targetKeys) {
    const catData = catalogue.categories[catKey];

    // Build a compact item list for the prompt
    const itemSummary = catData.items.map((i) => ({
      id: i.id,
      name: i.name,
      spec: i.spec,
      currentPrice: i.unitPrice,
    }));

    const systemPrompt = `You are a senior enterprise IT pricing analyst. 
Your job is to review product prices and suggest realistic, current USD market prices.
Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const userPrompt = `Review the following ${catData.label} products and suggest a realistic current USD list price for each.
Consider current (2025-2026) enterprise market pricing from Dell, HPE, Lenovo, Cisco, VMware, etc.

Products:
${JSON.stringify(itemSummary, null, 2)}

Return exactly this JSON shape — same array length as input, same ids:
{
  "items": [
    { "id": "product-id", "unitPrice": 12345, "priceNote": "brief reason for this price" }
  ]
}

Rules:
- Keep prices realistic for enterprise list pricing (not street price)
- Only change unitPrice if you have good reason to believe it changed
- Keep free/zero-priced items at 0
- priceNote max 80 characters`;

    try {
      const raw = await callGroq({ systemPrompt, userPrompt, maxTokens: 2048 });
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      if (!Array.isArray(parsed.items)) throw new Error("Groq returned no items array");

      // Apply updates to catalogue
      const priceMap = new Map(parsed.items.map((i) => [i.id, i]));
      const now = new Date().toISOString();

      catalogue.categories[catKey].items = catData.items.map((item) => {
        const update = priceMap.get(item.id);
        if (!update) return item;
        return {
          ...item,
          unitPrice: update.unitPrice ?? item.unitPrice,
          priceNote: update.priceNote || undefined,
          lastUpdated: now,
          source: "ai-groq",
        };
      });

      results[catKey] = {
        itemsUpdated: parsed.items.length,
        updatedAt: now,
      };

      console.log(`[catalogue/refresh] ${catKey}: ${parsed.items.length} items refreshed`);
    } catch (err) {
      console.error(`[catalogue/refresh] Error refreshing ${catKey}:`, err.message);
      errors[catKey] = err.message;
    }
  }

  // Persist updated catalogue
  catalogue.metadata.lastFullUpdate = new Date().toISOString();
  try {
    writeCatalogue(catalogue);
  } catch (err) {
    return res.status(500).json({ error: "Prices refreshed but failed to save: " + err.message });
  }

  return res.json({
    ok: true,
    refreshed: results,
    errors: Object.keys(errors).length ? errors : undefined,
    metadata: catalogue.metadata,
  });
});

// ── Serve React frontend from dist/ ───────────────────────────
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`BOQ API running on port ${PORT}`);
});
