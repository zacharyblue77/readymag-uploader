export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { public_id } = req.body;
  if (!public_id) return res.status(400).json({ error: "Missing public_id" });

  const cloudName = process.env.CLD_CLOUD_NAME;
  const apiKey = process.env.CLD_API_KEY;
  const apiSecret = process.env.CLD_API_SECRET;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const del = (resourceType) =>
    fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload/${encodeURIComponent(
        public_id
      )}`,
      { method: "DELETE", headers: { Authorization: `Basic ${auth}` } }
    );

  try {
    // 1) try as video
    let r = await del("video");
    if (r.status === 404) {
      // 2) try as image (GIFs often end up here)
      r = await del("image");
    }
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ success: false, error: data });
    }
    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
