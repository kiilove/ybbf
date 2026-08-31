import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { legendService } from '../services/legendService';
import LegendWebGLHero from '../components/home/LegendWebGLHero';
import { Trophy, Medal, ArrowLeft, Crown, Heart, Sparkles, MessageCircle, Share2, Award } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';

gsap.registerPlugin(ScrollTrigger);

export default function LegendDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [champion, setChampion] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useScrollToTop([loading]);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hero Animation Refs
  const champTextRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 경로 및 그랑프리 여부 판별
  const isLegendsPath = location.pathname.startsWith('/legends');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await legendService.getChampionById(id);
        setChampion(found);
        if (found) {
          document.title = `${found.name} 선수 공식 프로필 & 기록실 | YBBF`;
        }
      } catch (err) {
        console.warn('선수 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  useEffect(() => {
    if (loading || !champion) return;

    // 데이터 로드 완료 후 다시 한번 최상단 보정
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      /* ═══ 1. Hero 등장 애니메이션 ═══ */
      const heroTl = gsap.timeline({ delay: 0.2 });

      heroTl.fromTo(champTextRef.current,
        { scale: 1.1, opacity: 0, filter: 'blur(10px)' },
        { scale: 1, opacity: 0.15, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out' },
        0
      );

      heroTl.fromTo(profileContainerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5 },
        0.5
      );

      statRefs.current.forEach((stat, i) => {
        if (!stat) return;
        heroTl.fromTo(stat,
          { y: 30, opacity: 0, clipPath: 'inset(100% -20% -20% -20%)' },
          { y: 0, opacity: 1, clipPath: 'inset(-20% -20% -20% -20%)', duration: 0.8, ease: 'power3.out' },
          0.6 + i * 0.1
        );
      });

      /* ═══ 1-1. Hero 패럴랙스 ═══ */
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

      /* ═══ 2. Records 애니메이션 ═══ */
      gsap.fromTo(
        '.record-card',
        { y: 40, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.records-section', start: 'top 75%' }
        }
      );

      /* ═══ 3. Gallery 애니메이션 ═══ */
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
  }, [loading, champion]);

  if (loading) {
    return (
      <div className="bg-[#030305] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#b4ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-white/60">선수 공식 기록을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!champion) {
    return (
      <div className="bg-[#030305] min-h-screen text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md p-8 rounded-3xl bg-white/[0.02] border border-white/10">
          <Trophy size={36} className="text-yellow-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-display font-black italic mb-2">선수 정보를 찾을 수 없습니다.</h2>
          <p className="text-xs text-white/60 mb-6 font-sans">
            해당 선수의 데이터가 아직 동기화되지 않았거나 이동되었습니다.
          </p>
          <Link
            to="/champions"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#b4ff00] text-black font-mono text-xs font-bold uppercase"
          >
            명예의 전당으로 이동
          </Link>
        </div>
      </div>
    );
  }

  const isGrandPrix = champion.isGrandPrix;
  const backPath = (isLegendsPath || isGrandPrix) ? '/legends' : '/champions';
  const backLabel = (isLegendsPath || isGrandPrix) ? '역대 레전드 아카이브 돌아가기' : '우승자 명예의 전당 돌아가기';

  const heroImg = champion.stagePhoto1 || champion.photoUrl || champion.profileImage || '/cutout1.png';
  const stagePhotos = [champion.stagePhoto1, champion.stagePhoto2].filter(Boolean) as string[];

  // 우승 및 수상 기록 리스트 정제
  const rawRecords = champion.categories || champion.titles || [];
  const awardsList = rawRecords.map((r: any) => {
    const isOverall = r.isOverall || (r.award && r.award.includes('그랑프리')) || (r.result && r.result.includes('그랑프리'));
    const rankNum = Number(r.rank) || (isOverall ? 1 : (r.award && r.award.includes('1위') ? 1 : 2));
    const awardTitle = isOverall ? '👑 오버롤 그랑프리 우승' : (r.award || r.result || `${rankNum}위`);
    const categoryName = r.categoryTitle || r.class || r.competition || '2026 용인특례시 대회';
    const gradeName = r.gradeTitle ? `(${r.gradeTitle})` : '';

    return {
      year: r.year || 2026,
      competition: r.competition || '제9회 용인특례시 보디빌딩대회',
      category: `${categoryName} ${gradeName}`.trim(),
      award: awardTitle,
      rank: rankNum,
      isOverall
    };
  });

  // 쇼케이스 팬페이지 링크
  const showcaseLink = `/showcase/${encodeURIComponent(champion.name)}`;

  return (
    <div ref={containerRef} className="bg-[#030305] min-h-screen text-white">
      
      {/* ═══ SECTION 1: HERO (WebGL + Broadcast Stats) ═══ */}
      <section className="hero-section relative h-screen overflow-hidden">
        
        {/* LAYER 0: WebGL 셰이더 */}
        <LegendWebGLHero imageUrl={heroImg} />

        {/* BACK BUTTON */}
        <div className="absolute top-24 left-6 md:left-16 z-50">
          <Link 
            to={backPath} 
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs font-mono font-bold uppercase tracking-widest text-white hover:bg-[#b4ff00] hover:text-black transition-all shadow-lg"
          >
            <ArrowLeft size={14} /> {backLabel}
          </Link>
        </div>

        {/* LAYER 1: Giant Typography */}
        <div
          ref={champTextRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0"
          style={{ zIndex: 5 }}
        >
          <p className="text-[clamp(80px,22vw,400px)] font-display font-black italic uppercase tracking-widest text-white/10 whitespace-nowrap select-none">
            {champion.name}
          </p>
        </div>

        {/* LAYER 2: Broadcast Stats */}
        <div
          ref={profileContainerRef}
          className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-12 px-6 md:px-16 invisible"
          style={{ zIndex: 20 }}
        >
          <div className="w-full max-w-[1440px] mx-auto">
            
            {/* 상단 뱃지 (레전드 vs 일반 우승자 명확한 차별화) */}
            <div ref={el => { statRefs.current[0] = el; }} className="flex items-center gap-2 mb-3">
              {isGrandPrix ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-400/60 text-yellow-400 text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  <Crown size={13} className="animate-pulse" /> OVERALL GRAND PRIX LEGEND
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#b4ff00]/60 text-[#b4ff00] text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(180,255,0,0.2)]">
                  <Medal size={13} /> 2026 CLASS 1ST PLACE WINNER
                </span>
              )}
            </div>

            {/* 선수명 */}
            <div ref={el => { statRefs.current[1] = el; }} className="mb-4">
              <h1 className="text-display text-[clamp(44px,7.5vw,110px)] font-black italic uppercase text-white leading-[0.85] tracking-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
                {champion.name}
                {champion.nameEn && (
                  <span className="text-sm md:text-xl font-normal text-white/50 not-italic ml-3 font-mono">
                    {champion.nameEn}
                  </span>
                )}
              </h1>
            </div>

            {/* 피지컬 스탯 바 (선수번호로 정직하게 표출) */}
            <div ref={el => { statRefs.current[2] = el; }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl py-4 border-y border-white/15 bg-black/50 backdrop-blur-md px-5 rounded-2xl">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">소속</p>
                <p className="font-sans font-bold text-sm text-white truncate">{champion.gym || champion.club || '무소속'}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">선수번호</p>
                <p className="font-mono font-bold text-sm text-[#b4ff00]">No.{champion.number || '-'}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">신장</p>
                <p className="font-mono font-bold text-sm text-white">{champion.height ? `${champion.height} cm` : '-'}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">체중</p>
                <p className="font-mono font-bold text-sm text-white">{champion.weight ? `${champion.weight} kg` : '-'}</p>
              </div>
            </div>

            {/* 주요 우승 부문 태그 */}
            <div ref={el => { statRefs.current[3] = el; }} className="mt-4 flex flex-wrap gap-2">
              {awardsList.slice(0, 3).map((cat: any, i: number) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-sans font-medium text-white/90">
                  <strong className={cat.isOverall ? 'text-yellow-400 font-bold' : 'text-[#b4ff00] font-bold'}>
                    {cat.award}
                  </strong>
                  · {cat.category}
                </span>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: OFFICIAL CAREER & CHAMPIONSHIP RECORDS (우승 및 수상 기록실) ═══ */}
      <section className="records-section py-20 px-6 md:px-16 max-w-[1440px] mx-auto border-b border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Trophy size={16} />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                OFFICIAL CHAMPIONSHIP RECORD
              </span>
            </div>
            <h2 className="text-display text-3xl md:text-5xl font-black italic uppercase text-white">
              공식 우승 및 수상 기록
            </h2>
          </div>
          <p className="font-sans text-xs md:text-sm text-white/60 max-w-md">
            용인특례시 보디빌딩협회 공식 심사 집계 시스템에 영구 공인된 {champion.name} 선수의 수상 이력입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {awardsList.map((record: any, idx: number) => {
            const isFirst = record.rank === 1 || record.award.includes('1위');
            const isSecond = record.rank === 2 || record.award.includes('2위');

            return (
              <div 
                key={idx}
                className={`record-card p-6 rounded-3xl border transition-all ${
                  record.isOverall 
                    ? 'bg-gradient-to-br from-yellow-950/20 via-black to-[#050505] border-yellow-400/40 shadow-[0_0_25px_rgba(250,204,21,0.1)]' 
                    : isFirst
                    ? 'bg-white/[0.02] border-white/10 hover:border-[#b4ff00]/50'
                    : 'bg-white/[0.01] border-white/5 hover:border-slate-400/40'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                    {record.year} YEAR
                  </span>
                  {record.isOverall ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-400/30">
                      <Crown size={12} /> GRAND PRIX
                    </span>
                  ) : isFirst ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#b4ff00] bg-[#b4ff00]/10 px-2.5 py-0.5 rounded-full border border-[#b4ff00]/30">
                      <Medal size={12} /> 1ST PLACE
                    </span>
                  ) : isSecond ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300 bg-slate-400/10 px-2.5 py-0.5 rounded-full border border-slate-400/30">
                      <Medal size={12} /> 2ND PLACE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      <Medal size={12} /> 3RD PLACE
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black italic uppercase text-white mb-2 leading-snug">
                  {record.award}
                </h3>
                
                <p className="text-xs font-sans text-white/80 font-medium mb-1">
                  {record.category}
                </p>
                
                <p className="text-[11px] font-sans text-white/40">
                  {record.competition}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ SECTION 3: ATHLETE SHOWCASE & FAN CHEER ZONE (팬페이지 & 응원 연동) ═══ */}
      <section className="py-20 px-6 md:px-16 max-w-[1440px] mx-auto border-b border-white/10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/30 via-purple-950/20 to-black border border-white/15 p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase w-max mb-4">
              <Heart size={14} className="fill-red-500 text-red-500 animate-pulse" />
              OFFICIAL FAN SHOWCASE & CHEER
            </div>

            <h3 className="text-display text-3xl md:text-5xl font-black italic uppercase text-white mb-4">
              {champion.name} 선수 공식 팬페이지
            </h3>

            <p className="text-sm md:text-base text-white/70 font-sans leading-relaxed">
              선수 개인 쇼케이스 페이지에서 실시간 응원 메시지를 남기고 하트 투표와 대회 공식 포토 카드를 공유해 보세요!
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
            <Link
              to={showcaseLink}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-mono font-black text-xs tracking-wider uppercase hover:scale-105 transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)]"
            >
              <Heart size={16} className="fill-white" />
              {champion.name} 선수 팬페이지 응원하기 →
            </Link>
          </div>

        </div>
      </section>

      {/* ═══ SECTION 4: STAGE PHOTO GALLERY (2K 무대 사진 갤러리) ═══ */}
      {stagePhotos.length > 0 && (
        <section className="gallery-section py-24 px-6 md:px-16 max-w-[1440px] mx-auto border-b border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <p className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#b4ff00] uppercase mb-2">
                OFFICIAL 2K STAGE CUTS
              </p>
              <h2 className="text-display text-4xl md:text-5xl font-black italic uppercase text-white">
                STAGE GALLERY
              </h2>
            </div>
            <p className="font-sans text-xs md:text-sm text-white/60 max-w-md">
              2026 제9회 용인특례시 보디빌딩 대회 공식 무대 2K 고화질 아카이브입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stagePhotos.map((photoUrl, idx) => (
              <div 
                key={idx} 
                className="gallery-item group relative aspect-[3/4] rounded-3xl overflow-hidden bg-black/60 border border-white/15 shadow-2xl"
              >
                <img 
                  src={photoUrl} 
                  alt={`${champion.name} 무대 사진 ${idx + 1}`}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-[#b4ff00] bg-black/70 px-3 py-1 rounded-full border border-white/15">
                    STAGE POSE #{idx + 1}
                  </span>
                  <span className="text-xs font-sans text-white/70">
                    2026 YBBF OFFICIAL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ SECTION 5: BOTTOM NAVIGATION ═══ */}
      <section className="py-20 px-6 text-center bg-black/40">
        <Link
          to={backPath}
          className={`inline-flex items-center gap-3 px-8 py-4 ${
            isGrandPrix ? 'bg-yellow-400 hover:bg-white text-black' : 'bg-[#b4ff00] hover:bg-white text-black'
          } font-mono font-black text-xs tracking-widest uppercase rounded-full hover:scale-105 transition-all shadow-2xl`}
        >
          <ArrowLeft size={16} /> {backLabel}
        </Link>
      </section>

    </div>
  );
}
