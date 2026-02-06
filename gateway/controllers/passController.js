const { VisitRequest, Pass, TrafficLog } = require('../models');

/**
 * Pass Controller - handles pass and traffic operations
 */
const passController = {
  /**
   * Get all visit requests pending security review
   * GET /api/passes/pending
   */
  getPendingVisits: async (req, res) => {
    try {
      const visits = await VisitRequest.findPendingSecurity();

      res.status(200).json({
        success: true,
        data: {
          visits,
          count: visits.length
        }
      });
    } catch (error) {
      console.error('Get pending visits error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Approve a visit request and create an entry permit
   * PATCH /api/passes/:id/approve
   */
  approveAndIssuePass: async (req, res) => {
    try {
      const { id } = req.params;
      const security_id = req.user.id;

      // Check if visit request exists and get details
      const visitRequest = await VisitRequest.findByIdWithDetails(id);
      if (!visitRequest) {
        return res.status(404).json({
          success: false,
          message: 'Visit request not found'
        });
      }

      if (visitRequest.status !== 'pending_security') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve this request. Current status: ${visitRequest.status}`
        });
      }

      // Create pass
      const { pass, validityHours } = await Pass.create(id, security_id);

      res.status(200).json({
        success: true,
        message: 'Entry permit created successfully',
        data: {
          pass: {
            id: pass.id,
            code: pass.code,
            valid_from: pass.valid_from,
            valid_until: pass.valid_until,
            validity_hours: validityHours,
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
      console.error('Create pass error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Reject a visit request (security)
   * PATCH /api/passes/:id/reject
   */
  rejectVisit: async (req, res) => {
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

      // Check if visit request exists and get details
      const visitRequest = await VisitRequest.findByIdWithDetails(id);
      if (!visitRequest) {
        return res.status(404).json({
          success: false,
          message: 'Visit request not found'
        });
      }

      if (visitRequest.status !== 'pending_security') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject this request. Current status: ${visitRequest.status}`
        });
      }

      // Update status to rejected_by_security with reason
      const updatedVisit = await VisitRequest.reject(id, 'rejected_by_security', reason.trim());

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
  },

  /**
   * Register check-in for a valid pass
   * POST /api/passes/check-in
   */
  checkIn: async (req, res) => {
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
      const pass = await Pass.findByCode(code);
      if (!pass) {
        return res.status(404).json({
          success: false,
          message: 'Invalid pass code'
        });
      }

      const now = new Date();

      // Check if pass is already used
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

      // Create check-in record
      const trafficLog = await TrafficLog.checkIn(pass.id, security_id);

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
      console.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Register check-out for a checked-in pass
   * POST /api/passes/check-out
   */
  checkOut: async (req, res) => {
    try {
      const { code } = req.body;

      // Validate required fields
      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Pass code is required'
        });
      }

      // Find the pass with traffic log
      const pass = await Pass.findByCodeWithTraffic(code);
      if (!pass) {
        return res.status(404).json({
          success: false,
          message: 'Invalid pass code'
        });
      }

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

      // Update check-out time
      const trafficLog = await TrafficLog.checkOut(pass.traffic_log_id);

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
  },

  /**
   * Get pass details by code
   * GET /api/passes/:code
   */
  getPassByCode: async (req, res) => {
    try {
      const { code } = req.params;

      // Find the pass with full details
      const pass = await Pass.findByCodeWithFullDetails(code);
      if (!pass) {
        return res.status(404).json({
          success: false,
          message: 'Pass not found'
        });
      }

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
  }
};

module.exports = passController;

