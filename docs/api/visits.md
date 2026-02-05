# Visits API Documentation

Base URL: `/api/visits`

## Overview

The Visits API handles visit request creation, retrieval, approval, and rejection. Visit requests follow a workflow from guest submission through host review.

### Visit Request Status Flow

```
pending_host_review → pending_security (approved by host)
                   → rejected_by_host (rejected by host)

pending_security → approved (approved by security)
               → rejected_by_security (rejected by security)
```

---

## Endpoints

### 1. Create Visit Request

Creates a new visit request. Only guests can create visit requests.

**Endpoint:** `POST /api/visits`

**Access:** Private (Guest only)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |
| Content-Type  | application/json   |

**Request Body:**

| Field      | Type    | Required | Description                        |
|------------|---------|----------|------------------------------------|
| host_id    | integer | Yes      | ID of the host to visit            |
| purpose    | string  | Yes      | Purpose/reason for the visit       |
| visit_date | string  | Yes      | Visit date (YYYY-MM-DD format)     |

**Success Response (201):**

```json
{
  "success": true,
  "message": "Visit request created successfully",
  "data": {
    "visit": {
      "id": 1,
      "purpose": "Business meeting",
      "visit_date": "2026-02-10T00:00:00.000Z",
      "status": "pending_host_review",
      "created_at": "2026-02-05T12:00:00.000Z",
      "host": {
        "id": 3,
        "name": "Host User",
        "email": "host@example.com"
      }
    }
  }
}
```

**Error Responses:**

| Status | Message                                       |
|--------|-----------------------------------------------|
| 400    | Host ID, purpose, and visit date are required |
| 400    | Invalid visit date format                     |
| 400    | Visit date cannot be in the past              |
| 401    | Access token is required                      |
| 403    | You do not have permission (not a guest)      |
| 404    | Host not found or user is not a host          |
| 500    | Internal server error                         |

**JavaScript Example:**

```javascript
async function createVisitRequest(hostId, purpose, visitDate) {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      host_id: hostId,
      purpose: purpose,
      visit_date: visitDate
    })
  });

  const data = await response.json();

  if (data.success) {
    console.log('Visit request created:', data.data.visit);
    // Redirect to visits list or show success message
  } else {
    console.error('Failed to create visit request:', data.message);
    alert(data.message);
  }

  return data;
}

// Usage
createVisitRequest(3, 'Business meeting', '2026-02-10');
```

---

### 2. Get My Visit Requests

Retrieves all visit requests for the current guest.

**Endpoint:** `GET /api/visits/me`

**Access:** Private (Guest only)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 1,
        "purpose": "Business meeting",
        "visit_date": "2026-02-10T00:00:00.000Z",
        "status": "pending_host_review",
        "rejection_reason": null,
        "created_at": "2026-02-05T12:00:00.000Z",
        "updated_at": "2026-02-05T12:00:00.000Z",
        "host": {
          "id": 3,
          "name": "Host User",
          "email": "host@example.com"
        }
      },
      {
        "id": 2,
        "purpose": "Interview",
        "visit_date": "2026-02-15T00:00:00.000Z",
        "status": "rejected_by_host",
        "rejection_reason": "Schedule conflict",
        "created_at": "2026-02-05T12:30:00.000Z",
        "updated_at": "2026-02-05T13:00:00.000Z",
        "host": {
          "id": 3,
          "name": "Host User",
          "email": "host@example.com"
        }
      }
    ],
    "count": 2
  }
}
```

**Error Responses:**

| Status | Message                                  |
|--------|------------------------------------------|
| 401    | Access token is required                 |
| 403    | You do not have permission (not a guest) |
| 500    | Internal server error                    |

**JavaScript Example:**

```javascript
async function getMyVisitRequests() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/visits/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (data.success) {
    console.log('My visits:', data.data.visits);
    return data.data.visits;
  } else {
    console.error('Failed to get visits:', data.message);
    return [];
  }
}

// Usage
const visits = await getMyVisitRequests();

// Display visits with status badges
visits.forEach(visit => {
  console.log(`${visit.purpose} - ${visit.status}`);
  if (visit.rejection_reason) {
    console.log(`  Reason: ${visit.rejection_reason}`);
  }
});
```

---

### 3. Get Host's Visit Requests

Retrieves all visit requests assigned to the current host.

**Endpoint:** `GET /api/visits/host`

**Access:** Private (Host only)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |

**Query Parameters:**

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| status    | string | No       | Filter by status (e.g., `pending_host_review`) |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 1,
        "purpose": "Business meeting",
        "visit_date": "2026-02-10T00:00:00.000Z",
        "status": "pending_host_review",
        "rejection_reason": null,
        "created_at": "2026-02-05T12:00:00.000Z",
        "updated_at": "2026-02-05T12:00:00.000Z",
        "guest": {
          "id": 2,
          "name": "Guest User",
          "email": "guest@example.com",
          "phone": "1234567890"
        }
      }
    ],
    "count": 1
  }
}
```

**Error Responses:**

| Status | Message                                 |
|--------|-----------------------------------------|
| 401    | Access token is required                |
| 403    | You do not have permission (not a host) |
| 500    | Internal server error                   |

**JavaScript Example:**

```javascript
async function getHostVisitRequests(status = null) {
  const token = localStorage.getItem('token');

  let url = '/api/visits/host';
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (data.success) {
    console.log('Host visits:', data.data.visits);
    return data.data.visits;
  } else {
    console.error('Failed to get visits:', data.message);
    return [];
  }
}

// Usage - Get all visits
const allVisits = await getHostVisitRequests();

// Usage - Get only pending visits
const pendingVisits = await getHostVisitRequests('pending_host_review');
```

---

### 4. Approve Visit Request

Approves a pending visit request. Changes status from `pending_host_review` to `pending_security`.

**Endpoint:** `PATCH /api/visits/:id/approve`

**Access:** Private (Host only - must own the request)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |

**URL Parameters:**

| Parameter | Type    | Description              |
|-----------|---------|--------------------------|
| id        | integer | Visit request ID         |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Visit request approved successfully",
  "data": {
    "visit": {
      "id": 1,
      "purpose": "Business meeting",
      "visit_date": "2026-02-10T00:00:00.000Z",
      "status": "pending_security",
      "updated_at": "2026-02-05T13:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Message                                          |
|--------|--------------------------------------------------|
| 400    | Cannot approve request with status: {status}     |
| 401    | Access token is required                         |
| 403    | You do not have permission (not a host)          |
| 403    | You are not authorized to approve this request   |
| 404    | Visit request not found                          |
| 500    | Internal server error                            |

**JavaScript Example:**

```javascript
async function approveVisitRequest(visitId) {
  const token = localStorage.getItem('token');

  const response = await fetch(`/api/visits/${visitId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (data.success) {
    console.log('Visit approved:', data.data.visit);
    alert('Visit request approved successfully');
    // Refresh the visits list
    loadVisits();
  } else {
    console.error('Failed to approve:', data.message);
    alert(data.message);
  }

  return data;
}

// Usage
approveVisitRequest(1);
```

---

### 5. Reject Visit Request

Rejects a pending visit request with a reason. Changes status from `pending_host_review` to `rejected_by_host`.

**Endpoint:** `PATCH /api/visits/:id/reject`

**Access:** Private (Host only - must own the request)

**Headers:**

| Header        | Value              |
|---------------|--------------------|
| Authorization | Bearer {token}     |
| Content-Type  | application/json   |

**URL Parameters:**

| Parameter | Type    | Description              |
|-----------|---------|--------------------------|
| id        | integer | Visit request ID         |

**Request Body:**

| Field            | Type   | Required | Description                |
|------------------|--------|----------|----------------------------|
| rejection_reason | string | Yes      | Reason for rejecting       |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Visit request rejected",
  "data": {
    "visit": {
      "id": 2,
      "purpose": "Interview",
      "visit_date": "2026-02-15T00:00:00.000Z",
      "status": "rejected_by_host",
      "rejection_reason": "Schedule conflict, please choose another date",
      "updated_at": "2026-02-05T13:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Message                                         |
|--------|-------------------------------------------------|
| 400    | Rejection reason is required                    |
| 400    | Cannot reject request with status: {status}     |
| 401    | Access token is required                        |
| 403    | You do not have permission (not a host)         |
| 403    | You are not authorized to reject this request   |
| 404    | Visit request not found                         |
| 500    | Internal server error                           |

**JavaScript Example:**

```javascript
async function rejectVisitRequest(visitId, reason) {
  const token = localStorage.getItem('token');

  const response = await fetch(`/api/visits/${visitId}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rejection_reason: reason
    })
  });

  const data = await response.json();

  if (data.success) {
    console.log('Visit rejected:', data.data.visit);
    alert('Visit request rejected');
    // Refresh the visits list
    loadVisits();
  } else {
    console.error('Failed to reject:', data.message);
    alert(data.message);
  }

  return data;
}

// Usage with prompt for reason
function handleReject(visitId) {
  const reason = prompt('Please enter the rejection reason:');
  if (reason && reason.trim()) {
    rejectVisitRequest(visitId, reason.trim());
  } else {
    alert('Rejection reason is required');
  }
}

handleReject(2);
```

---

## Complete Visits Module

Here's a complete module for handling visit requests:

```javascript
// visits.js - Visits Module for GatePass360

const Visits = {
  /**
   * API base URL
   */
  baseUrl: '/api/visits',

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Make authenticated request
   */
  async request(url, options = {}) {
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    return response.json();
  },

  /**
   * Create a new visit request (Guest)
   */
  async create(hostId, purpose, visitDate) {
    return this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        host_id: hostId,
        purpose: purpose,
        visit_date: visitDate
      })
    });
  },

  /**
   * Get my visit requests (Guest)
   */
  async getMyVisits() {
    return this.request(`${this.baseUrl}/me`);
  },

  /**
   * Get visit requests for host (Host)
   */
  async getHostVisits(status = null) {
    let url = `${this.baseUrl}/host`;
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    return this.request(url);
  },

  /**
   * Approve a visit request (Host)
   */
  async approve(visitId) {
    return this.request(`${this.baseUrl}/${visitId}/approve`, {
      method: 'PATCH'
    });
  },

  /**
   * Reject a visit request (Host)
   */
  async reject(visitId, reason) {
    return this.request(`${this.baseUrl}/${visitId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: reason })
    });
  },

  /**
   * Get status badge class for styling
   */
  getStatusBadgeClass(status) {
    const classes = {
      'pending_host_review': 'badge-warning',
      'pending_security': 'badge-info',
      'approved': 'badge-success',
      'rejected_by_host': 'badge-danger',
      'rejected_by_security': 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  },

  /**
   * Get human-readable status text
   */
  getStatusText(status) {
    const texts = {
      'pending_host_review': 'Pending Host Review',
      'pending_security': 'Pending Security Approval',
      'approved': 'Approved',
      'rejected_by_host': 'Rejected by Host',
      'rejected_by_security': 'Rejected by Security'
    };
    return texts[status] || status;
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Visits;
}
```

---

## Usage Examples

### Guest Dashboard - Create and View Visits

```html
<!-- guest/dashboard.html -->
<script src="/js/auth.js"></script>
<script src="/js/visits.js"></script>
<script>
  (async () => {
    // Guard page - only guests allowed
    const user = await Auth.guard(['guest']);
    if (!user) return;

    // Display user name
    document.getElementById('userName').textContent = user.name;

    // Load visits
    loadMyVisits();
  })();

  async function loadMyVisits() {
    const result = await Visits.getMyVisits();

    if (result.success) {
      const container = document.getElementById('visitsList');
      container.innerHTML = '';

      result.data.visits.forEach(visit => {
        container.innerHTML += `
          <div class="visit-card">
            <h4>${visit.purpose}</h4>
            <p>Host: ${visit.host.name}</p>
            <p>Date: ${new Date(visit.visit_date).toLocaleDateString()}</p>
            <span class="${Visits.getStatusBadgeClass(visit.status)}">
              ${Visits.getStatusText(visit.status)}
            </span>
            ${visit.rejection_reason ? `<p class="text-danger">Reason: ${visit.rejection_reason}</p>` : ''}
          </div>
        `;
      });
    }
  }

  async function submitVisitRequest(e) {
    e.preventDefault();

    const hostId = document.getElementById('hostId').value;
    const purpose = document.getElementById('purpose').value;
    const visitDate = document.getElementById('visitDate').value;

    const result = await Visits.create(hostId, purpose, visitDate);

    if (result.success) {
      alert('Visit request submitted!');
      loadMyVisits();
      e.target.reset();
    } else {
      alert(result.message);
    }
  }
</script>
```

### Host Dashboard - Review Visits

```html
<!-- host/dashboard.html -->
<script src="/js/auth.js"></script>
<script src="/js/visits.js"></script>
<script>
  (async () => {
    // Guard page - only hosts allowed
    const user = await Auth.guard(['host']);
    if (!user) return;

    // Display user name
    document.getElementById('userName').textContent = user.name;

    // Load pending visits
    loadHostVisits();
  })();

  async function loadHostVisits(status = null) {
    const result = await Visits.getHostVisits(status);

    if (result.success) {
      const container = document.getElementById('visitsList');
      container.innerHTML = '';

      result.data.visits.forEach(visit => {
        const isPending = visit.status === 'pending_host_review';

        container.innerHTML += `
          <div class="visit-card">
            <h4>${visit.purpose}</h4>
            <p>Guest: ${visit.guest.name} (${visit.guest.email})</p>
            <p>Phone: ${visit.guest.phone || 'N/A'}</p>
            <p>Date: ${new Date(visit.visit_date).toLocaleDateString()}</p>
            <span class="${Visits.getStatusBadgeClass(visit.status)}">
              ${Visits.getStatusText(visit.status)}
            </span>
            ${isPending ? `
              <div class="actions">
                <button onclick="approveVisit(${visit.id})" class="btn btn-success">Approve</button>
                <button onclick="rejectVisit(${visit.id})" class="btn btn-danger">Reject</button>
              </div>
            ` : ''}
          </div>
        `;
      });
    }
  }

  async function approveVisit(visitId) {
    if (confirm('Are you sure you want to approve this visit request?')) {
      const result = await Visits.approve(visitId);

      if (result.success) {
        alert('Visit request approved!');
        loadHostVisits();
      } else {
        alert(result.message);
      }
    }
  }

  async function rejectVisit(visitId) {
    const reason = prompt('Please enter the rejection reason:');

    if (reason && reason.trim()) {
      const result = await Visits.reject(visitId, reason.trim());

      if (result.success) {
        alert('Visit request rejected.');
        loadHostVisits();
      } else {
        alert(result.message);
      }
    }
  }

  // Filter buttons
  function filterByStatus(status) {
    loadHostVisits(status);
  }
</script>
```

---

## Role-Based Access Summary

| Endpoint                      | Guest | Host | Security | Admin |
|-------------------------------|-------|------|----------|-------|
| POST /api/visits              | ✅    | ❌   | ❌       | ❌    |
| GET /api/visits/me            | ✅    | ❌   | ❌       | ❌    |
| GET /api/visits/host          | ❌    | ✅   | ❌       | ❌    |
| PATCH /api/visits/:id/approve | ❌    | ✅   | ❌       | ❌    |
| PATCH /api/visits/:id/reject  | ❌    | ✅   | ❌       | ❌    |

