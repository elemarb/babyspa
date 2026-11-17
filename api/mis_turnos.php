<?php
/**
 * Baby Spa Paraguay - Consulta de Turnos del Cliente
 * Permite al cliente ver sus turnos activos sin registrar cuenta ni contraseñas,
 * utilizando su número de celular o sus códigos guardados en el navegador.
 * Compatible con PHP 5.6+
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

$telefono = isset($_GET['telefono']) ? trim($_GET['telefono']) : '';
$codigosRaw = isset($_GET['codigos']) ? trim($_GET['codigos']) : '';

if (empty($telefono) && empty($codigosRaw)) {
    echo json_encode(array(
        'success' => true,
        'turnos' => array()
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

$codigos = array();
if (!empty($codigosRaw)) {
    $partes = explode(',', $codigosRaw);
    foreach ($partes as $p) {
        $p = trim($p);
        if (!empty($p)) $codigos[] = $p;
    }
}

// Consultar en base de datos
try {
    $provider = getActiveProvider();
    $turnos = array();

    if ($provider === 'supabase_api') {
        // En Supabase buscar por teléfono o por código
        if (!empty($telefono)) {
            $telLimpio = preg_replace('/\D/', '', $telefono);
            // Buscar por teléfono exacto o que contenga los últimos 8 dígitos
            $subTel = substr($telLimpio, -8);
            $endpoint = 'reservas?telefono=like.*' . urlencode($subTel) . '*&estado=neq.cancelada&order=fecha.desc,hora.asc';
            $res = Database::listarReservas(null, 'confirmada', 20);
            // Filtrar las que coinciden con el teléfono o códigos
            foreach ($res as $r) {
                $rTel = preg_replace('/\D/', '', isset($r['telefono']) ? $r['telefono'] : '');
                $rCod = isset($r['codigo']) ? $r['codigo'] : '';
                if ((!empty($subTel) && strpos($rTel, $subTel) !== false) || in_array($rCod, $codigos)) {
                    $turnos[] = $r;
                }
            }
        } elseif (!empty($codigos)) {
            $res = Database::listarReservas(null, null, 50);
            foreach ($res as $r) {
                if (in_array($r['codigo'], $codigos)) {
                    $turnos[] = $r;
                }
            }
        }
    } elseif ($provider === 'postgres_pdo') {
        $pdo = Database::probarConexion(); // O conexión pdo
        $all = Database::listarReservas(null, null, 100);
        $subTel = !empty($telefono) ? substr(preg_replace('/\D/', '', $telefono), -8) : '';

        foreach ($all as $r) {
            $rTel = preg_replace('/\D/', '', isset($r['telefono']) ? $r['telefono'] : '');
            $rCod = isset($r['codigo']) ? $r['codigo'] : '';
            if ((!empty($subTel) && strpos($rTel, $subTel) !== false) || in_array($rCod, $codigos)) {
                $turnos[] = $r;
            }
        }
    }

    echo json_encode(array(
        'success' => true,
        'total' => count($turnos),
        'turnos' => $turnos
    ), JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
