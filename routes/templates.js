const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all templates (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { category, isPublic, search } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get a single template by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Increment usage count
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create a new template
router.post('/', async (req, res) => {
  try {
    const { name, description, prompt, category, tags, isPublic } = req.body;
    
    const template = await prisma.template.create({
      data: {
        name,
        description,
        prompt,
        category,
        tags: tags || [],
        isPublic: isPublic !== false // default to true
      }
    });

    res.status(201).json({ 
      message: 'Template created successfully',
      template 
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update a template
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, prompt, category, tags, isPublic } = req.body;
    
    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(prompt && { prompt }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(isPublic !== undefined && { isPublic })
      }
    });

    res.json({ 
      message: 'Template updated successfully',
      template 
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete a template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.template.delete({
      where: { id }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Get template categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.template.findMany({
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category).filter(Boolean);
    res.json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;