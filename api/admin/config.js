const { getSupabaseAuthConfig } = require('../../lib/admin-auth');

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const config = getSupabaseAuthConfig();
  if (!config) {
    return res.status(503).json({ error: 'El acceso de administración todavía no está configurado.' });
  }

  return res.status(200).json({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey
  });
};
