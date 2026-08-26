import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Share2 } from 'lucide-react';

const socialImages = [
  { img: 'https://picsum.photos/400/400?random=71', type: '인스타그램', aspect: 'aspect-square' },
  { img: 'https://picsum.photos/400/600?random=72', type: '틱톡', aspect: 'aspect-[2/3]' },
  { img: 'https://picsum.photos/600/400?random=73', type: '유튜브', aspect: 'aspect-[3/2]' },
  { img: 'https://picsum.photos/500/500?random=74', type: '인스타그램', aspect: 'aspect-square' },
  { img: 'https://picsum.photos/400/500?random=75', type: '틱톡', aspect: 'aspect-[4/5]' },
  { img: 'https://picsum.photos/600/600?random=76', type: '인스타그램', aspect: 'aspect-square' },
];

export default function Socials() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.social-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          y: 80,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 70%',
          }
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 md:py-32 px-6 md:px-16 bg-bg-secondary">
      <div className="max-w-[1440px] mx-auto w-full social-container">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-display text-[clamp(40px,5vw,80px)] leading-[0.85] font-black uppercase tracking-tighter italic">
              최신 소셜 <span className="text-accent">소식</span>
            </h2>
          </div>
          <div className="flex gap-4">
            <a href="#" className="p-3 border border-divider hover:border-accent hover:text-accent transition-colors rounded-full"><Share2 className="w-6 h-6" /></a>
          </div>
        </div>

        {/* Masonry-like grid using columns */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {socialImages.map((item, i) => (
            <a 
              key={i} 
              href="#" 
              className={`social-card relative block group overflow-hidden bg-white/5 cursor-grow mb-6 w-full rounded-2xl border border-white/10 ${item.aspect}`}
              data-cursor-text="VIEW"
            >
              <img 
                src={item.img} 
                alt={`Social ${i}`} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col justify-center items-center">
                <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-sans font-bold uppercase tracking-widest text-[#E5FF00] text-sm">
                  {item.type}에서 보기
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
