const express = require('express');
const router = express.Router();
const { visitController } = require('../controllers');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRoles('guest'), visitController.createVisit);

router.get('/me', authenticateToken, authorizeRoles('guest'), visitController.getMyVisits);

router.get('/host', authenticateToken, authorizeRoles('host'), visitController.getHostVisits);

router.patch('/:id/approve', authenticateToken, authorizeRoles('host'), visitController.approveVisit);

router.patch('/:id/reject', authenticateToken, authorizeRoles('host'), visitController.rejectVisit);

module.exports = router;

