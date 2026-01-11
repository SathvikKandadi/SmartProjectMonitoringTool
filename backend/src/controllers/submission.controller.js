const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('../utils/notification.util');
const { extractTextFromPDF } = require('../utils/pdf.util');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Create a new submission
 */
const createSubmission = async (req, res) => {
  try {
    const { projectId, abstractText } = req.body;
    const files = req.files;
    
    let documentUrl = null;
    let finalAbstractText = abstractText;

    // Handle document file
    if (files && files.document && files.document[0]) {
      documentUrl = `/uploads/submissions/${files.document[0].filename}`;
    }

    // Handle abstract PDF - extract text
    if (files && files.abstractPDF && files.abstractPDF[0]) {
      const abstractPDFPath = files.abstractPDF[0].path;
      
      try {
        const extractedText = await extractTextFromPDF(abstractPDFPath);
        
        if (extractedText && extractedText.trim().length > 0) {
          // Use extracted text as abstract
          finalAbstractText = extractedText;
        }
        
        // Delete the PDF after extraction (we only need the text)
        fs.unlinkSync(abstractPDFPath);
      } catch (extractError) {
        console.error('PDF extraction error:', extractError);
        // Clean up file
        if (fs.existsSync(abstractPDFPath)) {
          fs.unlinkSync(abstractPDFPath);
        }
        // Continue with provided text if any
      }
    }

    // Validation
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { projectId: parseInt(projectId) },
      include: {
        guide: true,
        group: {
          include: {
            members: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const submission = await prisma.submission.create({
      data: {
        projectId: parseInt(projectId),
        documentUrl,
        abstractText: finalAbstractText,
        status: 'UnderReview'
      },
      include: {
        project: {
          include: {
            group: {
              include: {
                leader: true
              }
            },
            guide: true
          }
        }
      }
    });

    // Notify guide if assigned
    if (project.assignedGuide) {
      await createNotification(
        project.assignedGuide,
        `New submission received for project "${project.title}"`
      );
    }

    res.status(201).json({
      message: 'Submission created successfully',
      submission
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
};

/**
 * Get all submissions
 */
const getAllSubmissions = async (req, res) => {
  try {
    const { projectId, status } = req.query;
    
    const where = {};
    if (projectId) where.projectId = parseInt(projectId);
    if (status) where.status = status;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        project: {
          include: {
            group: {
              include: {
                leader: {
                  select: {
                    userId: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            guide: {
              select: {
                userId: true,
                name: true,
                email: true
              }
            }
          }
        },
        aiReviews: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        guideReviews: {
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
        }
      },
      orderBy: { submissionDate: 'desc' }
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

/**
 * Get submission by ID
 */
const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { submissionId: parseInt(submissionId) },
      include: {
        project: {
          include: {
            group: {
              include: {
                leader: {
                  select: {
                    userId: true,
                    name: true,
                    email: true
                  }
                },
                members: {
                  include: {
                    user: {
                      select: {
                        userId: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            guide: {
              select: {
                userId: true,
                name: true,
                email: true
              }
            }
          }
        },
        aiReviews: {
          orderBy: { createdAt: 'desc' }
        },
        guideReviews: {
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
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Get submission by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

/**
 * Update submission status
 */
const updateSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status } = req.body;

    const submission = await prisma.submission.update({
      where: { submissionId: parseInt(submissionId) },
      data: { status },
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

    // Notify all group members
    const memberIds = submission.project.group.members.map(m => m.userId);
    for (const memberId of memberIds) {
      await createNotification(
        memberId,
        `Submission status updated to: ${status}`
      );
    }

    res.json({ message: 'Submission status updated successfully', submission });
  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({ error: 'Failed to update submission status' });
  }
};

/**
 * Delete submission
 */
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Get submission to delete file
    const submission = await prisma.submission.findUnique({
      where: { submissionId: parseInt(submissionId) }
    });

    if (submission && submission.documentUrl) {
      const filePath = path.join(__dirname, '../../', submission.documentUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.submission.delete({
      where: { submissionId: parseInt(submissionId) }
    });

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
};

module.exports = {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  deleteSubmission
};

