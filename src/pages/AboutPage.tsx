import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Award, Users, Target } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "협회 소개 | YBBF 용인시보디빌딩협회";

    const ctx = gsap.context(() => {
      // Hero Animations
      gsap.fromTo('.hero-title-line',
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.2 }
      );

      gsap.fromTo('.hero-subtitle',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.6 }
      );

      // Fade-in sections on scroll
      gsap.utils.toArray('.scroll-reveal').forEach((elem: any) => {
        gsap.fromTo(elem,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 80%',
              toggleActions: 'play none none none',
            }
          }
        );
      });

      // System card stagger
      gsap.fromTo('.system-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.system-grid',
            start: 'top 75%',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="bg-bg-primary min-h-screen text-text-primary overflow-hidden">
      
      {/* SECTION 1: HERO */}
      <section className="relative h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden border-b border-divider">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/1920/1080?random=about_hero" 
            alt="YBBF Iron Roots" 
            className="w-full h-full object-cover opacity-15 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-[1440px] mx-auto text-center mt-20">
          <p className="hero-subtitle font-mono text-xs md:text-sm tracking-[0.4em] text-accent mb-6 uppercase font-bold">
            FOUNDATION & LEGACY
          </p>
          <h1 className="hero-title-line text-display text-[clamp(40px,9vw,150px)] leading-[0.85] font-black italic uppercase tracking-tighter text-transparent select-none mb-2"
              style={{ WebkitTextStroke: '2px rgba(255,255,255,0.9)' }}>
            THE IRON ROOTS
          </h1>
          <h1 className="hero-title-line text-display text-[clamp(40px,9vw,150px)] leading-[0.85] font-black italic uppercase tracking-tighter text-accent select-none mb-10">
            FUTURE LEGENDS
          </h1>
          <p className="hero-subtitle font-sans text-lg md:text-2xl text-white/90 font-bold max-w-2xl mx-auto tracking-wide">
            정통 위에서 피어나는 가장 젊고 뜨거운 에너지
          </p>
        </div>
      </section>

      {/* SECTION 2: BRAND MANIFESTO */}
      <section className="py-24 md:py-40 px-6 md:px-16 max-w-[1440px] mx-auto border-b border-divider">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left Side: Heavy Typography */}
          <div className="lg:col-span-5">
            <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase font-bold mb-4">OUR IDENTITY</p>
            <h2 className="text-display text-4xl md:text-6xl font-black italic uppercase leading-none mb-8">
              THE LEGITIMATE <br />
              LINEAGE OF <br />
              <span className="text-accent">BODYBUILDING</span>
            </h2>
            <div className="h-1 w-20 bg-accent mb-8" />
            <p className="font-sans text-text-muted text-sm leading-relaxed max-w-sm">
              용인특례시보디빌딩협회는 흔들리지 않는 규정과 공정함이라는 단단한 쇠사슬(Iron) 위에 서 있습니다.
            </p>
          </div>

          {/* Right Side: Editorial Body Copy */}
          <div className="lg:col-span-7 flex flex-col gap-8 text-base md:text-lg text-white/80 leading-relaxed font-sans scroll-reveal">
            <p className="font-bold text-white text-lg md:text-xl">
              용인특례시보디빌딩협회(YBBF)는 대한체육회 산하 용인시체육회, 그리고 대한보디빌딩협회와 경기도보디빌딩협회 공식 라인을 잇는 정통성 있는 거점입니다.
            </p>
            <p>
              우리는 세계 보디빌딩의 절대적 기준인 <span className="text-accent font-bold">IFBB(국제보디빌딩연맹)</span>의 엄격한 룰을 완벽히 준수하며, 편파와 왜곡이 없는 가장 공정하고 압도적인 무대를 만듭니다. 수많은 피트니스 대회가 생겨나고 사라지는 시대 속에서도, YBBF가 지키는 '정통(Legitimacy)'의 가치는 불변의 가이드라인이 됩니다.
            </p>
            <p className="border-l-2 border-accent pl-6 italic text-white/90 my-4">
              "가장 엄격한 룰 위에서 가장 자유롭고 폭발적인 무대가 피어납니다."
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: YOUTH FOCUS (THE CORE) */}
      <section className="py-24 md:py-40 bg-[#050505] border-b border-divider relative">
        {/* Decorative Watermark */}
        <div className="absolute right-10 bottom-10 text-[clamp(100px,18vw,350px)] font-display font-black italic text-white/3 select-none pointer-events-none uppercase">
          YOUTH
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Image Overlay Section */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group scroll-reveal order-2 lg:order-1">
              <div className="absolute inset-0 bg-black/35 group-hover:bg-transparent transition-colors duration-700 z-10" />
              <img 
                src="https://picsum.photos/1000/800?random=about_youth" 
                alt="Youth Focus" 
                className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-1000"
              />
            </div>

            {/* Narrative text */}
            <div className="flex flex-col gap-6 order-1 lg:order-2 scroll-reveal">
              <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase font-bold">THE FUTURE DIRECTION</p>
              <h2 className="text-display text-4xl md:text-5xl font-black italic uppercase leading-tight text-white">
                WE DO NOT LOOK BACK.<br />
                WE BUILD THE <span className="text-accent">YOUTH</span>
              </h2>
              <div className="h-0.5 w-16 bg-white/20 my-2" />
              
              <p className="text-base md:text-lg text-white/80 leading-relaxed font-sans">
                우리의 시선은 과거의 영광이나 현재의 왕좌에만 머물지 않습니다. 
                YBBF가 가장 가슴 뜨겁게 주목하는 곳은 바로 <span className="text-white font-bold">'유소년(Youth)'</span>입니다.
              </p>
              <p className="text-base md:text-lg text-white/80 leading-relaxed font-sans">
                올바른 웨이트 트레이닝과 신체 조화의 가치는 성인만의 전유물이 아닙니다. 청소년기부터 다져진 체력과 단단한 멘탈은 평생의 삶을 지탱하는 가장 강력한 자산이 되기 때문입니다. 
              </p>
              <p className="text-base md:text-lg text-white/80 leading-relaxed font-sans">
                우리는 유소년들이 정통 보디빌딩의 시스템 아래에서 부상 없이 피지컬을 발달시키고, 스스로의 한계를 깨부수는 '성장의 희열'을 맛보게 할 것입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: OFFICIAL SYSTEM GRID (정통성 강조) */}
      <section className="py-24 md:py-40 px-6 md:px-16 max-w-[1440px] mx-auto">
        <div className="text-center mb-24 scroll-reveal">
          <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase font-bold mb-4">AFFILIATIONS</p>
          <h2 className="text-display text-4xl md:text-5xl font-black italic uppercase">THE LEGITIMATE ORGANIZATIONS</h2>
          <p className="text-text-muted mt-4 max-w-xl mx-auto font-sans text-sm">
            YBBF는 공인된 국내외 연맹 및 체육회와의 강력한 파트너십을 통해 공신력과 정통성을 입증받고 있습니다.
          </p>
        </div>

        <div className="system-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="system-card bg-black border border-white/10 hover:border-accent p-8 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-8">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-display font-black italic text-2xl uppercase mb-4">IFBB</h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              국제보디빌딩연맹의 규정과 철학을 완벽하게 준수하여 글로벌 기준에 부합하는 공정한 판정을 심사합니다.
            </p>
          </div>

          {/* Card 2 */}
          <div className="system-card bg-black border border-white/10 hover:border-accent p-8 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-8">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-display font-black italic text-2xl uppercase mb-4">KBBF</h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              대한체육회 및 대한보디빌딩협회의 가이드라인을 준수하며 대한민국 스포츠 정식 가치를 대변합니다.
            </p>
          </div>

          {/* Card 3 */}
          <div className="system-card bg-black border border-white/10 hover:border-accent p-8 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-8">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display font-black italic text-2xl uppercase mb-4">GYEONGGI LINE</h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              경기도보디빌딩협회와 긴밀히 공조하여 용인 지역 빌더들이 도 대표 및 전국 무대로 진출하는 교두보 역할을 수행합니다.
            </p>
          </div>

          {/* Card 4 */}
          <div className="system-card bg-black border border-white/10 hover:border-accent p-8 rounded-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-8">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-display font-black italic text-2xl uppercase mb-4">YONGIN COUNCIL</h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              용인특례시체육회의 소속 정회원 단체로서 시민들의 체력 증진과 유소년 스포츠 꿈나무 육성에 이바지합니다.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 5: FINAL CTA */}
      <section className="py-32 px-4 border-t border-divider text-center relative overflow-hidden bg-gradient-to-t from-accent/5 to-transparent">
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-display text-4xl md:text-7xl font-black italic uppercase leading-none mb-6">
            THE PARADIGM <br />
            HAS <span className="text-accent">SHIFTED.</span>
          </h2>
          <p className="font-sans text-sm md:text-base text-white/80 max-w-lg mx-auto mb-10">
            대한민국 보디빌딩의 새로운 패러다임, 용인특례시보디빌딩협회가 앞장서서 증명합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/competition" 
              className="px-8 py-4 bg-accent hover:bg-accent-dark text-black font-black uppercase text-xs tracking-widest transition-colors rounded-full"
            >
              대회 정보 확인하기
            </a>
            <a 
              href="/youth" 
              className="px-8 py-4 bg-transparent border border-white/20 hover:bg-white/5 text-white font-black uppercase text-xs tracking-widest transition-colors rounded-full"
            >
              유스 육성관 가기
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
