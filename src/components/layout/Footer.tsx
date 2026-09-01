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

    let isFooterVisible = false;

    // IntersectionObserver로 푸터가 뷰포트에 보일 때만 마우스 트래킹 활성화
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isFooterVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    // Handle dummy 360 trophy (mouse tracking for angles)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isFooterVisible || !helmetImageRef.current) return;
      const { innerWidth } = window;
      const x = e.clientX / innerWidth;
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
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };

  }, []);

  return (
    <footer ref={footerRef} className="bg-black text-[#ffffff] pt-32 pb-16 px-6 md:px-16 overflow-hidden relative border-t border-divider">
      <div className="max-w-7xl mx-auto flex flex-col">
        
        {/* Massive Slogan */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-divider pb-16 gap-8">
          <div className="footer-slogan font-display text-[clamp(40px,8vw,140px)] font-black leading-[0.85] tracking-tighter uppercase italic text-text-primary">
            BUILT FOR<br />
            <span className="text-accent">LEGENDS.</span>
          </div>

          {/* Interactive 3D/Angle Trophy Preview */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center p-4 border border-divider rounded-full bg-bg-secondary cursor-grab active:cursor-grabbing self-center lg:self-end">
            <div className="absolute top-4 text-[9px] font-mono tracking-widest text-[#ffffff]/40 uppercase animate-pulse">
              Drag / Move to Rotate
            </div>
            <img 
              ref={helmetImageRef}
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
              alt="YBBF Trophy Preview"
              className="w-3/4 h-3/4 object-contain filter drop-shadow-[0_10px_20px_rgba(204,255,0,0.2)]"
              style={{ transformStyle: 'preserve-3d' }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mt-16 pb-16 border-b border-divider font-sans font-bold text-[11px] tracking-widest text-[#ffffff]/60 uppercase">
          
          <div className="flex flex-col gap-4">
            <h4 className="text-[#ffffff] mb-2 font-black text-xs">페이지</h4>
            <Link to="/" className="hover:text-[#E5FF00] transition-colors">홈</Link>
            <Link to="/legends" className="hover:text-[#E5FF00] transition-colors">레전드</Link>
            <Link to="/media" className="hover:text-[#E5FF00] transition-colors">미디어</Link>
            <Link to="/youth" className="hover:text-[#E5FF00] transition-colors">YBBF 유스</Link>
            <Link to="/about" className="hover:text-[#E5FF00] transition-colors">협회 소개</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[#ffffff] mb-2 font-black text-xs">소셜 미디어</h4>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#E5FF00] transition-colors">인스타그램</a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#E5FF00] transition-colors">유튜브</a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#E5FF00] transition-colors">틱톡</a>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4">
            <h4 className="text-[#ffffff] mb-2 font-black text-xs">뉴스레터</h4>
            <form className="flex border-b border-white/10 w-full mt-2" onSubmit={(e) => { e.preventDefault(); alert('구독 신청이 접수되었습니다.'); }}>
              <input 
                type="email" 
                placeholder="이메일 주소" 
                className="w-full bg-transparent p-4 outline-none text-[#ffffff] placeholder:text-[#ffffff]/40"
              />
              <button type="submit" className="px-4 font-black hover:text-[#E5FF00] transition-colors shrink-0 cursor-pointer">구독하기 →</button>
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
            <button type="button" onClick={() => alert('용인시보디빌딩협회 개인정보처리방침에 따라 이용자의 개인정보는 안전하게 보호됩니다.')} className="hover:text-[#ffffff] transition-colors cursor-pointer">개인정보처리방침</button>
            <button type="button" onClick={() => alert('용인시보디빌딩협회 공식 웹 플랫폼 이용약관이 적용됩니다.')} className="hover:text-[#ffffff] transition-colors cursor-pointer">이용약관</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
