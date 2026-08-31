/**
 * YBBF 전역 최상단 강제 스크롤 유틸리티
 * 
 * 1. 브라우저 Native window, html, body, #root 0px 리셋
 * 2. Lenis Smooth Scroll러 인스턴스 0px 강제 즉시 리셋
 * 3. requestAnimationFrame + 3단계 타임아웃 딜레이 보정으로
 *    비동기 데이터 로딩 및 GSAP ScrollTrigger 충돌 완벽 방지
 */
export function forceScrollToTop(immediate = true) {
  if (typeof window === 'undefined') return;

  // 1. 브라우저 기본 스크롤 복원 동작 차단
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // 2. Lenis 인스턴스 즉시 0 리셋
  const lenis = (window as any).lenis;
  if (lenis && typeof lenis.scrollTo === 'function') {
    try {
      lenis.scrollTo(0, { immediate: true });
    } catch (e) {}
  }

  // 3. 브라우저 Native 스크롤러 즉시 0 리셋
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.scrollTop = 0;

  // 4. 렌더링 틱 보정 (Tick 1: requestAnimationFrame)
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (lenis && typeof lenis.scrollTo === 'function') {
      try {
        lenis.scrollTo(0, { immediate: true });
      } catch (e) {}
    }
  });

  // 5. 비동기 DOM 마운트 지연 보정 (Tick 2: 50ms)
  setTimeout(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (lenis && typeof lenis.scrollTo === 'function') {
      try {
        lenis.scrollTo(0, { immediate: true });
      } catch (e) {}
    }
  }, 50);

  // 6. 무거운 컴포넌트 마운트 최종 보정 (Tick 3: 150ms)
  setTimeout(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, 150);
}
