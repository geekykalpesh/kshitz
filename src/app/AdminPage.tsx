import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import {
  ChevronLeft, ChevronRight, X, Film, Edit3, Trash2, Plus, Upload,
  GripVertical, Star, StarOff, Save, Check, ArrowUp, ArrowDown, LogOut,
  ExternalLink, Eye, RefreshCw, AlertCircle, Play, ArrowLeft
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

// Lazy load Mux player only when previewing video modal
const MuxVideoPlayer = lazy(() =>
  import('@/components/MuxVideoPlayer').then(m => ({ default: m.MuxVideoPlayer }))
);
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
  adminLogout,
  fetchSettings,
  updateSettings,
  SiteSettings,
} from '@/lib/api';
import { transformWork, DisplayWorkItem, getInitialDisplayWorks } from '@/lib/transformWork';
import { ShimmerCarousel, ShimmerGrid, ShimmerFilters } from './components/Shimmer';

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

// ─── Toast Notification with Micro-Interaction ────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm font-medium transition-all animate-in slide-in-from-bottom-5 duration-300 ${
        type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
        type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-300' :
        'bg-neutral-900/90 border-white/20 text-white'
      }`}
    >
      {type === 'success' && <Check size={16} className="text-emerald-400" />}
      {type === 'error' && <AlertCircle size={16} className="text-rose-400" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75 transition-opacity cursor-pointer">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Edit / Create Modal with Shimmer Upload Bar ───────────────────────────────
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
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 text-white shadow-2xl relative scale-100 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all hover:rotate-90 duration-300"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
          {work ? <Edit3 size={18} className="text-amber-400" /> : <Plus size={18} className="text-emerald-400" />}
          {work ? 'Edit Project Details' : 'Add New Project'}
        </h3>

        {/* Shimmer progress banner while uploading */}
        {(uploadingVideo || uploading) && (
          <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
              <span className="flex items-center gap-2">
                <Upload size={14} className="animate-bounce" />
                {uploadingVideo ? 'Streaming video directly to cloud storage...' : 'Uploading image asset...'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Please wait</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full animate-shimmer w-full" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Stree 2 Promo | Prime Video"
              required
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-[#1e1e1e] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
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
                className={`w-full py-2.5 px-4 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all btn-tactile ${
                  featured ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'
                }`}
              >
                {featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                {featured ? '★ Featured in 01 Recent' : 'Not Featured'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2.5 font-medium">
              Select Tags <span className="text-white/40 normal-case">(choose one or more)</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {['EDITOR', 'COLORIST', 'DOP', 'MOTION'].map(tagOption => {
                const currentTags = tags
                  .split(',')
                  .map(t => t.trim().toUpperCase())
                  .filter(Boolean);
                const isSelected = currentTags.includes(tagOption);

                return (
                  <button
                    key={tagOption}
                    type="button"
                    onClick={() => {
                      let updated;
                      if (isSelected) {
                        updated = currentTags.filter(t => t !== tagOption);
                      } else {
                        updated = [...currentTags, tagOption];
                      }
                      setTags(updated.join(', '));
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 btn-tactile ${
                      isSelected
                        ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-105'
                        : 'bg-white/5 text-white/70 border border-white/15 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{tagOption}</span>
                    {isSelected && <span className="text-black font-extrabold text-[11px]">✓</span>}
                  </button>
                );
              })}
            </div>
            {/* Display formatted preview */}
            <div className="mt-2 text-[11px] text-white/40 font-mono tracking-wide">
              Selected: <span className="text-amber-300 font-semibold">{tags || 'None (select at least one tag)'}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest text-white/60 font-medium">Video Source *</label>
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={uploadingVideo}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer font-medium btn-tactile"
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
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
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
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer font-medium btn-tactile"
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
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-white/20 hover:bg-white/5 rounded-lg text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-all cursor-pointer btn-tactile"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading || uploadingVideo}
              className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 btn-tactile"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN VISUAL EDITOR COMPONENT ───────────────────────────────────────
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Portfolio items & UI state
  const [data, setData] = useState<DisplayWorkItem[]>(() => getInitialDisplayWorks());
  const [loading, setLoading] = useState(() => getInitialDisplayWorks().length === 0);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [playingItem, setPlayingItem] = useState<DisplayWorkItem | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modal edit/create state
  const [editModalItem, setEditModalItem] = useState<DisplayWorkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  // Tile direct upload state
  const [tileUploadTargetId, setTileUploadTargetId] = useState<number | null>(null);
  const tileFileInputRef = useRef<HTMLInputElement>(null);

  // UI Navigation matching public site
  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'creative-archive' | 'portrait-cinema' | 'cinematography'>('home');
  const [colsCreative, setColsCreative] = useState(3);
  const [colsPortrait, setColsPortrait] = useState(5);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hero section background & content customizer state
  const [settings, setSettings] = useState<SiteSettings>({
    hero_bg_url: 'https://ik.imagekit.io/geekykalpesh/portfolio/hero/hero-bg_oPMA23VnnZ.mp4',
    hero_bg_type: 'video',
    hero_badge: 'DOP • Editor • Colorist',
    hero_title_first: 'KSHITIJ',
    hero_title_last: 'RATHORE',
    hero_subtitle: 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.',
  });
  const [isHeroEditOpen, setIsHeroEditOpen] = useState(false);
  const [heroTab, setHeroTab] = useState<'content' | 'background'>('content');
  const [heroBadgeInput, setHeroBadgeInput] = useState('DOP • Editor • Colorist');
  const [heroTitleFirstInput, setHeroTitleFirstInput] = useState('KSHITIJ');
  const [heroTitleLastInput, setHeroTitleLastInput] = useState('RATHORE');
  const [heroSubtitleInput, setHeroSubtitleInput] = useState('I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.');
  const [heroBgUrlInput, setHeroBgUrlInput] = useState('');
  const [heroBgTypeInput, setHeroBgTypeInput] = useState<'video' | 'image' | 'none'>('video');
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await verifyToken();
      setIsAuthenticated(valid);
      if (valid) {
        loadWorks();
        loadSettings();
      }
    };
    checkAuth();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await fetchSettings();
      if (s) {
        setSettings(s);
        setHeroBgUrlInput(s.hero_bg_url || '');
        setHeroBgTypeInput((s.hero_bg_type as any) || 'video');
        setHeroBadgeInput(s.hero_badge || 'DOP • Editor • Colorist');
        setHeroTitleFirstInput(s.hero_title_first || 'KSHITIJ');
        setHeroTitleLastInput(s.hero_title_last || 'RATHORE');
        setHeroSubtitleInput(s.hero_subtitle || 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.');
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  const loadWorks = async () => {
    try {
      if (data.length === 0) setLoading(true);
      const works = await fetchWorks();
      const transformed = works.filter(w => w.title).map(transformWork);
      setData(transformed);
    } catch (err: any) {
      showToast('Error loading works: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeroUploading(true);
    try {
      showToast('Uploading hero media...', 'info');
      const res = await uploadMediaFile(file);
      const isVid = file.type.startsWith('video/');
      const detectedType = isVid ? 'video' : 'image';
      
      const newSettings = {
        hero_bg_url: res.url,
        hero_bg_type: detectedType,
      };

      await updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      setHeroBgUrlInput(res.url);
      setHeroBgTypeInput(detectedType);
      showToast('Hero background updated successfully!', 'success');
      setIsHeroEditOpen(false);
    } catch (err: any) {
      showToast('Hero upload failed: ' + err.message, 'error');
    } finally {
      setHeroUploading(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  const handleSaveHeroSettings = async () => {
    try {
      showToast('Saving hero section settings...', 'info');
      const newSettings: Record<string, string> = {
        hero_bg_url: heroBgUrlInput.trim(),
        hero_bg_type: heroBgTypeInput,
        hero_badge: heroBadgeInput.trim() || 'DOP • Editor • Colorist',
        hero_title_first: heroTitleFirstInput.trim() || 'KSHITIJ',
        hero_title_last: heroTitleLastInput.trim() || 'RATHORE',
        hero_subtitle: heroSubtitleInput.trim() || 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.',
      };
      await updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      showToast('Hero section updated successfully!', 'success');
      setIsHeroEditOpen(false);
    } catch (err: any) {
      showToast('Failed to save hero settings: ' + err.message, 'error');
    }
  };

  const handleRemoveHeroBg = async () => {
    if (!window.confirm('Are you sure you want to remove the hero background?')) return;
    try {
      const newSettings = {
        hero_bg_url: '',
        hero_bg_type: 'none',
      };
      await updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      setHeroBgUrlInput('');
      setHeroBgTypeInput('none');
      showToast('Hero background removed', 'success');
      setIsHeroEditOpen(false);
    } catch (err: any) {
      showToast('Failed to remove hero background: ' + err.message, 'error');
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
      showToast('Authenticated successfully', 'success');
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

  const handleSaveWork = async (workData: Partial<NewWorkItem>) => {
    try {
      if (editModalItem) {
        await updateWork(editModalItem.id, workData);
        showToast('Project updated successfully', 'success');
      } else {
        await createWork(workData as NewWorkItem);
        showToast('New project created successfully', 'success');
      }
      loadWorks();
    } catch (err: any) {
      showToast('Failed to save project: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteWork = async (item: DisplayWorkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      await deleteWork(item.id);
      setData(prev => prev.filter(w => w.id !== item.id));
      showToast('Project deleted successfully', 'success');
    } catch (err: any) {
      showToast('Failed to delete work: ' + err.message, 'error');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', String(id));
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (dragOverItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const currentList = [...data];
    const draggedIndex = currentList.findIndex(item => item.id === draggedItemId);
    const targetIndex = currentList.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [movedItem] = currentList.splice(draggedIndex, 1);
    currentList.splice(targetIndex, 0, movedItem);

    const updatedWithOrder = currentList.map((item, index) => ({
      ...item,
      displayOrder: index,
    }));

    setData(updatedWithOrder);
    setDraggedItemId(null);
    setDragOverItemId(null);

    showToast('Reordering saved', 'info');
    try {
      await reorderWorks(updatedWithOrder.map(item => ({ id: item.id, displayOrder: item.displayOrder })));
      showToast('Order synchronized with database', 'success');
    } catch (err: any) {
      showToast('Failed to save order: ' + err.message, 'error');
      loadWorks();
    }
  };

  const moveItem = async (id: number, direction: 'up' | 'down') => {
    const currentList = [...data];
    const index = currentList.findIndex(item => item.id === id);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const [movedItem] = currentList.splice(index, 1);
    currentList.splice(targetIndex, 0, movedItem);

    const updatedWithOrder = currentList.map((item, i) => ({
      ...item,
      displayOrder: i,
    }));

    setData(updatedWithOrder);

    try {
      await reorderWorks(updatedWithOrder.map(item => ({ id: item.id, displayOrder: item.displayOrder })));
      showToast('Order updated', 'success');
    } catch (err: any) {
      showToast('Failed to update order: ' + err.message, 'error');
      loadWorks();
    }
  };

  const toggleFeatured = async (item: DisplayWorkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFeatured = !item.featured;
    setData(prev =>
      prev.map(w => (w.id === item.id ? { ...w, featured: newFeatured } : w))
    );

    try {
      await updateWork(item.id, { featured: newFeatured });
      showToast(newFeatured ? 'Added to Recent Carousel' : 'Removed from Recent', 'success');
    } catch (err: any) {
      showToast('Failed to update featured: ' + err.message, 'error');
      loadWorks();
    }
  };

  const triggerTileUpload = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTileUploadTargetId(id);
    tileFileInputRef.current?.click();
  };

  const handleTileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tileUploadTargetId) return;

    showToast('Uploading asset...', 'info');
    try {
      const res = await uploadMediaFile(file);
      const isVideo = file.type.startsWith('video/');

      if (isVideo) {
        await updateWork(tileUploadTargetId, { videoLink: res.url });
        showToast('Video linked to project', 'success');
      } else {
        await updateWork(tileUploadTargetId, { imageThumbnailLink: res.url });
        showToast('Thumbnail updated for project', 'success');
      }
      loadWorks();
    } catch (err: any) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      if (tileFileInputRef.current) tileFileInputRef.current.value = '';
      setTileUploadTargetId(null);
    }
  };

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
    return url;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes('imagekit.io') ||
      lowerUrl.includes('mux.com') ||
      lowerUrl.includes('.m3u8') ||
      lowerUrl.startsWith('/uploads/') ||
      lowerUrl.endsWith('.mp4') ||
      lowerUrl.endsWith('.webm') ||
      lowerUrl.endsWith('.ogg') ||
      lowerUrl.includes('cloudinary.com') ||
      lowerUrl.includes('.mp4?') ||
      lowerUrl.includes('.webm?') ||
      lowerUrl.includes('.ogg?')
    );
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
    { name: "Contact", link: "#contact" },
  ];

  // ─── LOGIN SCREEN IF NOT AUTHENTICATED ─────────────────────────────────────
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0,transparent_70%)] pointer-events-none" />
        <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl card-hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white text-black font-black text-xl flex items-center justify-center rounded shadow-md">K</div>
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase">Admin Dashboard</h2>
              <p className="text-white/40 text-xs uppercase tracking-wider">Live Visual Editor</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded-lg animate-in fade-in duration-200">
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
                className="w-full bg-[#1c1c1c] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
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
                className="w-full bg-[#1c1c1c] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-white text-black rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer mt-4 shadow-lg btn-tactile disabled:opacity-50"
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
        className={`group relative overflow-hidden bg-[#0c0c0f] transition-all duration-300 select-none cursor-grab active:cursor-grabbing border ${
          isOver ? 'border-amber-400 ring-4 ring-amber-400/50 scale-[0.98]' : 'border-transparent'
        } ${isDragged ? 'opacity-30 scale-95' : 'opacity-100 hover:scale-[1.01] hover:z-20'}`}
      >
        {/* Floating Quick Action Toolbar */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Drag handle pill */}
          <div
            title="Drag to reposition anywhere"
            className="p-1.5 bg-black/80 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 cursor-grab active:cursor-grabbing shadow-lg btn-tactile"
          >
            <GripVertical size={14} />
          </div>

          {/* Quick upload button */}
          <button
            onClick={e => triggerTileUpload(item.id, e)}
            title="Quick Upload Video / Thumbnail File"
            className="p-1.5 bg-black/80 hover:bg-emerald-600 text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer btn-tactile"
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
            className="p-1.5 bg-black/80 hover:bg-amber-500 text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer btn-tactile"
          >
            <Edit3 size={14} />
          </button>

          {/* Toggle Featured */}
          <button
            onClick={e => toggleFeatured(item, e)}
            title={item.featured ? 'Remove from Featured Recent Carousel' : 'Feature in Recent Carousel'}
            className={`p-1.5 rounded-md backdrop-blur-md border shadow-lg transition-colors cursor-pointer btn-tactile ${
              item.featured
                ? 'bg-amber-500 text-black border-amber-400 font-bold'
                : 'bg-black/80 hover:bg-neutral-800 text-white/70 hover:text-white border-white/10'
            }`}
          >
            <Star size={14} fill={item.featured ? 'currentColor' : 'none'} />
          </button>

          {/* Delete button */}
          <button
            onClick={e => handleDeleteWork(item, e)}
            title="Delete Project"
            className="p-1.5 bg-black/80 hover:bg-rose-600 text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer btn-tactile"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Position arrows for fine control on click */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); moveItem(item.id, 'up'); }}
            title="Move earlier in list"
            className="p-1.5 bg-black/80 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 cursor-pointer shadow-lg btn-tactile"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); moveItem(item.id, 'down'); }}
            title="Move later in list"
            className="p-1.5 bg-black/80 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 cursor-pointer shadow-lg btn-tactile"
          >
            <ArrowDown size={13} />
          </button>
        </div>

        {/* Media Preview container matching exact public site */}
        <div
          onClick={() => setPlayingItem(item)}
          className={`relative ${isVertical ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden bg-[#0c0c0f] cursor-pointer`}
        >
          <ImageWithFallback
            src={item.image}
            fallbackSrc={item.fallbackSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Centered micro-interaction play button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
              <Play size={18} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

          {/* Overlay matching exact original layout */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
            <h3 className="text-white mb-2 text-xl font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
              {item.title}
            </h3>
            <div className="flex gap-2 flex-wrap translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
              {item.featured && (
                <span className="px-2 py-0.5 bg-amber-500/25 backdrop-blur-md border border-amber-400/50 text-amber-300 text-[10px] font-bold uppercase tracking-widest shadow-sm">
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
        className={`relative w-full ${item.category === 'VERTICAL' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-6xl aspect-video'} bg-black shadow-2xl ring-1 ring-white/10 rounded-xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-14 md:top-0 text-white/70 hover:text-white transition-all duration-300 hover:rotate-90 hover:scale-110 flex items-center justify-center bg-black/50 hover:bg-white hover:text-black p-2.5 rounded-full backdrop-blur-md cursor-pointer border border-white/20 shadow-xl"
          aria-label="Close"
        >
          <X size={26} />
        </button>
        {isDirectVideo(item.videoLink) ? (
          <Suspense
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#070709] gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Loading Player</p>
              </div>
            }
          >
            <MuxVideoPlayer
              src={item.videoLink}
              poster={item.image}
              title={item.title}
              videoId={item.id}
              className="w-full h-full object-contain"
              autoPlay
              controls
            />
          </Suspense>
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
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button
              onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-white/60 transition-all cursor-pointer btn-tactile"
            >
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to Portfolio</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-xl shadow-md">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore (Admin)</h1>
            </div>
          </div>
        </nav>

        <div className="w-full pt-32 pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Creative Collection</p>
              <h2 className="text-4xl font-light tracking-tight text-white">CREATIVE ARCHIVE ({filteredWorkItems.length})</h2>
            </div>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-white text-black shadow-md' : 'text-white/70 hover:bg-white/10'}`}
                  >
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={9} aspect="video" cols={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
              {filteredWorkItems.map((item) => (
                <EditableProjectCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Portrait Cinema view
  if (currentPage === 'portrait-cinema') {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-white/60 transition-all cursor-pointer btn-tactile">
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to Portfolio</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-xl shadow-md">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore (Admin)</h1>
            </div>
          </div>
        </nav>

        <div className="w-full pt-32 pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Cinematic Shorts</p>
              <h2 className="text-4xl font-light tracking-tight text-white">VERTICAL ({filteredVerticalVideos.length})</h2>
            </div>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-white text-black shadow-md' : 'text-white/70 hover:bg-white/10'}`}>
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={10} aspect="vertical" cols={5} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
              {filteredVerticalVideos.map((item) => (
                <EditableProjectCard key={item.id} item={item} isVertical />
              ))}
            </div>
          )}
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Cinematography view
  if (currentPage === 'cinematography') {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-white/60 transition-all cursor-pointer btn-tactile">
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to Portfolio</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-xl shadow-md">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore (Admin)</h1>
            </div>
          </div>
        </nav>

        <div className="w-full pt-32 pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Director of Photography</p>
              <h2 className="text-4xl font-light tracking-tight text-white">CINEMATOGRAPHY ({filteredCinematographyWorks.length})</h2>
            </div>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-white text-black shadow-md' : 'text-white/70 hover:bg-white/10'}`}
                  >
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={6} aspect="video" cols={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
              {filteredCinematographyWorks.map((item) => (
                <EditableProjectCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Main Home view
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Hidden file input for tile uploads */}
      <input
        ref={tileFileInputRef}
        type="file"
        accept="video/mp4,video/webm,image/*"
        onChange={handleTileFileChange}
        className="hidden"
      />

      {/* Floating Admin Controls Header Strip with Live Metric Chips */}
      <div className="fixed top-0 left-0 w-full z-[80] bg-black/95 text-white border-b border-white/10 backdrop-blur-md px-6 py-2.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white text-black flex items-center justify-center font-black text-xs rounded shadow-sm">
            K
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white">Visual Admin Mode</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Editor
            </span>
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10 text-[11px] font-medium text-white/70">
            <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
              <strong className="text-white">{data.length}</strong> Works
            </span>
            <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
              <strong className="text-white">{featuredWorks.length}</strong> Featured
            </span>
            <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
              <strong className="text-white">{horizontalWorks.length}</strong> Horizontal
            </span>
            <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
              <strong className="text-white">{verticalVideos.length}</strong> Vertical
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setHeroBgUrlInput(settings.hero_bg_url || '');
              setHeroBgTypeInput((settings.hero_bg_type as any) || 'video');
              setHeroBadgeInput(settings.hero_badge || 'DOP • Editor • Colorist');
              setHeroTitleFirstInput(settings.hero_title_first || 'KSHITIJ');
              setHeroTitleLastInput(settings.hero_title_last || 'RATHORE');
              setHeroSubtitleInput(settings.hero_subtitle || 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.');
              setHeroTab('content');
              setIsHeroEditOpen(true);
            }}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-md btn-tactile"
            title="Edit Hero Headline, Bio, Badge and Background"
          >
            <Edit3 size={13} />
            <span>Edit Hero Content</span>
          </button>

          <button
            onClick={() => {
              setEditModalItem(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-md btn-tactile"
          >
            <Plus size={13} />
            <span>Add Project</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-white/20 hover:border-white/50 hover:bg-white/5 text-white rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all btn-tactile"
          >
            <Eye size={12} />
            <span className="hidden sm:inline">Live Site</span>
          </a>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 border border-white/20 hover:border-white/50 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all cursor-pointer btn-tactile"
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

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen px-6 lg:px-8 bg-black overflow-hidden flex items-center justify-center pt-28 pb-20 group/hero">
        {settings.hero_bg_type === 'video' && settings.hero_bg_url && (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0">
            <source src={settings.hero_bg_url} type="video/mp4" />
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        )}
        {settings.hero_bg_type === 'image' && settings.hero_bg_url && (
          <img
            src={settings.hero_bg_url}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        )}

        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

        {/* Admin floating button to customize/remove hero background */}
        <div className="absolute top-28 right-6 md:right-10 z-30">
          <button
            onClick={() => {
              setHeroBgUrlInput(settings.hero_bg_url || '');
              setHeroBgTypeInput((settings.hero_bg_type as any) || 'video');
              setHeroBadgeInput(settings.hero_badge || 'DOP • Editor • Colorist');
              setHeroTitleFirstInput(settings.hero_title_first || 'KSHITIJ');
              setHeroTitleLastInput(settings.hero_title_last || 'RATHORE');
              setHeroSubtitleInput(settings.hero_subtitle || 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.');
              setHeroTab('content');
              setIsHeroEditOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-white/30 hover:border-amber-400/80 backdrop-blur-xl shadow-2xl transition-all duration-300 text-xs font-bold tracking-wider uppercase cursor-pointer hover:scale-105 active:scale-95"
            title="Edit Hero Headline, Bio, Badge and Background"
          >
            <Edit3 size={14} className="text-amber-400" />
            <span>Edit Hero Content & BG</span>
          </button>
        </div>

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
                  {settings.hero_badge || "DOP • Editor • Colorist"}
                </p>
              </motion.div>
            </div>
            <div className="space-y-4 -mt-4 md:-mt-8">
              <div className="flex flex-col items-center">
                <div className="flex overflow-hidden pb-0">
                  {(settings.hero_title_first || "KSHITIJ").split("").map((char, i) => (
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
                  {(settings.hero_title_last || "RATHORE").split("").map((char, i) => (
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
                className="text-xl md:text-3xl font-light text-white/90 leading-tight tracking-tight px-4 whitespace-pre-line"
              >
                {settings.hero_subtitle || 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.'}
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

      {/* ─── 01 Recent (Featured Works Carousel) ─── */}
      <section id="works" className="pt-14 pb-10 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between mb-8">
          <h2 className="text-2xl font-joyride font-normal tracking-wide text-white uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-white text-black rounded-full">01</span>
            Recent
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -500, behavior: 'smooth' })}
              className="p-3 border border-white/20 rounded-full hover:bg-black hover:text-white hover:scale-110 active:scale-90 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 500, behavior: 'smooth' })}
              className="p-3 border border-white/20 rounded-full hover:bg-black hover:text-white hover:scale-110 active:scale-90 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <ShimmerCarousel count={4} />
          </div>
        ) : (
          <div ref={scrollRef} className="overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-0 min-w-max">
              {featuredWorks.map(item => (
                <div key={item.id} className="w-[340px] sm:w-[420px] md:w-[480px] flex-shrink-0">
                  <EditableProjectCard item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── 02 All Works (Grid with Filter & Drag) ─── */}
      <section id="archive" className="pt-14 pb-10 bg-black border-t border-white/10 w-full">
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <h2 className="text-2xl font-joyride font-normal tracking-wide text-white uppercase flex items-center gap-4">
              <span className="text-sm px-3.5 py-1 font-bold font-sans bg-white text-black rounded-full">02</span>
              All
            </h2>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${
                      activeFilters.includes(filter) ? 'bg-white text-black shadow-md' : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={6} aspect="video" cols={3} />
          ) : filteredWorkItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {filteredWorkItems.slice(0, colsCreative * 3).map(item => (
                  <EditableProjectCard key={item.id} item={item} />
                ))}
              </div>
              {filteredWorkItems.length > colsCreative * 3 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => { setCurrentPage('creative-archive'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-8 py-3.5 border border-white/25 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 rounded-full cursor-pointer btn-tactile hover:shadow-lg"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/15 rounded-xl">
              <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">No horizontal works found for this selection.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 03 Vertical Works ─── */}
      <section id="verticals" className="pt-14 pb-10 bg-black border-t border-white/10 w-full">
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
            <h2 className="text-2xl font-joyride font-normal tracking-wide text-white uppercase flex items-center gap-4">
              <span className="text-sm px-3.5 py-1 font-bold font-sans bg-white text-black rounded-full">03</span>
              VERTICAL
            </h2>
          </div>

          {loading ? (
            <ShimmerGrid count={5} aspect="vertical" cols={5} />
          ) : filteredVerticalVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                {filteredVerticalVideos.slice(0, colsPortrait * 2).map(item => (
                  <EditableProjectCard key={item.id} item={item} isVertical />
                ))}
              </div>
              {filteredVerticalVideos.length > colsPortrait * 2 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => { setCurrentPage('portrait-cinema'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-8 py-3.5 border border-white/25 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 rounded-full cursor-pointer btn-tactile hover:shadow-lg"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/15 rounded-xl">
              <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 04 Cinematography Works ─── */}
      <section id="cinematography" className="pt-14 pb-10 bg-black border-t border-white/10 w-full">
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
            <h2 className="text-2xl font-joyride font-normal tracking-wide text-white uppercase flex items-center gap-4">
              <span className="text-sm px-3.5 py-1 font-bold font-sans bg-white text-black rounded-full">04</span>
              CINEMATOGRAPHY
            </h2>
          </div>

          {loading ? (
            <ShimmerGrid count={3} aspect="video" cols={3} />
          ) : cinematographyWorks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {cinematographyWorks.slice(0, colsCreative * 3).map(item => (
                  <EditableProjectCard key={item.id} item={item} />
                ))}
              </div>
              {cinematographyWorks.length > colsCreative * 3 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => { setCurrentPage('cinematography'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-8 py-3.5 border border-white/25 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 rounded-full cursor-pointer btn-tactile hover:shadow-lg"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/15 rounded-xl">
              <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">No cinematography works found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Marquee component */}
      <Marquee />

      <Footer />

      {/* Video Modal Player */}
      {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}

      {/* Edit / Create Work Modal */}
      <WorkModal
        work={editModalItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditModalItem(null);
        }}
        onSave={handleSaveWork}
      />

      {/* Toast popup */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Background & Text Content Customize Modal */}
      {isHeroEditOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsHeroEditOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#141416] border border-white/15 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-amber-400" />
                  Customize Hero Section
                </h3>
                <p className="text-xs text-white/50 mt-1">Edit headline text, bio description, badge, and background media.</p>
              </div>
              <button
                onClick={() => setIsHeroEditOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-white/10 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setHeroTab('content')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 ${
                  heroTab === 'content'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Text Content
              </button>
              <button
                type="button"
                onClick={() => setHeroTab('background')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 ${
                  heroTab === 'background'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Background Media
              </button>
            </div>

            {heroTab === 'content' && (
              <div className="space-y-4">
                {/* Hero Badge */}
                <div>
                  <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">
                    Hero Top Badge / Roles
                  </label>
                  <input
                    type="text"
                    value={heroBadgeInput}
                    onChange={e => setHeroBadgeInput(e.target.value)}
                    placeholder="e.g. DOP • Editor • Colorist"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
                  />
                  <p className="text-[11px] text-white/40 mt-1">Appears in the glowing pill badge above the hero name.</p>
                </div>

                {/* Hero Title Line 1 & Line 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">
                      Title Line 1 (First Name)
                    </label>
                    <input
                      type="text"
                      value={heroTitleFirstInput}
                      onChange={e => setHeroTitleFirstInput(e.target.value)}
                      placeholder="e.g. KSHITIJ"
                      className="w-full px-4 py-2.5 bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">
                      Title Line 2 (Last Name)
                    </label>
                    <input
                      type="text"
                      value={heroTitleLastInput}
                      onChange={e => setHeroTitleLastInput(e.target.value)}
                      placeholder="e.g. RATHORE"
                      className="w-full px-4 py-2.5 bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Hero Subtitle / Bio */}
                <div>
                  <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">
                    Hero Subtitle / Bio Statement
                  </label>
                  <textarea
                    rows={3}
                    value={heroSubtitleInput}
                    onChange={e => setHeroSubtitleInput(e.target.value)}
                    placeholder="e.g. I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings."
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all resize-y"
                  />
                  <p className="text-[11px] text-white/40 mt-1">Press Enter for line breaks. Displayed right below the name.</p>
                </div>

                {/* Live Text Preview Box */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2 mt-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Instant Preview</p>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/80">
                    {heroBadgeInput || 'DOP • Editor • Colorist'}
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white">
                    {heroTitleFirstInput || 'KSHITIJ'} <span className="text-neutral-400">{heroTitleLastInput || 'RATHORE'}</span>
                  </div>
                  <div className="text-xs text-white/70 whitespace-pre-line font-light italic">
                    "{heroSubtitleInput || 'I shoot stories, shape rhythms, and paint with color.\nThe rest is just export settings.'}"
                  </div>
                </div>
              </div>
            )}

            {heroTab === 'background' && (
              <div className="space-y-5">
                {/* Type selector */}
                <div>
                  <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">Background Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['video', 'image', 'none'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setHeroBgTypeInput(t)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          heroBgTypeInput === t
                            ? 'bg-white text-black shadow-lg scale-102'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {heroBgTypeInput !== 'none' && (
                  <>
                    {/* Upload button */}
                    <div>
                      <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">Upload File</label>
                      <input
                        type="file"
                        ref={heroFileInputRef}
                        onChange={handleHeroFileUpload}
                        accept={heroBgTypeInput === 'video' ? 'video/*' : 'image/*'}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={heroUploading}
                        onClick={() => heroFileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-white/20 hover:border-white/50 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center gap-2 text-white/80 hover:text-white cursor-pointer"
                      >
                        {heroUploading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={18} className="animate-spin text-amber-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Uploading to CDN...</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={22} className="text-white/60" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Choose {heroBgTypeInput === 'video' ? 'Video (.mp4, .webm)' : 'Image (.jpg, .png, .webp)'}
                            </span>
                            <span className="text-[10px] text-white/40">Uploaded directly to CDN & optimized</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Or enter direct URL */}
                    <div>
                      <label className="text-xs uppercase font-bold tracking-widest text-white/60 block mb-2">Or Direct Media URL</label>
                      <input
                        type="url"
                        value={heroBgUrlInput}
                        onChange={e => setHeroBgUrlInput(e.target.value)}
                        placeholder="https://... (.mp4, .jpg, .webp, or CDN link)"
                        className="w-full px-4 py-2.5 bg-black/50 border border-white/15 focus:border-white/40 rounded-lg text-sm text-white placeholder-white/30 outline-none"
                      />
                    </div>

                    {/* Preview */}
                    {heroBgUrlInput && (
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video relative">
                        {heroBgTypeInput === 'video' ? (
                          <video src={heroBgUrlInput} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={heroBgUrlInput} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                          Live Preview
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6 gap-3">
              <button
                type="button"
                onClick={handleRemoveHeroBg}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Remove BG</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHeroEditOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHeroSettings}
                  className="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
