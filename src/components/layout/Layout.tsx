import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import Nav from './Nav';
import GlobalCTA from './GlobalCTA';
import Footer from './Footer';
import { forceScrollToTop } from '../../utils/scrollUtils';

gsap.registerPlugin(ScrollTrigger);

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    // 라우트 변경 시 모든 스크롤러(Window, Body, Lenis) 0 리셋
    forceScrollToTop();
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
    });

    (window as any).lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      delete (window as any).lenis;
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, [location.pathname]); // Refresh ScrollTrigger on route change

  const showCTA = !location.pathname.startsWith('/competition');

  return (
    <div className="relative">
      <Nav />
      <main className="min-h-screen">
        <Outlet />
      </main>
      {showCTA && <GlobalCTA />}
      <Footer />
    </div>
  );
}
