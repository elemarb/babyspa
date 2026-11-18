<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$servicio = isset($_GET['servicio']) ? trim($_GET['servicio']) : '';
$fecha = isset($_GET['fecha']) ? trim($_GET['fecha']) : date('Y-m-d');
$fechaValidada = DateTime::createFromFormat('!Y-m-d', $fecha, new DateTimeZone('America/Asuncion'));

if (!$fechaValidada || $fechaValidada->format('Y-m-d') !== $fecha) {
    http_response_code(400);
    echo json_encode(array('error' => 'Formato de fecha inválido. Usar YYYY-MM-DD.'), JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $servicioQuery = $pdo->prepare(
        'SELECT codigo FROM public.servicios WHERE codigo = :codigo AND activo = TRUE'
    );
    $servicioQuery->execute(array(':codigo' => $servicio));
    if (!$servicioQuery->fetchColumn()) {
        http_response_code(400);
        echo json_encode(array('error' => 'El servicio no está disponible.'), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($fechaValidada->format('w') === '0') {
        echo json_encode(array('fecha' => $fecha, 'servicio' => $servicio, 'horarios' => array()), JSON_UNESCAPED_UNICODE);
        exit;
    }

    $ocupadosQuery = $pdo->prepare(
        "SELECT hora FROM public.reservas WHERE fecha = :fecha AND estado <> 'cancelada'"
    );
    $ocupadosQuery->execute(array(':fecha' => $fecha));
    $ocupados = array_map(function ($hora) {
        return substr((string) $hora, 0, 5);
    }, $ocupadosQuery->fetchAll(PDO::FETCH_COLUMN));

    $zonaHoraria = new DateTimeZone('America/Asuncion');
    $ahora = new DateTime('now', $zonaHoraria);
    $hoy = $ahora->format('Y-m-d');
    $horaActual = $ahora->format('H:i');
    $horarios = array();

    foreach ($GLOBALS['HORARIOS_BASE'] as $hora) {
        $horarios[] = array(
            'hora' => $hora,
            'disponible' => !($fecha === $hoy && $hora <= $horaActual) && !in_array($hora, $ocupados, true)
        );
    }

    echo json_encode(array('fecha' => $fecha, 'servicio' => $servicio, 'horarios' => $horarios), JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log('Error al consultar horarios: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(array('error' => 'No pudimos conectar con los horarios. Por favor intentá nuevamente.'), JSON_UNESCAPED_UNICODE);
}
