import { initialWorks } from '../data/initialWorks';

const rawUrl = import.meta.env.VITE_API_URL;
const API_BASE = rawUrl ? `${rawUrl.replace(/\/$/, '')}/api` : '/api';

export interface WorkItem {
  id: number;
  title: string;
  videoLink: string;
  imageThumbnailLink: string;
  tags: string;
  category: string;
  featured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewWorkItem {
  title: string;
  videoLink?: string;
  imageThumbnailLink?: string;
  tags?: string;
  category?: string;
  featured?: boolean;
  displayOrder?: number;
}

const CACHE_KEY = 'kshitiz_works_cache_v2';

export function getCachedWorks(): WorkItem[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached works from localStorage', e);
  }
  return initialWorks;
}

export function saveCachedWorks(works: WorkItem[]): void {
  try {
    if (Array.isArray(works) && works.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(works));
    }
  } catch (e) {
    console.warn('Could not save cached works to localStorage', e);
  }
}

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Fetch all works (public) with stale-while-revalidate and timeout fallback
export async function fetchWorks(forceFresh = true): Promise<WorkItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${API_BASE}/works?t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data: WorkItem[] = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      saveCachedWorks(data);
      return data;
    }
    return getCachedWorks();
  } catch (error) {
    console.warn('Network fetch error or timeout, returning cached works:', error);
    return getCachedWorks();
  }
}

// Admin: Login
export async function adminLogin(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('admin_token', data.token);
  return data.token;
}

// Admin: Verify token
export async function verifyToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  
  const response = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  
  return response.ok;
}

// Admin: Create work
export async function createWork(work: NewWorkItem): Promise<WorkItem> {
  const response = await fetch(`${API_BASE}/works`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(work),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create work');
  }
  
  const created: WorkItem = await response.json();
  try {
    const current = getCachedWorks();
    saveCachedWorks([created, ...current]);
  } catch {}
  return created;
}

// Admin: Update work
export async function updateWork(id: number, work: Partial<NewWorkItem>): Promise<WorkItem> {
  const response = await fetch(`${API_BASE}/works/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(work),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update work');
  }
  
  const updated: WorkItem = await response.json();
  try {
    const current = getCachedWorks();
    saveCachedWorks(current.map(w => w.id === id ? updated : w));
  } catch {}
  return updated;
}

// Admin: Delete work
export async function deleteWork(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/works/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete work');
  }

  try {
    const current = getCachedWorks();
    saveCachedWorks(current.filter(w => w.id !== id));
  } catch {}
}

// Admin: Update thumbnail only
export async function updateThumbnail(id: number, imageThumbnailLink: string): Promise<WorkItem> {
  const response = await fetch(`${API_BASE}/works/${id}/thumbnail`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ imageThumbnailLink }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update thumbnail');
  }
  
  const updated: WorkItem = await response.json();
  try {
    const current = getCachedWorks();
    saveCachedWorks(current.map(w => w.id === id ? updated : w));
  } catch {}
  return updated;
}

// Admin: Upload media file (video or image)
export async function uploadMediaFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/works/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to upload file');
  }

  return response.json();
}

// Admin: Reorder works
export async function reorderWorks(items: { id: number; displayOrder: number }[]): Promise<void> {
  const response = await fetch(`${API_BASE}/works/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to reorder works');
  }

  try {
    const current = getCachedWorks();
    const orderMap = new Map(items.map(it => [it.id, it.displayOrder]));
    const reordered = current.map(w => orderMap.has(w.id) ? { ...w, displayOrder: orderMap.get(w.id)! } : w);
    reordered.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    saveCachedWorks(reordered);
  } catch {}
}

export function adminLogout() {
  localStorage.removeItem('admin_token');
}

export interface SiteSettings {
  hero_bg_url?: string;
  hero_bg_type?: 'video' | 'image' | 'none';
  hero_badge?: string;
  hero_title_first?: string;
  hero_title_last?: string;
  hero_subtitle?: string;
  [key: string]: string | undefined;
}

export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load settings');
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch settings, returning defaults:', err);
    return {
      hero_bg_url: 'https://ik.imagekit.io/geekykalpesh/portfolio/hero/hero-bg_oPMA23VnnZ.mp4',
      hero_bg_type: 'video',
      hero_badge: 'DOP • Editor • Colorist',
      hero_title_first: 'KSHITIJ',
      hero_title_last: 'RATHORE',
      hero_subtitle: 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.',
    };
  }
}

export async function updateSettings(settings: Record<string, string>): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update settings');
  }

  return response.json();
}
