const pool = require('../database/db');

/**
 * VisitRequest Model - handles all database operations for visit requests
 */
class VisitRequest {
  /**
   * Create a new visit request
   * @param {Object} data - { guest_id, host_id, purpose, description, visit_date }
   * @returns {Promise<Object>}
   */
  static async create({ guest_id, host_id, purpose, description, visit_date }) {
    const result = await pool.query(
      `INSERT INTO "VisitRequest" (guest_id, host_id, purpose, description, visit_date, status)
       VALUES ($1, $2, $3, $4, $5, 'pending_host_review')
       RETURNING id, guest_id, host_id, purpose, description, visit_date, status, created_at`,
      [guest_id, host_id, purpose, description || null, visit_date]
    );
    return result.rows[0];
  }

  /**
   * Find visit request by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, status, guest_id, host_id, purpose, visit_date, rejection_reason, created_at, updated_at
       FROM "VisitRequest" 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find visit request by ID with full details
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findByIdWithDetails(id) {
    const result = await pool.query(
      `SELECT vr.*, 
        g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
        h.name as host_name, h.email as host_email
       FROM "VisitRequest" vr
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       WHERE vr.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all visit requests for a guest
   * @param {number} guestId
   * @returns {Promise<Array>}
   */
  static async findByGuestId(guestId) {
    const result = await pool.query(
      `SELECT 
        vr.id,
        vr.purpose,
        vr.description,
        vr.visit_date,
        vr.status,
        vr.rejection_reason,
        vr.created_at,
        vr.updated_at,
        json_build_object(
          'id', h.id,
          'name', h.name,
          'email', h.email
        ) as host
       FROM "VisitRequest" vr
       JOIN "User" h ON vr.host_id = h.id
       WHERE vr.guest_id = $1
       ORDER BY vr.created_at DESC`,
      [guestId]
    );
    return result.rows;
  }

  /**
   * Get all visit requests for a host
   * @param {number} hostId
   * @param {string} status - optional status filter
   * @returns {Promise<Array>}
   */
  static async findByHostId(hostId, status = null) {
    let query = `
      SELECT 
        vr.id,
        vr.purpose,
        vr.description,
        vr.visit_date,
        vr.status,
        vr.rejection_reason,
        vr.created_at,
        vr.updated_at,
        json_build_object(
          'id', g.id,
          'name', g.name,
          'email', g.email,
          'phone', g.phone
        ) as guest
       FROM "VisitRequest" vr
       JOIN "User" g ON vr.guest_id = g.id
       WHERE vr.host_id = $1
    `;

    const params = [hostId];

    if (status) {
      query += ' AND vr.status = $2';
      params.push(status);
    }

    query += ' ORDER BY vr.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get all visit requests pending security review
   * @returns {Promise<Array>}
   */
  static async findPendingSecurity() {
    const result = await pool.query(
      `SELECT 
        vr.id,
        vr.purpose,
        vr.visit_date,
        vr.status,
        vr.created_at,
        vr.updated_at,
        json_build_object(
          'id', g.id,
          'name', g.name,
          'email', g.email,
          'phone', g.phone
        ) as guest,
        json_build_object(
          'id', h.id,
          'name', h.name,
          'email', h.email
        ) as host
       FROM "VisitRequest" vr
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       WHERE vr.status = 'pending_security'
       ORDER BY vr.visit_date, vr.created_at`
    );
    return result.rows;
  }

  /**
   * Update visit request status (host approval)
   * @param {number} id
   * @param {string} status
   * @returns {Promise<Object>}
   */
  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE "VisitRequest" 
       SET status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, purpose, visit_date, status, updated_at`,
      [id, status]
    );
    return result.rows[0];
  }

  /**
   * Reject visit request with reason
   * @param {number} id
   * @param {string} status
   * @param {string} rejectionReason
   * @returns {Promise<Object>}
   */
  static async reject(id, status, rejectionReason) {
    const result = await pool.query(
      `UPDATE "VisitRequest" 
       SET status = $2, 
           rejection_reason = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, purpose, visit_date, status, rejection_reason, updated_at`,
      [id, status, rejectionReason]
    );
    return result.rows[0];
  }
}

module.exports = VisitRequest;

