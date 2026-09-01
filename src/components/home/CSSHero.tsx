/* ────────────────────────────────────────────────
   CSSHero — 순수 CSS 기반 초고속 시네마틱 무대 후광 배경
   
   • DOM 노드 유지: key 제거로 DOM 재마운트 시 검은 화면 플래시 원천 차단
   • 브라우저 하드웨어 가속 즉시 스와핑
   • GPU 가속 비네트 & 네온 라임 림라이트
   ──────────────────────────────────────────────── */

const DEFAULT_BASE_IMAGE = 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg';

interface CSSHeroProps {
  imageUrl?: string;
}

export default function CSSHero({ imageUrl }: CSSHeroProps) {
  const targetImage = imageUrl || DEFAULT_BASE_IMAGE;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0, backgroundColor: '#030306' }}
    >
      {/* ── LAYER 1: 메인 선수 사진 (DOM 노드 유지, 0ms 즉시 스와핑) ── */}
      <img
        src={targetImage}
        alt="Champion Hero"
        className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300"
        loading="eager"
        decoding="async"
        crossOrigin="anonymous"
        fetchPriority="high"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          if (el.src !== DEFAULT_BASE_IMAGE) {
            el.src = DEFAULT_BASE_IMAGE;
          }
        }}
      />

      {/* ── LAYER 2: 외곽 비네트 + 가장자리 페이드 (스튜디오 벽면/삼각대 마스킹) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(3,3,6,0.4) 60%, rgba(3,3,6,0.85) 80%, #030306 100%),
            linear-gradient(to top, #030306 0%, transparent 8%),
            linear-gradient(to bottom, rgba(3,3,6,0.6) 0%, transparent 6%),
            linear-gradient(to right, #030306 0%, transparent 18%),
            linear-gradient(to left, #030306 0%, transparent 18%)
          `,
          zIndex: 2,
        }}
      />

      {/* ── LAYER 3: 시그니처 네온 라임 림라이트 후광 ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 70% at 50% 80%, rgba(180,255,0,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(180,255,0,0.04) 0%, transparent 50%)
          `,
          zIndex: 3,
          mixBlendMode: 'screen',
        }}
      />

      {/* ── LAYER 4: 에메랄드/사이언 앰비언트 그라디언트 웨이브 ── */}
      <div
        className="absolute inset-0 css-hero-ambient"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 70%, rgba(8,72,41,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 70% 30%, rgba(5,40,65,0.12) 0%, transparent 70%)
          `,
          zIndex: 3,
          mixBlendMode: 'screen',
          animation: 'cssHeroAmbient 8s ease-in-out infinite alternate',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── LAYER 5: 하단 그라디언트 ── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '35%',
          background: 'linear-gradient(to top, #030306 0%, rgba(3,3,6,0.7) 40%, transparent 100%)',
          zIndex: 4,
        }}
      />

      <style>{`
        @keyframes cssHeroAmbient {
          0% { opacity: 0.6; transform: scale(1) translateY(0); }
          50% { opacity: 1; transform: scale(1.05) translateY(-2%); }
          100% { opacity: 0.7; transform: scale(0.98) translateY(1%); }
        }
      `}</style>
    </div>
  );
}
