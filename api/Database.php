<?php
/**
 * Database.php – Clase helper estática para interactuar con Supabase/Neon.
 * Utiliza la conexión PDO definida en api/db.php.
 * Provee los métodos que los endpoints esperan:
 *   - getHorariosOcupados(string $fecha): array
 *   - existeReservaEnHorario(string $fecha, string $hora): bool
 *   - crearReserva(array $data): int (id insertado)
 */

require_once __DIR__ . '/db.php';

class Database {
    /**
     * Obtiene la lista de horas ya reservadas para una fecha concreta.
     * Devuelve un array simple de strings (ej. ['09:00','10:30']).
     */
    public static function getHorariosOcupados($fecha) {
        global $pdo;
        $stmt = $pdo->prepare(
            "SELECT hora FROM reservas WHERE fecha = :fecha AND estado = 'confirmada'"
        );
        $stmt->execute([':fecha' => $fecha]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Verifica si ya existe una reserva para la combinación fecha/hora.
     * Devuelve true si está ocupada, false si está libre.
     */
    public static function existeReservaEnHorario($fecha, $hora) {
        global $pdo;
        $stmt = $pdo->prepare(
            "SELECT 1 FROM reservas WHERE fecha = :fecha AND hora = :hora AND estado = 'confirmada' LIMIT 1"
        );
        $stmt->execute([':fecha' => $fecha, ':hora' => $hora]);
        return $stmt->fetchColumn() !== false;
    }

    /**
     * Crea una reserva en la tabla `reservas`.
     * $data debe contener las claves:
     *   codigo, servicio, fecha, hora, bebe_nombre, bebe_edad,
     *   tutor_nombre, telefono, notas, estado
     * Retorna el ID autogenerado (bigserial) de la fila insertada.
     */
    public static function probarConexion() {
        try {
            // Simple query to verify connection
            global $pdo;
            $pdo->query('SELECT 1');
            return ['success'=>true,'mensaje'=>'Conexión a la base de datos exitosa.','sugerencia'=>''];
        } catch (Exception $e) {
            return ['success'=>false,'mensaje'=>'Error al conectar a la base de datos.','sugerencia'=>$e->getMessage()];
        }
    }

        global $pdo;
        $sql = "INSERT INTO reservas (codigo, servicio, fecha, hora, bebe_nombre, bebe_edad, tutor_nombre, telefono, notas, estado)
                VALUES (:codigo, :servicio, :fecha, :hora, :bebe_nombre, :bebe_edad, :tutor_nombre, :telefono, :notas, :estado)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':codigo'       => $data['codigo'],
            ':servicio'     => $data['servicio'],
            ':fecha'        => $data['fecha'],
            ':hora'         => $data['hora'],
            ':bebe_nombre'  => $data['bebe_nombre'],
            ':bebe_edad'    => $data['bebe_edad'],
            ':tutor_nombre' => $data['tutor_nombre'],
            ':telefono'     => $data['telefono'],
            ':notas'        => $data['notas'],
            ':estado'       => $data['estado'] ?? 'confirmada',
        ]);
        return $pdo->lastInsertId();
    }
}
?>