const { getPool } = require('../lib/database');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const rawPhone = typeof body.telefono === 'string' ? body.telefono.replace(/\D/g, '') : '';
  if (rawPhone.length < 8 || rawPhone.length > 15) {
    return res.status(422).json({ error: 'El número de teléfono no es válido.' });
  }
  const telefono = rawPhone.startsWith('595')
    ? rawPhone.slice(3)
    : rawPhone.length === 10 && rawPhone.startsWith('0')
      ? rawPhone.slice(1)
      : rawPhone;

  try {
    const { rows } = await getPool().query(
      `WITH reservas_normalizadas AS (
         SELECT
           codigo,
           servicio,
           servicio_nombre,
           to_char(fecha, 'YYYY-MM-DD') AS fecha,
           left(hora, 5) AS hora,
           bebe_nombre,
           bebe_edad,
           estado,
           regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') AS telefono_digitos
         FROM public.reservas
       )
       SELECT codigo, servicio, servicio_nombre, fecha, hora, bebe_nombre, bebe_edad, estado
       FROM reservas_normalizadas
       WHERE CASE
         WHEN telefono_digitos LIKE '595%' THEN substring(telefono_digitos FROM 4)
         WHEN length(telefono_digitos) = 10 AND telefono_digitos LIKE '0%' THEN substring(telefono_digitos FROM 2)
         ELSE telefono_digitos
       END = $1
       ORDER BY fecha DESC, hora DESC
       LIMIT 100`,
      [telefono]
    );

    return res.status(200).json({ reservas: rows });
  } catch (error) {
    console.error('Error al consultar las reservas del cliente:', error.message);
    return res.status(503).json({ error: 'No se pudieron cargar las reservas. Intentá nuevamente.' });
  }
};
