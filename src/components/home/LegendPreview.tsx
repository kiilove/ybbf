import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Crown, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import { legendService, LegendItem } from '../../services/legendService';

gsap.registerPlugin(ScrollTrigger);

export default function LegendPreview() {
  const containerRef = useRef<HTMLElement>(null);
  const [legends, setLegends] = useState<LegendItem[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await legendService.getGrandPrixLegends();
        setLegends(list);
      } catch (err) {
        console.warn('레전드 프리뷰 로드 오류:', err);
      }
    }
    loadData();
  }, []);

  // 🌊 [가로 횡방향 그물망 좌표계 (Horizontal Wave Mesh Coordinates)]
  // 1. 강승민(일반부) ➔ 2. 김민경(비키니) / 3. 유용수(클래식) ➔ 4. 김민균(피지크) / 5. 오근석(모델) ➔ 6. 김광현(마스터즈) / 7. 한수만(학생부)
  const horizontalNodes = [
    // 0. 강승민 (남자 일반부 보디빌딩 - 최우선 메인 히어로 컷)
    { widthClass: 'md:w-[27%]', aspectClass: 'aspect-[4/5]', posClass: 'md:top-[8%] md:left-[3%]', nodeX: 240, nodeY: 480 },
    // 1. 김민경 (비키니 그랑프리 - 상단 1열)
    { widthClass: 'md:w-[22%]', aspectClass: 'aspect-[3/4]', posClass: 'md:top-[4%] md:left-[33%]', nodeX: 520, nodeY: 260 },
    // 2. 유용수 (클래식 보디빌딩 - 하단 1열)
    { widthClass: 'md:w-[22%]', aspectClass: 'aspect-[4/5]', posClass: 'md:top-[50%] md:left-[33%]', nodeX: 520, nodeY: 760 },
    // 3. 김민균 (남자 피지크 - 상단 2열)
    { widthClass: 'md:w-[21%]', aspectClass: 'aspect-[3/4]', posClass: 'md:top-[4%] md:left-[58%]', nodeX: 880, nodeY: 260 },
    // 4. 오근석 (남자 스포츠 모델 - 하단 2열)
    { widthClass: 'md:w-[22%]', aspectClass: 'aspect-[4/5]', posClass: 'md:top-[50%] md:left-[58%]', nodeX: 880, nodeY: 760 },
    // 5. 김광현 (마스터즈 그랑프리 - 상단 우측)
    { widthClass: 'md:w-[20%]', aspectClass: 'aspect-square', posClass: 'md:top-[6%] md:right-[3%]', nodeX: 1260, nodeY: 260 },
    // 6. 한수만 (학생부 보디빌딩 - 하단 우측)
    { widthClass: 'md:w-[20%]', aspectClass: 'aspect-[3/4]', posClass: 'md:top-[52%] md:right-[3%]', nodeX: 1260, nodeY: 780 },
  ];

  const previewItems = legends.map((legend, index) => {
    return { ...legend, ...(horizontalNodes[index] || horizontalNodes[0]) };
  });

  useEffect(() => {
    if (!containerRef.current || legends.length === 0) return;
    
    const ctx = gsap.context(() => {
      // 1. 카드 페이드인
      const cards = gsap.utils.toArray('.h-mesh-card');
      if (cards.length > 0) {
        gsap.fromTo(cards, 
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 70%',
            }
          }
        );
      }

      // 2. 가로 횡방향 그물망 라인 드로우
      gsap.fromTo(
        '.h-mesh-line',
        { strokeDashoffset: 1500, opacity: 0 },
        {
          strokeDashoffset: 0,
          opacity: 0.8,
          duration: 2,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
          }
        }
      );
    }, containerRef);
    
    return () => ctx.revert();
  }, [legends]);

  return (
    <section ref={containerRef} className="py-24 md:py-36 px-6 md:px-12 bg-[#030305] overflow-hidden relative border-t border-white/5">
      
      {/* 앰비언트 골드 성운 글로우 */}
      <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] bg-yellow-500/[0.04] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-yellow-500/[0.03] rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-[1520px] mx-auto w-full relative z-10">
        
        {/* ═══ 상단 헤더 ═══ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown size={15} className="text-yellow-400 animate-pulse" />
              <p className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-yellow-400">
                2026 제9회 오버롤 그랑프리 연대기
              </p>
            </div>
            <h2 className="text-display text-[clamp(44px,6.5vw,100px)] leading-[0.85] font-black italic uppercase tracking-tighter text-white">
              HALL OF <br />
              <span className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">LEGENDS</span>
            </h2>
          </div>
          
          <Link 
            to="/legends" 
            className="group flex items-center justify-between gap-4 py-3.5 px-7 border border-yellow-400/40 hover:border-yellow-400 bg-black/60 hover:bg-yellow-400 hover:text-black transition-all duration-300 w-full md:w-auto rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(250,204,21,0.15)]"
          >
            <span className="text-xs font-mono font-black tracking-widest uppercase">
              역대 레전드 아카이브 전체보기 ({legends.length}인)
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {/* ═══ 🌊 가로 방향 그물망 성운 캔버스 (Horizontal Mesh Track Canvas) ═══ */}
        <div className="relative md:h-[1050px] w-full grid grid-cols-1 sm:grid-cols-2 gap-6 md:block">
          
          {/* 🕸️ 가로 횡방향 연결 그물망 SVG 라인 (Desktop Only) */}
          <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 1520 1050" 
              preserveAspectRatio="none" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 1. 메인 히어로(강승민) ➔ 김민경(비키니) / 유용수(클래식) 가로 분기 라인 */}
              <path 
                className="h-mesh-line text-yellow-400" 
                d="M 240 480 Q 380 260 520 260" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="1500"
                opacity={hoveredIndex === 0 || hoveredIndex === 1 ? 0.95 : 0.35}
              />
              <path 
                className="h-mesh-line text-yellow-400" 
                d="M 240 480 Q 380 760 520 760" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="1500"
                opacity={hoveredIndex === 0 || hoveredIndex === 2 ? 0.95 : 0.35}
              />

              {/* 2. 1열 ➔ 2열 가로 평행 & 교차 그물망 라인 */}
              <path 
                className="h-mesh-line text-yellow-400" 
                d="M 520 260 Q 700 200 880 260" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeDasharray="1500"
                opacity={hoveredIndex === 1 || hoveredIndex === 3 ? 0.9 : 0.3}
              />
              <path 
                className="h-mesh-line text-yellow-400" 
                d="M 520 760 Q 700 820 880 760" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeDasharray="1500"
                opacity={hoveredIndex === 2 || hoveredIndex === 4 ? 0.9 : 0.3}
              />
              {/* 교차 크로스 그물망 */}
              <path 
                className="h-mesh-line text-yellow-400/40" 
                d="M 520 260 L 880 760" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeDasharray="6 6" 
              />
              <path 
                className="h-mesh-line text-yellow-400/40" 
                d="M 520 760 L 880 260" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeDasharray="6 6" 
              />
              <path 
                className="h-mesh-line text-yellow-400/30" 
                d="M 520 260 L 520 760" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
              <path 
                className="h-mesh-line text-yellow-400/30" 
                d="M 880 260 L 880 760" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />

              {/* 3. 2열 ➔ 3열(마스터즈/학생부) 가로 연결선 */}
              <path 
                className="h-mesh-line text-yellow-400" 
                d="M 880 260 Q 1070 220 1260 260" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeDasharray="1500"
                opacity={hoveredIndex === 3 || hoveredIndex === 5 ? 0.9 : 0.3}
              />
              <path 
                className="h-mesh-line text-yellow-400" 
                d="M 880 760 Q 1070 800 1260 780" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeDasharray="1500"
                opacity={hoveredIndex === 4 || hoveredIndex === 6 ? 0.9 : 0.3}
              />
              <path 
                className="h-mesh-line text-yellow-400/30" 
                d="M 1260 260 L 1260 780" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />

              {/* 4. 가로 전체를 관통하는 메인 에너지 스트림 웨이브 (Main Horizontal Energy Wave) */}
              <path 
                className="h-mesh-line text-white/10" 
                d="M -50 480 Q 520 100 880 500 T 1600 480" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeDasharray="8 8" 
              />

              {/* 그물망 접점 발광 노드들 (Node Glow Particles) */}
              <circle cx="240" cy="480" r="6" fill="#facc15" className="animate-ping opacity-80" />
              <circle cx="240" cy="480" r="5" fill="#facc15" />
              <circle cx="520" cy="260" r="4" fill="#facc15" />
              <circle cx="520" cy="760" r="4" fill="#facc15" />
              <circle cx="880" cy="260" r="4" fill="#facc15" />
              <circle cx="880" cy="760" r="4" fill="#facc15" />
              <circle cx="1260" cy="260" r="4" fill="#facc15" />
              <circle cx="1260" cy="780" r="4" fill="#facc15" />
            </svg>
          </div>

          {/* 🌟 가로 종목 서열순 7대 성운 레전드 카드들 */}
          {previewItems.map((item, i) => {
            const isHovered = hoveredIndex === i;
            const isDimmed = hoveredIndex !== null && hoveredIndex !== i;
            const photoSrc = item.profileImage || item.stagePhoto1 || '/cutout1.png';
            const isMainHero = i === 0; // 강승민 (일반부 그랑프리 최우선 메인)
            
            return (
              <Link 
                to={`/legends/${item.id}`}
                key={item.id} 
                className={`h-mesh-card group flex flex-col gap-2.5 cursor-pointer md:absolute transition-all duration-700 ease-out w-full
                  ${item.widthClass} ${item.posClass}
                  ${isHovered ? 'z-50 scale-[1.03] md:scale-[1.08]' : 'z-10'}
                  ${isDimmed ? 'opacity-30 blur-[1px]' : 'opacity-100'}
                `}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* 카드 상단 라벨 */}
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-mono font-bold tracking-[0.2em] text-yellow-400 uppercase drop-shadow-md">
                    {item.nameEn || item.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-yellow-400/80 tracking-wider">
                    <Crown size={10} className="text-yellow-400" /> GRAND PRIX
                  </span>
                </div>

                {/* 레전드 사진 카드 */}
                <div className={`relative w-full ${item.aspectClass} overflow-hidden bg-[#08080c] rounded-3xl border ${
                  isMainHero
                    ? 'border-yellow-400/60 shadow-[0_0_35px_rgba(250,204,21,0.3)] ring-1 ring-yellow-400/40'
                    : 'border-yellow-400/25 hover:border-yellow-400/60'
                } ${
                  isHovered ? '!border-yellow-400 !shadow-[0_0_45px_rgba(250,204,21,0.7)] !ring-2 !ring-yellow-400' : ''
                } transition-all duration-500 shadow-2xl`}>
                  
                  <img 
                    src={photoSrc} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-108"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/cutout1.png';
                    }}
                  />

                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none" />

                  {/* 카드 내부 정보 */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                      <Sparkles size={11} className="animate-pulse" /> OVERALL GRAND PRIX
                    </div>
                    <h3 className={`font-display font-black italic uppercase text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${
                      isMainHero ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'
                    }`}>
                      {item.name}
                    </h3>
                    <p className={`font-sans truncate mt-0.5 ${
                      isMainHero ? 'text-xs md:text-sm text-yellow-200/90 font-medium' : 'text-xs text-white/80'
                    }`}>
                      {item.class}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}

        </div>
      </div>
    </section>
  );
}
