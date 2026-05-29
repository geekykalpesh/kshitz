import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Menu } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Marquee } from './components/Marquee';

import { motion } from 'motion/react';

interface WorkItem {
  id: number;
  image: string;
  fallbackSrc?: string[];
  title: string;
  tags: string[];
  category: string;
  featured: boolean;
  videoLink: string;
}

function Footer() {
  return (
    <footer id="contact" className="py-16 px-6 lg:px-8 bg-black text-white w-full border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-8 text-white text-3xl font-light tracking-tight">Get In Touch</h2>
          <div className="space-y-3 text-lg font-light">
            <p>
              <a href="mailto:kshitizfx@gmail.com" className="hover:opacity-70 transition-opacity">
                kshitizfx@gmail.com
              </a>
            </p>
            <p>
              <a href="tel:+919039735357" className="hover:opacity-70 transition-opacity">
                +91 90397 35357
              </a>
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-8 flex-wrap text-sm uppercase tracking-wider opacity-80">
          <a href="https://www.instagram.com/kshitizfx/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">Instagram</a>
          <a href="https://www.linkedin.com/in/kshitizfx/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">LinkedIn</a>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center opacity-40 text-xs">
          <p>&copy; 2026 Kshitij Rathore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [data, setData] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [playingItem, setPlayingItem] = useState<WorkItem | null>(null);

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
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/file\/d\/([^/?]+)/)?.[1] || url.match(/id=([^&?]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://docs.google.com/spreadsheets/d/16LKMnCnu60F6HM4yw9FcWJcL2ujGQ8RisqL0RofxfI4/export?format=csv&t=${Date.now()}`);
        const csvText = await response.text();

        const lines = csvText.split(/\r?\n/).filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        const parsedData: WorkItem[] = lines.slice(1)
          .map((line, index) => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') inQuotes = !inQuotes;
              else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else current += char;
            }
            values.push(current.trim());

            const getVal = (headerName: string) => {
              const idx = headers.indexOf(headerName);
              if (idx === -1) return '';
              return values[idx]?.replace(/^"|"$/g, '').trim() || '';
            };

            const videoLink = getVal('video_link');
            const rawImageUrl = getVal('image_thumbnail_link');

            // 1. Detect if it's a YouTube video and extract the ID
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

            // 2. Setup fallbacks list
            const fallbacks: string[] = [];
            if (youtubeId) {
              fallbacks.push(`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`);
              fallbacks.push(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
            } else if (videoLink.includes('instagram.com')) {
              // Instagram/Reel aesthetic high-contrast camera lens placeholder
              fallbacks.push('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1080');
            } else if (videoLink.includes('drive.google.com')) {
              const fileId = videoLink.match(/\/file\/d\/([^/?]+)/)?.[1] || videoLink.match(/id=([^&?]+)/)?.[1];
              if (fileId) {
                fallbacks.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
              }
            }
            // General movie slate as final fallback
            fallbacks.push('https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1080');

            // 3. Determine the primary imageUrl
            let imageUrl = rawImageUrl;

            // If primary is empty, use the first fallback from our list
            if (!imageUrl) {
              imageUrl = fallbacks[0];
            } else if (imageUrl.includes('drive.google.com')) {
              const fileId = imageUrl.match(/\/file\/d\/([^/?]+)/)?.[1] || imageUrl.match(/id=([^&?]+)/)?.[1];
              if (fileId) {
                imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
              }
            }

            const featuredVal = getVal('Featured').toUpperCase();
            const isFeatured = featuredVal === 'TRUE' || featuredVal === 'YES' || featuredVal === 'Y' || featuredVal === '1';

            return {
              id: index + 1,
              title: getVal('title'),
              videoLink: videoLink,
              image: imageUrl,
              fallbackSrc: fallbacks,
              tags: getVal('tags').split(',').map(t => {
                const cleaned = t.trim().toLowerCase();
                return cleaned === 'cinematography' ? 'dop' : cleaned;
              }).filter(t => t),
              category: getVal('category').toUpperCase(),
              featured: isFeatured
            };
          });

        setData(parsedData);
      } catch (error) {
        console.error('Error fetching spreadsheet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'creative-archive' | 'portrait-cinema' | 'cinematography'>('home');
  const [colsCreative, setColsCreative] = useState(3);
  const [colsPortrait, setColsPortrait] = useState(5);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      // Creative Archive Columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
      if (w >= 1024) setColsCreative(3);
      else if (w >= 768) setColsCreative(2);
      else setColsCreative(1);

      // Portrait Cinema Columns (grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5)
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
      const scrollAmount = 500;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
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

  if (currentPage === 'creative-archive') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        {/* Navigation */}
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
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore</h1>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Creative Collection</p>
              <h2 className="text-4xl font-light tracking-tight text-black">
                CREATIVE ARCHIVE ({filteredWorkItems.length})
              </h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'
                    }`}
                >
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredWorkItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
              {filteredWorkItems.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => setPlayingItem(item)}
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-200">
                    <ImageWithFallback
                      src={item.image}
                      fallbackSrc={item.fallbackSrc}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <h3 className="text-white mb-2 text-xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                      <div className="flex gap-2 flex-wrap translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {item.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No horizontal works found for this selection.</p>
            </div>
          )}

        </div>
        <Footer />

        {/* Video Modal */}
        {playingItem && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
            onClick={() => setPlayingItem(null)}
          >
            <div
              className={`relative w-full ${playingItem.category === 'VERTICAL' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-6xl aspect-video'} bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-500`}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPlayingItem(null)}
                className="absolute -top-12 right-0 md:-right-14 md:top-0 text-white/70 hover:text-white transition-colors flex items-center justify-center bg-black/40 p-2 rounded-full backdrop-blur-md cursor-pointer"
                aria-label="Close"
              >
                <X size={28} />
              </button>
              <iframe
                src={getEmbedUrl(playingItem.videoLink)}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentPage === 'portrait-cinema') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        {/* Navigation */}
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
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore</h1>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Cinematic Shorts</p>
              <h2 className="text-4xl font-light tracking-tight text-black">
                VERTICAL ({filteredVerticalVideos.length})
              </h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'
                    }`}
                >
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredVerticalVideos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
              {filteredVerticalVideos.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer w-full"
                  onClick={() => setPlayingItem(item)}
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-neutral-200">
                    <ImageWithFallback
                      src={item.image}
                      fallbackSrc={item.fallbackSrc}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <h3 className="text-white text-lg font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                      <div className="flex gap-2 flex-wrap mt-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {item.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found.</p>
            </div>
          )}

        </div>
        <Footer />

        {/* Video Modal */}
        {playingItem && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
            onClick={() => setPlayingItem(null)}
          >
            <div
              className={`relative w-full ${playingItem.category === 'VERTICAL' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-6xl aspect-video'} bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-500`}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPlayingItem(null)}
                className="absolute -top-12 right-0 md:-right-14 md:top-0 text-white/70 hover:text-white transition-colors flex items-center justify-center bg-black/40 p-2 rounded-full backdrop-blur-md cursor-pointer"
                aria-label="Close"
              >
                <X size={28} />
              </button>
              <iframe
                src={getEmbedUrl(playingItem.videoLink)}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentPage === 'cinematography') {
    return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white animate-in fade-in duration-300">
        {/* Navigation */}
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
              <h1 className="text-sm font-bold tracking-widest uppercase hidden sm:block">Kshitij Rathore</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Cinematic Collection</p>
              <h2 className="text-4xl font-light tracking-tight text-black">
                CINEMATOGRAPHY ({filteredCinematographyWorks.length})
              </h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'
                    }`}
                >
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredCinematographyWorks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
              {filteredCinematographyWorks.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => setPlayingItem(item)}
                >
                  <div className={`relative ${item.category === 'VERTICAL' ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden bg-neutral-200`}>
                    <ImageWithFallback
                      src={item.image}
                      fallbackSrc={item.fallbackSrc}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <h3 className="text-white mb-2 text-xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                      <div className="flex gap-2 flex-wrap translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {item.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/10">
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No cinematography works found for this selection.</p>
            </div>
          )}

        </div>
        <Footer />

        {/* Video Modal */}
        {playingItem && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
            onClick={() => setPlayingItem(null)}
          >
            <div
              className={`relative w-full ${playingItem.category === 'VERTICAL' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-6xl aspect-video'} bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-500`}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPlayingItem(null)}
                className="absolute -top-12 right-0 md:-right-14 md:top-0 text-white/70 hover:text-white transition-colors flex items-center justify-center bg-black/40 p-2 rounded-full backdrop-blur-md cursor-pointer"
                aria-label="Close"
              >
                <X size={28} />
              </button>
              <iframe
                src={getEmbedUrl(playingItem.videoLink)}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-black/5 py-0 shadow-sm'
        : 'bg-transparent border-b border-white/0 py-2'
        }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center font-bold text-xl transition-all duration-300 ${scrolled ? 'bg-black text-white' : 'bg-white text-black shadow-md'
              }`}>K</div>
            <div>
              <h1 className={`text-sm font-bold tracking-widest leading-none uppercase transition-colors duration-300 ${scrolled ? 'text-black' : 'text-white'
                }`}>Kshitij Rathore</h1>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${scrolled ? 'text-black hover:text-black/60' : 'text-white hover:text-white/60'
                }`}
            >
              Home
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('about');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${scrolled ? 'text-black hover:text-black/60' : 'text-white hover:text-white/60'
                }`}
            >
              About
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${scrolled ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200 shadow-md'
                }`}
            >
              Let's Talk
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 transition-colors duration-300 ${scrolled ? 'text-black' : 'text-white'
              }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-20 bg-white z-40 flex flex-col p-6 space-y-6 h-screen">
            <a
              href="#home"
              className="text-2xl font-light uppercase tracking-widest border-b border-black/5 pb-3 text-black"
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </a>
            <a
              href="#about"
              className="text-2xl font-light uppercase tracking-widest border-b border-black/5 pb-3 text-black"
              onClick={() => {
                setIsMenuOpen(false);
                setTimeout(() => {
                  const el = document.getElementById('about');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              About
            </a>
            <a
              href="#contact"
              className="w-full py-4 bg-black text-white text-center text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              onClick={() => {
                setIsMenuOpen(false);
                setTimeout(() => {
                  const el = document.getElementById('contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              Let's Talk
            </a>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen px-6 lg:px-8 bg-black overflow-hidden flex items-center justify-center pt-28 pb-20">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        >
          <source src="https://res.cloudinary.com/dvbarr6ni/video/upload/v1780090126/hero-bg_jxvbup.mp4" type="video/mp4" />
        </video>

        {/* Cinematic dark overlay to make text and buttons pop beautifully */}
        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-20 flex flex-col items-center text-center">
          <div className="space-y-12 w-full">
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={{ opacity: 0.6, letterSpacing: "0.4em" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="uppercase tracking-[0.4em] text-[10px] font-bold text-white flex items-center justify-center gap-6"
            >
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-[1px] bg-white/20"
              ></motion.span>
              DOP . Editor . Colorist
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-[1px] bg-white/20"
              ></motion.span>
            </motion.p>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="flex overflow-hidden pb-2">
                  {"KSHITIJ".split("").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, filter: "blur(10px)", y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.05,
                        ease: [0.2, 0.65, 0.3, 0.9]
                      }}
                      className="text-6xl md:text-[8rem] font-bold tracking-tighter leading-none text-white inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
                <div className="flex overflow-hidden">
                  {"RATHORE".split("").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, filter: "blur(10px)", y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.3 + i * 0.05,
                        ease: [0.2, 0.65, 0.3, 0.9]
                      }}
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
              className="max-w-3xl mx-auto space-y-12"
            >
              <motion.p
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-xl md:text-3xl font-light text-white/90 leading-tight tracking-tight px-4"
              >
                I shoot stories, shape rhythms, and paint with color. <br className="hidden md:block" />
                The rest is just export settings.
              </motion.p>

              <div className="flex flex-wrap items-center justify-center gap-6">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="#works"
                  className="group relative px-12 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:pr-16"
                >
                  <span className="relative z-10">Explore Works</span>
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">→</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  href="#contact"
                  className="px-12 py-5 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all duration-300"
                >
                  Get in touch
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      <section id="works" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between mb-12">
          <h2 className="text-3xl font-light tracking-tight text-black flex items-center gap-4">
            <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">01</span>
            Recent
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => scroll('left')}
              className="p-3 border border-black hover:bg-black hover:text-white transition-all duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 border border-black hover:bg-black hover:text-white transition-all duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex gap-0 min-w-max">
            {featuredWorks.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer w-[480px] flex-shrink-0"
                onClick={() => setPlayingItem(item)}
              >
                <div className="relative aspect-video overflow-hidden bg-neutral-200">
                  <ImageWithFallback
                    src={item.image}
                    fallbackSrc={item.fallbackSrc}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <h3 className="text-white mb-2 text-xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                    <div className="flex gap-2 flex-wrap translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
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
      </section>

      <section id="archive" className="py-20 px-6 lg:px-8 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <h2 className="text-3xl font-light tracking-tight text-black flex items-center gap-4">
              <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">02</span>
              All
            </h2>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black text-xs font-bold uppercase tracking-widest transition-all ${activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'
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
                {filteredWorkItems.slice(0, colsCreative * 3).map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer"
                    onClick={() => setPlayingItem(item)}
                  >
                    <div className="relative aspect-video overflow-hidden bg-neutral-200">
                      <ImageWithFallback
                        src={item.image}
                        fallbackSrc={item.fallbackSrc}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <h3 className="text-white mb-2 text-xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
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

      <section id="verticals" className="py-20 px-6 lg:px-8 bg-neutral-50 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-3xl font-light tracking-tight text-black flex items-center gap-4">
            <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">03</span>
            VERTICAL
          </h2>

          {filteredVerticalVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                {filteredVerticalVideos.slice(0, colsPortrait * 2).map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer w-full"
                    onClick={() => setPlayingItem(item)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden bg-neutral-200">
                      <ImageWithFallback
                        src={item.image}
                        fallbackSrc={item.fallbackSrc}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <h3 className="text-white text-lg font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap mt-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
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
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found for this selection.</p>
            </div>
          )}
        </div>
      </section>

      <section id="cinematography" className="py-20 px-6 lg:px-8 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-3xl font-light tracking-tight text-black flex items-center gap-4">
            <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">04</span>
            CINEMATOGRAPHY
          </h2>

          {cinematographyWorks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {cinematographyWorks.slice(0, colsCreative * 3).map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer"
                    onClick={() => setPlayingItem(item)}
                  >
                    <div className={`relative ${item.category === 'VERTICAL' ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden bg-neutral-200`}>
                      <ImageWithFallback
                        src={item.image}
                        fallbackSrc={item.fallbackSrc}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <h3 className="text-white mb-2 text-xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                        <div className="flex gap-2 flex-wrap translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
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

      {/* Video Modal */}
      {playingItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setPlayingItem(null)}
        >
          <div
            className={`relative w-full ${playingItem.category === 'VERTICAL' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-6xl aspect-video'} bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-500`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPlayingItem(null)}
              className="absolute -top-12 right-0 md:-right-14 md:top-0 text-white/70 hover:text-white transition-colors flex items-center justify-center bg-black/40 p-2 rounded-full backdrop-blur-md"
              aria-label="Close"
            >
              <X size={28} />
            </button>
            <iframe
              src={getEmbedUrl(playingItem.videoLink)}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <Marquee />

      <section id="about" className="py-32 px-6 lg:px-8 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="space-y-12">
              <h2 className="text-3xl font-light tracking-tight text-black flex items-center gap-4">
                <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">05</span>
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
    </div>
  );
}