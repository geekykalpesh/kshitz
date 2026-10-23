import 'dotenv/config';
import { Client } from 'pg';
import Mux from '@mux/mux-node';
import fs from 'fs';
import path from 'path';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || 'c022d906-35b7-4958-b417-78b1cf9d13fa',
  tokenSecret: process.env.MUX_TOKEN_SECRET || 'np+8dHgW7W2NjSJ9gcYD0YLQcAmDhdsLHhaI2I/9uBtJk9kkrdXrLjomqmnT3rIEwlUD6tZYlrG',
});

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kshitz_portfolio',
});

function extractDriveId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([^/?]+)/) || url.match(/id=([^&?]+)/);
  return match ? match[1] : null;
}

async function uploadDirectToMux(filePath: string): Promise<string> {
  // Create direct upload URL in Mux
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
    },
    cors_origin: '*',
  });

  const uploadUrl = upload.url;
  const uploadId = upload.id;

  // Stream file via PUT to Mux uploadUrl
  const fileStream = fs.createReadStream(filePath);
  const stats = fs.statSync(filePath);

  const res = await fetch(uploadUrl!, {
    method: 'PUT',
    headers: {
      'Content-Length': String(stats.size),
    },
    body: fileStream as any,
    duplex: 'half',
  } as any);

  if (!res.ok) {
    throw new Error(`Direct upload to Mux failed with status ${res.status}`);
  }

  // Poll until asset is ready
  let assetId: string | undefined;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 2000));
    const uploadStatus = await mux.video.uploads.retrieve(uploadId);
    if (uploadStatus.asset_id) {
      assetId = uploadStatus.asset_id;
      break;
    }
    if (uploadStatus.status === 'errored') {
      throw new Error(`Mux upload processing error: ${uploadStatus.error?.message}`);
    }
  }

  if (!assetId) {
    throw new Error('Mux did not produce asset_id in time');
  }

  // Retrieve playback ID
  const asset = await mux.video.assets.retrieve(assetId);
  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) {
    throw new Error('No public playback ID found for Mux asset');
  }

  return `https://stream.mux.com/${playbackId}.m3u8`;
}

async function migrateDriveVideos() {
  await client.connect();
  console.log('🚀 Connected to PostgreSQL. Querying Google Drive videos...');

  const { rows } = await client.query(
    "SELECT id, title, video_link FROM works WHERE video_link LIKE '%drive.google.com%'"
  );

  console.log(`Found ${rows.length} videos hosted on Google Drive.`);
  const tempDir = path.resolve('temp_videos');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fileId = extractDriveId(row.video_link);
    console.log(`\n[${i + 1}/${rows.length}] Processing work #${row.id}: "${row.title}"`);

    if (!fileId) {
      console.warn(`  ⚠️ Could not extract Drive file ID from ${row.video_link}`);
      failed++;
      continue;
    }

    const tempFilePath = path.join(tempDir, `video_${row.id}_${fileId}.mp4`);
    const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

    try {
      console.log(`  ⬇️ Downloading from Drive...`);
      const resp = await fetch(driveDownloadUrl);
      if (!resp.ok) {
        throw new Error(`Drive download responded with status ${resp.status}`);
      }

      const fileBuffer = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(tempFilePath, fileBuffer);
      console.log(`  💾 Downloaded (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

      console.log(`  ⬆️ Uploading to Mux...`);
      const muxPlaybackUrl = await uploadDirectToMux(tempFilePath);
      console.log(`  ✅ Mux Stream ready: ${muxPlaybackUrl}`);

      // Update database
      await client.query(
        'UPDATE works SET video_link = $1, updated_at = NOW() WHERE id = $2',
        [muxPlaybackUrl, row.id]
      );
      console.log(`  🗄️ Database updated for work #${row.id}`);

      success++;
    } catch (err: any) {
      console.error(`  ❌ Failed for work #${row.id}:`, err.message);
      failed++;
    } finally {
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
      }
    }
  }

  try { fs.rmdirSync(tempDir); } catch (e) {}

  console.log('\n====================================');
  console.log(`🎉 Mux Video Migration Finished!`);
  console.log(`✅ Successfully uploaded to Mux & saved to DB: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('====================================\n');

  await client.end();
}

migrateDriveVideos().catch(console.error);
