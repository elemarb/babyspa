<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(array('error' => 'Método no permitido.'), JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/db.php';

try {
    $statement = $pdo->query(
        'SELECT codigo, nombre, duracion_minutos, precio, activo
         FROM public.servicios
         WHERE activo = TRUE
         ORDER BY nombre'
    );
    $servicios = array_map(function ($row) {
        return array(
            'codigo' => $row['codigo'],
            'nombre' => $row['nombre'],
            'duracionMinutos' => (int) $row['duracion_minutos'],
            'precio' => (int) $row['precio'],
            'activo' => (bool) $row['activo']
        );
    }, $statement->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode(array('servicios' => $servicios), JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log('Error al cargar los servicios públicos: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(array('error' => 'No se pudieron cargar los servicios.'), JSON_UNESCAPED_UNICODE);
}
