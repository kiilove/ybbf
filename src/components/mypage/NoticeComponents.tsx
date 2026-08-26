import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 💡 날짜 표시용 로컬라이징 포맷터 (UTC -> KST 24시간제 변환)
export const formatDisplayDate = (isoStr?: string, localStr?: string): string => {
  if (localStr) return localStr; // 기존 로컬 생성 시각 유지
  if (isoStr) {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }
  return '-';
};

export const PHOTO_SERVICE_PRICE = 60000;

// 💡 필수공지용 본문 스크롤 완독 검출기
interface NoticeScrollReaderProps {
  content: string;
  onReadComplete: () => void;
}

export function NoticeScrollReader({ content, onReadComplete }: NoticeScrollReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  }, [content]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onReadComplete();
          }
        });
      },
      {
        root: container,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [content, onReadComplete]);

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="max-h-[300px] overflow-y-auto overscroll-contain border border-white/10 p-5 rounded-lg bg-black/40 leading-relaxed text-white/80 text-xs md:text-sm font-sans relative"
      style={{ whiteSpace: 'pre-wrap' }}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <div ref={sentinelRef} className="h-1 w-full pointer-events-none" />
    </div>
  );
}

// 💡 필수공지용 유튜브 플레이어
interface YouTubePlayerProps {
  url: string;
  onEnded: () => void;
}

export function YouTubePlayer({ url, onEnded }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substring(2, 11)}`);

  useEffect(() => {
    let player: any;
    
    const initPlayer = () => {
      let videoId = '';
      const cleanUrl = url.split('#')[0];
      if (cleanUrl.includes('youtu.be/')) {
        videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (cleanUrl.includes('youtube.com/watch')) {
        videoId = new URL(cleanUrl).searchParams.get('v') || '';
      } else if (cleanUrl.includes('youtube.com/shorts/')) {
        videoId = cleanUrl.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
      } else if (cleanUrl.includes('youtube.com/embed/')) {
        videoId = cleanUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }

      if (!videoId) return;

      // @ts-ignore
      player = new window.YT.Player(containerId.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        events: {
          // @ts-ignore
          onStateChange: (event: any) => {
            // @ts-ignore
            if (event.data === window.YT.PlayerState.PLAYING) {
              onEnded(); // 유연한 진행을 위해 재생 시작 즉시 확인 완료로 처리
            }
            // @ts-ignore
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          }
        }
      });
      playerRef.current = player;
    };

    // @ts-ignore
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // @ts-ignore
      const prevCallback = window.onYouTubeIframeAPIReady;
      // @ts-ignore
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [url, onEnded]);

  const isVertical = url.includes('#vertical') || url.includes('youtube.com/shorts/');

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 ${
      isVertical ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-[16/9] w-full'
    }`}>
      <div id={containerId.current} className="w-full h-full" />
    </div>
  );
}

// 💡 필수공지용 다중 이미지 캐러셀
interface ImageCarouselProps {
  images: string[];
  onAllViewed: () => void;
}

export function ImageCarousel({ images, onAllViewed }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewedIndicesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    viewedIndicesRef.current.clear();
    if (images && images.length > 0) {
      viewedIndicesRef.current.add(0);
      if (viewedIndicesRef.current.size === images.length) {
        onAllViewed();
      }
    }
  }, [images, onAllViewed]);

  if (!images || images.length === 0) return null;

  const markAsViewed = (index: number) => {
    if (!viewedIndicesRef.current.has(index)) {
      viewedIndicesRef.current.add(index);
      if (viewedIndicesRef.current.size === images.length) {
        onAllViewed();
      }
    }
  };

  const handlePrev = () => {
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(nextIdx);
    markAsViewed(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    markAsViewed(nextIdx);
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
      <img
        src={images[currentIndex]}
        alt={`공지 이미지 ${currentIndex + 1}`}
        className="w-full h-full object-contain"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-accent w-3' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
