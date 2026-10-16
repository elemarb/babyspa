/**
 * Baby Spa Paraguay - Interactive Booking System
 * Manejo de servicios, 14 días calendario, carga asíncrona de turnos y confirmación
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado de la reserva
  const state = {
    servicio: 'hidroterapia',
    servicioNombre: 'Hidroterapia Infantil (30 min)',
    fecha: '',
    hora: '',
    isLoadingSlots: false
  };

  const servicesInfo = {
    'hidroterapia': 'Hidroterapia Infantil (30 min)',
    'masaje': 'Masaje Infantil & Relajación (35 min)',
    'estimulacion': 'Estimulación Temprana Acuática (40 min)',
    'post-vacuna': 'Spa Post-Vacuna & Alivio (30 min)'
  };

  // Elementos del DOM
  const serviceButtons = document.querySelectorAll('.service-tab-btn');
  const daysContainer = document.getElementById('days-container');
  const slotsContainer = document.getElementById('slots-container');
  const slotsEmpty = document.getElementById('slots-empty');
  const selectedDateLabel = document.getElementById('selected-date-label');
  const bookingForm = document.getElementById('booking-form');
  const submitBtn = document.getElementById('submit-booking-btn');
  const confirmationModal = document.getElementById('confirmation-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
  const googleCalBtn = document.getElementById('google-cal-btn');

  // Inicializar días (próximos 14 días)
  const hoy = new Date();
  const diasSemanas = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(y, parseInt(m) - 1, d);
    const diaNombre = diasSemanas[date.getDay()];
    const mesNombre = meses[date.getMonth()];
    return `${diaNombre} ${parseInt(d)} de ${mesNombre}`;
  }

  // Renderizar los 14 días
  function renderDays() {
    daysContainer.innerHTML = '';
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(hoy.getDate() + i);
      const iso = formatDateISO(d);
      const diaSemanaIndex = d.getDay();
      const isDomingo = diaSemanaIndex === 0;

      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.className = `flex-shrink-0 flex flex-col items-center justify-center p-3 w-16 sm:w-20 rounded-2xl border transition-all duration-300 ${
        isDomingo 
          ? 'opacity-40 border-dashed border-[#ded4cd] bg-[#f9f4ef] cursor-not-allowed' 
          : 'border-[#EFE1D8] bg-white hover:border-[#F09CB0] hover:shadow-sm cursor-pointer'
      }`;
      dayBtn.dataset.date = iso;
      dayBtn.disabled = isDomingo;

      dayBtn.innerHTML = `
        <span class="text-xs font-semibold uppercase tracking-wider text-[#8A7A75]">${diasSemanas[diaSemanaIndex]}</span>
        <span class="text-xl font-bold font-heading text-[#5B4B47] mt-0.5">${d.getDate()}</span>
        <span class="text-[10px] text-[#8A7A75]">${meses[d.getMonth()]}</span>
      `;

      if (!isDomingo) {
        dayBtn.addEventListener('click', () => {
          selectDate(iso, dayBtn);
        });
      }

      daysContainer.appendChild(dayBtn);
    }

    // Seleccionar por defecto el primer día disponible (hoy o mañana si hoy es domingo)
    const firstAvailable = daysContainer.querySelector('button:not([disabled])');
    if (firstAvailable) {
      selectDate(firstAvailable.dataset.date, firstAvailable);
    }
  }

  function selectDate(isoDate, buttonElement) {
    state.fecha = isoDate;
    state.hora = '';
    updateSubmitButtonState();

    // Actualizar estilos activos de días
    daysContainer.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('bg-[#F09CB0]', 'text-white', 'border-[#e37f98]', 'shadow-md', 'scale-105');
      if (!btn.disabled) {
        btn.classList.add('bg-white', 'text-[#5B4B47]', 'border-[#EFE1D8]');
        btn.querySelector('span:nth-child(1)').classList.replace('text-white', 'text-[#8A7A75]');
        btn.querySelector('span:nth-child(2)').classList.replace('text-white', 'text-[#5B4B47]');
        btn.querySelector('span:nth-child(3)').classList.replace('text-white', 'text-[#8A7A75]');
      }
    });

    if (buttonElement) {
      buttonElement.classList.remove('bg-white', 'border-[#EFE1D8]');
      buttonElement.classList.add('bg-[#F09CB0]', 'border-[#e37f98]', 'shadow-md', 'scale-105');
      buttonElement.querySelectorAll('span').forEach(sp => {
        sp.classList.remove('text-[#8A7A75]', 'text-[#5B4B47]');
        sp.classList.add('text-white');
      });
    }

    selectedDateLabel.textContent = formatDisplayDate(isoDate);
    fetchSlots();
  }

  // Cargar horarios mediante API con skeleton loader
  async function fetchSlots() {
    state.isLoadingSlots = true;
    slotsEmpty.classList.add('hidden');
    slotsContainer.classList.remove('hidden');

    // Estado C3: Cargando (Skeleton en grilla)
    slotsContainer.innerHTML = Array(8).fill(0).map(() => `
      <div class="skeleton-box h-12 rounded-2xl w-full"></div>
    `).join('');

    try {
      const resp = await fetch(`api/horarios.php?servicio=${state.servicio}&fecha=${state.fecha}`);
      const data = await resp.json();

      slotsContainer.innerHTML = '';

      if (!data.horarios || data.horarios.length === 0) {
        // Estado C3: Sin horarios ese día
        slotsContainer.classList.add('hidden');
        slotsEmpty.classList.remove('hidden');
        return;
      }

      data.horarios.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.hora = slot.hora;

        if (slot.disponible) {
          // Estado C3: Disponible
          btn.className = 'slot-btn slot-available font-semibold py-2.5 px-3 rounded-2xl text-sm flex items-center justify-center gap-1.5 focus:outline-none';
          btn.setAttribute('aria-label', `Horario ${slot.hora} disponible`);
          btn.innerHTML = `<svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="2"/><path stroke-width="2" d="M12 7v5l3 3"/></svg> ${slot.hora}`;

          btn.addEventListener('click', () => {
            selectSlot(slot.hora, btn);
          });
        } else {
          // Estado C3: No disponible
          btn.className = 'slot-btn slot-disabled font-medium py-2.5 px-3 rounded-2xl text-sm flex items-center justify-center gap-1.5';
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
          btn.innerHTML = `<span class="opacity-50">✕</span> ${slot.hora}`;
        }

        slotsContainer.appendChild(btn);
      });

    } catch (err) {
      console.error('Error al cargar horarios:', err);
      slotsContainer.innerHTML = `<p class="text-sm text-red-500 col-span-full text-center py-4">No pudimos conectar con los horarios. Por favor intentá nuevamente.</p>`;
    } finally {
      state.isLoadingSlots = false;
    }
  }

  function selectSlot(hora, btnElement) {
    state.hora = hora;

    // Quitar selección previa
    slotsContainer.querySelectorAll('.slot-btn').forEach(b => {
      b.classList.remove('slot-selected');
      b.removeAttribute('aria-selected');
    });

    // Estado C3: Seleccionado
    btnElement.classList.add('slot-selected');
    btnElement.setAttribute('aria-selected', 'true');

    // Despejar error si había
    const slotError = document.getElementById('error-hora');
    if (slotError) slotError.classList.add('hidden');

    updateSubmitButtonState();
  }

  function updateSubmitButtonState() {
    const formValid = validateForm(false);
    if (state.hora && state.fecha && formValid) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    } else {
      submitBtn.disabled = false; // Permitir click para disparar validación inline visible
    }
  }

  // Cambio de pestaña de servicio
  serviceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const servicio = btn.dataset.servicio;
      setService(servicio);
    });
  });

  window.setBookingService = function(servicioKey) {
    setService(servicioKey);
    const reservasSection = document.getElementById('reservas');
    if (reservasSection) {
      reservasSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  function setService(servicioKey) {
    state.servicio = servicioKey;
    state.servicioNombre = servicesInfo[servicioKey] || 'Servicio de Spa';
    state.hora = '';

    serviceButtons.forEach(b => {
      if (b.dataset.servicio === servicioKey) {
        b.classList.remove('bg-white', 'text-[#5B4B47]', 'border-[#EFE1D8]');
        b.classList.add('bg-[#F09CB0]', 'text-white', 'border-[#e37f98]', 'shadow-sm');
      } else {
        b.classList.remove('bg-[#F09CB0]', 'text-white', 'border-[#e37f98]', 'shadow-sm');
        b.classList.add('bg-white', 'text-[#5B4B47]', 'border-[#EFE1D8]');
      }
    });

    if (state.fecha) {
      fetchSlots();
    }
  }

  // Validación de formulario
  function validateForm(showInlineErrors = true) {
    const bebeNombre = document.getElementById('bebe_nombre');
    const bebeEdad = document.getElementById('bebe_edad');
    const tutorNombre = document.getElementById('tutor_nombre');
    const telefono = document.getElementById('telefono');

    let isValid = true;

    // Validación Bebé Nombre
    const errBebeNombre = document.getElementById('error-bebe-nombre');
    if (!bebeNombre.value.trim()) {
      if (showInlineErrors) errBebeNombre.classList.remove('hidden');
      isValid = false;
    } else {
      errBebeNombre.classList.add('hidden');
    }

    // Validación Bebé Edad (1 a 36 meses)
    const errBebeEdad = document.getElementById('error-bebe-edad');
    const edadNum = parseInt(bebeEdad.value, 10);
    if (isNaN(edadNum) || edadNum <= 0 || edadNum > 36) {
      if (showInlineErrors) errBebeEdad.classList.remove('hidden');
      isValid = false;
    } else {
      errBebeEdad.classList.add('hidden');
    }

    // Validación Tutor
    const errTutor = document.getElementById('error-tutor-nombre');
    if (!tutorNombre.value.trim()) {
      if (showInlineErrors) errTutor.classList.remove('hidden');
      isValid = false;
    } else {
      errTutor.classList.add('hidden');
    }

    // Validación Teléfono
    const errTelefono = document.getElementById('error-telefono');
    if (!telefono.value.trim() || telefono.value.trim().length < 8) {
      if (showInlineErrors) errTelefono.classList.remove('hidden');
      isValid = false;
    } else {
      errTelefono.classList.add('hidden');
    }

    // Validación Selección de Horario
    const errHora = document.getElementById('error-hora');
    if (!state.hora) {
      if (showInlineErrors) errHora.classList.remove('hidden');
      isValid = false;
    } else {
      errHora.classList.add('hidden');
    }

    return isValid;
  }

  // Envío de Formulario
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm(true)) {
      return;
    }

    const payload = {
      servicio: state.servicio,
      fecha: state.fecha,
      hora: state.hora,
      bebe_nombre: document.getElementById('bebe_nombre').value.trim(),
      bebe_edad: document.getElementById('bebe_edad').value.trim(),
      tutor_nombre: document.getElementById('tutor_nombre').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      notas: document.getElementById('notas').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Confirmando reserva...
    `;

    try {
      const response = await fetch('api/reservar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();

      if (res.success) {
        showConfirmation(res.reserva);
        bookingForm.reset();
        state.hora = '';
        fetchSlots(); // Refrescar para marcar el turno ocupado
      } else {
        alert(res.error || 'Ocurrió un error al procesar tu turno.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al reservar. Por favor comunicate vía WhatsApp.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Confirmar reserva de turno ✨`;
    }
  });

  // Pantalla de Confirmación (Estado C3: Confirmado)
  function showConfirmation(reserva) {
    document.getElementById('confirm-codigo').textContent = reserva.codigo;
    document.getElementById('confirm-servicio').textContent = reserva.servicio;
    document.getElementById('confirm-fecha-hora').textContent = `${formatDisplayDate(reserva.fecha)} a las ${reserva.hora} hs`;
    document.getElementById('confirm-bebe').textContent = `${reserva.bebe_nombre} (${reserva.bebe_edad})`;
    document.getElementById('confirm-tutor').textContent = `${reserva.tutor_nombre} (${reserva.telefono})`;

    // Link WhatsApp para compartir
    const waText = encodeURIComponent(
      `¡Hola Lic. Rocío! Acabo de reservar un turno en Baby Spa Paraguay:\n` +
      `Código: ${reserva.codigo}\n` +
      `Bebé: ${reserva.bebe_nombre} (${reserva.bebe_edad})\n` +
      `Servicio: ${reserva.servicio}\n` +
      `Fecha: ${formatDisplayDate(reserva.fecha)} a las ${reserva.hora} hs.\n` +
      `Mamá/Papá: ${reserva.tutor_nombre}`
    );
    whatsappShareBtn.href = `https://wa.me/595981123456?text=${waText}`;

    // Link Google Calendar
    const startDateTime = reserva.fecha.replace(/-/g, '') + 'T' + reserva.hora.replace(':', '') + '00';
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Sesión en Baby Spa Paraguay - ' + reserva.bebe_nombre)}&dates=${startDateTime}/${startDateTime}&details=${encodeURIComponent('Turno confirmado: ' + reserva.servicio + ' para ' + reserva.bebe_nombre + '. Lugar: Barrio Herrera, Asunción.')}&location=${encodeURIComponent('Baby Spa Paraguay, Asunción')}`;
    googleCalBtn.href = calUrl;

    confirmationModal.classList.remove('hidden');
    confirmationModal.classList.add('flex');
  }

  closeModalBtn.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
    confirmationModal.classList.remove('flex');
  });

  // Iniciar calendario
  renderDays();
});
