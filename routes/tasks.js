const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all video tasks for a user
router.get('/', async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    const where = userId ? { userId } : {};
    if (status) where.status = status;
    
    const tasks = await prisma.videoTask.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching video tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.videoTask.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
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

// Create a new video task
router.post('/', async (req, res) => {
  try {
    const { userPrompt, style, userId, translatedPrompt } = req.body;
    
    const task = await prisma.videoTask.create({
      data: {
        userPrompt,
        style: style || 'anime',
        userId,
        translatedPrompt
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Video task created successfully',
      task 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status and result
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, videoUrl, promptId } = req.body;
    
    const updateData = {
      ...(status && { status }),
      ...(videoUrl && { videoUrl }),
      ...(promptId && { promptId })
    };
    
    const task = await prisma.videoTask.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
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

module.exports = router;