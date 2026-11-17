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

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
  const estado = typeof body.estado === 'string' ? body.estado.trim() : '';
  const estadosValidos = new Set(['confirmada', 'completada', 'cancelada']);

  if (!codigo || !estadosValidos.has(estado)) {
    return res.status(422).json({ error: 'El código o el estado de la reserva no es válido.' });
  }

  try {
    const result = await getPool().query(
      'UPDATE public.reservas SET estado = $1 WHERE codigo = $2 RETURNING codigo',
      [estado, codigo]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'No se encontró la reserva.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al actualizar una reserva desde el panel:', error.message);
    return res.status(503).json({ error: 'No se pudo actualizar la reserva.' });
  }
};
