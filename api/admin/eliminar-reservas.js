const { authorizeAdmin } = require('../../lib/admin-auth');
const { getPool } = require('../../lib/database');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!await authorizeAdmin(req, res)) return;

  try {
    const result = await getPool().query('DELETE FROM public.reservas');
    return res.status(200).json({ success: true, deletedCount: result.rowCount });
  } catch (error) {
    console.error('Error al eliminar todas las reservas desde el panel:', error.message);
    return res.status(503).json({ error: 'No se pudieron eliminar las reservas.' });
  }
};
