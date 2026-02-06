# Authentication API Documentation

Base URL: `/api/auth`

## Overview

The Authentication API handles user registration, login, logout, and profile retrieval. All authentication is handled via JWT (JSON Web Tokens) with a 24-hour expiration.

---

## Endpoints

### 1. Register User

Creates a new user account.

**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Request Body:**

| Field    | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| name     | string | Yes      | User's full name                                 |
| email    | string | Yes      | User's email (must be unique)                    |
| password | string | Yes      | Password (min 6 characters)                      |
| phone    | string | No       | User's phone number                              |
| role     | string | No       | User role: `guest`, `host`, `security`, `admin` (default: `guest`) |

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "guest",
      "created_at": "2026-02-05T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

| Status | Message                                    |
|--------|--------------------------------------------|
| 400    | Name, email, and password are required     |
| 400    | Invalid email format                       |
| 400    | Password must be at least 6 characters long|
| 400    | Invalid role                               |
| 409    | User with this email already exists        |
| 500    | Internal server error                      |

**JavaScript Example:**

```javascript
async function registerUser(name, email, password, phone = null, role = 'guest') {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, phone, role })
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user info
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Redirect based on role
      redirectToDashboard(data.data.user.role);
    } else {
      console.error('Registration failed:', data.message);
      alert(data.message);
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Usage
registerUser('John Doe', 'john@example.com', 'password123', '1234567890', 'guest');
```

---

### 2. Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**

| Field    | Type   | Required | Description        |
|----------|--------|----------|--------------------|
| email    | string | Yes      | User's email       |
| password | string | Yes      | User's password    |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "guest",
      "created_at": "2026-02-05T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

| Status | Message                          |
|--------|----------------------------------|
| 400    | Email and password are required  |
| 401    | Invalid email or password        |
| 500    | Internal server error            |

**JavaScript Example:**

```javascript
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user info
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Redirect based on role
      redirectToDashboard(data.data.user.role);
    } else {
      console.error('Login failed:', data.message);
      alert(data.message);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Usage
login('john@example.com', 'password123');
```

---

### 3. Logout

Invalidates the current JWT token.

**Endpoint:** `POST /api/auth/logout`

**Access:** Private (requires authentication)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**

| Status | Message                    |
|--------|----------------------------|
| 401    | Access token is required   |
| 401    | Token has been invalidated |
| 403    | Invalid or expired token   |
| 500    | Internal server error      |

**JavaScript Example:**

```javascript
async function logout() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      // Already logged out, redirect to login
      window.location.href = '/login.ejs';
      return;
    }

    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    // Clear local storage regardless of response
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login.ejs';

    return data;
  } catch (error) {
    console.error('Logout error:', error);
    // Clear storage and redirect anyway
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.ejs';
  }
}

// Usage
logout();
```

---

### 4. Get Current User

Returns the profile of the currently authenticated user.

**Endpoint:** `GET /api/auth/me`

**Access:** Private (requires authentication)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "guest",
      "created_at": "2026-02-05T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Message                    |
|--------|----------------------------|
| 401    | Access token is required   |
| 401    | Token has been invalidated |
| 403    | Invalid or expired token   |
| 404    | User not found             |
| 500    | Internal server error      |

**JavaScript Example:**

```javascript
async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      // No token, redirect to login
      window.location.href = '/login.ejs';
      return null;
    }

    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      return data.data.user;
    } else {
      // Token invalid, clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.ejs';
      return null;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
}

// Usage
const user = await getCurrentUser();
console.log('Current user:', user);
```

---

## Role-Based Redirection

After successful login or registration, users should be redirected to their appropriate dashboard based on their role.

### Redirect Helper Function

```javascript
/**
 * Redirects user to appropriate dashboard based on role
 * @param {string} role - User role: guest, host, security, admin
 */
function redirectToDashboard(role) {
  const dashboardRoutes = {
    guest: '/guest/dashboard.html',
    host: '/host/dashboard.html',
    security: '/security/dashboard.html',
    admin: '/admin/dashboard.html'
  };

  const route = dashboardRoutes[role];

  if (route) {
    window.location.href = route;
  } else {
    console.error('Unknown role:', role);
    window.location.href = '/';
  }
}
```

### Protected Page Guard

Use this on protected pages to ensure only authenticated users with the correct role can access them:

```javascript
/**
 * Checks if user is authenticated and has the required role
 * Redirects to login if not authenticated, or to their dashboard if wrong role
 * @param {string[]} allowedRoles - Array of roles allowed to access this page
 */
async function guardPage(allowedRoles) {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login.ejs';
    return null;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      // Token invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.ejs';
      return null;
    }

    const user = data.data.user;

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard
      redirectToDashboard(user.role);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth guard error:', error);
    window.location.href = '/login.ejs';
    return null;
  }
}

// Usage on guest dashboard page
const user = await guardPage(['guest']);

// Usage on host dashboard page
const user = await guardPage(['host']);

// Usage on security dashboard page
const user = await guardPage(['security']);

// Usage on admin dashboard page (admin can also access other pages)
const user = await guardPage(['admin']);

// Usage for pages accessible by multiple roles
const user = await guardPage(['admin', 'security']);
```

---

## Complete Auth Module

Here's a complete authentication module you can include in your frontend:

```javascript
// auth.js - Authentication Module for GatePass360

const Auth = {
  /**
   * API base URL
   */
  baseUrl: '/api/auth',

  /**
   * Dashboard routes for each role
   */
  dashboardRoutes: {
    guest: '/guest/dashboard.html',
    host: '/host/dashboard.html',
    security: '/security/dashboard.html',
    admin: '/admin/dashboard.html'
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get stored user
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.getToken();
  },

  /**
   * Store auth data
   */
  setAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear auth data
   */
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Redirect to appropriate dashboard
   */
  redirectToDashboard(role) {
    const route = this.dashboardRoutes[role] || '/';
    window.location.href = route;
  },

  /**
   * Register a new user
   */
  async register(name, email, password, phone = null, role = 'guest') {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, role })
    });

    const data = await response.json();

    if (data.success) {
      this.setAuthData(data.data.token, data.data.user);
      this.redirectToDashboard(data.data.user.role);
    }

    return data;
  },

  /**
   * Login user
   */
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      this.setAuthData(data.data.token, data.data.user);
      this.redirectToDashboard(data.data.user.role);
    }

    return data;
  },

  /**
   * Logout user
   */
  async logout() {
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }

    this.clearAuthData();
    window.location.href = '/login.ejs';
  },

  /**
   * Get current user from API
   */
  async me() {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const response = await fetch(`${this.baseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data.user;
    }

    return null;
  },

  /**
   * Guard a page - redirect if not authenticated or wrong role
   */
  async guard(allowedRoles) {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.ejs';
      return null;
    }

    const user = await this.me();

    if (!user) {
      this.clearAuthData();
      window.location.href = '/login.ejs';
      return null;
    }

    if (!allowedRoles.includes(user.role)) {
      this.redirectToDashboard(user.role);
      return null;
    }

    return user;
  },

  /**
   * Make authenticated API request
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

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    // Handle token expiration
    if (response.status === 401 || response.status === 403) {
      this.clearAuthData();
      window.location.href = '/login.ejs';
    }

    return data;
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
```

### Usage Examples

**Login Page (login.html):**

```html
<script src="/js/auth.js"></script>
<script>
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    Auth.redirectToDashboard(user.role);
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const result = await Auth.login(email, password);

    if (!result.success) {
      document.getElementById('error').textContent = result.message;
    }
  });
</script>
```

**Protected Dashboard Page (guest/dashboard.html):**

```html
<script src="/js/auth.js"></script>
<script>
  (async () => {
    // Only allow guests to access this page
    const user = await Auth.guard(['guest']);

    if (user) {
      document.getElementById('userName').textContent = user.name;
      // Load dashboard content...
    }
  })();

  // Logout button handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
  });
</script>
```

---

## Security Notes

1. **Token Storage:** Tokens are stored in `localStorage`. For enhanced security in production, consider using `httpOnly` cookies.

2. **Token Expiration:** Tokens expire after 24 hours. The client should handle 401/403 responses by redirecting to login.

3. **Password Requirements:** Minimum 6 characters. Consider implementing stronger password policies in production.

4. **HTTPS:** Always use HTTPS in production to protect tokens in transit.

5. **Token Blacklisting:** Logout invalidates tokens server-side, preventing reuse of old tokens.

