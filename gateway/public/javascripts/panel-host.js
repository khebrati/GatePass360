/**
 * Host Panel JavaScript
 * Handles visit request approval/rejection via API
 */

const HostPanel = {
  /**
   * API endpoints
   */
  endpoints: {
    hostVisits: '/api/visits/host',
    approveVisit: (id) => `/api/visits/${id}/approve`,
    rejectVisit: (id) => `/api/visits/${id}/reject`
  },

  /**
   * Initialize the host panel
   */
  async init() {
    // Load visits on page load
    await this.loadPendingRequests();
    await this.loadHistory();
  },

  /**
   * Get host visits from API
   * @param {string} status - optional status filter
   * @returns {Promise<Array>}
   */
  async getHostVisits(status = null) {
    try {
      let url = this.endpoints.hostVisits;
      if (status) {
        url += `?status=${status}`;
      }

      const response = await AuthService.fetch(url, {
        method: 'GET'
      });

      if (response.success) {
        return response.data.visits;
      } else {
        console.error('Failed to get host visits:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching host visits:', error);
      return [];
    }
  },

  /**
   * Approve a visit request
   * @param {number} visitId
   * @returns {Promise<Object>}
   */
  async approveVisit(visitId) {
    try {
      const response = await AuthService.fetch(this.endpoints.approveVisit(visitId), {
        method: 'PATCH'
      });

      return response;
    } catch (error) {
      console.error('Error approving visit:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Reject a visit request
   * @param {number} visitId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async rejectVisit(visitId, reason) {
    try {
      const response = await AuthService.fetch(this.endpoints.rejectVisit(visitId), {
        method: 'PATCH',
        body: JSON.stringify({ rejection_reason: reason })
      });

      return response;
    } catch (error) {
      console.error('Error rejecting visit:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Load and display pending requests
   */
  async loadPendingRequests() {
    const tbody = document.getElementById('pendingRequests');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">در حال بارگذاری...</td></tr>';

    // Get only pending_host_review visits
    const visits = await this.getHostVisits('pending_host_review');

    if (visits.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ درخواست در انتظاری وجود ندارد</td></tr>';
      return;
    }

    tbody.innerHTML = visits.map(visit => `
      <tr data-visit-id="${visit.id}">
        <td>${visit.guest ? visit.guest.name : '-'}</td>
        <td>${formatDate(visit.visit_date)}</td>
        <td>${visit.purpose}</td>
        <td>${visit.description || '-'}</td>
        <td>
          <button class="action-btn approve-btn" onclick="HostPanel.handleApprove(${visit.id})">
            <i class="fas fa-check"></i> تأیید
          </button>
          <button class="action-btn reject-btn" onclick="HostPanel.handleReject(${visit.id})">
            <i class="fas fa-times"></i> رد
          </button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Load and display visit history (non-pending)
   */
  async loadHistory() {
    const tbody = document.getElementById('requestHistory');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">در حال بارگذاری...</td></tr>';

    // Get all visits
    const allVisits = await this.getHostVisits();

    // Filter out pending_host_review (those are shown in pending section)
    const historyVisits = allVisits.filter(v => v.status !== 'pending_host_review');

    if (historyVisits.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ تاریخچه‌ای وجود ندارد</td></tr>';
      return;
    }

    tbody.innerHTML = historyVisits.map(visit => `
      <tr>
        <td>${visit.guest ? visit.guest.name : '-'}</td>
        <td>${formatDate(visit.visit_date)}</td>
        <td>${visit.purpose}</td>
        <td><span class="status status-${this.getStatusClass(visit.status)}">${getStatusText(visit.status)}</span></td>
        <td>${this.formatNotes(visit)}</td>
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
   * Format notes/rejection reason for display
   * @param {Object} visit
   * @returns {string}
   */
  formatNotes(visit) {
    // If rejected, show rejection reason with label
    if (visit.rejection_reason) {
      return `<span class="rejection-reason"><i class="fas fa-exclamation-circle"></i> ${visit.rejection_reason}</span>`;
    }
    // Otherwise show description
    if (visit.description) {
      return visit.description;
    }
    return '-';
  },

  /**
   * Handle approve button click
   * @param {number} visitId
   */
  async handleApprove(visitId) {
    if (!confirm('آیا از تأیید این درخواست اطمینان دارید؟')) {
      return;
    }

    const result = await this.approveVisit(visitId);

    if (result.success) {
      showSuccess('درخواست با موفقیت تأیید شد');
      // Reload both tables
      await this.loadPendingRequests();
      await this.loadHistory();
    } else {
      showError(result.message || 'خطا در تأیید درخواست');
    }
  },

  /**
   * Handle reject button click
   * @param {number} visitId
   */
  async handleReject(visitId) {
    const reason = prompt('لطفاً دلیل رد درخواست را وارد کنید:');

    if (!reason || reason.trim() === '') {
      showError('وارد کردن دلیل رد الزامی است');
      return;
    }

    const result = await this.rejectVisit(visitId, reason.trim());

    if (result.success) {
      showSuccess('درخواست رد شد');
      // Reload both tables
      await this.loadPendingRequests();
      await this.loadHistory();
    } else {
      showError(result.message || 'خطا در رد درخواست');
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for panel initialization, then load visits
  setTimeout(() => {
    HostPanel.init();
  }, 500);
});

