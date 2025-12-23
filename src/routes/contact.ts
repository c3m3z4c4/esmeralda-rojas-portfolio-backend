import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(255),
  projectType: z.string().optional().nullable(),
  message: z.string().min(1, 'Message is required').max(2000),
});

// Submit contact message (public)
router.post('/', async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    const message = await prisma.contactMessage.create({
      data,
    });

    res.status(201).json({ 
      message: 'Message sent successfully',
      id: message.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Submit contact error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all messages (admin only)
router.get('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { archived } = req.query;
    
    const messages = await prisma.contactMessage.findMany({
      where: { 
        isArchived: archived === 'true' 
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get single message (admin only)
router.get('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Mark message as read (admin only)
router.patch('/:id/read', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(message);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Archive message (admin only)
router.patch('/:id/archive', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isArchived: true },
    });

    res.json(message);
  } catch (error) {
    console.error('Archive message error:', error);
    res.status(500).json({ error: 'Failed to archive message' });
  }
});

// Unarchive message (admin only)
router.patch('/:id/unarchive', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isArchived: false },
    });

    res.json(message);
  } catch (error) {
    console.error('Unarchive message error:', error);
    res.status(500).json({ error: 'Failed to unarchive message' });
  }
});

// Get unread count (admin only)
router.get('/meta/unread-count', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.contactMessage.count({
      where: { 
        isRead: false,
        isArchived: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
