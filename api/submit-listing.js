module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const b = req.body || {};
    const clean = {};
    for (const k of ['name','brokerage','dre','mls','email','phone','address','price','type','description']) {
      clean[k] = String(b[k] || '').slice(0, 1000);
    }
    if (!clean.name || !clean.email || !clean.address || !clean.dre) return res.status(400).json({ error: 'missing_fields' });
    console.log('NEW_LISTING_SUBMISSION ' + JSON.stringify({ ...clean, at: new Date().toISOString() }));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
