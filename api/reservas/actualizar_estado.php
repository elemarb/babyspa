<?php
/**
 * Baby Spa Paraguay - API para Actualizar Estado de Reserva
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
    echo json_encode(array('success' => false, 'error' => 'Solo se admite método POST.'));
    exit;
}

require_once __DIR__ . '/../db.php';

$inputRaw = file_get_contents('php://input');
$data = json_decode($inputRaw, true);
if (!$data) {
    $data = $_POST;
}

$codigo = isset($data['codigo']) ? trim($data['codigo']) : '';
$nuevoEstado = isset($data['estado']) ? trim($data['estado']) : '';

$estadosValidos = array('confirmada', 'completada', 'cancelada');

if (empty($codigo) || !in_array($nuevoEstado, $estadosValidos)) {
    http_response_code(422);
    echo json_encode(array(
        'success' => false,
        'error' => 'Código de reserva o estado inválido. Estados permitidos: confirmada, completada, cancelada.'
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $actualizado = Database::actualizarEstado($codigo, $nuevoEstado);
    echo json_encode(array(
        'success' => $actualizado,
        'codigo' => $codigo,
        'nuevo_estado' => $nuevoEstado,
        'mensaje' => $actualizado ? 'Estado actualizado correctamente.' : 'No se pudo actualizar la reserva.'
    ), JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
