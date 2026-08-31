import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Maximize, Minimize, Trophy } from 'lucide-react';
import { RegistrationPayload } from '../../types/registration';
import { AthleteIntroScene } from './AthleteIntroScene';
import { THEME_CONFIGS } from './themeConfig';

interface AthleteIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: RegistrationPayload | null;
}

export function AthleteIntroModal({
  isOpen,
  onClose,
  player,
}: AthleteIntroModalProps) {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('GOLD');
  const [selectedJoinIndex, setSelectedJoinIndex] = useState<number>(0);
  const [replayKey, setReplayKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen change listener to sync state with native browser F11 / ESC / gestures
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen || !player) return null;

  const joins = player.joins && Array.isArray(player.joins) ? player.joins : [];

  const handleReplay = () => {
    setReplayKey((prev) => prev + 1);
  };

  const handleSelectJoin = (index: number) => {
    setSelectedJoinIndex(index);
    setReplayKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (modalContainerRef.current?.requestFullscreen) {
        modalContainerRef.current.requestFullscreen().catch(() => {});
      } else if ((modalContainerRef.current as any)?.webkitRequestFullscreen) {
        (modalContainerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  return (
    <div 
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 bg-black backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-300 ${
        isFullscreen ? 'p-0 w-screen h-screen overflow-hidden' : 'p-2 sm:p-6'
      }`}
    >
      
      {/* Top Floating Control Bar */}
      <div className={`w-full z-50 flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300 ${
        isFullscreen 
          ? 'absolute top-4 left-4 right-4 max-w-none opacity-20 hover:opacity-100 hover:bg-black/80 p-2.5 rounded-2xl backdrop-blur-xl pointer-events-auto shadow-2xl border border-white/10' 
          : 'max-w-[1280px] mb-3'
      }`}>
        
        {/* Left: Category / Division Tabs (중복 출전 종목 선택기) */}
        {joins.length > 0 ? (
          <div className="flex items-center gap-1.5 p-1 bg-black/80 border border-white/20 rounded-2xl backdrop-blur-2xl shadow-2xl overflow-x-auto max-w-[calc(100vw-120px)] sm:max-w-none">
            <span className="text-[10px] text-white/50 font-bold px-2 flex items-center gap-1 shrink-0 font-mono">
              <Trophy className="w-3 h-3 text-[#d2ff00]" />
              출전종목:
            </span>
            {joins.map((join, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectJoin(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedJoinIndex === idx
                    ? 'bg-[#d2ff00] text-black shadow-lg shadow-[#d2ff00]/25 font-black scale-105'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{join.contestCategoryTitle}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  selectedJoinIndex === idx ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-[#d2ff00]'
                }`}>
                  {join.contestGradeTitle}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        {/* Right: Theme Picker & Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Picker */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-black/80 border border-white/20 rounded-2xl backdrop-blur-2xl shadow-2xl">
            {Object.values(THEME_CONFIGS).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setSelectedTheme(t.key);
                  handleReplay();
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedTheme === t.key
                    ? `${t.badgeBg} border shadow-lg font-black`
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={t.name}
              >
                <span>{t.icon}</span>
              </button>
            ))}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReplay}
              className="p-2 bg-black/80 hover:bg-white/20 text-white rounded-xl border border-white/20 backdrop-blur-2xl shadow-2xl cursor-pointer transition-colors"
              title="애니메이션 다시 재생"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 bg-black/80 hover:bg-white/20 text-white rounded-xl border border-white/20 backdrop-blur-2xl shadow-2xl cursor-pointer transition-colors"
              title={isFullscreen ? '전체화면 종료' : '전체화면 전환 (모니터 꽉 채우기)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-[#d2ff00]" /> : <Maximize className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-2xl cursor-pointer transition-colors"
              title="닫기 (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Screen Container - Fullscreen when expanded */}
      <div className={`w-full relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
        isFullscreen
          ? 'w-screen h-screen max-w-none max-h-none rounded-none aspect-auto'
          : 'max-w-[1280px] aspect-[16/9] max-h-[85vh] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)]'
      }`}>
        <AthleteIntroScene
          key={`${selectedJoinIndex}-${replayKey}`}
          player={player}
          selectedJoinIndex={selectedJoinIndex}
          colorTheme={selectedTheme}
          isFullscreen={isFullscreen}
          onReplay={handleReplay}
        />
      </div>

    </div>
  );
}
