import AtherLogo from '../../assets/brand_logos/Ather-logo-black.svg';
import DisneyLogo from '../../assets/brand_logos/Disney+_Hotstar_Logo_0.svg';
import JioCinemaLogo from '../../assets/brand_logos/JioCinema_Logo_1.png';
import AmazonLogo from '../../assets/brand_logos/amazon-prime-video-1.svg';
import BoldCareLogo from '../../assets/brand_logos/bold_care.png';
import BumbleLogo from '../../assets/brand_logos/bumble-1.svg';
import InfinixLogo from '../../assets/brand_logos/infinix-1.svg';
import NetflixLogo from '../../assets/brand_logos/netflix-3.svg';
import YoutubeLogo from '../../assets/brand_logos/new-youtube-logo.svg';
import JioLogo from '../../assets/brand_logos/reliance-jio-logo-1.svg';
import WikimediaLogo from '../../assets/brand_logos/wikimedia.svg';

export function Marquee() {
  const logos = [
    { src: AmazonLogo, alt: "Amazon Prime" },
    { src: NetflixLogo, alt: "Netflix" },
    { src: DisneyLogo, alt: "Disney+ Hotstar" },
    { src: JioCinemaLogo, alt: "Jio Cinema" },
    { src: YoutubeLogo, alt: "YouTube" },
    { src: BumbleLogo, alt: "Bumble" },
    { src: BoldCareLogo, alt: "Bold Care" },
    { src: AtherLogo, alt: "Ather" },
    { src: InfinixLogo, alt: "Infinix" },
    { src: JioLogo, alt: "Reliance Jio" },
    { src: WikimediaLogo, alt: "WikiMedia" }
  ];

  return (
    <div className="relative overflow-hidden bg-white py-6 md:py-8 border-y border-black/5 flex flex-col justify-center">
      <div className="mb-4 text-center">
        <h3 className="text-sm font-bold tracking-widest uppercase text-black/60">Selected Clients & Collaborations</h3>
      </div>
      
      <div className="relative flex overflow-hidden py-0">
        {/* First group */}
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {logos.map((logo, index) => (
            <div
              key={`first-${index}`}
              className="mx-12 flex items-center justify-center group"
            >
              <img 
                src={logo.src} 
                alt={logo.alt} 
                className="h-16 md:h-24 w-auto object-contain opacity-100 transition-all duration-500 group-hover:scale-110"
                style={{ minWidth: '150px' }}
              />
            </div>
          ))}
        </div>
        
        {/* Second group for seamless loop */}
        <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap items-center h-full">
          {logos.map((logo, index) => (
            <div
              key={`second-${index}`}
              className="mx-12 flex items-center justify-center group"
            >
              <img 
                src={logo.src} 
                alt={logo.alt} 
                className="h-16 md:h-24 w-auto object-contain opacity-100 transition-all duration-500 group-hover:scale-110"
                style={{ minWidth: '150px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient Overlays for smooth edges */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes marquee2 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0%); }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        .animate-marquee2 {
          animation: marquee2 30s linear infinite;
        }

        .relative:hover .animate-marquee,
        .relative:hover .animate-marquee2 {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
