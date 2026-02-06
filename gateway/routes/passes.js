const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

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
 * @route   GET /api/passes/pending
 * @desc    Get all visit requests approved by hosts (pending security review)
 * @access  Private (Security only)
 */
router.get('/pending', authenticateToken, authorizeRoles('security'), async (req, res) => {
  try {
    // Get all visit requests with status 'pending_security'
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

    res.status(200).json({
      success: true,
      data: {
        visits: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get pending visits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PATCH /api/passes/:id/approve
 * @desc    Approve a visit request and create an entry permit
 * @access  Private (Security only)
 */
router.patch('/:id/approve', authenticateToken, authorizeRoles('security'), async (req, res) => {
  try {
    const { id } = req.params;
    const security_id = req.user.id;

    // Check if visit request exists and is in the correct status
    const visitResult = await pool.query(
      `SELECT vr.*, 
        g.name as guest_name, g.email as guest_email,
        h.name as host_name, h.email as host_email
       FROM "VisitRequest" vr
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       WHERE vr.id = $1`,
      [id]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    const visitRequest = visitResult.rows[0];

    if (visitRequest.status !== 'pending_security') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve this request. Current status: ${visitRequest.status}`
      });
    }

    // Generate unique pass code
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

    // Calculate valid_from and valid_until using fixed duration
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + PASS_VALIDITY_HOURS * 60 * 60 * 1000);

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update visit request status
      await client.query(
        `UPDATE "VisitRequest" SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      // Create entry permit (Pass)
      const passResult = await client.query(
        `INSERT INTO "Pass" (visit_request_id, code, issued_by, valid_from, valid_until)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code, valid_from, valid_until, is_used, created_at`,
        [id, passCode, security_id, validFrom, validUntil]
      );

      await client.query('COMMIT');

      const pass = passResult.rows[0];

      res.status(200).json({
        success: true,
        message: 'Entry permit created successfully',
        data: {
          pass: {
            id: pass.id,
            code: pass.code,
            valid_from: pass.valid_from,
            valid_until: pass.valid_until,
            validity_hours: PASS_VALIDITY_HOURS,
            is_used: pass.is_used,
            created_at: pass.created_at
          },
          visit_request: {
            id: visitRequest.id,
            purpose: visitRequest.purpose,
            visit_date: visitRequest.visit_date,
            guest: {
              name: visitRequest.guest_name,
              email: visitRequest.guest_email
            },
            host: {
              name: visitRequest.host_name,
              email: visitRequest.host_email
            }
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PATCH /api/passes/:id/reject
 * @desc    Reject a visit request (security)
 * @access  Private (Security only)
 * @body    { reason }
 */
router.patch('/:id/reject', authenticateToken, authorizeRoles('security'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate required fields
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Check if visit request exists and is in the correct status
    const visitResult = await pool.query(
      `SELECT vr.*, 
        g.name as guest_name, g.email as guest_email,
        h.name as host_name
       FROM "VisitRequest" vr
       JOIN "User" g ON vr.guest_id = g.id
       JOIN "User" h ON vr.host_id = h.id
       WHERE vr.id = $1`,
      [id]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    const visitRequest = visitResult.rows[0];

    if (visitRequest.status !== 'pending_security') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject this request. Current status: ${visitRequest.status}`
      });
    }

    // Update visit request status and rejection reason
    const result = await pool.query(
      `UPDATE "VisitRequest" 
       SET status = 'rejected_by_security', 
           rejection_reason = $1,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING id, purpose, visit_date, status, rejection_reason, updated_at`,
      [reason.trim(), id]
    );

    const updatedVisit = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Visit request rejected by security',
      data: {
        visit: {
          id: updatedVisit.id,
          purpose: updatedVisit.purpose,
          visit_date: updatedVisit.visit_date,
          status: updatedVisit.status,
          rejection_reason: updatedVisit.rejection_reason,
          updated_at: updatedVisit.updated_at,
          guest: {
            name: visitRequest.guest_name,
            email: visitRequest.guest_email
          },
          host: {
            name: visitRequest.host_name
          }
        }
      }
    });
  } catch (error) {
    console.error('Reject visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/passes/check-in
 * @desc    Register check-in for a valid pass
 * @access  Private (Security only)
 * @body    { code }
 */
router.post('/check-in', authenticateToken, authorizeRoles('security'), async (req, res) => {
  try {
    const { code } = req.body;
    const security_id = req.user.id;

    // Validate required fields
    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pass code is required'
      });
    }

    // Find the pass
    const passResult = await pool.query(
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

    if (passResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid pass code'
      });
    }

    const pass = passResult.rows[0];
    const now = new Date();

    // Check if pass is already used (check-in already registered)
    if (pass.is_used) {
      return res.status(400).json({
        success: false,
        message: 'This pass has already been used for check-in'
      });
    }

    // Check if pass is expired
    if (now > new Date(pass.valid_until)) {
      return res.status(400).json({
        success: false,
        message: 'This pass has expired'
      });
    }

    // Check if pass is valid yet
    if (now < new Date(pass.valid_from)) {
      return res.status(400).json({
        success: false,
        message: 'This pass is not yet valid'
      });
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Mark pass as used
      await client.query(
        `UPDATE "Pass" SET is_used = TRUE WHERE id = $1`,
        [pass.id]
      );

      // Create traffic log entry
      const logResult = await client.query(
        `INSERT INTO "TrafficLog" (pass_id, checked_in_at, recorded_by)
         VALUES ($1, $2, $3)
         RETURNING id, checked_in_at`,
        [pass.id, now, security_id]
      );

      await client.query('COMMIT');

      const trafficLog = logResult.rows[0];

      res.status(200).json({
        success: true,
        message: 'Check-in registered successfully',
        data: {
          traffic_log_id: trafficLog.id,
          checked_in_at: trafficLog.checked_in_at,
          pass: {
            id: pass.id,
            code: pass.code,
            valid_until: pass.valid_until
          },
          guest: {
            name: pass.guest_name,
            email: pass.guest_email
          },
          host: {
            name: pass.host_name
          },
          purpose: pass.purpose,
          visit_date: pass.visit_date
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/passes/check-out
 * @desc    Register check-out for a checked-in pass
 * @access  Private (Security only)
 * @body    { code }
 */
router.post('/check-out', authenticateToken, authorizeRoles('security'), async (req, res) => {
  try {
    const { code } = req.body;

    // Validate required fields
    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pass code is required'
      });
    }

    // Find the pass and its traffic log
    const passResult = await pool.query(
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

    if (passResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid pass code'
      });
    }

    const pass = passResult.rows[0];

    // Check if pass has been checked in
    if (!pass.traffic_log_id) {
      return res.status(400).json({
        success: false,
        message: 'This pass has not been checked in yet'
      });
    }

    // Check if already checked out
    if (pass.checked_out_at) {
      return res.status(400).json({
        success: false,
        message: 'This pass has already been checked out'
      });
    }

    const now = new Date();

    // Update traffic log with check-out time
    const result = await pool.query(
      `UPDATE "TrafficLog" 
       SET checked_out_at = $1 
       WHERE id = $2
       RETURNING id, checked_in_at, checked_out_at`,
      [now, pass.traffic_log_id]
    );

    const trafficLog = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Check-out registered successfully',
      data: {
        traffic_log_id: trafficLog.id,
        checked_in_at: trafficLog.checked_in_at,
        checked_out_at: trafficLog.checked_out_at,
        pass: {
          id: pass.id,
          code: pass.code
        },
        guest: {
          name: pass.guest_name,
          email: pass.guest_email
        },
        host: {
          name: pass.host_name
        },
        purpose: pass.purpose,
        visit_date: pass.visit_date
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/passes/:code
 * @desc    Get pass details by code
 * @access  Private (Security only)
 */
router.get('/:code', authenticateToken, authorizeRoles('security'), async (req, res) => {
  try {
    const { code } = req.params;

    // Find the pass
    const passResult = await pool.query(
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

    if (passResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pass not found'
      });
    }

    const pass = passResult.rows[0];
    const now = new Date();

    // Determine pass status
    let passStatus = 'valid';
    if (pass.checked_out_at) {
      passStatus = 'completed';
    } else if (pass.checked_in_at) {
      passStatus = 'checked_in';
    } else if (now > new Date(pass.valid_until)) {
      passStatus = 'expired';
    } else if (now < new Date(pass.valid_from)) {
      passStatus = 'not_yet_valid';
    }

    res.status(200).json({
      success: true,
      data: {
        pass: {
          id: pass.id,
          code: pass.code,
          valid_from: pass.valid_from,
          valid_until: pass.valid_until,
          is_used: pass.is_used,
          status: passStatus,
          created_at: pass.created_at
        },
        traffic: pass.traffic_log_id ? {
          checked_in_at: pass.checked_in_at,
          checked_out_at: pass.checked_out_at
        } : null,
        visit: {
          purpose: pass.purpose,
          visit_date: pass.visit_date
        },
        guest: {
          id: pass.guest_id,
          name: pass.guest_name,
          email: pass.guest_email,
          phone: pass.guest_phone
        },
        host: {
          id: pass.host_id,
          name: pass.host_name,
          email: pass.host_email
        },
        issued_by: {
          name: pass.issued_by_name
        }
      }
    });
  } catch (error) {
    console.error('Get pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

