<?php
/**
 * Baby Spa Paraguay - Endpoint de Consulta de Horarios Disponibles
 * Lee directamente desde Supabase / Neon o modo demo según configuración
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

// Obtener y sanitizar parámetros
$servicio = isset($_GET['servicio']) ? trim($_GET['servicio']) : 'hidroterapia';
$fecha = isset($_GET['fecha']) ? trim($_GET['fecha']) : date('Y-m-d');

// Validar formato de fecha YYYY-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de fecha inválido. Usar YYYY-MM-DD.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$diaSemana = date('w', strtotime($fecha)); // 0 = Domingo, 6 = Sábado

// Si es Domingo, el spa permanece cerrado
if ($diaSemana == 0) {
    echo json_encode([
        'fecha' => $fecha,
        'servicio' => $servicio,
        'horarios' => [],
        'mensaje' => 'Los domingos el spa permanece cerrado para descanso y desinfección profunda.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$hoy = date('Y-m-d');
$horaActual = date('H:i');
$horariosBase = $GLOBALS['HORARIOS_BASE'];

// Consultar horarios ocupados en la base de datos (Supabase / Neon)
try {
    $ocupadosEnBd = Database::getHorariosOcupados($fecha);
} catch (Exception $e) {
    error_log("Error al consultar BD: " . $e->getMessage());
    $ocupadosEnBd = [];
}

$horarios = [];

foreach ($horariosBase as $hora) {
    $disponible = true;

    // 1. Si es hoy y el horario ya pasó, marcar como no disponible
    if ($fecha === $hoy && $hora <= $horaActual) {
        $disponible = false;
    }
    // 2. Si ya existe una reserva activa para esa fecha y hora en la BD
    elseif (in_array($hora, $ocupadosEnBd)) {
        $disponible = false;
    }

    $horarios[] = [
        'hora' => $hora,
        'disponible' => $disponible
    ];
}

echo json_encode([
    'fecha' => $fecha,
    'servicio' => $servicio,
    'horarios' => $horarios,
    'proveedor' => getActiveProvider(),
    'ocupados_count' => count($ocupadosEnBd)
], JSON_UNESCAPED_UNICODE);
