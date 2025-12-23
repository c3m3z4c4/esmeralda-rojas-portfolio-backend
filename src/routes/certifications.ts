import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const certificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleEn: z.string().optional().nullable(),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().optional().nullable(),
  credentialId: z.string().optional().nullable(),
  credentialUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// Get all certifications (public - only active, admin - all)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.roles.includes('admin');
    
    const certifications = await prisma.certification.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    res.json(certifications);
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// Get single certification
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.roles.includes('admin');

    const certification = await prisma.certification.findUnique({
      where: { id },
    });

    if (!certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    if (!isAdmin && !certification.isActive) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    res.json(certification);
  } catch (error) {
    console.error('Get certification error:', error);
    res.status(500).json({ error: 'Failed to fetch certification' });
  }
});

// Create certification (admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const data = certificationSchema.parse(req.body);

    const certification = await prisma.certification.create({
      data,
    });

    res.status(201).json(certification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create certification error:', error);
    res.status(500).json({ error: 'Failed to create certification' });
  }
});

// Update certification (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = certificationSchema.partial().parse(req.body);

    const certification = await prisma.certification.update({
      where: { id },
      data,
    });

    res.json(certification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update certification error:', error);
    res.status(500).json({ error: 'Failed to update certification' });
  }
});

// Delete certification (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.certification.delete({
      where: { id },
    });

    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({ error: 'Failed to delete certification' });
  }
});

export default router;
