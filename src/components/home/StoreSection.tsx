import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

export default function StoreSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Stagger fade up for texts and images
      gsap.from('.store-reveal', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
    }, containerRef);

    // Subtle Parallax for store images
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 20;
      const y = (e.clientY / innerHeight - 0.5) * 20;

      gsap.to('.store-img', {
        x: x,
        y: y,
        duration: 1,
        ease: 'power2.out',
        stagger: 0.05,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section ref={containerRef} className="py-24 md:py-40 px-6 md:px-16 bg-bg-secondary overflow-hidden">
      <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
        
        {/* Left: Text Content */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-8">
          <p className="store-reveal text-[10px] font-bold tracking-[0.2em] uppercase text-accent">YBBF 스토어</p>
          <h2 className="store-reveal text-display text-[clamp(48px,6vw,100px)] leading-[0.85] font-black italic uppercase tracking-tighter">
            오직 <br className="hidden md:inline" />
            최고만을 위한 <br className="hidden md:inline" />
            기어
          </h2>
          <p className="store-reveal text-text-muted font-sans font-bold text-[14px] leading-relaxed max-w-md">
            YBBF 공식 굿즈, 트레이닝 기어, 파트너 로고웨어. 무대의 영광을 일상으로 가져오세요.
          </p>
          <div className="store-reveal mt-4">
            <Link to="/store" className="inline-flex items-center justify-between gap-4 p-4 px-8 border border-accent bg-transparent hover:bg-accent hover:text-black transition-colors cursor-grow rounded-2xl">
              <span className="text-xs font-black tracking-widest uppercase">스토어 둘러보기</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Right: Offset Grid */}
        <div className="lg:col-span-7 relative min-h-[60vh] md:min-h-[80vh] flex items-center justify-center">
          <div className="absolute inset-0 grid grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col gap-4 md:gap-8 justify-end translate-y-[-10%]">
              <img src="https://picsum.photos/400/500?random=51" alt="Store 1" className="store-reveal store-img w-full rounded-2xl border border-white/10 object-cover aspect-[4/5] bg-white/5" loading="lazy" />
              <img src="https://picsum.photos/400/600?random=52" alt="Store 2" className="store-reveal store-img w-[80%] ml-auto rounded-2xl border border-white/10 object-cover aspect-[2/3] bg-white/5" loading="lazy" />
            </div>
            <div className="flex flex-col gap-4 md:gap-8 justify-start translate-y-[10%]">
              <img src="https://picsum.photos/400/600?random=53" alt="Store 3" className="store-reveal store-img w-[90%] rounded-2xl border border-white/10 object-cover aspect-[2/3] bg-white/5" loading="lazy" />
              <img src="https://picsum.photos/400/400?random=54" alt="Store 4" className="store-reveal store-img w-full rounded-2xl border border-white/10 object-cover aspect-square bg-white/5" loading="lazy" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
