const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route   GET /api/admin/reports/log
 * @desc    Get full system report (users, visits, passes)
 * @access  Private (Admin only)
 */
router.get('/reports/log', authenticateToken, authorizeRoles('admin'), adminController.getFullReport);

/**
 * @route   GET /api/admin/reports/present
 * @desc    Get people currently present (checked in, not checked out)
 * @access  Private (Admin only)
 */
router.get('/reports/present', authenticateToken, authorizeRoles('admin'), adminController.getPresentPeople);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/users', authenticateToken, authorizeRoles('admin'), adminController.getAllUsers);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin only)
 */
router.patch('/users/:id/role', authenticateToken, authorizeRoles('admin'), adminController.changeUserRole);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticateToken, authorizeRoles('admin'), adminController.getStats);

module.exports = router;

