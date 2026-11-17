<?php
/**
 * Baby Spa Paraguay - API para Listar Reservas
 * Compatible con PHP 5.6+
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../db.php';

$fecha = isset($_GET['fecha']) && !empty($_GET['fecha']) ? trim($_GET['fecha']) : null;
$estado = isset($_GET['estado']) && !empty($_GET['estado']) ? trim($_GET['estado']) : null;
$limite = isset($_GET['limite']) ? intval($_GET['limite']) : 50;

try {
    $reservas = Database::listarReservas($fecha, $estado, $limite);
    echo json_encode(array(
        'success' => true,
        'proveedor' => getActiveProvider(),
        'total' => count($reservas),
        'reservas' => $reservas
    ), JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
