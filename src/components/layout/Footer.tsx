import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

export default function Footer() {
  const helmetImageRef = useRef<HTMLImageElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal slogan
      gsap.from('.footer-slogan', {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 80%',
        }
      });
    });

    // Handle dummy 360 trophy (mouse tracking for angles)
    const handleMouseMove = (e: MouseEvent) => {
      if (!helmetImageRef.current) return;
      const { innerWidth } = window;
      const x = e.clientX / innerWidth;
      
      // We don't have 360 frames, so we just pan/rotate slightly 
      // or swap out angle images if we had multiple.
      // Let's do a simple 3D rotation transform based on X pos.
      const rotateY = (x - 0.5) * 60; // -30 to 30 deg

      gsap.to(helmetImageRef.current, {
        rotationY: rotateY,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', handleMouseMove);
    };

  }, []);

  return (
    <footer ref={footerRef} className="bg-bg-primary pt-32 pb-8 px-6 md:px-16 overflow-hidden border-t border-divider text-sm">
      <div className="max-w-[1440px] mx-auto w-full relative">
        
        {/* Giant Slogan */}
        <h2 className="footer-slogan text-display text-[clamp(50px,8vw,120px)] leading-[0.85] font-black italic uppercase tracking-tighter text-center md:text-left mb-24 text-white/10">
          THE IRON <br />
          ROOTS, FUTURE <br />
          <span className="text-accent opacity-100">LEGENDS.</span>
        </h2>

        {/* 360 Trophy Area (Floating) */}
        <div className="md:absolute right-0 top-0 w-full md:w-[600px] h-[400px] flex justify-center items-center perspective-[1000px] pointer-events-none mb-16 md:mb-0">
          <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex justify-center items-center">
            {/* Dummy trophy image - using a generic placeholder that looks tall */}
            <img 
              ref={helmetImageRef}
              src="https://picsum.photos/400/600?random=81" 
              alt="YBBF Main Trophy" 
              className="w-full h-full object-cover rounded-2xl border border-white/10"
              style={{ transformStyle: 'preserve-3d' }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mt-16 pb-16 border-b border-divider font-sans font-bold text-[11px] tracking-widest text-[#ffffff]/60 uppercase">
          
          <div className="flex flex-col gap-4">
            <h4 className="text-[#ffffff] mb-2 font-black text-xs">페이지</h4>
            <a href="/" className="hover:text-[#E5FF00] transition-colors">홈</a>
            <a href="/legends" className="hover:text-[#E5FF00] transition-colors">레전드</a>
            <a href="/media" className="hover:text-[#E5FF00] transition-colors">미디어</a>
            <a href="/youth" className="hover:text-[#E5FF00] transition-colors">YBBF 유스</a>
            <a href="/about" className="hover:text-[#E5FF00] transition-colors">협회 소개</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[#ffffff] mb-2 font-black text-xs">팔로우</h4>
            <a href="#" className="hover:text-[#E5FF00] transition-colors">틱톡</a>
            <a href="#" className="hover:text-[#E5FF00] transition-colors">인스타그램</a>
            <a href="#" className="hover:text-[#E5FF00] transition-colors">유튜브</a>
            <a href="#" className="hover:text-[#E5FF00] transition-colors">트위치</a>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4">
            <h4 className="text-[#ffffff] mb-2 font-black text-xs">뉴스레터</h4>
            <form className="flex border-b border-white/10 w-full mt-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="이메일 주소" 
                className="w-full bg-transparent p-4 outline-none text-[#ffffff] placeholder:text-[#ffffff]/40"
              />
              <button className="px-4 font-black hover:text-[#E5FF00] transition-colors shrink-0">구독하기 →</button>
            </form>
            <a href="mailto:contact@ybbf.or.kr" className="mt-8 lowercase tracking-normal text-[#ffffff] hover:text-[#E5FF00] transition-colors">
              contact@ybbf.or.kr
            </a>
          </div>
        </div>

        {/* Meta Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4 text-[10px] font-bold tracking-[0.2em] uppercase text-[#ffffff]/40">
          <p>© 2026 YBBF. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#ffffff] transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-[#ffffff] transition-colors">이용약관</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
