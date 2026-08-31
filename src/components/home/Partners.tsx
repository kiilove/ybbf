import { useEffect, useState, useRef } from 'react';
import { sponsorService, type SponsorItem } from '../../services/sponsorService';
import { 
  Building2, Globe, Camera, Video, Phone, Mail, 
  MapPin, ExternalLink, X, Shield, Sparkles, User,
  ChevronRight, ArrowUpRight, Play, Film, Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Partners() {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);
  const [modalMediaType, setModalMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await sponsorService.getActiveSponsors();
        setSponsors(list);
      } catch (err) {
        console.warn('스폰서 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSponsor) {
      if (!selectedSponsor.imageUrl && selectedSponsor.videoUrl) {
        setModalMediaType('VIDEO');
      } else {
        setModalMediaType('IMAGE');
      }
    }
  }, [selectedSponsor]);

  const handleRequestNativeFullscreen = () => {
    if (videoPlayerRef.current && videoPlayerRef.current.requestFullscreen) {
      videoPlayerRef.current.requestFullscreen();
    }
  };

  // 롤링용 2회 반복 리스트
  const displayList = sponsors.length > 0 ? [...sponsors, ...sponsors] : [];

  return (
    <section className="py-24 md:py-32 bg-[#050507] border-t border-b border-white/10 overflow-hidden relative">
      
      {/* ═══ 상단 헤더 & 전체보기 버튼 ═══ */}
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-14 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-[#b4ff00]" />
            <p className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-[#b4ff00]">
              OFFICIAL SPONSORS & PARTNERS
            </p>
          </div>
          <h2 className="text-display text-[clamp(40px,5.5vw,80px)] leading-[0.85] font-black italic uppercase tracking-tighter text-white">
            공식 협찬사 & <br />
            파트너십
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-xs font-mono text-white/50 max-w-xs">
            용인특례시 보디빌딩협회와 함께하는 공식 파트너사입니다.
          </div>
          
          <Link
            to="/sponsors"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/5 hover:bg-[#b4ff00] text-white hover:text-black font-display font-black italic uppercase text-sm tracking-wider border border-white/15 hover:border-[#b4ff00] transition-all duration-300 shrink-0 shadow-lg hover:shadow-[0_0_25px_rgba(180,255,0,0.4)] group"
          >
            <span>스폰서 전체보기 ({sponsors.length || 29})</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ═══ 고속 & 부드러운 하드웨어 가속 마키 트랙 ═══ */}
      <div className="relative w-full bg-[#030305] py-10 border-y border-white/10 overflow-hidden group">
        
        {/* 양옆 페이드 비네팅 마스크 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-44 bg-gradient-to-r from-[#030305] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-44 bg-gradient-to-l from-[#030305] to-transparent z-10" />

        <style>{`
          @keyframes fast-marquee {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
          .fast-marquee-track {
            display: flex;
            width: max-content;
            animation: fast-marquee 24s linear infinite;
            will-change: transform;
            backface-visibility: hidden;
            transform: translate3d(0, 0, 0);
          }
          .group:hover .fast-marquee-track {
            animation-play-state: paused;
          }
        `}</style>
        
        <div className="fast-marquee-track flex items-center gap-6 md:gap-8 px-4">
          {displayList.map((sponsor, i) => (
            <button
              key={`${sponsor.id || i}-${i}`}
              type="button"
              onClick={() => setSelectedSponsor(sponsor)}
              className="flex items-center justify-center h-16 md:h-20 px-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#b4ff00]/70 hover:bg-white/[0.08] transition-colors duration-200 group/card shrink-0 cursor-pointer shadow-sm hover:scale-105"
              title={`${sponsor.name} 상세 보기`}
            >
              {sponsor.imageUrl ? (
                <img
                  src={sponsor.imageUrl}
                  alt={sponsor.name}
                  className="max-h-10 md:max-h-12 max-w-[140px] md:max-w-[180px] object-contain grayscale opacity-65 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-200 pointer-events-none"
                  loading="eager"
                />
              ) : (
                <div className="flex items-center gap-2.5 pointer-events-none">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-[#b4ff00] border border-[#b4ff00]/30 shrink-0">
                    {sponsor.tag || 'PARTNER'}
                  </span>
                  <span className="text-sm md:text-base font-display font-black italic uppercase text-white/75 group-hover/card:text-white transition-colors whitespace-nowrap">
                    {sponsor.name}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ 🎬 초대형 극장 모달 (Ultra-Wide Cinema Modal) ═══ */}
      {selectedSponsor && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-3 md:p-6 overflow-y-auto"
          onClick={() => setSelectedSponsor(null)}
        >
          <div 
            className="bg-[#09090e] border border-white/20 rounded-3xl max-w-6xl w-full max-h-[96vh] overflow-y-auto p-5 md:p-8 relative text-white shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col gap-6"
            onClick={e => e.stopPropagation()}
          >
            {/* 상단 닫기 & 컨트롤 바 */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b4ff00]/10 border border-[#b4ff00]/40 text-[#b4ff00] text-xs font-mono font-bold uppercase">
                  <Shield size={12} /> {selectedSponsor.tag || 'OFFICIAL PARTNER'}
                </span>

                {selectedSponsor.videoUrl && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold">
                    <Film size={12} /> 공식 무대 전광판 LED 광고 (Full HD 1080p)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {modalMediaType === 'VIDEO' && selectedSponsor.videoUrl && (
                  <button
                    type="button"
                    onClick={handleRequestNativeFullscreen}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                    title="전체화면으로 확장"
                  >
                    <Maximize2 size={13} />
                    <span className="hidden sm:inline">전체화면</span>
                  </button>
                )}

                <button 
                  onClick={() => setSelectedSponsor(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ═══ 🎬 초대형 16:9 비디오 스크린 (화면의 주인공!) ═══ */}
            <div className="rounded-3xl bg-black border border-white/15 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full flex items-center justify-center">
              {modalMediaType === 'VIDEO' && selectedSponsor.videoUrl ? (
                <div className="relative w-full aspect-video max-h-[70vh] bg-black flex items-center justify-center">
                  <video 
                    ref={videoPlayerRef}
                    src={selectedSponsor.videoUrl} 
                    controls 
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              ) : selectedSponsor.imageUrl ? (
                <div className="h-64 md:h-80 w-full flex items-center justify-center p-10 bg-black/80">
                  <img src={selectedSponsor.imageUrl} alt={selectedSponsor.name} className="max-h-full max-w-full object-contain" />
                </div>
              ) : selectedSponsor.videoUrl ? (
                <div className="relative w-full aspect-video max-h-[70vh] bg-black flex items-center justify-center">
                  <video 
                    ref={videoPlayerRef}
                    src={selectedSponsor.videoUrl} 
                    controls 
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <span className="text-3xl font-display font-black italic text-white/80">{selectedSponsor.name}</span>
                </div>
              )}
            </div>

            {/* 미디어 탭 스위처 (로고 & 비디오 둘 다 있을 때) */}
            {selectedSponsor.imageUrl && selectedSponsor.videoUrl && (
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit self-center">
                <button
                  type="button"
                  onClick={() => setModalMediaType('IMAGE')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                    modalMediaType === 'IMAGE' ? 'bg-[#b4ff00] text-black shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  🖼️ 공식 로고 이미지
                </button>
                <button
                  type="button"
                  onClick={() => setModalMediaType('VIDEO')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold font-mono uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    modalMediaType === 'VIDEO' ? 'bg-amber-400 text-black shadow' : 'text-amber-300/80 hover:text-amber-300'
                  }`}
                >
                  <Play size={13} className="fill-current" /> 🎬 대형 전광판 영상 시청
                </button>
              </div>
            )}

            {/* ═══ 하단 상세 정보 2열 레이아웃 ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-white/10 pt-6">
              
              {/* 좌측: 스폰서 소개 및 전광판 송출 구역 */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-display font-black italic uppercase text-white leading-tight">
                    {selectedSponsor.name}
                  </h3>
                  {selectedSponsor.slogan && (
                    <p className="text-sm font-sans text-white/70 mt-1 leading-relaxed">
                      {selectedSponsor.slogan}
                    </p>
                  )}
                </div>

                {selectedSponsor.desc && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs md:text-sm text-white/80 font-sans leading-relaxed">
                    {selectedSponsor.desc}
                  </div>
                )}

                {/* 무대 전광판 노출 씬 & 송출 설정 안내 */}
                {(selectedSponsor.targetScenes && selectedSponsor.targetScenes.length > 0) && (
                  <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs font-sans text-amber-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Film size={14} />
                      <span>대회장 전광판 송출 구역</span>
                      {selectedSponsor.durationSeconds && (
                        <span className="ml-auto text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                          ⏱️ 회당 {selectedSponsor.durationSeconds}초 송출
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {selectedSponsor.targetScenes.map(scene => {
                        const sceneName = scene === 'POSEDOWN' ? '🏆 포즈다운 씬' : scene === 'COMMERCIAL' ? '📺 메인 광고 씬' : scene === 'STANDBY' ? '⏳ 대기 화면' : scene;
                        return (
                          <span key={scene} className="px-2.5 py-1 rounded-lg bg-black/40 text-[11px] font-medium text-white/90 border border-white/10">
                            {sceneName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 우측: 연락처, 주소, 다채널 SNS 링크 */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs font-sans">
                  {(selectedSponsor.contactPerson || selectedSponsor.phone) && (
                    <div className="flex items-center justify-between gap-2 text-white/80">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[#b4ff00] shrink-0" />
                        <span><strong>담당 / 문의:</strong> {selectedSponsor.contactPerson || '공식 담당자'}</span>
                      </div>
                      {selectedSponsor.phone && (
                        <a href={`tel:${selectedSponsor.phone}`} className="text-[#b4ff00] font-mono font-bold hover:underline">
                          📞 {selectedSponsor.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {selectedSponsor.email && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail size={14} className="text-[#b4ff00] shrink-0" />
                      <span><strong>이메일:</strong> {selectedSponsor.email}</span>
                    </div>
                  )}

                  {selectedSponsor.address && (
                    <div className="flex items-start gap-2 text-white/80">
                      <MapPin size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>주소:</strong> {selectedSponsor.address}</span>
                    </div>
                  )}
                </div>

                {/* 다채널 SNS & 공식 미디어 링크 풀 */}
                <div>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/50 mb-3">
                    OFFICIAL CHANNELS & SOCIAL MEDIA
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedSponsor.socials?.homepage && (
                      <a href={selectedSponsor.socials.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500 text-xs font-bold text-white transition-all">
                        <Globe size={14} className="text-blue-400" /> 공식 홈페이지
                      </a>
                    )}
                    {selectedSponsor.socials?.instagram && (
                      <a href={selectedSponsor.socials.instagram.startsWith('http') ? selectedSponsor.socials.instagram : `https://instagram.com/${selectedSponsor.socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-pink-600/20 border border-white/10 hover:border-pink-500 text-xs font-bold text-white transition-all">
                        <Camera size={14} className="text-pink-400" /> 인스타그램
                      </a>
                    )}
                    {selectedSponsor.socials?.youtube && (
                      <a href={selectedSponsor.socials.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500 text-xs font-bold text-white transition-all">
                        <Video size={14} className="text-red-400" /> 유튜브 채널
                      </a>
                    )}
                    {selectedSponsor.socials?.tiktok && (
                      <a href={selectedSponsor.socials.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all">
                        🎵 틱톡
                      </a>
                    )}
                    {selectedSponsor.socials?.x && (
                      <a href={selectedSponsor.socials.x} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all">
                        𝕏 X
                      </a>
                    )}
                    {selectedSponsor.socials?.facebook && (
                      <a href={selectedSponsor.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500 text-xs font-bold text-white transition-all">
                        📘 페이스북
                      </a>
                    )}
                    {selectedSponsor.socials?.blog && (
                      <a href={selectedSponsor.socials.blog} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500 text-xs font-bold text-white transition-all">
                        📝 블로그
                      </a>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
