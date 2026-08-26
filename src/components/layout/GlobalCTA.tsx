import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function GlobalCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/competition" 
            className="w-full sm:w-auto bg-accent text-black font-black italic uppercase tracking-widest px-10 py-5 hover:bg-white transition-all duration-300 text-lg hover:scale-105"
          >
            대회 참가 접수
          </Link>
          <Link 
            to="/store" 
            className="w-full sm:w-auto bg-transparent text-white border border-white/20 font-bold uppercase tracking-widest px-10 py-5 hover:border-white hover:bg-white/5 transition-all duration-300"
          >
            공식 스토어
          </Link>
        </div>
      </div>
    </section>
  );
}
