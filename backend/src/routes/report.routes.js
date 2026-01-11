const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Generate project report
router.get('/project/:projectId', reportController.generateProjectReport);

// Generate submission report
router.get('/submission/:submissionId', reportController.generateSubmissionReport);

// Generate group report
router.get('/group/:groupId', reportController.generateGroupReport);

module.exports = router;

