import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight, X, Film, Play, ArrowLeft } from 'lucide-react';
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
import { motion } from 'motion/react';
import { fetchWorks, fetchSettings, SiteSettings } from '@/lib/api';
import { transformWork, DisplayWorkItem, getInitialDisplayWorks } from '@/lib/transformWork';
import { ShimmerCarousel, ShimmerGrid, ShimmerFilters } from './components/Shimmer';

// Lazy load heavy Mux player only when video modal is opened
const MuxVideoPlayer = lazy(() =>
  import('@/components/MuxVideoPlayer').then(m => ({ default: m.MuxVideoPlayer }))
);

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

export default function App() {
  const [data, setData] = useState<DisplayWorkItem[]>(() => getInitialDisplayWorks());
  const [loading, setLoading] = useState<boolean>(() => getInitialDisplayWorks().length === 0);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [playingItem, setPlayingItem] = useState<DisplayWorkItem | null>(null);

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

  const getDirectVideoUrl = (url: string) => {
    return url || '';
  };

  const [settings, setSettings] = useState<SiteSettings>({
    hero_bg_url: 'https://ik.imagekit.io/geekykalpesh/portfolio/hero/hero-bg_oPMA23VnnZ.mp4',
    hero_bg_type: 'video',
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [works, siteSettings] = await Promise.all([
          fetchWorks(),
          fetchSettings(),
        ]);
        if (!isMounted) return;
        if (siteSettings) setSettings(siteSettings);
        if (works && works.length > 0) {
          const transformed = works
            .filter(w => w.title)
            .map(transformWork);
          setData(transformed);
        }
      } catch (error) {
        console.warn('Silent background works sync:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'creative-archive' | 'portrait-cinema' | 'cinematography'>('home');
  const [colsCreative, setColsCreative] = useState(3);
  const [colsPortrait, setColsPortrait] = useState(5);
  const [visibleCreative, setVisibleCreative] = useState(18);
  const [visibleVerticals, setVisibleVerticals] = useState(20);
  const [visibleCinematography, setVisibleCinematography] = useState(18);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      } else {
        return [...withoutAll, filter];
      }
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -500 : 500,
        behavior: 'smooth'
      });
    }
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", link: "#home" },
    { name: "Contact", link: "#contact" },
  ];

  // Video modal component
  const VideoModal = ({ item, onClose }: { item: DisplayWorkItem, onClose: () => void }) => (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
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
              src={getDirectVideoUrl(item.videoLink)}
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
          ></iframe>
        )}
      </div>
    </div>
  );

  // Creative Archive page
  if (currentPage === 'creative-archive') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button
              onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-black/60 transition-all cursor-pointer btn-tactile"
            >
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to Portfolio</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl shadow-md">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Creative Collection</p>
              <h2 className="text-4xl font-light tracking-tight text-black">CREATIVE ARCHIVE ({filteredWorkItems.length})</h2>
            </div>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-black text-white shadow-md' : 'hover:bg-neutral-100'}`}
                  >
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={9} aspect="video" cols={3} />
          ) : filteredWorkItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {filteredWorkItems.slice(0, visibleCreative).map((item) => (
                  <div key={item.id} className="group cursor-pointer relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                    <div className="relative aspect-video overflow-hidden bg-[#0c0c0f]">
                      <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      {/* Centered micro-interaction play button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                        <h3 className="text-white mb-2 text-xl font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredWorkItems.length > visibleCreative && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => setVisibleCreative(prev => prev + 18)}
                    className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all cursor-pointer btn-tactile shadow-lg"
                  >
                    Load More Projects ({filteredWorkItems.length - visibleCreative} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10 rounded-xl">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No horizontal works found.</p>
            </div>
          )}
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Portrait Cinema page
  if (currentPage === 'portrait-cinema') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-black/60 transition-all cursor-pointer btn-tactile">
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to Portfolio</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl shadow-md">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Cinematic Shorts</p>
              <h2 className="text-4xl font-light tracking-tight text-black">VERTICAL ({filteredVerticalVideos.length})</h2>
            </div>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-black text-white shadow-md' : 'hover:bg-neutral-100'}`}>
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={10} aspect="vertical" cols={5} />
          ) : filteredVerticalVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                {filteredVerticalVideos.slice(0, visibleVerticals).map((item) => (
                  <div key={item.id} className="group cursor-pointer w-full relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                    <div className="relative aspect-[9/16] overflow-hidden bg-[#0c0c0f]">
                      <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                        <h3 className="text-white text-lg font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap mt-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredVerticalVideos.length > visibleVerticals && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => setVisibleVerticals(prev => prev + 20)}
                    className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all cursor-pointer btn-tactile shadow-lg"
                  >
                    Load More Verticals ({filteredVerticalVideos.length - visibleVerticals} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10 rounded-xl">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found.</p>
            </div>
          )}
        </div>
        <Footer />
        {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
      </div>
    );
  }

  // Cinematography page
  if (currentPage === 'cinematography') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-black/60 transition-all cursor-pointer btn-tactile">
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to Portfolio</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl shadow-md">K</div>
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Director of Photography</p>
              <h2 className="text-4xl font-light tracking-tight text-black">CINEMATOGRAPHY ({filteredCinematographyWorks.length})</h2>
            </div>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-black text-white shadow-md' : 'hover:bg-neutral-100'}`}
                  >
                    {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ShimmerGrid count={6} aspect="video" cols={3} />
          ) : filteredCinematographyWorks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {filteredCinematographyWorks.slice(0, visibleCinematography).map((item) => (
                  <div key={item.id} className="group cursor-pointer relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                    <div className={`relative ${item.category === 'VERTICAL' ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden bg-[#0c0c0f]`}>
                      <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                        <h3 className="text-white mb-2 text-xl font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredCinematographyWorks.length > visibleCinematography && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => setVisibleCinematography(prev => prev + 18)}
                    className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all cursor-pointer btn-tactile shadow-lg"
                  >
                    Load More Works ({filteredCinematographyWorks.length - visibleCinematography} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10 rounded-xl">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No cinematography works found.</p>
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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
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

      <section id="home" className="relative min-h-screen px-6 lg:px-8 bg-black overflow-hidden flex items-center justify-center pt-28 pb-20">
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

      {/* ─── 01 Recent (Featured Works Carousel) ─── */}
      <section id="works" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between mb-12">
          <h2 className="text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">01</span>
            Recent
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => scroll('left')}
              className="p-3 border border-black rounded-full hover:bg-black hover:text-white hover:scale-110 active:scale-90 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 border border-black rounded-full hover:bg-black hover:text-white hover:scale-110 active:scale-90 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md"
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
              {featuredWorks.map((item) => (
                <div key={item.id} className="group cursor-pointer w-[340px] sm:w-[420px] md:w-[480px] flex-shrink-0 relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                  <div className="relative aspect-video overflow-hidden bg-[#0c0c0f]">
                    <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    {/* Centered micro-interaction play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                      <h3 className="text-white mb-2 text-xl font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                      <div className="flex gap-2 flex-wrap translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {item.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── 02 All Works (Grid with Filter) ─── */}
      <section id="archive" className="py-20 px-6 lg:px-8 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <h2 className="text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
              <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">02</span>
              All
            </h2>
            {loading ? (
              <ShimmerFilters />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)}
                    className={`px-5 py-2.5 border border-black rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer btn-tactile ${activeFilters.includes(filter) ? 'bg-black text-white shadow-md' : 'hover:bg-neutral-100'}`}>
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
                {filteredWorkItems.slice(0, colsCreative * 3).map((item) => (
                  <div key={item.id} className="group cursor-pointer relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                    <div className="relative aspect-video overflow-hidden bg-[#0c0c0f]">
                      <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                        <h3 className="text-white mb-2 text-xl font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredWorkItems.length > colsCreative * 3 && (
                <div className="flex justify-center mt-16">
                  <button onClick={() => { setCurrentPage('creative-archive'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-12 py-5 border border-black text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full cursor-pointer btn-tactile hover:shadow-lg">
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10 rounded-xl">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No horizontal works found for this selection.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 03 Vertical Works ─── */}
      <section id="verticals" className="py-20 px-6 lg:px-8 bg-neutral-50 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">03</span>
            VERTICAL
          </h2>

          {loading ? (
            <ShimmerGrid count={5} aspect="vertical" cols={5} />
          ) : filteredVerticalVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                {filteredVerticalVideos.slice(0, colsPortrait * 2).map((item) => (
                  <div key={item.id} className="group cursor-pointer w-full relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                    <div className="relative aspect-[9/16] overflow-hidden bg-[#0c0c0f]">
                      <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                        <h3 className="text-white text-lg font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap mt-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredVerticalVideos.length > colsPortrait * 2 && (
                <div className="flex justify-center mt-16">
                  <button onClick={() => { setCurrentPage('portrait-cinema'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-12 py-5 border border-black text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full cursor-pointer btn-tactile hover:shadow-lg">
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10 rounded-xl">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 04 Cinematography Works ─── */}
      <section id="cinematography" className="py-20 px-6 lg:px-8 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-2xl font-joyride font-normal tracking-wide text-black uppercase flex items-center gap-4">
            <span className="text-sm px-3.5 py-1 font-bold font-sans bg-black text-white rounded-full">04</span>
            CINEMATOGRAPHY
          </h2>

          {loading ? (
            <ShimmerGrid count={3} aspect="video" cols={3} />
          ) : cinematographyWorks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {cinematographyWorks.slice(0, colsCreative * 3).map((item) => (
                  <div key={item.id} className="group cursor-pointer relative overflow-hidden" onClick={() => setPlayingItem(item)}>
                    <div className={`relative ${item.category === 'VERTICAL' ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden bg-[#0c0c0f]`}>
                      <ImageWithFallback src={item.image} fallbackSrc={item.fallbackSrc} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-xl group-hover:rotate-6">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-400">
                        <h3 className="text-white mb-2 text-xl font-bold translate-y-3 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {cinematographyWorks.length > colsCreative * 3 && (
                <div className="flex justify-center mt-16">
                  <button onClick={() => { setCurrentPage('cinematography'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="px-12 py-5 border border-black text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full cursor-pointer btn-tactile hover:shadow-lg">
                    See More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10 rounded-xl">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No cinematography works found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Marquee component */}
      <Marquee />

      <Footer />

      {playingItem && <VideoModal item={playingItem} onClose={() => setPlayingItem(null)} />}
    </div>
  );
}
