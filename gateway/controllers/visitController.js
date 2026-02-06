const { User, VisitRequest } = require('../models');

/**
 * Visit Controller - handles visit request operations
 */
const visitController = {
  /**
   * Create a new visit request
   * POST /api/visits
   */
  createVisit: async (req, res) => {
    try {
      const { host_email, purpose, description, visit_date } = req.body;
      const guest_id = req.user.id;

      // Validate required fields
      if (!host_email || !purpose || !visit_date) {
        return res.status(400).json({
          success: false,
          message: 'Host email, purpose, and visit date are required'
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

      // Find host by email and verify they have 'host' role
      const host = await User.findHostByEmail(host_email);
      if (!host) {
        return res.status(404).json({
          success: false,
          message: 'Host not found or user is not a host'
        });
      }

      // Create visit request
      const visitRequest = await VisitRequest.create({
        guest_id,
        host_id: host.id,
        purpose,
        description,
        visit_date
      });

      res.status(201).json({
        success: true,
        message: 'Visit request created successfully',
        data: {
          visit: {
            id: visitRequest.id,
            purpose: visitRequest.purpose,
            description: visitRequest.description,
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
  },

  /**
   * Get all visit requests for the current guest
   * GET /api/visits/me
   */
  getMyVisits: async (req, res) => {
    try {
      const guest_id = req.user.id;
      const visits = await VisitRequest.findByGuestId(guest_id);

      res.status(200).json({
        success: true,
        data: {
          visits,
          count: visits.length
        }
      });
    } catch (error) {
      console.error('Get guest visits error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get all visit requests assigned to the current host
   * GET /api/visits/host
   */
  getHostVisits: async (req, res) => {
    try {
      const host_id = req.user.id;
      const { status } = req.query;

      const visits = await VisitRequest.findByHostId(host_id, status);

      res.status(200).json({
        success: true,
        data: {
          visits,
          count: visits.length
        }
      });
    } catch (error) {
      console.error('Get host visits error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Approve a visit request (by host)
   * PATCH /api/visits/:id/approve
   */
  approveVisit: async (req, res) => {
    try {
      const { id } = req.params;
      const host_id = req.user.id;

      // Check if visit request exists
      const visit = await VisitRequest.findById(id);
      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit request not found'
        });
      }

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
      const updatedVisit = await VisitRequest.updateStatus(id, 'pending_security');

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
  },

  /**
   * Reject a visit request (by host)
   * PATCH /api/visits/:id/reject
   */
  rejectVisit: async (req, res) => {
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
      const visit = await VisitRequest.findById(id);
      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit request not found'
        });
      }

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
      const updatedVisit = await VisitRequest.reject(id, 'rejected_by_host', rejection_reason.trim());

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
  }
};

module.exports = visitController;

