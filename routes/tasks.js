const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks for a user
router.get('/', async (req, res) => {
  try {
    const { userId, status, type } = req.query;
    
    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;
    
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        video: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        video: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { type, userId, videoId, parameters } = req.body;
    
    const task = await prisma.task.create({
      data: {
        type,
        userId,
        videoId,
        parameters
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        video: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Task created successfully',
      task 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status and progress
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, result, errorMessage } = req.body;
    
    const updateData = {
      ...(status && { status }),
      ...(progress !== undefined && { progress }),
      ...(result && { result }),
      ...(errorMessage && { errorMessage }),
      ...(status === 'COMPLETED' && { completedAt: new Date() })
    };
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        video: true
      }
    });

    res.json({ 
      message: 'Task updated successfully',
      task 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Cancel a task
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    res.json({ 
      message: 'Task cancelled successfully',
      task 
    });
  } catch (error) {
    console.error('Error cancelling task:', error);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

module.exports = router;