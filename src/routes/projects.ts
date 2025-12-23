import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleEn: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  client: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  software: z.array(z.string()).default([]),
  thumbnailUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// Get all projects (public - only active, admin - all)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.roles.includes('admin');
    
    const projects = await prisma.project.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.roles.includes('admin');

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!isAdmin && !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project (admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.parse(req.body);

    const project = await prisma.project.create({
      data,
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = projectSchema.partial().parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = projects.map((p) => p.category);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
