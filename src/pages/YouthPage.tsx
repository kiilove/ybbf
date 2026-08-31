import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contestArchiveService } from '../services/contestArchiveService';
import { MapPin, Users, Trophy, ChevronRight, Dumbbell, Shield, Flag, Sparkles } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';

gsap.registerPlugin(ScrollTrigger);

export default function YouthPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [youthMembers, setYouthMembers] = useState<any[]>([]);
  const [generationTitle, setGenerationTitle] = useState<string>('YBBF 유스클럽 9기');
  const [loading, setLoading] = useState<boolean>(true);

  useScrollToTop([loading]);

  useEffect(() => {
    document.title = "YBBF 유소년 육성 시스템 & 유스클럽 | YOUTH";

    async function loadYouthData() {
      try {
        const data = await contestArchiveService.getAutoRoster();
        if (data.youthMembers && data.youthMembers.length > 0) {
          setYouthMembers(data.youthMembers);
        }
        if (data.edition?.youthGeneration) {
          setGenerationTitle(data.edition.youthGeneration);
        }
      } catch (err) {
        console.warn('유스 데이터 실시간 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }

    loadYouthData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo('.hero-text-anim',
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power4.out', delay: 0.1 }
      );

      // System Diagram Animation
      gsap.fromTo('.system-step',
        { y: 50, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: { trigger: '.system-section', start: 'top 70%' }
        }
      );

      // Cards Animation
      gsap.fromTo('.athlete-card',
        { y: 40, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: '.roster-section', start: 'top 70%' }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  return (
    <div ref={containerRef} className="bg-[#030305] min-h-screen text-white pt-24 pb-32">
      
      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-16 border-b border-white/10 overflow-hidden">
        
        {/* 앰비언트 글로우 */}
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-[#b4ff00]/5 rounded-full blur-[170px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto w-full relative z-10">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 w-max mb-6 backdrop-blur-md">
            <Sparkles size={14} className="text-[#b4ff00] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] text-[#b4ff00] uppercase font-bold">
              THE NEXT GENERATION OF YBBF
            </span>
          </div>

          <h1 className="hero-text-anim text-display text-[clamp(44px,8vw,120px)] leading-[0.85] font-black italic uppercase tracking-tighter mb-8">
            YOUTH CLUB <br />
            SYSTEM
          </h1>

          <p className="hero-text-anim text-lg md:text-2xl text-white/70 max-w-2xl font-sans font-medium leading-relaxed">
            학생부 출전 선수 전원은 자동으로 <span className="text-[#b4ff00] font-bold">YBBF 공식 유스클럽</span>에 가입되어 체계적인 무대 관리와 육성 프로그램을 지원받습니다.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 2: 3-TIER PATHWAY SYSTEM ═══ */}
      <section className="system-section py-24 md:py-36 px-6 md:px-16 max-w-[1440px] mx-auto">
        <div className="mb-16">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#b4ff00] mb-3">육성 파이프라인</p>
          <h2 className="text-3xl md:text-5xl font-display font-black italic uppercase">3-Step Development</h2>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-6 md:gap-8 justify-between z-10">
          
          {/* Step 1 */}
          <div className="system-step flex-1 bg-white/[0.02] border border-white/10 hover:border-white/30 p-8 md:p-10 relative overflow-hidden rounded-3xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <Dumbbell className="w-5 h-5 text-white/70" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono mb-2">Step 01</p>
            <h3 className="text-2xl font-display font-black italic mb-4 text-white">대회 학생부 출전</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              용인특례시 대회 학생부(보디빌딩/핏모델)에 참가하는 순간, 공식 육성 시스템에 즉시 등록됩니다.
            </p>
          </div>

          {/* Step 2 */}
          <div className="system-step flex-1 bg-black/80 border border-[#b4ff00]/50 p-8 md:p-10 relative overflow-hidden rounded-3xl shadow-[0_0_30px_rgba(180,255,0,0.1)] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#b4ff00]/10 border border-[#b4ff00] flex items-center justify-center mb-8 text-[#b4ff00]">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b4ff00] font-mono mb-2">Step 02 · The Core</p>
            <h3 className="text-2xl font-display font-black italic mb-4 text-white">YBBF 유스클럽 기수 배정</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              회차별 대회(제9회)에 맞춰 <strong>"YBBF 유스클럽 9기"</strong>로 자동 가입되며 공식 아카이브에 영구 기록됩니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="system-step flex-1 bg-white/[0.02] border border-white/10 hover:border-white/30 p-8 md:p-10 relative overflow-hidden rounded-3xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <Flag className="w-5 h-5 text-white/70" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono mb-2">Step 03</p>
            <h3 className="text-2xl font-display font-black italic mb-4 text-white">성인 무대 & 도민체전 진출</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              유스클럽 수료 후 성인 일반부 무대 및 경기도 대표 선수로 성장하여 대한민국 보디빌딩의 미래가 됩니다.
            </p>
          </div>

        </div>
      </section>

      {/* ═══ SECTION 3: YOUTH ROSTER (D1 실시간 연동 9기 선수단) ═══ */}
      <section className="roster-section py-16 md:py-24 px-6 md:px-16 max-w-[1440px] mx-auto border-t border-white/10">
        
        {/* 헤더 & 기수 뱃지 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[#b4ff00] mb-2">
              <Sparkles size={16} />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                OFFICIAL YOUTH ROSTER
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black italic uppercase text-white">
              {generationTitle} 선수단 ({youthMembers.length}명)
            </h2>
          </div>
          <p className="font-sans text-xs md:text-sm text-white/60 max-w-md">
            2026 제9회 대회 학생부 출전을 통해 유스클럽 9기에 정식 가입된 유망주 명단입니다.
          </p>
        </div>

        {/* 유스 선수 그리드 */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#b4ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-sm text-white/60">유스클럽 선수단을 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {youthMembers.map((athlete, idx) => (
              <div 
                key={athlete.id || idx}
                className="athlete-card group relative block overflow-hidden rounded-3xl bg-black/60 border border-white/10 hover:border-[#b4ff00] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(180,255,0,0.15)]"
              >
                {/* 상단 무대 사진 */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#08080c]">
                  <img 
                    src={athlete.image || athlete.stagePhoto1 || '/cutout1.png'} 
                    alt={athlete.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/20 to-transparent pointer-events-none" />

                  {/* 상단 유스클럽 기수 뱃지 */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-center pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#b4ff00]/50 text-[#b4ff00] text-[10px] font-mono font-bold uppercase shadow-lg">
                      <Shield size={11} /> {generationTitle}
                    </span>
                    {athlete.isGrandPrix && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-mono font-black uppercase shadow-lg">
                        <Trophy size={11} /> GRAND PRIX
                      </span>
                    )}
                  </div>
                </div>

                {/* 하단 선수 정보 */}
                <div className="p-5 md:p-6 bg-[#030305]">
                  <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#b4ff00] mb-1 uppercase truncate">
                    {athlete.school}
                  </p>
                  
                  <h3 className="text-display text-2xl md:text-3xl font-black italic uppercase text-white leading-none group-hover:text-[#b4ff00] transition-colors mb-3">
                    {athlete.name}
                  </h3>

                  {/* 획득 성적 배너 */}
                  <div className="pt-3 border-t border-white/10 space-y-1">
                    {athlete.achievements.map((ach: string, aIdx: number) => (
                      <p key={aIdx} className="text-[11px] font-sans font-medium text-white/80 line-clamp-1">
                        🏆 {ach}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

    </div>
  );
}
