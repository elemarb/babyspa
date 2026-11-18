const loginPanel = document.getElementById('login-panel');
const sessionLoading = document.getElementById('session-loading');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');
const dashboardMessage = document.getElementById('dashboard-message');
const reservationsBody = document.getElementById('reservations-body');
const emptyState = document.getElementById('empty-state');
const filterDate = document.getElementById('filter-date');
const filterState = document.getElementById('filter-state');
const logoutButton = document.getElementById('logout-btn');
const periodLabel = document.getElementById('period-label');
const adminNav = document.getElementById('admin-nav');
const reservationsView = document.getElementById('reservations-view');
const settingsView = document.getElementById('settings-view');
const settingsMessage = document.getElementById('settings-message');
const settingsReloadButton = document.getElementById('settings-reload-btn');
const businessSettingsForm = document.getElementById('settings-business-form');
const messagesSettingsForm = document.getElementById('settings-messages-form');
const saveBusinessSettingsButton = document.getElementById('save-business-settings-btn');
const saveMessageSettingsButton = document.getElementById('save-message-settings-btn');
const servicesList = document.getElementById('services-list');
const servicesMessage = document.getElementById('services-message');
const serviceDialog = document.getElementById('service-dialog');
const serviceForm = document.getElementById('service-form');
const serviceFormMessage = document.getElementById('service-form-message');
const saveServiceButton = document.getElementById('save-service-btn');

let currentPeriod = 'day';
let businessSettings = null;
let settingsLoaded = false;
let isLoadingSettings = false;
let servicesLoaded = false;
let isLoadingServices = false;

let supabaseConfig;
let session = readSession();
let autoRefreshTimer = null;
let isLoadingReservations = false;
let reloadAfterCurrentRequest = false;

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem('babyspa-admin-session') || 'null');
  } catch (error) {
    sessionStorage.removeItem('babyspa-admin-session');
    return null;
  }
}

function saveSession(value) {
  session = value;
  sessionStorage.setItem('babyspa-admin-session', JSON.stringify(value));
}

function clearSession() {
  session = null;
  sessionStorage.removeItem('babyspa-admin-session');
}

function localDateISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriodRange() {
  const anchor = parseLocalDate(filterDate.value || localDateISO());
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (currentPeriod === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end.setDate(start.getDate() + 6);
  } else if (currentPeriod === 'month') {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1, 0);
  }

  const formatLabelDate = (date, options) => new Intl.DateTimeFormat('es-PY', {
    ...options,
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));

  if (currentPeriod === 'week') {
    periodLabel.textContent = `Semana ${formatLabelDate(start, { day: 'numeric', month: 'short' })} – ${formatLabelDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else if (currentPeriod === 'month') {
    periodLabel.textContent = formatLabelDate(start, { month: 'long', year: 'numeric' });
  } else {
    periodLabel.textContent = formatLabelDate(start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return { start: toDateISO(start), end: toDateISO(end) };
}

function shiftPeriod(direction) {
  const anchor = parseLocalDate(filterDate.value || localDateISO());
  if (currentPeriod === 'week') {
    anchor.setDate(anchor.getDate() + direction * 7);
  } else if (currentPeriod === 'month') {
    const day = anchor.getDate();
    anchor.setDate(1);
    anchor.setMonth(anchor.getMonth() + direction);
    const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    anchor.setDate(Math.min(day, lastDay));
  } else {
    anchor.setDate(anchor.getDate() + direction);
  }
  filterDate.value = toDateISO(anchor);
  loadReservations();
}

function showMessage(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

function hideMessage(element) {
  element.textContent = '';
  element.classList.add('hidden');
}

function showLogin(message = '') {
  window.clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
  sessionLoading.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  dashboard.classList.add('hidden');
  adminNav.classList.add('hidden');
  adminNav.classList.remove('flex');
  logoutButton.classList.add('hidden');
  if (message) showMessage(loginMessage, message);
}

function showDashboard() {
  sessionLoading.classList.add('hidden');
  loginPanel.classList.add('hidden');
  dashboard.classList.remove('hidden');
  adminNav.classList.remove('hidden');
  adminNav.classList.add('flex');
  logoutButton.classList.remove('hidden');
  setAdminView('reservations');
  window.clearInterval(autoRefreshTimer);
  autoRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible' && !reservationsView.classList.contains('hidden')) {
      loadReservations();
    }
  }, 60000);
  hideMessage(loginMessage);
}

function setAdminView(view) {
  const isSettings = view === 'settings';
  reservationsView.classList.toggle('hidden', isSettings);
  settingsView.classList.toggle('hidden', !isSettings);
  document.getElementById('nav-reservations').setAttribute('aria-current', isSettings ? 'false' : 'page');
  document.getElementById('nav-settings').setAttribute('aria-current', isSettings ? 'page' : 'false');
  document.getElementById('nav-reservations').classList.toggle('bg-[#FADCE2]', !isSettings);
  document.getElementById('nav-settings').classList.toggle('bg-[#FADCE2]', isSettings);
  if (isSettings && !settingsLoaded) loadAdminSettings();
}

function setSettingsTab(tab) {
  const tabs = {
    business: document.getElementById('settings-business-tab'),
    messages: document.getElementById('settings-messages-tab'),
    services: document.getElementById('settings-services-tab')
  };
  const panels = {
    business: businessSettingsForm,
    messages: messagesSettingsForm,
    services: document.getElementById('settings-services-panel')
  };

  Object.entries(tabs).forEach(([name, button]) => {
    const selected = name === tab;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('bg-[#F09CB0]', selected);
    button.classList.toggle('text-white', selected);
    button.classList.toggle('text-[#5B4B47]', !selected);
    panels[name].classList.toggle('hidden', !selected);
  });
  hideMessage(settingsMessage);
  if (tab === 'services' && !servicesLoaded) loadAdminServices();
}

async function loadConfig() {
  const response = await fetch('/api/admin/config');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar la configuración del panel.');
  supabaseConfig = data;
}

async function refreshSession() {
  if (!session || !session.refresh_token) return false;

  const response = await fetch(`${supabaseConfig.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: supabaseConfig.publishableKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const data = await response.json();
  if (!response.ok) {
    clearSession();
    return false;
  }

  saveSession(data);
  return true;
}

async function authorizedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${session.access_token}`);
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && await refreshSession()) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
    response = await fetch(url, { ...options, headers });
  }

  return response;
}

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const details = data.errors ? Object.values(data.errors).join(' ') : '';
    const error = new Error([data.error || 'No se pudo completar la operación.', details].filter(Boolean).join(' '));
    error.status = response.status;
    throw error;
  }
  return data;
}

function showSettingsStatus(message, success = false) {
  settingsMessage.textContent = message;
  settingsMessage.className = `mb-4 rounded-2xl p-3 text-sm ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`;
}

function populateSettingsForm(settings) {
  document.getElementById('settings-business-name').value = settings.businessName;
  document.getElementById('settings-address').value = settings.address;
  document.getElementById('settings-google-maps-url').value = settings.googleMapsUrl || '';
  document.getElementById('settings-whatsapp').value = `+${settings.whatsapp}`;
  document.getElementById('settings-instagram').value = settings.instagram ? `@${settings.instagram}` : '';
  document.getElementById('settings-booking-message').value = settings.bookingMessage;
}

async function loadAdminSettings() {
  if (isLoadingSettings) return;
  isLoadingSettings = true;
  hideMessage(settingsMessage);
  settingsReloadButton.classList.add('hidden');
  saveBusinessSettingsButton.disabled = true;
  saveMessageSettingsButton.disabled = true;

  try {
    const response = await authorizedFetch('/api/admin/configuracion');
    const data = await readResponse(response);
    businessSettings = data.settings;
    populateSettingsForm(businessSettings);
    settingsLoaded = true;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
    } else {
      showSettingsStatus(error.message);
      settingsReloadButton.classList.remove('hidden');
    }
  } finally {
    isLoadingSettings = false;
    saveBusinessSettingsButton.disabled = !settingsLoaded;
    saveMessageSettingsButton.disabled = !settingsLoaded;
  }
}

async function saveAdminSettings(section, button) {
  if (!settingsLoaded) return;

  const originalLabel = button.textContent;
  const payload = { ...businessSettings };
  if (section === 'business') {
    payload.businessName = document.getElementById('settings-business-name').value;
    payload.address = document.getElementById('settings-address').value;
    payload.googleMapsUrl = document.getElementById('settings-google-maps-url').value;
    payload.whatsapp = document.getElementById('settings-whatsapp').value;
    payload.instagram = document.getElementById('settings-instagram').value;
  } else {
    payload.bookingMessage = document.getElementById('settings-booking-message').value;
  }

  hideMessage(settingsMessage);
  button.disabled = true;
  button.textContent = 'Guardando…';

  try {
    const response = await authorizedFetch('/api/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await readResponse(response);
    businessSettings = data.settings;
    populateSettingsForm(businessSettings);
    showSettingsStatus('Los cambios se guardaron correctamente.', true);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
      return;
    }
    showSettingsStatus(error.message);
  } finally {
    button.disabled = !settingsLoaded;
    button.textContent = originalLabel;
  }
}

function showServicesStatus(message, success = false) {
  servicesMessage.textContent = message;
  servicesMessage.className = `rounded-2xl p-3 text-sm ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`;
}

function openServiceForm(service = null) {
  serviceForm.reset();
  serviceFormMessage.textContent = '';
  serviceFormMessage.classList.add('hidden');
  document.getElementById('service-code').value = service ? service.codigo : '';
  document.getElementById('service-name').value = service ? service.nombre : '';
  document.getElementById('service-duration').value = service ? service.duracionMinutos : '';
  document.getElementById('service-price').value = service ? service.precio : '';
  document.getElementById('service-active').checked = service ? service.activo : true;
  document.getElementById('service-form-title').textContent = service ? 'Editar servicio' : 'Agregar servicio';
  saveServiceButton.textContent = service ? 'Guardar cambios' : 'Guardar servicio';
  if (!serviceDialog.open) serviceDialog.showModal();
  document.getElementById('service-name').focus();
}

function closeServiceForm() {
  serviceForm.reset();
  serviceFormMessage.textContent = '';
  serviceFormMessage.classList.add('hidden');
  if (serviceDialog.open) serviceDialog.close();
}

function showServiceFormStatus(message) {
  serviceFormMessage.textContent = message;
  serviceFormMessage.classList.remove('hidden');
}

function renderServices(services) {
  servicesList.replaceChildren();
  if (!services.length) {
    const empty = document.createElement('p');
    empty.className = 'text-sm text-[#8A7A75]';
    empty.textContent = 'Todavía no hay servicios. Agregá el primero para ofrecerlo en el frontend.';
    servicesList.appendChild(empty);
    return;
  }

  services.forEach((service) => {
    const card = document.createElement('article');
    card.className = 'rounded-3xl border border-[#EFE1D8] bg-[#FFF8F0] p-5';

    const heading = document.createElement('div');
    heading.className = 'flex flex-wrap items-start justify-between gap-3';
    const name = document.createElement('h3');
    name.className = 'font-heading text-lg font-bold text-[#5B4B47]';
    name.textContent = service.nombre;
    const status = document.createElement('span');
    status.className = `rounded-full px-3 py-1 text-xs font-bold ${service.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`;
    status.textContent = service.activo ? 'Activo' : 'Inactivo';
    heading.append(name, status);

    const details = document.createElement('p');
    details.className = 'mt-3 text-sm text-[#8A7A75]';
    details.textContent = `${service.duracionMinutos} min · ₲ ${Number(service.precio).toLocaleString('es-PY')}`;

    const usage = document.createElement('p');
    usage.className = 'mt-1 text-xs text-[#8A7A75]';
    usage.textContent = `${service.reservas} reserva(s) asociada(s)`;

    const actions = document.createElement('div');
    actions.className = 'mt-4 flex flex-wrap gap-2';
    actions.appendChild(createActionButton(
      'Editar',
      'rounded-full border border-[#EFE1D8] bg-white px-4 py-2 text-xs font-bold text-[#5B4B47] hover:bg-[#FADCE2]',
      () => openServiceForm(service)
    ));
    actions.appendChild(createActionButton(
      service.activo ? 'Desactivar' : 'Activar',
      'rounded-full border border-[#EFE1D8] bg-white px-4 py-2 text-xs font-bold text-[#5B4B47] hover:bg-[#FADCE2]',
      (event) => saveServiceChanges({ ...service, activo: !service.activo }, event.currentTarget)
    ));
    const deleteButton = createActionButton(
      'Eliminar',
      'rounded-full bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50',
      () => deleteService(service)
    );
    deleteButton.disabled = service.reservas > 0;
    if (deleteButton.disabled) deleteButton.title = 'No se puede eliminar porque existen reservas asociadas.';
    actions.appendChild(deleteButton);

    card.append(heading, details, usage, actions);
    servicesList.appendChild(card);
  });
}

async function loadAdminServices() {
  if (isLoadingServices) return;
  isLoadingServices = true;
  hideMessage(servicesMessage);
  servicesList.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'text-sm text-[#8A7A75]';
  loading.textContent = 'Cargando servicios…';
  servicesList.appendChild(loading);

  try {
    const response = await authorizedFetch('/api/admin/servicios');
    const data = await readResponse(response);
    renderServices(data.servicios);
    servicesLoaded = true;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
    } else {
      showServicesStatus(error.message);
      servicesList.replaceChildren();
    }
  } finally {
    isLoadingServices = false;
  }
}

async function saveServiceChanges(service, formButton = null) {
  const isNew = !service.codigo;
  const button = formButton || document.getElementById('service-form').querySelector('button[type="submit"]');
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Guardando…';

  try {
    const response = await authorizedFetch('/api/admin/servicios', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    await readResponse(response);
    if (button === saveServiceButton) closeServiceForm();
    servicesLoaded = false;
    await loadAdminServices();
    if (servicesLoaded) showServicesStatus('El servicio se guardó correctamente.', true);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
      return;
    }
    if (button === saveServiceButton) showServiceFormStatus(error.message);
    else showServicesStatus(error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function deleteService(service) {
  if (!window.confirm(`¿Querés eliminar el servicio "${service.nombre}"?`)) return;
  try {
    const response = await authorizedFetch('/api/admin/servicios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: service.codigo })
    });
    await readResponse(response);
    servicesLoaded = false;
    await loadAdminServices();
    if (servicesLoaded) showServicesStatus('El servicio se eliminó correctamente.', true);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
      return;
    }
    showServicesStatus(error.message);
    if (error.status === 409) {
      servicesLoaded = false;
      await loadAdminServices();
      showServicesStatus(error.message);
    }
  }
}

async function signIn(email, password) {
  const response = await fetch(`${supabaseConfig.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseConfig.publishableKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.message || 'Correo o contraseña incorrectos.');
  saveSession(data);
}

function createCell(text, className = 'px-5 py-4 align-top') {
  const cell = document.createElement('td');
  cell.className = className;
  cell.textContent = text == null ? '' : String(text);
  return cell;
}

function createActionButton(label, className, callback) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', callback);
  return button;
}

function renderReservations(reservations) {
  reservationsBody.replaceChildren();
  emptyState.classList.toggle('hidden', reservations.length !== 0);

  const reservationsPerDay = new Map();
  reservations.forEach(({ fecha }) => {
    reservationsPerDay.set(fecha, (reservationsPerDay.get(fecha) || 0) + 1);
  });

  let previousDate = '';
  reservations.forEach((reservation) => {
    if (currentPeriod !== 'day' && reservation.fecha !== previousDate) {
      const dayRow = document.createElement('tr');
      dayRow.className = 'bg-[#FFF8F0]';
      const dayCell = createCell('', 'px-5 py-3 font-bold capitalize text-[#5B4B47]');
      dayCell.colSpan = 6;
      const date = parseLocalDate(reservation.fecha);
      const dateLabel = new Intl.DateTimeFormat('es-PY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
      const count = reservationsPerDay.get(reservation.fecha);
      dayCell.textContent = `${dateLabel} · ${count} ${count === 1 ? 'turno' : 'turnos'}`;
      dayRow.appendChild(dayCell);
      reservationsBody.appendChild(dayRow);
      previousDate = reservation.fecha;
    }

    const row = document.createElement('tr');
    row.className = 'hover:bg-[#FFF8F0]/50';

    const timeCell = createCell('');
    const time = document.createElement('strong');
    time.className = 'block font-bold text-[#5B4B47]';
    time.textContent = `${reservation.hora || ''} hs`;
    const code = document.createElement('span');
    code.className = 'mt-1 block font-mono text-xs text-[#8A7A75]';
    code.textContent = reservation.codigo || 'Sin código';
    timeCell.append(time, code);
    row.appendChild(timeCell);

    const babyCell = createCell('');
    const babyName = document.createElement('strong');
    babyName.className = 'block font-bold text-[#5B4B47]';
    babyName.textContent = reservation.bebe_nombre || '';
    const age = document.createElement('span');
    age.className = 'text-xs text-[#8A7A75]';
    age.textContent = `${reservation.bebe_edad ?? ''} meses`;
    babyCell.append(babyName, age);
    row.appendChild(babyCell);

    const contactCell = createCell('');
    const contactName = document.createElement('span');
    contactName.className = 'block font-semibold text-[#5B4B47]';
    contactName.textContent = reservation.tutor_nombre || '';
    const phone = document.createElement('a');
    const digits = String(reservation.telefono || '').replace(/\D/g, '');
    const whatsappNumber = digits.startsWith('595')
      ? digits
      : digits.startsWith('0')
        ? `595${digits.slice(1)}`
        : `595${digits}`;
    phone.href = `https://wa.me/${whatsappNumber}`;
    phone.target = '_blank';
    phone.rel = 'noopener noreferrer';
    phone.className = 'mt-1 inline-block text-xs font-semibold text-emerald-700';
    phone.textContent = reservation.telefono || '';
    contactCell.append(contactName, phone);
    row.appendChild(contactCell);

    const serviceCell = createCell(reservation.servicio_nombre || reservation.servicio || '');
    if (reservation.notas) {
      const notes = document.createElement('p');
      notes.className = 'mt-1 max-w-xs truncate text-xs italic text-[#8A7A75]';
      notes.title = reservation.notas;
      notes.textContent = reservation.notas;
      serviceCell.appendChild(notes);
    }
    row.appendChild(serviceCell);

    const statusCell = createCell('');
    const badge = document.createElement('span');
    const statusStyles = {
      confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completada: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelada: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    badge.className = `inline-block rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[reservation.estado] || 'bg-gray-50 text-gray-700 border-gray-200'}`;
    badge.textContent = reservation.estado || 'Sin estado';
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actions = createCell('', 'space-x-2 whitespace-nowrap px-5 py-4 text-right align-top');
    if (reservation.codigo && reservation.estado !== 'completada') {
      actions.appendChild(createActionButton(
        '✓ Completar',
        'rounded-xl bg-[#D9EDF6] px-3 py-1.5 text-xs font-bold text-[#3b5059] hover:bg-[#c5e4f3]',
        () => updateReservation(reservation.codigo, 'completada')
      ));
    }
    if (reservation.codigo && reservation.estado !== 'cancelada' && reservation.estado !== 'completada') {
      actions.appendChild(createActionButton(
        '✕ Cancelar',
        'rounded-xl bg-[#FADCE2] px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-200',
        () => updateReservation(reservation.codigo, 'cancelada')
      ));
    }
    row.appendChild(actions);
    reservationsBody.appendChild(row);
  });
}

async function loadReservations() {
  if (isLoadingReservations) {
    reloadAfterCurrentRequest = true;
    return;
  }
  isLoadingReservations = true;

  hideMessage(dashboardMessage);
  emptyState.classList.add('hidden');
  reservationsBody.replaceChildren();
  const range = getPeriodRange();

  const loading = document.createElement('tr');
  const loadingCell = createCell('Cargando reservas…', 'px-5 py-10 text-center text-[#8A7A75]');
  loadingCell.colSpan = 6;
  loading.appendChild(loadingCell);
  reservationsBody.appendChild(loading);

  const params = new URLSearchParams();
  if (currentPeriod === 'day') {
    if (filterDate.value) params.set('fecha', filterDate.value);
  } else {
    params.set('desde', range.start);
    params.set('hasta', range.end);
  }
  if (filterState.value) params.set('estado', filterState.value);

  try {
    const response = await authorizedFetch(`/api/admin/reservas?${params.toString()}`);
    const data = await readResponse(response);
    renderReservations(data.reservas || []);
  } catch (error) {
    reservationsBody.replaceChildren();
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
    } else {
      showMessage(dashboardMessage, error.message);
    }
  } finally {
    isLoadingReservations = false;
    if (reloadAfterCurrentRequest) {
      reloadAfterCurrentRequest = false;
      if (session && !dashboard.classList.contains('hidden')) loadReservations();
    }
  }
}

async function updateReservation(codigo, estado) {
  const action = estado === 'cancelada' ? 'cancelar el turno y liberar el horario' : 'marcar el turno como completado';
  if (!window.confirm(`¿Querés ${action}?`)) return;

  hideMessage(dashboardMessage);
  try {
    const response = await authorizedFetch('/api/admin/estado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, estado })
    });
    await readResponse(response);
    await loadReservations();
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
      return;
    }
    showMessage(dashboardMessage, error.message);
  }
}

async function deleteAllReservations(button) {
  const confirmed = window.confirm('Esta acción eliminará permanentemente todas las reservas de la base de datos, incluidas las completadas y canceladas. No se puede deshacer. ¿Querés continuar?');
  if (!confirmed) return;

  if (window.prompt('Para confirmar, escribí BORRAR TODAS:') !== 'BORRAR TODAS') return;

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Eliminando…';
  hideMessage(dashboardMessage);

  try {
    const response = await authorizedFetch('/api/admin/eliminar-reservas', {
      method: 'POST'
    });
    const data = await readResponse(response);
    await loadReservations();
    dashboardMessage.className = 'mb-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700';
    showMessage(dashboardMessage, `Se eliminaron ${data.deletedCount} reservas de la base de datos.`);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      showLogin(error.message);
      return;
    }
    showMessage(dashboardMessage, error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage(loginMessage);
  loginButton.disabled = true;
  loginButton.textContent = 'Ingresando…';

  try {
    await signIn(
      document.getElementById('email').value.trim(),
      document.getElementById('password').value
    );
    showDashboard();
    await loadReservations();
  } catch (error) {
    clearSession();
    showLogin(error.message);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Iniciar sesión';
  }
});

logoutButton.addEventListener('click', async () => {
  if (session && session.access_token && supabaseConfig) {
    try {
      const response = await fetch(`${supabaseConfig.supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.publishableKey,
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) console.error('No se pudo cerrar la sesión en Supabase:', response.status);
    } catch (error) {
      console.error('No se pudo cerrar la sesión en Supabase:', error.message);
    }
  }
  clearSession();
  showLogin();
});

filterDate.addEventListener('change', loadReservations);
filterState.addEventListener('change', loadReservations);
document.getElementById('refresh-btn').addEventListener('click', loadReservations);
document.getElementById('delete-all-reservations-btn').addEventListener('click', (event) => {
  deleteAllReservations(event.currentTarget);
});
document.getElementById('today-btn').addEventListener('click', () => {
  filterDate.value = localDateISO();
  loadReservations();
});
document.querySelectorAll('.period-button').forEach((button) => {
  button.addEventListener('click', () => {
    currentPeriod = button.dataset.period;
    document.querySelectorAll('.period-button').forEach((periodButton) => {
      const selected = periodButton === button;
      periodButton.setAttribute('aria-pressed', String(selected));
      periodButton.classList.toggle('bg-[#F09CB0]', selected);
      periodButton.classList.toggle('text-white', selected);
      periodButton.classList.toggle('text-[#5B4B47]', !selected);
    });
    loadReservations();
  });
});
document.getElementById('period-prev').addEventListener('click', () => shiftPeriod(-1));
document.getElementById('period-next').addEventListener('click', () => shiftPeriod(1));
document.getElementById('nav-reservations').addEventListener('click', () => setAdminView('reservations'));
document.getElementById('nav-settings').addEventListener('click', () => setAdminView('settings'));
document.getElementById('settings-business-tab').addEventListener('click', () => setSettingsTab('business'));
document.getElementById('settings-messages-tab').addEventListener('click', () => setSettingsTab('messages'));
document.getElementById('settings-services-tab').addEventListener('click', () => setSettingsTab('services'));
settingsReloadButton.addEventListener('click', loadAdminSettings);
document.getElementById('reload-services-btn').addEventListener('click', () => {
  servicesLoaded = false;
  loadAdminServices();
});
document.getElementById('add-service-btn').addEventListener('click', () => openServiceForm());
document.getElementById('cancel-service-btn').addEventListener('click', closeServiceForm);
serviceDialog.addEventListener('click', (event) => {
  if (event.target === serviceDialog) closeServiceForm();
});
serviceDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeServiceForm();
});
serviceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveServiceChanges({
    codigo: document.getElementById('service-code').value,
    nombre: document.getElementById('service-name').value.trim(),
    duracionMinutos: Number(document.getElementById('service-duration').value),
    precio: Number(document.getElementById('service-price').value),
    activo: document.getElementById('service-active').checked
  }, saveServiceButton);
});
businessSettingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveAdminSettings('business', saveBusinessSettingsButton);
});
messagesSettingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveAdminSettings('messages', saveMessageSettingsButton);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !dashboard.classList.contains('hidden') &&
      !reservationsView.classList.contains('hidden')) {
    loadReservations();
  }
});

(async function initialize() {
  filterDate.value = localDateISO();
  try {
    await loadConfig();
    if (!session || !session.access_token) {
      showLogin();
      return;
    }
    await loadReservations();
    if (session) showDashboard();
  } catch (error) {
    showLogin(error.message);
  }
})();
