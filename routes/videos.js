import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all videos for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const videos = await prisma.video.findMany({
      where: { userId },
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

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get a single video by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Create a new video
router.post('/', async (req, res) => {
  try {
    const { title, description, prompt, userId } = req.body;
    
    const video = await prisma.video.create({
      data: {
        title,
        description,
        prompt,
        userId
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
      message: 'Video created successfully',
      video 
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Update video status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, videoUrl, thumbnailUrl } = req.body;
    
    const video = await prisma.video.update({
      where: { id },
      data: {
        status,
        ...(videoUrl && { videoUrl }),
        ...(thumbnailUrl && { thumbnailUrl })
      }
    });

    res.json({ 
      message: 'Video status updated successfully',
      video 
    });
  } catch (error) {
    console.error('Error updating video status:', error);
    res.status(500).json({ error: 'Failed to update video status' });
  }
});

// Delete a video
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.video.delete({
      where: { id }
    });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router;