/**
 * Guest Panel JavaScript
 * Handles visit request creation and retrieval via API
 */

const GuestPanel = {
  /**
   * API endpoints
   */
  endpoints: {
    visits: '/api/visits',
    myVisits: '/api/visits/me'
  },

  /**
   * Initialize the guest panel
   */
  async init() {
    // Load visits on page load
    await this.loadMyVisits();

    // Setup form handler
    this.setupNewRequestForm();
  },

  /**
   * Get my visits from API
   * @returns {Promise<Array>}
   */
  async getMyVisits() {
    try {
      const response = await AuthService.fetch(this.endpoints.myVisits, {
        method: 'GET'
      });

      if (response.success) {
        return response.data.visits;
      } else {
        console.error('Failed to get visits:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      return [];
    }
  },

  /**
   * Create a new visit request
   * @param {Object} visitData - { host_id, purpose, description, visit_date }
   * @returns {Promise<Object>}
   */
  async createVisit(visitData) {
    try {
      const response = await AuthService.fetch(this.endpoints.visits, {
        method: 'POST',
        body: JSON.stringify(visitData)
      });

      return response;
    } catch (error) {
      console.error('Error creating visit:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Load and display my visits in the table
   */
  async loadMyVisits() {
    const tbody = document.getElementById('myRequests');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">در حال بارگذاری...</td></tr>';

    const visits = await this.getMyVisits();

    if (visits.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ درخواستی یافت نشد</td></tr>';
      return;
    }

    tbody.innerHTML = visits.map(visit => `
      <tr>
        <td>${formatDate(visit.visit_date)}</td>
        <td>${visit.host ? visit.host.name : '-'}</td>
        <td>${visit.purpose}</td>
        <td><span class="status status-${this.getStatusClass(visit.status)}">${getStatusText(visit.status)}</span></td>
        <td>${visit.description || visit.rejection_reason || '-'}</td>
      </tr>
    `).join('');
  },

  /**
   * Get CSS class for status
   * @param {string} status
   * @returns {string}
   */
  getStatusClass(status) {
    const statusClasses = {
      'pending_host_review': 'pending-host',
      'pending_security': 'pending-security',
      'approved': 'approved',
      'rejected_by_host': 'rejected-host',
      'rejected_by_security': 'rejected-security'
    };
    return statusClasses[status] || 'pending';
  },

  /**
   * Setup the new request form
   */
  setupNewRequestForm() {
    const form = document.getElementById('newRequestForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      // Get form values
      const hostEmail = form.querySelector('input[type="email"]').value.trim();
      const purpose = form.querySelector('select').value;
      const description = form.querySelector('textarea').value.trim();
      const visitDate = form.querySelector('input[type="date"]').value;

      // Validate
      if (!hostEmail || !purpose || !visitDate) {
        showError('لطفاً تمام فیلدهای الزامی را پر کنید');
        return;
      }

      // Set loading state
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
      submitBtn.disabled = true;

      // Call createVisit API with host_email
      const result = await this.createVisit({
        host_email: hostEmail,
        purpose: purpose,
        description: description,
        visit_date: visitDate
      });

      // Reset button
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;

      if (result.success) {
        showSuccess('درخواست شما با موفقیت ثبت شد');
        form.reset();
        // Reload the visits table
        await this.loadMyVisits();
      } else {
        showError(result.message || 'خطا در ثبت درخواست');
      }
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for panel initialization, then load visits
  setTimeout(() => {
    GuestPanel.init();
  }, 500);
});

