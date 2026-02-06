const pool = require('../database/db');

/**
 * TrafficLog Model - handles all database operations for traffic logs
 */
class TrafficLog {
  /**
   * Create check-in record
   * @param {number} passId
   * @param {number} recordedBy - security user ID
   * @returns {Promise<Object>}
   */
  static async checkIn(passId, recordedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date();

      // Mark pass as used
      await client.query(
        `UPDATE "Pass" SET is_used = TRUE WHERE id = $1`,
        [passId]
      );

      // Create traffic log entry
      const result = await client.query(
        `INSERT INTO "TrafficLog" (pass_id, checked_in_at, recorded_by)
         VALUES ($1, $2, $3)
         RETURNING id, checked_in_at`,
        [passId, now, recordedBy]
      );

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update check-out time
   * @param {number} id - traffic log ID
   * @returns {Promise<Object>}
   */
  static async checkOut(id) {
    const now = new Date();
    const result = await pool.query(
      `UPDATE "TrafficLog" 
       SET checked_out_at = $1 
       WHERE id = $2
       RETURNING id, checked_in_at, checked_out_at`,
      [now, id]
    );
    return result.rows[0];
  }

  /**
   * Find traffic log by pass ID
   * @param {number} passId
   * @returns {Promise<Object|null>}
   */
  static async findByPassId(passId) {
    const result = await pool.query(
      `SELECT id, pass_id, checked_in_at, checked_out_at, recorded_by, created_at
       FROM "TrafficLog"
       WHERE pass_id = $1`,
      [passId]
    );
    return result.rows[0] || null;
  }
}

module.exports = TrafficLog;

