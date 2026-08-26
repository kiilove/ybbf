import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

// Using simple string as logo placeholder for now OR icons
const partnerLogos = [
  'POWERHOUSE', 'NUTRITION X', 'MUSCLE GEAR', 'GENETICS', 'YONGIN CITY', 'GYM SHARK',
  'POWERHOUSE', 'NUTRITION X', 'MUSCLE GEAR', 'GENETICS', 'YONGIN CITY', 'GYM SHARK' // Repeated for infinite scroll
];

export default function Partners() {
  // CSS based infinite scroll used via className
  return (
    <section className="py-24 md:py-32 bg-bg-primary border-t border-b border-divider overflow-hidden">
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted mb-4">스폰서 & 파트너</p>
          <h2 className="text-display text-[clamp(40px,5vw,80px)] leading-[0.85] font-black italic uppercase tracking-tighter">
            파트너 & <br />
            캠페인
          </h2>
        </div>
        <a href="#" className="group flex items-center justify-between gap-4 p-4 hover:text-accent transition-colors cursor-grow">
          <span className="text-xs font-black tracking-widest uppercase border-b border-transparent group-hover:border-accent">파트너십 보기</span>
          <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-2 transition-transform" />
        </a>
      </div>

      {/* Marquee Track 1 (Left) */}
      <div className="relative w-full flex bg-bg-card py-12 border-y border-divider overflow-hidden group">
        <style>{`
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .marquee-track-l { animation: marquee-left 30s linear infinite; }
          .marquee-track-r { animation: marquee-right 30s linear infinite; }
          .group:hover .marquee-track-l, .group:hover .marquee-track-r { animation-play-state: paused; }
        `}</style>
        
        <div className="marquee-track-l flex gap-16 md:gap-32 w-max px-8">
          {partnerLogos.map((logo, i) => (
            <div key={i} className="flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:text-accent transition-all duration-300">
              <span className="text-3xl md:text-5xl font-display font-bold">{logo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Track 2 (Right) */}
      <div className="relative w-full flex bg-bg-card py-12 border-b border-divider overflow-hidden group">
         <div className="marquee-track-r flex gap-16 md:gap-32 w-max px-8">
          {partnerLogos.map((logo, i) => (
            <div key={i} className="flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:text-accent transition-all duration-300">
              <span className="text-3xl md:text-5xl font-display font-bold">{logo}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
