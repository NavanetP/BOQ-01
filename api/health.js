export default function handler(req, res) {
  res.json({ ok: true, provider: "groq", hasKey: !!process.env.GROQ_API_KEY });
}
