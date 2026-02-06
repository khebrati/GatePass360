const express = require('express');
const router = express.Router();
const { passController } = require('../controllers');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route   GET /api/passes/pending
 * @desc    Get all visit requests approved by hosts (pending security review)
 * @access  Private (Security only)
 */
router.get('/pending', authenticateToken, authorizeRoles('security'), passController.getPendingVisits);

/**
 * @route   PATCH /api/passes/:id/approve
 * @desc    Approve a visit request and create an entry permit
 * @access  Private (Security only)
 */
router.patch('/:id/approve', authenticateToken, authorizeRoles('security'), passController.approveAndIssuePass);

/**
 * @route   PATCH /api/passes/:id/reject
 * @desc    Reject a visit request (security)
 * @access  Private (Security only)
 * @body    { reason }
 */
router.patch('/:id/reject', authenticateToken, authorizeRoles('security'), passController.rejectVisit);

/**
 * @route   POST /api/passes/check-in
 * @desc    Register check-in for a valid pass
 * @access  Private (Security only)
 * @body    { code }
 */
router.post('/check-in', authenticateToken, authorizeRoles('security'), passController.checkIn);

/**
 * @route   POST /api/passes/check-out
 * @desc    Register check-out for a checked-in pass
 * @access  Private (Security only)
 * @body    { code }
 */
router.post('/check-out', authenticateToken, authorizeRoles('security'), passController.checkOut);

/**
 * @route   GET /api/passes/:code
 * @desc    Get pass details by code
 * @access  Private (Security only)
 */
router.get('/:code', authenticateToken, authorizeRoles('security'), passController.getPassByCode);

module.exports = router;

