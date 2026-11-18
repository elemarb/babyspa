<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(array('error' => 'Método no permitido.'), JSON_UNESCAPED_UNICODE);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$rawPhone = is_array($body) && isset($body['telefono']) && is_string($body['telefono'])
    ? preg_replace('/\D/', '', $body['telefono'])
    : '';

if (strlen($rawPhone) < 8 || strlen($rawPhone) > 15) {
    http_response_code(422);
    echo json_encode(array('error' => 'El número de teléfono no es válido.'), JSON_UNESCAPED_UNICODE);
    exit;
}

$phone = strpos($rawPhone, '595') === 0
    ? substr($rawPhone, 3)
    : (strlen($rawPhone) === 10 && strpos($rawPhone, '0') === 0 ? substr($rawPhone, 1) : $rawPhone);

require_once __DIR__ . '/db.php';

try {
    $statement = $pdo->prepare(
        "WITH reservas_normalizadas AS (
            SELECT
                codigo,
                servicio,
                servicio_nombre,
                to_char(fecha, 'YYYY-MM-DD') AS fecha,
                left(hora, 5) AS hora,
                bebe_nombre,
                bebe_edad,
                estado,
                regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') AS telefono_digitos
            FROM public.reservas
        )
        SELECT codigo, servicio, servicio_nombre, fecha, hora, bebe_nombre, bebe_edad, estado
        FROM reservas_normalizadas
        WHERE CASE
            WHEN telefono_digitos LIKE '595%' THEN substring(telefono_digitos FROM 4)
            WHEN length(telefono_digitos) = 10 AND telefono_digitos LIKE '0%' THEN substring(telefono_digitos FROM 2)
            ELSE telefono_digitos
        END = :telefono
        ORDER BY fecha DESC, hora DESC
        LIMIT 100"
    );
    $statement->execute(array(':telefono' => $phone));

    echo json_encode(array('reservas' => $statement->fetchAll()), JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('No se pudieron consultar las reservas del cliente: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode(array('error' => 'No se pudieron cargar las reservas. Intentá nuevamente.'), JSON_UNESCAPED_UNICODE);
}
