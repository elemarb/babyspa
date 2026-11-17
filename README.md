# Baby Spa Paraguay

Landing page y calendario de reservas para el spa.

## Despliegue en Vercel

Las funciones de horarios y reservas usan PostgreSQL. Configurá `SUPABASE_CONNECTION_STRING` en las variables de entorno del proyecto de Vercel para los entornos que quieras desplegar. También se acepta `DATABASE_URL`.

Los archivos `.php` se mantienen para el desarrollo en servidores PHP, pero Vercel los excluye del despliegue. Las rutas antiguas `/api/horarios.php` y `/api/reservar.php` se reescriben a sus funciones Node.js correspondientes.
