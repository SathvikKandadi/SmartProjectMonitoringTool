const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, isGuideOrAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all users (for guides/admins to assign)
router.get('/', userController.getAllUsers);

// Get users by role
router.get('/by-role/:role', userController.getUsersByRole);

// Get user by ID
router.get('/:userId', userController.getUserById);

// Update user (admin only)
router.put('/:userId', isGuideOrAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/:userId', isGuideOrAdmin, userController.deleteUser);

module.exports = router;

