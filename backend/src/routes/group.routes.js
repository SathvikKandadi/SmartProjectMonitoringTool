const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Create group
router.post('/', groupController.createGroup);

// Get all groups
router.get('/', groupController.getAllGroups);

// Search groups by name
router.get('/search', groupController.searchGroups);

// Get group by ID with members
router.get('/:groupId', groupController.getGroupById);

// Add member to group
router.post('/:groupId/members', groupController.addMember);

// Remove member from group
router.delete('/:groupId/members/:userId', groupController.removeMember);

// Update group
router.put('/:groupId', groupController.updateGroup);

// Delete group
router.delete('/:groupId', groupController.deleteGroup);

module.exports = router;

