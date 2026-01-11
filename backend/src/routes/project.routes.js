const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authMiddleware, isGuideOrAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Create project
router.post('/', projectController.createProject);

// Get all projects
router.get('/', projectController.getAllProjects);

// Get projects assigned to guide
router.get('/my-projects', projectController.getMyProjects);

// Get project by ID
router.get('/:projectId', projectController.getProjectById);

// Update project
router.put('/:projectId', projectController.updateProject);

// Update project status (guide/admin only)
router.patch('/:projectId/status', isGuideOrAdmin, projectController.updateProjectStatus);

// Assign guide to project (guide/admin only)
router.patch('/:projectId/assign-guide', isGuideOrAdmin, projectController.assignGuide);

// Delete project
router.delete('/:projectId', projectController.deleteProject);

// Project Comments
router.get('/:projectId/comments', projectController.getProjectComments);
router.post('/:projectId/comments', projectController.addProjectComment);

module.exports = router;

