/* ────────────────────────────────────────────────
   CSSLegendHero — 레전드 상세 전용 순수 CSS 시네마틱 배경
   
   골드 & 앰버 톤의 명예의 전당 전용 시네마틱 효과
   ──────────────────────────────────────────────── */

const DEFAULT_BASE_IMAGE = 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg';

interface CSSLegendHeroProps {
  imageUrl?: string;
}

export default function CSSLegendHero({ imageUrl }: CSSLegendHeroProps) {
  const targetImage = imageUrl || DEFAULT_BASE_IMAGE;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0, backgroundColor: '#030306' }}
    >
      {/* ── LAYER 1: 메인 선수 사진 ── */}
      <img
        src={targetImage}
        alt="Legend Hero"
        className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300"
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = DEFAULT_BASE_IMAGE;
        }}
      />

      {/* ── LAYER 2: 외곽 비네트 + 가장자리 페이드 ── */}
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

      {/* ── LAYER 3: 골드 & 앰버 후광 (레전드 전용 골드 톤) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 70% at 50% 80%, rgba(212,175,55,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,191,0,0.05) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 50% 40%, rgba(212,175,55,0.03) 0%, transparent 50%)
          `,
          zIndex: 3,
          mixBlendMode: 'screen',
        }}
      />

      {/* ── LAYER 4: 골드 앰비언트 ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 70%, rgba(212,175,55,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 70% 30%, rgba(180,140,40,0.06) 0%, transparent 70%)
          `,
          zIndex: 3,
          mixBlendMode: 'screen',
          animation: 'cssLegendAmbient 10s ease-in-out infinite alternate',
          willChange: 'opacity',
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
        @keyframes cssLegendAmbient {
          0% { opacity: 0.5; transform: scale(1) translateY(0); }
          50% { opacity: 1; transform: scale(1.04) translateY(-1.5%); }
          100% { opacity: 0.6; transform: scale(0.98) translateY(1%); }
        }
      `}</style>
    </div>
  );
}
