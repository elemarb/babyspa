# Skill: Desarrollador de Dashboard CMS y Reservas (PHP + MySQL + Tailwind)

## 🎯 Objetivo General
Este skill capacita al agente para generar un panel de administración (Dashboard) modular, un Sistema de Gestión de Contenidos (CMS) básico y un motor de reservas online libre de solapamientos horarios.

## 💻 Stack Tecnológico Obligatorio
- **Frontend:** HTML5, Tailwind CSS (vía CDN), Vanilla JavaScript (ES6+, Fetch API).
- **Backend:** PHP 8+ limpio (orientado a objetos o procedural ordenado con PDO).
- **Base de Datos:** MySQL / MariaDB.
- **Arquitectura:** API RESTful que retorne e interactúe exclusivamente mediante JSON.

## 🏗️ Estructura de Archivos Estándar
El agente debe estructurar el proyecto utilizando el siguiente árbol de directorios:
├── api/
│   ├── conexion.php
│   ├── cms/
│   │   ├── leer.php
│   │   └── actualizar.php
│   └── reservas/
│       ├── crear.php
│       ├── listar.php
│       └── actualizar_estado.php
├── admin/
│   ├── index.html (Dashboard / Métricas)
│   ├── cms.html (Gestión de contenidos)
│   ├── reservas.html (Gestión de citas/turnos)
│   └── js/
│       ├── cms.js
│       └── reservas.js
└── schema.sql

## 📊 Reglas de Negocio e Instrucciones Críticas

### 1. Base de Datos (schema.sql)
- Diseñar tablas para `usuarios` (con contraseñas usando `PASSWORD_HASH`), `contenidos` (llave-valor para textos del CMS) y `reservas`.
- La tabla de reservas debe almacenar: cliente, email, fecha, hora_inicio, hora_fin y estado (pendiente, confirmada, cancelada).

### 2. Control de Overbooking (Validación en PHP)
Antes de insertar cualquier registro en la tabla `reservas`, el backend DEBE ejecutar una consulta de verificación para asegurar que el rango horario no esté pisando otra reserva activa:
```sql
SELECT COUNT(*) FROM reservas 
WHERE fecha = :fecha 
AND estado != 'cancelada'
AND (hora_inicio < :hora_fin AND font_fin > :hora_inicio)
```
Si el conteo es mayor a 0, la API debe responder inmediatamente con un código HTTP 400 y un JSON de error.

### 3. Frontend Limpio (Tailwind + Vanilla JS)
- No utilizar frameworks pesados como React o Vue. Todo debe renderizarse inyectando HTML dinámico a través de `document.getElementById().innerHTML` o métodos similares.
- Utilizar componentes visuales modernos de Tailwind CSS: barras laterales (sidebar) oscuras, tarjetas de métricas (KPIs) con bordes redondeados y tablas con estados pintados mediante Badges de colores (verde para confirmado, amarillo para pendiente, rojo para cancelado).

### 4. Seguridad de la API
- Todas las respuestas deben incluir cabeceras JSON apropiadas (`Content-Type: application/json`).
- Utilizar única y exclusivamente consultas preparadas con PDO (`$stmt->prepare`) para mitigar ataques de Inyección SQL.
