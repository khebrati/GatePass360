const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/reports/log', authenticateToken, authorizeRoles('admin'), adminController.getFullReport);

router.get('/reports/present', authenticateToken, authorizeRoles('admin'), adminController.getPresentPeople);

router.get('/users', authenticateToken, authorizeRoles('admin'), adminController.getAllUsers);

router.patch('/users/:id/role', authenticateToken, authorizeRoles('admin'), adminController.changeUserRole);

router.get('/stats', authenticateToken, authorizeRoles('admin'), adminController.getStats);

module.exports = router;

