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
    $stmt = $pdo->prepare(
        "UPDATE public.reservas
         SET estado = :estado
         WHERE codigo = :codigo
           AND NOT (estado = 'completada' AND :estado_cancelacion = 'cancelada')"
    );
    $stmt->execute(array(
        ':estado' => $nuevoEstado,
        ':codigo' => $codigo,
        ':estado_cancelacion' => $nuevoEstado
    ));

    if ($stmt->rowCount() === 0) {
        $consulta = $pdo->prepare('SELECT estado FROM public.reservas WHERE codigo = :codigo');
        $consulta->execute(array(':codigo' => $codigo));
        $reserva = $consulta->fetch(PDO::FETCH_ASSOC);

        if (!$reserva) {
            http_response_code(404);
            echo json_encode(array('success' => false, 'error' => 'No se encontró la reserva.'), JSON_UNESCAPED_UNICODE);
            exit;
        }
        if ($nuevoEstado === 'cancelada' && $reserva['estado'] === 'completada') {
            http_response_code(409);
            echo json_encode(array('success' => false, 'error' => 'Una reserva completada no se puede cancelar.'), JSON_UNESCAPED_UNICODE);
            exit;
        }

        http_response_code(409);
        echo json_encode(array('success' => false, 'error' => 'No se pudo actualizar el estado de la reserva.'), JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(array(
        'success' => true,
        'codigo' => $codigo,
        'nuevo_estado' => $nuevoEstado,
        'mensaje' => 'Estado actualizado correctamente.'
    ), JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
