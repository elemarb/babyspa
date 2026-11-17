# Baby Spa Paraguay

Landing page y calendario de reservas para el spa.

## Despliegue en Vercel

Las funciones de horarios y reservas usan PostgreSQL. Configurá `SUPABASE_CONNECTION_STRING` en las variables de entorno del proyecto de Vercel para los entornos que quieras desplegar. También se acepta `DATABASE_URL`.

Los archivos `.php` se mantienen para el desarrollo en servidores PHP, pero Vercel los excluye del despliegue. Las rutas antiguas `/api/horarios.php` y `/api/reservar.php` se reescriben a sus funciones Node.js correspondientes.

## Panel de administración

El panel en línea está en `/admin/` y usa Supabase Auth. Creá la cuenta del administrador en Supabase → Authentication → Users y configurá en Vercel `ADMIN_EMAIL` con el correo autorizado, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (también se acepta `SUPABASE_ANON_KEY`). El panel no permite registrarse y sus funciones de reservas verifican la sesión y el correo autorizado en el servidor.
