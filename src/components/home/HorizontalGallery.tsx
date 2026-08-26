import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mediaService, MediaItem } from '../../services/mediaService';

const categoryMap: Record<string, string> = {
  highlight: '대회 하이라이트',
  interview: '인터뷰',
  training: '트레이닝',
  notice: '공지'
};

export default function HorizontalGallery() {
  const highlightSectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [latestMedia, setLatestMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const data = await mediaService.getMediaList();
        setLatestMedia(data.slice(0, 6));
      } catch (err) {
        console.error('랜딩페이지 미디어 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, []);

  useEffect(() => {
    if (loading || latestMedia.length === 0) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px)', () => {
        const track = trackRef.current;
        const section = highlightSectionRef.current;
        if (!track || !section) return;

        const getScrollAmount = () => -(track.scrollWidth - window.innerWidth + 64);

        const tween = gsap.to(track, {
          x: getScrollAmount,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${track.scrollWidth - window.innerWidth + 64}`,
            invalidateOnRefresh: true,
          },
        });

        // Simple parallax and scale effect on cards
        const cards = gsap.utils.toArray('.gallery-card');
        cards.forEach((card: any) => {
          gsap.fromTo(card,
            { scale: 0.94 },
            {
              scale: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: 'left right',
                end: 'right left',
                scrub: true,
              }
            }
          );
        });
      });
    }, highlightSectionRef);

    return () => {
      ctx.revert();
    };
  }, [loading, latestMedia]);

  return (
    <div className="gallery-wrapper">
      <section ref={highlightSectionRef} className="h-section bg-[#050505] py-16 md:py-0 w-full overflow-hidden border-y border-white/10">
        <div 
          ref={trackRef} 
          className="h-track flex flex-col md:flex-row items-center gap-16 px-6 md:px-16 w-full md:w-max md:h-screen"
        >
          {/* Intro Block */}
          <div className="shrink-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-[500px]">
            <h2 className="text-display text-4xl md:text-7xl font-black italic uppercase text-transparent mb-6" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.9)' }}>
              MEDIA
            </h2>
            <p className="font-sans text-text-muted leading-relaxed mb-8">
              용인시 보디빌딩협회의 공식 미디어 센터입니다. <br/>대회 하이라이트, 인터뷰, 훈련 영상 등을 가장 먼저 만나보세요.
            </p>
            <a href="/media" className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-widest hover:text-white transition-colors w-max">
              미디어 센터 가기 →
            </a>
          </div>

          {/* Media Cards */}
          {latestMedia.map((media) => (
            <a 
              key={media.id} 
              href="/media"
              className="gallery-card group block relative md:h-[60vh] shrink-0 overflow-hidden w-full md:w-[450px] mt-8 md:mt-0 rounded-lg"
            >
              <div className="absolute top-4 left-4 z-20">
                <span className="text-[10px] font-bold tracking-widest uppercase text-bg-primary bg-accent px-3 py-1.5 rounded-full">
                  {categoryMap[media.category] || media.category}
                </span>
              </div>
              
              <div className="w-full h-[40vh] md:h-full overflow-hidden relative">
                <img 
                  src={media.thumbnail} 
                  alt={media.title} 
                  className="w-full h-full object-cover transition-all duration-[800ms] ease-out grayscale group-hover:grayscale-0 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center backdrop-blur-sm bg-black/30">
                     <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 z-30">
                <h3 className="font-display italic font-black text-2xl uppercase leading-tight line-clamp-2">
                  {media.title}
                </h3>
                <p className="font-mono text-[10px] tracking-widest text-text-muted mt-2">{media.date}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
