const { getPool } = require('./database');

async function getBusinessSettings() {
  const { rows } = await getPool().query(
    `SELECT business_name, address, whatsapp, instagram, booking_message
     FROM public.business_settings
     WHERE id = 1`
  );

  if (!rows.length) {
    throw new Error('No existe una configuración de negocio inicializada.');
  }

  const row = rows[0];
  return {
    businessName: row.business_name,
    address: row.address,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    bookingMessage: row.booking_message
  };
}

function validateBusinessSettings(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const businessName = typeof source.businessName === 'string' ? source.businessName.trim() : '';
  const address = typeof source.address === 'string' ? source.address.trim() : '';
  const rawWhatsApp = typeof source.whatsapp === 'string' ? source.whatsapp.trim() : '';
  const instagramInput = typeof source.instagram === 'string' ? source.instagram.trim().replace(/^@/, '') : '';
  const bookingMessage = typeof source.bookingMessage === 'string' ? source.bookingMessage.trim() : '';
  const whatsapp = rawWhatsApp.replace(/\D/g, '');
  const errors = {};

  if (!businessName || businessName.length > 100) {
    errors.businessName = 'El nombre debe tener entre 1 y 100 caracteres.';
  }
  if (address.length > 250) {
    errors.address = 'La dirección no puede superar los 250 caracteres.';
  }
  if (!/^[+\d\s().-]+$/.test(rawWhatsApp) || whatsapp.length < 8 || whatsapp.length > 15) {
    errors.whatsapp = 'Ingresá un número válido con código de país, de 8 a 15 dígitos.';
  }
  if (instagramInput && !/^[A-Za-z0-9._]{1,30}$/.test(instagramInput)) {
    errors.instagram = 'Ingresá solo el usuario de Instagram, sin URL.';
  }
  if (!bookingMessage || bookingMessage.length > 2000) {
    errors.bookingMessage = 'El mensaje debe tener entre 1 y 2000 caracteres.';
  }

  return {
    errors,
    settings: {
      businessName,
      address,
      whatsapp,
      instagram: instagramInput,
      bookingMessage
    }
  };
}

async function saveBusinessSettings(settings) {
  const { rows } = await getPool().query(
    `UPDATE public.business_settings
     SET business_name = $1,
         address = $2,
         whatsapp = $3,
         instagram = $4,
         booking_message = $5,
         updated_at = NOW()
     WHERE id = 1
     RETURNING business_name, address, whatsapp, instagram, booking_message`,
    [
      settings.businessName,
      settings.address,
      settings.whatsapp,
      settings.instagram,
      settings.bookingMessage
    ]
  );

  if (!rows.length) {
    throw new Error('No existe una configuración de negocio inicializada.');
  }

  const row = rows[0];
  return {
    businessName: row.business_name,
    address: row.address,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    bookingMessage: row.booking_message
  };
}

module.exports = {
  getBusinessSettings,
  saveBusinessSettings,
  validateBusinessSettings
};
