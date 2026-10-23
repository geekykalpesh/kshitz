import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, X, Film, Edit3, Trash2, Plus, Upload,
  GripVertical, Star, StarOff, Save, Check, ArrowUp, ArrowDown, LogOut,
  ExternalLink, Eye, RefreshCw, AlertCircle
} from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Marquee } from './components/Marquee';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { motion, AnimatePresence } from 'motion/react';
import { MuxVideoPlayer } from '@/components/MuxVideoPlayer';
import {
  WorkItem,
  NewWorkItem,
  fetchWorks,
  createWork,
  updateWork,
  deleteWork,
  uploadMediaFile,
  reorderWorks,
  adminLogin,
  verifyToken,
  adminLogout
} from '@/lib/api';
import { transformWork, DisplayWorkItem } from '@/lib/transformWork';

function Footer() {
  return (
    <footer id="contact" className="py-16 px-6 lg:px-8 bg-black text-white w-full border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="mb-6">
          <a
            href="mailto:kshitizfx@gmail.com"
            className="text-white hover:text-neutral-300 transition-colors duration-300 tracking-wider lowercase text-2xl sm:text-4xl md:text-5xl font-light block text-center"
          >
            kshitizfx@gmail.com
          </a>
        </div>

        <div className="flex items-center gap-12 text-xs uppercase tracking-[0.25em] text-white/60 mb-12">
          <a
            href="https://www.instagram.com/kshitizfx/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-300"
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/in/kshitizfx/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-300"
          >
            LinkedIn
          </a>
        </div>

        <div className="w-full pt-8 border-t border-white/5 text-center text-[10px] uppercase tracking-widest text-white/20">
          <p>&copy; 2026 Kshitij Rathore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm font-medium transition-all ${
      type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
      type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-300' :
      'bg-neutral-900/90 border-white/20 text-white'
    }`}>
      {type === 'success' && <Check size={16} />}
      {type === 'error' && <AlertCircle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75"><X size={14} /></button>
    </div>
  );
}

// ─── Edit / Create Modal ──────────────────────────────────────────────────────
function WorkModal({
  work,
  isOpen,
  onClose,
  onSave
}: {
  work: DisplayWorkItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<NewWorkItem>) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [imageThumbnailLink, setImageThumbnailLink] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (work) {
      setTitle(work.title || '');
      setVideoLink(work.videoLink || '');
      setImageThumbnailLink(work.rawItem?.imageThumbnailLink || '');
      setTags(work.rawItem?.tags || work.tags.join(', '));
      setCategory((work.category as any) || 'HORIZONTAL');
      setFeatured(Boolean(work.featured));
    } else {
      setTitle('');
      setVideoLink('');
      setImageThumbnailLink('');
      setTags('EDITOR');
      setCategory('HORIZONTAL');
      setFeatured(false);
    }
  }, [work, isOpen]);

  if (!isOpen) return null;

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await uploadMediaFile(file);
      setVideoLink(res.url);
    } catch (err: any) {
      alert('Video upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      setImageThumbnailLink(res.url);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title,
        videoLink,
        imageThumbnailLink,
        tags,
        category,
        featured,
      });
      onClose();
    } catch (err: any) {
      alert('Error saving work: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
          {work ? <Edit3 size={18} className="text-yellow-400" /> : <Plus size={18} className="text-emerald-400" />}
          {work ? 'Edit Project Details' : 'Add New Project'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Stree 2 Promo | Prime Video"
              required
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-[#1e1e1e] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/50 cursor-pointer"
              >
                <option value="HORIZONTAL">Horizontal (16:9)</option>
                <option value="VERTICAL">Vertical (9:16 Reel/Short)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Featured in Header</label>
              <button
                type="button"
                onClick={() => setFeatured(!featured)}
                className={`w-full py-2.5 px-4 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  featured ? 'bg-amber-400/20 border-amber-400/50 text-amber-300' : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'
                }`}
              >
                {featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                {featured ? 'Featured in 01 Recent' : 'Not Featured'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="EDITOR, COLORIST, DOP, MOTION"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest text-white/60 font-medium">Video Source *</label>
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={uploadingVideo}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Upload size={13} />
                {uploadingVideo ? 'Uploading Video...' : 'Upload Video File (.mp4, .webm)'}
              </button>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </div>
            <input
              type="text"
              value={videoLink}
              onChange={e => {
                const val = e.target.value;
                if (val.includes('drive.google.com')) {
                  alert('Google Drive video links are not supported because they use the restricted Google Drive player. Please click "Upload Video File" above to upload your video directly to this platform, or use a YouTube/Instagram link.');
                  return;
                }
                setVideoLink(val);
              }}
              placeholder="Paste YouTube / Instagram link or click 'Upload Video File' above"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Supports <strong>YouTube</strong>, <strong>Instagram</strong>, or direct <strong>video upload</strong> (played with high-performance HTML5 + Mux Data).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest text-white/60 font-medium">Custom Thumbnail URL</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Upload size={13} />
                {uploading ? 'Uploading...' : 'Upload File / Video'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <input
              type="text"
              value={imageThumbnailLink}
              onChange={e => setImageThumbnailLink(e.target.value)}
              placeholder="https://drive.google.com/... or uploaded url"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Portfolio items & UI state
  const [data, setData] = useState<DisplayWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [playingItem, setPlayingItem] = useState<DisplayWorkItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<DisplayWorkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Subpage navigation matching frontend
  const [currentPage, setCurrentPage] = useState<'home' | 'creative-archive' | 'portrait-cinema' | 'cinematography'>('home');
  const [colsCreative, setColsCreative] = useState(3);
  const [colsPortrait, setColsPortrait] = useState(5);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  // Hidden upload ref for quick tile upload
  const tileUploadRef = useRef<HTMLInputElement>(null);
  const [tileUploadTargetId, setTileUploadTargetId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) setColsCreative(3);
      else if (w >= 768) setColsCreative(2);
      else setColsCreative(1);

      if (w >= 1280) setColsPortrait(5);
      else if (w >= 1024) setColsPortrait(4);
      else if (w >= 768) setColsPortrait(3);
      else setColsPortrait(2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth check
  useEffect(() => {
    verifyToken().then(valid => {
      setIsAuthenticated(valid);
      if (valid) loadWorks();
    });
  }, []);

  const loadWorks = async () => {
    try {
      setLoading(true);
      const works = await fetchWorks();
      const transformed = works.filter(w => w.title).map(transformWork);
      setData(transformed);
    } catch (err: any) {
      showToast('Error loading works: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await adminLogin(username, password);
      setIsAuthenticated(true);
      loadWorks();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
  };

  // Drag and Drop ordering handler
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverItemId(null);
    if (!draggedItemId || draggedItemId === targetId) return;

    const sourceIndex = data.findIndex(d => d.id === draggedItemId);
    const targetIndex = data.findIndex(d => d.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...data];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const updatedWithOrder = reordered.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }));

    setData(updatedWithOrder);
    setDraggedItemId(null);

    try {
      await reorderWorks(updatedWithOrder.map(item => ({ id: item.id, displayOrder: item.displayOrder })));
      showToast('New position saved successfully!');
    } catch (err: any) {
      showToast('Failed to save order: ' + err.message, 'error');
      loadWorks();
    }
  };

  // Move up or down programmatically
  const moveItem = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = data.findIndex(d => d.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;

    const reordered = [...data];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const updatedWithOrder = reordered.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }));

    setData(updatedWithOrder);
    try {
      await reorderWorks(updatedWithOrder.map(item => ({ id: item.id, displayOrder: item.displayOrder })));
      showToast(`Moved ${direction === 'up' ? 'earlier' : 'later'}!`);
    } catch (err: any) {
      showToast('Failed to save order', 'error');
      loadWorks();
    }
  };

  // Save or Create work
  const handleSaveWork = async (formData: Partial<NewWorkItem>) => {
    if (editModalItem) {
      const updated = await updateWork(editModalItem.id, formData);
      setData(prev => prev.map(item => (item.id === updated.id ? transformWork(updated) : item)));
      showToast('Project updated successfully!');
    } else {
      const created = await createWork({
        ...formData,
        title: formData.title || 'Untitled Project',
        displayOrder: 1,
      } as NewWorkItem);
      const transformed = transformWork(created);
      setData(prev => [transformed, ...prev]);
      showToast('New project created!');
    }
  };

  // Delete work
  const handleDeleteWork = async (item: DisplayWorkItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    try {
      await deleteWork(item.id);
      setData(prev => prev.filter(w => w.id !== item.id));
      showToast('Project deleted successfully');
    } catch (err: any) {
      showToast('Failed to delete project: ' + err.message, 'error');
    }
  };

  // Quick Tile Upload
  const triggerTileUpload = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTileUploadTargetId(id);
    tileUploadRef.current?.click();
  };

  const handleTileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tileUploadTargetId) return;

    showToast('Uploading asset...', 'info');
    try {
      const res = await uploadMediaFile(file);
      const isVideo = file.type.startsWith('video/');
      const payload = isVideo ? { videoLink: res.url } : { imageThumbnailLink: res.url };
      const updated = await updateWork(tileUploadTargetId, payload);
      setData(prev => prev.map(item => (item.id === updated.id ? transformWork(updated) : item)));
      showToast(isVideo ? 'Video updated successfully!' : 'Thumbnail updated successfully!');
    } catch (err: any) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      if (tileUploadRef.current) tileUploadRef.current.value = '';
      setTileUploadTargetId(null);
    }
  };

  // Video embed helpers
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('shorts/')) {
        videoId = url.split('shorts/')[1].split(/[?#&]/)[0];
      } else {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        videoId = match && match[2].length === 11 ? match[2] : '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0` : url;
    }
    if (url.includes('instagram.com')) {
      const baseUrl = url.split('?')[0];
      return baseUrl.endsWith('/') ? `${baseUrl}embed` : `${baseUrl}/embed`;
    }
    // Disallow Google Drive embed player
    return url;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('mux.com') ||
      lower.includes('.m3u8') ||
      lower.startsWith('/uploads/') ||
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.ogg') ||
      lower.includes('/uploads/') ||
      lower.includes('cloudinary.com')
    );
  };

  // Filter helpers
  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setActiveFilters(['all']);
      return;
    }
    setActiveFilters(prev => {
      const withoutAll = prev.filter(f => f !== 'all');
      if (withoutAll.includes(filter)) {
        const next = withoutAll.filter(f => f !== filter);
        return next.length === 0 ? ['all'] : next;
      }
      return [...withoutAll, filter];
    });
  };

  const featuredWorks = data.filter(item => item.featured);
  const horizontalWorks = data.filter(item => item.category === 'HORIZONTAL');
  const verticalVideos = data.filter(item => item.category === 'VERTICAL');

  const filteredWorkItems = activeFilters.includes('all')
    ? horizontalWorks
    : horizontalWorks.filter(item => item.tags.some(tag => activeFilters.includes(tag)));

  const filteredVerticalVideos = activeFilters.includes('all')
    ? verticalVideos
    : verticalVideos.filter(item => item.tags.some(tag => activeFilters.includes(tag)));

  const cinematographyWorks = data.filter(item => item.category === 'HORIZONTAL' && item.tags.includes('dop'));

  const filteredCinematographyWorks = activeFilters.includes('all')
    ? cinematographyWorks
    : cinematographyWorks.filter(item => item.tags.some(tag => activeFilters.includes(tag)));

  const navItems = [
    { name: "Home", link: "#home" },
    { name: "About", link: "#about" },
    { name: "Contact", link: "#contact" },
  ];

  // ─── LOGIN SCREEN IF NOT AUTHENTICATED ─────────────────────────────────────
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,transparent_70%)] pointer-events-none" />
        <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white text-black font-black text-xl flex items-center justify-center rounded">K</div>
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase">Admin Dashboard</h2>
              <p className="text-white/40 text-xs uppercase tracking-wider">Live Visual Editor</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-[#1c1c1c] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#1c1c1c] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-white text-black rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer mt-4"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Visual Editor'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── ADMIN EDITABLE PROJECT TILE COMPONENT ──────────────────────────────────
  const EditableProjectCard = ({
    item,
    isVertical = false,
  }: {
    item: DisplayWorkItem;
    isVertical?: boolean;
  }) => {
    const isDragged = draggedItemId === item.id;
    const isOver = dragOverItemId === item.id;

    return (
      <div
        draggable
        onDragStart={e => handleDragStart(e, item.id)}
        onDragOver={e => handleDragOver(e, item.id)}
        onDrop={e => handleDrop(e, item.id)}
        className={`group relative overflow-hidden bg-neutral-200 transition-all select-none cursor-grab active:cursor-grabbing border ${
          isOver ? 'border-amber-400 ring-2 ring-amber-400 scale-[0.98]' : 'border-transparent'
        } ${isDragged ? 'opacity-40' : 'opacity-100'}`}
      >
        {/* Floating Quick Action Toolbar */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Drag handle pill */}
          <div
            title="Drag to reposition anywhere"
            className="p-1.5 bg-black/80 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 cursor-grab active:cursor-grabbing shadow-lg"
          >
            <GripVertical size={14} />
          </div>

          {/* Quick upload button */}
          <button
            onClick={e => triggerTileUpload(item.id, e)}
            title="Quick Upload Video / Thumbnail File"
            className="p-1.5 bg-black/80 hover:bg-emerald-600 text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer"
          >
            <Upload size={14} />
          </button>

          {/* Edit button */}
          <button
            onClick={e => {
              e.stopPropagation();
              setEditModalItem(item);
              setIsModalOpen(true);
            }}
            title="Edit Details"
            className="p-1.5 bg-black/80 hover:bg-amber-500 text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer"
          >
            <Edit3 size={14} />
          </button>

          {/* Delete button */}
          <button
            onClick={e => handleDeleteWork(item, e)}
            title="Delete Project"
            className="p-1.5 bg-black/80 hover:bg-rose-600 text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Position arrows for fine control on click */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); moveItem(item.id, 'up'); }}
            title="Move earlier in list"
            className="p-1.5 bg-black/80 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 cursor-pointer shadow-lg"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); moveItem(item.id, 'down'); }}
            title="Move later in list"
            className="p-1.5 bg-black/80 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 cursor-pointer shadow-lg"
          >
            <ArrowDown size={13} />
          </button>
        </div>

        {/* Media Preview container matching exact public site */}
        <div
          onClick={() => setPlayingItem(item)}
          className={`relative ${isVertical ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden bg-neutral-200 cursor-pointer`}
        >
          <ImageWithFallback
            src={item.image}
            fallbackSrc={item.fallbackSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          {/* Overlay matching exact original layout */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <h3 className="text-white mb-2 text-xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              {item.title}
            </h3>
            <div className="flex gap-2 flex-wrap translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
              {item.featured && (
                <span className="px-2 py-0.5 bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                  ★ Featured
                </span>
              )}
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Video modal component
  const VideoModal = ({ item, onClose }: { item: DisplayWorkItem; onClose: () => void }) => (
    <div
      className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${item.category === 'VERTICAL' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-6xl aspect-video'} bg-black shadow-2xl ring-1 ring-white/10`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-14 md:top-0 text-white/70 hover:text-white transition-colors flex items-center justify-center bg-black/40 p-2 rounded-full backdrop-blur-md cursor-pointer"
          aria-label="Close"
        >
          <X size={28} />
        </button>
        {isDirectVideo(item.videoLink) ? (
          <MuxVideoPlayer
            src={item.videoLink}
            poster={item.image}
            title={item.title}
            videoId={item.id}
            className="w-full h-full object-contain"
            autoPlay
            controls
          />
        ) : (
          <iframe
            src={getEmbedUrl(item.videoLink)}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );

  // Creative Archive view
  if (currentPage === 'creative-archive') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button
              onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-black/60 transition-colors cursor-pointer"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Portfolio
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore (Admin)</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Creative Collection</p>
              <h2 className="text-4xl font-light tracking-tight text-black">CREATIVE ARCHIVE ({filteredWorkItems.length})</h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button key={filter} onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}
                >
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {filteredWorkItems.map((item) => (
              <EditableProjectCard key={item.id} item={item} />
            ))}
          </div>
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Portrait Cinema view
  if (currentPage === 'portrait-cinema') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-black/60 transition-colors cursor-pointer">
              <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Portfolio
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore (Admin)</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Cinematic Shorts</p>
              <h2 className="text-4xl font-light tracking-tight text-black">VERTICAL ({filteredVerticalVideos.length})</h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button key={filter} onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}>
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
            {filteredVerticalVideos.map((item) => (
              <EditableProjectCard key={item.id} item={item} isVertical />
            ))}
          </div>
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Cinematography view
  if (currentPage === 'cinematography') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-black/60 transition-colors cursor-pointer">
              <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Portfolio
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore (Admin)</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Cinematic Collection</p>
              <h2 className="text-4xl font-light tracking-tight text-black">CINEMATOGRAPHY ({filteredCinematographyWorks.length})</h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button key={filter} onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}>
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {filteredCinematographyWorks.map((item) => (
              <EditableProjectCard key={item.id} item={item} />
            ))}
          </div>
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white relative">
      {/* Hidden tile uploader */}
      <input
        ref={tileUploadRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        onChange={handleTileFileChange}
        className="hidden"
      />

      {/* Floating Admin Controls Header Strip */}
      <div className="fixed top-0 left-0 w-full z-[80] bg-black/90 text-white border-b border-white/10 backdrop-blur-md px-6 py-2.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white text-black flex items-center justify-center font-black text-xs rounded">
            K
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white">Visual Admin Mode</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Editor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditModalItem(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Plus size={13} />
            Add Project
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-white/20 hover:border-white/50 text-white rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all"
          >
            <Eye size={12} />
            Live Site
          </a>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 border border-white/20 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Navigation matching original App.tsx */}
      <div className="pt-10">
        <Navbar>
          <NavBody>
            <NavbarLogo />
            <NavItems items={navItems} />
            <div className="flex items-center gap-4">
              <NavbarButton href="#contact" variant="dark">Let's Talk</NavbarButton>
            </div>
          </NavBody>

          <MobileNav>
            <MobileNavHeader>
              <NavbarLogo />
              <MobileNavToggle isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />
            </MobileNavHeader>

            <MobileNavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
              {navItems.map((item, idx) => (
                <a key={`mobile-link-${idx}`} href={item.link} onClick={() => setIsMenuOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-widest text-[10px]">
                  <span className="block">{item.name}</span>
                </a>
              ))}
              <div className="flex w-full flex-col gap-4 mt-4">
                <NavbarButton onClick={() => setIsMenuOpen(false)} href="#contact" variant="dark" className="w-full">
                  Let's Talk
                </NavbarButton>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>
      </div>

      {/* ─── Hero Section (Exact 100% Identical Replica of Frontend App.tsx) ── */}
      <section id="home" className="relative min-h-screen px-6 lg:px-8 bg-black overflow-hidden flex items-center justify-center pt-28 pb-20">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0">
          <source src="https://res.cloudinary.com/dvbarr6ni/video/upload/v1780090126/hero-bg_jxvbup.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-20 flex flex-col items-center text-center">
          <div className="space-y-12 w-full">
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                className="px-6 py-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md shadow-[0_0_24px_rgba(255,255,255,0.05)] w-fit"
              >
                <p className="uppercase tracking-[0.35em] text-[10px] font-bold text-white leading-none flex items-center gap-2.5">
                  <Film size={13} className="text-white animate-pulse" />
                  DOP &bull; Editor &bull; Colorist
                </p>
              </motion.div>
            </div>
            <div className="space-y-4 -mt-4 md:-mt-8">
              <div className="flex flex-col items-center">
                <div className="flex overflow-hidden pb-0">
                  {"KSHITIJ".split("").map((char, i) => (
                    <motion.span key={i}
                      initial={{ opacity: 0, filter: "blur(10px)", y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.05, ease: [0.2, 0.65, 0.3, 0.9] }}
                      className="text-6xl md:text-[8rem] font-bold tracking-tighter leading-none text-white inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
                <div className="flex overflow-hidden -mt-2 md:-mt-5">
                  {"RATHORE".split("").map((char, i) => (
                    <motion.span key={i}
                      initial={{ opacity: 0, filter: "blur(10px)", y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: [0.2, 0.65, 0.3, 0.9] }}
                      className="text-6xl md:text-[8rem] font-bold tracking-tighter leading-none text-neutral-300 inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl mx-auto space-y-8 -mt-6 md:-mt-10"
            >
              <motion.p
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-xl md:text-3xl font-light text-white/90 leading-tight tracking-tight px-4"
              >
                I shoot stories, shape rhythms, and paint with color. <br className="hidden md:block" />
                The rest is just export settings.
              </motion.p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <a href="#works" className="pushable pushable-light">
                  <span className="btn-shadow"></span>
                  <span className="btn-edge"></span>
                  <span className="btn-front">Explore Works</span>
                </a>
                <a href="#contact" className="pushable pushable-dark">
                  <span className="btn-shadow"></span>
                  <span className="btn-edge"></span>
                  <span className="btn-front">Get in touch</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {/* ─── 01 Recent (Featured Works Carousel) ────────────────────────────── */}
      <section id="works" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between mb-12">
          <h2 className="text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">01</span>
            Recent
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -500, behavior: 'smooth' })}
              className="p-3 border border-black rounded-full hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 500, behavior: 'smooth' })}
              className="p-3 border border-black rounded-full hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex gap-0 min-w-max">
            {featuredWorks.map(item => (
              <div key={item.id} className="w-[480px] flex-shrink-0">
                <EditableProjectCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 02 All Works (Grid with Filter & Drag) ─────────────────────────── */}
      <section id="archive" className="py-20 px-6 lg:px-8 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <h2 className="text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
              <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">02</span>
              All
            </h2>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map(filter => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                    activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredWorkItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {filteredWorkItems.slice(0, colsCreative * 3).map(item => (
                  <EditableProjectCard key={item.id} item={item} />
                ))}
              </div>
              {filteredWorkItems.length > colsCreative * 3 && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => { setCurrentPage('creative-archive'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-12 py-5 border border-black text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full cursor-pointer"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No horizontal works found for this selection.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 03 Vertical Works ──────────────────────────────────────────────── */}
      <section id="verticals" className="py-20 px-6 lg:px-8 bg-neutral-50 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">03</span>
            VERTICAL
          </h2>

          {filteredVerticalVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                {filteredVerticalVideos.slice(0, colsPortrait * 2).map(item => (
                  <EditableProjectCard key={item.id} item={item} isVertical />
                ))}
              </div>
              {filteredVerticalVideos.length > colsPortrait * 2 && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => { setCurrentPage('portrait-cinema'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-12 py-5 border border-black text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full cursor-pointer"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 04 Cinematography Works ────────────────────────────────────────── */}
      <section id="cinematography" className="py-20 px-6 lg:px-8 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">04</span>
            CINEMATOGRAPHY
          </h2>

          {cinematographyWorks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {cinematographyWorks.slice(0, colsCreative * 3).map(item => (
                  <EditableProjectCard key={item.id} item={item} />
                ))}
              </div>
              {cinematographyWorks.length > colsCreative * 3 && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => { setCurrentPage('cinematography'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-12 py-5 border border-black text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full cursor-pointer"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No cinematography works found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Marquee component */}
      <Marquee />

      {/* About Section */}
      <section id="about" className="py-32 px-6 lg:px-8 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="space-y-12">
              <h2 className="text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
                <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">05</span>
                ABOUT
              </h2>
              <p className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] text-black">
                Mumbai-based creative with a sharp eye for storytelling through <span className="italic">motion</span> and <span className="italic font-medium bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500 bg-clip-text text-transparent">color</span>.
              </p>
            </div>
            <div className="flex flex-col justify-end space-y-10">
              <p className="text-xl text-black/70 leading-relaxed max-w-xl">
                Spending most of my time turning ideas into moving images, shooting them, editing them, grading them, and occasionally losing sleep over tiny creative decisions. Worth it every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Video Lightbox Modal */}
      {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}

      {/* Edit / Create Modal */}
      <WorkModal
        isOpen={isModalOpen}
        work={editModalItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWork}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
