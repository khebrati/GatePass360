const express = require('express');
const router = express.Router();
const { visitController } = require('../controllers');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route   POST /api/visits
 * @desc    Create a new visit request
 * @access  Private (Guest only)
 */
router.post('/', authenticateToken, authorizeRoles('guest'), visitController.createVisit);

/**
 * @route   GET /api/visits/me
 * @desc    Get all visit requests for the current guest
 * @access  Private (Guest only)
 */
router.get('/me', authenticateToken, authorizeRoles('guest'), visitController.getMyVisits);

/**
 * @route   GET /api/visits/host
 * @desc    Get all visit requests assigned to the current host
 * @access  Private (Host only)
 */
router.get('/host', authenticateToken, authorizeRoles('host'), visitController.getHostVisits);

/**
 * @route   PATCH /api/visits/:id/approve
 * @desc    Approve a visit request (by host)
 * @access  Private (Host only)
 */
router.patch('/:id/approve', authenticateToken, authorizeRoles('host'), visitController.approveVisit);

/**
 * @route   PATCH /api/visits/:id/reject
 * @desc    Reject a visit request (by host)
 * @access  Private (Host only)
 */
router.patch('/:id/reject', authenticateToken, authorizeRoles('host'), visitController.rejectVisit);

module.exports = router;

