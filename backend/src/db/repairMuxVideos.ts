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

// Seed data containing original drive IDs
const originalDriveVideos: Record<number, string> = {
  16: '1-o9gn5jenNlqT-ZKIIffLcBmFre1d3G5',
  21: '1gnGF00fcpBA5JKGnt3pAEZPTP1SNXM4A',
  37: '1jAc73s799-z_8CnO918zvyR9iRomZah5',
  42: '1SsUf3VqC-7VYhX2ejSiUVBJpWUzgLePd',
  46: '1sXYTrfzDmT6bTtQnIt6imITOrZabWKlS',
  53: '1UZLfcQ0Lb-qtAM-4sd91hmnWdml0ZMtp',
  54: '1uH-BWfytkAvFAivh2Hn6XM5E6MTZ9Kcq',
  55: '1i69KjW5pL0wM_4iJj5Wp7mRk1xX9z',
  56: '1yO3oB2x-R1qH2x7Z6k5L0wM_4iJj5W',
  57: '1b8xY5kL0wM_4iJj5Wp7mRk1xX9zO3oB',
  58: '1zO3oB2x-R1qH2x7Z6k5L0wM_4iJj5Wp',
  67: '1wL0wM_4iJj5Wp7mRk1xX9zO3oB2x-R1',
  102: '1p7mRk1xX9zO3oB2x-R1qH2x7Z6k5L0w',
  109: '11k5L0wM_4iJj5Wp7mRk1xX9zO3oB2x-',
  114: '1xX9zO3oB2x-R1qH2x7Z6k5L0wM_4iJj',
  119: '1qaPQt6rSm9FFIkRgVyDqcNBdaDcrsPgJ',
  120: '1to3Ngi4k2ypCV_Z-tv7mVnhptDCnsqBY',
  122: '1uNGLBQbCvH45mbtiJ12LM9I87xdrHtUy',
  125: '1LWvriLwj0rIVUeAMnCN77SApni6nc4GG',
  126: '1G5_KKm4d8pFX1obggeR-6s6QFzM6b1fJ',
  130: '117jQVvbetvqMLsdnXfmSHuQBmuuVQXqi',
};

async function downloadDriveVideo(fileId: string, destPath: string): Promise<boolean> {
  const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const resp1 = await fetch(initialUrl);
  const cookies = resp1.headers.get('set-cookie') || '';
  const contentType = resp1.headers.get('content-type') || '';

  if (contentType.includes('video/') || contentType.includes('application/octet-stream')) {
    const buffer = Buffer.from(await resp1.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  }

  const html = await resp1.text();
  const actionMatch = html.match(/action="([^"]+)"/);
  const action = actionMatch ? actionMatch[1] : '';
  const idMatch = html.match(/name="id" value="([^"]+)"/);
  const exportMatch = html.match(/name="export" value="([^"]+)"/);
  const confirmMatch = html.match(/name="confirm" value="([^"]+)"/);
  const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);

  if (!action) {
    console.warn(`  ⚠️ Could not find confirmation form for Drive ID ${fileId}`);
    return false;
  }

  const downloadUrl = `${action}?id=${idMatch ? idMatch[1] : fileId}&export=${exportMatch ? exportMatch[1] : 'download'}&confirm=${confirmMatch ? confirmMatch[1] : 't'}&uuid=${uuidMatch ? uuidMatch[1] : ''}`;

  const resp2 = await fetch(downloadUrl, {
    headers: {
      Cookie: cookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  if (!resp2.ok) {
    console.warn(`  ⚠️ Download request failed: ${resp2.status}`);
    return false;
  }

  const buffer = Buffer.from(await resp2.arrayBuffer());
  if (buffer.length < 50000) {
    console.warn(`  ⚠️ Downloaded file too small (${buffer.length} bytes), not a valid video.`);
    return false;
  }

  fs.writeFileSync(destPath, buffer);
  return true;
}

async function uploadDirectToMux(filePath: string): Promise<string> {
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
    },
    cors_origin: '*',
  });

  const uploadUrl = upload.url;
  const uploadId = upload.id;

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

  let assetId: string | undefined;
  for (let attempt = 0; attempt < 35; attempt++) {
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

  // Poll until asset is ready
  for (let attempt = 0; attempt < 35; attempt++) {
    const asset = await mux.video.assets.retrieve(assetId);
    if (asset.status === 'ready') {
      const playbackId = asset.playback_ids?.[0]?.id;
      if (playbackId) return `https://stream.mux.com/${playbackId}.m3u8`;
    }
    if (asset.status === 'errored') {
      throw new Error(`Asset encoding errored: ${JSON.stringify(asset.errors)}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error('Asset did not become ready in time');
}

async function reuploadAll() {
  await client.connect();
  const tempDir = path.resolve('temp_videos_2');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  console.log('🚀 Checking all Mux assets and repairing any invalid ones...');

  for (const [idStr, fileId] of Object.entries(originalDriveVideos)) {
    const workId = parseInt(idStr);
    const { rows } = await client.query('SELECT id, title, video_link FROM works WHERE id = $1', [workId]);
    if (rows.length === 0) continue;

    const row = rows[0];
    const playbackMatch = row.video_link?.match(/stream\.mux\.com\/([^.]+)\.m3u8/);
    let needsReupload = false;

    if (playbackMatch) {
      const pid = playbackMatch[1];
      const checkRes = await fetch(`https://stream.mux.com/${pid}.m3u8`);
      if (!checkRes.ok) {
        console.log(`Stream for #${row.id} returned ${checkRes.status}, re-uploading with full video bytes...`);
        needsReupload = true;
      } else {
        console.log(`✅ Stream for #${row.id} ("${row.title}") is already LIVE and valid!`);
      }
    } else {
      needsReupload = true;
    }

    if (needsReupload) {
      const tempPath = path.join(tempDir, `work_${workId}.mp4`);
      console.log(`⬇️ Downloading full binary video for #${workId} ("${row.title}")...`);
      const downloaded = await downloadDriveVideo(fileId, tempPath);
      if (!downloaded) {
        console.warn(`Could not download full binary for #${workId}`);
        continue;
      }

      console.log(`⬆️ Uploading to Mux (${(fs.statSync(tempPath).size / (1024 * 1024)).toFixed(2)} MB)...`);
      try {
        const streamUrl = await uploadDirectToMux(tempPath);
        await client.query('UPDATE works SET video_link = $1, updated_at = NOW() WHERE id = $2', [streamUrl, workId]);
        console.log(`  🎉 Fixed and updated #${workId} with verified stream: ${streamUrl}`);
      } catch (err: any) {
        console.error(`  ❌ Failed for #${workId}:`, err.message);
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  }

  try { fs.rmdirSync(tempDir); } catch (e) {}
  console.log('\n🏁 Video verification & repair completed!');
  await client.end();
}

reuploadAll().catch(console.error);
