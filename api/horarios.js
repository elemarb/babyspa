const { baseHours, getAsuncionDateTime, getPool, isValidDate } = require('../lib/database');
const { getActiveService } = require('../lib/services');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const servicio = typeof req.query.servicio === 'string' ? req.query.servicio.trim() : 'hidroterapia';
  const fecha = typeof req.query.fecha === 'string' ? req.query.fecha.trim() : getAsuncionDateTime().date;

  if (!isValidDate(fecha)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Usar YYYY-MM-DD.' });
  }

  try {
    if (!await getActiveService(servicio)) {
      return res.status(400).json({ error: 'El servicio no está disponible.' });
    }

    if (new Date(`${fecha}T00:00:00.000Z`).getUTCDay() === 0) {
      return res.status(200).json({ fecha, servicio, horarios: [] });
    }

    const { rows } = await getPool().query(
      "SELECT hora FROM reservas WHERE fecha = $1 AND estado <> 'cancelada'",
      [fecha]
    );
    const ocupados = new Set(rows.map(({ hora }) => String(hora).slice(0, 5)));
    const { date: hoy, time: horaActual } = getAsuncionDateTime();

    const horarios = baseHours.map((hora) => ({
      hora,
      disponible: !(fecha === hoy && hora <= horaActual) && !ocupados.has(hora)
    }));

    return res.status(200).json({ fecha, servicio, horarios });
  } catch (error) {
    console.error('Error al consultar horarios:', error.message);
    return res.status(503).json({
      error: 'No pudimos conectar con los horarios. Por favor intentá nuevamente.'
    });
  }
};
