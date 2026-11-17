const { randomBytes } = require('node:crypto');
const { baseHours, getAsuncionDateTime, getPool, isValidDate, services } = require('../lib/database');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido. Solo se acepta POST.' });
  }

  const data = req.body && typeof req.body === 'object' ? req.body : {};
  const servicio = normalizeText(data.servicio);
  const fecha = normalizeText(data.fecha);
  const hora = normalizeText(data.hora);
  const bebeNombre = normalizeText(data.bebe_nombre);
  const edad = Number(data.bebe_edad);
  const tutorNombre = normalizeText(data.tutor_nombre);
  const telefono = normalizeText(data.telefono);
  const notas = normalizeText(data.notas);
  const errors = {};

  if (!services[servicio]) errors.servicio = 'Por favor seleccioná un servicio.';
  if (!isValidDate(fecha)) errors.fecha = 'La fecha es obligatoria y debe ser válida.';
  if (!baseHours.includes(hora)) errors.hora = 'Por favor elegí un horario disponible.';
  if (!bebeNombre) errors.bebe_nombre = 'El nombre de tu bebé es necesario.';
  if (!Number.isInteger(edad) || edad <= 0 || edad > 36) {
    errors.bebe_edad = 'Ingresá la edad en meses (1 a 36 meses).';
  }
  if (!tutorNombre) errors.tutor_nombre = 'Ingresá tu nombre y apellido.';
  if (telefono.length < 8) errors.telefono = 'Ingresá un número de WhatsApp o teléfono válido (mínimo 8 dígitos).';

  if (Object.keys(errors).length) {
    return res.status(422).json({ success: false, errors, error: Object.values(errors)[0] });
  }

  if (new Date(`${fecha}T00:00:00.000Z`).getUTCDay() === 0) {
    return res.status(400).json({
      success: false,
      error: 'Los domingos el spa permanece cerrado. Por favor elegí otro día.'
    });
  }

  const { date: hoy, time: horaActual } = getAsuncionDateTime();
  if (fecha < hoy || (fecha === hoy && hora <= horaActual)) {
    return res.status(400).json({ success: false, error: 'Ese horario ya pasó. Por favor elegí otro.' });
  }

  const codigo = `BSP-${hoy.slice(0, 4)}-${randomBytes(3).toString('hex').toUpperCase()}`;

  try {
    const db = getPool();
    const existing = await db.query(
      'SELECT 1 FROM reservas WHERE fecha = $1 AND hora = $2 AND estado = $3 LIMIT 1',
      [fecha, hora, 'confirmada']
    );
    if (existing.rowCount) {
      return res.status(409).json({
        success: false,
        error: `Lo sentimos, el horario de las ${hora} hs para el día ${fecha} ya fue reservado. Por favor seleccioná otro horario disponible.`
      });
    }

    await db.query(
      `INSERT INTO reservas
        (codigo, servicio, servicio_nombre, fecha, hora, bebe_nombre, bebe_edad, tutor_nombre, telefono, notas, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmada')`,
      [codigo, servicio, services[servicio], fecha, hora, bebeNombre, edad, tutorNombre, telefono, notas]
    );
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: `Lo sentimos, el horario de las ${hora} hs para el día ${fecha} ya fue reservado. Por favor seleccioná otro horario disponible.`
      });
    }

    console.error('Error al guardar la reserva:', error.message);
    return res.status(503).json({
      success: false,
      error: 'No pudimos guardar la reserva. Por favor intentá nuevamente.'
    });
  }

  return res.status(201).json({
    success: true,
    codigo,
    mensaje: '¡Reserva confirmada con éxito!',
    reserva: {
      codigo,
      servicio: services[servicio],
      fecha,
      hora,
      bebe_nombre: bebeNombre,
      bebe_edad: `${edad} meses`,
      tutor_nombre: tutorNombre,
      telefono,
      notas,
      lugar: 'Baby Spa Paraguay - Asunción (Barrio Herrera)'
    }
  });
};
