const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate comprehensive project report
 */
const generateProjectReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { projectId: parseInt(projectId) },
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
                    email: true,
                    role: true
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
        },
        submissions: {
          include: {
            aiReviews: true,
            guideReviews: {
              include: {
                guide: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: { submissionDate: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate statistics
    const stats = {
      totalSubmissions: project.submissions.length,
      approvedSubmissions: project.submissions.filter(s => s.status === 'Approved').length,
      underReviewSubmissions: project.submissions.filter(s => s.status === 'UnderReview').length,
      needsRevisionSubmissions: project.submissions.filter(s => s.status === 'NeedsRevision').length,
      averageAIRating: project.submissions.reduce((sum, s) => {
        const aiReview = s.aiReviews[0];
        return sum + (aiReview?.rating || 0);
      }, 0) / (project.submissions.length || 1),
      averageGuideRating: project.submissions.reduce((sum, s) => {
        const guideReviews = s.guideReviews;
        const avgForSubmission = guideReviews.reduce((gSum, g) => gSum + (g.rating || 0), 0) / (guideReviews.length || 1);
        return sum + avgForSubmission;
      }, 0) / (project.submissions.length || 1)
    };

    const report = {
      project: {
        title: project.title,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt
      },
      group: {
        name: project.group.groupName,
        leader: project.group.leader,
        members: project.group.members.map(m => m.user)
      },
      guide: project.guide,
      statistics: stats,
      submissions: project.submissions.map(s => ({
        submissionId: s.submissionId,
        submissionDate: s.submissionDate,
        status: s.status,
        abstractText: s.abstractText,
        aiReview: s.aiReviews[0] || null,
        guideReviews: s.guideReviews
      }))
    };

    res.json({ report });
  } catch (error) {
    console.error('Generate project report error:', error);
    res.status(500).json({ error: 'Failed to generate project report' });
  }
};

/**
 * Generate submission report
 */
const generateSubmissionReport = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { submissionId: parseInt(submissionId) },
      include: {
        project: {
          include: {
            group: {
              include: {
                leader: true,
                members: {
                  include: {
                    user: true
                  }
                }
              }
            },
            guide: true
          }
        },
        aiReviews: {
          orderBy: { createdAt: 'desc' }
        },
        guideReviews: {
          include: {
            guide: {
              select: {
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

    const report = {
      submission: {
        submissionId: submission.submissionId,
        submissionDate: submission.submissionDate,
        status: submission.status,
        abstractText: submission.abstractText,
        documentUrl: submission.documentUrl
      },
      project: {
        title: submission.project.title,
        description: submission.project.description
      },
      group: {
        name: submission.project.group.groupName,
        members: submission.project.group.members.map(m => m.user)
      },
      guide: submission.project.guide,
      aiReviews: submission.aiReviews,
      guideReviews: submission.guideReviews
    };

    res.json({ report });
  } catch (error) {
    console.error('Generate submission report error:', error);
    res.status(500).json({ error: 'Failed to generate submission report' });
  }
};

/**
 * Generate group report
 */
const generateGroupReport = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.projectGroup.findUnique({
      where: { groupId: parseInt(groupId) },
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
                email: true,
                role: true
              }
            }
          }
        },
        projects: {
          include: {
            guide: {
              select: {
                name: true,
                email: true
              }
            },
            submissions: {
              include: {
                aiReviews: true,
                guideReviews: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const report = {
      group: {
        groupName: group.groupName,
        leader: group.leader,
        members: group.members.map(m => m.user),
        createdAt: group.createdAt
      },
      projects: group.projects.map(p => ({
        projectId: p.projectId,
        title: p.title,
        status: p.status,
        guide: p.guide,
        totalSubmissions: p.submissions.length,
        latestSubmission: p.submissions[p.submissions.length - 1] || null
      }))
    };

    res.json({ report });
  } catch (error) {
    console.error('Generate group report error:', error);
    res.status(500).json({ error: 'Failed to generate group report' });
  }
};

module.exports = {
  generateProjectReport,
  generateSubmissionReport,
  generateGroupReport
};

