const pool = require('../database/db');

/**
 * Admin Model - handles admin-related database operations
 */
class Admin {
  /**
   * Get all visit requests with associated passes
   * @returns {Promise<Array>}
   */
  static async getAllVisitsWithPasses() {
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
          'id', g.id,
          'name', g.name,
          'email', g.email,
          'phone', g.phone
        ) as guest,
        json_build_object(
          'id', h.id,
          'name', h.name,
          'email', h.email
        ) as host,
        CASE WHEN p.id IS NOT NULL THEN
          json_build_object(
            'id', p.id,
            'code', p.code,
            'valid_from', p.valid_from,
            'valid_until', p.valid_until,
            'is_used', p.is_used,
            'created_at', p.created_at,
            'issued_by_name', s.name
          )
        ELSE NULL END as pass
       FROM "VisitRequest" vr
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       LEFT JOIN "Pass" p ON vr.id = p.visit_request_id
       LEFT JOIN "User" s ON p.issued_by = s.id
       ORDER BY vr.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Get people currently present (checked in but not checked out)
   * @returns {Promise<Array>}
   */
  static async getPresentPeople() {
    const result = await pool.query(
      `SELECT 
        tl.id as traffic_log_id,
        tl.checked_in_at,
        p.code as pass_code,
        p.valid_until,
        vr.purpose,
        vr.visit_date,
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
       FROM "TrafficLog" tl
       JOIN "Pass" p ON tl.pass_id = p.id
       JOIN "VisitRequest" vr ON p.visit_request_id = vr.id
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       WHERE tl.checked_out_at IS NULL
       ORDER BY tl.checked_in_at DESC`
    );
    return result.rows;
  }

  /**
   * Update user role
   * @param {number} userId
   * @param {string} role
   * @returns {Promise<Object>}
   */
  static async updateUserRole(userId, role) {
    const result = await pool.query(
      `UPDATE "User" SET role = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, name, email, phone, role, created_at, updated_at`,
      [role, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get system statistics
   * @returns {Promise<Object>}
   */
  static async getStats() {
    // Get user count by role
    const userStatsResult = await pool.query(
      `SELECT role, COUNT(*) as count FROM "User" GROUP BY role`
    );

    // Get visit request count by status
    const visitStatsResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM "VisitRequest" GROUP BY status`
    );

    // Get today's visits count
    const todayVisitsResult = await pool.query(
      `SELECT COUNT(*) as count FROM "VisitRequest" 
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    // Get currently present people count
    const presentCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM "TrafficLog" 
       WHERE checked_out_at IS NULL`
    );

    // Get today's check-ins count
    const todayCheckInsResult = await pool.query(
      `SELECT COUNT(*) as count FROM "TrafficLog" 
       WHERE DATE(checked_in_at) = CURRENT_DATE`
    );

    // Get last week's check-ins count
    const weekCheckInsResult = await pool.query(
      `SELECT COUNT(*) as count FROM "TrafficLog" 
       WHERE checked_in_at >= CURRENT_DATE - INTERVAL '7 days'`
    );

    return {
      usersByRole: userStatsResult.rows,
      visitsByStatus: visitStatsResult.rows,
      todayVisits: parseInt(todayVisitsResult.rows[0]?.count || 0),
      presentCount: parseInt(presentCountResult.rows[0]?.count || 0),
      todayCheckIns: parseInt(todayCheckInsResult.rows[0]?.count || 0),
      weekCheckIns: parseInt(weekCheckInsResult.rows[0]?.count || 0)
    };
  }
}

module.exports = Admin;

