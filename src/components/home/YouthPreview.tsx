import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function YouthPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="bg-bg-secondary">
      <section className="min-h-screen py-24 md:py-32 px-6 md:px-16 flex flex-col justify-center">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center">
          <div className="w-full aspect-[4/5] md:aspect-square relative overflow-hidden group">
            <div className="w-full md:w-[80%] h-full relative overflow-hidden rounded-2xl bg-white/5 border border-white/10">
              <img 
                src="https://picsum.photos/800/1000?random=32" 
                alt="Youth Preview Hero" 
                className="reveal-img-youth w-full h-full object-cover transition-transform duration-700 group-hover:-rotate-1 group-hover:scale-105 grayscale group-hover:grayscale-0"
                loading="lazy"
              />
            </div>
          </div>
          <div className="outline-row-youth flex flex-col justify-center items-start md:items-end text-left md:text-right">
            <p className="text-[10px] font-mono tracking-[0.2em] text-accent mb-4 uppercase">NEXT GENERATION</p>
            <h2 className="text-display text-[clamp(60px,10vw,160px)] leading-[0.8] font-black italic uppercase tracking-tighter outline-text mb-4">
              YBBF
            </h2>
            <h2 className="text-display text-[clamp(60px,10vw,160px)] leading-[0.8] font-black italic uppercase tracking-tighter outline-text mb-12">
              YOUTH
            </h2>
            <p className="text-sm md:text-lg text-text-muted font-sans font-bold leading-relaxed max-w-md mb-8">
              미래의 레전드를 위한 공식 유스 시스템. 용인시와 경기도를 대표할 다음 세대의 챔피언.
            </p>
            <a href="/youth" className="inline-flex items-center gap-3 px-6 py-3 border border-accent bg-transparent hover:bg-accent hover:text-black text-xs font-black tracking-widest uppercase rounded-full transition-colors">
              YBBF 유스 알아보기 →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
