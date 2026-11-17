<?php
/**
 * Baby Spa Paraguay - Endpoint de Creación de Reservas
 * Valida disponibilidad y guarda en Supabase / Neon
 * Compatible con PHP 5.6+
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Método no permitido. Solo se acepta POST.'));
    exit;
}

require_once __DIR__ . '/db.php';

// Obtener payload (JSON o Form)
$inputRaw = file_get_contents('php://input');
$data = json_decode($inputRaw, true);
if (!$data) {
    $data = $_POST;
}

$servicio   = isset($data['servicio'])   ? trim($data['servicio'])   : '';
$fecha      = isset($data['fecha'])      ? trim($data['fecha'])      : '';
$hora       = isset($data['hora'])       ? trim($data['hora'])       : '';
$bebeNombre = isset($data['bebe_nombre']) ? trim($data['bebe_nombre']) : '';
$bebeEdad   = isset($data['bebe_edad'])   ? intval($data['bebe_edad']) : 0;
$tutorNombre= isset($data['tutor_nombre'])? trim($data['tutor_nombre']): '';
$telefono   = isset($data['telefono'])   ? trim($data['telefono'])   : '';
$notas      = isset($data['notas'])      ? trim($data['notas'])      : '';

// Validaciones del servidor
$errores = array();
if (empty($servicio))   $errores['servicio']   = 'Por favor seleccioná un servicio.';
if (empty($fecha) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) $errores['fecha'] = 'La fecha es obligatoria y debe ser válida.';
if (empty($hora)) $errores['hora'] = 'Por favor elegí un horario disponible.';
if (empty($bebeNombre)) $errores['bebe_nombre'] = 'El nombre de tu bebé es necesario.';
if ($bebeEdad <= 0 || $bebeEdad > 36) $errores['bebe_edad'] = 'Ingresá la edad en meses (1 a 36 meses).';
if (empty($tutorNombre)) $errores['tutor_nombre'] = 'Ingresá tu nombre y apellido.';
if (empty($telefono) || strlen($telefono) < 8) $errores['telefono'] = 'Ingresá un número de WhatsApp o teléfono válido (mínimo 8 dígitos).';

if (!empty($errores)) {
    http_response_code(422);
    echo json_encode(array(
        'success' => false,
        'errors'  => $errores,
        'error'   => reset($errores)
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// No permitir reservas en domingo
$diaSemana = date('w', strtotime($fecha));
if ($diaSemana == 0) {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'error'   => 'Los domingos el spa permanece cerrado. Por favor elegí otro día.'
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// Verificar si el horario ya está reservado
try {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM reservas WHERE fecha = :fecha AND hora = :hora');
    $stmt->execute(array(':fecha' => $fecha, ':hora' => $hora));
    $existe = $stmt->fetchColumn();
    if ($existe > 0) {
        http_response_code(409);
        echo json_encode(array(
            'success' => false,
            'error'   => "Lo sentimos, el horario de las $hora hs para el día $fecha ya fue reservado. Por favor seleccioná otro horario disponible."
        ), JSON_UNESCAPED_UNICODE);
        exit;
    }
} catch (Exception $e) {
    error_log('Error al verificar disponibilidad: ' . $e->getMessage());
    // Continuar; en caso de error la reserva podrá fallar al intentar insertar.
}

// Generar código único de reserva
$codigoReserva = 'BSP-' . date('Y') . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 5));

// Insertar la reserva
try {
    $insert = $pdo->prepare(
        'INSERT INTO reservas (codigo, servicio, fecha, hora, bebe_nombre, bebe_edad, tutor_nombre, telefono, notas, estado) VALUES '
        . '(:codigo, :servicio, :fecha, :hora, :bebe_nombre, :bebe_edad, :tutor_nombre, :telefono, :notas, :estado)'
    );
    $insert->execute(array(
        ':codigo'       => $codigoReserva,
        ':servicio'     => $servicio,
        ':fecha'        => $fecha,
        ':hora'         => $hora,
        ':bebe_nombre'  => $bebeNombre,
        ':bebe_edad'    => $bebeEdad,
        ':tutor_nombre' => $tutorNombre,
        ':telefono'     => $telefono,
        ':notas'        => $notas,
        ':estado'       => 'confirmada'
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error'   => 'Error al guardar la reserva: ' . $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// Responder con éxito
http_response_code(201);
echo json_encode(array(
    'success' => true,
    'codigo'  => $codigoReserva,
    'mensaje' => '¡Reserva confirmada con éxito!',
    'reserva' => array(
        'codigo'        => $codigoReserva,
        'servicio'      => $servicio,
        'fecha'         => $fecha,
        'hora'          => $hora,
        'bebe_nombre'   => $bebeNombre,
        'bebe_edad'     => $bebeEdad . ' meses',
        'tutor_nombre'  => $tutorNombre,
        'telefono'      => $telefono,
        'notas'         => $notas,
        'lugar'         => 'Baby Spa Paraguay - Asunción (Barrio Herrera)'
    )
), JSON_UNESCAPED_UNICODE);
?>
/**
 * Baby Spa Paraguay - Endpoint de Creación de Reservas
 * Valida disponibilidad y guarda en Supabase / Neon
 * Compatible con PHP 5.6+
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Método no permitido. Solo se acepta POST.'));
    exit;
}

require_once __DIR__ . '/db.php';

// Obtener payload (JSON o Form)
$inputRaw = file_get_contents('php://input');
$data = json_decode($inputRaw, true);

if (!$data) {
    $data = $_POST;
}

$servicio = isset($data['servicio']) ? trim($data['servicio']) : '';
$fecha = isset($data['fecha']) ? trim($data['fecha']) : '';
$hora = isset($data['hora']) ? trim($data['hora']) : '';
$bebeNombre = isset($data['bebe_nombre']) ? trim($data['bebe_nombre']) : '';
$bebeEdad = isset($data['bebe_edad']) ? intval($data['bebe_edad']) : 0;
$tutorNombre = isset($data['tutor_nombre']) ? trim($data['tutor_nombre']) : '';
$telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
$notas = isset($data['notas']) ? trim($data['notas']) : '';

// Validaciones del servidor
$errores = array();
if (empty($servicio)) $errores['servicio'] = 'Por favor seleccioná un servicio.';
if (empty($fecha) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) $errores['fecha'] = 'La fecha es obligatoria y debe ser válida.';
if (empty($hora)) $errores['hora'] = 'Por favor elegí un horario disponible.';
if (empty($bebeNombre)) $errores['bebe_nombre'] = 'El nombre de tu bebé es necesario.';
if ($bebeEdad <= 0 || $bebeEdad > 36) $errores['bebe_edad'] = 'Ingresá la edad en meses (1 a 36 meses).';
if (empty($tutorNombre)) $errores['tutor_nombre'] = 'Ingresá tu nombre y apellido.';
if (empty($telefono) || strlen($telefono) < 8) $errores['telefono'] = 'Ingresá un número de WhatsApp o teléfono válido (mínimo 8 dígitos).';

if (!empty($errores)) {
    http_response_code(422);
    echo json_encode(array(
        'success' => false,
        'errors' => $errores,
        'error' => reset($errores)
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Validar que no sea domingo
$diaSemana = date('w', strtotime($fecha));
if ($diaSemana == 0) {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'error' => 'Los domingos el spa permanece cerrado. Por favor elegí otro día.'
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Control de Overbooking (prevenir duplicidad de horario)
try {
    if (Database::existeReservaEnHorario($fecha, $hora)) {
        http_response_code(409);
        echo json_encode(array(
            'success' => false,
            'error' => 'Lo sentimos, el horario de las ' . $hora . ' hs para el día ' . $fecha . ' ya fue reservado por otra familia. Por favor seleccioná otro horario disponible.'
        ), JSON_UNESCAPED_UNICODE);
        exit;
    }
} catch (Exception $e) {
    error_log("Error al verificar disponibilidad en BD: " . $e->getMessage());
}

// Generar código único de reserva (ej. BSP-2026-F8A2D)
$codigoReserva = 'BSP-' . date('Y') . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 5));

$serviciosInfo = $GLOBALS['SERVICIOS_INFO'];
$nombreServicioLegible = isset($serviciosInfo[$servicio]['nombre']) 
    ? $serviciosInfo[$servicio]['nombre'] 
    : ucfirst($servicio);

$datosParaGuardar = array(
    'codigo' => $codigoReserva,
    'servicio' => $servicio,
    'servicio_nombre' => $nombreServicioLegible,
    'fecha' => $fecha,
    'hora' => $hora,
    'bebe_nombre' => $bebeNombre,
    'bebe_edad' => $bebeEdad,
    'tutor_nombre' => $tutorNombre,
    'telefono' => $telefono,
    'notas' => $notas,
    'estado' => 'confirmada'
);

// 3. Guardar en Base de Datos (Supabase o Neon)
try {
    $reservaGuardada = Database::crearReserva($datosParaGuardar);
} catch (Exception $e) {
    http_response_code(409);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. Responder con éxito
http_response_code(201);
echo json_encode(array(
    'success' => true,
    'codigo' => $codigoReserva,
    'mensaje' => '¡Reserva confirmada con éxito!',
    'proveedor' => getActiveProvider(),
    'reserva' => array(
        'codigo' => $codigoReserva,
        'servicio_id' => $servicio,
        'servicio' => $nombreServicioLegible,
        'fecha' => $fecha,
        'hora' => $hora,
        'bebe_nombre' => $bebeNombre,
        'bebe_edad' => $bebeEdad . ' meses',
        'tutor_nombre' => $tutorNombre,
        'telefono' => $telefono,
        'notas' => $notas,
        'lugar' => 'Baby Spa Paraguay - Asunción (Barrio Herrera)'
    )
), JSON_UNESCAPED_UNICODE);
