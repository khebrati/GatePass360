const { User, Admin } = require('../models');

/**
 * Admin Controller - handles admin-related operations
 */
const adminController = {
  /**
   * Get full system report (users, visits, passes)
   * GET /api/admin/reports/log
   */
  getFullReport: async (req, res) => {
    try {
      // Get all users
      const users = await User.findAll();

      // Get all visit requests with associated passes
      const visits = await Admin.getAllVisitsWithPasses();

      res.status(200).json({
        success: true,
        data: {
          users: {
            list: users,
            count: users.length
          },
          visits: {
            list: visits,
            count: visits.length
          },
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get full report error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get people currently present (checked in but not checked out)
   * GET /api/admin/reports/present
   */
  getPresentPeople: async (req, res) => {
    try {
      const presentPeople = await Admin.getPresentPeople();

      res.status(200).json({
        success: true,
        data: {
          present: presentPeople,
          count: presentPeople.length,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get present people error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Change user role
   * PATCH /api/admin/users/:id/role
   */
  changeUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['guest', 'host', 'security', 'admin'];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be one of: guest, host, security, admin'
        });
      }

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user role
      const updatedUser = await Admin.updateUserRole(id, role);

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Change user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get all users
   * GET /api/admin/users
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  getStats: async (req, res) => {
    try {
      const stats = await Admin.getStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = adminController;

