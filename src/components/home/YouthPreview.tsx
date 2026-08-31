import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contestArchiveService } from '../../services/contestArchiveService';
import { Shield, Sparkles, ArrowRight, Trophy } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function YouthPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [youthHero, setYouthHero] = useState<{
    name: string;
    school: string;
    photo: string;
    generation: string;
    title: string;
  }>({
    name: '한수만',
    school: '마들짐 (학생부)',
    photo: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8d58b957-cc21-4bf3-afed-6db41eeccd73/1787803994966_Bodybuilder_performing_side_ches…_2K_202608271312.jpeg',
    generation: 'YBBF 유스클럽 9기',
    title: '학생부 보디빌딩 오버롤 그랑프리',
  });

  useEffect(() => {
    async function fetchYouth() {
      try {
        const data = await contestArchiveService.getAutoRoster();
        if (data.youthMembers && data.youthMembers.length > 0) {
          // 그랑프리 수상자 또는 1위 유스 선수 우선 발췌
          const gp = data.youthMembers.find((y: any) => y.isGrandPrix) || data.youthMembers[0];
          setYouthHero({
            name: gp.name,
            school: gp.school || '용인시 학생부',
            photo: gp.image || gp.stagePhoto1 || '/cutout1.png',
            generation: data.edition?.youthGeneration || 'YBBF 유스클럽 9기',
            title: gp.isGrandPrix ? '학생부 오버롤 그랑프리 챔피언' : '학생부 1위 우승',
          });
        }
      } catch (err) {
        console.warn('유스 프리뷰 로드 에러:', err);
      }
    }
    fetchYouth();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal images
      gsap.utils.toArray('.reveal-img-youth').forEach((img: any) => {
        const wrap = img.parentElement;
        gsap.set(wrap, { clipPath: 'inset(0 0 100% 0)' });
        gsap.set(img, { scale: 1.15 });
        
        gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: 'top 80%',
          }
        })
        .to(wrap, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'expo.out' })
        .to(img, { scale: 1.0, duration: 1.4, ease: 'power3.out' }, '-=1.2');
      });

      // Outline text effect
      gsap.utils.toArray('.outline-row-youth').forEach((row: any) => {
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

  return (
    <div ref={containerRef} className="bg-bg-secondary border-t border-white/5 relative overflow-hidden">
      
      {/* 앰비언트 글로우 */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#b4ff00]/5 rounded-full blur-[160px] pointer-events-none" />

      <section className="min-h-screen py-24 md:py-32 px-6 md:px-16 flex flex-col justify-center relative z-10">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ═══ LEFT: 고화질 실제 학생부 유망주 사진 카드 ═══ */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
            <div className="w-full max-w-lg aspect-[4/5] relative rounded-3xl overflow-hidden bg-[#08080c] border border-white/15 shadow-2xl group">
              <img 
                src={youthHero.photo} 
                alt={youthHero.name} 
                className="reveal-img-youth w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-106"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/cutout1.png';
                }}
              />

              {/* 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              {/* 상단 기수 뱃지 */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#b4ff00]/60 text-[#b4ff00] text-xs font-mono font-bold uppercase shadow-lg">
                  <Shield size={13} /> {youthHero.generation}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-mono font-black uppercase shadow-lg">
                  <Trophy size={11} /> GRAND PRIX
                </span>
              </div>

              {/* 하단 선수 정보 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
                <p className="text-xs font-mono font-bold tracking-wider text-[#b4ff00] uppercase mb-1">
                  {youthHero.school}
                </p>
                <h3 className="text-3xl md:text-4xl font-display font-black italic uppercase text-white leading-none">
                  {youthHero.name}
                </h3>
                <p className="text-xs text-white/70 font-sans mt-1.5">
                  {youthHero.title}
                </p>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT: 유스 시스템 소개 & CTA ═══ */}
          <div className="lg:col-span-6 outline-row-youth flex flex-col justify-center items-start lg:items-end text-left lg:text-right">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
              <Sparkles size={14} className="text-[#b4ff00] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#b4ff00] uppercase">
                NEXT GENERATION
              </span>
            </div>

            <h2 className="text-display text-[clamp(50px,8vw,130px)] leading-[0.85] font-black italic uppercase tracking-tighter outline-text mb-3">
              YBBF
            </h2>
            <h2 className="text-display text-[clamp(50px,8vw,130px)] leading-[0.85] font-black italic uppercase tracking-tighter outline-text mb-8">
              YOUTH
            </h2>

            <p className="text-sm md:text-lg text-white/70 font-sans font-medium leading-relaxed max-w-md mb-8">
              미래의 레전드를 위한 공식 유스 시스템. 용인시와 대한민국 보디빌딩의 다음 세대를 이끌어갈 학생부 유망주 전용 육성 파이프라인.
            </p>

            <Link 
              to="/youth" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#b4ff00] hover:bg-white text-black text-xs font-mono font-black tracking-widest uppercase rounded-full transition-all shadow-[0_0_25px_rgba(180,255,0,0.3)] hover:scale-105"
            >
              YBBF 유스클럽 9기 선수단 보기 <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
