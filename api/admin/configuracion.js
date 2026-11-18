const { authorizeAdmin } = require('../../lib/admin-auth');
const { getBusinessSettings, saveBusinessSettings, validateBusinessSettings } = require('../../lib/business-settings');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!await authorizeAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      return res.status(200).json({ settings: await getBusinessSettings() });
    } catch (error) {
      console.error('Error al cargar la configuración del negocio:', error.message);
      return res.status(503).json({
        error: 'No se pudo cargar la configuración. Verificá que la tabla business_settings esté creada en la base de datos.'
      });
    }
  }

  const { errors, settings } = validateBusinessSettings(req.body);
  if (Object.keys(errors).length) {
    return res.status(422).json({ error: 'Revisá los campos indicados.', errors });
  }

  try {
    return res.status(200).json({ settings: await saveBusinessSettings(settings) });
  } catch (error) {
    console.error('Error al guardar la configuración del negocio:', error.message);
    return res.status(503).json({
      error: 'No se pudo guardar la configuración. Verificá que la tabla business_settings esté creada en la base de datos.'
    });
  }
};
