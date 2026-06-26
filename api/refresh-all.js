// Vercel serverless functions run on a read-only filesystem.
// This endpoint requires writing updated data back to JSON files,
// which is not possible on Vercel.
// To use this feature, deploy server.js on Railway or Render and
// set VITE_API_URL to that backend's URL.

export default function handler(req, res) {
  res.status(501).json({
    error:
      "Data refresh requires a persistent backend (read-only filesystem on Vercel). " +
      "Deploy server.js to Railway or Render and set VITE_API_URL.",
  });
}
