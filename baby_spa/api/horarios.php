<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Obtener parámetros
$servicio = isset($_GET['servicio']) ? trim($_GET['servicio']) : 'hidroterapia';
$fecha = isset($_GET['fecha']) ? trim($_GET['fecha']) : date('Y-m-d');

// Validar formato de fecha YYYY-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de fecha inválido']);
    exit;
}

$diaSemana = date('w', strtotime($fecha)); // 0 = Domingo, 6 = Sábado

// Si es Domingo, el spa permanece cerrado
if ($diaSemana == 0) {
    echo json_encode([
        'fecha' => $fecha,
        'servicio' => $servicio,
        'horarios' => []
    ]);
    exit;
}

// Horarios base de atención
$horariosBase = [
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

$hoy = date('Y-m-d');
$horaActual = date('H:i');

$horarios = [];

// Generador determinista de disponibilidad para que se sienta real y consistente
foreach ($horariosBase as $index => $hora) {
    $disponible = true;

    // Si es hoy y el horario ya pasó, no está disponible
    if ($fecha === $hoy && $hora <= $horaActual) {
        $disponible = false;
    } else {
        // Semilla basada en fecha + servicio + horario para simular ocupación realista y consistente
        $seed = crc32($fecha . $servicio . $hora);
        // ~35% de los horarios marcados como ocupados
        if (($seed % 100) < 35) {
            $disponible = false;
        }
    }

    $horarios[] = [
        'hora' => $hora,
        'disponible' => $disponible
    ];
}

echo json_encode([
    'fecha' => $fecha,
    'servicio' => $servicio,
    'horarios' => $horarios
], JSON_UNESCAPED_UNICODE);
