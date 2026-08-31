import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  Trophy, 
  MapPin, 
  Zap, 
  Flame, 
  User, 
  Activity,
  RotateCcw
} from 'lucide-react';
import { RegistrationPayload } from '../../types/registration';
import { THEME_CONFIGS } from './themeConfig';
import './AthleteIntroScene.css';

interface AthleteIntroSceneProps {
  player: RegistrationPayload;
  selectedJoinIndex?: number;
  colorTheme?: string;
  isFullscreen?: boolean;
  onReplay?: () => void;
}

export function AthleteIntroScene({
  player,
  selectedJoinIndex = 0,
  colorTheme = 'GOLD',
  isFullscreen = false,
  onReplay,
}: AthleteIntroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const bgPhotoRef = useRef<HTMLImageElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const numberBadgeRef = useRef<HTMLDivElement>(null);
  const gymBadgeRef = useRef<HTMLDivElement>(null);

  const theme = THEME_CONFIGS[colorTheme] || THEME_CONFIGS.GOLD;

  const {
    playerName = '',
    playerGym = '',
    stagePhoto1,
    stagePhoto2,
    publicStagePhoto1,
    publicStagePhoto2,
    joins,
    contestTitle = '제9회 용인특례시 협회장배 보디빌딩대회',
  } = player || {};

  // 선택된 출전 종목 추출
  const currentJoin = (joins && joins.length > selectedJoinIndex) 
    ? joins[selectedJoinIndex] 
    : ((joins && joins.length > 0) ? joins[0] : null);

  const catTitle = currentJoin?.contestCategoryTitle || '공식 종목';
  const grdTitle = currentJoin?.contestGradeTitle || 'OPEN';

  // 1번 사진: 전면 히어로 컷 (stagePhoto1 또는 publicStagePhoto1)
  const heroPhoto = stagePhoto1 || publicStagePhoto1 || player?.playerPhotoUrl || '';
  // 2번 사진: 16:9 와이드 배경 컷 (stagePhoto2 또는 publicStagePhoto2)
  const rawBgPhoto = stagePhoto2 || publicStagePhoto2 || '';
  const bgPhoto = rawBgPhoto && rawBgPhoto !== heroPhoto ? rawBgPhoto : '';

  // 선수 배부 번호 (ENTRY NO) 다중 안전 추출 로직 (선택된 종목 번호 우선)
  const getResolvedPlayerNumber = (): string => {
    // 1. 현재 선택된 종목(join)의 개별 배부번호
    if (currentJoin) {
      const jNum = (currentJoin as any)?.playerNumber || (currentJoin as any)?.entryNo || (currentJoin as any)?.playerNo || (currentJoin as any)?.playerIndex;
      if (jNum !== undefined && jNum !== null && String(jNum).trim() !== '') {
        return String(jNum).trim();
      }
    }

    // 2. 등록 전체에 지정된 공통 배부번호
    const explicitNum = 
      player?.playerNumber ||
      (player as any)?.playerNo ||
      (player as any)?.entryNo ||
      (player as any)?.entryNumber ||
      (player as any)?.bibNumber ||
      (player as any)?.playerIndex ||
      (player as any)?.number;

    if (explicitNum !== undefined && explicitNum !== null && String(explicitNum).trim() !== '') {
      return String(explicitNum).trim();
    }

    // 3. 인보이스 ID 또는 playerUid에서 안정적인 고유 숫자 추출 (선택 종목 오프셋 반영)
    const rawId = player?.id || (player as any)?.playerUid || (player as any)?.createBy || '';
    const digitsOnly = rawId.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 2) {
      const baseNum = parseInt(digitsOnly.slice(-2), 10);
      const calculated = (baseNum < 10 ? baseNum + 10 : baseNum) + selectedJoinIndex * 15;
      return String(calculated);
    }

    // 4. 기본 공식 배부번호 Fallback
    return String(100 + selectedJoinIndex * 20);
  };

  const resolvedNumber = getResolvedPlayerNumber();
  const formattedNumStr = resolvedNumber.toUpperCase().startsWith('NO.') ? resolvedNumber : `NO.${resolvedNumber}`;
  const numberChars = formattedNumStr.split('');
  const nameChars = playerName ? playerName.split('') : ['선', '수'];

  // 🎬 GSAP 타격감 인트로 타임라인
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.set(flashRef.current, { opacity: 1, backgroundColor: '#ffffff' });
      if (bgPhotoRef.current) {
        gsap.set(bgPhotoRef.current, { opacity: 0 });
      }
      gsap.set(heroImageRef.current, { opacity: 0 });
      gsap.set(numberBadgeRef.current, { opacity: 0, scale: 2.2, rotationY: -60, transformPerspective: 900 });

      gsap.set('.num-digit', { opacity: 0, scale: 2.5, y: -60 });
      gsap.set('.name-char', { opacity: 0, scale: 2.5, y: 50, filter: 'blur(15px)' });
      gsap.set(gymBadgeRef.current, { opacity: 0, x: -80 });
      gsap.set('.bio-card-item', { opacity: 0, scale: 0.8, y: 40, filter: 'blur(8px)' });
      gsap.set('.bar-elem', { opacity: 0, y: (i) => (i === 0 ? -30 : 30) });
      gsap.set('.laser-line', { scaleX: 0, transformOrigin: 'left center' });

      // ⚡ [0.00s] 화면 플래시 폭발 + 공식 방송 바 슬라이드
      tl.to(flashRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);
      tl.to('.bar-elem', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.05);

      // 🎬 [0.10s] 16:9 와이드 배경 컷 안정적인 페이드인
      if (bgPhotoRef.current) {
        tl.to(bgPhotoRef.current, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.10);
      }

      // 💥 [0.15s] 3:4 메인 히어로 컷 페이드인
      tl.to(heroImageRef.current, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.15);

      // 🎲 [0.40s] 배부번호 3D 스탬핑 쾅!
      tl.to(numberBadgeRef.current, { opacity: 1, scale: 1, rotationY: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' }, 0.40);
      tl.to('.num-digit', { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'back.out(2.0)' }, 0.50);

      // 레이저 라인
      tl.to('.laser-line', { scaleX: 1, duration: 0.5, ease: 'power4.out' }, 0.70);

      // 💥 [0.80s] 선수 이름 글자별 타격 리빌
      tl.to('.name-char', { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.18, ease: 'back.out(2.2)' }, 0.80);

      // 🏢 [1.45s] 소속 헬스장 슬라이드
      tl.to(gymBadgeRef.current, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 1.45);

      // 📊 [1.70s] BIO 스펙 순차 팝업
      tl.to('.bio-card-item', { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.4, stagger: 0.14, ease: 'back.out(1.6)' }, 1.70);

    }, containerRef);

    return () => ctx.revert();
  }, [player, selectedJoinIndex, colorTheme]);

  // 🫧 3D 다이내믹 라이트 버블 & 파티클 엔진
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const bubbleCount = 90;
    const bubbles = Array.from({ length: bubbleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height + 100),
      vx: (Math.random() - 0.5) * 0.6,
      vy: -Math.random() * 2.0 - 0.8,
      size: Math.random() * 4.5 + 1.2,
      alpha: Math.random() * 0.65 + 0.25,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      color: Math.random() > 0.35 ? theme.particleRgb1 : theme.particleRgb2,
    }));

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(time * 1.5 + p.y * 0.018) * 0.8;
        p.alpha += Math.sin(time * p.pulseSpeed * 10) * 0.015;

        if (p.y < -30) {
          p.y = height + Math.random() * 40;
          p.x = Math.random() * width;
          p.alpha = Math.random() * 0.65 + 0.25;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.beginPath();
        
        const grad = ctx.createRadialGradient(
          p.x - p.size * 0.32,
          p.y - p.size * 0.32,
          p.size * 0.08,
          p.x,
          p.y,
          p.size
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.6)})`);
        grad.addColorStop(0.35, `rgba(${p.color}, ${Math.min(1, p.alpha * 0.95)})`);
        grad.addColorStop(0.85, `rgba(${p.color}, ${Math.min(1, p.alpha * 0.35)})`);
        grad.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = `rgba(${p.color}, 0.85)`;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#050805] text-white select-none flex flex-col justify-between transition-all duration-300 ${
        isFullscreen
          ? 'w-screen h-screen min-h-screen rounded-none border-0 shadow-none'
          : 'min-h-[560px] rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl'
      }`}
    >
      {/* 1. 16:9 와이드 배경 사진 블렌딩 */}
      {bgPhoto && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <img
            ref={bgPhotoRef}
            src={bgPhoto}
            alt="16:9 무대 배경"
            className="w-full h-full object-cover filter brightness-95 contrast-105 bg-photo-cinematic-blend opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 pointer-events-none" />
        </div>
      )}

      {/* 2. 캔버스 파티클 */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" />

      {/* 3. 화면 충격파 플래시 */}
      <div ref={flashRef} className="absolute inset-0 z-40 pointer-events-none bg-white" />

      {/* 4. 상단 공식 대회 헤더 바 */}
      <div className="bar-elem relative z-20 flex items-center justify-between px-6 sm:px-10 pt-5 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${theme.badgeBg} border backdrop-blur-2xl font-black text-[10px] sm:text-xs tracking-widest uppercase shadow-lg`}>
            <div className="flex items-end gap-0.5 h-3.5 mr-1">
              <span className="w-0.5 bg-current rounded-full eq-bar-1" />
              <span className="w-0.5 bg-current rounded-full eq-bar-2" />
              <span className="w-0.5 bg-current rounded-full eq-bar-3" />
              <span className="w-0.5 bg-current rounded-full eq-bar-4" />
            </div>
            <span>OFFICIAL STAGE SPOTLIGHT</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
          <h2 className="text-base sm:text-xl font-black text-slate-100 tracking-tight m-0 uppercase hidden sm:flex items-center gap-2">
            <span>{catTitle}</span>
            {grdTitle && <span className={`${theme.primary} font-mono`}>{grdTitle}</span>}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 bg-black/80 backdrop-blur-2xl px-4 py-2 rounded-xl border border-white/15 shadow-2xl">
          <Trophy className={`${theme.primary} w-4 h-4`} />
          <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase">
            LIVE ATHLETE INTRO
          </span>
        </div>
      </div>

      {/* 5. 메인 인물 포징 & BIO 콘텐츠 뷰 */}
      <div className="relative z-10 w-full flex-1 flex items-end px-6 sm:px-10 pb-6 overflow-hidden">
        
        {/* 우측: 3:4 전면 메인 히어로 컷 (타원 래디얼 마스크 + 아나모픽 렌즈 플레어) */}
        {heroPhoto && (
          <div className="absolute right-0 bottom-0 top-0 w-[55%] sm:w-[50%] flex items-center justify-center z-10 pointer-events-none">
            {/* 뒤쪽 3D 테마 글로우 */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none"
              style={{ backgroundColor: theme.glowRgba }}
            />

            {/* 아나모픽 렌즈 플레어 */}
            <div
              className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[3px] pointer-events-none animate-anamorphic-flare z-0"
              style={{
                background: `linear-gradient(to right, transparent, ${theme.shockColor}, #ffffff, ${theme.shockColor}, transparent)`,
                boxShadow: `0 0 24px 2px ${theme.laserShadow}`,
              }}
            />

            {/* 인물 사진 타원형 마스킹 */}
            <div
              ref={heroWrapperRef}
              className="relative h-[78%] sm:h-[85%] aspect-[3/4] flex items-center justify-center z-10"
              style={{
                maskImage: 'radial-gradient(ellipse 45% 48% at 50% 50%, #000000 0%, #000000 30%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.08) 86%, transparent 94%)',
                WebkitMaskImage: 'radial-gradient(ellipse 45% 48% at 50% 50%, #000000 0%, #000000 30%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.08) 86%, transparent 94%)',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
              }}
            >
              <img
                ref={heroImageRef}
                src={heroPhoto}
                alt={playerName}
                className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-105"
              />
            </div>
          </div>
        )}

        {/* 좌측: 선수 핵심 BIO 영역 */}
        <div className={`space-y-3.5 sm:space-y-4 w-full ${heroPhoto ? 'max-w-[55%] sm:max-w-[50%]' : 'max-w-lg'} z-20`}>
          
          {/* ① 배부번호 3D 스탬핑 */}
          <div
            ref={numberBadgeRef}
            className={`inline-flex items-center gap-3 bg-gradient-to-r ${theme.bgGradient} border-l-4 rounded-r-2xl pl-3.5 pr-5 ${theme.border} py-1.5 backdrop-blur-2xl shadow-2xl`}
          >
            <div className="flex flex-col">
              <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${theme.primary}`}>
                ENTRY NO
              </span>
              <span className="text-[10px] text-slate-300 font-bold">배부번호</span>
            </div>

            <div className={`flex items-center font-mono font-black text-3xl sm:text-5xl tracking-tighter ${theme.primary} neon-number-glow`}>
              {numberChars.map((digit, i) => (
                <span key={i} className="num-digit inline-block">
                  {digit}
                </span>
              ))}
            </div>
          </div>

          {/* 레이저 라인 */}
          <div
            className="laser-line h-[2px] w-full"
            style={{
              background: `linear-gradient(to right, ${theme.shockColor}, transparent)`,
              boxShadow: `0 0 12px ${theme.laserShadow}`,
            }}
          />

          {/* ② 이름 글자별 타격 리빌 */}
          <div className="space-y-0.5">
            <div className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <User className={`${theme.primary} w-3.5 h-3.5`} />
              <span>ATHLETE NAME</span>
            </div>
            
            <div className="flex items-center gap-1 flex-wrap">
              {nameChars.map((char, i) => (
                <span
                  key={i}
                  className={`name-char inline-block text-4xl sm:text-6xl font-black tracking-tighter leading-none m-0 uppercase drop-shadow-[0_15px_40px_rgba(0,0,0,0.95)] ${theme.titleClass}`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* ③ 소속 헬스장 */}
          <div
            ref={gymBadgeRef}
            className="flex items-center gap-2.5 text-base sm:text-xl text-slate-100 font-black"
          >
            <div className={`p-1.5 sm:p-2 rounded-xl bg-white/10 border ${theme.border50} ${theme.primary} shadow-xl`}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="break-keep font-black tracking-tight drop-shadow-md">
              {playerGym || '무소속 / 개인 출전'}
            </span>
          </div>

          {/* ④ BIO 스펙 순차 팝업 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 w-full">
            <div className={`bio-card-item bg-black/80 backdrop-blur-2xl border ${theme.border40} rounded-xl p-2.5 shadow-xl`}>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">
                CATEGORY
              </span>
              <span className={`text-xs sm:text-sm font-black truncate block ${theme.specText}`}>
                {catTitle}
              </span>
            </div>

            <div className={`bio-card-item bg-black/80 backdrop-blur-2xl border ${theme.border40} rounded-xl p-2.5 shadow-xl`}>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">
                CLASS
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-200 truncate block">
                {grdTitle}
              </span>
            </div>

            <div className={`bio-card-item bg-black/80 backdrop-blur-2xl border ${theme.border40} rounded-xl p-2.5 shadow-xl col-span-2 sm:col-span-1`}>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">
                STAGE STATUS
              </span>
              <span className="text-xs font-black text-[#10b981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                POSING READY
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 6. 하단 공식 라이브 상태 바 & 컨트롤 */}
      <div className="bar-elem relative z-20 border-t border-white/10 px-6 sm:px-10 py-3 bg-black/90 backdrop-blur-2xl flex items-center justify-between text-[11px] text-slate-400 font-bold">
        <div className="flex items-center gap-2">
          <Zap className={`${theme.primary} w-3.5 h-3.5`} />
          <span className="truncate max-w-[200px] sm:max-w-none">{contestTitle} • LIVE STAGE</span>
        </div>

        <div className="flex items-center gap-3">
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>다시 재생</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className={`${theme.primary} font-black tracking-widest uppercase`}>
              STAGE ON AIR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
