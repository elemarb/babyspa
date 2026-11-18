const { Pool } = require('pg');

const baseHours = [
  '08:30',
  '09:15',
  '10:00',
  '10:45',
  '11:30',
  '14:00',
  '14:45',
  '15:30',
  '16:15',
  '17:00'
];

let pool;

function getPool() {
  const connectionString = process.env.SUPABASE_CONNECTION_STRING || process.env.DATABASE_URL;
  if (!connectionString) {
    const error = new Error('SUPABASE_CONNECTION_STRING is not configured');
    error.code = 'DB_CONFIG_MISSING';
    throw error;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 2,
      connectionTimeoutMillis: 10000
    });
  }

  return pool;
}

function getAsuncionDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`
  };
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

module.exports = { baseHours, getAsuncionDateTime, getPool, isValidDate };
