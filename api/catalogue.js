import { readFileSync } from "fs";
import { join } from "path";

export default function handler(req, res) {
  if (req.method === "PUT") {
    // Vercel serverless functions run on a read-only filesystem.
    // To support catalogue writes, deploy server.js on Railway/Render
    // and set VITE_API_URL to that backend's URL.
    return res.status(501).json({
      error:
        "Catalogue writes are not supported on Vercel (read-only filesystem). " +
        "Deploy server.js to Railway or Render and set VITE_API_URL.",
    });
  }

  // GET
  try {
    const raw = readFileSync(join(process.cwd(), "data", "catalogue.json"), "utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("[catalogue] Read failed:", err.message);
    res.status(500).json({ error: "catalogue.json not found or unreadable." });
  }
}
