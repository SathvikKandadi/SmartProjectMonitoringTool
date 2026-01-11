const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get users by role
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const users = await prisma.user.findMany({
      where: { role },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { userId: parseInt(userId) },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.update({
      where: { userId: parseInt(userId) },
      data: { name, email, role },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { userId: parseInt(userId) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  deleteUser
};

