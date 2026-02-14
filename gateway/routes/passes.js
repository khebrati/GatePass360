const express = require('express');
const router = express.Router();
const { passController } = require('../controllers');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/pending', authenticateToken, authorizeRoles('security'), passController.getPendingVisits);

router.patch('/:id/approve', authenticateToken, authorizeRoles('security'), passController.approveAndIssuePass);

router.patch('/:id/reject', authenticateToken, authorizeRoles('security'), passController.rejectVisit);

router.post('/check-in', authenticateToken, authorizeRoles('security'), passController.checkIn);

router.post('/check-out', authenticateToken, authorizeRoles('security'), passController.checkOut);

router.get('/:code', authenticateToken, authorizeRoles('security'), passController.getPassByCode);

module.exports = router;

