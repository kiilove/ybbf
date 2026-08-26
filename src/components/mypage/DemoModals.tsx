import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface LedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LedDemoModal({ isOpen, onClose }: LedDemoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#161a16] border border-white/10 rounded-2xl max-w-3xl w-full p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 p-2 rounded-full border border-white/10 transition cursor-pointer"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
        
        <h4 className="text-sm font-bold text-accent mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" /> 전광판 선수 등장 연출 예시
        </h4>
        
        <div className="space-y-4">
          <video
            src="https://ybbf-media-worker.jbkim.workers.dev/api/photos/player_photos/intro_video_선수소개.mp4"
            controls
            autoPlay
            className="w-full aspect-video rounded-xl border border-white/10 bg-black shadow-lg"
          />
          <p className="text-[11px] md:text-xs text-white/50 leading-relaxed font-sans text-center break-keep">
            * 대회 본선 진입 시, 대형 LED 스크린 전광판에 선수가 등록한 사진과 프로필이 웅장한 연출 효과와 함께 자동 표출됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
