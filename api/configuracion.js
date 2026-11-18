const { getBusinessSettings } = require('../lib/business-settings');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    return res.status(200).json({ settings: await getBusinessSettings() });
  } catch (error) {
    console.error('Error al cargar la configuración pública del negocio:', error.message);
    return res.status(503).json({ error: 'No se pudo cargar la configuración del negocio.' });
  }
};
