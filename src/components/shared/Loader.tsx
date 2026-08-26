import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface LoaderProps {
  isLoading?: boolean;
  onComplete?: () => void;
}

export default function Loader({ isLoading, onComplete }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 💡 1. isLoading 속성이 아예 없을 때 (기존 1.8초 가짜 로딩 호환)
    if (isLoading === undefined) {
      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });

      tl.to(fillRef.current, {
        width: '100%',
        duration: 1.8,
        ease: 'power2.inOut',
      })
      .to(containerRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power4.inOut',
      }, '+=0.2');

      return () => {
        tl.kill();
      };
    }
  }, [isLoading, onComplete]);

  // 💡 2. isLoading 속성이 들어왔을 때 (실제 로딩 연동)
  useEffect(() => {
    if (isLoading === undefined) return;

    if (isLoading) {
      // 로딩 중일 때는 게이지를 90%까지 서서히 채우며 대기합니다
      gsap.to(fillRef.current, {
        width: '90%',
        duration: 2.5,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    } else {
      // 로딩이 완료되었을 때:
      // 이미 진행된 프로그레스를 보존하면서, 100%까지 채우는 연출을 완전히 보장합니다.
      const currentWidth = fillRef.current ? parseFloat(fillRef.current.style.width) || 0 : 0;
      
      // 남은 퍼센티지에 비례하여 duration을 설정하되, 최소 0.6초는 보장하여 웅장한 연출 효과를 유지합니다.
      const remainingPercent = 100 - currentWidth;
      const fillDuration = Math.max(0.6, (remainingPercent / 100) * 0.95);

      const finishTl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          if (onComplete) onComplete();
        }
      });

      finishTl.to(fillRef.current, {
        width: '100%',
        duration: fillDuration,
        ease: 'power2.out',
        overwrite: 'auto'
      })
      .to(containerRef.current, {
        yPercent: -100,
        duration: 0.6,
        ease: 'power3.inOut',
      }, '+=0.15'); // 100% 도달 상태를 유저가 잠시 인식할 수 있도록 딜레이 제공
    }
  }, [isLoading, onComplete]);

  if (isDone && isLoading === false) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0a0a0a] text-white"
    >
      <div className="relative text-display text-[clamp(40px,8vw,120px)] font-black uppercase tracking-tighter leading-none">
        {/* Background Text */}
        <span className="opacity-20 select-none">LOAD YBBF</span>
        
        {/* Fill Text */}
        <div 
          ref={fillRef}
          className="absolute top-0 left-0 h-full overflow-hidden whitespace-nowrap text-[#d2ff00]"
          style={{ width: '0%' }}
        >
          <span className="select-none">LOAD YBBF</span>
        </div>
      </div>
    </div>
  );
}
