export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { public_id } = req.body;

  if (!public_id) {
    return res.status(400).json({ error: "Missing public_id" });
  }

  try {
    const cloudName = process.env.CLD_CLOUD_NAME;
    const apiKey = process.env.CLD_API_KEY;
    const apiSecret = process.env.CLD_API_SECRET;

    const auth = Buffer.from(apiKey + ":" + apiSecret).toString("base64");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/video/upload/${public_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ success: true, result: data });
    } else {
      res.status(500).json({ success: false, error: data });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
