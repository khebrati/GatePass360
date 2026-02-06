/**
 * Login Page Handler
 * Connects login form to backend API
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check if already logged in
  if (AuthService.isAuthenticated()) {
    const user = AuthService.getUser();
    AuthService.redirectToDashboard(user.role);
    return;
  }

  const form = document.getElementById('loginForm');
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
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ورود...';
      submitBtn.disabled = true;
    } else {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  }

  // Handle form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Hide previous errors
    hideError();

    // Basic validation
    if (!email || !password) {
      showError('لطفاً ایمیل و رمز عبور را وارد کنید');
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      // Call login API
      const result = await AuthService.login(email, password);

      if (result.success) {
        // Save session data
        AuthService.saveSession(result.data);

        // Redirect to appropriate dashboard
        AuthService.redirectToDashboard(result.data.user.role);
      } else {
        // Show error message from server
        showError(result.message || 'ایمیل یا رمز عبور اشتباه است');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('خطا در برقراری ارتباط با سرور');
      setLoading(false);
    }
  });
});

