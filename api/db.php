<?php
/**
 * db.php – Conexión a Supabase (PostgreSQL) usando PDO.
 * Lee variables del .env (creado en el paso 1).
 */

$dotenvPath = __DIR__ . '/../.env';
if (file_exists($dotenvPath)) {
    $lines = file($dotenvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;   // Ignorar comentarios
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

// Obtener la cadena de conexión
$connectionStr = $_ENV['SUPABASE_CONNECTION_STRING'] ?? '';
if (empty($connectionStr)) {
    die('❌  SUPABASE_CONNECTION_STRING no está definida en .env');
}

// Parsear la URL
$parts = parse_url($connectionStr);
$host = $parts['host'] ?? '';
$port = $parts['port'] ?? 5432;
$user = $parts['user'] ?? '';
$pass = $parts['pass'] ?? '';
$db   = ltrim($parts['path'], '/');

$dsn = "pgsql:host=$host;port=$port;dbname=$db";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    die('❌  Error de conexión a Supabase: ' . $e->getMessage());
}
?>