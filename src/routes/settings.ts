import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all settings (public)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    
    // Convert to key-value object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get single setting by key (public)
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update or create setting (admin only)
router.put('/:key', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Bulk update settings (admin only)
router.post('/bulk', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.record(z.any());
    const settings = schema.parse(req.body);

    const results = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid settings format' });
    }
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete setting (admin only)
router.delete('/:key', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;

    await prisma.siteSetting.delete({
      where: { key },
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;
