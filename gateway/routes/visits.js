const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route   POST /api/visits
 * @desc    Create a new visit request
 * @access  Private (Guest only)
 */
router.post('/', authenticateToken, authorizeRoles('guest'), async (req, res) => {
  try {
    const { host_id, purpose, visit_date } = req.body;
    const guest_id = req.user.id;

    // Validate required fields
    if (!host_id || !purpose || !visit_date) {
      return res.status(400).json({
        success: false,
        message: 'Host ID, purpose, and visit date are required'
      });
    }

    // Validate visit_date format and ensure it's not in the past
    const visitDateObj = new Date(visit_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(visitDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visit date format'
      });
    }

    if (visitDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Visit date cannot be in the past'
      });
    }

    // Verify host exists and has 'host' role
    const hostResult = await pool.query(
      'SELECT id, name, email FROM "User" WHERE id = $1 AND role = $2',
      [host_id, 'host']
    );

    if (hostResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Host not found or user is not a host'
      });
    }

    // Create visit request with initial status
    const result = await pool.query(
      `INSERT INTO "VisitRequest" (guest_id, host_id, purpose, visit_date, status)
       VALUES ($1, $2, $3, $4, 'pending_host_review')
       RETURNING id, guest_id, host_id, purpose, visit_date, status, created_at`,
      [guest_id, host_id, purpose, visit_date]
    );

    const visitRequest = result.rows[0];

    // Get host info for response
    const host = hostResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Visit request created successfully',
      data: {
        visit: {
          id: visitRequest.id,
          purpose: visitRequest.purpose,
          visit_date: visitRequest.visit_date,
          status: visitRequest.status,
          created_at: visitRequest.created_at,
          host: {
            id: host.id,
            name: host.name,
            email: host.email
          }
        }
      }
    });
  } catch (error) {
    console.error('Create visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/visits/me
 * @desc    Get all visit requests for the current guest
 * @access  Private (Guest only)
 */
router.get('/me', authenticateToken, authorizeRoles('guest'), async (req, res) => {
  try {
    const guest_id = req.user.id;

    // Get all visit requests for the guest with host info
    const result = await pool.query(
      `SELECT 
        vr.id,
        vr.purpose,
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
      [guest_id]
    );

    res.status(200).json({
      success: true,
      data: {
        visits: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get guest visits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/visits/host
 * @desc    Get all visit requests assigned to the current host
 * @access  Private (Host only)
 */
router.get('/host', authenticateToken, authorizeRoles('host'), async (req, res) => {
  try {
    const host_id = req.user.id;

    // Optional status filter
    const { status } = req.query;

    let query = `
      SELECT 
        vr.id,
        vr.purpose,
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

    const params = [host_id];

    // Add status filter if provided
    if (status) {
      query += ' AND vr.status = $2';
      params.push(status);
    }

    query += ' ORDER BY vr.created_at DESC';

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        visits: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get host visits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PATCH /api/visits/:id/approve
 * @desc    Approve a visit request (by host)
 * @access  Private (Host only)
 */
router.patch('/:id/approve', authenticateToken, authorizeRoles('host'), async (req, res) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    // Check if visit request exists and belongs to this host
    const visitResult = await pool.query(
      `SELECT id, status, guest_id, host_id 
       FROM "VisitRequest" 
       WHERE id = $1`,
      [id]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    const visit = visitResult.rows[0];

    // Verify this host owns the request
    if (visit.host_id !== host_id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this request'
      });
    }

    // Check if request is in the correct status
    if (visit.status !== 'pending_host_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status: ${visit.status}`
      });
    }

    // Update status to pending_security
    const result = await pool.query(
      `UPDATE "VisitRequest" 
       SET status = 'pending_security', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, purpose, visit_date, status, updated_at`,
      [id]
    );

    const updatedVisit = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Visit request approved successfully',
      data: {
        visit: updatedVisit
      }
    });
  } catch (error) {
    console.error('Approve visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PATCH /api/visits/:id/reject
 * @desc    Reject a visit request (by host)
 * @access  Private (Host only)
 */
router.patch('/:id/reject', authenticateToken, authorizeRoles('host'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const host_id = req.user.id;

    // Validate rejection reason
    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Check if visit request exists
    const visitResult = await pool.query(
      `SELECT id, status, guest_id, host_id 
       FROM "VisitRequest" 
       WHERE id = $1`,
      [id]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    const visit = visitResult.rows[0];

    // Verify this host owns the request
    if (visit.host_id !== host_id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this request'
      });
    }

    // Check if request is in the correct status
    if (visit.status !== 'pending_host_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${visit.status}`
      });
    }

    // Update status to rejected_by_host with reason
    const result = await pool.query(
      `UPDATE "VisitRequest" 
       SET status = 'rejected_by_host', 
           rejection_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, purpose, visit_date, status, rejection_reason, updated_at`,
      [id, rejection_reason.trim()]
    );

    const updatedVisit = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Visit request rejected',
      data: {
        visit: updatedVisit
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

module.exports = router;

