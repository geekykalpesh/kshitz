import 'dotenv/config';
import { Client } from 'pg';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_ppe5hEUHRGrLwX0KwcLCpFRACjc=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_c5EXr+c4HQgPepmirZW/Qq2p0O0=',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/geekykalpesh',
});

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kshitz_portfolio',
});

function extractDriveId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([^/?]+)/) || url.match(/id=([^&?]+)/);
  return match ? match[1] : null;
}

async function migrateImages() {
  await client.connect();
  console.log('🚀 Connected to PostgreSQL. Scanning for Google Drive images...');

  const { rows } = await client.query(
    "SELECT id, title, image_thumbnail_link FROM works WHERE image_thumbnail_link LIKE '%drive.google.com%'"
  );

  console.log(`Found ${rows.length} image thumbnails hosted on Google Drive.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fileId = extractDriveId(row.image_thumbnail_link);

    if (!fileId) {
      console.warn(`[${i + 1}/${rows.length}] Skipped work #${row.id} - Could not extract Drive file ID`);
      failCount++;
      continue;
    }

    const driveThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

    try {
      console.log(`[${i + 1}/${rows.length}] Migrating work #${row.id} ("${row.title.substring(0, 30)}...")...`);

      const resp = await fetch(driveThumbnailUrl);
      if (!resp.ok) {
        throw new Error(`Drive fetch returned status ${resp.status}`);
      }

      const buffer = Buffer.from(await resp.arrayBuffer());

      const ikRes = await imagekit.upload({
        file: buffer,
        fileName: `thumb_${row.id}_${fileId}.jpg`,
        folder: '/portfolio/thumbnails',
        useUniqueFileName: true,
      });

      // Update database row
      await client.query(
        'UPDATE works SET image_thumbnail_link = $1, updated_at = NOW() WHERE id = $2',
        [ikRes.url, row.id]
      );

      console.log(`  ✅ Uploaded to ImageKit: ${ikRes.url}`);
      successCount++;
    } catch (err: any) {
      console.error(`  ❌ Failed for work #${row.id}:`, err.message);
      failCount++;
    }

    // Small delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n====================================');
  console.log(`🎉 Image Migration Finished!`);
  console.log(`✅ Successfully migrated & saved to DB: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('====================================\n');

  await client.end();
}

migrateImages().catch(console.error);
