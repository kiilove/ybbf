import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero';
import Manifesto from '../components/home/Manifesto';
import HorizontalGallery from '../components/home/HorizontalGallery';
import LegendHighlight from '../components/home/LegendHighlight';
import YouthPreview from '../components/home/YouthPreview';
import LegendPreview from '../components/home/LegendPreview';
import StoreSection from '../components/home/StoreSection';
import Partners from '../components/home/Partners';
import Socials from '../components/home/Socials';

export default function HomePage() {
  useEffect(() => {
    document.title = "YBBF | 용인시보디빌딩협회 공식 웹사이트";
  }, []);

  return (
    <>
      <Hero />
      
      {/* 2026 Competition Registration Banner */}
      <div className="bg-[#050505] pt-12 pb-6 px-6 md:px-16 relative">
        <Link
          to="/competition"
          className="max-w-7xl mx-auto block bg-[#0a0a0a] border border-white/5 hover:border-white/15 rounded-2xl p-8 md:p-12 relative overflow-hidden transition-all duration-300 group cursor-grow"
        >
          {/* Subtle background radial gradient glow on hover */}
          <div className="absolute inset-0 bg-radial-gradient from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase font-mono">
                  Registration Now Open
                </span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black italic uppercase tracking-tight text-white leading-tight">
                제9회 용인특례시 협회장배 <br className="sm:hidden" />
                <span className="text-accent">보디빌딩 및 피트니스 대회</span>
              </h3>
              
              <p className="text-sm text-white/50 leading-relaxed font-sans max-w-2xl">
                올해의 가장 뜨거운 무대, 한계를 극복하고 챔피언의 자리에 도전할 선수를 모집합니다. <br className="hidden md:inline" />
                온라인 참가 신청서 접수가 현재 진행 중입니다.
              </p>
            </div>
            
            <div className="shrink-0 self-start lg:self-auto">
              <span className="inline-flex items-center gap-3 border border-white/15 text-white hover:text-black hover:bg-accent hover:border-accent px-6 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 group-hover:scale-105">
                참가 접수 신청하기
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 2026 Competition Music Pre-Release Banner */}
      <div className="bg-[#050505] pt-6 pb-12 px-6 md:px-16 border-b border-white/5 relative">
        <a
          href="https://www.vibeflows.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-7xl mx-auto block bg-[#0a0a0a] border border-white/5 hover:border-white/15 rounded-2xl p-8 md:p-12 relative overflow-hidden transition-all duration-300 group cursor-grow"
        >
          {/* Subtle background radial gradient glow on hover */}
          <div className="absolute inset-0 bg-radial-gradient from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase font-mono">
                  Official Soundtrack Pre-release
                </span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black italic uppercase tracking-tight text-white leading-tight">
                YBBF 2026대회 <br className="sm:hidden" />
                <span className="text-accent">음원 사전공개</span>
              </h3>
              
              <p className="text-sm text-white/50 leading-relaxed font-sans max-w-2xl">
                무대 위 선수의 완벽한 포징과 연출을 완성도 있게 빛내줄 YBBF 2026 공식 경기 배경음원 테마를 사전 공개합니다. <br className="hidden md:inline" />
                VIBEFLOWS 플랫폼에서 전용 음원을 선점하고 확인해 보세요.
              </p>
            </div>
            
            <div className="shrink-0 self-start lg:self-auto">
              <span className="inline-flex items-center gap-3 border border-white/15 text-white hover:text-black hover:bg-accent hover:border-accent px-6 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 group-hover:scale-105">
                공식 음원 확인하기
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </div>
          </div>
        </a>
      </div>

      <Manifesto />
      <HorizontalGallery />
      <LegendHighlight />
      <YouthPreview />
      <LegendPreview />
      <StoreSection />
      <Partners />
      <Socials />
    </>
  );
}
