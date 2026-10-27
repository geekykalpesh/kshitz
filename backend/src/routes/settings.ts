import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { siteSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/settings - Public: get all settings as key-value object
router.get('/', async (_req, res: Response) => {
  try {
    const rows = await db.select().from(siteSettings);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Admin: update one or multiple settings
router.put('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'Settings object required' });
      return;
    }

    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(siteSettings)
        .values({ key, value: String(value ?? ''), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: String(value ?? ''), updatedAt: new Date() },
        });
    }

    const rows = await db.select().from(siteSettings);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
