// /api/delete.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_id } = req.body || {};
  if (!public_id) return res.status(400).json({ error: 'Missing public_id' });

  const CLOUD_NAME = process.env.CLD_CLOUD_NAME;
  const KEY = process.env.CLD_API_KEY;
  const SECRET = process.env.CLD_API_SECRET;
  if (!CLOUD_NAME || !KEY || !SECRET) {
    return res.status(500).json({ error: 'Missing Cloudinary env vars' });
  }

  const auth = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');

  // Admin API delete helper (DELETE /resources/{type}/upload with public_ids[])
  async function adminDelete(resourceType) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${resourceType}/upload`;
    const body = new URLSearchParams();
    body.append('public_ids[]', public_id);

    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const json = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, json };
  }

  try {
    // Try as video first, then image (covers GIFs saved as images)
    let r = await adminDelete('video');
    if (!(r.ok || r?.json?.deleted?.[public_id])) {
      r = await adminDelete('image');
    }

    const deleted = r?.json?.deleted?.[public_id] === 'deleted';
    const notFound = r?.json?.deleted?.[public_id] === 'not_found';

    if (deleted || notFound || r.ok) {
      return res.status(200).json({ result: deleted ? 'ok' : 'not_found' });
    }
    return res.status(500).json({ error: 'Cloudinary admin delete failed', detail: r.json });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
