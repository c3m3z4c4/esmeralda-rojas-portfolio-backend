import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const experienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  companyEn: z.string().optional().nullable(),
  role: z.string().min(1, 'Role is required'),
  roleEn: z.string().optional().nullable(),
  period: z.string().min(1, 'Period is required'),
  responsibilities: z.array(z.string()).default([]),
  responsibilitiesEn: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isCurrent: z.boolean().default(false),
});

// Get all experiences (public - only active, admin - all)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.roles.includes('admin');
    
    const experiences = await prisma.experience.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    res.json(experiences);
  } catch (error) {
    console.error('Get experiences error:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

// Get single experience
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.roles.includes('admin');

    const experience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    if (!isAdmin && !experience.isActive) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    res.json(experience);
  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({ error: 'Failed to fetch experience' });
  }
});

// Create experience (admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const data = experienceSchema.parse(req.body);

    const experience = await prisma.experience.create({
      data,
    });

    res.status(201).json(experience);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create experience error:', error);
    res.status(500).json({ error: 'Failed to create experience' });
  }
});

// Update experience (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = experienceSchema.partial().parse(req.body);

    const experience = await prisma.experience.update({
      where: { id },
      data,
    });

    res.json(experience);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Failed to update experience' });
  }
});

// Delete experience (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.experience.delete({
      where: { id },
    });

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Failed to delete experience' });
  }
});

export default router;
