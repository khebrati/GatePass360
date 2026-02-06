/**
 * Security Panel JavaScript
 * Handles pass approval, rejection, check-in and check-out via API
 */

const SecurityPanel = {
  /**
   * API endpoints
   */
  endpoints: {
    pendingVisits: '/api/passes/pending',
    approveVisit: (id) => `/api/passes/${id}/approve`,
    rejectVisit: (id) => `/api/passes/${id}/reject`,
    checkIn: '/api/passes/check-in',
    checkOut: '/api/passes/check-out'
  },

  /**
   * Initialize the security panel
   */
  async init() {
    // Load pending visits on page load
    await this.loadPendingRequests();

    // Setup check-in/check-out forms
    this.setupCheckInForm();
    this.setupCheckOutForm();
  },

  /**
   * Get pending visits from API (approved by host, waiting for security)
   * @returns {Promise<Array>}
   */
  async getPendingVisits() {
    try {
      const response = await AuthService.fetch(this.endpoints.pendingVisits, {
        method: 'GET'
      });

      if (response.success) {
        return response.data.visits;
      } else {
        console.error('Failed to get pending visits:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching pending visits:', error);
      return [];
    }
  },

  /**
   * Approve visit and issue pass
   * @param {number} visitId
   * @returns {Promise<Object>}
   */
  async approveAndIssuePass(visitId) {
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
   * Reject visit request
   * @param {number} visitId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async rejectVisit(visitId, reason) {
    try {
      const response = await AuthService.fetch(this.endpoints.rejectVisit(visitId), {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason })
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
   * Check-in a guest
   * @param {string} code - Pass code
   * @returns {Promise<Object>}
   */
  async checkIn(code) {
    try {
      const response = await AuthService.fetch(this.endpoints.checkIn, {
        method: 'POST',
        body: JSON.stringify({ code: code })
      });

      return response;
    } catch (error) {
      console.error('Error checking in:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Check-out a guest
   * @param {string} code - Pass code
   * @returns {Promise<Object>}
   */
  async checkOut(code) {
    try {
      const response = await AuthService.fetch(this.endpoints.checkOut, {
        method: 'POST',
        body: JSON.stringify({ code: code })
      });

      return response;
    } catch (error) {
      console.error('Error checking out:', error);
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
    const tbody = document.getElementById('approvedRequests');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">در حال بارگذاری...</td></tr>';

    const visits = await this.getPendingVisits();

    if (visits.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ درخواست در انتظاری وجود ندارد</td></tr>';
      return;
    }

    tbody.innerHTML = visits.map(visit => `
      <tr data-visit-id="${visit.id}">
        <td>${visit.guest ? visit.guest.name : '-'}</td>
        <td>${visit.host ? visit.host.name : '-'}</td>
        <td>${formatDate(visit.visit_date)}</td>
        <td>${visit.purpose}</td>
        <td>
          <button class="action-btn approve-btn" onclick="SecurityPanel.handleApprove(${visit.id})">
            <i class="fas fa-check"></i> صدور مجوز
          </button>
          <button class="action-btn reject-btn" onclick="SecurityPanel.handleReject(${visit.id})">
            <i class="fas fa-times"></i> رد
          </button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Handle approve button click
   * @param {number} visitId
   */
  async handleApprove(visitId) {
    if (!confirm('آیا از صدور مجوز برای این درخواست اطمینان دارید؟')) {
      return;
    }

    const result = await this.approveAndIssuePass(visitId);

    if (result.success) {
      // Show the pass code in a modal/alert
      const passCode = result.data.pass.code;
      const guestName = result.data.visit_request.guest.name;
      const validUntil = new Date(result.data.pass.valid_until).toLocaleString('fa-IR');

      alert(`✅ مجوز با موفقیت صادر شد!\n\nکد مجوز: ${passCode}\nمهمان: ${guestName}\nاعتبار تا: ${validUntil}`);

      // Reload the table
      await this.loadPendingRequests();
    } else {
      showError(result.message || 'خطا در صدور مجوز');
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
      // Reload the table
      await this.loadPendingRequests();
    } else {
      showError(result.message || 'خطا در رد درخواست');
    }
  },

  /**
   * Setup check-in form
   */
  setupCheckInForm() {
    const form = document.getElementById('checkinForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const codeInput = form.querySelector('input[type="text"]');
      const code = codeInput.value.trim();

      if (!code) {
        showError('لطفاً کد مجوز را وارد کنید');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت...';
      submitBtn.disabled = true;

      const result = await this.checkIn(code);

      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;

      if (result.success) {
        const guestName = result.data.guest.name;
        const hostName = result.data.host.name;
        showSuccess(`ورود ثبت شد!\nمهمان: ${guestName}\nمیزبان: ${hostName}`);
        form.reset();
      } else {
        showError(result.message || 'خطا در ثبت ورود');
      }
    });
  },

  /**
   * Setup check-out form
   */
  setupCheckOutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const codeInput = form.querySelector('input[type="text"]');
      const code = codeInput.value.trim();

      if (!code) {
        showError('لطفاً کد مجوز را وارد کنید');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت...';
      submitBtn.disabled = true;

      const result = await this.checkOut(code);

      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;

      if (result.success) {
        const guestName = result.data.guest.name;
        showSuccess(`خروج ثبت شد!\nمهمان: ${guestName}`);
        form.reset();
      } else {
        showError(result.message || 'خطا در ثبت خروج');
      }
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for panel initialization, then load data
  setTimeout(() => {
    SecurityPanel.init();
  }, 500);
});

