/**
 * Baby Spa Paraguay - Interactive Booking System
 * Sistema de Reservas con Gestión de Identidad de Cliente sin Login (Estilo Silla Libre)
 * Soporta almacenamiento persistente mediante Cookies (365 días) + LocalStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado de la reserva en curso
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

  const defaultBookingMessage = [
    '¡Hola! Acabo de reservar un turno en [negocio]:',
    'Código: [codigo]',
    'Bebé: [nombre] ([edad])',
    'Servicio: [servicio] ([minutos] minutos)',
    'Fecha: [fecha] a las [hora] hs. Mamá/Papá: [tutor]'
  ].join('\n');
  let businessSettings = {
    businessName: 'Baby Spa Paraguay',
    address: 'Barrio Herrera / Villa Morra, Asunción, Paraguay',
    whatsapp: '595981123456',
    instagram: 'babyspaparaguay',
    bookingMessage: defaultBookingMessage
  };

  // Elementos del DOM
  const serviceButtons = document.querySelectorAll('.service-tab-btn');
  const daysContainer = document.getElementById('days-container');
  const slotsContainer = document.getElementById('slots-container');
  const slotsEmpty = document.getElementById('slots-empty');
  const selectedDateLabel = document.getElementById('selected-date-label');
  const bookingForm = document.getElementById('booking-form');
  bookingForm.setAttribute('autocomplete', 'off');
  const submitBtn = document.getElementById('submit-booking-btn');
  const confirmationModal = document.getElementById('confirmation-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
  const googleCalBtn = document.getElementById('google-cal-btn');

  // Elementos estilo Silla Libre (Persistencia de Cliente sin Login)
  const returningBanner = document.getElementById('returning-client-banner');
  const returningName = document.getElementById('returning-client-name');
  const btnVerMisTurnos = document.getElementById('btn-ver-mis-turnos');
  const cantMisTurnos = document.getElementById('cant-mis-turnos');
  const btnOlvidar = document.getElementById('btn-olvidar-datos');
  const misTurnosModal = document.getElementById('mis-turnos-modal');
  const closeMisTurnosBtn = document.getElementById('close-mis-turnos-modal-btn');
  const misTurnosLista = document.getElementById('mis-turnos-lista');

  function applyBusinessSettings(settings) {
    businessSettings = settings;
    document.title = `${settings.businessName} | Primer Spa y Centro de Hidroterapia Infantil en Asunción`;
    document.querySelectorAll('[data-business-name]').forEach((element) => {
      element.textContent = settings.businessName;
    });
    document.querySelectorAll('[data-business-address]').forEach((element) => {
      element.textContent = settings.address;
    });

    const mapsLink = document.getElementById('business-maps-link');
    if (mapsLink) {
      const address = (settings.address || '').trim();
      mapsLink.href = settings.googleMapsUrl || (address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : 'https://maps.google.com');
    }

    const instagramLink = document.getElementById('business-instagram-link');
    if (instagramLink) {
      if (settings.instagram) {
        instagramLink.href = `https://instagram.com/${encodeURIComponent(settings.instagram)}`;
        instagramLink.classList.remove('hidden');
        const label = instagramLink.querySelector('[data-instagram-label]');
        if (label) label.textContent = `Seguinos en @${settings.instagram}`;
      } else {
        instagramLink.classList.add('hidden');
      }
    }

    const contactLink = document.getElementById('whatsapp-contact-link');
    const myTurnsLink = document.getElementById('my-turns-whatsapp-link');
    if (contactLink) {
      contactLink.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hola, quisiera consultar sobre los turnos en ${settings.businessName}`)}`;
    }
    if (myTurnsLink) {
      myTurnsLink.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hola, quisiera consultar sobre mi turno en ${settings.businessName}`)}`;
    }
  }

  async function loadPublicBusinessSettings() {
    try {
      const response = await fetch('/api/configuracion');
      const data = await response.json();
      if (!response.ok || !data.settings) {
        throw new Error(data.error || 'No se pudo cargar la configuración del negocio.');
      }
      applyBusinessSettings(data.settings);
    } catch (error) {
      console.error('No se pudo cargar la configuración pública del negocio:', error.message);
      applyBusinessSettings(businessSettings);
    }
  }

  const publicSettingsReady = loadPublicBusinessSettings();

  // =========================================================================
  // GESTIÓN DE CLIENTE SIN LOGIN (Mecanismo Silla Libre: Cookies + LocalStorage)
  // =========================================================================
  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return '';
  }

  function saveClientIdentity(tutor, telefono, bebe, edad) {
    try {
      localStorage.setItem('baby_spa_tutor', tutor);
      localStorage.setItem('baby_spa_telefono', telefono);
      localStorage.setItem('baby_spa_bebe', bebe);
      localStorage.setItem('baby_spa_edad', edad);
    } catch (e) {
      console.warn('LocalStorage no disponible:', e);
    }
    // Cookies persistentes de respaldo (365 días)
    setCookie('baby_spa_tutor', tutor, 365);
    setCookie('baby_spa_telefono', telefono, 365);
    setCookie('baby_spa_bebe', bebe, 365);
    setCookie('baby_spa_edad', edad, 365);
  }

  function getSavedClientIdentity() {
    let tutor = '';
    let telefono = '';
    let bebe = '';
    let edad = '';

    try {
      tutor = localStorage.getItem('baby_spa_tutor') || '';
      telefono = localStorage.getItem('baby_spa_telefono') || '';
      bebe = localStorage.getItem('baby_spa_bebe') || '';
      edad = localStorage.getItem('baby_spa_edad') || '';
    } catch (e) {}

    // Fallback a cookies si localStorage está limpio
    if (!tutor) tutor = getCookie('baby_spa_tutor');
    if (!telefono) telefono = getCookie('baby_spa_telefono');
    if (!bebe) bebe = getCookie('baby_spa_bebe');
    if (!edad) edad = getCookie('baby_spa_edad');

    return { tutor, telefono, bebe, edad };
  }

  function saveClientReservation(reserva) {
    try {
      const stored = localStorage.getItem('baby_spa_reservas');
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter(item => item.codigo !== reserva.codigo);
      list.unshift(reserva);
      localStorage.setItem('baby_spa_reservas', JSON.stringify(list));
    } catch (e) {
      console.warn('Error guardando reserva en cliente:', e);
    }
  }

  function getClientReservations() {
    try {
      const stored = localStorage.getItem('baby_spa_reservas');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function initClientIdentity() {
    const saved = getSavedClientIdentity();
    const reservas = getClientReservations();

    const inputTutor = document.getElementById('tutor_nombre');
    const inputTel = document.getElementById('telefono');
    const inputBebe = document.getElementById('bebe_nombre');
    const inputEdad = document.getElementById('bebe_edad');

    if (saved.tutor && inputTutor) {
      inputTutor.value = saved.tutor;
      if (saved.telefono && inputTel) inputTel.value = saved.telefono;
      if (saved.bebe && inputBebe) inputBebe.value = saved.bebe;
      if (saved.edad && inputEdad) inputEdad.value = saved.edad;

      if (returningBanner && returningName) {
        const primerNombre = saved.tutor.trim().split(' ')[0];
        returningName.textContent = primerNombre;
        returningBanner.classList.remove('hidden');
      }
    }

    if (reservas && reservas.length > 0 && btnVerMisTurnos && cantMisTurnos) {
      cantMisTurnos.textContent = reservas.length;
      btnVerMisTurnos.classList.remove('hidden');
    }
  }

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

  function formatBookingMessage(reserva) {
    const service = reserva.servicio || '';
    const duration = service.match(/\((\d+)\s*min(?:utos)?\)/i);
    const serviceName = service.replace(/\s*\(\d+\s*min(?:utos)?\)\s*$/i, '').trim();
    const values = {
      negocio: businessSettings.businessName,
      codigo: reserva.codigo || '',
      nombre: reserva.bebe_nombre || '',
      bebe: reserva.bebe_nombre || '',
      edad: reserva.bebe_edad || '',
      servicio: serviceName,
      minutos: duration ? duration[1] : '',
      fecha: formatDisplayDate(reserva.fecha),
      hora: reserva.hora || '',
      tutor: reserva.tutor_nombre || '',
      direccion: businessSettings.address || ''
    };

    return businessSettings.bookingMessage.replace(/\[(negocio|codigo|nombre|bebe|edad|servicio|minutos|fecha|hora|tutor|direccion)\]|\{(negocio|codigo|nombre|bebe|edad|servicio|minutos|fecha|hora|tutor|direccion)\}/g, (placeholder, bracketKey, legacyKey) => {
      const key = bracketKey || legacyKey;
      if (legacyKey && key === 'servicio') return service;
      return values[key] == null ? placeholder : values[key];
    });
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

    // Seleccionar por defecto el primer día disponible
    const firstAvailable = daysContainer.querySelector('button:not([disabled])');
    if (firstAvailable) {
      selectDate(firstAvailable.dataset.date, firstAvailable);
    }
  }

  function selectDate(isoDate, buttonElement) {
    state.fecha = isoDate;
    state.hora = '';
    updateSubmitButtonState();

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

  // Cargar horarios desde Supabase / Neon con skeleton loader
  async function fetchSlots() {
    state.isLoadingSlots = true;
    slotsEmpty.classList.add('hidden');
    slotsContainer.classList.remove('hidden');

    slotsContainer.innerHTML = Array(8).fill(0).map(() => `
      <div class="skeleton-box h-12 rounded-2xl w-full"></div>
    `).join('');

    try {
      const resp = await fetch(`api/horarios.php?servicio=${state.servicio}&fecha=${state.fecha}`);
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'No pudimos conectar con los horarios. Por favor intentá nuevamente.');
      }

      slotsContainer.innerHTML = '';

      if (!data.horarios || data.horarios.length === 0) {
        slotsContainer.classList.add('hidden');
        slotsEmpty.classList.remove('hidden');
        return;
      }

      data.horarios.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.hora = slot.hora;

        if (slot.disponible) {
          btn.className = 'slot-btn slot-available font-semibold py-2.5 px-3 rounded-2xl text-sm flex items-center justify-center gap-1.5 focus:outline-none';
          btn.setAttribute('aria-label', `Horario ${slot.hora} disponible`);
          btn.innerHTML = `<svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="2"/><path stroke-width="2" d="M12 7v5l3 3"/></svg> ${slot.hora}`;

          btn.addEventListener('click', () => {
            selectSlot(slot.hora, btn);
          });
        } else {
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

    slotsContainer.querySelectorAll('.slot-btn').forEach(b => {
      b.classList.remove('slot-selected');
      b.removeAttribute('aria-selected');
    });

    btnElement.classList.add('slot-selected');
    btnElement.setAttribute('aria-selected', 'true');

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
      submitBtn.disabled = false;
    }
  }

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

  function validateForm(showInlineErrors = true) {
    const bebeNombre = document.getElementById('bebe_nombre');
    const bebeEdad = document.getElementById('bebe_edad');
    const tutorNombre = document.getElementById('tutor_nombre');
    const telefono = document.getElementById('telefono');

    let isValid = true;

    const errBebeNombre = document.getElementById('error-bebe-nombre');
    if (!bebeNombre.value.trim()) {
      if (showInlineErrors) errBebeNombre.classList.remove('hidden');
      isValid = false;
    } else {
      errBebeNombre.classList.add('hidden');
    }

    const errBebeEdad = document.getElementById('error-bebe-edad');
    const edadNum = parseInt(bebeEdad.value, 10);
    if (isNaN(edadNum) || edadNum <= 0 || edadNum > 36) {
      if (showInlineErrors) errBebeEdad.classList.remove('hidden');
      isValid = false;
    } else {
      errBebeEdad.classList.add('hidden');
    }

    const errTutor = document.getElementById('error-tutor-nombre');
    if (!tutorNombre.value.trim()) {
      if (showInlineErrors) errTutor.classList.remove('hidden');
      isValid = false;
    } else {
      errTutor.classList.add('hidden');
    }

    const errTelefono = document.getElementById('error-telefono');
    if (!telefono.value.trim() || telefono.value.trim().length < 8) {
      if (showInlineErrors) errTelefono.classList.remove('hidden');
      isValid = false;
    } else {
      errTelefono.classList.add('hidden');
    }

    const errHora = document.getElementById('error-hora');
    if (!state.hora) {
      if (showInlineErrors) errHora.classList.remove('hidden');
      isValid = false;
    } else {
      errHora.classList.add('hidden');
    }

    return isValid;
  }

  // Envío del Formulario
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

    // Guardar identidad del cliente en LocalStorage y Cookies inmediatamente (Silla Libre Pattern)
    saveClientIdentity(payload.tutor_nombre, payload.telefono, payload.bebe_nombre, payload.bebe_edad);

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Confirmando reserva...
    `;

    const serverErrorBox = document.getElementById('booking-server-error');
    const serverErrorText = document.getElementById('booking-server-error-text');
    if (serverErrorBox) serverErrorBox.classList.add('hidden');

    try {
      const response = await fetch('api/reservar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();

      if (res.success) {
        saveClientReservation(res.reserva);
        await showConfirmation(res.reserva);
        bookingForm.reset();
        state.hora = '';
        fetchSlots(); // Refrescar slots para marcar el horario ocupado en Supabase/Neon
      } else {
        const errorMsg = res.error || 'Ocurrió un error al procesar tu turno. Por favor seleccioná otro horario.';
        if (serverErrorBox && serverErrorText) {
          serverErrorText.textContent = errorMsg;
          serverErrorBox.classList.remove('hidden');
          serverErrorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        fetchSlots();
      }
    } catch (err) {
      console.error(err);
      const networkMsg = 'No pudimos conectar con el servidor de reservas. Por favor intentá nuevamente o escribinos al WhatsApp.';
      if (serverErrorBox && serverErrorText) {
        serverErrorText.textContent = networkMsg;
        serverErrorBox.classList.remove('hidden');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Confirmar reserva de turno ✨`;
    }
  });

  // Pantalla de Confirmación
  async function showConfirmation(reserva) {
    await publicSettingsReady;
    document.getElementById('confirm-codigo').textContent = reserva.codigo;
    document.getElementById('confirm-servicio').textContent = reserva.servicio;
    document.getElementById('confirm-fecha-hora').textContent = `${formatDisplayDate(reserva.fecha)} a las ${reserva.hora} hs`;
    document.getElementById('confirm-bebe').textContent = `${reserva.bebe_nombre} (${reserva.bebe_edad})`;
    document.getElementById('confirm-tutor').textContent = `${reserva.tutor_nombre} (${reserva.telefono})`;

    const waText = encodeURIComponent(formatBookingMessage(reserva));
    whatsappShareBtn.href = `https://wa.me/${businessSettings.whatsapp}?text=${waText}`;

    const startDateTime = reserva.fecha.replace(/-/g, '') + 'T' + reserva.hora.replace(':', '') + '00';
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Sesión en ${businessSettings.businessName} - ${reserva.bebe_nombre}`)}&dates=${startDateTime}/${startDateTime}&details=${encodeURIComponent(`Turno confirmado: ${reserva.servicio} para ${reserva.bebe_nombre}. Lugar: ${businessSettings.address}.`)}&location=${encodeURIComponent(`${businessSettings.businessName}, ${businessSettings.address}`)}`;
    googleCalBtn.href = calUrl;

    confirmationModal.classList.remove('hidden');
    confirmationModal.classList.add('flex');
  }

  closeModalBtn.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
    confirmationModal.classList.remove('flex');
  });

  // Botón "Cambiar datos" (Olvidar datos del cliente actual)
  if (btnOlvidar) {
    btnOlvidar.addEventListener('click', () => {
      document.getElementById('tutor_nombre').value = '';
      document.getElementById('telefono').value = '';
      document.getElementById('bebe_nombre').value = '';
      document.getElementById('bebe_edad').value = '';
      document.getElementById('notas').value = '';
      if (returningBanner) returningBanner.classList.add('hidden');
      try {
        localStorage.removeItem('baby_spa_tutor');
        localStorage.removeItem('baby_spa_telefono');
        localStorage.removeItem('baby_spa_bebe');
        localStorage.removeItem('baby_spa_edad');
      } catch (e) {}
      setCookie('baby_spa_tutor', '', -1);
      setCookie('baby_spa_telefono', '', -1);
      setCookie('baby_spa_bebe', '', -1);
      setCookie('baby_spa_edad', '', -1);
    });
  }

  // Botón "Ver mis turnos" (Abre el listado de turnos guardados del cliente)
  if (btnVerMisTurnos) {
    btnVerMisTurnos.addEventListener('click', () => {
      const reservas = getClientReservations();
      if (!reservas || reservas.length === 0) return;

      misTurnosLista.innerHTML = reservas.map(r => `
        <div class="bg-[#FFF8F0] rounded-2xl p-4 border border-[#EFE1D8] flex items-center justify-between gap-4 transition-all hover:border-[#F09CB0]">
          <div>
            <span class="text-xs font-mono font-bold text-[#F09CB0]">${r.codigo}</span>
            <h4 class="font-heading font-bold text-sm text-[#5B4B47] mt-0.5">${r.servicio}</h4>
            <p class="text-xs text-[#8A7A75]">${formatDisplayDate(r.fecha)} a las ${r.hora} hs</p>
            <p class="text-[11px] text-[#8A7A75] mt-0.5">Bebé: <strong>${r.bebe_nombre}</strong> (${r.bebe_edad})</p>
          </div>
          <button type="button" onclick="window.verDetalleTurno('${r.codigo}')" class="bg-white hover:bg-[#FADCE2] text-[#F09CB0] font-bold text-xs py-2 px-3.5 rounded-xl border border-[#EFE1D8] shadow-xs whitespace-nowrap transition-colors">
            Ver detalle
          </button>
        </div>
      `).join('');

      misTurnosModal.classList.remove('hidden');
      misTurnosModal.classList.add('flex');
    });
  }

  if (closeMisTurnosBtn) {
    closeMisTurnosBtn.addEventListener('click', () => {
      misTurnosModal.classList.add('hidden');
      misTurnosModal.classList.remove('flex');
    });
  }

  window.verDetalleTurno = function(codigo) {
    const reservas = getClientReservations();
    const r = reservas.find(item => item.codigo === codigo);
    if (r) {
      misTurnosModal.classList.add('hidden');
      misTurnosModal.classList.remove('flex');
      showConfirmation(r);
    }
  };

  // Iniciar calendario y sesión de cliente
  renderDays();
  initClientIdentity();
  bookingForm.reset();
  window.addEventListener('pageshow', () => bookingForm.reset());
});
