const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create a new group
 */
const createGroup = async (req, res) => {
  try {
    const { groupName, leaderId, members } = req.body;

    // Validation
    if (!groupName || !leaderId) {
      return res.status(400).json({ error: 'Group name and leader are required' });
    }

    // Create group with leader as first member
    const group = await prisma.projectGroup.create({
      data: {
        groupName,
        leaderId,
        members: {
          create: [
            {
              userId: leaderId,
              roleInGroup: 'Leader'
            },
            ...(members || []).map(member => ({
              userId: member.userId,
              roleInGroup: member.roleInGroup || 'Member'
            }))
          ]
        }
      },
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
    });

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

/**
 * Get all groups
 */
const getAllGroups = async (req, res) => {
  try {
    const groups = await prisma.projectGroup.findMany({
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
        },
        projects: {
          select: {
            projectId: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ groups });
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

/**
 * Search groups by name
 */
const searchGroups = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const groups = await prisma.projectGroup.findMany({
      where: {
        groupName: {
          contains: q,
          mode: 'insensitive'
        }
      },
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
    });

    res.json({ groups });
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ error: 'Failed to search groups' });
  }
};

/**
 * Get group by ID
 */
const getGroupById = async (req, res) => {
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
                userId: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

/**
 * Add member to group
 */
const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, roleInGroup } = req.body;

    // Check if member already exists
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId: parseInt(userId)
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: parseInt(groupId),
        userId: parseInt(userId),
        roleInGroup: roleInGroup || 'Member'
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

/**
 * Remove member from group
 */
const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId: parseInt(userId)
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

/**
 * Update group
 */
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { groupName, leaderId } = req.body;

    const group = await prisma.projectGroup.update({
      where: { groupId: parseInt(groupId) },
      data: { groupName, leaderId },
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
    });

    res.json({ message: 'Group updated successfully', group });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

/**
 * Delete group
 */
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    await prisma.projectGroup.delete({
      where: { groupId: parseInt(groupId) }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  searchGroups,
  getGroupById,
  addMember,
  removeMember,
  updateGroup,
  deleteGroup
};

