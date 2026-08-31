import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WebGLHero from './WebGLHero';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ChevronLeft, ChevronRight, Trophy, Sparkles, Crown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// 다관왕(2관왕 이상) 스마트 통합 및 중복 챔피언 병합 함수
function formatSmartHeroPlayers(rawList: any[]): any[] {
  const map = new Map<string, any>();

  rawList.forEach((p) => {
    if (!p.heroImageUrl || p.heroImageUrl.includes('default-player-1')) return;
    if (p.heroName && (p.heroName.includes('김민균') || p.heroName.includes('KIM MIN-KYUN'))) return;

    const key = (p.heroName || '').trim();
    if (!key) return;

    const rawClass = (p.heroClass || '')
      .replace(/\(오버롤\)/g, '')
      .replace(/그랑프리/g, '')
      .replace(/\(\d+관왕\)/g, '')
      .trim();

    if (map.has(key)) {
      const existing = map.get(key);
      if (rawClass) {
        const parts = rawClass.split(/[·&,]/).map((s: string) => s.trim()).filter(Boolean);
        parts.forEach((part: string) => {
          if (!existing.classes.some((c: string) => c.includes(part) || part.includes(c))) {
            existing.classes.push(part);
          }
        });
      }
      
      const distinctCount = Math.max(existing.classes.length, 2);
      existing.crownCount = distinctCount;
      existing.isMultiCrown = distinctCount >= 2;
      existing.crownBadge = `👑 ${distinctCount}관왕`;
      existing.heroClass = `${existing.classes.join(' · ')} (${distinctCount}관왕)`;
      existing.heroTitles = `2026 제9회 용인특례시 보디빌딩대회 ${existing.classes.join(' & ')} ${distinctCount}관왕 오버롤 그랑프리`;
      
      if (!existing.stagePhoto2 && (p.stagePhoto1 || p.stagePhoto2 || p.heroImageUrl)) {
        existing.stagePhoto2 = p.stagePhoto2 || p.stagePhoto1 || p.heroImageUrl;
      }
    } else {
      let initialClasses: string[] = [];
      if (key === '김민경') {
        initialClasses = ['비키니', '여자 스포츠 모델'];
      } else if (rawClass) {
        initialClasses = rawClass.split(/[·&,]/).map((s: string) => s.trim()).filter(Boolean);
      }

      const isMulti = initialClasses.length >= 2;
      const count = isMulti ? initialClasses.length : 1;

      map.set(key, {
        ...p,
        heroClass: isMulti ? `${initialClasses.join(' · ')} (${count}관왕)` : p.heroClass,
        crownCount: count,
        isMultiCrown: isMulti,
        crownBadge: isMulti ? `👑 ${count}관왕` : 'GRAND PRIX',
        classes: initialClasses.length > 0 ? initialClasses : [rawClass || '보디빌딩']
      });
    }
  });

  return Array.from(map.values());
}

// 가중치 계산 함수 (일반부, 클래식 보디빌딩, 비키니에 기본 1 + 5 = 6 가중치 부여)
function getHeroWeight(hero: any): number {
  if (!hero) return 1;
  const name = hero.heroName || '';
  const cls = ((hero.heroClass || '') + ' ' + (hero.heroTitles || '')).toLowerCase();
  
  // 1. 일반부 보디빌딩 (강승민 등)
  if (
    name.includes('강승민') ||
    cls.includes('일반부') ||
    (cls.includes('보디빌딩') && !cls.includes('클래식') && !cls.includes('마스터즈') && !cls.includes('학생부'))
  ) {
    return 6;
  }
  // 2. 클래식 보디빌딩 (유용수 등)
  if (name.includes('유용수') || cls.includes('클래식')) {
    return 6;
  }
  // 3. 비키니 (김민경 등)
  if (name.includes('김민경') || cls.includes('비키니') || cls.includes('모노키니') || cls.includes('여자')) {
    return 6;
  }
  return 1;
}

function getWeightedRandomIndex(players: any[], excludeIndex = -1): number {
  if (!players || players.length === 0) return 0;
  if (players.length === 1) return 0;

  const weights = players.map((p, idx) => (idx === excludeIndex ? 0 : getHeroWeight(p)));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  if (totalWeight <= 0) return (excludeIndex + 1) % players.length;

  let rand = Math.random() * totalWeight;
  for (let i = 0; i < players.length; i++) {
    if (rand < weights[i]) return i;
    rand -= weights[i];
  }
  return 0;
}

const DEFAULT_HERO_PLAYERS = [
  {
    id: 'hero-gp-kang-seung-min',
    heroName: '강승민',
    heroClass: '일반부 보디빌딩 (오버롤)',
    heroHeight: '174',
    heroWeight: '87.5',
    heroGym: '무소속',
    heroTitles: '2026 제9회 용인특례시 보디빌딩대회 일반부 보디빌딩 오버롤 그랑프리 챔피언',
    stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg',
    stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973719285_Athlete_striking_bicep_pose_202608291221.jpeg',
    heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg',
  },
  {
    id: 'hero-gp-kim-min-kyeong',
    heroName: '김민경',
    heroClass: '비키니 · 스포츠 모델 (2관왕)',
    heroHeight: '',
    heroWeight: '',
    heroGym: '단단짐',
    heroTitles: '2026 제9회 용인특례시 보디빌딩대회 비키니 & 스포츠 모델 2관왕 오버롤 그랑프리',
    stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg',
    stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805673713_Athlete_holding_skateboard_2K_202608271340.jpeg',
    heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg',
    isMultiCrown: true,
    crownCount: 2,
    crownBadge: '👑 2관왕'
  },
  {
    id: 'hero-gp-yoo-yong-soo',
    heroName: '유용수',
    heroClass: '클래식 보디빌딩 (오버롤)',
    heroHeight: '178',
    heroWeight: '80',
    heroGym: '바디홀릭',
    heroTitles: '2026 제9회 용인특례시 보디빌딩대회 클래식 보디빌딩 오버롤 그랑프리 챔피언',
    stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg',
    stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973305284_Athlete_striking_bicep_pose_202608291214.jpeg',
    heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg',
  },
  {
    id: 'hero-gp-oh-geun-seok',
    heroName: '오근석',
    heroClass: '남자 스포츠 모델 (오버롤)',
    heroHeight: '175',
    heroWeight: '',
    heroGym: '피트니스 유 짐',
    heroTitles: '2026 제9회 용인특례시 보디빌딩대회 남자 스포츠 모델 오버롤 그랑프리 챔피언',
    stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_11bdba43-b80c-4689-9d12-664d09cdda6a/1787961920111_Athlete_performing_side_chest_pose_202608290905.jpeg',
    stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_11bdba43-b80c-4689-9d12-664d09cdda6a/1787961928630_Man_striking_bicep_pose_202608290905.jpeg',
    heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_11bdba43-b80c-4689-9d12-664d09cdda6a/1787961920111_Athlete_performing_side_chest_pose_202608290905.jpeg',
  },
  {
    id: 'hero-gp-kim-gwang-hyun',
    heroName: '김광현',
    heroClass: '마스터즈 보디빌딩 (오버롤)',
    heroHeight: '176',
    heroWeight: '82',
    heroGym: '팀 아틀라스',
    heroTitles: '2026 제9회 용인특례시 보디빌딩대회 마스터즈 보디빌딩 오버롤 그랑프리 챔피언',
    stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799286857_Muscular_man_flexing_abs_2K_202608271143.jpeg',
    stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799278717_Muscular_man_performing_bicep_pose_202608271143.jpeg',
    heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799286857_Muscular_man_flexing_abs_2K_202608271143.jpeg',
  },
  {
    id: 'hero-gp-han-soo-man',
    heroName: '한수만',
    heroClass: '마스터즈 보디빌딩 (오버롤)',
    heroHeight: '173',
    heroWeight: '',
    heroGym: '마들짐',
    heroTitles: '2026 제9회 용인특례시 보디빌딩대회 마스터즈 보디빌딩 오버롤 그랑프리 챔피언',
    stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8d58b957-cc21-4bf3-afed-6db41eeccd73/1787803994966_Bodybuilder_performing_side_ches…_2K_202608271312.jpeg',
    stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8d58b957-cc21-4bf3-afed-6db41eeccd73/1787804001699_Bodybuilder_performing_double-bi…_2K_202608271312.jpeg',
    heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8d58b957-cc21-4bf3-afed-6db41eeccd73/1787803994966_Bodybuilder_performing_side_ches…_2K_202608271312.jpeg',
  }
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { settings, fetchSettings } = useSettingsStore();
  
  // 초기 챔피언 및 포즈 선택
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [activePoseIndex, setActivePoseIndex] = useState(() => (Math.random() > 0.5 ? 1 : 0));
  const [isPaused, setIsPaused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // 스크롤 진행 여부 (스크롤 시 타이머 정지)
  const [timerKey, setTimerKey] = useState(0); // 10초 타이머 리셋용 키
  const isRandomized = useRef(false);

  // 초기 화면 요소
  const bottomBarRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 등장
  const champTextRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const rawHeroPlayers = (settings?.heroPlayers && settings.heroPlayers.length > 0) 
    ? settings.heroPlayers 
    : DEFAULT_HERO_PLAYERS;

  // 스마트 다관왕 통합 및 사진 있는 유효 챔피언 선별
  const heroPlayers = formatSmartHeroPlayers(rawHeroPlayers);

  // ⚡ 모든 챔피언 사진 브라우저 및 GPU 메모리 선행 프리로드 (롤링/전환 시 0ms 즉시 노출)
  useEffect(() => {
    if (heroPlayers.length > 0) {
      heroPlayers.forEach((player) => {
        const urls = [player.stagePhoto1, player.stagePhoto2, player.heroImageUrl].filter(Boolean);
        urls.forEach((url) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          if ('decode' in img) {
            img.decode().catch(() => {});
          }
        });
      });
    }
  }, [heroPlayers]);

  // D1 로드 시 일반부/클래식/비키니에 5배 가중치를 부여한 가중치 랜덤으로 초기 선택
  useEffect(() => {
    if (heroPlayers.length > 0 && !isRandomized.current) {
      const randHero = getWeightedRandomIndex(heroPlayers);
      const randPose = Math.random() > 0.5 ? 1 : 0;
      setSelectedHeroIndex(randHero);
      setActivePoseIndex(randPose);
      isRandomized.current = true;
    }
  }, [heroPlayers.length]);

  const safeIndex = heroPlayers.length > 0 ? (selectedHeroIndex % heroPlayers.length) : 0;
  const currentHero = heroPlayers[safeIndex] || heroPlayers[0] || rawHeroPlayers[0];

  // 현재 선수의 포즈 사진 목록
  const availablePoses = [
    currentHero.stagePhoto1 || currentHero.heroImageUrl,
    currentHero.stagePhoto2
  ].filter(Boolean);

  const activePhotoUrl = availablePoses[activePoseIndex] || availablePoses[0] || currentHero.heroImageUrl;

  /* ═══ ⏱️ 10초 간격 자동 챔피언 롤링 (가중치 기반 전환) ═══ */
  const isTimerActive = !isPaused && !isScrolled && heroPlayers.length > 1;

  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setSelectedHeroIndex((prev) => getWeightedRandomIndex(heroPlayers, prev));
      setActivePoseIndex((prev) => (prev === 0 ? 1 : 0));
      setTimerKey((k) => k + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [isTimerActive, heroPlayers, timerKey]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      /* ═══ 1. 인트로 애니메이션 ═══ */
      const intro = gsap.timeline({ delay: 0.3 });

      intro.fromTo(bottomBarRef.current,
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' }
      );

      /* ═══ 2. 스크롤 애니메이션 ═══ */
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            // 스크롤이 시작되면(progress > 0.01) 타이머 즉시 정지
            setIsScrolled(self.progress > 0.01);
          },
          onLeaveBack: () => {
            // 맨 위로 돌아오면 타이머 재개
            setIsScrolled(false);
          }
        }
      });

      // 텍스트 패럴랙스 (배경 이미지보다 빠르게 위로 올라가는 효과)
      scrollTl.fromTo(champTextRef.current,
        { scale: 1.2, opacity: 0, filter: 'blur(25px)' },
        { scale: 1, opacity: 0.15, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' },
        0.2
      );

      // 프로필 등장 (하단 네비게이션과 겹치지 않게 pb-24 확보)
      scrollTl.fromTo(profileContainerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.1 },
        0.35
      );

      statRefs.current.forEach((stat, i) => {
        if (!stat) return;
        scrollTl.fromTo(stat,
          { y: 60, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' },
          { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power4.out' },
          0.4 + i * 0.08
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const handlePrevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHeroIndex((prev) => (prev > 0 ? prev - 1 : heroPlayers.length - 1));
    setTimerKey((k) => k + 1);
  };

  const handleNextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHeroIndex((prev) => (prev < heroPlayers.length - 1 ? prev + 1 : 0));
    setTimerKey((k) => k + 1);
  };

  return (
    <div className="hero-wrapper">
      <section
        ref={sectionRef}
        className="relative h-screen overflow-hidden bg-[#030306]"
        style={{
          '--hero-text': '#ffffff',
          '--hero-muted': 'rgba(255,255,255,0.7)',
          '--hero-border': 'rgba(255,255,255,0.15)',
          color: 'var(--hero-text)'
        } as React.CSSProperties}
      >
        {/* ═══ LAYER 0: WebGL (실시간 웨이브 + 선택된 챔피언/포즈 텍스처) ═══ */}
        <WebGLHero imageUrl={activePhotoUrl} />

        {/* ═══ LAYER 1: 하단 상시 노출 네비게이션 컨트롤러 ═══ */}
        <div
          ref={bottomBarRef}
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ zIndex: 40 }}
        >
          <div className="flex items-center justify-between px-6 md:px-14 py-5 border-t border-white/10 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
            
            {/* 챔피언 & 포즈 컨트롤러 (마우스 호버 또는 스크롤 시 10초 타이머 일시정지) */}
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="relative overflow-hidden flex items-center justify-between gap-3 pointer-events-auto bg-black/80 backdrop-blur-md px-4 md:px-5 py-2 rounded-full border border-white/15 shadow-[0_4px_25px_rgba(0,0,0,0.6)] min-w-[300px] sm:min-w-[460px] md:min-w-[580px]"
            >
              {/* 10초 카운트다운 게이지 바 (스크롤 중에는 멈춤) */}
              {isTimerActive && (
                <div 
                  key={timerKey}
                  className="absolute bottom-0 left-0 h-[2px] bg-[#b4ff00] shadow-[0_0_8px_#b4ff00] animate-[heroProgress_10s_linear_forwards]"
                  style={{ width: '100%' }}
                />
              )}

              {/* LEFT: 뱃지 (2관왕 이상은 전용 골드 크라운 뱃지 노출) */}
              {currentHero.isMultiCrown ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/25 via-amber-500/35 to-yellow-500/25 border border-yellow-400/80 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)] shrink-0">
                  <Crown size={14} className="text-yellow-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-black tracking-wider uppercase">
                    {currentHero.crownBadge || '👑 2관왕'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-yellow-400 shrink-0">
                  <Trophy size={15} className="animate-pulse text-yellow-400" />
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-yellow-400 hidden sm:inline">
                    GRAND PRIX
                  </span>
                </div>
              )}

              <div className="h-3.5 w-px bg-white/20 shrink-0" />

              {/* CENTER: 선수 이름 & 종목 (flex-1로 영역 고정하여 버튼 위치 불변 보장) */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                <span className="text-xs font-black text-white tracking-wide shrink-0">
                  {currentHero.heroName}
                </span>
                <span className="text-[11px] text-white/70 truncate font-medium">
                  · {currentHero.heroClass}
                </span>
              </div>

              {/* RIGHT: POSE 1/2 토글 + 인덱스 + 화살표 버튼 (위치 완벽 고정) */}
              <div className="flex items-center gap-2 shrink-0">
                {/* 📸 POSE 1 / 2 토글 버튼 */}
                {availablePoses.length > 1 && (
                  <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-full border border-white/15">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActivePoseIndex(0); setTimerKey(k => k + 1); }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                        activePoseIndex === 0 
                          ? 'bg-[#b4ff00] text-black shadow-[0_0_10px_rgba(180,255,0,0.5)]' 
                          : 'text-white/70 hover:text-white'
                      }`}
                      title="무대 컷 1 (Side/Chest)"
                    >
                      POSE 1
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActivePoseIndex(1); setTimerKey(k => k + 1); }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                        activePoseIndex === 1 
                          ? 'bg-[#b4ff00] text-black shadow-[0_0_10px_rgba(180,255,0,0.5)]' 
                          : 'text-white/70 hover:text-white'
                      }`}
                      title="무대 컷 2 (Biceps/Abs)"
                    >
                      POSE 2
                    </button>
                  </div>
                )}

                {/* 이전 / 다음 챔피언 넘김 */}
                <div className="flex items-center gap-1 border-l border-white/20 pl-2">
                  <span className="text-[10px] font-mono font-bold text-[#b4ff00] w-6 text-center">
                    {safeIndex + 1}/{heroPlayers.length}
                  </span>
                  <button 
                    onClick={handlePrevHero} 
                    className="p-1 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                    title="이전 챔피언"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button 
                    onClick={handleNextHero} 
                    className="p-1 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                    title="다음 챔피언"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* SNS 링크 */}
            <div className="flex items-center gap-5">
              {['IG', 'YT', 'FB'].map(label => (
                <span 
                  key={label} 
                  className="text-xs font-mono tracking-widest text-white/50 hover:text-[#b4ff00] transition-colors cursor-pointer pointer-events-auto"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ LAYER 3: "GRAND PRIX" 배경 텍스트 (스크롤 시 등장) ═══ */}
        <div
          ref={champTextRef}
          className="absolute inset-0 flex items-center justify-center px-4 md:px-8 pointer-events-none opacity-0"
          style={{ zIndex: 5 }}
        >
          <p className="text-[clamp(44px,16vw,290px)] font-display font-black italic uppercase tracking-tighter text-white whitespace-nowrap mix-blend-overlay select-none">
            GRAND PRIX
          </p>
        </div>

        {/* ═══ LAYER 4: 방송사 스타일 프로필 (스크롤 시 등장, 하단 네비게이션과 안 겹치게 pb-24) ═══ */}
        <div
          ref={profileContainerRef}
          className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-24 md:pb-28 px-6 md:px-14 invisible"
          style={{ zIndex: 20 }}
        >
          <div className="w-full max-w-7xl mx-auto">

            {/* 선수 이름 + LIVE 뱃지 */}
            <div ref={el => { statRefs.current[0] = el; }} className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
                <p className="text-[#b4ff00] font-mono font-bold tracking-[0.35em] text-[10px] md:text-xs uppercase flex items-center gap-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  <Sparkles size={12} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" /> 
                  {currentHero.isMultiCrown ? `👑 ${currentHero.crownCount || 2}관왕 DOUBLE GRAND PRIX CHAMPION` : 'OVERALL GRAND PRIX CHAMPION'}
                </p>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black italic uppercase tracking-tight text-white leading-[0.88] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {currentHero.heroName.toUpperCase()}
              </h2>
            </div>

            {/* 스탯 가로 배치 */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5 md:gap-12">
              <div ref={el => { statRefs.current[1] = el; }}>
                <p className="text-white/70 font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  Class
                </p>
                <p className="text-xl md:text-3xl font-display font-black italic text-white tracking-wider uppercase drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                  {currentHero.heroClass}
                </p>
              </div>

              <div ref={el => { statRefs.current[2] = el; }} className="flex gap-6">
                <div>
                  <p className="text-white/70 font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    Height
                  </p>
                  <p className="text-xl md:text-3xl font-display font-black italic text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                    {currentHero.heroHeight ? (
                      <>{currentHero.heroHeight}<span className="text-sm text-[#b4ff00] ml-0.5">CM</span></>
                    ) : (
                      <span className="text-white/40 font-mono text-base">-</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    Weight
                  </p>
                  <p className="text-xl md:text-3xl font-display font-black italic text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                    {currentHero.heroWeight ? (
                      <>{currentHero.heroWeight}<span className="text-sm text-[#b4ff00] ml-0.5">KG</span></>
                    ) : (
                      <span className="text-white/40 font-mono text-base">-</span>
                    )}
                  </p>
                </div>
              </div>

              <div ref={el => { statRefs.current[3] = el; }}>
                <p className="text-[#b4ff00] font-mono tracking-[0.3em] text-[9px] uppercase font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  Affiliation
                </p>
                <p className="text-xl md:text-3xl font-display font-black italic text-white tracking-wider drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                  {currentHero.heroGym || '용인시 보디빌딩협회'}
                </p>
              </div>
            </div>

            {/* 수상 이력 */}
            <div ref={el => { statRefs.current[4] = el; }} className="mt-5 pt-3 border-t border-white/20 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
              <p className="text-white/70 font-mono tracking-[0.3em] text-[9px] uppercase mb-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Titles
              </p>
              <p className="text-base md:text-xl font-display italic text-white tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                {currentHero.heroTitles}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
