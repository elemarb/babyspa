<?php
/**
 * Baby Spa Paraguay - Panel de Gestión de Turnos y Reservas
 * Compatible con PHP 5.6+ y Tailwind CSS
 */
require_once __DIR__ . '/../api/config.php';
require_once __DIR__ . '/../api/db.php';

$testConexion = Database::probarConexion();
$provider = getActiveProvider();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Turnos | Baby Spa Paraguay</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Quicksand', sans-serif; background-color: #F8F9FA; color: #5B4B47; }
        h1, h2, h3, .font-heading { font-family: 'Fredoka', sans-serif; }
    </style>
</head>
<body class="min-h-screen flex flex-col">

    <!-- Header / Navbar Superior -->
    <header class="bg-white border-b border-[#EFE1D8] sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-4">
            <a href="../index.php" class="flex items-center gap-2">
                <img src="../logo/logo.png" alt="Baby Spa" class="h-10 w-auto" onerror="this.style.display='none'">
                <div>
                    <h1 class="text-xl font-bold font-heading text-[#5B4B47]">Baby Spa Paraguay</h1>
                    <p class="text-xs text-[#8A7A75]">Panel de Administración de Turnos</p>
                </div>
            </a>
        </div>

        <div class="flex items-center gap-3">
            <!-- Badge Proveedor DB -->
            <a href="../api/test_conexion.php" target="_blank" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold <?php echo $testConexion['success'] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'; ?> transition-all hover:shadow-sm">
                <span class="w-2 h-2 rounded-full <?php echo $testConexion['success'] ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'; ?>"></span>
                <span>DB: <strong><?php echo htmlspecialchars($provider); ?></strong></span>
                <span class="text-[10px] underline ml-1">ver test</span>
            </a>

            <a href="../index.php#reservas" target="_blank" class="bg-[#F09CB0] hover:bg-[#E37F98] text-white text-xs font-bold py-2 px-4 rounded-full transition-all shadow-sm">
                Ver Landing Web &rarr;
            </a>
        </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
        
        <!-- Barra de Controles y Filtros -->
        <div class="bg-white rounded-3xl p-6 border border-[#EFE1D8] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold font-heading text-[#5B4B47]">Turnos del Spa</h2>
                <p class="text-xs text-[#8A7A75] mt-0.5">Consultá, confirmá o cancelá reservas sincronizadas con Supabase/Neon</p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <!-- Filtro de Fecha -->
                <div class="flex items-center gap-2 bg-[#FFF8F0] border border-[#EFE1D8] rounded-2xl px-3 py-1.5">
                    <label for="filtro-fecha" class="text-xs font-bold text-[#8A7A75]">Fecha:</label>
                    <input type="date" id="filtro-fecha" value="<?php echo date('Y-m-d'); ?>" class="bg-transparent text-sm font-semibold text-[#5B4B47] focus:outline-none">
                </div>

                <!-- Botón Hoy -->
                <button type="button" id="btn-hoy" class="bg-white border border-[#EFE1D8] hover:border-[#F09CB0] text-xs font-bold text-[#5B4B47] px-3 py-2 rounded-2xl transition-all">
                    Hoy
                </button>

                <!-- Filtro de Estado -->
                <select id="filtro-estado" class="bg-[#FFF8F0] border border-[#EFE1D8] rounded-2xl px-3 py-2 text-xs font-semibold text-[#5B4B47] focus:outline-none">
                    <option value="">Todos los estados</option>
                    <option value="confirmada" selected>Confirmadas</option>
                    <option value="completada">Completadas</option>
                    <option value="cancelada">Canceladas</option>
                </select>

                <!-- Botón Recargar -->
                <button type="button" id="btn-recargar" class="bg-[#D9EDF6] hover:bg-[#c5e4f3] text-[#3b5059] text-xs font-bold px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Actualizar
                </button>
            </div>
        </div>

        <!-- Tabla de Reservas -->
        <div class="bg-white rounded-3xl border border-[#EFE1D8] shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-[#FFF8F0] text-xs uppercase tracking-wider text-[#8A7A75] border-b border-[#EFE1D8]">
                        <tr>
                            <th class="py-4 px-6 font-bold">Horario / Código</th>
                            <th class="py-4 px-6 font-bold">Bebé</th>
                            <th class="py-4 px-6 font-bold">Mamá / Papá (Contacto)</th>
                            <th class="py-4 px-6 font-bold">Servicio</th>
                            <th class="py-4 px-6 font-bold">Estado</th>
                            <th class="py-4 px-6 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-reservas-body" class="divide-y divide-[#EFE1D8]">
                        <tr>
                            <td colspan="6" class="text-center py-12 text-[#8A7A75]">
                                <svg class="animate-spin h-6 w-6 text-[#F09CB0] mx-auto mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                Cargando turnos desde la base de datos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Estado Vacío -->
            <div id="estado-vacio" class="hidden text-center py-16 px-4">
                <div class="w-16 h-16 bg-[#FFF8F0] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-[#EFE1D8]">
                    👶
                </div>
                <h3 class="font-bold text-lg text-[#5B4B47]">No hay turnos registrados</h3>
                <p class="text-xs text-[#8A7A75] mt-1 max-w-sm mx-auto">No se encontraron reservas con los filtros seleccionados para esta fecha.</p>
            </div>
        </div>

    </main>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const filtroFecha = document.getElementById('filtro-fecha');
        const filtroEstado = document.getElementById('filtro-estado');
        const btnHoy = document.getElementById('btn-hoy');
        const btnRecargar = document.getElementById('btn-recargar');
        const tablaBody = document.getElementById('tabla-reservas-body');
        const estadoVacio = document.getElementById('estado-vacio');

        btnHoy.addEventListener('click', () => {
            const hoy = new Date();
            const y = hoy.getFullYear();
            const m = String(hoy.getMonth() + 1).padStart(2, '0');
            const d = String(hoy.getDate()).padStart(2, '0');
            filtroFecha.value = `${y}-${m}-${d}`;
            cargarReservas();
        });

        filtroFecha.addEventListener('change', cargarReservas);
        filtroEstado.addEventListener('change', cargarReservas);
        btnRecargar.addEventListener('click', cargarReservas);

        async function cargarReservas() {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-10 text-[#8A7A75]">
                        <svg class="animate-spin h-6 w-6 text-[#F09CB0] mx-auto mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                        Actualizando turnos...
                    </td>
                </tr>
            `;
            estadoVacio.classList.add('hidden');

            const fecha = filtroFecha.value;
            const estado = filtroEstado.value;
            const url = `../api/reservas/listar.php?fecha=${encodeURIComponent(fecha)}&estado=${encodeURIComponent(estado)}`;

            try {
                const resp = await fetch(url);
                const data = await resp.json();

                if (!data.reservas || data.reservas.length === 0) {
                    tablaBody.innerHTML = '';
                    estadoVacio.classList.remove('hidden');
                    return;
                }

                tablaBody.innerHTML = '';
                estadoVacio.classList.add('hidden');

                data.reservas.forEach(r => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-[#FFF8F0]/40 transition-colors';

                    // Badges de estado
                    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    let estadoLabel = 'Confirmada';
                    if (r.estado === 'completada') {
                        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                        estadoLabel = 'Completada';
                    } else if (r.estado === 'cancelada') {
                        badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 line-through opacity-75';
                        estadoLabel = 'Cancelada';
                    }

                    // Limpiar teléfono para WhatsApp (remover caracteres especiales)
                    const telLimpio = String(r.telefono || '').replace(/\D/g, '');
                    const waNumber = telLimpio.startsWith('595') ? telLimpio : (telLimpio.startsWith('0') ? '595' + telLimpio.substring(1) : '595' + telLimpio);

                    tr.innerHTML = `
                        <td class="py-4 px-6">
                            <span class="font-heading font-bold text-base text-[#5B4B47] block">${r.hora} hs</span>
                            <span class="text-[11px] font-mono text-[#8A7A75] bg-gray-100 px-1.5 py-0.5 rounded">${r.codigo}</span>
                        </td>
                        <td class="py-4 px-6">
                            <strong class="text-[#5B4B47] text-sm font-bold block">${escapeHtml(r.bebe_nombre)}</strong>
                            <span class="text-xs text-[#8A7A75]">${r.bebe_edad} meses</span>
                        </td>
                        <td class="py-4 px-6">
                            <span class="text-sm font-semibold text-[#5B4B47] block">${escapeHtml(r.tutor_nombre)}</span>
                            <a href="https://wa.me/${waNumber}" target="_blank" class="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-0.5">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                ${escapeHtml(r.telefono)}
                            </a>
                        </td>
                        <td class="py-4 px-6">
                            <span class="text-xs font-semibold text-[#5B4B47] block">${escapeHtml(r.servicio_nombre || r.servicio)}</span>
                            ${r.notas ? `<p class="text-[11px] text-[#8A7A75] italic mt-0.5 max-w-xs truncate" title="${escapeHtml(r.notas)}">"${escapeHtml(r.notas)}"</p>` : ''}
                        </td>
                        <td class="py-4 px-6">
                            <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}">
                                ${estadoLabel}
                            </span>
                        </td>
                        <td class="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                            ${r.estado !== 'completada' ? `
                                <button onclick="cambiarEstado('${r.codigo}', 'completada')" class="text-xs font-bold bg-[#D9EDF6] hover:bg-[#c5e4f3] text-[#3b5059] px-2.5 py-1.5 rounded-xl transition-all" title="Marcar como atendido">
                                    ✓ Completar
                                </button>
                            ` : ''}
                            ${r.estado !== 'cancelada' && r.estado !== 'completada' ? `
                                <button onclick="cambiarEstado('${r.codigo}', 'cancelada')" class="text-xs font-bold bg-[#FADCE2] hover:bg-[#f5b8c6] text-[#c04362] px-2.5 py-1.5 rounded-xl transition-all" title="Cancelar turno y liberar horario">
                                    ✕ Cancelar
                                </button>
                            ` : ''}
                        </td>
                    `;

                    tablaBody.appendChild(tr);
                });

            } catch (err) {
                console.error(err);
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-8 text-rose-500 text-xs">
                            Error al cargar turnos. Verificá la conexión con la base de datos.
                        </td>
                    </tr>
                `;
            }
        }

        window.cambiarEstado = async function(codigo, nuevoEstado) {
            const accion = nuevoEstado === 'cancelada' ? 'cancelar este turno y liberar el horario' : 'marcar como completada';
            if (!confirm(`¿Estás seguro de que deseas ${accion}?`)) return;

            try {
                const resp = await fetch('../api/reservas/actualizar_estado.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ codigo, estado: nuevoEstado })
                });
                const res = await resp.json();
                if (res.success) {
                    cargarReservas();
                } else {
                    alert(res.error || 'No se pudo actualizar el estado.');
                }
            } catch (err) {
                console.error(err);
                alert('Error al comunicarse con el servidor.');
            }
        };

        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, m => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[m]);
        }

        // Carga inicial
        cargarReservas();
    });
    </script>
</body>
</html>
