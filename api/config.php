<?php
/**
 * Baby Spa Paraguay - Configuración de Base de Datos
 * Compatible con Supabase (API REST o PostgreSQL) y Neon (PostgreSQL Serverless)
 */

// Zona horaria de Asunción, Paraguay
date_default_timezone_set('America/Asuncion');

// ============================================================================
// 1. SELECCIÓN DE PROVEEDOR
// Opciones:
//   'supabase_api'  -> Conexión mediante API REST de Supabase (Recomendado para Supabase, no requiere drivers especiales)
//   'postgres_pdo'  -> Conexión PostgreSQL directa vía PDO (Ideal para Neon Database o Supabase Direct)
//   'auto'          -> Detecta automáticamente según las credenciales completadas
// ============================================================================
define('DB_PROVIDER', 'auto');

// ============================================================================
// 2. CONFIGURACIÓN SUPABASE (API REST)
// Obtené estos datos en: Supabase Dashboard -> Project Settings -> API
// ============================================================================
define('SUPABASE_URL', 'https://TU-PROYECTO.supabase.co');
define('SUPABASE_KEY', 'TU-SUPABASE-ANON-O-SERVICE-KEY');

// ============================================================================
// 3. CONFIGURACIÓN NEON / POSTGRESQL (PDO)
// Obtené estos datos en: Neon Console -> Connection Details
// Podés pegar el CONNECTION_STRING completo o los datos por separado.
// ============================================================================
define('NEON_DATABASE_URL', ''); // Ejemplo: 'postgresql://neondb_owner:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require'

// O de forma desglosada si no usás CONNECTION_STRING:
define('DB_HOST', 'ep-TU-ENDPOINT.us-east-2.aws.neon.tech');
define('DB_PORT', '5432');
define('DB_NAME', 'neondb');
define('DB_USER', 'neondb_owner');
define('DB_PASS', 'TU-PASSWORD');
define('DB_SSLMODE', 'require');

// ============================================================================
// 4. HORARIOS BASE Y SERVICIOS DEL SPA
// ============================================================================
$GLOBALS['HORARIOS_BASE'] = [
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

$GLOBALS['SERVICIOS_INFO'] = [
    'hidroterapia' => [
        'nombre' => 'Hidroterapia Infantil (30 min)',
        'duracion' => 30,
        'precio' => '₲ 150.000'
    ],
    'masaje' => [
        'nombre' => 'Masaje Infantil & Relajación (35 min)',
        'duracion' => 35,
        'precio' => '₲ 140.000'
    ],
    'estimulacion' => [
        'nombre' => 'Estimulación Temprana Acuática (40 min)',
        'duracion' => 40,
        'precio' => '₲ 180.000'
    ],
    'post-vacuna' => [
        'nombre' => 'Spa Post-Vacuna & Alivio (30 min)',
        'duracion' => 30,
        'precio' => '₲ 130.000'
    ]
];

// Helper: Determina el proveedor activo
function getActiveProvider() {
    $provider = DB_PROVIDER;
    if ($provider === 'auto') {
        // Verificar si se completó Supabase
        if (SUPABASE_URL !== 'https://TU-PROYECTO.supabase.co' && !empty(SUPABASE_URL) && !empty(SUPABASE_KEY) && SUPABASE_KEY !== 'TU-SUPABASE-ANON-O-SERVICE-KEY') {
            return 'supabase_api';
        }
        // Verificar si se completó Neon
        if (!empty(NEON_DATABASE_URL) || (DB_HOST !== 'ep-TU-ENDPOINT.us-east-2.aws.neon.tech' && !empty(DB_HOST) && DB_PASS !== 'TU-PASSWORD')) {
            return 'postgres_pdo';
        }
        // Por defecto o demo
        return 'demo_fallback';
    }
    return $provider;
}
