import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { legendsData } from '../data/legends';
import LegendWebGLHero from '../components/home/LegendWebGLHero';

gsap.registerPlugin(ScrollTrigger);

export default function LegendDetailPage() {
  const { id } = useParams();
  const legend = legendsData.find(l => l.id === id) || legendsData[0];
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hero Animation Refs
  const champTextRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${legend.name} 선수 프로필 | YBBF 레전드`;

    const ctx = gsap.context(() => {
      /* ═══ 1. Hero 등장 애니메이션 (스크롤 X, 로드 시 바로) ═══ */
      const heroTl = gsap.timeline({ delay: 0.2 });

      // 거대 타이포 등장
      heroTl.fromTo(champTextRef.current,
        { scale: 1.1, opacity: 0, filter: 'blur(10px)' },
        { scale: 1, opacity: 0.15, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out' },
        0
      );

      // 프로필 컨테이너 등장
      heroTl.fromTo(profileContainerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5 },
        0.5
      );

      // 스탯들 순차 등장
      statRefs.current.forEach((stat, i) => {
        if (!stat) return;
        heroTl.fromTo(stat,
          { y: 30, opacity: 0, clipPath: 'inset(100% -20% -20% -20%)' },
          { y: 0, opacity: 1, clipPath: 'inset(-20% -20% -20% -20%)', duration: 0.8, ease: 'power3.out' },
          0.6 + i * 0.1
        );
      });

      /* ═══ 1-1. Hero 패럴랙스 (스크롤 시 위로 이동) ═══ */
      gsap.to(champTextRef.current, {
        y: -150,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });

      /* ═══ 2. 에디토리얼 텍스트 애니메이션 ═══ */
      gsap.fromTo(
        '.bio-text span',
        { y: 50, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.editorial-section', start: 'top 70%' }
        }
      );

      /* ═══ 3. Table / Gallery 애니메이션 ═══ */
      gsap.fromTo(
        '.table-row-anim',
        { y: 20, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.table-section', start: 'top 80%' }
        }
      );
      
      gsap.fromTo(
        '.gallery-item',
        { y: 50, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '.gallery-section', start: 'top 70%' }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [id]);

  const heroImg = legend.profileImage.startsWith('/') || legend.profileImage.startsWith('http') 
    ? legend.profileImage 
    : `https://picsum.photos/800/1200?random=cutout_${id}`;

  return (
    <div ref={containerRef} className="bg-bg-primary min-h-screen text-text-primary">
      
      {/* SECTION 1: HERO (WebGL + Broadcast Stats) */}
      <section className="hero-section relative h-screen overflow-hidden"
        style={{
          '--hero-text': '#ffffff',
          '--hero-muted': 'rgba(255,255,255,0.6)',
          '--hero-border': 'rgba(255,255,255,0.1)',
          color: 'var(--hero-text)'
        } as React.CSSProperties}
      >
        {/* LAYER 0: WebGL */}
        <LegendWebGLHero imageUrl={heroImg} />

        {/* BACK BUTTON */}
        <div className="absolute top-24 left-6 md:left-16 z-50">
          <a href="/legends" className="pointer-events-auto inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:text-accent transition-colors">
            ← BACK TO LEGENDS
          </a>
        </div>

        {/* LAYER 1: Giant Typography */}
        <div
          ref={champTextRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0"
          style={{ zIndex: 5 }}
        >
          <p className="text-[clamp(100px,25vw,500px)] font-display font-black italic uppercase tracking-widest text-[var(--hero-text)] whitespace-nowrap mix-blend-overlay select-none">
            {legend.name}
          </p>
        </div>

        {/* LAYER 2: Broadcast Stats */}
        <div
          ref={profileContainerRef}
          className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-10 px-6 md:px-16 invisible"
          style={{ zIndex: 20 }}
        >
          <div className="w-full max-w-[1440px] mx-auto">
            {/* 선수 이름 + 뱃지 */}
            <div ref={el => { statRefs.current[0] = el; }} className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_12px_rgba(204,255,0,0.4)]" />
                <p className="text-[var(--hero-text)] font-mono font-bold tracking-[0.35em] text-[10px] md:text-xs uppercase">
                  YBBF LEGEND PROFILE
                </p>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black italic uppercase tracking-tight text-[var(--hero-text)] leading-[0.88] drop-shadow-lg">
                {legend.nameEn.split(' ')[0]} <span className="text-accent">{legend.nameEn.split(' ')[1] || ''}</span>
              </h2>
            </div>

            {/* 스탯 가로 배치 */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5 md:gap-12">
              <div ref={el => { statRefs.current[1] = el; }}>
                <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Class</p>
                <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)] tracking-wider drop-shadow-md">
                  {legend.class}
                </p>
              </div>

              <div ref={el => { statRefs.current[2] = el; }} className="flex gap-6">
                <div>
                  <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Height</p>
                  <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)] drop-shadow-md">
                    {legend.height}<span className="text-sm text-accent ml-0.5">CM</span>
                  </p>
                </div>
                <div>
                  <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Weight</p>
                  <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)] drop-shadow-md">
                    {legend.weight}<span className="text-sm text-accent ml-0.5">KG</span>
                  </p>
                </div>
              </div>

              <div ref={el => { statRefs.current[3] = el; }} className="flex-1 min-w-[180px] max-w-xs">
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-accent font-mono tracking-[0.3em] text-[9px] uppercase font-bold">Club</p>
                  <p className="text-[var(--hero-text)] font-display font-black italic text-lg drop-shadow-md">{legend.club}</p>
                </div>
                <div className="h-1 w-full bg-[var(--hero-border)] overflow-hidden">
                  <div className="h-full bg-accent relative" style={{ width: '100%' }}>
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.7)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
                  </div>
                </div>
              </div>
            </div>

            {/* 수상 이력 */}
            <div ref={el => { statRefs.current[4] = el; }} className="mt-5 pt-3 border-t border-[var(--hero-border)]">
              <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Titles</p>
              <p className="text-base md:text-xl font-display italic text-[var(--hero-text)] tracking-wide drop-shadow-md">
                {legend.titles.map(t => `${t.year} ${t.competition} ${t.result}`).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Meta Data (if needed) */}
      <section className="md:hidden grid grid-cols-3 gap-4 p-4 border-b border-divider text-center relative z-10 bg-bg-primary">
        <div>
          <p className="font-mono text-[10px] tracking-[0.1em] text-accent mb-1 uppercase">Class</p>
          <p className="font-display text-lg italic font-black uppercase">{legend.class.split(' ')[0]}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.1em] text-accent mb-1 uppercase">Height</p>
          <p className="font-display text-lg italic font-black">{legend.height}cm</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.1em] text-accent mb-1 uppercase">Weight</p>
          <p className="font-display text-lg italic font-black">{legend.weight}kg</p>
        </div>
      </section>

      {/* SECTION 2: EDITORIAL INTRO (테크닉 B) */}
      {legend.bio && (
        <section className="editorial-section relative min-h-screen flex items-center justify-center py-32 overflow-hidden bg-[#0a0a0a]">
          <div className="absolute inset-0 z-0">
             <img 
               src={legend.gallery[0] || heroImg} 
               alt="Editorial Background"
               className="w-full h-full object-cover opacity-20 md:opacity-40 grayscale"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
          </div>
          
          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-16 flex justify-center">
            <h3 className="bio-text text-display text-[clamp(40px,8vw,140px)] font-black italic uppercase leading-[0.85] text-center md:text-left mix-blend-screen drop-shadow-2xl">
              {legend.bio.split('\n').map((line, i) => {
                const parts = line.split(/(\[.*?\])/); // [키워드] 추출
                return (
                  <div key={i} className="overflow-hidden">
                    <span className="block">
                      {parts.map((part, j) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                          return <span key={j} className="text-accent">{part.slice(1, -1)}</span>;
                        }
                        return <span key={j} className="text-white">{part}</span>;
                      })}
                    </span>
                  </div>
                );
              })}
            </h3>
          </div>
        </section>
      )}

      {/* SECTION 2: CAREER TABLE */}
      <section className="table-section px-4 md:px-16 py-16 md:py-32 max-w-[1440px] mx-auto">
        <h2 className="text-display text-3xl md:text-5xl font-black italic uppercase mb-12">Career Highlights</h2>
        
        <div className="overflow-x-auto w-full hide-scrollbar">
          <table className="w-full text-left font-sans min-w-[800px]">
            <thead>
              <tr className="text-[10px] tracking-[0.2em] uppercase text-text-muted border-b border-white/20">
                <th className="pb-4 font-normal">Year</th>
                <th className="pb-4 font-normal">Competition</th>
                <th className="pb-4 font-normal">Class</th>
                <th className="pb-4 font-normal text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {legend.titles.map((title, i) => (
                <tr key={i} className={`table-row-anim border-b border-divider group hover:bg-white/5 transition-colors ${title.result.includes('1위') ? 'text-accent' : 'text-white'}`}>
                  <td className="py-6 md:py-8 font-display italic text-2xl md:text-3xl font-black w-[15%]">
                    {title.year}
                  </td>
                  <td className="py-6 md:py-8 font-bold text-lg md:text-xl w-[40%]">
                    {title.competition}
                  </td>
                  <td className="py-6 md:py-8 text-sm uppercase tracking-widest opacity-80 w-[25%]">
                    {title.class}
                  </td>
                  <td className="py-6 md:py-8 font-display italic text-2xl md:text-3xl font-black text-right w-[20%]">
                    {title.result.includes('1위') && <span className="mr-3">🏆</span>}
                    {title.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: GALLERY (테크닉 C: 비대칭 산발 배치) */}
      <section className="gallery-section px-4 md:px-16 py-32 max-w-[1440px] mx-auto border-t border-white/10">
        <h2 className="text-display text-3xl md:text-5xl font-black italic uppercase mb-20 text-center md:text-left">
          Legendary <span className="text-accent">Moments</span>
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          {/* Main Large Image */}
          {legend.gallery[0] && (
            <div className="gallery-item w-full md:w-[60%] flex flex-col relative group">
              <div className="overflow-hidden rounded-lg relative aspect-[3/4] md:aspect-[4/5]">
                <img 
                  src={legend.gallery[0]} 
                  alt="Gallery 1" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out" 
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mt-4">
                {legend.titles[0]?.competition || 'CHAMPIONSHIP'}, {legend.titles[0]?.year || '2025'}
              </p>
            </div>
          )}

          {/* Secondary Smaller Images (Asymmetric) */}
          <div className="w-full md:w-[40%] flex flex-col gap-12 md:gap-32 md:mt-32">
            {legend.gallery.slice(1, 3).map((img, i) => (
              <div key={i} className={`gallery-item flex flex-col relative group ${i % 2 !== 0 ? 'md:self-end md:w-[80%]' : 'md:w-[90%]'}`}>
                <div className={`overflow-hidden rounded-lg relative ${i === 0 ? 'aspect-square' : 'aspect-video'}`}>
                  <img 
                    src={img} 
                    alt={`Gallery ${i+2}`} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out" 
                  />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mt-4">
                   {legend.titles[i+1]?.competition || 'ON STAGE'}, {legend.titles[i+1]?.year || ''}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote & Signature */}
        {legend.quote && (
          <div className="mt-32 max-w-3xl mx-auto text-center border-t border-white/10 pt-20">
            <p className="font-display text-2xl md:text-4xl italic text-white/80 leading-relaxed">
              "{legend.quote}"
            </p>
            <div className="mt-8 flex justify-center">
              <p className="font-black text-xl tracking-tighter italic uppercase text-accent border-b-2 border-accent pb-1 inline-block">
                {legend.nameEn}
              </p>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
