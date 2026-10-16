<?php
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
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

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

// Validaciones
$errores = [];
if (empty($servicio)) $errores['servicio'] = 'Por favor seleccioná un servicio.';
if (empty($fecha)) $errores['fecha'] = 'La fecha es obligatoria.';
if (empty($hora)) $errores['hora'] = 'Por favor elegí un horario disponible.';
if (empty($bebeNombre)) $errores['bebe_nombre'] = 'El nombre de tu bebé es necesario.';
if ($bebeEdad <= 0 || $bebeEdad > 36) $errores['bebe_edad'] = 'Ingresá la edad en meses (1 a 36 meses).';
if (empty($tutorNombre)) $errores['tutor_nombre'] = 'Ingresá tu nombre y apellido.';
if (empty($telefono) || strlen($telefono) < 8) $errores['telefono'] = 'Ingresá un número de WhatsApp o teléfono válido.';

if (!empty($errores)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'errors' => $errores
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Generar código de reserva simulado
$codigoReserva = 'BSP-' . date('Y') . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 5));

$serviciosNombres = [
    'hidroterapia' => 'Hidroterapia Infantil (30 min)',
    'masaje' => 'Masaje Infantil & Relajación (35 min)',
    'estimulacion' => 'Estimulación Temprana Acuática (40 min)',
    'post-vacuna' => 'Spa Post-Vacuna & Alivio (30 min)'
];

$nombreServicioLegible = isset($serviciosNombres[$servicio]) ? $serviciosNombres[$servicio] : ucfirst($servicio);

// Simulación de guardado exitoso
echo json_encode([
    'success' => true,
    'codigo' => $codigoReserva,
    'mensaje' => '¡Reserva confirmada con éxito!',
    'reserva' => [
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
    ]
], JSON_UNESCAPED_UNICODE);
