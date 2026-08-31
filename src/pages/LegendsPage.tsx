import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Trophy, Sparkles, Crown, History, ChevronRight, Medal } from 'lucide-react';
import { legendService, LegendItem } from '../services/legendService';
import { useScrollToTop } from '../hooks/useScrollToTop';

gsap.registerPlugin(ScrollTrigger);

export default function LegendsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grandPrixLegends, setGrandPrixLegends] = useState<LegendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useScrollToTop([loading]);

  useEffect(() => {
    document.title = "역대 레전드 아카이브 (Hall of Legends) | YBBF 용인시보디빌딩협회";

    async function loadLegends() {
      try {
        const list = await legendService.getGrandPrixLegends();
        setGrandPrixLegends(list);
      } catch (err) {
        console.warn('레전드 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLegends();
  }, []);

  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-title',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power4.out', delay: 0.1 }
      );

      gsap.fromTo(
        '.stat-item',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }
      );

      gsap.fromTo(
        '.legend-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  return (
    <div ref={containerRef} className="bg-[#030305] min-h-screen text-white pt-24 pb-32">
      
      {/* ═══ SECTION 1: HERO HEADER ═══ */}
      <section className="relative py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden border-b border-white/10">
        
        {/* 앰비언트 골드 글로우 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-yellow-500/5 rounded-full blur-[170px] pointer-events-none" />

        <div className="relative z-10 w-full px-6 md:px-14 max-w-[1440px] mx-auto flex flex-col items-center text-center">
          
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-yellow-400/30 mb-6 backdrop-blur-md">
            <Crown size={14} className="text-yellow-400 animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] text-yellow-400 uppercase font-bold">
              HISTORICAL OVERALL GRAND PRIX
            </span>
          </div>

          <h1 className="hero-title text-display text-[clamp(44px,9vw,130px)] leading-[0.85] font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] mb-6">
            HALL OF LEGENDS
          </h1>

          <p className="font-sans text-sm md:text-base text-white/70 max-w-2xl leading-relaxed mb-8">
            용인특례시 보디빌딩 역사의 정점에 선 역대 최정상 오버롤 그랑프리 레전드 아카이브입니다. 매 회차 무대를 압도한 전설들의 영광이 영구 보존됩니다.
          </p>

          {/* 회차별 우승자 전당 바로가기 버튼 */}
          <Link
            to="/champions"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#b4ff00]/10 border border-[#b4ff00]/30 text-[#b4ff00] hover:bg-[#b4ff00] hover:text-black font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(180,255,0,0.2)]"
          >
            <Medal size={15} /> 회차별 모든 우승자(22인) 명예의 전당 보기 →
          </Link>
        </div>
      </section>

      {/* ═══ SECTION 2: STATS BAR ═══ */}
      <section className="px-6 md:px-14 py-12 max-w-[1440px] mx-auto border-b border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          
          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-yellow-400 uppercase font-bold mb-1">Overalls</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">{grandPrixLegends.length}</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">오버롤 레전드</p>
          </div>

          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-[#b4ff00] uppercase font-bold mb-1">Categories</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">6</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">그랑프리 부문</p>
          </div>

          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-cyan-400 uppercase font-bold mb-1">Current Edition</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">9TH</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">2026 용인특례시 대회</p>
          </div>

          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-red-400 uppercase font-bold mb-1">Legacy</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">PERMANENT</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">영구 헌액</p>
          </div>

        </div>
      </section>

      {/* ═══ SECTION 3: GRAND PRIX LEGENDS GRID ═══ */}
      <section className="px-6 md:px-14 py-16 max-w-[1440px] mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Sparkles size={16} />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                2026 OVERALL GRAND PRIX ROSTER
              </span>
            </div>
            <h2 className="text-display text-3xl md:text-5xl font-black italic uppercase text-white">
              제9회 대회 오버롤 레전드
            </h2>
          </div>
          <p className="font-sans text-xs md:text-sm text-white/60 max-w-md">
            체급을 초월하여 당대 최고의 피지컬로 심사위원 만장일치 그랑프리를 획득한 6인의 시그니처 챔피언입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {grandPrixLegends.map((legend) => (
            <Link
              key={legend.id}
              to={`/legends/${legend.id}`}
              className="legend-card group relative block overflow-hidden rounded-3xl bg-black/60 border border-yellow-400/30 hover:border-yellow-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(250,204,21,0.2)]"
            >
              {/* 챔피언 사진 */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#08080c]">
                <img
                  src={legend.profileImage}
                  alt={legend.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/25 to-transparent pointer-events-none" />

                {/* 상단 뱃지 */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-yellow-400/60 text-yellow-400 text-[11px] font-mono font-bold uppercase shadow-xl">
                    <Crown size={12} className="animate-pulse" /> OVERALL LEGEND
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white/80 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                    2026 YBBF
                  </span>
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="p-6 bg-[#030305]">
                <p className="font-mono text-[11px] font-bold tracking-[0.25em] text-yellow-400 mb-1.5 uppercase">
                  {legend.class}
                </p>
                <h3 className="text-display text-3xl font-black italic uppercase text-white leading-none group-hover:text-yellow-400 transition-colors mb-3">
                  {legend.name}
                  <span className="text-xs font-normal text-white/50 not-italic ml-2 font-mono">
                    {legend.nameEn}
                  </span>
                </h3>
                
                {legend.quote && (
                  <p className="text-xs text-white/60 font-sans italic line-clamp-2 mt-2 pt-3 border-t border-white/10">
                    "{legend.quote}"
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs">
                  <span className="text-white/60">소속: <strong className="text-white font-bold">{legend.club || '용인시'}</strong></span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-yellow-400 group-hover:translate-x-1 transition-transform">
                    프로필 상세 <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 하단 아카이브 확장 배너 */}
        <div className="mt-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
              <History size={24} />
            </div>
            <div>
              <h4 className="font-display font-black italic text-lg uppercase text-white">대회 회차별 아카이브 확장</h4>
              <p className="text-xs text-white/60 font-sans mt-0.5">
                용인특례시 보디빌딩 대회는 매 회차 새로운 레전드를 발굴하여 이 명예의 전당에 영구 헌액합니다.
              </p>
            </div>
          </div>
          <Link
            to="/champions"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#b4ff00] text-black text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap hover:bg-white hover:scale-105"
          >
            제9회 전체 체급 우승자 보기 (22명) →
          </Link>
        </div>

      </section>

    </div>
  );
}
