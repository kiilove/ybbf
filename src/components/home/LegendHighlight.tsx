import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Medal, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { legendService, ChampionWinner } from '../../services/legendService';

gsap.registerPlugin(ScrollTrigger);

export default function LegendHighlight() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [winners, setWinners] = useState<ChampionWinner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await legendService.getAllChampions();
        setWinners(list);
      } catch (err) {
        console.warn('우승자 로드 오류:', err);
      }
    }
    loadData();
  }, []);

  const currentWinner = winners[currentIndex] || winners[0] || {
    id: 'placeholder',
    name: '우승자 로딩중',
    nameEn: 'CHAMPIONS',
    gym: '용인시보디빌딩협회',
    photoUrl: '/cutout1.png',
    categories: [],
    isGrandPrix: false
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Outline text effect
      gsap.utils.toArray('.outline-row-highlight').forEach((row: any) => {
        const targets = row.querySelectorAll('.outline-text');
        if (targets.length > 0) {
          ScrollTrigger.create({
            trigger: row,
            start: 'top 75%',
            onEnter: () => {
              targets.forEach((t: Element) => t.classList.add('in-view'));
            },
            once: true,
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 6초 자동 회전 (마우스 호버 또는 터치 시 정지)
  useEffect(() => {
    if (isPaused || winners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev < winners.length - 1 ? prev + 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, [winners.length, isPaused]);

  return (
    <div ref={containerRef} className="bg-[#030305] text-white relative overflow-hidden border-t border-white/5">
      
      {/* 앰비언트 배경 글로우 */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-[#b4ff00]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      <section className="min-h-screen py-20 md:py-32 px-6 md:px-16 flex flex-col justify-center relative z-10">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ═══ LEFT COLUMN: 2026 우승자 전당 타이포그래피 & 소개 ═══ */}
          <div className="lg:col-span-6 outline-row-highlight flex flex-col justify-center items-start">
            
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
              <Medal size={14} className="text-[#b4ff00] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#b4ff00] uppercase">
                2026 HALL OF CHAMPIONS (22인)
              </span>
            </div>

            <h2 className="text-display text-[clamp(44px,7.5vw,120px)] leading-[0.85] font-black italic uppercase tracking-tighter outline-text mb-3">
              CHAMPIONS
            </h2>
            <h2 className="text-display text-[clamp(44px,7.5vw,120px)] leading-[0.85] font-black italic uppercase tracking-tighter outline-text mb-8">
              HIGHLIGHT
            </h2>

            <p className="text-sm md:text-base text-white/70 font-sans leading-relaxed max-w-md mb-8">
              2026 제9회 용인특례시 보디빌딩 대회, 44개 전 종목과 체급에서 최고의 기량으로 1위 트로피를 들어올린 22인의 챔피언 기록입니다.
            </p>

            {/* 미니 챔피언 셀렉터 버튼 */}
            <div className="flex items-center gap-3 mb-10 bg-black/40 border border-white/10 rounded-full p-1.5 backdrop-blur-md">
              <span className="text-xs font-mono text-white/60 px-3 font-bold">
                WINNER {currentIndex + 1} / {Math.max(1, winners.length)}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="이전 우승자"
                  onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : winners.length - 1))}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-[#b4ff00] hover:text-black transition-colors"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="다음 우승자"
                  onClick={() => setCurrentIndex(prev => (prev < winners.length - 1 ? prev + 1 : 0))}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-[#b4ff00] hover:text-black transition-colors"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            <Link 
              to="/champions" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#b4ff00] text-black font-mono font-black text-xs tracking-widest uppercase rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(180,255,0,0.3)] group"
            >
              대회 우승자 22인 전원 보기
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

          {/* ═══ RIGHT COLUMN: 2026 챔피언 실물 무대 스포트라이트 카드 ═══ */}
          <div 
            className="lg:col-span-6 w-full relative flex justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <div className="w-full max-w-[480px] aspect-[3/4] relative rounded-3xl overflow-hidden bg-gradient-to-b from-white/10 to-black/80 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] group">
              
              {/* 우승자 무대 사진 */}
              <img 
                key={currentWinner.id}
                src={currentWinner.photoUrl} 
                alt={currentWinner.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />

              {/* 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

              {/* 상단 뱃지 */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-center pointer-events-none">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border text-[10px] font-mono font-bold tracking-wider uppercase shadow-lg ${
                  currentWinner.isGrandPrix ? 'border-yellow-400/50 text-yellow-400' : 'border-[#b4ff00]/50 text-[#b4ff00]'
                }`}>
                  <Sparkles size={11} /> {currentWinner.isGrandPrix ? 'OVERALL & 1ST PLACE' : 'CLASS 1ST PLACE'}
                </span>
                {currentWinner.number && (
                  <span className="text-[11px] font-mono font-bold text-white/80 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    No.{currentWinner.number}
                  </span>
                )}
              </div>

              {/* 하단 프로필 정보 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end bg-gradient-to-t from-black via-black/85 to-transparent">
                <p className="font-mono text-[11px] font-bold tracking-[0.25em] text-[#b4ff00] mb-1.5 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {currentWinner.categories[0]?.categoryTitle || '체급 1위'} {currentWinner.categories[0]?.gradeTitle ? `· ${currentWinner.categories[0].gradeTitle}` : ''}
                </p>
                <h3 className="text-display text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none mb-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                  {currentWinner.name}
                  <span className="text-xs md:text-sm font-normal text-white/50 not-italic ml-2 font-mono">
                    {currentWinner.nameEn}
                  </span>
                </h3>

                <div className="flex items-center justify-between pt-3 border-t border-white/15 text-xs text-white/80">
                  <span className="font-sans font-medium">소속: <strong className="text-white font-bold">{currentWinner.gym}</strong></span>
                  <Link 
                    to={`/legends/${currentWinner.id}`} 
                    className="inline-flex items-center gap-1 text-[#b4ff00] hover:underline font-mono font-bold text-[11px] uppercase"
                  >
                    프로필 상세 →
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
