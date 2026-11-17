<?php
/**
 * Baby Spa Paraguay - Verificador y Diagnóstico de Conexión a Base de Datos
 * Visita este archivo en tu navegador: http://localhost/baby_spa/api/test_conexion.php
 */

header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/db.php';

$test = Database::probarConexion();
$provider = getActiveProvider();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico de Conexión | Baby Spa Paraguay</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Quicksand', sans-serif; background-color: #FFF8F0; color: #5B4B47; }
        h1, h2, h3 { font-family: 'Fredoka', sans-serif; }
    </style>
</head>
<body class="p-6 sm:p-12">
    <div class="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-lg border border-[#EFE1D8]">
        
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-[#EFE1D8]">
            <img src="../logo/logo.png" alt="Baby Spa" class="h-12 w-auto" onerror="this.style.display='none'">
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-[#5B4B47]">Diagnóstico de Conexión a Base de Datos</h1>
                <p class="text-sm text-[#8A7A75]">Gestor de reservas: Supabase (REST API) o Neon (PostgreSQL)</p>
            </div>
        </div>

        <!-- Estado actual -->
        <div class="mb-8 p-6 rounded-2xl <?php echo $test['success'] ? 'bg-[#d9edf6] border border-[#b2d9ea]' : 'bg-[#fadce2] border border-[#f5b8c6]'; ?>">
            <div class="flex items-start gap-4">
                <span class="text-3xl"><?php echo $test['success'] ? '✅' : '⚠️'; ?></span>
                <div>
                    <h2 class="text-lg font-bold text-[#5B4B47]">
                        Proveedor detectado: <span class="uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/70 text-sm"><?php echo htmlspecialchars($provider); ?></span>
                    </h2>
                    <p class="text-sm mt-1 text-[#5B4B47]">
                        <?php echo htmlspecialchars($test['mensaje']); ?>
                    </p>
                    <?php if (!empty($test['sugerencia'])): ?>
                        <p class="text-xs mt-2 font-semibold text-[#8A7A75]">
                            💡 Sugerencia: <?php echo htmlspecialchars($test['sugerencia']); ?>
                        </p>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Instrucciones según proveedor -->
        <div class="space-y-6">
            <h3 class="text-xl font-bold text-[#5B4B47]">¿Cómo conectar tu Base de Datos?</h3>

            <!-- Opción 1: Supabase -->
            <div class="p-6 rounded-2xl border border-[#EFE1D8] bg-[#FFF8F0]/60">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-base text-[#5B4B47] flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-[#3ECF8E] text-white flex items-center justify-center text-xs font-black">S</span>
                        Opción A: Supabase (Recomendado, vía API REST)
                    </h4>
                    <span class="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full">Sin instalar nada</span>
                </div>
                <ol class="list-decimal list-inside text-sm text-[#5B4B47] space-y-2">
                    <li>Entrá a tu panel de <a href="https://supabase.com" target="_blank" class="text-[#F09CB0] font-bold underline">Supabase</a> y abrí tu proyecto.</li>
                    <li>Andá a <strong>SQL Editor</strong>, abrí el archivo <code class="bg-white px-1.5 py-0.5 rounded border border-[#EFE1D8]">schema.sql</code> de esta carpeta y ejecutalo con <strong>Run</strong>.</li>
                    <li>Andá a <strong>Project Settings &rarr; API</strong> y copiá:
                        <ul class="list-disc list-inside ml-4 mt-1 text-xs text-[#8A7A75]">
                            <li><strong>Project URL</strong> (ej. <code>https://xyz.supabase.co</code>)</li>
                            <li><strong>anon public key</strong> (o service_role key)</li>
                        </ul>
                    </li>
                    <li>Abrí el archivo <code class="bg-white px-1.5 py-0.5 rounded border border-[#EFE1D8]">api/config.php</code> y pegalos en <code>SUPABASE_URL</code> y <code>SUPABASE_KEY</code>.</li>
                </ol>
            </div>

            <!-- Opción 2: Neon -->
            <div class="p-6 rounded-2xl border border-[#EFE1D8] bg-[#FFF8F0]/60">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-base text-[#5B4B47] flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-[#00E599] text-black flex items-center justify-center text-xs font-black">N</span>
                        Opción B: Neon Database (PostgreSQL Serverless)
                    </h4>
                    <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">PostgreSQL nativo</span>
                </div>
                <ol class="list-decimal list-inside text-sm text-[#5B4B47] space-y-2">
                    <li>Entrá a tu consola de <a href="https://neon.tech" target="_blank" class="text-[#F09CB0] font-bold underline">Neon</a>.</li>
                    <li>En <strong>SQL Editor</strong>, ejecutá el archivo <code class="bg-white px-1.5 py-0.5 rounded border border-[#EFE1D8]">schema.sql</code>.</li>
                    <li>En el <strong>Dashboard</strong>, copiá tu cadena de conexión (Connection string) en formato <code>postgresql://...</code>.</li>
                    <li>Pegala en <code>NEON_DATABASE_URL</code> dentro de <code class="bg-white px-1.5 py-0.5 rounded border border-[#EFE1D8]">api/config.php</code>.</li>
                </ol>
            </div>
        </div>

        <div class="mt-8 pt-6 border-t border-[#EFE1D8] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8A7A75]">
            <span>PHP <?php echo PHP_VERSION; ?> con soporte cURL y PDO pgsql activado.</span>
            <a href="../index.php#reservas" class="text-white bg-[#F09CB0] hover:bg-[#E37F98] font-bold py-2 px-5 rounded-full shadow-sm transition-all">
                Ir a la Landing de Reservas &rarr;
            </a>
        </div>

    </div>
</body>
</html>
