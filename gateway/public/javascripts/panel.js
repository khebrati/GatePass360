/**
 * Panel Utilities
 * Common functionality for all panel pages
 */

/**
 * Initialize panel page
 * @param {string[]} allowedRoles - Roles allowed to access this panel
 * @param {Function} onUserLoaded - Callback when user is loaded
 */
async function initPanel(allowedRoles, onUserLoaded) {
  // Check authentication
  if (!AuthService.isAuthenticated()) {
    window.location.href = '/login';
    return null;
  }

  // Verify user with API
  const user = await AuthService.getMe();

  if (!user) {
    AuthService.clearSession();
    window.location.href = '/login';
    return null;
  }

  // Check role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    AuthService.redirectToDashboard(user.role);
    return null;
  }

  // Setup logout button
  setupLogoutButton();

  // Call callback if provided
  if (onUserLoaded && typeof onUserLoaded === 'function') {
    onUserLoaded(user);
  }

  return user;
}

/**
 * Setup logout button handler
 */
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      await AuthService.logout();
      window.location.href = '/login';
    });
  }
}

/**
 * Display user info in panel
 * @param {Object} user
 */
function displayUserInfo(user) {
  // Update user name elements
  const userNameElements = document.querySelectorAll('#userName, .user-name');
  userNameElements.forEach(el => {
    el.textContent = user.name;
  });

  // Update welcome message
  const welcomeElement = document.getElementById('welcomeUser');
  if (welcomeElement) {
    welcomeElement.textContent = `خوش آمدید، ${user.name}`;
  }

  // Update user role elements
  const userRoleElements = document.querySelectorAll('#userRole, .user-role');
  userRoleElements.forEach(el => {
    el.textContent = getRoleName(user.role);
  });

  // Update profile form if exists
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileRole = document.getElementById('profileRole');

  if (profileName) profileName.value = user.name;
  if (profileEmail) profileEmail.value = user.email;
  if (profileRole) profileRole.value = getRoleName(user.role);
}

/**
 * Get Persian role name
 * @param {string} role
 * @returns {string}
 */
function getRoleName(role) {
  const roles = {
    guest: 'مهمان',
    host: 'میزبان',
    security: 'حراست',
    admin: 'مدیر'
  };
  return roles[role] || role;
}

/**
 * Get status text in Persian
 * @param {string} status
 * @returns {string}
 */
function getStatusText(status) {
  const statuses = {
    pending: 'در انتظار',
    pending_host_review: 'در انتظار تأیید میزبان',
    pending_security: 'در انتظار تأیید حراست',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    rejected_by_host: 'رد شده توسط میزبان',
    rejected_by_security: 'رد شده توسط حراست'
  };
  return statuses[status] || status;
}

/**
 * Format date to Persian
 * @param {string} dateString
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR');
}

/**
 * Format time
 * @param {string} dateString
 * @returns {string}
 */
function formatTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Show success message
 * @param {string} message
 */
function showSuccess(message) {
  alert('✅ ' + message);
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
  alert('❌ ' + message);
}

