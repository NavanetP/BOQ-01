import { readFileSync } from "fs";
import { join } from "path";

export default function handler(req, res) {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "segment-recommendations.json"), "utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("[segment-recommendations] Read failed:", err.message);
    res.status(500).json({ error: "segment-recommendations.json not found or unreadable." });
  }
}
