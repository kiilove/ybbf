import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WebGLHero from './WebGLHero';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  // 초기 화면 요소
  const bottomBarRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 등장
  const champTextRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      /* ═══ 1. 인트로 애니메이션 ═══ */
      const intro = gsap.timeline({ delay: 0.3 });

      // 하단바
      intro.fromTo(bottomBarRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );

      /* ═══ 2. 스크롤 애니메이션 ═══ */
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 1,
        }
      });

      // 초기 하단바 페이드아웃
      scrollTl.to(bottomBarRef.current, {
        opacity: 0, y: 15, duration: 0.2, ease: 'power2.in'
      }, 0);

      // Hero 섹션 텍스트 컬러 스무스 전환 (스크롤에 따라 검정 -> 흰색)
      scrollTl.to(sectionRef.current, {
        '--hero-text': '#ffffff',
        '--hero-muted': 'rgba(255,255,255,0.6)',
        '--hero-border': 'rgba(255,255,255,0.1)',
        duration: 0.5,
        ease: 'none'
      }, 0);

      // 텍스트 패럴랙스 (배경 이미지보다 빠르게 위로 올라가는 효과)
      scrollTl.fromTo(champTextRef.current,
        { scale: 1.4, opacity: 0, filter: 'blur(25px)' },
        { scale: 1, opacity: 0.12, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' },
        0.2
      );

      // 프로필 등장
      scrollTl.fromTo(profileContainerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.1 },
        0.35
      );

      statRefs.current.forEach((stat, i) => {
        if (!stat) return;
        scrollTl.fromTo(stat,
          { y: 60, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' },
          { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power4.out' },
          0.4 + i * 0.08
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="hero-wrapper">
      <section
        ref={sectionRef}
        className="relative h-screen overflow-hidden"
        style={{
          '--hero-text': '#000000',
          '--hero-muted': 'rgba(0,0,0,0.6)',
          '--hero-border': 'rgba(0,0,0,0.1)',
          color: 'var(--hero-text)'
        } as React.CSSProperties}
      >
        {/* ═══ LAYER 0: WebGL (배경 효과 + 선수 이미지 통합) ═══ */}
        <WebGLHero />

        {/* ═══ LAYER 1: 하단 정보 바 ═══ */}
        <div
          ref={bottomBarRef}
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ zIndex: 15 }}
        >
          <div className="flex items-center justify-end px-6 md:px-12 py-5 border-t border-[var(--hero-border)]">
            <div className="flex gap-4">
              {['IG', 'YT', 'FB'].map(label => (
                <span key={label} className="text-xs font-mono tracking-widest text-[var(--hero-muted)] hover:text-accent transition-colors cursor-pointer pointer-events-auto">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ LAYER 3: "CHAMPION" 배경 텍스트 (스크롤 시 등장) ═══ */}
        <div
          ref={champTextRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0"
          style={{ zIndex: 5 }}
        >
          <p className="text-[clamp(100px,28vw,500px)] font-display font-black italic uppercase tracking-tighter text-[var(--hero-text)] whitespace-nowrap mix-blend-overlay select-none">
            CHAMPION
          </p>
        </div>

        {/* ═══ LAYER 4: 방송사 스타일 프로필 (스크롤 시 등장) ═══ */}
        <div
          ref={profileContainerRef}
          className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-10 px-6 md:px-14 invisible"
          style={{ zIndex: 20 }}
        >
          <div className="w-full max-w-7xl mx-auto">

            {/* 선수 이름 + LIVE 뱃지 */}
            <div ref={el => { statRefs.current[0] = el; }} className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
                <p className="text-[var(--hero-text)] font-mono font-bold tracking-[0.35em] text-[10px] md:text-xs uppercase">
                  Athlete Introduction
                </p>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black italic uppercase tracking-tight text-[var(--hero-text)] leading-[0.88]">
                KIM <span className="text-accent">CHAMPION</span>
              </h2>
            </div>

            {/* 스탯 가로 배치 */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5 md:gap-12">
              <div ref={el => { statRefs.current[1] = el; }}>
                <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Class</p>
                <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)] tracking-wider">CLASSIC PHYSIQUE</p>
              </div>

              <div ref={el => { statRefs.current[2] = el; }} className="flex gap-6">
                <div>
                  <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Height</p>
                  <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)]">
                    182<span className="text-sm text-accent ml-0.5">CM</span>
                  </p>
                </div>
                <div>
                  <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Weight</p>
                  <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)]">
                    95<span className="text-sm text-accent ml-0.5">KG</span>
                  </p>
                </div>
              </div>

              <div ref={el => { statRefs.current[3] = el; }}>
                <p className="text-accent font-mono tracking-[0.3em] text-[9px] uppercase font-bold">Affiliation</p>
                <p className="text-xl md:text-3xl font-display font-black italic text-[var(--hero-text)] tracking-wider">용인시 보디빌딩협회</p>
              </div>
            </div>

            {/* 수상 이력 */}
            <div ref={el => { statRefs.current[4] = el; }} className="mt-5 pt-3 border-t border-[var(--hero-border)]">
              <p className="text-[var(--hero-muted)] font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5">Titles</p>
              <p className="text-base md:text-xl font-display italic text-[var(--hero-text)] tracking-wide">
                2026 Overall Winner · 2025 Grand Prix 1st · Mr. Yongin 3× Champion
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
