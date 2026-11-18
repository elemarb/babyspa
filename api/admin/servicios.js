const { randomUUID } = require('node:crypto');
const { authorizeAdmin } = require('../../lib/admin-auth');
const { getPool } = require('../../lib/database');

function parseService(body) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const duracionMinutos = Number(body.duracionMinutos);
  const precio = Number(body.precio);
  const activo = body.activo;
  const errors = {};

  if (!nombre || nombre.length > 120) errors.nombre = 'Ingresá un nombre de hasta 120 caracteres.';
  if (!Number.isInteger(duracionMinutos) || duracionMinutos < 1 || duracionMinutos > 1440) {
    errors.duracionMinutos = 'La duración debe ser de 1 a 1440 minutos.';
  }
  if (!Number.isSafeInteger(precio) || precio < 0) {
    errors.precio = 'Ingresá un precio entero válido en guaraníes.';
  }
  if (typeof activo !== 'boolean') errors.activo = 'Indicá si el servicio está activo.';

  return { errors, service: { nombre, duracionMinutos, precio, activo } };
}

function mapService(row) {
  return {
    codigo: row.codigo,
    nombre: row.nombre,
    duracionMinutos: row.duracion_minutos,
    precio: Number(row.precio),
    activo: row.activo,
    reservas: Number(row.reservas || 0)
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET, POST, PUT, DELETE');

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!await authorizeAdmin(req, res)) return;

  let pool;
  try {
    pool = getPool();
  } catch (error) {
    console.error('Error al conectar para gestionar servicios:', error.message);
    return res.status(503).json({ error: 'No se pudo conectar con los servicios.' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        `SELECT s.codigo, s.nombre, s.duracion_minutos, s.precio, s.activo,
                COUNT(r.id)::int AS reservas
         FROM public.servicios s
         LEFT JOIN public.reservas r ON r.servicio = s.codigo
         GROUP BY s.codigo, s.nombre, s.duracion_minutos, s.precio, s.activo
         ORDER BY s.nombre`
      );
      return res.status(200).json({ servicios: rows.map(mapService) });
    } catch (error) {
      console.error('Error al listar servicios del panel:', error.message);
      return res.status(503).json({ error: 'No se pudieron cargar los servicios.' });
    }
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';

  if (req.method === 'POST' || req.method === 'PUT') {
    const { errors, service } = parseService(body);
    if (Object.keys(errors).length) {
      return res.status(422).json({ error: 'Revisá los datos del servicio.', errors });
    }

    try {
      if (req.method === 'POST') {
        const { rows } = await pool.query(
          `INSERT INTO public.servicios (codigo, nombre, duracion_minutos, precio, activo)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING codigo, nombre, duracion_minutos, precio, activo`,
          [randomUUID(), service.nombre, service.duracionMinutos, service.precio, service.activo]
        );
        return res.status(201).json({ servicio: mapService(rows[0]) });
      }

      if (!codigo) return res.status(422).json({ error: 'Falta el código del servicio.' });
      const { rows } = await pool.query(
        `UPDATE public.servicios
         SET nombre = $1, duracion_minutos = $2, precio = $3, activo = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE codigo = $5
         RETURNING codigo, nombre, duracion_minutos, precio, activo`,
        [service.nombre, service.duracionMinutos, service.precio, service.activo, codigo]
      );
      if (!rows.length) return res.status(404).json({ error: 'No se encontró el servicio.' });
      return res.status(200).json({ servicio: mapService(rows[0]) });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un servicio con ese nombre.' });
      }
      console.error('Error al guardar el servicio:', error.message);
      return res.status(503).json({ error: 'No se pudo guardar el servicio.' });
    }
  }

  if (!codigo) return res.status(422).json({ error: 'Falta el código del servicio.' });

  try {
    const { rows: usage } = await pool.query(
      'SELECT COUNT(*)::int AS reservas FROM public.reservas WHERE servicio = $1',
      [codigo]
    );
    if (usage[0].reservas > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: el servicio tiene ${usage[0].reservas} reserva(s) asociada(s).`
      });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM public.servicios s
       WHERE s.codigo = $1
         AND NOT EXISTS (SELECT 1 FROM public.reservas r WHERE r.servicio = s.codigo)`,
      [codigo]
    );
    if (!rowCount) {
      const exists = await pool.query('SELECT 1 FROM public.servicios WHERE codigo = $1', [codigo]);
      if (!exists.rowCount) return res.status(404).json({ error: 'No se encontró el servicio.' });
      return res.status(409).json({ error: 'No se puede eliminar: el servicio tiene reservas asociadas.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el servicio tiene reservas asociadas.' });
    }
    console.error('Error al eliminar el servicio:', error.message);
    return res.status(503).json({ error: 'No se pudo eliminar el servicio.' });
  }
};
