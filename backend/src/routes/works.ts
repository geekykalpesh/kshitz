import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { works, NewWork } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/works - Public endpoint to fetch all works
router.get('/', async (_req, res: Response) => {
  try {
    const allWorks = await db.select().from(works).orderBy(asc(works.displayOrder), asc(works.id));
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(allWorks);
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ error: 'Failed to fetch works' });
  }
});

// GET /api/works/:id - Public endpoint to fetch a single work
router.get('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const work = await db.select().from(works).where(eq(works.id, id));
    
    if (work.length === 0) {
      res.status(404).json({ error: 'Work not found' });
      return;
    }
    
    res.json(work[0]);
  } catch (error) {
    console.error('Error fetching work:', error);
    res.status(500).json({ error: 'Failed to fetch work' });
  }
});

// POST /api/works - Admin: Create a new work
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, videoLink, imageThumbnailLink, tags, category, featured } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const newWork: NewWork = {
      title,
      videoLink: videoLink || '',
      imageThumbnailLink: imageThumbnailLink || '',
      tags: tags || '',
      category: (category || 'HORIZONTAL').toUpperCase(),
      featured: Boolean(featured),
    };

    const created = await db.insert(works).values(newWork).returning();
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating work:', error);
    res.status(500).json({ error: 'Failed to create work' });
  }
});

// PUT /api/works/:id - Admin: Update an existing work
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { title, videoLink, imageThumbnailLink, tags, category, featured, displayOrder } = req.body;

    const existing = await db.select().from(works).where(eq(works.id, id));
    if (existing.length === 0) {
      res.status(404).json({ error: 'Work not found' });
      return;
    }

    const updated = await db
      .update(works)
      .set({
        title: title ?? existing[0].title,
        videoLink: videoLink ?? existing[0].videoLink,
        imageThumbnailLink: imageThumbnailLink ?? existing[0].imageThumbnailLink,
        tags: tags ?? existing[0].tags,
        category: category ? category.toUpperCase() : existing[0].category,
        featured: featured !== undefined ? Boolean(featured) : existing[0].featured,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : existing[0].displayOrder,
        updatedAt: new Date(),
      })
      .where(eq(works.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating work:', error);
    res.status(500).json({ error: 'Failed to update work' });
  }
});

// DELETE /api/works/:id - Admin: Delete a work
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    const existing = await db.select().from(works).where(eq(works.id, id));
    if (existing.length === 0) {
      res.status(404).json({ error: 'Work not found' });
      return;
    }

    await db.delete(works).where(eq(works.id, id));
    res.json({ message: 'Work deleted successfully' });
  } catch (error) {
    console.error('Error deleting work:', error);
    res.status(500).json({ error: 'Failed to delete work' });
  }
});

// POST /api/works/reorder - Admin: Update display order of items
router.post('/reorder', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { id: number, displayOrder: number }
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'items must be an array of { id, displayOrder }' });
      return;
    }

    // Update each item in parallel
    await Promise.all(
      items.map(async (item) => {
        if (typeof item.id === 'number' && typeof item.displayOrder === 'number') {
          await db
            .update(works)
            .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
            .where(eq(works.id, item.id));
        }
      })
    );

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error reordering works:', error);
    res.status(500).json({ error: 'Failed to reorder works' });
  }
});

// Multer upload config
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.resolve('uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video/images
});

import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_ppe5hEUHRGrLwX0KwcLCpFRACjc=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_c5EXr+c4HQgPepmirZW/Qq2p0O0=',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/geekykalpesh',
});

// GET /api/works/imagekit-auth - Client-side ImageKit auth parameters
router.get('/imagekit-auth', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    res.json({
      ...authParams,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_ppe5hEUHRGrLwX0KwcLCpFRACjc=',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/geekykalpesh',
    });
  } catch (error) {
    console.error('Error generating ImageKit auth parameters:', error);
    res.status(500).json({ error: 'Failed to generate ImageKit authentication parameters' });
  }
});

// POST /api/works/upload - Admin: Upload file (Images go directly to ImageKit, Videos to local/Mux or ImageKit)
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');

    // Upload images directly to ImageKit
    if (isImage) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const ikResponse = await imagekit.upload({
          file: fileBuffer,
          fileName: req.file.filename,
          folder: '/portfolio/thumbnails',
          useUniqueFileName: true,
        });

        try { fs.unlinkSync(req.file.path); } catch (e) {}

        res.json({
          url: ikResponse.url,
          filename: ikResponse.name,
          fileId: ikResponse.fileId,
          thumbnailUrl: ikResponse.thumbnailUrl || ikResponse.url,
          provider: 'imagekit',
        });
        return;
      } catch (ikError) {
        console.error('ImageKit upload error, falling back to local storage:', ikError);
      }
    }

    // Upload videos directly to Mux Video
    if (isVideo && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
      try {
        const MuxModule = await import('@mux/mux-node');
        const MuxClient = MuxModule.default || MuxModule;
        const mux = new (MuxClient as any)({
          tokenId: process.env.MUX_TOKEN_ID,
          tokenSecret: process.env.MUX_TOKEN_SECRET,
        });

        // Create direct upload in Mux
        const upload = await mux.video.uploads.create({
          new_asset_settings: {
            playback_policy: ['public'],
          },
          cors_origin: '*',
        });

        const fileStream = fs.createReadStream(req.file.path);
        const stats = fs.statSync(req.file.path);

        const uploadRes = await fetch(upload.url, {
          method: 'PUT',
          headers: { 'Content-Length': String(stats.size) },
          body: fileStream as any,
          duplex: 'half',
        } as any);

        if (uploadRes.ok) {
          // Poll until ready
          let assetId: string | undefined;
          for (let attempt = 0; attempt < 25; attempt++) {
            await new Promise(r => setTimeout(r, 2000));
            const uploadStatus = await mux.video.uploads.retrieve(upload.id);
            if (uploadStatus.asset_id) {
              assetId = uploadStatus.asset_id;
              break;
            }
          }

          if (assetId) {
            const asset = await mux.video.assets.retrieve(assetId);
            const playbackId = asset.playback_ids?.[0]?.id;
            if (playbackId) {
              try { fs.unlinkSync(req.file.path); } catch (e) {}
              const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;
              res.json({
                url: streamUrl,
                playbackId,
                filename: req.file.filename,
                provider: 'mux',
              });
              return;
            }
          }
        }
      } catch (muxError) {
        console.error('Mux upload error, falling back to local storage:', muxError);
      }
    }

    // Neon Object Storage fallback (S3 compatible)
    if (process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          endpoint: process.env.AWS_ENDPOINT_URL_S3,
          region: process.env.AWS_REGION || 'us-east-2',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true,
        });

        const fileBuffer = fs.readFileSync(req.file.path);
        const objectKey = `uploads/${req.file.filename}`;
        await s3.send(new PutObjectCommand({
          Bucket: 'assets',
          Key: objectKey,
          Body: fileBuffer,
          ContentType: req.file.mimetype,
        }));

        try { fs.unlinkSync(req.file.path); } catch (e) {}

        const storageUrl = `${process.env.AWS_ENDPOINT_URL_S3}/assets/${objectKey}`;
        res.json({
          url: storageUrl,
          filename: req.file.filename,
          provider: 'neon-storage',
        });
        return;
      } catch (storageError) {
        console.error('Neon Object Storage upload error, falling back to local:', storageError);
      }
    }

    // Default or fallback to local uploads
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename, provider: 'local' });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
