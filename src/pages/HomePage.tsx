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
  console.log('[YBBF Debug] HomePage mounted/rendered.');

  useEffect(() => {
    document.title = "YBBF | 용인시보디빌딩협회 공식 웹사이트";
  }, []);

  return (
    <>
      <Hero />
      
      {/* 1. 2026 제9회 대회 공식 결과 발표 배너 */}
      <div className="bg-[#050505] pt-12 pb-5 px-6 md:px-16 relative">
        <Link
          to="/champions"
          className="max-w-7xl mx-auto block bg-gradient-to-r from-[#0d140e] via-[#090b09] to-[#0a0a0a] border border-[#b4ff00]/30 hover:border-[#b4ff00] rounded-2xl p-8 md:p-12 relative overflow-hidden transition-all duration-300 group cursor-grow shadow-[0_0_30px_rgba(180,255,0,0.08)]"
        >
          <div className="absolute inset-0 bg-radial-gradient from-[#b4ff00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b4ff00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b4ff00]"></span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-[#b4ff00] uppercase font-mono">
                  Official Results Announced
                </span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black italic uppercase tracking-tight text-white leading-tight">
                2026 제9회 용인특례시 협회장배 <br className="sm:hidden" />
                <span className="text-[#b4ff00]">대회 공식 심사 결과 발표</span>
              </h3>
              
              <p className="text-sm text-white/60 leading-relaxed font-sans max-w-2xl">
                44개 전 종목 및 체급 공식 순위표와 22인의 명예의 전당 챔피언 기록이 영구 공인되었습니다. <br className="hidden md:inline" />
                선수별 심사 총점, 순위표 및 수상 기록을 확인해 보세요.
              </p>
            </div>
            
            <div className="shrink-0 self-start lg:self-auto">
              <span className="inline-flex items-center gap-3 bg-[#b4ff00] text-black px-7 py-4 rounded-full text-xs font-mono font-black uppercase tracking-widest transition-all duration-300 group-hover:scale-105 shadow-[0_0_20px_rgba(180,255,0,0.3)]">
                공식 결과 & 순위표 보기
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 2. 2027 제10회 대회 사전 얼리버드 접수 배너 */}
      <div className="bg-[#050505] py-5 px-6 md:px-16 relative">
        <Link
          to="/competition/pre-register"
          className="max-w-7xl mx-auto block bg-[#0a0a0a] border border-white/10 hover:border-yellow-400/50 rounded-2xl p-8 md:p-12 relative overflow-hidden transition-all duration-300 group cursor-grow"
        >
          <div className="absolute inset-0 bg-radial-gradient from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-yellow-400 uppercase font-mono">
                  Next Generation Pre-Registration
                </span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black italic uppercase tracking-tight text-white leading-tight">
                2027 제10회 용인특례시 대회 <br className="sm:hidden" />
                <span className="text-yellow-400">사전 얼리버드 접수 & 알림</span>
              </h3>
              
              <p className="text-sm text-white/50 leading-relaxed font-sans max-w-2xl">
                대한민국 최고의 무대를 준비하는 차기 시즌 선수분들을 위한 사전 등록. <br className="hidden md:inline" />
                얼리버드 참가비 할인 혜택 및 공식 무대 음원 우선 선점권을 최우선 지원합니다.
              </p>
            </div>
            
            <div className="shrink-0 self-start lg:self-auto">
              <span className="inline-flex items-center gap-3 border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400 hover:text-black px-6 py-3.5 rounded-full text-xs font-mono font-black uppercase tracking-widest transition-all duration-300 group-hover:scale-105">
                2027 사전 접수하기
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. 2026 Competition Music Pre-Release Banner */}
      <div className="bg-[#050505] pt-5 pb-12 px-6 md:px-16 border-b border-white/5 relative">
        <a
          href="https://www.vibeflows.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-7xl mx-auto block bg-[#0a0a0a] border border-white/5 hover:border-white/15 rounded-2xl p-8 md:p-12 relative overflow-hidden transition-all duration-300 group cursor-grow"
        >
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
      {/* <StoreSection /> - 잠시 비활성화 */}
      <Partners />
      {/* <Socials /> - 최신 소셜 소식 잠시 비활성화 */}
    </>
  );
}
