import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { legendsData } from '../data/legends';

export default function LegendsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "레전드 아카이브 | YBBF 용인시보디빌딩협회";
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo(
        '.hero-title',
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.2 }
      );

      // Stats Stagger
      gsap.fromTo(
        '.stat-item',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: {
          trigger: '.stats-section',
          start: 'top 80%',
        }}
      );

      // Cards Reveal
      gsap.fromTo(
        '.legend-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: {
          trigger: '.roster-section',
          start: 'top 80%',
        }}
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="bg-bg-primary min-h-screen text-text-primary pt-20">
      
      {/* SECTION 1: HERO */}
      <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden border-b border-divider">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/1920/1080?random=99" 
            alt="Legends Background" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" />
        </div>
        
        <div className="relative z-10 w-full px-4 md:px-8 max-w-[1440px] mx-auto flex flex-col items-center">
          <p className="font-mono text-[10px] md:text-xs tracking-[0.3em] text-accent mb-4">SINCE 1990</p>
          <h1 className="hero-title text-display text-[clamp(60px,15vw,200px)] leading-[0.8] font-black italic uppercase tracking-tighter text-transparent"
              style={{ WebkitTextStroke: '2px rgba(255,255,255,0.9)' }}>
            LEGENDS
          </h1>
          <p className="mt-8 font-sans text-sm md:text-base text-text-muted max-w-lg text-center">
            수십 년간 이어진 무대 위 땀과 영광의 기록. 용인시를 대표하는 역대 챔피언들의 명예의 전당.
          </p>
        </div>
      </section>

      {/* SECTION 2: GIANT STATS */}
      <section className="stats-section px-4 md:px-8 py-16 md:py-32 max-w-[1440px] mx-auto border-b border-divider">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center md:text-left">
          <div className="stat-item relative">
            <h2 className="text-display text-[clamp(80px,8vw,120px)] leading-none font-black italic text-transparent"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>
              47
            </h2>
            <p className="font-sans font-bold tracking-widest uppercase mt-4">Total Champions</p>
            <span className="absolute -top-4 -right-4 text-accent font-display text-xl -rotate-12 italic">역대 우승자</span>
          </div>
          <div className="stat-item relative">
            <h2 className="text-display text-[clamp(80px,8vw,120px)] leading-none font-black italic text-transparent"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>
              12
            </h2>
            <p className="font-sans font-bold tracking-widest uppercase mt-4">Weight Classes</p>
          </div>
          <div className="stat-item relative">
            <h2 className="text-display text-[clamp(80px,8vw,120px)] leading-none font-black italic text-transparent"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>
              35
            </h2>
            <p className="font-sans font-bold tracking-widest uppercase mt-4">Years of Legacy</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: ROSTER GRID */}
      <section className="roster-section px-4 md:px-8 py-16 md:py-24 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <h2 className="text-display text-4xl md:text-6xl font-black italic uppercase">The Collection</h2>
          
          {/* Simple Filter */}
          <div className="flex gap-4 border-b border-white/20 pb-2 overflow-x-auto w-full md:w-auto hide-scrollbar">
            <button className="text-xs font-bold tracking-widest uppercase text-accent whitespace-nowrap">전체</button>
            <button className="text-xs font-bold tracking-widest uppercase text-text-muted hover:text-white transition-colors whitespace-nowrap">보디빌딩</button>
            <button className="text-xs font-bold tracking-widest uppercase text-text-muted hover:text-white transition-colors whitespace-nowrap">클래식 피지크</button>
            <button className="text-xs font-bold tracking-widest uppercase text-text-muted hover:text-white transition-colors whitespace-nowrap">스포츠 모델</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {legendsData.map((legend, index) => (
            <a 
              key={legend.id} 
              href={`/legends/${legend.id}`}
              className="legend-card group relative block overflow-hidden bg-bg-secondary aspect-[3/4] rounded-2xl"
            >
              {/* Image */}
              <img 
                src={legend.profileImage.startsWith('http') ? legend.profileImage : `https://picsum.photos/600/800?random=${100+index}`} 
                alt={legend.name}
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
                loading="lazy"
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end">
                <p className="font-mono text-[10px] tracking-[0.2em] text-accent mb-2 uppercase">{legend.class}</p>
                <h3 className="text-display text-4xl md:text-5xl font-black italic uppercase leading-none group-hover:text-white transition-colors">
                  {legend.nameEn}
                </h3>
                <p className="font-sans font-bold text-lg mt-2">{legend.name}</p>
                
                {/* Hidden Meta that appears on hover */}
                <div className="overflow-hidden h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-300 mt-4 border-t border-white/20 pt-4">
                  <p className="text-xs text-text-muted uppercase tracking-widest">{legend.titles[0]?.competition}</p>
                  <p className="text-accent text-sm font-bold mt-1">{legend.titles[0]?.result}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
