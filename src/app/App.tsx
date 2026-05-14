import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Marquee } from './components/Marquee';

interface WorkItem {
  id: number;
  image: string;
  title: string;
  tags: string[];
  category: string;
  featured: boolean;
  videoLink: string;
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

            const rawImageUrl = getVal('image_thumbnail_link');
            let imageUrl = rawImageUrl || `https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1080`;
            
            if (imageUrl.includes('drive.google.com')) {
              const fileId = imageUrl.match(/\/file\/d\/([^/?]+)/)?.[1] || imageUrl.match(/id=([^&?]+)/)?.[1];
              if (fileId) {
                // Using the thumbnail endpoint is often more reliable for direct embeds
                imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
              }
            }

            const featuredVal = getVal('Featured').toUpperCase();
            const isFeatured = featuredVal === 'TRUE' || featuredVal === 'YES' || featuredVal === 'Y' || featuredVal === '1';

            return {
              id: index + 1,
              title: getVal('title'),
              videoLink: getVal('video_link'),
              image: imageUrl,
              tags: getVal('tags').split(',').map(t => t.trim().toLowerCase()).filter(t => t),
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

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="#" className="group flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center transition-all group-hover:bg-white">
                  <span className="font-bold text-white group-hover:text-black transition-colors">K</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-wide text-black">KSHITIJ RATHORE</span>
                <span className="text-xs tracking-widest text-black/60 uppercase">Visual Artist</span>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-8 lg:gap-12">
              <a href="#works" className="relative group py-2">
                <span className="text-black font-medium">Works</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </a>
              <a href="#about" className="relative group py-2">
                <span className="text-black font-medium">About</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </a>
              <a href="#contact" className="relative group py-2">
                <span className="text-black font-medium">Contact</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </a>
              <a href="#contact" className="px-6 py-2.5 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-all duration-300">
                Let's Talk
              </a>
            </div>
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <section className="relative pt-48 pb-32 px-6 lg:px-8 bg-white overflow-hidden">
        {/* Architectural Background Marker */}
        <div className="absolute top-20 -right-12 text-[20rem] font-bold text-neutral-100/80 pointer-events-none select-none tracking-tighter leading-none">
          KR
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
            <div className="space-y-8">
              <p className="uppercase tracking-[0.4em] text-[10px] font-bold text-black/60 flex items-center gap-4">
                <span className="w-12 h-[1px] bg-black/30"></span>
                Editor · Colorist · Motion · DOP
              </p>
              <div className="space-y-2">
                <h1 className="text-7xl md:text-[11rem] font-bold tracking-tighter leading-[0.8] text-black">
                  KSHITIJ
                </h1>
                <h1 className="text-7xl md:text-[11rem] font-bold tracking-tighter leading-[0.8] text-neutral-400">
                  RATHORE
                </h1>
              </div>
            </div>

            <div className="max-w-md space-y-12">
              <p className="text-xl md:text-2xl font-light text-black/80 leading-tight tracking-tight">
                Mumbai-based creative crafting visual stories for the <span className="text-black font-medium border-b-2 border-black/10">biggest names</span> in Indian and global entertainment.
              </p>
              <div className="flex flex-wrap gap-6">
                <a 
                  href="#works" 
                  className="group relative px-10 py-5 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:pr-14"
                >
                  <span className="relative z-10">Explore Works</span>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">→</span>
                </a>
                <a 
                  href="#contact" 
                  className="px-10 py-5 border border-black/10 text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-neutral-50 transition-all duration-300"
                >
                  Get in touch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />


      <section id="works" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between mb-12">
          <h2 className="text-3xl font-light tracking-tight text-black flex items-center gap-4">
            <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">01</span>
            SELECTED WORKS
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

      <section className="py-20 px-6 lg:px-8 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <h2 className="text-3xl font-light tracking-tight text-black flex items-center gap-4">
              <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">02</span>
              CREATIVE ARCHIVE
            </h2>
            <div className="flex gap-3 flex-wrap">
              {['all', 'editor', 'colorist', 'motion', 'dop'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-5 py-2.5 border border-black text-xs font-bold uppercase tracking-widest transition-all ${
                    activeFilters.includes(filter) ? 'bg-black text-white' : 'hover:bg-neutral-100'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'dop' ? 'DOP' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredWorkItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-black/10">
              {filteredWorkItems.map((item) => (
                <div 
                  key={item.id} 
                  className="group cursor-pointer border-r border-b border-black/10"
                  onClick={() => setPlayingItem(item)}
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-200">
                    <ImageWithFallback
                      src={item.image}
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
      </section>

      <section className="py-20 px-6 lg:px-8 bg-neutral-50 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-12 text-3xl font-light tracking-tight text-black flex items-center gap-4">
            <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">03</span>
            PORTRAIT CINEMA
          </h2>
          
          {filteredVerticalVideos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 border-l border-t border-black/10">
              {filteredVerticalVideos.map((item) => (
                <div 
                  key={item.id} 
                  className="group cursor-pointer w-full border-r border-b border-black/10"
                  onClick={() => setPlayingItem(item)}
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-neutral-200">
                    <ImageWithFallback
                      src={item.image}
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
              <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold">No vertical works found for this selection.</p>
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

      <section id="about" className="py-32 px-6 lg:px-8 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="space-y-12">
              <h2 className="text-3xl font-light tracking-tight text-black flex items-center gap-4">
                <span className="text-[10px] leading-none font-bold p-1.5 bg-black text-white">04</span>
                ABOUT
              </h2>
              <p className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] text-black">
                Mumbai-based creative with a sharp eye for storytelling through <span className="italic">motion</span> and <span className="italic font-medium bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500 bg-clip-text text-transparent">color</span>.
              </p>
            </div>
            <div className="flex flex-col justify-end space-y-10">
              <p className="text-xl text-black/70 leading-relaxed max-w-xl">
                Specialising in high-impact promos, brand films, and social content for OTT platforms, Bollywood productions, and global brands. With over a decade of experience, I bring a unique blend of technical expertise and creative vision to every project.
              </p>
              <div className="flex flex-wrap gap-4">
                {['OTT Promos', 'Bollywood', 'Brand Films', 'Color Grading', 'Motion Graphics', 'Cinematography'].map((skill) => (
                  <span key={skill} className="px-5 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-neutral-800 cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="py-16 px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-8 text-white">Get In Touch</h2>
            <div className="space-y-3">
              <p>
                <a href="mailto:hello@kshitijrathore.com" className="hover:opacity-70 transition-opacity">
                  hello@kshitijrathore.com
                </a>
              </p>
              <p>
                <a href="tel:+919876543210" className="hover:opacity-70 transition-opacity">
                  +91 98765 43210
                </a>
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-8 flex-wrap">
            <a href="#" className="hover:opacity-70 transition-opacity">Instagram</a>
            <a href="#" className="hover:opacity-70 transition-opacity">LinkedIn</a>
            <a href="#" className="hover:opacity-70 transition-opacity">WhatsApp</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Twitter</a>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 text-center opacity-60">
            <p>&copy; 2026 Kshitij Rathore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}