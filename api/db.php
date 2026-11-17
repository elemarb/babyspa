<?php
/**
 * Baby Spa Paraguay - Capa de Acceso a Datos
 * Compatible con PHP 5.6+ hasta PHP 8.4+
 * Implementa conectores para Supabase (REST API) y Neon / Postgres (PDO)
 */

require_once __DIR__ . '/config.php';

class Database {
    private static $pdo = null;

    /**
     * Prueba la conexión con el proveedor configurado
     * @return array
     */
    public static function probarConexion() {
        $provider = getActiveProvider();

        if ($provider === 'demo_fallback') {
            return array(
                'success' => false,
                'provider' => 'demo_fallback',
                'mensaje' => 'Aún no se han configurado credenciales reales en api/config.php. La web funciona en modo simulación.',
                'instrucciones' => 'Copia tus credenciales de Supabase o Neon en api/config.php y corre el archivo schema.sql en tu consola SQL.'
            );
        }

        if ($provider === 'supabase_api') {
            return self::probarSupabaseApi();
        }

        if ($provider === 'postgres_pdo') {
            return self::probarPostgresPdo();
        }

        return array(
            'success' => false,
            'provider' => $provider,
            'mensaje' => 'Proveedor de base de datos desconocido.'
        );
    }

    /**
     * Obtiene los horarios reservados para una fecha dada (excluyendo canceladas)
     * @param string $fecha
     * @return array
     */
    public static function getHorariosOcupados($fecha) {
        $provider = getActiveProvider();

        if ($provider === 'supabase_api') {
            return self::getHorariosOcupadosSupabase($fecha);
        }

        if ($provider === 'postgres_pdo') {
            return self::getHorariosOcupadosPdo($fecha);
        }

        // Fallback demo determinista
        return self::getHorariosOcupadosDemo($fecha);
    }

    /**
     * Verifica si un horario específico ya está ocupado en la fecha indicada
     * @param string $fecha
     * @param string $hora
     * @return bool
     */
    public static function existeReservaEnHorario($fecha, $hora) {
        $provider = getActiveProvider();

        if ($provider === 'supabase_api') {
            return self::existeReservaSupabase($fecha, $hora);
        }

        if ($provider === 'postgres_pdo') {
            return self::existeReservaPdo($fecha, $hora);
        }

        return false;
    }

    /**
     * Inserta una nueva reserva en la base de datos
     * @param array $datos
     * @return array
     */
    public static function crearReserva($datos) {
        $provider = getActiveProvider();

        if ($provider === 'supabase_api') {
            return self::crearReservaSupabase($datos);
        }

        if ($provider === 'postgres_pdo') {
            return self::crearReservaPdo($datos);
        }

        // Modo demo
        return $datos;
    }

    /**
     * Lista reservas con filtros (para administración)
     * @param string|null $fecha
     * @param string|null $estado
     * @param int $limite
     * @return array
     */
    public static function listarReservas($fecha = null, $estado = null, $limite = 50) {
        $provider = getActiveProvider();

        if ($provider === 'supabase_api') {
            return self::listarReservasSupabase($fecha, $estado, $limite);
        }

        if ($provider === 'postgres_pdo') {
            return self::listarReservasPdo($fecha, $estado, $limite);
        }

        return array();
    }

    /**
     * Actualiza el estado de una reserva (confirmada, completada, cancelada)
     * @param string $codigo
     * @param string $nuevoEstado
     * @return bool
     */
    public static function actualizarEstado($codigo, $nuevoEstado) {
        $provider = getActiveProvider();

        if ($provider === 'supabase_api') {
            return self::actualizarEstadoSupabase($codigo, $nuevoEstado);
        }

        if ($provider === 'postgres_pdo') {
            return self::actualizarEstadoPdo($codigo, $nuevoEstado);
        }

        return true;
    }

    // ========================================================================
    // IMPLEMENTACIÓN: SUPABASE REST API (cURL)
    // ========================================================================

    private static function ejecutarSupabaseCurl($endpoint, $metodo = 'GET', $body = null, $headersExtra = array()) {
        $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/' . ltrim($endpoint, '/');
        
        $headers = array(
            'apikey: ' . SUPABASE_KEY,
            'Authorization: Bearer ' . SUPABASE_KEY,
            'Content-Type: application/json',
            'Accept: application/json'
        );

        foreach ($headersExtra as $h) {
            $headers[] = $h;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $respuesta = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errorCurl = curl_error($ch);
        curl_close($ch);

        if ($errorCurl) {
            throw new Exception("Error de conexión cURL con Supabase: " . $errorCurl);
        }

        $data = json_decode($respuesta, true);

        return array(
            'code' => $httpCode,
            'data' => $data,
            'raw' => $respuesta
        );
    }

    private static function probarSupabaseApi() {
        try {
            $res = self::ejecutarSupabaseCurl('reservas?select=id&limit=1', 'GET');
            if ($res['code'] >= 200 && $res['code'] < 300) {
                return array(
                    'success' => true,
                    'provider' => 'supabase_api',
                    'mensaje' => 'Conexión exitosa con la API de Supabase. Tabla "reservas" encontrada y lista.',
                    'url' => SUPABASE_URL
                );
            } else {
                $msg = isset($res['data']['message']) ? $res['data']['message'] : $res['raw'];
                return array(
                    'success' => false,
                    'provider' => 'supabase_api',
                    'mensaje' => "Supabase respondió con código HTTP " . $res['code'] . ": " . $msg,
                    'sugerencia' => 'Asegurate de haber ejecutado schema.sql en el SQL Editor de Supabase y de tener el RLS configurado.'
                );
            }
        } catch (Exception $e) {
            return array(
                'success' => false,
                'provider' => 'supabase_api',
                'mensaje' => $e->getMessage()
            );
        }
    }

    private static function getHorariosOcupadosSupabase($fecha) {
        $endpoint = 'reservas?fecha=eq.' . urlencode($fecha) . '&estado=neq.cancelada&select=hora';
        $res = self::ejecutarSupabaseCurl($endpoint);
        
        $ocupados = array();
        if ($res['code'] === 200 && is_array($res['data'])) {
            foreach ($res['data'] as $item) {
                if (!empty($item['hora'])) {
                    $horaLimpia = substr($item['hora'], 0, 5);
                    $ocupados[] = $horaLimpia;
                }
            }
        }
        return array_unique($ocupados);
    }

    private static function existeReservaSupabase($fecha, $hora) {
        $endpoint = 'reservas?fecha=eq.' . urlencode($fecha) . '&hora=eq.' . urlencode($hora) . '&estado=neq.cancelada&select=id&limit=1';
        $res = self::ejecutarSupabaseCurl($endpoint);
        return ($res['code'] === 200 && is_array($res['data']) && count($res['data']) > 0);
    }

    private static function crearReservaSupabase($datos) {
        $headersExtra = array('Prefer: return=representation');
        $res = self::ejecutarSupabaseCurl('reservas', 'POST', $datos, $headersExtra);

        if ($res['code'] === 201 || $res['code'] === 200) {
            if (is_array($res['data']) && count($res['data']) > 0) {
                return $res['data'][0];
            }
            return $datos;
        }

        // Manejar colisión de horario por índice único
        $raw = $res['raw'];
        if (strpos($raw, 'idx_unique_active_booking') !== false || strpos($raw, 'duplicate key') !== false) {
            throw new Exception("El horario seleccionado ya fue reservado por otra familia. Por favor elegí otro horario disponible.");
        }

        $errorMsg = isset($res['data']['message']) ? $res['data']['message'] : "Error " . $res['code'] . " al guardar en Supabase";
        throw new Exception("Error al guardar en Supabase: " . $errorMsg);
    }

    private static function listarReservasSupabase($fecha, $estado, $limite) {
        $params = array('select=*', 'order=fecha.desc,hora.asc', 'limit=' . $limite);
        if (!empty($fecha)) {
            $params[] = 'fecha=eq.' . urlencode($fecha);
        }
        if (!empty($estado)) {
            $params[] = 'estado=eq.' . urlencode($estado);
        }
        $endpoint = 'reservas?' . implode('&', $params);
        $res = self::ejecutarSupabaseCurl($endpoint);

        return ($res['code'] === 200 && is_array($res['data'])) ? $res['data'] : array();
    }

    private static function actualizarEstadoSupabase($codigo, $nuevoEstado) {
        $endpoint = 'reservas?codigo=eq.' . urlencode($codigo);
        $res = self::ejecutarSupabaseCurl($endpoint, 'PATCH', array('estado' => $nuevoEstado));
        return ($res['code'] >= 200 && $res['code'] < 300);
    }

    // ========================================================================
    // IMPLEMENTACIÓN: POSTGRESQL PDO (Neon Serverless / Supabase Direct)
    // ========================================================================

    private static function getPdo() {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $host = DB_HOST;
        $port = DB_PORT;
        $dbname = DB_NAME;
        $user = DB_USER;
        $pass = DB_PASS;
        $sslmode = DB_SSLMODE;

        // Si se configuró NEON_DATABASE_URL completa, parsearla
        if (defined('NEON_DATABASE_URL') && strlen(NEON_DATABASE_URL) > 0) {
            $parsed = parse_url(NEON_DATABASE_URL);
            if ($parsed) {
                if (isset($parsed['host'])) $host = $parsed['host'];
                if (isset($parsed['port'])) $port = $parsed['port'];
                if (isset($parsed['user'])) $user = $parsed['user'];
                if (isset($parsed['pass'])) $pass = $parsed['pass'];
                if (!empty($parsed['path'])) {
                    $dbname = ltrim($parsed['path'], '/');
                }
                if (!empty($parsed['query'])) {
                    parse_str($parsed['query'], $q);
                    if (isset($q['sslmode'])) {
                        $sslmode = $q['sslmode'];
                    }
                }
            }
        }

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode={$sslmode}";
        
        $options = array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 8
        );

        self::$pdo = new PDO($dsn, $user, $pass, $options);
        return self::$pdo;
    }

    private static function probarPostgresPdo() {
        try {
            $pdo = self::getPdo();
            $stmt = $pdo->query("SELECT 1 FROM reservas LIMIT 1");
            return array(
                'success' => true,
                'provider' => 'postgres_pdo',
                'mensaje' => 'Conexión exitosa a PostgreSQL (Neon / Supabase). Tabla "reservas" encontrada.',
                'host' => DB_HOST
            );
        } catch (PDOException $e) {
            return array(
                'success' => false,
                'provider' => 'postgres_pdo',
                'mensaje' => 'Error de conexión PostgreSQL: ' . $e->getMessage(),
                'sugerencia' => 'Verificá los datos del host, usuario, password y que hayas ejecutado schema.sql en la consola de Neon/PostgreSQL.'
            );
        }
    }

    private static function getHorariosOcupadosPdo($fecha) {
        try {
            $pdo = self::getPdo();
            $stmt = $pdo->prepare("SELECT hora FROM reservas WHERE fecha = :fecha AND estado != 'cancelada'");
            $stmt->execute(array(':fecha' => $fecha));
            $horas = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $limpios = array();
            foreach ($horas as $h) {
                $limpios[] = substr($h, 0, 5);
            }
            return array_unique($limpios);
        } catch (Exception $e) {
            error_log("Error getHorariosOcupadosPdo: " . $e->getMessage());
            return array();
        }
    }

    private static function existeReservaPdo($fecha, $hora) {
        try {
            $pdo = self::getPdo();
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservas WHERE fecha = :fecha AND (hora = :hora OR hora LIKE :horaLike) AND estado != 'cancelada'");
            $stmt->execute(array(
                ':fecha' => $fecha,
                ':hora' => $hora,
                ':horaLike' => $hora . '%'
            ));
            return ($stmt->fetchColumn() > 0);
        } catch (Exception $e) {
            error_log("Error existeReservaPdo: " . $e->getMessage());
            return false;
        }
    }

    private static function crearReservaPdo($datos) {
        $pdo = self::getPdo();

        $sql = "INSERT INTO reservas (codigo, servicio, servicio_nombre, fecha, hora, bebe_nombre, bebe_edad, tutor_nombre, telefono, notas, estado)
                VALUES (:codigo, :servicio, :servicio_nombre, :fecha, :hora, :bebe_nombre, :bebe_edad, :tutor_nombre, :telefono, :notas, :estado)
                RETURNING *";

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array(
                ':codigo' => $datos['codigo'],
                ':servicio' => $datos['servicio'],
                ':servicio_nombre' => $datos['servicio_nombre'],
                ':fecha' => $datos['fecha'],
                ':hora' => $datos['hora'],
                ':bebe_nombre' => $datos['bebe_nombre'],
                ':bebe_edad' => $datos['bebe_edad'],
                ':tutor_nombre' => $datos['tutor_nombre'],
                ':telefono' => $datos['telefono'],
                ':notas' => isset($datos['notas']) ? $datos['notas'] : '',
                ':estado' => isset($datos['estado']) ? $datos['estado'] : 'confirmada'
            ));

            $res = $stmt->fetch();
            return $res ? $res : $datos;
        } catch (PDOException $e) {
            if ($e->getCode() === '23505' || strpos($e->getMessage(), 'idx_unique_active_booking') !== false) {
                throw new Exception("El horario seleccionado ya fue reservado por otra familia. Por favor elegí otro horario disponible.");
            }
            throw new Exception("Error al insertar reserva en Neon/PostgreSQL: " . $e->getMessage());
        }
    }

    private static function listarReservasPdo($fecha, $estado, $limite) {
        try {
            $pdo = self::getPdo();
            $conditions = array();
            $params = array();

            if (!empty($fecha)) {
                $conditions[] = "fecha = :fecha";
                $params[':fecha'] = $fecha;
            }
            if (!empty($estado)) {
                $conditions[] = "estado = :estado";
                $params[':estado'] = $estado;
            }

            $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";
            $sql = "SELECT * FROM reservas {$where} ORDER BY fecha DESC, hora ASC LIMIT " . intval($limite);

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("Error listarReservasPdo: " . $e->getMessage());
            return array();
        }
    }

    private static function actualizarEstadoPdo($codigo, $nuevoEstado) {
        try {
            $pdo = self::getPdo();
            $stmt = $pdo->prepare("UPDATE reservas SET estado = :estado WHERE codigo = :codigo");
            return $stmt->execute(array(':estado' => $nuevoEstado, ':codigo' => $codigo));
        } catch (Exception $e) {
            error_log("Error actualizarEstadoPdo: " . $e->getMessage());
            return false;
        }
    }

    // ========================================================================
    // SIMULACIÓN DEMO DETERMINISTA (Cuando aún no se cargaron credenciales)
    // ========================================================================

    private static function getHorariosOcupadosDemo($fecha) {
        $ocupados = array();
        $horarios = $GLOBALS['HORARIOS_BASE'];

        foreach ($horarios as $hora) {
            $seed = crc32($fecha . $hora);
            if (($seed % 100) < 35) {
                $ocupados[] = $hora;
            }
        }
        return $ocupados;
    }
}
