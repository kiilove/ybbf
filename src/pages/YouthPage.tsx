import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { youthClubsData, youthAthletesData } from '../data/youth';
import { MapPin, Users, Trophy, ChevronRight, Dumbbell, Shield, Flag } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function YouthPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeClubId, setActiveClubId] = useState<string>('all');

  const filteredAthletes = activeClubId === 'all' 
    ? youthAthletesData 
    : youthAthletesData.filter(a => a.clubId === activeClubId);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "YBBF 유소년 육성 시스템 | YOUTH";
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo('.hero-text-anim',
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power4.out', delay: 0.1 }
      );

      // System Diagram Animation
      gsap.fromTo('.system-step',
        { y: 50, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: { trigger: '.system-section', start: 'top 70%' }
        }
      );

      // Cards Animation
      gsap.fromTo('.club-card',
        { y: 40, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.clubs-section', start: 'top 80%' }
        }
      );

      gsap.fromTo('.athlete-card',
        { y: 40, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.roster-section', start: 'top 70%' }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeClubId]);

  return (
    <div ref={containerRef} className="bg-bg-primary min-h-screen text-text-primary">
      
      {/* SECTION 1: HERO */}
      <section className="hero-section relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?random=y_hero" 
            alt="Youth Training" 
            className="w-full h-full object-cover opacity-40 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-bg-primary" />
        </div>

        <div className="relative z-10 text-center w-full max-w-[1440px] mx-auto mt-20">
          <p className="hero-text-anim font-mono text-[10px] md:text-sm tracking-[0.4em] text-accent mb-6 uppercase font-bold">
            Official Development System
          </p>
          <h1 className="hero-text-anim text-[clamp(60px,15vw,250px)] font-display font-black italic uppercase leading-[0.8] text-white tracking-tighter mix-blend-screen drop-shadow-2xl">
            YBBF<br/><span className="text-transparent" style={{ WebkitTextStroke: '2px white' }}>YOUTH</span>
          </h1>
          <p className="hero-text-anim mt-12 text-xl md:text-3xl font-display italic font-bold tracking-wide">
            "NEXT GENERATION OF CHAMPIONS"
          </p>
        </div>
      </section>

      {/* SECTION 2: SYSTEM DIAGRAM */}
      <section className="system-section relative py-32 px-6 md:px-16 max-w-[1440px] mx-auto overflow-hidden">
        {/* 거대 워터마크 타이포 */}
        <h2 className="text-[clamp(60px,12vw,200px)] leading-[0.8] font-display font-black italic uppercase text-white/5 select-none absolute top-10 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
          SYSTEM
        </h2>
        
        <div className="text-center mb-24 relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-black italic uppercase mb-8">Our System</h2>
          <p className="font-sans text-text-muted max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            학교에는 보디빌딩 교과목이 없습니다. <br className="hidden md:block"/>
            본인이 땀 흘리는 체육관이 클럽이 되고, 그 클럽이 용인시 소속이 되며, <br className="hidden md:block"/>
            곧 경기도를 대표하는 선수가 되는 공식 육성 시스템입니다.
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-6 md:gap-8 justify-between z-10">
          {/* Timeline Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10 -translate-y-1/2" />
          
          {/* Step 1 */}
          <div className="system-step flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/30 p-8 md:p-12 relative overflow-hidden group transition-all duration-500 lg:mt-12 rounded-xl">
            <div className="absolute -bottom-8 -right-8 text-[150px] leading-none font-display font-black italic text-white/5 transition-transform group-hover:scale-110 duration-700 pointer-events-none">01</div>
            
            <div className="flex items-start justify-between mb-16 relative z-10">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Dumbbell className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">Step One</span>
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-mono mb-3">나의 훈련 기지</p>
              <h3 className="text-3xl md:text-4xl font-display font-black italic mb-6 text-white">CLUB</h3>
              <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                지역 내 검증된 트레이닝 센터에서 전문적인 지도를 받으며 기본기를 단단하게 다집니다.
              </p>
            </div>
          </div>

          {/* Step 2 (YBBF - Highlighted) */}
          <div className="system-step flex-1 bg-black border border-accent/40 hover:border-accent p-8 md:p-12 relative overflow-hidden group transition-all duration-500 rounded-xl lg:-translate-y-6 shadow-[0_0_30px_rgba(204,255,0,0.05)] hover:shadow-[0_0_50px_rgba(204,255,0,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute -bottom-8 -right-8 text-[150px] leading-none font-display font-black italic text-accent/10 transition-transform group-hover:scale-110 duration-700 pointer-events-none">02</div>
            
            <div className="flex items-start justify-between mb-16 relative z-10">
              <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent flex items-center justify-center text-accent shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                <Shield className="w-6 h-6" />
              </div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent font-bold">The Core</span>
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-mono mb-3">나의 소속 협회</p>
              <h3 className="text-3xl md:text-4xl font-display font-black italic mb-6 text-white">YBBF</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                용인시 보디빌딩협회의 공식 유스 선수로 등록되어 체계적인 관리와 공식 무대 출전 기회를 얻습니다.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="system-step flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/30 p-8 md:p-12 relative overflow-hidden group transition-all duration-500 lg:mt-12 rounded-xl">
            <div className="absolute -bottom-8 -right-8 text-[150px] leading-none font-display font-black italic text-white/5 transition-transform group-hover:scale-110 duration-700 pointer-events-none">03</div>
            
            <div className="flex items-start justify-between mb-16 relative z-10">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Flag className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">Final Goal</span>
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-mono mb-3">내가 대표하는 지역</p>
              <h3 className="text-3xl md:text-4xl font-display font-black italic mb-6 text-white">GYEONGGI</h3>
              <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                용인시를 넘어 경기도 대표로 성장하여 더 큰 무대, 전국 단위의 치열한 경쟁에 도전합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: REGISTERED CLUBS */}
      <section className="clubs-section py-24 bg-[#050505] border-y border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-black italic uppercase mb-4">Official Clubs</h2>
              <p className="text-text-muted">YBBF 유스 시스템에 등록된 공식 트레이닝 센터입니다.</p>
            </div>
            <div className="font-mono text-[10px] tracking-widest text-accent uppercase bg-accent/10 px-4 py-2 rounded-full w-max border border-accent/30">
              Total {youthClubsData.length} Clubs
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {youthClubsData.map(club => (
              <div key={club.id} className="club-card group bg-black border border-white/10 hover:border-accent p-8 rounded-xl transition-colors duration-300 flex flex-col">
                <h3 className="text-xl font-black italic mb-6 group-hover:text-accent transition-colors">{club.name}</h3>
                
                <div className="flex flex-col gap-4 mt-auto">
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <MapPin className="w-4 h-4 opacity-50" />
                    <span>{club.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Users className="w-4 h-4 opacity-50" />
                    <span>코치: {club.coach}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-50">Athletes</span>
                    <span className="font-display font-black italic text-xl">{club.athleteCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: YOUTH ROSTER */}
      <section className="roster-section py-24 md:py-40 px-6 md:px-16 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-display font-black italic uppercase mb-4">Youth Roster</h2>
            <p className="text-text-muted text-lg">"나도 여기 이름이 올라가 있다." — 다음 세대의 챔피언들입니다.</p>
          </div>
          
          {/* Club Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button 
              onClick={() => setActiveClubId('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors border ${
                activeClubId === 'all' ? 'bg-white text-black border-white' : 'border-white/20 text-text-muted hover:border-white'
              }`}
            >
              All Athletes
            </button>
            {youthClubsData.map(club => (
              <button 
                key={club.id}
                onClick={() => setActiveClubId(club.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors border ${
                  activeClubId === club.id ? 'bg-accent text-black border-accent' : 'border-white/20 text-text-muted hover:border-white'
                }`}
              >
                {club.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredAthletes.map(athlete => {
            const club = youthClubsData.find(c => c.id === athlete.clubId);
            return (
              <Link to={`/youth/${athlete.id}`} key={athlete.id} className="athlete-card group relative bg-bg-secondary rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 block">
                {/* Image */}
                <div className="aspect-[3/4] overflow-hidden relative bg-[#111]">
                  <img 
                    src={athlete.image} 
                    alt={athlete.name} 
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-accent text-black font-black italic text-[10px] uppercase tracking-widest px-3 py-1.5 shadow-[0_0_15px_rgba(204,255,0,0.4)]">
                      {athlete.badge.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-accent">{athlete.grade}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="font-mono text-[10px] tracking-widest uppercase text-white/70">{athlete.class}</span>
                    </div>
                    <h3 className="text-3xl font-display font-black italic mb-1">{athlete.name}</h3>
                    <p className="text-sm text-white/70">{athlete.school}</p>
                  </div>
                </div>

                {/* Back of Card / Details */}
                <div className="p-6 bg-black border-t border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-xs font-bold text-white/80 leading-tight">
                      {athlete.achievements?.[0] || '차기 대회 준비 중'}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-text-muted flex justify-between items-center pt-4 border-t border-white/5">
                    <span>CLUB</span>
                    <span className="text-white font-bold">{club?.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredAthletes.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/20 rounded-xl mt-8">
            <p className="text-text-muted font-display italic text-xl">해당 클럽에 등록된 선수가 없습니다.</p>
          </div>
        )}
      </section>

    </div>
  );
}
