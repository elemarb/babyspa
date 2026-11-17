function getSupabaseAuthConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!supabaseUrl || !publishableKey || !adminEmail) {
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
    publishableKey,
    adminEmail: adminEmail.trim().toLowerCase()
  };
}

async function authorizeAdmin(req, res) {
  const config = getSupabaseAuthConfig();
  if (!config) {
    res.status(503).json({ error: 'El acceso de administración todavía no está configurado.' });
    return false;
  }

  const authorization = req.headers.authorization;
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';

  if (!token) {
    res.status(401).json({ error: 'Iniciá sesión para continuar.' });
    return false;
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      res.status(401).json({ error: 'La sesión venció. Volvé a iniciar sesión.' });
      return false;
    }

    if (!response.ok) {
      console.error('Error al validar la sesión administrativa:', response.status);
      res.status(503).json({ error: 'No se pudo validar la sesión. Intentá nuevamente.' });
      return false;
    }

    const user = await response.json();
    if (typeof user.email !== 'string' || user.email.trim().toLowerCase() !== config.adminEmail) {
      res.status(403).json({ error: 'Esta cuenta no tiene acceso al panel.' });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al validar la sesión administrativa:', error.message);
    res.status(503).json({ error: 'No se pudo validar la sesión. Intentá nuevamente.' });
    return false;
  }
}

module.exports = { authorizeAdmin, getSupabaseAuthConfig };
