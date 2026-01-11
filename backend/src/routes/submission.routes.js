const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const submissionController = require('../controllers/submission.controller');
const { authMiddleware, isGuideOrAdmin } = require('../middleware/auth.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/submissions/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and DOC files are allowed'));
  }
});

// All routes require authentication
router.use(authMiddleware);

// Create submission (can upload both document and abstractPDF)
router.post('/', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'abstractPDF', maxCount: 1 }
]), submissionController.createSubmission);

// Get all submissions
router.get('/', submissionController.getAllSubmissions);

// Get submission by ID
router.get('/:submissionId', submissionController.getSubmissionById);

// Update submission status (guide only)
router.patch('/:submissionId/status', isGuideOrAdmin, submissionController.updateSubmissionStatus);

// Delete submission
router.delete('/:submissionId', submissionController.deleteSubmission);

module.exports = router;

