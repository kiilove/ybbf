import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Medal, Trophy, Sparkles, Search, Flame, Crown, ArrowRight } from 'lucide-react';
import { legendService, ChampionWinner } from '../services/legendService';
import { useScrollToTop } from '../hooks/useScrollToTop';

gsap.registerPlugin(ScrollTrigger);

export default function ChampionsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEdition, setSelectedEdition] = useState<string>('9th');
  const [champions, setChampions] = useState<ChampionWinner[]>([]);
  const [filteredChampions, setFilteredChampions] = useState<ChampionWinner[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useScrollToTop([loading]);

  useEffect(() => {
    document.title = "회차별 우승자 명예의 전당 (Hall of Champions) | YBBF 용인시보디빌딩협회";

    async function loadWinners() {
      try {
        const data = await legendService.getAllChampions();
        setChampions(data);
        setFilteredChampions(data);
      } catch (err) {
        console.error('우승자 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWinners();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let list = [...champions];

    if (activeFilter === 'grandprix') {
      list = list.filter(c => c.isGrandPrix);
    } else if (activeFilter === 'bodybuilding') {
      list = list.filter(c => c.categories.some(cat => cat.categoryTitle.includes('보디빌딩') && !cat.categoryTitle.includes('클래식') && !cat.categoryTitle.includes('학생부') && !cat.categoryTitle.includes('마스터즈')));
    } else if (activeFilter === 'classic') {
      list = list.filter(c => c.categories.some(cat => cat.categoryTitle.includes('클래식')));
    } else if (activeFilter === 'physique') {
      list = list.filter(c => c.categories.some(cat => cat.categoryTitle.includes('피지크')));
    } else if (activeFilter === 'bikini') {
      list = list.filter(c => c.categories.some(cat => cat.categoryTitle.includes('비키니') || cat.categoryTitle.includes('스포츠 모델') || cat.categoryTitle.includes('모델') || cat.categoryTitle.includes('피트니스')));
    } else if (activeFilter === 'masters_youth') {
      list = list.filter(c => c.categories.some(cat => cat.categoryTitle.includes('마스터즈') || cat.categoryTitle.includes('장년부') || cat.categoryTitle.includes('학생부') || cat.categoryTitle.includes('대학부')));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.nameEn.toLowerCase().includes(q) || 
        c.gym.toLowerCase().includes(q) ||
        c.categories.some(cat => cat.categoryTitle.toLowerCase().includes(q) || cat.gradeTitle.toLowerCase().includes(q))
      );
    }

    setFilteredChampions(list);
  }, [activeFilter, searchQuery, champions]);

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
        '.reveal-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading, activeFilter]);

  return (
    <div ref={containerRef} className="bg-[#030305] min-h-screen text-white pt-24 pb-32">
      
      {/* ═══ SECTION 1: HERO HEADER ═══ */}
      <section className="relative py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden border-b border-white/10">
        
        {/* 앰비언트 글로우 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#b4ff00]/5 rounded-full blur-[170px] pointer-events-none" />

        <div className="relative z-10 w-full px-6 md:px-14 max-w-[1440px] mx-auto flex flex-col items-center text-center">
          
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 mb-6 backdrop-blur-md">
            <Medal size={14} className="text-[#b4ff00] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] text-[#b4ff00] uppercase font-bold">
              OFFICIAL WINNERS ARCHIVE
            </span>
          </div>

          <h1 className="hero-title text-display text-[clamp(44px,9vw,130px)] leading-[0.85] font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] mb-6">
            HALL OF CHAMPIONS
          </h1>

          <p className="font-sans text-sm md:text-base text-white/70 max-w-2xl leading-relaxed mb-8">
            대회 회차별 각 종목 및 체급 1위를 달성한 모든 챔피언들의 공식 수상 기록 보관소입니다.
          </p>

          <Link
            to="/legends"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(250,204,21,0.15)]"
          >
            <Crown size={14} /> 역대 최정상 레전드 아카이브 보러가기 →
          </Link>
        </div>
      </section>

      {/* ═══ SECTION 2: STATS BAR ═══ */}
      <section className="px-6 md:px-14 py-12 max-w-[1440px] mx-auto border-b border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          
          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-[#b4ff00] uppercase font-bold mb-1">Total Winners</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">{champions.length || 22}</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">체급 1위 챔피언</p>
          </div>

          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-yellow-400 uppercase font-bold mb-1">Overalls</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">6</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">오버롤 그랑프리</p>
          </div>

          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-cyan-400 uppercase font-bold mb-1">Categories</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">44</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">전체 심사 부문</p>
          </div>

          <div className="stat-item p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-mono text-xs text-red-400 uppercase font-bold mb-1">Current Edition</p>
            <h2 className="text-display text-4xl md:text-5xl font-black italic text-white">9TH</h2>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">2026 용인특례시 대회</p>
          </div>

        </div>
      </section>

      {/* ═══ SECTION 3: ROSTER & CONTROLS ═══ */}
      <section className="px-6 md:px-14 py-16 max-w-[1440px] mx-auto">
        
        {/* 회차 선택기 (Edition Selector) */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          <span className="text-xs font-mono font-bold text-white/50 uppercase mr-2 shrink-0">
            대회 회차 선택:
          </span>
          <button
            onClick={() => setSelectedEdition('9th')}
            className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#b4ff00] text-black shadow-[0_0_15px_rgba(180,255,0,0.4)] whitespace-nowrap"
          >
            제9회 대회 (2026) ✓
          </button>
          <span className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-white/5 text-white/40 border border-white/10 cursor-not-allowed whitespace-nowrap">
            제8회 대회 (아카이브 이관 준비중)
          </span>
          <span className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-white/5 text-white/40 border border-white/10 cursor-not-allowed whitespace-nowrap">
            제7회 대회 (아카이브 이관 준비중)
          </span>
        </div>

        {/* 필터 탭 & 검색 바 */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 mb-12 pb-6 border-b border-white/10">
          
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { key: 'all', label: `전체 (${champions.length})` },
              { key: 'grandprix', label: '👑 그랑프리 (6)' },
              { key: 'bodybuilding', label: '보디빌딩' },
              { key: 'classic', label: '클래식' },
              { key: 'physique', label: '피지크' },
              { key: 'bikini', label: '비키니 & 모델' },
              { key: 'masters_youth', label: '마스터즈 & 학생부' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-2.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all duration-300 ${
                  activeFilter === tab.key
                    ? 'bg-[#b4ff00] text-black shadow-[0_0_15px_rgba(180,255,0,0.4)] scale-105'
                    : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="선수명, 체급, 소속 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#b4ff00] focus:ring-1 focus:ring-[#b4ff00] transition-all"
            />
          </div>
        </div>

        {/* 챔피언 카드 그리드 */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-[#b4ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-sm text-white/60">우승자 명예의 전당을 불러오는 중입니다...</p>
          </div>
        ) : filteredChampions.length === 0 ? (
          <div className="py-24 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
            <p className="font-sans text-lg text-white/60 mb-2">해당 조건의 우승자가 없습니다.</p>
            <p className="font-mono text-xs text-white/40">다른 필터나 검색어를 선택해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredChampions.map((champ) => {
              const isGP = champ.isGrandPrix;

              return (
                <Link
                  key={champ.id}
                  to={`/champions/${champ.id}`}
                  className={`reveal-card group relative block overflow-hidden rounded-3xl bg-black/60 border ${
                    isGP 
                      ? 'border-yellow-400/40 hover:border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.15)]' 
                      : 'border-white/10 hover:border-[#b4ff00]'
                  } transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]`}
                >
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#08080c]">
                    <img
                      src={champ.photoUrl || '/cutout1.png'}
                      alt={champ.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-108"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/cutout1.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/20 to-transparent pointer-events-none" />

                    <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-center pointer-events-none">
                      {isGP ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-yellow-400/50 text-yellow-400 text-[10px] font-mono font-bold uppercase shadow-lg">
                          <Trophy size={11} className="animate-pulse" /> OVERALL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[#b4ff00] text-[10px] font-mono font-bold uppercase">
                          <Medal size={11} /> 1ST PLACE
                        </span>
                      )}

                      {champ.number && (
                        <span className="text-[10px] font-mono font-bold text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                          No.{champ.number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 md:p-6 bg-[#030305]">
                    <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#b4ff00] mb-1 uppercase truncate">
                      {champ.gym}
                    </p>

                    <h3 className="text-display text-2xl md:text-3xl font-black italic uppercase text-white leading-none group-hover:text-[#b4ff00] transition-colors mb-3">
                      {champ.name}
                      <span className="text-[11px] font-normal text-white/50 not-italic ml-2 font-mono">
                        {champ.nameEn}
                      </span>
                    </h3>

                    <div className="space-y-1.5 pt-3 border-t border-white/10">
                      {champ.categories.slice(0, 2).map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-white/70">
                          <span className="truncate font-sans font-medium">{cat.categoryTitle} {cat.gradeTitle ? `· ${cat.gradeTitle}` : ''}</span>
                          <span className={`font-mono font-bold shrink-0 ml-2 ${cat.isOverall ? 'text-yellow-400' : 'text-[#b4ff00]'}`}>
                            {cat.award}
                          </span>
                        </div>
                      ))}
                      {champ.categories.length > 2 && (
                        <p className="text-[10px] font-mono text-white/40 pt-0.5">
                          외 {champ.categories.length - 2}개 부문 석권
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </section>

    </div>
  );
}
