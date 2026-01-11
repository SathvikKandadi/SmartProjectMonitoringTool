const pdf = require('pdf-parse');
const fs = require('fs');

/**
 * Extract text from PDF file
 * @param {String} filePath - Path to PDF file
 * @returns {Promise<String>} Extracted text
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // Return extracted text
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Validate if file is a PDF
 * @param {String} filename - Name of the file
 * @returns {Boolean} True if PDF
 */
const isPDF = (filename) => {
  return filename && filename.toLowerCase().endsWith('.pdf');
};

module.exports = {
  extractTextFromPDF,
  isPDF
};

