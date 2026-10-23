import { WorkItem as ApiWorkItem, getCachedWorks } from './api';

export interface DisplayWorkItem {
  id: number;
  image: string;
  fallbackSrc?: string[];
  title: string;
  tags: string[];
  category: string;
  featured: boolean;
  videoLink: string;
  displayOrder: number;
  rawItem: ApiWorkItem;
}

export function transformWork(item: ApiWorkItem): DisplayWorkItem {
  const videoLink = item.videoLink || '';
  const rawImageUrl = item.imageThumbnailLink || '';

  // YouTube ID extraction
  let youtubeId = '';
  if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be')) {
    if (videoLink.includes('shorts/')) {
      youtubeId = videoLink.split('shorts/')[1]?.split(/[?#&]/)[0] || '';
    } else {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = videoLink.match(regExp);
      youtubeId = match && match[2].length === 11 ? match[2] : '';
    }
  }

  // Build fallback list
  const fallbacks: string[] = [];
  if (youtubeId) {
    fallbacks.push(`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`);
    fallbacks.push(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
  } else if (videoLink.includes('instagram.com')) {
    fallbacks.push('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1080');
  } else if (videoLink.includes('drive.google.com')) {
    const fileId = videoLink.match(/\/file\/d\/([^/?]+)/)?.[1] || videoLink.match(/id=([^&?]+)/)?.[1];
    if (fileId) {
      fallbacks.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
    }
  }
  fallbacks.push('https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1080');

  // Determine primary image URL
  let imageUrl = rawImageUrl;
  if (!imageUrl) {
    imageUrl = fallbacks[0];
  } else if (imageUrl.includes('drive.google.com')) {
    const fileId = imageUrl.match(/\/file\/d\/([^/?]+)/)?.[1] || imageUrl.match(/id=([^&?]+)/)?.[1];
    if (fileId) {
      imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }

  return {
    id: item.id,
    title: item.title,
    videoLink,
    image: imageUrl,
    fallbackSrc: fallbacks,
    tags: (item.tags || '').split(',').map(t => {
      const cleaned = t.trim().toLowerCase();
      return cleaned === 'cinematography' ? 'dop' : cleaned;
    }).filter(t => t),
    category: (item.category || 'HORIZONTAL').toUpperCase(),
    featured: item.featured,
    displayOrder: item.displayOrder ?? item.id,
    rawItem: item,
  };
}

export function getInitialDisplayWorks(): DisplayWorkItem[] {
  try {
    const cached = getCachedWorks();
    return cached.filter(w => w && w.title).map(transformWork);
  } catch (e) {
    console.warn('Error loading initial display works:', e);
    return [];
  }
}
