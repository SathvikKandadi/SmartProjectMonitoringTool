const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reviewController = require('../controllers/review.controller');
const { authMiddleware, isGuideOrAdmin } = require('../middleware/auth.middleware');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/abstracts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'abstract-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed'));
  }
});

// All routes require authentication
router.use(authMiddleware);

// AI Review Routes
router.post('/ai/analyze', reviewController.analyzeAbstract);
router.post('/ai/analyze-pdf', upload.single('pdf'), reviewController.analyzeAbstractPDF);
router.get('/ai/submission/:submissionId', reviewController.getAIReviewBySubmission);

// Guide Review Routes
router.post('/guide', isGuideOrAdmin, reviewController.createGuideReview);
router.get('/guide/submission/:submissionId', reviewController.getGuideReviewsBySubmission);
router.put('/guide/:reviewId', isGuideOrAdmin, reviewController.updateGuideReview);
router.delete('/guide/:reviewId', isGuideOrAdmin, reviewController.deleteGuideReview);

module.exports = router;

