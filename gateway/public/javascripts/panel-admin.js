/**
 * Admin Panel JavaScript
 * Handles user management and reports via API
 */

const AdminPanel = {
  /**
   * API endpoints
   */
  endpoints: {
    users: '/api/admin/users',
    changeRole: (id) => `/api/admin/users/${id}/role`,
    reportLog: '/api/admin/reports/log',
    reportPresent: '/api/admin/reports/present'
  },

  /**
   * Store for data
   */
  data: {
    users: [],
    visits: [],
    presentPeople: []
  },

  /**
   * Initialize the admin panel
   */
  async init() {
    await this.loadUsers();
    await this.loadReports();
    await this.loadPresentPeople();
  },

  /**
   * Get all users
   * @returns {Promise<Array>}
   */
  async getUsers() {
    try {
      const response = await AuthService.fetch(this.endpoints.users, {
        method: 'GET'
      });

      if (response.success) {
        return response.data.users;
      } else {
        console.error('Failed to get users:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  /**
   * Change user role
   * @param {number} userId
   * @param {string} newRole
   * @returns {Promise<Object>}
   */
  async changeUserRole(userId, newRole) {
    try {
      const response = await AuthService.fetch(this.endpoints.changeRole(userId), {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });

      return response;
    } catch (error) {
      console.error('Error changing user role:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Get full report
   * @returns {Promise<Object>}
   */
  async getFullReport() {
    try {
      const response = await AuthService.fetch(this.endpoints.reportLog, {
        method: 'GET'
      });

      if (response.success) {
        return response.data;
      } else {
        console.error('Failed to get report:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  },

  /**
   * Get present people
   * @returns {Promise<Array>}
   */
  async getPresentPeople() {
    try {
      const response = await AuthService.fetch(this.endpoints.reportPresent, {
        method: 'GET'
      });

      if (response.success) {
        return response.data.present;
      } else {
        console.error('Failed to get present people:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching present people:', error);
      return [];
    }
  },

  /**
   * Load and display users
   */
  async loadUsers() {
    const tbody = document.getElementById('usersList');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">در حال بارگذاری...</td></tr>';

    const users = await this.getUsers();
    this.data.users = users;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ کاربری یافت نشد</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr data-user-id="${user.id}">
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
          <select class="role-select" data-user-id="${user.id}" onchange="AdminPanel.handleRoleChange(${user.id}, this.value)">
            <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>مهمان</option>
            <option value="host" ${user.role === 'host' ? 'selected' : ''}>میزبان</option>
            <option value="security" ${user.role === 'security' ? 'selected' : ''}>حراست</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>مدیر</option>
          </select>
        </td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <span class="role-badge role-${user.role}">${getRoleName(user.role)}</span>
        </td>
      </tr>
    `).join('');

    // Update stats
    this.updateStats();
  },

  /**
   * Load reports data
   */
  async loadReports() {
    const report = await this.getFullReport();
    if (report) {
      this.data.visits = report.visits.list;
    }
    this.updateStats();
  },

  /**
   * Load present people
   */
  async loadPresentPeople() {
    const presentTbody = document.getElementById('presentPeopleList');
    if (!presentTbody) return;

    // Show loading state
    presentTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">در حال بارگذاری...</td></tr>';

    const presentPeople = await this.getPresentPeople();
    this.data.presentPeople = presentPeople;

    if (presentPeople.length === 0) {
      presentTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ‌کس در مجموعه حضور ندارد</td></tr>';
      return;
    }

    presentTbody.innerHTML = presentPeople.map(person => `
      <tr>
        <td>${person.guest ? person.guest.name : '-'}</td>
        <td>${person.host ? person.host.name : '-'}</td>
        <td><span class="pass-code">${person.pass_code}</span></td>
        <td>${formatDateTime(person.checked_in_at)}</td>
        <td>${person.purpose}</td>
      </tr>
    `).join('');

    // Update stats
    this.updateStats();
  },

  /**
   * Update statistics display
   */
  updateStats() {
    const totalUsersEl = document.getElementById('totalUsers');
    const todayRequestsEl = document.getElementById('todayRequests');
    const currentVisitorsEl = document.getElementById('currentVisitors');

    if (totalUsersEl) {
      totalUsersEl.textContent = this.data.users.length;
    }

    if (todayRequestsEl) {
      // Count today's visits
      const today = new Date().toDateString();
      const todayVisits = this.data.visits.filter(v => {
        const visitDate = new Date(v.created_at).toDateString();
        return visitDate === today;
      });
      todayRequestsEl.textContent = todayVisits.length;
    }

    if (currentVisitorsEl) {
      currentVisitorsEl.textContent = this.data.presentPeople.length;
    }
  },

  /**
   * Handle role change
   * @param {number} userId
   * @param {string} newRole
   */
  async handleRoleChange(userId, newRole) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`آیا از تغییر نقش "${user.name}" به "${getRoleName(newRole)}" اطمینان دارید؟`)) {
      // Reset select to original value
      const select = document.querySelector(`select[data-user-id="${userId}"]`);
      if (select) {
        select.value = user.role;
      }
      return;
    }

    const result = await this.changeUserRole(userId, newRole);

    if (result.success) {
      showSuccess(`نقش کاربر با موفقیت به "${getRoleName(newRole)}" تغییر کرد`);
      // Reload users
      await this.loadUsers();
    } else {
      showError(result.message || 'خطا در تغییر نقش');
      // Reset select to original value
      const select = document.querySelector(`select[data-user-id="${userId}"]`);
      if (select) {
        select.value = user.role;
      }
    }
  },

  /**
   * Refresh all data
   */
  async refresh() {
    await this.loadUsers();
    await this.loadReports();
    await this.loadPresentPeople();
    showSuccess('اطلاعات بروزرسانی شد');
  }
};

/**
 * Format date and time
 * @param {string} dateString
 * @returns {string}
 */
function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('fa-IR');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for panel initialization, then load data
  setTimeout(() => {
    AdminPanel.init();
  }, 500);
});

