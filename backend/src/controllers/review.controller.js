const { PrismaClient } = require('@prisma/client');
const { analyzeAbstractWithAI } = require('../services/openai.service');
const { createNotification } = require('../utils/notification.util');
const { extractTextFromPDF } = require('../utils/pdf.util');
const fs = require('fs');

const prisma = new PrismaClient();

/**
 * Analyze abstract with AI
 */
const analyzeAbstract = async (req, res) => {
  try {
    const { abstractText, submissionId } = req.body;

    if (!abstractText) {
      return res.status(400).json({ error: 'Abstract text is required' });
    }

    // Get AI analysis
    const aiAnalysis = await analyzeAbstractWithAI(abstractText);

    // Save AI review if submissionId provided
    let aiReview = null;
    if (submissionId) {
      aiReview = await prisma.aIReview.create({
        data: {
          submissionId: parseInt(submissionId),
          reviewText: aiAnalysis.feedback,
          rating: aiAnalysis.rating,
          suggestions: aiAnalysis.suggestions
        }
      });

      // Get submission to notify group members
      const submission = await prisma.submission.findUnique({
        where: { submissionId: parseInt(submissionId) },
        include: {
          project: {
            include: {
              group: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      });

      // Notify group members
      if (submission) {
        const memberIds = submission.project.group.members.map(m => m.userId);
        for (const memberId of memberIds) {
          await createNotification(
            memberId,
            `AI review completed for your submission with rating: ${aiAnalysis.rating}/10`
          );
        }
      }
    }

    res.json({
      message: 'Abstract analyzed successfully',
      analysis: aiAnalysis,
      aiReview
    });
  } catch (error) {
    console.error('Analyze abstract error:', error);
    res.status(500).json({ error: 'Failed to analyze abstract' });
  }
};

/**
 * Analyze abstract PDF with AI
 */
const analyzeAbstractPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const { submissionId } = req.body;
    const filePath = req.file.path;

    // Extract text from PDF
    let abstractText;
    try {
      abstractText = await extractTextFromPDF(filePath);
      
      if (!abstractText || abstractText.trim().length === 0) {
        // Clean up file
        fs.unlinkSync(filePath);
        return res.status(400).json({ 
          error: 'Could not extract text from PDF. Please ensure the PDF contains readable text.' 
        });
      }
    } catch (extractError) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ 
        error: 'Failed to read PDF file. Please ensure it is a valid PDF document.' 
      });
    }

    // Get AI analysis
    const aiAnalysis = await analyzeAbstractWithAI(abstractText);

    // Save AI review if submissionId provided
    let aiReview = null;
    if (submissionId) {
      aiReview = await prisma.aIReview.create({
        data: {
          submissionId: parseInt(submissionId),
          reviewText: aiAnalysis.feedback,
          rating: aiAnalysis.rating,
          suggestions: aiAnalysis.suggestions
        }
      });

      // Get submission to notify group members
      const submission = await prisma.submission.findUnique({
        where: { submissionId: parseInt(submissionId) },
        include: {
          project: {
            include: {
              group: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      });

      // Notify group members
      if (submission) {
        const memberIds = submission.project.group.members.map(m => m.userId);
        for (const memberId of memberIds) {
          await createNotification(
            memberId,
            `AI review completed for your PDF submission with rating: ${aiAnalysis.rating}/10`
          );
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'PDF abstract analyzed successfully',
      analysis: aiAnalysis,
      aiReview,
      extractedText: abstractText.substring(0, 500) + '...' // Send preview
    });
  } catch (error) {
    console.error('Analyze PDF abstract error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to analyze PDF abstract' });
  }
};

/**
 * Get AI review by submission ID
 */
const getAIReviewBySubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const aiReviews = await prisma.aIReview.findMany({
      where: { submissionId: parseInt(submissionId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ aiReviews });
  } catch (error) {
    console.error('Get AI review error:', error);
    res.status(500).json({ error: 'Failed to fetch AI review' });
  }
};

/**
 * Create guide review
 */
const createGuideReview = async (req, res) => {
  try {
    const { submissionId, comments, rating } = req.body;
    const guideId = req.user.userId;

    if (!submissionId) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    const guideReview = await prisma.guideReview.create({
      data: {
        submissionId: parseInt(submissionId),
        guideId,
        comments,
        rating
      },
      include: {
        guide: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        },
        submission: {
          include: {
            project: {
              include: {
                group: {
                  include: {
                    members: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Notify group members
    const memberIds = guideReview.submission.project.group.members.map(m => m.userId);
    for (const memberId of memberIds) {
      await createNotification(
        memberId,
        `${guideReview.guide.name} has reviewed your submission with rating: ${rating}/10`
      );
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      guideReview
    });
  } catch (error) {
    console.error('Create guide review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

/**
 * Get guide reviews by submission ID
 */
const getGuideReviewsBySubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const guideReviews = await prisma.guideReview.findMany({
      where: { submissionId: parseInt(submissionId) },
      include: {
        guide: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ guideReviews });
  } catch (error) {
    console.error('Get guide reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch guide reviews' });
  }
};

/**
 * Update guide review
 */
const updateGuideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comments, rating } = req.body;
    const guideId = req.user.userId;

    // Verify ownership
    const existingReview = await prisma.guideReview.findUnique({
      where: { reviewId: parseInt(reviewId) }
    });

    if (!existingReview || existingReview.guideId !== guideId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const guideReview = await prisma.guideReview.update({
      where: { reviewId: parseInt(reviewId) },
      data: { comments, rating },
      include: {
        guide: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ message: 'Review updated successfully', guideReview });
  } catch (error) {
    console.error('Update guide review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

/**
 * Delete guide review
 */
const deleteGuideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const guideId = req.user.userId;

    // Verify ownership
    const existingReview = await prisma.guideReview.findUnique({
      where: { reviewId: parseInt(reviewId) }
    });

    if (!existingReview || existingReview.guideId !== guideId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.guideReview.delete({
      where: { reviewId: parseInt(reviewId) }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete guide review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = {
  analyzeAbstract,
  analyzeAbstractPDF,
  getAIReviewBySubmission,
  createGuideReview,
  getGuideReviewsBySubmission,
  updateGuideReview,
  deleteGuideReview
};

