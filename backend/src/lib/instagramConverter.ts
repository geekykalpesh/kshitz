import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ImageKit from 'imagekit';
import dotenv from 'dotenv';
dotenv.config();

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_ppe5hEUHRGrLwX0KwcLCpFRACjc=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_c5EXr+c4HQgPepmirZW/Qq2p0O0=',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/geekykalpesh',
});

/**
 * Checks if a URL is an Instagram post/reel and downloads the clean MP4,
 * uploading it directly to ImageKit CDN so it plays cleanly with standard HTML5 video.
 */
export async function convertInstagramUrlToCleanVideo(url: string): Promise<string> {
  if (!url || (!url.includes('instagram.com/p/') && !url.includes('instagram.com/reel/'))) {
    return url;
  }

  const tmpDir = path.resolve('temp_ig');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const tempFile = path.join(tmpDir, `ig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`);

  try {
    console.log(`[Instagram Auto-Convert] Downloading clean video from: ${url}`);
    execSync(`python -m yt_dlp -f "best" "${url}" -o "${tempFile}" --no-warnings`, {
      timeout: 60000,
      stdio: 'pipe',
    });

    if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 1000) {
      console.warn('[Instagram Auto-Convert] Downloaded file missing or empty, keeping original URL');
      return url;
    }

    const fileBuffer = fs.readFileSync(tempFile);
    console.log(`[Instagram Auto-Convert] Uploading clean MP4 to ImageKit (${(fileBuffer.length / (1024*1024)).toFixed(1)} MB)...`);

    const uploadRes = await ik.upload({
      file: fileBuffer,
      fileName: `ig_clean_${Date.now()}.mp4`,
      folder: '/portfolio/videos/',
      useUniqueFileName: true,
    });

    console.log(`[Instagram Auto-Convert] Success! Clean CDN URL: ${uploadRes.url}`);
    return uploadRes.url;
  } catch (err: any) {
    console.warn('[Instagram Auto-Convert] Failed, falling back to original URL:', err.message);
    return url;
  } finally {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
  }
}
