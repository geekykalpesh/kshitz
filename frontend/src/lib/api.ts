const API_BASE = '/api';

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

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Fetch all works (public)
export async function fetchWorks(): Promise<WorkItem[]> {
  const response = await fetch(`${API_BASE}/works`);
  if (!response.ok) throw new Error('Failed to fetch works');
  return response.json();
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
  
  return response.json();
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
  
  return response.json();
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
  
  return response.json();
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
}

export function adminLogout() {
  localStorage.removeItem('admin_token');
}
