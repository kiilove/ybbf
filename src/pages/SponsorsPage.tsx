import { useEffect, useState, useRef } from 'react';
import { sponsorService, type SponsorItem } from '../services/sponsorService';
import { 
  Building2, Globe, Camera, Video, Phone, Mail, 
  MapPin, ExternalLink, X, Shield, Search, Filter,
  Sparkles, Award, User, ChevronRight, HelpCircle, Play, Film, Volume2, Maximize2, Monitor
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TIER_ORDER = ['ALL', 'VIDEO', 'DIAMOND', 'PLATINUM', 'GOLD', 'OFFICIAL', 'PARTNER'];

const TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  DIAMOND: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/40' },
  PLATINUM: { bg: 'bg-slate-200/10', text: 'text-slate-200', border: 'border-slate-400/40' },
  GOLD: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/40' },
  OFFICIAL: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  PARTNER: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/40' },
};

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 모달 상태
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);
  const [modalMediaType, setModalMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.title = "공식 협찬사 & 파트너 | YBBF 용인특례시보디빌딩협회";
    async function loadData() {
      try {
        const list = await sponsorService.getActiveSponsors();
        setSponsors(list);
      } catch (err) {
        console.warn('스폰서 데이터 로드 에러:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openSponsorModal = (sponsor: SponsorItem, defaultMedia: 'IMAGE' | 'VIDEO' = 'IMAGE') => {
    setSelectedSponsor(sponsor);
    if (defaultMedia === 'VIDEO' || (!sponsor.imageUrl && sponsor.videoUrl)) {
      setModalMediaType('VIDEO');
    } else {
      setModalMediaType('IMAGE');
    }
  };

  const handleRequestNativeFullscreen = () => {
    if (videoPlayerRef.current) {
      if (videoPlayerRef.current.requestFullscreen) {
        videoPlayerRef.current.requestFullscreen();
      }
    }
  };

  const videoSponsorsCount = sponsors.filter(s => !!s.videoUrl).length;

  const filteredSponsors = sponsors.filter(s => {
    let matchTag = true;
    if (selectedTag === 'VIDEO') {
      matchTag = !!s.videoUrl;
    } else if (selectedTag !== 'ALL') {
      matchTag = (s.tag || 'PARTNER').toUpperCase() === selectedTag;
    }

    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.slogan && s.slogan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.desc && s.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTag && matchQuery;
  });

  return (
    <div className="min-h-screen bg-[#050507] text-white pt-28 pb-32">
      
      {/* ═══ 1. 헤더 히어로 섹션 ═══ */}
      <section className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-16 relative">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-[#b4ff00]" />
          <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#b4ff00]">
            OFFICIAL PARTNERS & SPONSORS
          </span>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/10 pb-12">
          <div>
            <h1 className="text-display text-[clamp(42px,6vw,84px)] leading-[0.88] font-black italic uppercase tracking-tighter text-white">
              공식 협찬사 & <br />
              <span className="text-[#b4ff00]">파트너십</span>
            </h1>
            <p className="text-white/60 font-sans text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
              용인특례시 보디빌딩협회와 함께 대한민국 피트니스 문화와 선수 육성을 선도하는 공식 파트너사입니다. 
              동영상 광고는 <strong>무음으로 자동 미리보기 재생</strong>되며, 클릭 시 <strong>초대형 전광판 극장 화면</strong>으로 감상하실 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/[0.03] border border-white/10 px-6 py-4 rounded-2xl">
            <div>
              <span className="text-xs font-mono text-white/50 block">공식 등록 협찬사</span>
              <span className="text-3xl font-display font-black italic text-[#b4ff00]">
                {sponsors.length}
                <span className="text-sm font-sans font-normal text-white/60 ml-1">개사</span>
              </span>
            </div>
            <div className="w-[1px] h-10 bg-white/10 mx-2" />
            <div>
              <span className="text-xs font-mono text-white/50 block">동영상 광고주</span>
              <span className="text-3xl font-display font-black italic text-amber-400">
                {videoSponsorsCount}
                <span className="text-sm font-sans font-normal text-white/60 ml-1">개사</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. 필터 & 검색 툴바 ═══ */}
      <section className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-12">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
          
          {/* 등급 필터 탭 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {TIER_ORDER.map(tag => {
              const count = tag === 'ALL' 
                ? sponsors.length 
                : tag === 'VIDEO'
                ? videoSponsorsCount
                : sponsors.filter(s => (s.tag || 'PARTNER').toUpperCase() === tag).length;
              const isSelected = selectedTag === tag;

              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all duration-200 shrink-0 flex items-center gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#b4ff00] text-black shadow-[0_0_15px_rgba(180,255,0,0.3)]' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{tag === 'ALL' ? '전체' : tag === 'VIDEO' ? '🎬 동영상 광고' : tag}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-white/50'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 검색창 */}
          <div className="relative min-w-[260px] md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="스폰서명, 혜택, 위치 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#b4ff00]/60 transition-colors"
            />
          </div>

        </div>
      </section>

      {/* ═══ 3. 스폰서 그리드 목록 ═══ */}
      <section className="px-6 md:px-16 max-w-[1440px] mx-auto w-full">
        {loading ? (
          <div className="py-32 text-center text-white/50">
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#b4ff00] rounded-full animate-spin mx-auto mb-4" />
            스폰서 명단을 불러오는 중입니다...
          </div>
        ) : filteredSponsors.length === 0 ? (
          <div className="py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
            <HelpCircle size={40} className="mx-auto text-white/30 mb-3" />
            <p className="text-white/70 text-base font-bold">검색 조건에 맞는 스폰서가 없습니다.</p>
            <button 
              onClick={() => { setSelectedTag('ALL'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors cursor-pointer"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSponsors.map(sponsor => {
              const tag = (sponsor.tag || 'PARTNER').toUpperCase();
              const tagStyle = TAG_STYLES[tag] || TAG_STYLES.PARTNER;
              const socials = sponsor.socials || {};
              const hasVideo = !!sponsor.videoUrl;

              return (
                <div
                  key={sponsor.id}
                  className="bg-[#0b0b10] border border-white/10 hover:border-[#b4ff00]/50 rounded-3xl p-6 md:p-7 flex flex-col justify-between transition-all duration-300 group hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <div>
                    {/* 상단 뱃지 & 동영상 상태 표시 */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border uppercase ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}>
                        {sponsor.tag || 'OFFICIAL'}
                      </span>

                      {hasVideo && (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>전광판 동영상 광고</span>
                        </span>
                      )}
                    </div>

                    {/* ═══ 미디어 영역: 동영상은 무음 자동재생, 로고는 고화질 표출 ═══ */}
                    {hasVideo ? (
                      <div 
                        onClick={() => openSponsorModal(sponsor, 'VIDEO')}
                        className="h-48 rounded-2xl bg-black border border-white/10 group-hover:border-amber-400/60 flex items-center justify-center mb-5 cursor-pointer transition-all relative overflow-hidden group/media shadow-inner"
                      >
                        <video 
                          src={sponsor.videoUrl} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />

                        {/* MUTE & LIVE INDICATOR BADGE */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-amber-300 pointer-events-none">
                          <Volume2 size={11} className="text-amber-400" />
                          <span>무음 자동 재생 중</span>
                        </div>

                        {/* HOVER OVERLAY: CLICK FOR FULLSCREEN SOUND */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <span className="p-3.5 rounded-full bg-amber-400 text-black shadow-xl transform scale-90 group-hover/media:scale-100 transition-transform">
                            <Maximize2 size={20} className="ml-0.5" />
                          </span>
                          <span className="text-xs font-bold text-white bg-black/80 px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg">
                            클릭하여 초대형 극장 화면 시청 🔊
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => openSponsorModal(sponsor, 'IMAGE')}
                        className="h-48 rounded-2xl bg-black/60 border border-white/5 group-hover:border-white/20 flex items-center justify-center p-5 mb-5 cursor-pointer transition-all relative overflow-hidden group/media"
                      >
                        {sponsor.imageUrl ? (
                          <img 
                            src={sponsor.imageUrl} 
                            alt={sponsor.name} 
                            className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                          />
                        ) : (
                          <span className="text-xl font-display font-black italic uppercase text-white/80 group-hover:text-white">
                            {sponsor.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 스폰서명 & 슬로건 */}
                    <h3 className="text-xl font-display font-black italic uppercase text-white mb-2 leading-snug">
                      {sponsor.name}
                    </h3>
                    <p className="text-xs text-white/60 font-sans leading-relaxed line-clamp-2 min-h-[36px] mb-4">
                      {sponsor.slogan || sponsor.desc || '용인특례시 보디빌딩협회 공식 파트너사'}
                    </p>

                    {/* 주소 및 연락처 */}
                    <div className="space-y-1.5 text-xs text-white/70 font-sans bg-white/[0.02] p-3 rounded-xl border border-white/5 mb-5">
                      {sponsor.address && (
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={12} className="text-rose-400 shrink-0" />
                          <span className="truncate">{sponsor.address}</span>
                        </div>
                      )}
                      {(sponsor.phone || sponsor.contactPerson) && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-white/60 truncate">
                            <User size={12} className="text-[#b4ff00] shrink-0" />
                            <span>{sponsor.contactPerson || '담당자'}</span>
                          </div>
                          {sponsor.phone && (
                            <a href={`tel:${sponsor.phone}`} className="text-[#b4ff00] font-mono font-bold hover:underline shrink-0">
                              📞 {sponsor.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 하단 SNS 버튼 바 & 액션 */}
                  <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {socials.homepage && (
                        <a href={socials.homepage} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-blue-600/30 text-blue-400 hover:text-white border border-white/10 transition-colors" title="공식 홈페이지">
                          <Globe size={14} />
                        </a>
                      )}
                      {socials.instagram && (
                        <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-pink-600/30 text-pink-400 hover:text-white border border-white/10 transition-colors" title="인스타그램">
                          <Camera size={14} />
                        </a>
                      )}
                      {socials.youtube && (
                        <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-red-600/30 text-red-400 hover:text-white border border-white/10 transition-colors" title="유튜브">
                          <Video size={14} />
                        </a>
                      )}
                      {socials.blog && (
                        <a href={socials.blog} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-white/5 hover:bg-emerald-600/30 text-emerald-400 hover:text-white border border-white/10 text-[10px] font-bold transition-colors">
                          블로그
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openSponsorModal(sponsor, hasVideo ? 'VIDEO' : 'IMAGE')}
                      className="text-xs font-mono font-bold text-white/70 hover:text-[#b4ff00] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {hasVideo ? '🎬 극장 모드 시청' : '상세보기'} <ChevronRight size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ 4. 스폰서십 제휴 문의 CTA ═══ */}
      <section className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mt-24">
        <div className="bg-gradient-to-r from-[#0d140e] via-[#090b09] to-[#0a0a0a] border border-[#b4ff00]/30 rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#b4ff00] uppercase block mb-2">
              BECOME OUR OFFICIAL PARTNER
            </span>
            <h2 className="text-2xl md:text-4xl font-display font-black italic uppercase text-white">
              2027 YBBF 공식 스폰서십 & 파트너 제휴
            </h2>
            <p className="text-sm text-white/60 font-sans mt-3 max-w-xl leading-relaxed">
              대한민국 최고의 보디빌딩 무대와 수만 명의 피트니스 동호인에게 기업의 브랜드를 각인시키세요. 
              전광판 광고, 무대 타이틀 스폰서, 온·오프라인 통합 마케팅을 지원합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              to="/about"
              className="px-8 py-4 rounded-xl bg-[#b4ff00] text-black font-display font-black italic uppercase tracking-wider text-sm hover:bg-white transition-all text-center"
            >
              협회 소개 및 문의
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 🎬 초대형 시네마 극장 모달 (True Ultra-Wide Cinema Mode) ═══ */}
      {selectedSponsor && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-2 md:p-6 animate-in fade-in duration-200 overflow-y-auto"
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

            {/* ═══ 🎬 초대형 16:9 시네마 스크린 영역 ═══ */}
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
                <div className="h-64 md:h-96 w-full flex items-center justify-center p-10 bg-black/80">
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

    </div>
  );
}
