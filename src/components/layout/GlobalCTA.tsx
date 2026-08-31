import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

export default function GlobalCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // 동적 대회 접수 상태 (현재 2027 제10회 사전 접수 진행 중)
  // 추후 본 접수 오픈 시 정규 접수로 유연하게 전환
  const [contestStatus] = useState<{
    type: 'pre_register' | 'regular';
    edition: number;
    title: string;
    link: string;
    badge: string;
  }>({
    type: 'pre_register',
    edition: 10,
    title: '2027 제10회 사전 접수',
    link: '/competition/pre-register',
    badge: '⚡ 얼리버드 특별 혜택'
  });

  useEffect(() => {
    // Marquee animation
    if (textRef.current) {
      gsap.to(textRef.current, {
        x: '-50%',
        duration: 20,
        ease: 'none',
        repeat: -1,
      });
    }

    // Parallax effect on scroll
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { backgroundPositionY: '0%' },
        { 
          backgroundPositionY: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    }
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden py-32 bg-black border-t border-white/10 flex flex-col items-center justify-center min-h-[60vh]"
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-black to-black opacity-60"></div>
      
      {/* Giant Marquee Text */}
      <div className="absolute top-1/2 -translate-y-1/2 w-[200vw] overflow-hidden opacity-5 pointer-events-none select-none mix-blend-screen">
        <div ref={textRef} className="flex whitespace-nowrap text-[15vw] font-display font-black italic uppercase leading-none">
          <span>FORGE YOUR LEGACY • SCULPTED BY DISCIPLINE • THE PINNACLE • FORGE YOUR LEGACY • SCULPTED BY DISCIPLINE • THE PINNACLE •&nbsp;</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-display font-black italic uppercase mb-6 leading-tight drop-shadow-2xl">
          Forge Your<br/>
          <span className="text-accent outline-text">Legacy.</span>
        </h2>
        
        <p className="text-white/60 font-sans md:text-lg mb-10 max-w-xl mx-auto tracking-wide">
          정통 위에서 피어나는 가장 젊고 뜨거운 에너지.<br className="hidden md:block" />
          가장 엄격한 룰 위에서, 가장 자유롭고 폭발적인 미래가 시작됩니다.
        </p>

        {/* ═══ 동적 액션 버튼 그룹 ═══ */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          
          {/* 1. 동적 대회 접수 버튼 (사전 접수 ➔ 본 접수 자동 전환) */}
          <Link 
            to={contestStatus.link} 
            className="w-full sm:w-auto relative group bg-[#b4ff00] text-black font-display font-black italic uppercase tracking-widest px-10 py-5 hover:bg-white transition-all duration-300 text-lg hover:scale-105 shadow-[0_0_25px_rgba(180,255,0,0.3)] flex items-center justify-center gap-3"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
            </span>
            <span>{contestStatus.title}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 2. 공식 스토어 (준비중 안내) */}
          <Link 
            to="/store" 
            className="w-full sm:w-auto relative group bg-transparent text-white/90 border border-white/20 font-sans font-bold uppercase tracking-widest px-8 py-5 hover:border-white/50 hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2.5 text-base"
          >
            <ShoppingBag size={16} className="text-white/60 group-hover:text-white transition-colors" />
            <span>공식 스토어</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10 uppercase tracking-normal">
              준비중
            </span>
          </Link>

        </div>
      </div>
    </section>
  );
}
