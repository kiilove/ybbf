import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { youthAthletesData, youthClubsData } from '../data/youth';
import { ChevronLeft, Trophy, MapPin, Medal } from 'lucide-react';

export default function YouthDetailPage() {
  const { id } = useParams<{ id: string }>();
  const athlete = youthAthletesData.find(a => a.id === id);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (athlete) {
      document.title = `${athlete.name} 선수 프로필 | YBBF YOUTH`;
      const ctx = gsap.context(() => {
        gsap.fromTo('.anim-slide-up', 
          { y: 50, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
        );
        
        gsap.fromTo('.anim-img',
          { scale: 1.1, opacity: 0, filter: 'blur(10px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [athlete]);

  if (!athlete) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-black italic mb-4">Athlete Not Found</h1>
          <Link to="/youth" className="text-accent underline">Return to Youth Roster</Link>
        </div>
      </div>
    );
  }

  const club = youthClubsData.find(c => c.id === athlete.clubId);

  return (
    <div ref={containerRef} className="bg-bg-primary min-h-screen text-text-primary pt-20">
      
      {/* Top Navigation */}
      <div className="absolute top-24 left-6 md:left-16 z-50">
        <Link to="/youth" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Youth
        </Link>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Image Profile */}
        <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:mx-0 lg:max-w-none lg:w-[80%] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <img 
            src={athlete.image} 
            alt={athlete.name} 
            className="anim-img w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-6 right-6">
            <div className="anim-slide-up bg-accent text-black font-black italic text-xs md:text-sm uppercase tracking-widest px-4 py-2 shadow-[0_0_20px_rgba(204,255,0,0.4)]">
              {athlete.badge.replace('_', ' ')}
            </div>
          </div>

          <div className="absolute bottom-6 left-6">
            <div className="anim-slide-up font-mono text-xs tracking-widest text-accent mb-2 uppercase">Official Roster</div>
            <h2 className="anim-slide-up text-5xl md:text-7xl font-display font-black italic uppercase leading-none text-white drop-shadow-lg">
              {athlete.name}
            </h2>
          </div>
        </div>

        {/* Right: Info & Bio */}
        <div className="flex flex-col justify-center">
          
          {athlete.quote && (
            <div className="anim-slide-up mb-12 relative">
              <span className="absolute -top-8 -left-4 text-6xl text-white/10 font-display italic">"</span>
              <p className="text-2xl md:text-4xl font-display font-black italic text-white/90 leading-tight">
                {athlete.quote}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mb-12 border-y border-white/10 py-8">
            <div className="anim-slide-up">
              <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase mb-2">Grade</p>
              <p className="text-xl md:text-2xl font-bold">{athlete.grade}</p>
            </div>
            <div className="anim-slide-up">
              <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase mb-2">Class</p>
              <p className="text-xl md:text-2xl font-bold text-accent">{athlete.class}</p>
            </div>
            <div className="anim-slide-up col-span-2">
              <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase mb-2">School</p>
              <p className="text-xl md:text-2xl font-bold">{athlete.school}</p>
            </div>
          </div>

          <div className="anim-slide-up mb-12 bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] tracking-widest text-accent uppercase">Affiliated Club</p>
              <MapPin className="w-4 h-4 text-white/50" />
            </div>
            <h3 className="text-2xl font-display font-black italic mb-2">{club?.name}</h3>
            <p className="text-sm text-text-muted">코치: {club?.coach}</p>
          </div>

          {athlete.bio && (
            <div className="anim-slide-up mb-12">
              <p className="text-base text-white/80 leading-relaxed font-sans">
                {athlete.bio}
              </p>
            </div>
          )}

          {athlete.achievements && athlete.achievements.length > 0 && (
            <div className="anim-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <Medal className="w-5 h-5 text-accent" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-white">Achievements</h4>
              </div>
              <ul className="space-y-4">
                {athlete.achievements.map((achieve, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <Trophy className="w-4 h-4 text-white/30 mt-1 shrink-0" />
                    <span className="text-white/80">{achieve}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
