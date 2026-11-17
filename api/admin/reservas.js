const { authorizeAdmin } = require('../../lib/admin-auth');
const { getPool, isValidDate } = require('../../lib/database');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!await authorizeAdmin(req, res)) return;

  const fecha = typeof req.query.fecha === 'string' ? req.query.fecha.trim() : '';
  const estado = typeof req.query.estado === 'string' ? req.query.estado.trim() : '';
  const estadosValidos = new Set(['confirmada', 'completada', 'cancelada']);

  if (fecha && !isValidDate(fecha)) {
    return res.status(400).json({ error: 'La fecha del filtro no es válida.' });
  }
  if (estado && !estadosValidos.has(estado)) {
    return res.status(400).json({ error: 'El estado del filtro no es válido.' });
  }

  try {
    const { rows } = await getPool().query(
      `SELECT
         codigo,
         servicio,
         servicio_nombre,
         to_char(fecha, 'YYYY-MM-DD') AS fecha,
         left(hora, 5) AS hora,
         bebe_nombre,
         bebe_edad,
         tutor_nombre,
         telefono,
         notas,
         estado
       FROM public.reservas
       WHERE ($1::date IS NULL OR fecha = $1::date)
         AND ($2 = '' OR estado = $2)
       ORDER BY fecha ASC, hora ASC
       LIMIT 200`,
      [fecha || null, estado]
    );

    return res.status(200).json({ reservas: rows });
  } catch (error) {
    console.error('Error al listar reservas del panel:', error.message);
    return res.status(503).json({ error: 'No se pudieron cargar las reservas.' });
  }
};
