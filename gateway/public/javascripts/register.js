/**
 * Register Page Handler
 * Connects registration form to backend API
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check if already logged in
  if (AuthService.isAuthenticated()) {
    const user = AuthService.getUser();
    AuthService.redirectToDashboard(user.role);
    return;
  }

  const form = document.getElementById('registerForm');
  const errorDiv = document.getElementById('errorMessage');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  /**
   * Show error message
   * @param {string} message
   */
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorDiv.style.display = 'none';
  }

  /**
   * Set loading state
   * @param {boolean} isLoading
   */
  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت‌نام...';
      submitBtn.disabled = true;
    } else {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  }

  // Real-time password confirmation validation
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  confirmInput.addEventListener('input', function() {
    if (passwordInput.value !== this.value && this.value !== '') {
      this.style.borderColor = '#e74c3c';
    } else {
      this.style.borderColor = '#ddd';
    }
  });

  // Handle form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Collect form data
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    // Hide previous errors
    hideError();

    // Client-side validation
    if (fullName.length < 3) {
      showError('نام باید حداقل ۳ کاراکتر باشد');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      showError('ایمیل معتبر وارد کنید');
      return;
    }

    if (password.length < 6) {
      showError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    if (password !== confirmPassword) {
      showError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    if (!terms) {
      showError('لطفاً با قوانین موافقت کنید');
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      // Prepare user data for API (role is assigned by backend as 'guest')
      const userData = {
        name: fullName,
        email: email,
        password: password
      };

      // Call register API
      const result = await AuthService.register(userData);

      if (result.success) {
        // Save session data
        AuthService.saveSession(result.data);

        // Redirect to guest dashboard (all new users are guests)
        AuthService.redirectToDashboard('guest');
      } else {
        // Show error message from server
        showError(result.message || 'خطا در ثبت‌نام');
        setLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      showError('خطا در برقراری ارتباط با سرور');
      setLoading(false);
    }
  });
});

