import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { Volume2, VolumeX, Maximize, Play, RotateCcw, User, UserCheck, Flame, Home } from 'lucide-react';

interface AthleteData {
  name: string;
  nameEn: string;
  number: number;
  height: number;
  weight: number;
  age: number;
  division: string;
  slogan: string;
  image: string;
  actionImage: string;
  bio: string;
  themeColor: string;
  accentClass: string;
  bgFilter: string;
}

const athletes: Record<'male' | 'female', AthleteData> = {
  male: {
    name: '김준호',
    nameEn: 'GEORGE KIM',
    number: 77,
    height: 182,
    weight: 105,
    age: 24,
    division: 'CLASSIC BODYBUILDING',
    slogan: 'POWER IS MY WEAPON',
    image: '/male_athlete.png',
    actionImage: '/male_athlete_action.png',
    bio: '한계를 부수고 무대 위에서 증명하라. 그것이 진정한 챔피언이다.',
    themeColor: '#CCFF00', // Lime
    accentClass: 'text-[#CCFF00]',
    bgFilter: 'none', // Raw Red Grunge
  },
  female: {
    name: '서예지',
    nameEn: 'YEJI SEO',
    number: 88,
    height: 168,
    weight: 55,
    age: 22,
    division: 'BIKINI FITNESS',
    slogan: 'ELEGANCE IN POWER',
    image: '/female_athlete.png',
    actionImage: '/female_athlete_action.png',
    bio: '조각처럼 다듬어진 몸에는 거짓이 없다. 매 순간이 노력의 결실이다.',
    themeColor: '#FF007F', // Pink
    accentClass: 'text-[#FF007F]',
    bgFilter: 'hue-rotate(280deg) brightness(0.85) contrast(1.1)', // Turns Red to Electric Purple/Magenta
  },
};

export default function PlayerIntroPage() {
  const [searchParams] = useSearchParams();
  const isStandalone = searchParams.get('standalone') === 'true';

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<'intro' | 'male' | 'female'>('intro');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bgPreset, setBgPreset] = useState<'black' | 'gym'>('black');

  const boundaryRef = useRef<HTMLDivElement>(null);
  
  // Slide Container Refs
  const introSlideRef = useRef<HTMLDivElement>(null);
  const maleSlideRef = useRef<HTMLDivElement>(null);
  const femaleSlideRef = useRef<HTMLDivElement>(null);

  // GSAP Inner elements refs
  const maleStatsRef = useRef<HTMLDivElement[]>([]);
  const femaleStatsRef = useRef<HTMLDivElement[]>([]);
  
  // 2-Cut Photo Refs
  const maleImageRef = useRef<HTMLImageElement>(null);
  const maleActionImageRef = useRef<HTMLImageElement>(null);
  const femaleImageRef = useRef<HTMLImageElement>(null);
  const femaleActionImageRef = useRef<HTMLImageElement>(null);
  
  // Bio Card Refs
  const maleBioRef = useRef<HTMLDivElement>(null);
  const femaleBioRef = useRef<HTMLDivElement>(null);

  const glitchOverlayRef = useRef<HTMLDivElement>(null);
  const delayedCallsRef = useRef<gsap.core.Tween[]>([]);

  // Tickers and HUD states
  const [maleStatsData, setMaleStatsData] = useState({ height: 0, weight: 0, age: 0, number: 0 });
  const [femaleStatsData, setFemaleStatsData] = useState({ height: 0, weight: 0, age: 0, number: 0 });

  // Tech Scanner and Panel refs
  const maleScannerRef = useRef<HTMLDivElement>(null);
  const femaleScannerRef = useRef<HTMLDivElement>(null);
  const maleStatsPanelRef = useRef<HTMLDivElement>(null);
  const femaleStatsPanelRef = useRef<HTMLDivElement>(null);
  const maleDividersRef = useRef<HTMLDivElement[]>([]);
  const femaleDividersRef = useRef<HTMLDivElement[]>([]);

  // Clear array refs to prevent memory accumulation on hot-reloads/re-renders
  maleStatsRef.current = [];
  femaleStatsRef.current = [];
  maleDividersRef.current = [];
  femaleDividersRef.current = [];

  // Sound synthesis for slide transitions (Tear sound + Heavy sub bass drop)
  const playTearSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const duration = 0.9;
      
      // 1. Synthesize ripping paper friction (White noise + bandpass sweep)
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration * 0.7);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.04);

      // Fiber split crackles
      for (let t = 0; t < duration * 0.7; t += 0.065) {
        const randVol = 0.25 + Math.random() * 0.3;
        noiseGain.gain.setValueAtTime(randVol, ctx.currentTime + t);
        noiseGain.gain.exponentialRampToValueAtTime(0.015, ctx.currentTime + t + 0.035);
      }
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();

      // 2. Heavy impact bass boom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(25, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(120, ctx.currentTime);

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.6);

    } catch (e) {
      console.warn("Sound block: ", e);
    }
  };

  // Camera Shake Jitter simulation
  const triggerCameraShake = (intensity: number, duration: number) => {
    if (!boundaryRef.current) return;
    const tl = gsap.timeline();
    const steps = 12;
    const stepDuration = duration / steps;

    for (let i = 0; i < steps; i++) {
      const scaleVal = 1 + (Math.random() * 0.02 - 0.01);
      tl.to(boundaryRef.current, {
        x: (Math.random() * intensity - intensity / 2),
        y: (Math.random() * intensity - intensity / 2),
        scale: scaleVal,
        rotation: (Math.random() * 1.5 - 0.75),
        duration: stepDuration,
        ease: 'none'
      });
    }
    tl.to(boundaryRef.current, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.04 });
  };

  // Generalized transition slider function using photorealistic torn_paper_edge PNG
  const transitionTo = (slide: 'intro' | 'male' | 'female') => {
    if (slide === currentSlide) return;

    // Clear any previous delayed calls
    delayedCallsRef.current.forEach((call) => call.kill());
    delayedCallsRef.current = [];
    
    // Pick correct DOM ref based on target
    const getRef = (s: typeof slide) => {
      if (s === 'intro') return introSlideRef.current;
      if (s === 'male') return maleSlideRef.current;
      return femaleSlideRef.current;
    };

    const targetRef = getRef(slide);
    if (!targetRef) return;

    // Bring slide to top layers
    gsap.set(targetRef, { zIndex: 30, x: '115%' });

    // Transition sound & shake
    playTearSound();
    triggerCameraShake(20, 0.45);

    // Soft, premium white flash light leak (No harsh strobes)
    gsap.fromTo(glitchOverlayRef.current,
      { opacity: 0.35, backgroundColor: '#ffffff', mixBlendMode: 'normal' },
      { opacity: 0, duration: 0.4, ease: 'power2.out' }
    );

    const tl = gsap.timeline({
      onComplete: () => {
        // Rearrange z-indexes after slide completes
        const slides: ('intro' | 'male' | 'female')[] = ['intro', 'male', 'female'];
        slides.forEach((s) => {
          const ref = getRef(s);
          if (!ref) return;
          if (s === slide) {
            gsap.set(ref, { zIndex: 20 });
          } else {
            gsap.set(ref, { zIndex: 10, x: '115%' }); // send others back and off-screen
          }
        });
        setCurrentSlide(slide);
      }
    });

    // Tear slide wipe in (moving the entering slide from right to left)
    tl.to(targetRef, {
      x: '0%',
      duration: 0.75,
      ease: 'power3.inOut'
    });

    // Trigger inner card animations depending on target slide
    if (slide === 'male') {
      // 0. Reset stats ticker state back to zero immediately
      setMaleStatsData({ height: 0, weight: 0, age: 0, number: 0 });

      // Stage 1: Action Image (Cut 1) appears immediately (full focus, opacity: 0.9)
      gsap.fromTo(maleActionImageRef.current,
        { scale: 1.15, opacity: 0, filter: 'grayscale(100%) brightness(0.95) contrast(1.1)' },
        { scale: 1.0, opacity: 0.9, duration: 0.8, ease: 'power2.out', delay: 0.0 }
      );

      // Stage 1.1: Stats Panel Box (overlay) slides in from the right
      gsap.fromTo(maleStatsPanelRef.current,
        { x: 80, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      );

      // Stage 1.2: Stats HUD Grid Lines (draw width 0% to 100%)
      gsap.fromTo(maleDividersRef.current,
        { width: '0%', opacity: 0 },
        { width: '100%', opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.2 }
      );

      // Stage 1.3: Stats HUD individual boxes scale up with a slight spring
      gsap.fromTo(maleStatsRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.04, duration: 0.5, ease: 'back.out(1.2)', delay: 0.3 }
      );

      // Stage 1.4: Action Image disappears after 1.2s to clear the stage
      const disappearCall = gsap.delayedCall(1.2, () => {
        gsap.to(maleActionImageRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.45,
          ease: 'power2.inOut'
        });
      });
      delayedCallsRef.current.push(disappearCall);

      // Stage 2: Main Portrait Cutout (Cut 2) appears at 1.5s as a massive hero
      gsap.fromTo(maleImageRef.current,
        { scale: 0.85, opacity: 0, y: 40 },
        { scale: 1.05, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.1)', delay: 1.5 }
      );

      // Stage 2.1: Neon Laser Scanner line sweeps down player portrait
      gsap.set(maleScannerRef.current, { top: '5%', opacity: 0 });
      const scannerCall = gsap.delayedCall(1.5, () => {
        gsap.fromTo(maleScannerRef.current,
          { top: '5%', opacity: 0.9 },
          { top: '95%', opacity: 0.9, duration: 0.9, ease: 'power1.inOut', onComplete: () => {
            gsap.to(maleScannerRef.current, { opacity: 0, duration: 0.15 });
          }}
        );
      });
      delayedCallsRef.current.push(scannerCall);

      // Secondary camera shake and low-end thump to emphasize portrait entry
      const shakeCall = gsap.delayedCall(1.5, () => {
        triggerCameraShake(6, 0.25);
        if (soundEnabled) {
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(60, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.4);
              gain.gain.setValueAtTime(0.35, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            }
          } catch(e){}
        }
      });
      delayedCallsRef.current.push(shakeCall);

      // Stage 2.2: Stats dynamic count-up tickers from 0 to targets
      const statsObj = { height: 0, weight: 0, age: 0, number: 0 };
      const tickerCall = gsap.delayedCall(1.5, () => {
        gsap.to(statsObj, {
          height: athletes.male.height,
          weight: athletes.male.weight,
          age: athletes.male.age,
          number: athletes.male.number,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => {
            setMaleStatsData({
              height: Math.round(statsObj.height),
              weight: Math.round(statsObj.weight),
              age: Math.round(statsObj.age),
              number: Math.round(statsObj.number)
            });
          }
        });
      });
      delayedCallsRef.current.push(tickerCall);

      // Stage 2.3: Bio Quote inside the HUD card fades/slides in
      gsap.fromTo(maleBioRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 2.0 }
      );
    } else if (slide === 'female') {
      // 0. Reset stats ticker state back to zero immediately
      setFemaleStatsData({ height: 0, weight: 0, age: 0, number: 0 });

      // Stage 1: Action Image (Cut 1) appears immediately (full focus, opacity: 0.9)
      gsap.fromTo(femaleActionImageRef.current,
        { scale: 1.15, opacity: 0, filter: 'grayscale(100%) brightness(0.95) contrast(1.1)' },
        { scale: 1.0, opacity: 0.9, duration: 0.8, ease: 'power2.out', delay: 0.0 }
      );

      // Stage 1.1: Stats Panel Box (overlay) slides in from the right
      gsap.fromTo(femaleStatsPanelRef.current,
        { x: 80, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      );

      // Stage 1.2: Stats HUD Grid Lines (draw width 0% to 100%)
      gsap.fromTo(femaleDividersRef.current,
        { width: '0%', opacity: 0 },
        { width: '100%', opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.2 }
      );

      // Stage 1.3: Stats HUD individual boxes scale up
      gsap.fromTo(femaleStatsRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.04, duration: 0.5, ease: 'back.out(1.2)', delay: 0.3 }
      );

      // Stage 1.4: Action Image disappears after 1.2s to clear the stage
      const disappearCall = gsap.delayedCall(1.2, () => {
        gsap.to(femaleActionImageRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.45,
          ease: 'power2.inOut'
        });
      });
      delayedCallsRef.current.push(disappearCall);

      // Stage 2: Main Portrait Cutout (Cut 2) appears at 1.5s as a massive hero
      gsap.fromTo(femaleImageRef.current,
        { scale: 0.85, opacity: 0, y: 40 },
        { scale: 1.05, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.1)', delay: 1.5 }
      );

      // Stage 2.1: Neon Laser Scanner line sweeps down player portrait
      gsap.set(femaleScannerRef.current, { top: '5%', opacity: 0 });
      const scannerCall = gsap.delayedCall(1.5, () => {
        gsap.fromTo(femaleScannerRef.current,
          { top: '5%', opacity: 0.9 },
          { top: '95%', opacity: 0.9, duration: 0.9, ease: 'power1.inOut', onComplete: () => {
            gsap.to(femaleScannerRef.current, { opacity: 0, duration: 0.15 });
          }}
        );
      });
      delayedCallsRef.current.push(scannerCall);

      // Secondary camera shake and low thump to emphasize portrait entry
      const shakeCall = gsap.delayedCall(1.5, () => {
        triggerCameraShake(6, 0.25);
        if (soundEnabled) {
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(60, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.4);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            }
          } catch(e){}
        }
      });
      delayedCallsRef.current.push(shakeCall);

      // Stage 2.2: Stats dynamic count-up tickers from 0 to targets
      const statsObj = { height: 0, weight: 0, age: 0, number: 0 };
      const tickerCall = gsap.delayedCall(1.5, () => {
        gsap.to(statsObj, {
          height: athletes.female.height,
          weight: athletes.female.weight,
          age: athletes.female.age,
          number: athletes.female.number,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => {
            setFemaleStatsData({
              height: Math.round(statsObj.height),
              weight: Math.round(statsObj.weight),
              age: Math.round(statsObj.age),
              number: Math.round(statsObj.number)
            });
          }
        });
      });
      delayedCallsRef.current.push(tickerCall);

      // Stage 2.3: Bio Quote inside the HUD card fades/slides in
      gsap.fromTo(femaleBioRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 2.0 }
      );
    }
  };

  // Run automated 10-second slideshow looping through all slides
  const playDemoSequence = () => {
    if (isPlaying) return;
    setIsPlaying(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsPlaying(false);
      }
    });

    // Pacing loop: Intro -> Male (3s) -> Female (3s) -> Back to Intro
    tl.call(() => transitionTo('male'), [], 2.0)
      .call(() => transitionTo('female'), [], 5.5)
      .call(() => {
        setTimeout(() => {
          transitionTo('intro');
        }, 2200);
      }, [], 8.8);
  };

  // Auto trigger animation on mount
  useEffect(() => {
    // Set initial states
    gsap.set(introSlideRef.current, { x: '0%', zIndex: 20 });
    gsap.set([maleSlideRef.current, femaleSlideRef.current], { x: '115%', zIndex: 10 });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!boundaryRef.current) return;
    if (!document.fullscreenElement) {
      boundaryRef.current.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };



  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center bg-[#020202] font-sans ${isStandalone ? 'p-0' : 'py-12 px-4'}`}>
      
      {/* Top controls header */}
      {!isStandalone && (
        <div className="w-full max-w-[600px] mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 z-20">
          <div>
            <h1 className="text-xl font-black font-display tracking-widest text-[#a61220] flex items-center gap-2">
              <span className="h-3 w-3 bg-[#a61220] animate-pulse"></span>
              YBBF OVERLAY MAX
            </h1>
            <p className="text-[10px] text-white/50 tracking-widest font-mono">Torn Paper PNG transition (No Outro)</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white border border-white/10 transition"
              title={soundEnabled ? "Disable SFX" : "Enable SFX"}
            >
              {soundEnabled ? <Volume2 size={16} className="text-[#CCFF00]" /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white border border-white/10 transition flex items-center gap-1 text-xs"
              title="Launch Fullscreen"
            >
              <Maximize size={16} /> <span className="hidden sm:inline">전광판 모드</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Aspect Canvas Container */}
      <div 
        ref={boundaryRef}
        className={`bg-[#000] overflow-hidden relative shadow-[0_0_60px_rgba(0,0,0,0.98)] z-10 select-none transition-all duration-300 ${
          isFullscreen 
            ? 'w-screen h-screen rounded-none border-none' 
            : 'w-full max-w-[600px] aspect-square rounded-2xl border border-white/10'
        }`}
      >
        {/* TRANSITION CHROMATIC GLITCH FLASH BLOCK */}
        <div 
          ref={glitchOverlayRef}
          className="absolute inset-0 z-50 pointer-events-none opacity-0"
        />

        {/* -------------------- SLIDE 1: INTRO SLIDE -------------------- */}
        <div 
          ref={introSlideRef}
          className="absolute inset-0 flex flex-col justify-between p-12 overflow-hidden select-none"
          style={{ 
            backgroundImage: 'url("/grunge_red_bg.png")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center' 
          }}
        >
          {/* Subtle scratches overlay inside CSS */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,transparent_45%,#fff_50%,transparent_55%)] bg-[length:90px_90px] pointer-events-none" />

          {/* Top Logo */}
          <div className="flex justify-center items-center z-10">
            <div className="border border-white/20 px-3 py-1 flex items-center gap-1.5 rounded-sm bg-black/40">
              <span className="text-[10px] tracking-[0.3em] font-black text-white/80 font-display">YBBF 2026</span>
            </div>
          </div>

          {/* Center Main Title */}
          <div className="title-box flex flex-col items-center justify-center text-center z-10 my-auto">
            <h2 className="text-white font-black font-display text-4xl sm:text-5xl tracking-tighter uppercase leading-[0.9] italic mb-4">
              YBBF 2026<br />
              <span className="text-[#CCFF00] drop-shadow-[0_0_15px_rgba(204,255,0,0.45)]">CHAMPIONSHIPS</span>
            </h2>
            {/* White paint-brush tag style subtitle */}
            <div className="bg-white text-black px-6 py-1.5 text-xs font-black tracking-[0.25em] skew-x-[-12deg] uppercase">
              Official Entrance Intro
            </div>
          </div>

          {/* Footer stats */}
          <div className="flex justify-between items-center text-white/40 font-mono text-[9px] tracking-widest uppercase z-10 border-t border-white/10 pt-4">
            <span>2026 EDITION</span>
            <span>YBBF • STAGE INTRO</span>
          </div>
        </div>

        {/* -------------------- SLIDE 2: MALE ATHLETE SLIDE -------------------- */}
        <div 
          ref={maleSlideRef}
          className="absolute inset-0 overflow-hidden select-none"
          style={{ 
            backgroundImage: 'url("/grunge_red_bg.png")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: athletes.male.bgFilter
          }}
        >
          {/* Jagged Ripped Edge on Left leading boundary - Uses high-res PNG */}
          <img 
            src="/torn_paper_edge.png" 
            alt="torn edge" 
            className="absolute top-0 bottom-0 left-0 -translate-x-[98%] w-16 h-full z-45 pointer-events-none drop-shadow-[-10px_0_12px_rgba(0,0,0,0.65)]" 
          />

          {/* Full Screen Action image behind */}
          <img 
            ref={maleActionImageRef}
            src={athletes.male.actionImage} 
            alt="Male action flex"
            className="absolute inset-0 w-full h-full object-cover select-none z-5 opacity-0"
            onError={(e) => {
              e.currentTarget.src = "https://picsum.photos/800/1000?random=15";
            }}
          />

          {/* Huge Portrait Cutout (Occupying 68% of screen) */}
          <div className="absolute inset-y-0 left-0 w-[68%] z-20 flex justify-center items-end overflow-hidden pointer-events-none">
            {/* Laser Scanner Line */}
            <div 
              ref={maleScannerRef}
              className="absolute left-0 right-0 h-[3px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-30 opacity-0 pointer-events-none"
            />
            <img 
              ref={maleImageRef}
              src={bgPreset === 'gym' ? '/male_athlete_gym.png' : athletes.male.image} 
              alt={athletes.male.name}
              className="h-[105%] object-contain select-none origin-bottom opacity-0"
              onError={(e) => {
                e.currentTarget.src = "https://picsum.photos/800/1000?random=11";
              }}
            />
          </div>

          {/* Right Side Overlay: Player HUD Card (42% width) */}
          <div 
            ref={maleStatsPanelRef}
            className={`absolute top-8 right-6 bottom-8 bg-black/80 border border-white/10 backdrop-blur-md flex flex-col justify-between z-25 rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-left opacity-0 transition-all duration-300 ${
              isFullscreen ? 'p-8 sm:p-10 w-[46%]' : 'p-5 w-[42%]'
            }`}
          >
            {/* Tech bracket accents for HUD feel */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#CCFF00] opacity-80" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#CCFF00] opacity-80" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#CCFF00] opacity-80" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#CCFF00] opacity-80" />

            <div>
              <div className={`tracking-[0.2em] font-black text-white/50 uppercase font-mono flex items-center justify-between ${
                isFullscreen ? 'text-xs sm:text-sm md:text-base' : 'text-[10px] sm:text-xs'
              }`}>
                <span>★ {athletes.male.division}</span>
                <span className="text-[#CCFF00] animate-pulse text-[9px] sm:text-xs font-bold">● LIVE DATA</span>
              </div>

              {/* Animated Width Divider */}
              <div 
                ref={(el) => { if (el) maleDividersRef.current.push(el); }}
                className="h-[1px] bg-gradient-to-r from-[#CCFF00]/50 via-white/15 to-transparent w-0 my-3"
              />

              <div className="flex flex-col">
                <div className={`text-[#CCFF00] font-black tracking-widest uppercase mb-1.5 flex items-center gap-1.5 font-mono ${
                  isFullscreen ? 'text-xs sm:text-sm md:text-base mb-2.5' : 'text-[10px] sm:text-xs'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-[#CCFF00]" />
                  {athletes.male.slogan}
                </div>

                <h2 className={`text-white font-black font-display tracking-tight leading-none uppercase italic mb-1.5 ${
                  isFullscreen ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-2.5' : 'text-4xl sm:text-5xl'
                }`}>
                  {athletes.male.name}
                </h2>
                <div className={`text-white/40 font-mono uppercase mb-4 ${
                  isFullscreen ? 'text-xs sm:text-sm md:text-base tracking-[0.25em]' : 'text-[10px] tracking-widest'
                }`}>
                  {athletes.male.nameEn}
                </div>
              </div>

              {/* Stats Box Grid (Displaying Count-up state variables) */}
              <div className={`grid grid-cols-2 ${isFullscreen ? 'gap-3.5' : 'gap-2'}`}>
                <div 
                  ref={(el) => { if (el) maleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-white/50 mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Height</span>
                  <span className={`font-black text-white leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    {maleStatsData.height}<span className={`text-white/60 ml-0.5 font-sans ${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'}`}>cm</span>
                  </span>
                </div>
                <div 
                  ref={(el) => { if (el) maleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-white/50 mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Weight</span>
                  <span className={`font-black text-white leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    {maleStatsData.weight}<span className={`text-white/60 ml-0.5 font-sans ${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'}`}>kg</span>
                  </span>
                </div>
                <div 
                  ref={(el) => { if (el) maleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-white/50 mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Age</span>
                  <span className={`font-black text-white leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    {maleStatsData.age}<span className={`text-white/60 ml-0.5 font-sans ${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'}`}>Y</span>
                  </span>
                </div>
                <div 
                  ref={(el) => { if (el) maleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-[#CCFF00] mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Number</span>
                  <span className={`font-black text-[#CCFF00] leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    NO.{maleStatsData.number}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Bio integrated directly at the bottom of the HUD panel */}
            <div 
              ref={maleBioRef}
              className={`border-l-2 border-l-[#CCFF00] bg-white/5 rounded-sm shadow-inner opacity-0 ${
                isFullscreen ? 'p-4 sm:p-5 border-l-4' : 'p-3'
              }`}
            >
              <div className={`text-white/40 font-black uppercase tracking-wider mb-1 font-mono ${isFullscreen ? 'text-xs' : 'text-[9px]'}`}>ATHLETE RESOLUTION</div>
              <p className={`text-white leading-snug font-medium italic font-sans ${isFullscreen ? 'text-sm sm:text-base md:text-lg' : 'text-xs'}`}>
                "{athletes.male.bio}"
              </p>
            </div>

            <div className="text-[8px] tracking-widest font-mono text-white/30 uppercase pt-2 border-t border-white/5 flex justify-between">
              <span>YBBF INTRO SYSTEM</span>
              <span>2026 EDITION</span>
            </div>
          </div>
        </div>

        {/* -------------------- SLIDE 3: FEMALE ATHLETE SLIDE -------------------- */}
        <div 
          ref={femaleSlideRef}
          className="absolute inset-0 overflow-hidden select-none"
          style={{ 
            backgroundImage: 'url("/grunge_red_bg.png")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: athletes.female.bgFilter
          }}
        >
          {/* Jagged Ripped Edge */}
          <img 
            src="/torn_paper_edge.png" 
            alt="torn edge" 
            className="absolute top-0 bottom-0 left-0 -translate-x-[98%] w-16 h-full z-45 pointer-events-none drop-shadow-[-10px_0_12px_rgba(0,0,0,0.65)]" 
          />

          {/* Full Screen Action image behind */}
          <img 
            ref={femaleActionImageRef}
            src={athletes.female.actionImage} 
            alt="Female action flex"
            className="absolute inset-0 w-full h-full object-cover select-none z-5 opacity-0"
            onError={(e) => {
              e.currentTarget.src = "https://picsum.photos/800/1000?random=25";
            }}
          />

          {/* Huge Portrait Cutout (Occupying 68% of screen) */}
          <div className="absolute inset-y-0 left-0 w-[68%] z-20 flex justify-center items-end overflow-hidden pointer-events-none">
            {/* Laser Scanner Line */}
            <div 
              ref={femaleScannerRef}
              className="absolute left-0 right-0 h-[3px] bg-pink-500 shadow-[0_0_15px_#ec4899] z-30 opacity-0 pointer-events-none"
            />
            <img 
              ref={femaleImageRef}
              src={bgPreset === 'gym' ? '/female_athlete_gym.png' : athletes.female.image} 
              alt={athletes.female.name}
              className="h-[105%] object-contain select-none origin-bottom opacity-0"
              onError={(e) => {
                e.currentTarget.src = "https://picsum.photos/800/1000?random=22";
              }}
            />
          </div>

          {/* Right Side Overlay: Player HUD Card (42% width) */}
          <div 
            ref={femaleStatsPanelRef}
            className={`absolute top-8 right-6 bottom-8 bg-black/80 border border-white/10 backdrop-blur-md flex flex-col justify-between z-25 rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-left opacity-0 transition-all duration-300 ${
              isFullscreen ? 'p-8 sm:p-10 w-[46%]' : 'p-5 w-[42%]'
            }`}
          >
            {/* Tech bracket accents for HUD feel */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF007F] opacity-80" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF007F] opacity-80" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF007F] opacity-80" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF007F] opacity-80" />

            <div>
              <div className={`tracking-[0.2em] font-black text-white/50 uppercase font-mono flex items-center justify-between ${
                isFullscreen ? 'text-xs sm:text-sm md:text-base' : 'text-[10px] sm:text-xs'
              }`}>
                <span>★ {athletes.female.division}</span>
                <span className="text-[#FF007F] animate-pulse text-[9px] sm:text-xs font-bold">● LIVE DATA</span>
              </div>

              {/* Animated Width Divider */}
              <div 
                ref={(el) => { if (el) femaleDividersRef.current.push(el); }}
                className="h-[1px] bg-gradient-to-r from-[#FF007F]/50 via-white/15 to-transparent w-0 my-3"
              />

              <div className="flex flex-col">
                <div className={`text-[#FF007F] font-black tracking-widest uppercase mb-1.5 flex items-center gap-1.5 font-mono ${
                  isFullscreen ? 'text-xs sm:text-sm md:text-base mb-2.5' : 'text-[10px] sm:text-xs'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-[#FF007F]" />
                  {athletes.female.slogan}
                </div>

                <h2 className={`text-white font-black font-display tracking-tight leading-none uppercase italic mb-1.5 ${
                  isFullscreen ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-2.5' : 'text-4xl sm:text-5xl'
                }`}>
                  {athletes.female.name}
                </h2>
                <div className={`text-white/40 font-mono uppercase mb-4 ${
                  isFullscreen ? 'text-xs sm:text-sm md:text-base tracking-[0.25em]' : 'text-[10px] tracking-widest'
                }`}>
                  {athletes.female.nameEn}
                </div>
              </div>

              {/* Stats Box Grid */}
              <div className={`grid grid-cols-2 gap-2 ${isFullscreen ? 'gap-3.5' : 'gap-2'}`}>
                <div 
                  ref={(el) => { if (el) femaleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-white/50 mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Height</span>
                  <span className={`font-black text-white leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    {femaleStatsData.height}<span className={`text-white/60 ml-0.5 font-sans ${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'}`}>cm</span>
                  </span>
                </div>
                <div 
                  ref={(el) => { if (el) femaleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-white/50 mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Weight</span>
                  <span className={`font-black text-white leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    {femaleStatsData.weight}<span className={`text-white/60 ml-0.5 font-sans ${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'}`}>kg</span>
                  </span>
                </div>
                <div 
                  ref={(el) => { if (el) femaleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-white/50 mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Age</span>
                  <span className={`font-black text-white leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    {femaleStatsData.age}<span className={`text-white/60 ml-0.5 font-sans ${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'}`}>Y</span>
                  </span>
                </div>
                <div 
                  ref={(el) => { if (el) femaleStatsRef.current.push(el); }}
                  className={`border border-white/10 bg-white/5 flex flex-col justify-center rounded-sm font-mono relative shadow-md ${
                    isFullscreen ? 'p-4 sm:p-5' : 'p-3'
                  }`}
                >
                  <span className={`uppercase font-black text-[#FF007F] mb-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Number</span>
                  <span className={`font-black text-[#FF007F] leading-none font-display ${isFullscreen ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                    NO.{femaleStatsData.number}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Bio integrated directly at the bottom of the HUD panel */}
            <div 
              ref={femaleBioRef}
              className={`border-l-2 border-l-[#FF007F] bg-white/5 rounded-sm shadow-inner opacity-0 ${
                isFullscreen ? 'p-4 sm:p-5 border-l-4' : 'p-3'
              }`}
            >
              <div className={`text-white/40 font-black uppercase tracking-wider mb-1 font-mono ${isFullscreen ? 'text-xs' : 'text-[9px]'}`}>ATHLETE RESOLUTION</div>
              <p className={`text-white leading-snug font-medium italic font-sans ${isFullscreen ? 'text-sm sm:text-base md:text-lg' : 'text-xs'}`}>
                "{athletes.female.bio}"
              </p>
            </div>

            <div className="text-[8px] tracking-widest font-mono text-white/30 uppercase pt-2 border-t border-white/5 flex justify-between">
              <span>YBBF INTRO SYSTEM</span>
              <span>2026 EDITION</span>
            </div>
          </div>
        </div>

      </div>

      {/* Control Panel Panel */}
      {!isStandalone && (
        <div className="w-full max-w-[600px] mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 z-20">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/50 font-medium">데모 컨트롤 패널</span>
            {isPlaying && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#a61220]/20 text-[#a61220] animate-pulse border border-[#a61220]/30 font-mono">
                시퀀스 자동 상영 중 (10s)
              </span>
            )}
          </div>

          {/* Direct Slide Control Buttons (Reduced to 3 columns) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { if (!isPlaying) transitionTo('intro'); }}
              disabled={isPlaying}
              className={`py-2 px-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition ${
                currentSlide === 'intro' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5'
              }`}
            >
              <Home size={12} />
              인트로
            </button>
            <button
              onClick={() => { if (!isPlaying) transitionTo('male'); }}
              disabled={isPlaying}
              className={`py-2 px-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition ${
                currentSlide === 'male' ? 'bg-[#CCFF00] text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5'
              }`}
            >
              <User size={12} />
              남자(라임)
            </button>
            <button
              onClick={() => { if (!isPlaying) transitionTo('female'); }}
              disabled={isPlaying}
              className={`py-2 px-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition ${
                currentSlide === 'female' ? 'bg-[#FF007F] text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5'
              }`}
            >
              <UserCheck size={12} />
              여자(핑크)
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Play sequence button */}
            <button
              onClick={playDemoSequence}
              disabled={isPlaying}
              className="py-3 px-4 rounded-xl font-black bg-[#8B0000] text-white hover:bg-[#a60000] transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(139,0,0,0.5)] border border-red-800"
            >
              <Flame size={16} className="text-[#CCFF00] animate-bounce" />
              10초 자동 시퀀스 재생
            </button>

            {/* Reset button */}
            <button
              onClick={() => {
                if (isPlaying) return;
                transitionTo('intro');
              }}
              disabled={isPlaying}
              className="py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              인트로로 리셋
            </button>
          </div>

          {/* Background Preset Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/40 p-3.5 rounded-xl border border-white/10 gap-3">
            <div className="flex flex-col text-left">
              <span className="text-xs text-white font-black tracking-wider">사진 배경 테스트 프리셋</span>
              <span className="text-[9px] text-white/50 font-mono">체육관 배경(누끼 아님) 사진에서의 오버레이를 테스트합니다.</span>
            </div>
            <div className="flex gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setBgPreset('black')}
                className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black tracking-wider transition ${
                  bgPreset === 'black' ? 'bg-[#CCFF00] text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                }`}
              >
                블랙 배경
              </button>
              <button
                onClick={() => setBgPreset('gym')}
                className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black tracking-wider transition ${
                  bgPreset === 'gym' ? 'bg-[#CCFF00] text-black shadow-md' : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                }`}
              >
                체육관 배경
              </button>
            </div>
          </div>

          <div className="text-[10px] text-white/40 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5 font-mono">
            * <strong className="text-white/60">피드백 반영 내역:</strong> 
            <br />
            1. **YBBF 2026 브랜딩**: 텍스트를 `YONGIN.B.B.F` 대신 직관적이고 웅장한 `YBBF 2026`으로 전면 변경.
            <br />
            2. **선수당 2컷 레이어 애니메이션**: 슬라이드 전환 시 뒷배경에 거대한 **Grayscale Action Shot**이 저반사로 깔리고, 앞쪽에 선명한 **Portrait Cutout**이 팝업하며 두 장의 이미지가 입체감을 형성.
            <br />
            3. **선수 사진 및 텍스트 2배 스케일업**: 사진 영역을 `52%`로 늘려 선수가 크게 부각되며, 주요 등번호/이름/스탯 글자 크기를 압도적으로 확대.
            <br />
            4. **경박스러운 깜빡임 제거**: 자극적인 네온 반사 글리치 오버레이를 지우고 부드러운 화이트 라이트 리크로 변환. 카드의 진동/회전을 제거하여 묵직하고 스무스하게 슬라이딩 하도록 세팅.
            <br />
            5. **땡큐포왓칭(Outro) 제거**: 불필요한 아웃트로 슬라이드를 날려 인트로 ➡️ 남자 ➡️ 여자가 유기적으로 루프하도록 수정.
          </div>
        </div>
      )}
    </div>
  );
}
