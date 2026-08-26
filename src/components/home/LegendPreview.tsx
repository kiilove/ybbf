import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { legendsData } from '../../data/legends';

gsap.registerPlugin(ScrollTrigger);

export default function LegendPreview() {
  const containerRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take first 5 legends for preview, or duplicate if we don't have enough
  const previewItems = [...legendsData, ...legendsData, ...legendsData].slice(0, 5).map((legend, index) => {
    const layoutConfig = [
      { widthClass: 'md:w-[35%]', aspectClass: 'aspect-[4/5]', posClass: 'md:top-[10%] md:left-[15%]' },
      { widthClass: 'md:w-[22%]', aspectClass: 'aspect-square', posClass: 'md:top-[45%] md:left-[58%]' },
      { widthClass: 'md:w-[15%]', aspectClass: 'aspect-[3/4]', posClass: 'md:top-[60%] md:right-[5%]' },
      { widthClass: 'md:w-[20%]', aspectClass: 'aspect-[3/2]', posClass: 'md:top-[5%] md:right-[15%]' },
      { widthClass: 'md:w-[15%]', aspectClass: 'aspect-[4/5]', posClass: 'md:top-[40%] md:-left-[2%]' },
    ];
    return { ...legend, ...layoutConfig[index] };
  });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.hof-card');
      if (cards.length > 0) {
        gsap.fromTo(cards, 
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 70%',
            }
          }
        );
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 md:py-32 px-6 md:px-16 bg-bg-primary overflow-hidden relative">
      <div className="max-w-[1440px] mx-auto w-full relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted mb-4">명예의 전당</p>
            <h2 className="text-display text-[clamp(48px,6vw,100px)] leading-[0.85] font-black italic uppercase tracking-tighter">
              LEGEND <br />
              COLLECTION
            </h2>
          </div>
          <a href="/legends" className="group flex items-center justify-between gap-4 p-4 px-6 border border-divider hover:border-accent transition-colors w-full md:w-auto cursor-grow rounded-2xl relative z-20 bg-bg-primary">
            <span className="text-xs font-black tracking-widest uppercase group-hover:text-accent">전체보기</span>
            <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-2 transition-transform" />
          </a>
        </div>

        {/* Desktop Canvas / Mobile Grid */}
        <div className="hof-canvas relative md:h-[800px] w-full grid grid-cols-1 gap-8 md:block">
          
          {/* Background SVG for desktop canvas */}
          <div className="hidden md:block absolute inset-0 pointer-events-none text-white/10 z-0" style={{ margin: '-100px' }}>
            <svg className="w-full h-full" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-100,200 Q200,50 400,300 T900,400 T1500,200" stroke="currentColor" strokeWidth="1" />
              <path d="M-50,600 Q300,800 500,500 T1000,200 T1600,500" stroke="currentColor" strokeWidth="1" />
              <path d="M200,-100 Q400,300 700,100 T1200,600 T1400,900" stroke="currentColor" strokeWidth="1" />
              <path d="M800,-50 Q700,400 900,600 T1300,300 T1500,800" stroke="currentColor" strokeWidth="1" />
              <path d="M100,900 Q200,500 600,700 T1300,1000" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          {previewItems.map((item, i) => {
            const isHovered = hoveredIndex === i;
            const isDimmed = hoveredIndex !== null && hoveredIndex !== i;
            
            return (
              <a 
                href={`/legends/${item.id}`}
                key={i} 
                className={`hof-card group flex flex-col gap-2 cursor-grow md:absolute transition-all duration-1000 ease-out w-full
                  ${item.widthClass} ${item.posClass}
                  ${isHovered ? 'z-50 scale-[1.02] md:scale-[1.15]' : 'z-10'}
                  ${isDimmed ? 'opacity-30 blur-sm' : ''}
                `}
                data-cursor-text="OPEN"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex justify-between items-end px-1 -mb-1">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#E5FF00] uppercase drop-shadow-md">{item.nameEn}</p>
                  <p className="text-[10px] font-bold text-white/50 tracking-widest">{item.titles[0]?.year}</p>
                </div>
                <div className={`relative w-full ${item.aspectClass} overflow-hidden bg-bg-secondary rounded-2xl border ${isHovered ? 'border-[#E5FF00]' : 'border-white/10'} transition-colors duration-500 shadow-2xl`}>
                  <img 
                    src={item.profileImage.startsWith('http') ? item.profileImage : `https://picsum.photos/600/800?random=${200+i}`} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none"></div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
