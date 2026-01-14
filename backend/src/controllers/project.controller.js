const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('../utils/notification.util');

const prisma = new PrismaClient();

/**
 * Create a new project
 */
const createProject = async (req, res) => {
  try {
    const { groupId, title, description, assignedGuide } = req.body;

    // Validation
    if (!groupId || !title) {
      return res.status(400).json({ error: 'Group ID and title are required' });
    }

    const project = await prisma.project.create({
      data: {
        groupId,
        title,
        description,
        assignedGuide,
        status: 'Pending'
      },
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
    });

    // Notify guide if assigned
    if (assignedGuide) {
      await createNotification(
        assignedGuide,
        `New project "${title}" has been assigned to you`
      );
    }

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

/**
 * Get all projects
 */
const getAllProjects = async (req, res) => {
  try {
    const { status, groupId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (groupId) where.groupId = parseInt(groupId);

    const projects = await prisma.project.findMany({
      where,
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
        },
        submissions: {
          orderBy: { submissionDate: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * Get projects assigned to current user (for guides)
 */
const getMyProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let projects;

    if (userRole === 'Student') {
      // Get projects for groups the student is in
      projects = await prisma.project.findMany({
        where: {
          group: {
            members: {
              some: {
                userId
              }
            }
          }
        },
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
          },
          submissions: {
            orderBy: { submissionDate: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'Coordinator' || userRole === 'HOD' || userRole === 'Admin') {
      // Coordinators, HODs, and Admins can see all projects
      projects = await prisma.project.findMany({
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
          },
          submissions: {
            orderBy: { submissionDate: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Get projects assigned to guide
      projects = await prisma.project.findMany({
        where: {
          assignedGuide: userId
        },
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
          submissions: {
            orderBy: { submissionDate: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ projects });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * Get project by ID
 */
const getProjectById = async (req, res) => {
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
                    userId: true,
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

    res.json({ project });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

/**
 * Update project
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;

    const project = await prisma.project.update({
      where: { projectId: parseInt(projectId) },
      data: { title, description },
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
    });

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

/**
 * Update project status
 */
const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    const project = await prisma.project.update({
      where: { projectId: parseInt(projectId) },
      data: { status },
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
        }
      }
    });

    // Notify all group members
    const memberIds = project.group.members.map(m => m.userId);
    for (const memberId of memberIds) {
      await createNotification(
        memberId,
        `Project "${project.title}" status updated to: ${status}`
      );
    }

    res.json({ message: 'Project status updated successfully', project });
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};

/**
 * Assign guide to project
 */
const assignGuide = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { guideId } = req.body;

    const project = await prisma.project.update({
      where: { projectId: parseInt(projectId) },
      data: { assignedGuide: guideId },
      include: {
        group: {
          include: {
            leader: true
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
    });

    // Notify guide
    await createNotification(
      guideId,
      `You have been assigned as guide for project "${project.title}"`
    );

    // Notify group leader
    await createNotification(
      project.group.leaderId,
      `Guide ${project.guide.name} has been assigned to your project "${project.title}"`
    );

    res.json({ message: 'Guide assigned successfully', project });
  } catch (error) {
    console.error('Assign guide error:', error);
    res.status(500).json({ error: 'Failed to assign guide' });
  }
};

/**
 * Delete project
 */
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    await prisma.project.delete({
      where: { projectId: parseInt(projectId) }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

/**
 * Get project comments
 */
const getProjectComments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const comments = await prisma.projectComment.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get project comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

/**
 * Add project comment
 */
const addProjectComment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const newComment = await prisma.projectComment.create({
      data: {
        projectId: parseInt(projectId),
        userId,
        comment
      },
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
    });

    // Get project details for notifications
    const project = await prisma.project.findUnique({
      where: { projectId: parseInt(projectId) },
      include: {
        group: {
          include: {
            members: {
              select: {
                userId: true
              }
            }
          }
        },
        guide: {
          select: {
            userId: true,
            name: true
          }
        }
      }
    });

    // Notify all project members (except the commenter)
    if (project) {
      const memberIds = project.group.members.map(m => m.userId);
      
      // Add guide to notification list
      if (project.assignedGuide && project.assignedGuide !== userId) {
        memberIds.push(project.assignedGuide);
      }

      // Remove the commenter from notification list
      const notifyIds = memberIds.filter(id => id !== userId);

      // Create notifications
      for (const memberId of notifyIds) {
        await createNotification(
          memberId,
          `New comment on project "${project.title}" by ${newComment.user.name}`
        );
      }
    }

    res.json({ message: 'Comment posted successfully', comment: newComment });
  } catch (error) {
    console.error('Add project comment error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  assignGuide,
  deleteProject,
  getProjectComments,
  addProjectComment
};

