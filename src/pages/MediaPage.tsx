import { useEffect, useRef, useState } from 'react';
import { Share2, Youtube } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mediaService, MediaItem } from '../services/mediaService';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { id: 'all', label: '전체' },
  { id: 'highlight', label: '대회 하이라이트' },
  { id: 'interview', label: '인터뷰' },
  { id: 'training', label: '트레이닝' },
  { id: 'notice', label: '공지' }
];

export default function MediaPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isVideoPortrait, setIsVideoPortrait] = useState(false);
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem | null>(null);

  const hasVerticalHash = !!(
    selectedMedia && (
      (selectedMedia.videoUrl && selectedMedia.videoUrl.includes('#vertical')) ||
      (selectedMedia.youtubeUrl && selectedMedia.youtubeUrl.includes('#vertical'))
    )
  );

  const isPortraitLayout = isVideoPortrait || hasVerticalHash || !!(
    selectedMedia?.youtubeUrl && selectedMedia.youtubeUrl.includes('youtube.com/shorts/')
  );

  useEffect(() => {
    async function loadMedia() {
      try {
        setLoading(true);
        const data = await mediaService.getMediaList();
        setMediaList(data);
        
        // 대표노출(featured) 동영상 중 무작위로 하나 선택
        const featuredItems = data.filter(m => m.featured);
        if (featuredItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * featuredItems.length);
          setFeaturedMedia(featuredItems[randomIndex]);
        }
      } catch (err) {
        console.error('미디어 데이터를 가져오는 중 에러 발생:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMedia();
  }, []);

  // 모달이 열릴 때 해시 마커 및 URL 형식 감지
  useEffect(() => {
    if (!selectedMedia) {
      setIsVideoPortrait(false);
    } else {
      const hasVerticalHash = 
        (selectedMedia.videoUrl && selectedMedia.videoUrl.includes('#vertical')) ||
        (selectedMedia.youtubeUrl && selectedMedia.youtubeUrl.includes('#vertical'));

      if (hasVerticalHash) {
        setIsVideoPortrait(true);
      } else if (selectedMedia.youtubeUrl && selectedMedia.youtubeUrl.includes('youtube.com/shorts/')) {
        setIsVideoPortrait(true);
      } else {
        setIsVideoPortrait(false);
      }
    }
  }, [selectedMedia]);

  // 비디오 로딩 시 메타데이터를 기반으로 비율 감지 (D1 R2 업로드 파일 대응 백업)
  const handleVideoMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoHeight > video.videoWidth) {
      setIsVideoPortrait(true);
    }
  };

  const filteredMedia = activeCategory === 'all' 
    ? mediaList 
    : mediaList.filter(m => m.category === activeCategory);



  useEffect(() => {
    document.title = "미디어 센터 | YBBF 용인시보디빌딩협회";
    const ctx = gsap.context(() => {
      // Hero Text Animation
      gsap.fromTo('.hero-text-anim',
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power4.out', delay: 0.1 }
      );

      // Parallax for Hero Image
      gsap.to('.hero-image', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Grid Items Animation
      gsap.fromTo('.grid-item-anim',
        { y: 50, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: {
            trigger: '.grid-section',
            start: 'top 80%',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeCategory]); // Re-animate when category changes

  return (
    <div ref={containerRef} className="bg-bg-primary min-h-screen text-text-primary pt-24 pb-32">
      
      {/* SECTION 1: HERO */}
      <section className="hero-section relative min-h-[60vh] lg:h-[70vh] flex items-center justify-center py-12 lg:py-0 px-4 md:px-8 overflow-hidden border-b border-divider mb-12">
        {/* 거대 타이포그래피 배경 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
           <h1 className="hero-text-anim text-[clamp(120px,25vw,400px)] font-display font-black italic uppercase tracking-widest text-[rgba(255,255,255,0.05)] select-none">
             MEDIA
           </h1>
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto w-full">
          {featuredMedia ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Side: Featured Title & Details */}
              <div className="lg:col-span-5 text-left flex flex-col items-start">
                <span className="hero-text-anim bg-accent text-black font-mono text-[10px] tracking-[0.2em] font-black uppercase px-2.5 py-1 mb-4 inline-block rounded-sm">
                  Featured Media
                </span>
                <h2 className="hero-text-anim text-3xl md:text-5xl font-display font-black italic uppercase tracking-wide leading-tight mb-4 text-white">
                  {featuredMedia.title}
                </h2>
                <p className="hero-text-anim font-sans text-sm md:text-base text-text-muted leading-relaxed mb-6 font-light max-w-lg break-keep">
                  {featuredMedia.description}
                </p>
                
                {/* Actions */}
                <div className="hero-text-anim flex flex-wrap gap-4">
                  <button 
                    onClick={() => setSelectedMedia(featuredMedia)}
                    className="flex items-center gap-2.5 bg-accent text-black font-bold uppercase text-[11px] tracking-wider px-6 py-3.5 rounded-lg hover:bg-white hover:text-black transition-all hover:scale-[1.03] active:scale-95 duration-300 shadow-lg shadow-accent/20"
                  >
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-black border-b-[5px] border-b-transparent ml-0.5" />
                    <span>Watch Now</span>
                  </button>
                  <button 
                    onClick={() => window.open(featuredMedia.youtubeUrl || 'https://youtube.com', '_blank')}
                    className="flex items-center gap-2 border border-white/20 hover:border-white text-white/80 hover:text-white font-bold uppercase text-[11px] tracking-wider px-6 py-3.5 rounded-lg transition-all hover:scale-[1.03] active:scale-95 duration-300"
                    title="Watch on YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>YouTube</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Visual Card */}
              <div className="lg:col-span-7 w-full">
                <div 
                  onClick={() => setSelectedMedia(featuredMedia)}
                  className="hero-text-anim relative w-full aspect-video overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-pointer border border-white/10"
                >
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                  <img 
                    src={featuredMedia.thumbnail} 
                    alt="Featured" 
                    className="hero-image w-full h-[120%] object-cover absolute -top-[10%] group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                     <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white flex items-center justify-center backdrop-blur-sm bg-black/30 group-hover:bg-accent group-hover:border-accent transition-all duration-300 shadow-2xl">
                       <div className="w-0 h-0 border-t-7 border-t-transparent border-l-[13px] border-l-white group-hover:border-l-black border-b-7 border-b-transparent ml-1 transition-colors" />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="hero-text-anim font-mono text-[10px] md:text-xs tracking-[0.3em] text-accent mb-6 uppercase">
                YBBF Official Hub
              </p>
              <h2 className="hero-text-anim text-3xl md:text-5xl font-display font-black italic uppercase text-white mb-4">
                MEDIA CENTER
              </h2>
              <p className="hero-text-anim font-sans text-sm md:text-base text-text-muted">
                대회의 모든 순간, 땀방울, 그리고 챔피언들의 스토리를 기록합니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: CATEGORY FILTER (Sticky) */}
      <section className="sticky top-20 z-40 bg-bg-primary/90 backdrop-blur-md border-b border-white/10 py-4 mb-12">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex gap-6 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap text-xs md:text-sm font-bold tracking-widest uppercase transition-all duration-300 pb-2 border-b-2 ${
                activeCategory === cat.id 
                  ? 'text-accent border-accent' 
                  : 'text-text-muted border-transparent hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 3: CONTENT GRID (Asymmetric) */}
      <section className="grid-section max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {filteredMedia.map((media, i) => {
            const isVertical = !!(
              (media.videoUrl && media.videoUrl.includes('#vertical')) ||
              (media.youtubeUrl && media.youtubeUrl.includes('#vertical')) ||
              (media.youtubeUrl && media.youtubeUrl.includes('youtube.com/shorts/'))
            );

            return (
              <div 
                key={media.id} 
                onClick={() => setSelectedMedia(media)}
                className={`grid-item-anim group cursor-pointer flex flex-col ${
                  (!isVertical && i % 3 === 0) ? 'lg:col-span-2' : ''
                } ${
                  i % 2 !== 0 ? 'md:mt-16' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className={`overflow-hidden rounded-lg relative w-full ${
                  isVertical ? 'aspect-[9/16] max-w-[400px] mx-auto' : 'aspect-video'
                }`}>
                  <img 
                    src={media.thumbnail} 
                    alt={media.title} 
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" 
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    {/* Play Icon */}
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                       <div className="w-0 h-0 border-t-5 border-t-transparent border-l-8 border-l-white border-b-5 border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                {/* Meta & Info */}
                <div className="mt-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                      {categories.find(c => c.id === media.category)?.label}
                    </span>
                    <span className="text-[10px] tracking-wider text-text-muted font-mono">{media.date}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-display font-black italic uppercase leading-tight group-hover:text-accent transition-colors">
                    {media.title}
                  </h3>
                  <div className="flex items-end justify-between mt-2">
                    <p className="text-sm text-text-muted line-clamp-2 pr-4">
                      {media.description}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(media.youtubeUrl || 'https://youtube.com', '_blank'); }}
                      className="shrink-0 p-2 rounded-full border border-white/10 text-white/50 hover:text-bg-primary hover:bg-accent hover:border-accent transition-all"
                      title="Share via YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMedia.length === 0 && (
          <div className="text-center py-32 text-text-muted">
            <p className="font-display italic text-2xl">해당 카테고리의 미디어가 없습니다.</p>
          </div>
        )}
      </section>

      {/* 비디오 재생 모달 */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`relative w-full bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
            isPortraitLayout ? 'max-w-[400px]' : 'max-w-4xl'
          }`}>
            {/* 상단 헤더 영역 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div>
                <span className="text-[10px] text-accent font-bold uppercase tracking-widest block mb-0.5">
                  {categories.find(c => c.id === selectedMedia.category)?.label}
                </span>
                <h3 className="text-sm md:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">{selectedMedia.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedMedia(null)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors font-mono font-bold text-xs"
              >
                닫기 ✕
              </button>
            </div>

            {/* 비디오 바디 영역 */}
            <div className={
              isPortraitLayout
                ? "max-w-[400px] aspect-[9/16] mx-auto w-full bg-black flex items-center justify-center"
                : "aspect-video w-full bg-black flex items-center justify-center"
            }>
              {selectedMedia.videoUrl ? (
                // 1. 직접 업로드된 R2 비디오 파일 재생 (mp4 등, #vertical 해시 스트립 처리)
                <video 
                  src={selectedMedia.videoUrl.split('#')[0]} 
                  controls 
                  autoPlay 
                  playsInline
                  onLoadedMetadata={handleVideoMetadataLoaded}
                  className="w-full h-full object-contain"
                />
              ) : selectedMedia.youtubeUrl ? (
                // 2. 유튜브 비디오 재생 (임베드, #vertical 해시 스트립 처리)
                (() => {
                  let videoId = '';
                  const cleanUrl = selectedMedia.youtubeUrl.split('#')[0];
                  if (cleanUrl.includes('youtu.be/')) {
                    videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
                  } else if (cleanUrl.includes('youtube.com/watch')) {
                    videoId = new URL(cleanUrl).searchParams.get('v') || '';
                  } else if (cleanUrl.includes('youtube.com/shorts/')) {
                    videoId = cleanUrl.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
                  } else if (cleanUrl.includes('youtube.com/embed/')) {
                    videoId = cleanUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
                  }
                  
                  if (videoId) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={selectedMedia.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    );
                  } else {
                    return (
                      <div className="text-center p-6 text-text-muted">
                        <p className="mb-4">유튜브 외부 링크 영상입니다.</p>
                        <a 
                          href={cleanUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-accent text-black font-bold text-xs px-4 py-2.5 rounded-lg inline-block"
                        >
                          유튜브에서 시청하기
                        </a>
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="text-center p-6 text-text-muted">
                  <p>재생할 수 있는 비디오 소스가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 하단 상세 정보 영역 */}
            <div className="p-6 bg-[#121212] border-t border-white/5">
              <p className="text-xs md:text-sm text-white/70 leading-relaxed font-light break-keep">
                {selectedMedia.description}
              </p>
              <p className="text-[10px] text-white/30 font-mono mt-3">게시일: {selectedMedia.date}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
