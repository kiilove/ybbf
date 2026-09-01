import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CSSHero from './CSSHero';
// import WebGLHero from './WebGLHero'; // WebGL 비활성화 — CSS로 대체하여 모바일 즉시 반응
import { useSettingsStore } from '../../store/useSettingsStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface HeroPlayerItem {
  id: string;
  heroName: string;
  heroClass: string;
  heroHeight?: string;
  heroWeight?: string;
  heroGym?: string;
  heroTitles: string;
  stagePhoto1?: string;
  stagePhoto2?: string;
  heroImageUrl: string;
  isMultiCrown?: boolean;
  crownCount?: number;
  crownBadge?: string;
  classes?: string[];
  orderIndex?: number;
}

// 다관왕(2관왕 이상) 스마트 통합 및 어드민(4500번) 지정 노출 순서 100% 반영 함수
function formatSmartHeroPlayers(rawList: any[]): HeroPlayerItem[] {
  if (!rawList || rawList.length === 0) return [];

  const map = new Map<string, HeroPlayerItem>();
  const orderIndices = new Map<string, number>();

  rawList.forEach((p, idx) => {
    const key = (p.heroName || p.name || '').trim();
    if (!key) return;

    if (!orderIndices.has(key)) {
      orderIndices.set(key, p.orderIndex !== undefined ? p.orderIndex : idx);
    }

    const photo = p.heroImageUrl || p.stagePhoto1 || p.stagePhoto2 || '';
    const rawClass = (p.heroClass || '')
      .replace(/\(오버롤\)/g, '')
      .replace(/그랑프리/g, '')
      .replace(/\(\d+관왕\)/g, '')
      .trim();

    const parsedClasses = rawClass 
      ? rawClass.split(/[·&,]/).map((s: string) => s.trim()).filter(Boolean) 
      : [];

    if (map.has(key)) {
      const existing = map.get(key)!;
      if (parsedClasses.length > 0) {
        parsedClasses.forEach((part: string) => {
          if (!existing.classes?.some((c: string) => c.includes(part) || part.includes(c))) {
            existing.classes?.push(part);
          }
        });
      }
      
      const distinctCount = p.crownCount || existing.classes?.length || 1;
      existing.crownCount = distinctCount;
      existing.isMultiCrown = p.isMultiCrown !== undefined ? p.isMultiCrown : (distinctCount >= 2);
      existing.crownBadge = p.crownBadge || (distinctCount >= 2 ? `${distinctCount}관왕` : '');
      existing.heroClass = p.heroClass || (distinctCount >= 2 ? `${existing.classes?.join(' · ')} (${distinctCount}관왕)` : (existing.classes?.join(' · ') || rawClass));
      existing.heroTitles = p.heroTitles || `2026 제9회 용인특례시 보디빌딩대회 ${existing.classes?.join(' & ')}${distinctCount >= 2 ? ` ${distinctCount}관왕` : ''} 오버롤 그랑프리`;
      
      const candidatePhoto = p.stagePhoto2 || p.stagePhoto1 || photo;
      if (!existing.stagePhoto2 && candidatePhoto && candidatePhoto !== existing.stagePhoto1) {
        existing.stagePhoto2 = candidatePhoto;
      }
    } else {
      let initialClasses: string[] = p.classes ? [...p.classes] : [];
      if (initialClasses.length === 0 && parsedClasses.length > 0) {
        initialClasses = [...parsedClasses];
      }

      const isMulti = p.isMultiCrown !== undefined ? p.isMultiCrown : (initialClasses.length >= 2 || (p.crownCount && p.crownCount >= 2));
      const count = p.crownCount || (isMulti ? initialClasses.length : 1);

      map.set(key, {
        ...p,
        heroImageUrl: photo || p.heroImageUrl || 'https://ybbf.org/hero_section.png',
        stagePhoto1: p.stagePhoto1 || photo || p.heroImageUrl || '',
        stagePhoto2: p.stagePhoto2 || '',
        heroClass: p.heroClass || (isMulti ? `${initialClasses.join(' · ')} (${count}관왕)` : (rawClass || '보디빌딩')),
        crownCount: count,
        isMultiCrown: isMulti,
        crownBadge: p.crownBadge || (isMulti ? `${count}관왕` : 'GRAND PRIX'),
        classes: initialClasses.length > 0 ? initialClasses : [rawClass || '보디빌딩']
      });
    }
  });

  const list = Array.from(map.values());
  // 어드민에서 지정한 orderIndex 및 원본 배열 순서를 100% 최우선 반영하여 정렬
  return list.sort((a, b) => {
    const keyA = (a.heroName || '').trim();
    const keyB = (b.heroName || '').trim();
    const idxA = orderIndices.has(keyA) ? orderIndices.get(keyA)! : 999;
    const idxB = orderIndices.has(keyB) ? orderIndices.get(keyB)! : 999;
    return idxA - idxB;
  });
}

// 1. 일반부 -> 2. 비키니 -> 3. 클보 -> 4. 나머지 순서로 정의된 기본 챔피언 데이터셋
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
    crownBadge: '2관왕'
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
  
  // Zustand Selector 적용으로 불필요한 전체 리렌더링 방지
  const heroPlayersSettings = useSettingsStore((state) => state.settings?.heroPlayers);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  
  // 1번(일반부 강승민)부터 순차적으로 시작
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [activePoseIndex, setActivePoseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // 스크롤 진행 여부 (스크롤 시 타이머 정지)
  const [timerKey, setTimerKey] = useState(0); // 10초 타이머 리셋용 키

  // 모바일 터치 스와이프 좌표 ref
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // 초기 화면 요소
  const bottomBarRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 등장
  const champTextRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 챔피언 목록 메모이제이션 (비동기 설정 수신 시 불필요한 배열 재생성 방지)
  const heroPlayers = useMemo(() => {
    const raw = (heroPlayersSettings && heroPlayersSettings.length > 0) 
      ? heroPlayersSettings 
      : DEFAULT_HERO_PLAYERS;
    return formatSmartHeroPlayers(raw);
  }, [heroPlayersSettings]);

  const heroPlayersRef = useRef(heroPlayers);
  useEffect(() => {
    heroPlayersRef.current = heroPlayers;
  }, [heroPlayers]);

  // ⚡ 모든 챔피언 사진 브라우저 및 GPU 메모리 선행 프리로드 (롤링/전환 시 0ms 즉시 노출)
  useEffect(() => {
    if (heroPlayers.length > 0) {
      heroPlayers.forEach((player) => {
        const urls = [player.stagePhoto1, player.stagePhoto2, player.heroImageUrl].filter(Boolean) as string[];
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

  const safeIndex = heroPlayers.length > 0 ? (selectedHeroIndex % heroPlayers.length) : 0;
  const currentHero = heroPlayers[safeIndex] || heroPlayers[0] || DEFAULT_HERO_PLAYERS[0];

  // 현재 선수의 포즈 사진 목록
  const availablePoses = [
    currentHero.stagePhoto1 || currentHero.heroImageUrl,
    currentHero.stagePhoto2
  ].filter(Boolean) as string[];

  const activePhotoUrl = availablePoses[activePoseIndex] || availablePoses[0] || currentHero.heroImageUrl;

  /* ═══ ⏱️ 10초 간격 연속 챔피언 롤링 ═══ */
  const isTimerActive = !isPaused && !isScrolled && heroPlayers.length > 1;

  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      const currentList = heroPlayersRef.current;
      if (currentList.length <= 1) return;
      setSelectedHeroIndex((prev) => (prev + 1) % currentList.length);
      setActivePoseIndex(0); // 챔피언 변경 시 포즈 0(기본 컷)으로 리셋
      setTimerKey((k) => k + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [isTimerActive, timerKey]);

  /* ═══ 🎬 GSAP 타임라인 (마운트 시 1회만 초기화하여 ScrollTrigger 파괴 방지) ═══ */
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
            // 스크롤 시작 시 타이머 정지 (상태 변경 시에만 setState 호출)
            const isNowScrolled = self.progress > 0.01;
            setIsScrolled((prev) => (prev !== isNowScrolled ? isNowScrolled : prev));
          },
          onLeaveBack: () => {
            setIsScrolled(false);
          }
        }
      });

      // 텍스트 패럴랙스
      scrollTl.fromTo(champTextRef.current,
        { y: 0, opacity: 0 },
        { y: -120, opacity: 0.15, duration: 0.4, ease: 'power1.out' },
        0
      );

      // 프로필 컨테이너 페이드인
      scrollTl.fromTo(profileContainerRef.current,
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        0.2
      );

      // 스탯 항목별 순차적 팝업
      statRefs.current.forEach((el, index) => {
        if (el) {
          scrollTl.fromTo(el,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' },
            0.35 + index * 0.08
          );
        }
      });

    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []); // 의존성 []로 고정하여 챔피언 변경 시 ScrollTrigger 핀 파괴 방지

  const handlePrevHero = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedHeroIndex((prev) => (prev > 0 ? prev - 1 : heroPlayers.length - 1));
    setActivePoseIndex(0);
    setTimerKey((k) => k + 1);
  };

  const handleNextHero = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedHeroIndex((prev) => (prev < heroPlayers.length - 1 ? prev + 1 : 0));
    setActivePoseIndex(0);
    setTimerKey((k) => k + 1);
  };

  // 모바일 터치 스와이프 제스처 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // 수평 스와이프 감지 (최소 50px, 수직 스크롤 오동작 방지)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextHero();
      } else {
        handlePrevHero();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  return (
    <div className="hero-wrapper">
      {/* 검색엔진 SEO를 위한 시맨틱 헤딩 */}
      <h1 className="sr-only">
        YBBF 용인특례시 보디빌딩대회 공식 웹 플랫폼 — 그랑프리 챔피언스 쇼케이스
      </h1>

      <section
        ref={sectionRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="그랑프리 챔피언 히어로 캐러셀"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-screen h-dvh overflow-hidden bg-[#030306]"
        style={{
          '--hero-text': '#ffffff',
          '--hero-muted': 'rgba(255,255,255,0.7)',
          '--hero-border': 'rgba(255,255,255,0.15)',
          color: 'var(--hero-text)'
        } as React.CSSProperties}
      >
        {/* ═══ LAYER 0: CSS 시네마틱 배경 (선택된 챔피언/포즈 이미지) ═══ */}
        <CSSHero imageUrl={activePhotoUrl} />

        {/* ═══ LAYER 1: 하단 상시 노출 네비게이션 컨트롤러 ═══ */}
        <div
          ref={bottomBarRef}
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ zIndex: 40 }}
        >
          <div className="px-3 sm:px-6 md:px-14 py-3 md:py-5 border-t border-white/10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
            
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
              
              {/* 챔피언 & 포즈 컨트롤러 */}
              <div 
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4 pointer-events-auto bg-black/85 backdrop-blur-xl p-3 md:px-5 md:py-2.5 rounded-2xl md:rounded-full border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8)] w-full md:w-auto md:min-w-[620px]"
              >
                {/* 10초 카운트다운 게이지 바 (GPU 가속 scaleX 애니메이션) */}
                {isTimerActive && (
                  <div 
                    key={timerKey}
                    className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#b4ff00] shadow-[0_0_10px_#b4ff00] origin-left will-change-transform animate-[heroProgress_10s_linear_forwards]"
                  />
                )}

                {/* ── ROW 1 (모바일 상단 / 데스크탑 좌측): 뱃지 + 선수명 & 종목 ── */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* 뱃지 */}
                  {currentHero.isMultiCrown ? (
                    <div className="flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500/25 via-amber-500/35 to-yellow-500/25 border border-yellow-400/80 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.4)] shrink-0">
                      <span className="text-[11px] font-mono font-black tracking-wider uppercase">
                        {currentHero.crownBadge || '2관왕'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 shrink-0">
                      <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                        GRAND PRIX
                      </span>
                    </div>
                  )}

                  <div className="h-3.5 w-px bg-white/20 shrink-0 hidden md:block" />

                  {/* 선수 이름 & 종목 */}
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm md:text-xs font-black text-white tracking-wide shrink-0">
                      {currentHero.heroName || 'YBBF 챔피언'}
                    </span>
                    <span className="text-xs md:text-[11px] text-white/70 truncate font-medium">
                      · {currentHero.heroClass}
                    </span>
                  </div>
                </div>

                {/* ── ROW 2 (모바일 하단 터치 컨트롤 / 데스크탑 우측 컨트롤) ── */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-1 md:pt-0 border-t border-white/10 md:border-t-0 shrink-0">
                  {/* 📸 POSE 1 / 2 대형 터치 토글 버튼 */}
                  {availablePoses.length > 1 && (
                    <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl md:rounded-full border border-white/15">
                      <button
                        type="button"
                        aria-pressed={activePoseIndex === 0}
                        aria-label="무대 컷 1 포즈 보기"
                        onClick={(e) => { e.stopPropagation(); setActivePoseIndex(0); setTimerKey(k => k + 1); }}
                        className={`min-h-[36px] px-3.5 py-1.5 md:px-2.5 md:py-0.5 rounded-lg md:rounded-full text-xs md:text-[10px] font-mono font-bold transition-all active:scale-95 ${
                          activePoseIndex === 0 
                            ? 'bg-[#b4ff00] text-black shadow-[0_0_12px_rgba(180,255,0,0.6)] font-black' 
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        POSE 1
                      </button>
                      <button
                        type="button"
                        aria-pressed={activePoseIndex === 1}
                        aria-label="무대 컷 2 포즈 보기"
                        onClick={(e) => { e.stopPropagation(); setActivePoseIndex(1); setTimerKey(k => k + 1); }}
                        className={`min-h-[36px] px-3.5 py-1.5 md:px-2.5 md:py-0.5 rounded-lg md:rounded-full text-xs md:text-[10px] font-mono font-bold transition-all active:scale-95 ${
                          activePoseIndex === 1 
                            ? 'bg-[#b4ff00] text-black shadow-[0_0_12px_rgba(180,255,0,0.6)] font-black' 
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        POSE 2
                      </button>
                    </div>
                  )}

                  {/* 이전 / 다음 챔피언 넘김 (접근성 및 터치 영역 44px 이상 확보) */}
                  <div className="flex items-center gap-1.5 md:border-l md:border-white/20 md:pl-2">
                    <span className="text-xs md:text-[10px] font-mono font-bold text-[#b4ff00] px-1 text-center" aria-live="polite">
                      {safeIndex + 1}/{Math.max(1, heroPlayers.length)}
                    </span>
                    <button 
                      type="button"
                      aria-label="이전 챔피언"
                      onClick={handlePrevHero} 
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 md:p-1.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <button 
                      type="button"
                      aria-label="다음 챔피언"
                      onClick={handleNextHero} 
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 md:p-1.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>

              </div>

              {/* SNS 링크 (데스크탑에서만 노출) */}
              <div className="hidden lg:flex items-center gap-5">
                <a 
                  href="https://www.instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono tracking-widest text-white/50 hover:text-[#b4ff00] transition-colors pointer-events-auto"
                >
                  IG
                </a>
                <a 
                  href="https://www.youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono tracking-widest text-white/50 hover:text-[#b4ff00] transition-colors pointer-events-auto"
                >
                  YT
                </a>
                <a 
                  href="https://www.tiktok.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono tracking-widest text-white/50 hover:text-[#b4ff00] transition-colors pointer-events-auto"
                >
                  TT
                </a>
              </div>

            </div>
          </div>
        </div>

        {/* ═══ LAYER 3: "GRAND PRIX" 배경 텍스트 (스크롤 시 등장) ═══ */}
        <div
          ref={champTextRef}
          aria-hidden="true"
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
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
                <p className="text-[#b4ff00] font-mono font-bold tracking-[0.35em] text-[10px] md:text-xs uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  {currentHero.isMultiCrown ? `${currentHero.crownCount || 2}관왕 DOUBLE GRAND PRIX CHAMPION` : 'OVERALL GRAND PRIX CHAMPION'}
                </p>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black italic uppercase tracking-tight text-white leading-[0.88] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {(currentHero.heroName || '').toUpperCase()}
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
