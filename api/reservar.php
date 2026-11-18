<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Método no permitido. Solo se acepta POST.'), JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;

$servicio = isset($data['servicio']) ? trim($data['servicio']) : '';
$fecha = isset($data['fecha']) ? trim($data['fecha']) : '';
$hora = isset($data['hora']) ? trim($data['hora']) : '';
$bebeNombre = isset($data['bebe_nombre']) ? trim($data['bebe_nombre']) : '';
$edad = isset($data['bebe_edad']) ? filter_var($data['bebe_edad'], FILTER_VALIDATE_INT) : false;
$tutorNombre = isset($data['tutor_nombre']) ? trim($data['tutor_nombre']) : '';
$telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
$notas = isset($data['notas']) ? trim($data['notas']) : '';
$errores = array();

if ($servicio === '') $errores['servicio'] = 'Por favor seleccioná un servicio.';
$fechaValidada = DateTime::createFromFormat('!Y-m-d', $fecha, new DateTimeZone('America/Asuncion'));
if (!$fechaValidada || $fechaValidada->format('Y-m-d') !== $fecha) $errores['fecha'] = 'La fecha es obligatoria y debe ser válida.';
if (!in_array($hora, $GLOBALS['HORARIOS_BASE'], true)) $errores['hora'] = 'Por favor elegí un horario disponible.';
if ($bebeNombre === '') $errores['bebe_nombre'] = 'El nombre de tu bebé es necesario.';
if ($edad === false || $edad < 1 || $edad > 36) $errores['bebe_edad'] = 'Ingresá la edad en meses (1 a 36 meses).';
if ($tutorNombre === '') $errores['tutor_nombre'] = 'Ingresá tu nombre y apellido.';
if (strlen(preg_replace('/\D/', '', $telefono)) < 8) $errores['telefono'] = 'Ingresá un número de teléfono válido (mínimo 8 dígitos).';

if ($errores) {
    http_response_code(422);
    echo json_encode(array('success' => false, 'errors' => $errores, 'error' => reset($errores)), JSON_UNESCAPED_UNICODE);
    exit;
}

$zonaHoraria = new DateTimeZone('America/Asuncion');
$ahora = new DateTime('now', $zonaHoraria);
if ($fechaValidada->format('w') === '0') {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Los domingos el spa permanece cerrado. Por favor elegí otro día.'), JSON_UNESCAPED_UNICODE);
    exit;
}
if ($fecha < $ahora->format('Y-m-d') ||
    ($fecha === $ahora->format('Y-m-d') && $hora <= $ahora->format('H:i'))) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Ese horario ya pasó. Por favor elegí otro.'), JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $servicioQuery = $pdo->prepare(
        'SELECT nombre, duracion_minutos FROM public.servicios WHERE codigo = :codigo AND activo = TRUE'
    );
    $servicioQuery->execute(array(':codigo' => $servicio));
    $servicioRow = $servicioQuery->fetch(PDO::FETCH_ASSOC);
    if (!$servicioRow) {
        http_response_code(422);
        echo json_encode(array(
            'success' => false,
            'errors' => array('servicio' => 'El servicio seleccionado ya no está disponible.'),
            'error' => 'El servicio seleccionado ya no está disponible.'
        ), JSON_UNESCAPED_UNICODE);
        exit;
    }

    $servicioNombre = $servicioRow['nombre'] . ' (' . (int) $servicioRow['duracion_minutos'] . ' min)';
    $ocupadoQuery = $pdo->prepare(
        "SELECT 1 FROM public.reservas WHERE fecha = :fecha AND hora = :hora AND estado <> 'cancelada' LIMIT 1"
    );
    $ocupadoQuery->execute(array(':fecha' => $fecha, ':hora' => $hora));
    if ($ocupadoQuery->fetchColumn()) {
        http_response_code(409);
        echo json_encode(array('success' => false, 'error' => 'Ese horario ya fue reservado. Por favor seleccioná otro.'), JSON_UNESCAPED_UNICODE);
        exit;
    }

    $codigo = 'BSP-' . $ahora->format('Y') . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
    $insert = $pdo->prepare(
        "INSERT INTO public.reservas
            (codigo, servicio, servicio_nombre, fecha, hora, bebe_nombre, bebe_edad, tutor_nombre, telefono, notas, estado)
         VALUES
            (:codigo, :servicio, :servicio_nombre, :fecha, :hora, :bebe_nombre, :bebe_edad, :tutor_nombre, :telefono, :notas, 'confirmada')"
    );
    $insert->execute(array(
        ':codigo' => $codigo,
        ':servicio' => $servicio,
        ':servicio_nombre' => $servicioNombre,
        ':fecha' => $fecha,
        ':hora' => $hora,
        ':bebe_nombre' => $bebeNombre,
        ':bebe_edad' => $edad,
        ':tutor_nombre' => $tutorNombre,
        ':telefono' => $telefono,
        ':notas' => $notas
    ));

    http_response_code(201);
    echo json_encode(array(
        'success' => true,
        'codigo' => $codigo,
        'mensaje' => '¡Reserva confirmada con éxito!',
        'reserva' => array(
            'codigo' => $codigo,
            'servicio' => $servicioNombre,
            'fecha' => $fecha,
            'hora' => $hora,
            'bebe_nombre' => $bebeNombre,
            'bebe_edad' => $edad . ' meses',
            'tutor_nombre' => $tutorNombre,
            'telefono' => $telefono,
            'notas' => $notas,
            'lugar' => 'Baby Spa Paraguay - Asunción (Barrio Herrera)'
        )
    ), JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    if ($e->getCode() === '23505' || $e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(array('success' => false, 'error' => 'Ese horario ya fue reservado. Por favor seleccioná otro.'), JSON_UNESCAPED_UNICODE);
    } elseif ($e->getCode() === '23503') {
        http_response_code(422);
        echo json_encode(array('success' => false, 'error' => 'El servicio seleccionado ya no está disponible.'), JSON_UNESCAPED_UNICODE);
    } else {
        error_log('Error al guardar la reserva: ' . $e->getMessage());
        http_response_code(503);
        echo json_encode(array('success' => false, 'error' => 'No pudimos guardar la reserva. Por favor intentá nuevamente.'), JSON_UNESCAPED_UNICODE);
    }
}
