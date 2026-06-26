import { readFileSync } from "fs";
import { join } from "path";

export default function handler(req, res) {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "server-brands.json"), "utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("[server-brands] Read failed:", err.message);
    res.status(500).json({ error: "server-brands.json not found or unreadable." });
  }
}
