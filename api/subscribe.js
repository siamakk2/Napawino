module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().slice(0, 200);
    const consent = !!b.consent;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ error: 'invalid_email' });
    if (!consent) return res.status(400).json({ error: 'consent_required' });
    console.log('NEW_NEWSLETTER_SUBSCRIBE ' + JSON.stringify({ email, consent, at: new Date().toISOString() }));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
