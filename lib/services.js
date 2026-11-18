const { getPool } = require('./database');

function mapService(row) {
  return {
    codigo: row.codigo,
    nombre: row.nombre,
    duracionMinutos: row.duracion_minutos,
    precio: Number(row.precio),
    activo: row.activo
  };
}

async function getActiveService(codigo) {
  const { rows } = await getPool().query(
    `SELECT codigo, nombre, duracion_minutos, precio, activo
     FROM public.servicios
     WHERE codigo = $1 AND activo = TRUE`,
    [codigo]
  );
  return rows.length ? mapService(rows[0]) : null;
}

async function listActiveServices() {
  const { rows } = await getPool().query(
    `SELECT codigo, nombre, duracion_minutos, precio, activo
     FROM public.servicios
     WHERE activo = TRUE
     ORDER BY nombre`
  );
  return rows.map(mapService);
}

module.exports = { getActiveService, listActiveServices };
