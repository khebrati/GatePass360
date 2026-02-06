const pool = require('../database/db');
const crypto = require('crypto');

// Fixed pass validity duration in hours (configured at backend)
const PASS_VALIDITY_HOURS = 8;

/**
 * Generate a unique pass code
 * @returns {string} A unique 8-character alphanumeric code
 */
const generatePassCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Pass Model - handles all database operations for passes
 */
class Pass {
  /**
   * Generate a unique pass code that doesn't exist in database
   * @returns {Promise<string>}
   */
  static async generateUniqueCode() {
    let passCode;
    let codeExists = true;
    while (codeExists) {
      passCode = generatePassCode();
      const existing = await pool.query(
        'SELECT id FROM "Pass" WHERE code = $1',
        [passCode]
      );
      codeExists = existing.rows.length > 0;
    }
    return passCode;
  }

  /**
   * Create a new pass with transaction
   * @param {number} visitRequestId
   * @param {number} issuedBy - security user ID
   * @returns {Promise<Object>}
   */
  static async create(visitRequestId, issuedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update visit request status
      await client.query(
        `UPDATE "VisitRequest" SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [visitRequestId]
      );

      // Generate unique pass code
      const passCode = await this.generateUniqueCode();

      // Calculate validity period
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() + PASS_VALIDITY_HOURS * 60 * 60 * 1000);

      // Create pass
      const passResult = await client.query(
        `INSERT INTO "Pass" (visit_request_id, code, issued_by, valid_from, valid_until)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code, valid_from, valid_until, is_used, created_at`,
        [visitRequestId, passCode, issuedBy, validFrom, validUntil]
      );

      await client.query('COMMIT');

      return {
        pass: passResult.rows[0],
        validityHours: PASS_VALIDITY_HOURS
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find pass by code
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  static async findByCode(code) {
    const result = await pool.query(
      `SELECT p.*, vr.guest_id, vr.purpose, vr.visit_date,
        g.name as guest_name, g.email as guest_email,
        h.name as host_name
       FROM "Pass" p
       JOIN "VisitRequest" vr ON p.visit_request_id = vr.id
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       WHERE p.code = $1`,
      [code.trim().toUpperCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Find pass by code with traffic log
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  static async findByCodeWithTraffic(code) {
    const result = await pool.query(
      `SELECT p.*, tl.id as traffic_log_id, tl.checked_in_at, tl.checked_out_at,
        vr.guest_id, vr.purpose, vr.visit_date,
        g.name as guest_name, g.email as guest_email,
        h.name as host_name
       FROM "Pass" p
       JOIN "VisitRequest" vr ON p.visit_request_id = vr.id
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       LEFT JOIN "TrafficLog" tl ON p.id = tl.pass_id
       WHERE p.code = $1`,
      [code.trim().toUpperCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Find pass by code with full details
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  static async findByCodeWithFullDetails(code) {
    const result = await pool.query(
      `SELECT p.*, 
        tl.id as traffic_log_id, tl.checked_in_at, tl.checked_out_at,
        vr.purpose, vr.visit_date, vr.status as visit_status,
        g.id as guest_id, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
        h.id as host_id, h.name as host_name, h.email as host_email,
        s.name as issued_by_name
       FROM "Pass" p
       JOIN "VisitRequest" vr ON p.visit_request_id = vr.id
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       JOIN "User" s ON p.issued_by = s.id
       LEFT JOIN "TrafficLog" tl ON p.id = tl.pass_id
       WHERE p.code = $1`,
      [code.trim().toUpperCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Mark pass as used
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async markAsUsed(id) {
    await pool.query(
      `UPDATE "Pass" SET is_used = TRUE WHERE id = $1`,
      [id]
    );
  }

  /**
   * Get pass validity hours
   * @returns {number}
   */
  static getValidityHours() {
    return PASS_VALIDITY_HOURS;
  }
}

module.exports = Pass;

