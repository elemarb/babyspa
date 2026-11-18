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
  const desde = typeof req.query.desde === 'string' ? req.query.desde.trim() : '';
  const hasta = typeof req.query.hasta === 'string' ? req.query.hasta.trim() : '';
  const estado = typeof req.query.estado === 'string' ? req.query.estado.trim() : '';
  const estadosValidos = new Set(['confirmada', 'completada', 'cancelada']);

  if (fecha && !isValidDate(fecha)) {
    return res.status(400).json({ error: 'La fecha del filtro no es válida.' });
  }
  if ((desde && !isValidDate(desde)) || (hasta && !isValidDate(hasta))) {
    return res.status(400).json({ error: 'El período del filtro no es válido.' });
  }
  if (Boolean(desde) !== Boolean(hasta) || (desde && desde > hasta)) {
    return res.status(400).json({ error: 'El rango de fechas del filtro no es válido.' });
  }
  if (estado && !estadosValidos.has(estado)) {
    return res.status(400).json({ error: 'El estado del filtro no es válido.' });
  }

  try {
    const limitClause = desde ? '' : 'LIMIT 200';
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
         AND ($2::date IS NULL OR fecha >= $2::date)
         AND ($3::date IS NULL OR fecha <= $3::date)
         AND ($4 = '' OR estado = $4)
       ORDER BY fecha ASC, hora ASC
       ${limitClause}`,
      [fecha || null, desde || null, hasta || null, estado]
    );

    return res.status(200).json({ reservas: rows });
  } catch (error) {
    console.error('Error al listar reservas del panel:', error.message);
    return res.status(503).json({ error: 'No se pudieron cargar las reservas.' });
  }
};
