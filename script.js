const storageKey = 'railsafe-state-pechacks-v1';
const screens = document.querySelectorAll('.screen');
const navButtons = document.querySelectorAll('[data-view]');
const actionButtons = document.querySelectorAll('[data-target-view]');
const simulateButtons = document.querySelectorAll('[data-simulate]');

const defaultState = {
  currentView: 'welcome',
  viewMode: 'mobile',
  selectedBagId: 'BAG-003',
  user: {
    name: 'Santhish N',
    email: 'santhish@example.com',
    mobile: '+91 9876543210',
    emergencyContact: '+91 9876543211',
    passengerId: 'PASS-2024-0847',
    role: 'Passenger',
    isLoggedIn: true
  },
  bags: [
    {
      id: 'BAG-001',
      name: 'Suitcase',
      type: 'Suitcase',
      battery: 87,
      proximity: 'near',
      status: 'secure',
      priority: false,
      movement: false,
      authorization: true,
      tamper: false,
      lastEvent: 'Authorized porter movement'
    },
    {
      id: 'BAG-002',
      name: 'Backpack',
      type: 'Backpack',
      battery: 74,
      proximity: 'near',
      status: 'secure',
      priority: false,
      movement: false,
      authorization: true,
      tamper: false,
      lastEvent: 'Stationary - safe'
    },
    {
      id: 'BAG-003',
      name: 'Laptop Bag',
      type: 'Laptop Bag',
      battery: 92,
      proximity: 'near',
      status: 'secure',
      priority: true,
      movement: false,
      authorization: true,
      tamper: false,
      lastEvent: 'No movement'
    }
  ],
  alerts: [],
  incidents: [],
  history: [
    {
      id: 'history-001',
      severity: 'safe',
      title: 'Authorized porter movement',
      details: 'Porter moved bag under active authorization.',
      time: '10:45 AM'
    }
  ],
  eventLog: [],
  activeBanner: null,
  soundEnabled: false
};

let state = loadState();
let audioContext = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...defaultState, ...saved, user: { ...defaultState.user, ...saved.user } } : structuredClone(defaultState);
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function structuredClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getBagIconSvg(type) {
  if (type === 'Backpack') {
    return `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="8" y1="13" x2="16" y2="13"/></svg>`;
  }
  if (type === 'Laptop Bag') {
    return `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>`;
  }
  return `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="15" rx="2"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="10" x2="10" y2="17"/><line x1="14" y1="10" x2="14" y2="17"/></svg>`;
}

function showView(viewId) {
  state.currentView = viewId;
  const screenElements = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('[data-view]');

  screenElements.forEach((screen) => {
    screen.classList.toggle('active', screen.id === viewId);
  });

  navItems.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  if (viewId === 'alerts') {
    markVisibleAlertsRead();
  }

  persistState();
  renderApp();
}

/* AUTHENTICATION TAB SWITCHER */
function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
  }
}

/* AUTHENTICATION HANDLER */
function handleAuthSubmit(event, type) {
  event.preventDefault();
  if (type === 'login') {
    const identifier = document.getElementById('login-email').value.trim();
    if (identifier) {
      state.user.isLoggedIn = true;
      if (identifier.includes('@')) {
        state.user.email = identifier;
      } else if (identifier.match(/\d/)) {
        state.user.mobile = identifier;
      }
      addEventLog(`User signed in: ${state.user.name}`);
      showView('dashboard');
    }
  } else if (type === 'register') {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();

    if (name && email && mobile) {
      state.user.name = name;
      state.user.email = email;
      state.user.mobile = mobile;
      state.user.isLoggedIn = true;
      state.user.passengerId = `PASS-2024-${Math.floor(1000 + Math.random() * 9000)}`;

      addEventLog(`New passenger registered: ${name}`);
      showView('dashboard');
    }
  }
}

/* LOGOUT HANDLER */
function handleLogout() {
  state.user.isLoggedIn = false;
  addEventLog('User signed out');
  persistState();
  showView('welcome');
}

/* EDIT PROFILE HANDLERS */
function toggleEditProfile(isEditing) {
  const viewCard = document.getElementById('profile-view-card');
  const editCard = document.getElementById('profile-edit-card');

  if (isEditing) {
    document.getElementById('edit-name').value = state.user.name || '';
    document.getElementById('edit-email').value = state.user.email || '';
    document.getElementById('edit-mobile').value = state.user.mobile || '';
    document.getElementById('edit-emergency').value = state.user.emergencyContact || '';
    
    viewCard.classList.add('hidden');
    editCard.classList.remove('hidden');
  } else {
    editCard.classList.add('hidden');
    viewCard.classList.remove('hidden');
  }
}

function saveProfileChanges(event) {
  event.preventDefault();
  const name = document.getElementById('edit-name').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  const mobile = document.getElementById('edit-mobile').value.trim();
  const emergency = document.getElementById('edit-emergency').value.trim();

  if (name && email && mobile) {
    state.user.name = name;
    state.user.email = email;
    state.user.mobile = mobile;
    state.user.emergencyContact = emergency;

    addEventLog(`Profile updated for ${name}`);
    persistState();
    renderApp();
    toggleEditProfile(false);
  }
}

function updateBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  const unread = state.alerts.filter((alert) => !alert.read).length;
  badge.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>${unread > 0 ? ` <span class="badge-count">${unread}</span>` : ''}`;
  badge.dataset.unread = String(unread);
}

function getBagById(id) {
  return state.bags.find((bag) => bag.id === id);
}

function addEventLog(message) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  state.eventLog.unshift(`[${timestamp}] ${message}`);
  state.eventLog = state.eventLog.slice(0, 8);
  persistState();
  renderApp();
}

function renderUserProfile() {
  const firstName = (state.user.name || 'Santhish').split(' ')[0].toUpperCase();
  
  const topbarGreeting = document.getElementById('topbar-greeting-name');
  const dashGreeting = document.getElementById('dash-greeting-name');
  const sidebarUser = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');

  if (topbarGreeting) topbarGreeting.textContent = firstName;
  if (dashGreeting) dashGreeting.textContent = firstName;
  if (sidebarUser) sidebarUser.textContent = (state.user.name || 'Santhish N').toUpperCase();
  if (sidebarRole) sidebarRole.textContent = (state.user.role || 'Passenger').toUpperCase();

  const profName = document.getElementById('prof-display-name');
  const profEmail = document.getElementById('prof-display-email');
  const profMobile = document.getElementById('prof-display-mobile');
  const profId = document.getElementById('prof-display-id');
  const profEmergency = document.getElementById('prof-display-emergency');
  const profBags = document.getElementById('prof-display-bags');

  if (profName) profName.textContent = (state.user.name || 'Santhish N').toUpperCase();
  if (profEmail) profEmail.textContent = state.user.email || 'santhish@example.com';
  if (profMobile) profMobile.textContent = state.user.mobile || '+91 9876543210';
  if (profId) profId.textContent = state.user.passengerId || 'PASS-2024-0847';
  if (profEmergency) profEmergency.textContent = state.user.emergencyContact || '+91 9876543211';
  if (profBags) profBags.textContent = `${state.bags.length} BAGS`;
}

function renderDashboard() {
  const container = document.getElementById('dashboard-summary');
  if (!container) return;

  const criticalCount = state.bags.filter((bag) => bag.status === 'critical').length;
  const safeCount = state.bags.filter((bag) => bag.status !== 'critical').length;
  const statusLabel = criticalCount > 0 ? `CRITICAL (${criticalCount})` : '● ALL BAGS SECURE';
  const heading = criticalCount > 0 ? `${criticalCount} BAG NEEDS ATTENTION` : `${safeCount} BAGS PROTECTED`;
  const message = criticalCount > 0
    ? 'A monitored bag requires immediate review.'
    : 'All monitored bags remain within the safe perimeter.';

  container.className = `status-card ${criticalCount > 0 ? 'critical' : 'success-card'}`;
  container.innerHTML = `
    <div class="status-pill ${criticalCount > 0 ? 'critical' : ''}">${statusLabel}</div>
    <h3>${heading}</h3>
    <p>${message}</p>
  `;
}

function renderBagList() {
  const bagList = document.getElementById('bag-list');
  if (!bagList) return;

  bagList.innerHTML = state.bags.map((bag) => {
    const dotClass = bag.status === 'critical' ? 'critical' : bag.status === 'warning' ? 'warning' : 'success';
    return `
      <button class="bag-card ${bag.status === 'critical' ? 'critical' : ''} ${bag.priority ? 'priority' : ''}" data-target-view="details" data-bag-id="${bag.id}">
        <div class="bag-icon">${getBagIconSvg(bag.type)}</div>
        <div class="bag-meta">
          <strong class="bag-name">${bag.name}</strong>
          <p>${bag.priority ? 'PRIORITY' : 'SECURE'} · ${bag.battery}% · ${bag.proximity.toUpperCase()}</p>
          <small>${bag.lastEvent}</small>
        </div>
      </button>
    `;
  }).join('');
}

function renderBagDetails() {
  const container = document.getElementById('bag-details');
  if (!container) return;
  const bag = getBagById(state.selectedBagId) || state.bags[0];
  const statusText = bag.status === 'critical' ? 'CRITICAL' : bag.status === 'warning' ? 'WARNING' : 'SECURE';
  container.innerHTML = `
    <div class="detail-icon">${getBagIconSvg(bag.type)}</div>
    <h2>${bag.name.toUpperCase()}</h2>
    <div class="status-pill ${bag.status === 'critical' ? 'critical' : ''}">${statusText}</div>
    <div class="info-list">
      <div><span>BAG ID</span><strong>${bag.id}</strong></div>
      <div><span>TAG ID</span><strong>TAG-8392</strong></div>
      <div><span>PRIORITY</span><strong>${bag.priority ? 'YES' : 'NO'}</strong></div>
      <div><span>BATTERY</span><strong>${bag.battery}%</strong></div>
    </div>
    <div class="profile-section">
      <h4>OWNER PROXIMITY</h4>
      <p>${bag.proximity === 'far' ? 'FAR (>10M)' : 'NEAR (<10M)'}</p>
    </div>
    <div class="profile-section">
      <h4>MOTION SENSOR</h4>
      <p>${bag.movement ? 'MOVING' : 'NO MOVEMENT'}</p>
    </div>
    <div class="profile-actions">
      <button class="primary-btn wide pill-btn" data-target-view="authorize">AUTHORIZE MOVEMENT</button>
      <button class="ghost-btn wide pill-btn" data-target-view="history">VIEW MOVEMENT HISTORY</button>
    </div>
  `;
}

function renderAlerts() {
  const container = document.getElementById('alerts-list');
  if (!container) return;

  if (!state.alerts.length) {
    container.innerHTML = `
      <div class="alert-card safe">
        <h2>ALL BAGS SECURE</h2>
        <p>No active security alerts recorded.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.alerts.map((alert) => `
    <div class="alert-card ${alert.severity}">
      <h2>${alert.title.toUpperCase()}</h2>
      <p>${alert.summary}</p>
      <p><strong>${alert.bagName}</strong> · RISK ${alert.riskScore}/100</p>
      <ul class="alert-reasons">
        ${alert.reasons.map((reason) => `<li>${reason}</li>`).join('')}
      </ul>
      <div class="alert-actions">
        <button class="primary-btn pill-btn" data-target-view="incident" data-incident-id="${alert.incidentId || ''}">VIEW INCIDENT</button>
        <button class="ghost-btn pill-btn" data-alert-action="dismiss" data-alert-id="${alert.id}">DISMISS</button>
      </div>
    </div>
  `).join('');
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  container.innerHTML = `
    <div class="timeline-card">
      ${state.history.map((entry) => `
        <div class="timeline-item">
          <div class="timeline-dot ${entry.severity === 'critical' ? 'critical' : entry.severity === 'warning' ? 'warning' : 'success'}"></div>
          <div>
            <strong>${entry.time}</strong>
            <p>${entry.title.toUpperCase()}</p>
            <span>${entry.severity.toUpperCase()}</span>
            <p class="muted">${entry.details}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderIncident() {
  const container = document.getElementById('incident-details');
  if (!container) return;
  const incident = state.incidents[0];
  if (!incident) {
    container.innerHTML = '<p class="muted">No incidents logged.</p>';
    return;
  }
  container.innerHTML = `
    <h2>${incident.id}</h2>
    <p><strong>TYPE</strong><br />${incident.type}</p>
    <p><strong>BAG</strong><br />${incident.bagName}</p>
    <p><strong>RISK SCORE</strong><br />${incident.risk}/100</p>
    <p><strong>STATUS</strong><br />${incident.status}</p>
    <p><strong>CREATED AT</strong><br />${incident.createdAt}</p>
  `;
}

function renderEventLog() {
  const container = document.getElementById('event-log');
  if (!container) return;
  container.innerHTML = state.eventLog.length
    ? state.eventLog.map((entry) => `<div class="event-log-item">${entry}</div>`).join('')
    : '<div class="event-log-item">No system events logged.</div>';
}

function renderApp() {
  renderUserProfile();
  renderDashboard();
  renderBagList();
  renderBagDetails();
  renderAlerts();
  renderHistory();
  renderIncident();
  renderEventLog();
  updateBadge();
}

window.__railsafe = {
  state,
  showView,
  addEventLog,
  switchAuthTab,
  handleAuthSubmit,
  handleLogout,
  toggleEditProfile,
  saveProfileChanges
};

function attachEvents() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.id === 'hamburger') {
      const sidebar = document.querySelector('.sidebar');
      sidebar.classList.toggle('active');
      return;
    }

    if (button.dataset.mode) {
      state.viewMode = button.dataset.mode;
      const appShell = document.querySelector('.app-shell');
      const modeButtons = document.querySelectorAll('.mode-btn');
      modeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      appShell.classList.remove('mobile-mode', 'laptop-mode');
      appShell.classList.add(button.dataset.mode === 'laptop' ? 'laptop-mode' : 'mobile-mode');
      persistState();
      return;
    }

    if (button.dataset.bagId) {
      state.selectedBagId = button.dataset.bagId;
      persistState();
      renderApp();
    }

    const targetView = button.dataset.targetView || button.dataset.view;
    if (targetView) {
      showView(targetView);
      const sidebar = document.querySelector('.sidebar');
      if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
      return;
    }
  });
}

attachEvents();
renderApp();
showView(state.currentView || 'welcome');




