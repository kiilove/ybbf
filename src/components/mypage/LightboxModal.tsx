import React from 'react';
import { X } from 'lucide-react';

interface LightboxModalProps {
  activeLightboxMedia: { type: 'image' | 'video'; url: string } | null;
  onClose: () => void;
}

export function LightboxModal({ activeLightboxMedia, onClose }: LightboxModalProps) {
  if (!activeLightboxMedia) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-[-45px] right-0 md:right-[-40px] text-white/60 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer z-50"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-full h-full bg-black/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
          {activeLightboxMedia.type === 'video' ? (
            <video 
              src={activeLightboxMedia.url} 
              controls 
              autoPlay
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          ) : (
            <img 
              src={activeLightboxMedia.url} 
              alt="크게 보기" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
