import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

export default function Manifesto() {
  const quoteRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!quoteRef.current || !sectionRef.current) return;

    const split = new SplitType(quoteRef.current, { types: 'words' });

    const ctx = gsap.context(() => {
      gsap.from(split.words, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      });

    }, sectionRef);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-40 px-6 md:px-16 min-h-[70vh] flex flex-col justify-center">
      <div className="max-w-[1440px] mx-auto w-full relative">
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-text-muted mb-8">THE IRON ROOTS, THE FUTURE LEGENDS</p>
        
        <h3 ref={quoteRef} className="text-[clamp(24px,3.2vw,50px)] leading-[1.2] font-sans font-bold max-w-5xl tracking-tight text-white/60">
          정통 위에서 피어나는 <span className="text-accent font-black italic">가장 젊고 뜨거운 에너지</span>.<br className="hidden md:inline" />
          YBBF는 IFBB의 엄격한 규정 아래 가장 공정하고 압도적인 무대를 설계하며,<br className="hidden md:inline" />
          동시에 스스로 한계를 깨부수는 <span className="text-[#ffffff] font-black italic">유소년(Youth)의 폭발적인 미래</span>에 주목합니다.
        </h3>
      </div>
    </section>
  );
}
