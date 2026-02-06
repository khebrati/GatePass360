/**
 * Authentication Service
 * Handles all authentication-related API calls and session management
 */
const AuthService = {
  /**
   * API Base URL for authentication
   */
  baseUrl: '/api/auth',

  /**
   * Dashboard routes for each role
   */
  dashboardRoutes: {
    guest: '/panel/guest',
    host: '/panel/host',
    security: '/panel/security',
    admin: '/panel/admin'
  },

  /**
   * Register a new user
   * @param {Object} userData - { name, email, password, phone, role }
   * @returns {Promise<Object>}
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      };
    }
  },

  /**
   * Logout user
   * @returns {Promise<Object>}
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
    return { success: true };
  },

  /**
   * Get current user profile from API
   * @returns {Promise<Object|null>}
   */
  async getMe() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify({
          ...data.data.user,
          loggedIn: true
        }));
        return data.data.user;
      }

      return null;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  },

  /**
   * Save authentication data to localStorage
   * @param {Object} authData - { user, token }
   */
  saveSession(authData) {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify({
      ...authData.user,
      loggedIn: true
    }));
  },

  /**
   * Clear authentication data from localStorage
   */
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get stored user data
   * @returns {Object|null}
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const user = this.getUser();
    const token = this.getToken();
    return !!(user && user.loggedIn && token);
  },

  /**
   * Get redirect URL based on user role
   * @param {string} role
   * @returns {string}
   */
  getRedirectUrl(role) {
    return this.dashboardRoutes[role] || '/panel';
  },

  /**
   * Redirect to appropriate panel based on role
   * @param {string} role
   */
  redirectToDashboard(role) {
    window.location.href = this.getRedirectUrl(role);
  },

  /**
   * Guard a page - check if user is authenticated and has correct role
   * @param {string[]} allowedRoles - Array of allowed roles
   * @returns {Promise<Object|null>} - User object or null if not authorized
   */
  async guard(allowedRoles) {
    if (!this.isAuthenticated()) {
      window.location.href = '/login';
      return null;
    }

    const user = await this.getMe();

    if (!user) {
      this.clearSession();
      window.location.href = '/login';
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      this.redirectToDashboard(user.role);
      return null;
    }

    return user;
  },

  /**
   * Make authenticated API request
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async fetch(url, options = {}) {
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 || response.status === 403) {
        this.clearSession();
        window.location.href = '/login';
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
};
