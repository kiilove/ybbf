import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ShoppingBag, ArrowLeft, HelpCircle } from 'lucide-react';

export default function StorePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Fade in animations
      gsap.fromTo(
        '.reveal-item',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );

      // Pulse effect for the glowing orb
      gsap.to('.glow-orb', {
        scale: 1.1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-bg-primary text-white flex flex-col justify-center items-center px-6 relative overflow-hidden pt-32 pb-16"
    >
      {/* Decorative Glow Orb */}
      <div className="glow-orb absolute w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-accent/5 blur-[80px] md:blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-xl w-full text-center flex flex-col items-center relative z-10">
        {/* Icon with glowing border */}
        <div className="reveal-item mb-8 relative">
          <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-bg-secondary border border-white/10 flex items-center justify-center text-accent drop-shadow-[0_0_15px_rgba(196,255,0,0.3)]">
            <ShoppingBag className="w-10 h-10" />
          </div>
        </div>

        {/* Subtitle / Category */}
        <span className="reveal-item text-[10px] font-mono font-bold tracking-[0.4em] uppercase text-accent mb-3 block">
          YBBF OFFICIAL STORE
        </span>

        {/* Title */}
        <h1 className="reveal-item text-[clamp(28px,4vw,42px)] leading-[1.25] font-black italic tracking-tighter uppercase mb-6">
          기능 <span className="text-accent">준비 중</span>입니다
        </h1>

        {/* Description */}
        <p className="reveal-item text-text-muted font-sans font-bold text-sm md:text-base leading-relaxed mb-8 max-w-md">
          용인시 보디빌딩협회 공식 스토어는 선수분들과 서포터즈분들을 위한
          고기능성 트레이닝 기어 및 공식 굿즈를 제공하기 위해 준비하고 있습니다.
          <br className="hidden md:inline" />
          더욱 세련된 상품과 완벽한 시스템으로 곧 찾아뵙겠습니다.
        </p>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="reveal-item inline-flex items-center gap-3 bg-white/5 hover:bg-accent hover:text-black border border-white/10 hover:border-accent p-4 px-8 rounded-2xl transition-all duration-300 font-bold text-xs tracking-wider cursor-grow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전 페이지로 돌아가기</span>
        </button>

        {/* Customer Support Info */}
        <div className="reveal-item mt-16 pt-8 border-t border-white/5 w-full flex items-center justify-center gap-2 text-[11px] font-sans font-bold text-text-muted">
          <HelpCircle className="w-3.5 h-3.5 text-accent" />
          <span>기타 문의 사항은 <a href="mailto:contact@ybbf.or.kr" className="text-white hover:text-accent underline transition-colors">contact@ybbf.or.kr</a>로 연락주세요.</span>
        </div>
      </div>
    </div>
  );
}
