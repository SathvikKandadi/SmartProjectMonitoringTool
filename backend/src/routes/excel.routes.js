const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const excelController = require('../controllers/excel.controller');
const { authMiddleware, isGuideOrAdmin } = require('../middleware/auth.middleware');

// Configure multer for Excel uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/excel/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'excel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  }
});

// All routes require authentication and guide/admin role
router.use(authMiddleware);
router.use(isGuideOrAdmin);

// Upload and import Excel data
router.post('/import', upload.single('file'), excelController.importExcel);

// Download sample template
router.get('/template', excelController.downloadTemplate);

module.exports = router;

