import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Move cursor tracking mouse
    const onMouseMove = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.4,
        ease: 'power3.out',
      });
    };

    window.addEventListener('mousemove', onMouseMove);

    // Hover effect for interactive elements
    const handleAddGrow = (e: Event) => {
      cursor.classList.add('grow');
      if (textRef.current) {
        const target = e.target as HTMLElement;
        const actionText = target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text') || 'VIEW';
        textRef.current.innerText = actionText;
        textRef.current.style.opacity = '1';
      }
    };
    
    const handleRemoveGrow = () => {
      cursor.classList.remove('grow');
      if (textRef.current) {
        textRef.current.style.opacity = '0';
      }
    };

    const setupInteractiveElements = () => {
      document.querySelectorAll('a, button, .cursor-grow, [data-cursor-text]').forEach((el) => {
        el.addEventListener('mouseenter', handleAddGrow);
        el.addEventListener('mouseleave', handleRemoveGrow);
      });
    };

    setupInteractiveElements();
    
    // Setup again if DOM changes (simple MutationObserver)
    const observer = new MutationObserver(setupInteractiveElements);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.querySelectorAll('a, button, .cursor-grow, [data-cursor-text]').forEach((el) => {
        el.removeEventListener('mouseenter', handleAddGrow);
        el.removeEventListener('mouseleave', handleRemoveGrow);
      });
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference bg-accent"
      style={{
        width: '8px',
        height: '8px',
        transition: 'width 0.3s ease, height 0.3s ease',
      }}
    >
      <span 
        ref={textRef} 
        className="text-bg-primary text-[10px] font-bold tracking-wider uppercase opacity-0 transition-opacity duration-300 pointer-events-none"
      ></span>
      <style>{`
        .grow { width: 64px !important; height: 64px !important; background-color: var(--color-accent) !important; mix-blend-difference: normal !important; }
      `}</style>
    </div>
  );
}
