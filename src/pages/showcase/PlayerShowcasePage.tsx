import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Trophy, 
  Share2, 
  Heart, 
  ExternalLink, 
  ChevronRight, 
  Building, 
  Calendar, 
  MapPin, 
  Award,
  Video,
  Camera,
  MessageCircle,
  Bookmark,
  Send,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { getInvoiceByIdOrPlayerUid, cheerShowcase } from '../../services/registrationService';
import { RegistrationPayload, JoinItem } from '../../types/registration';
import Loader from '../../components/shared/Loader';
import { LightboxModal } from '../../components/mypage/LightboxModal';
import { AthleteIntroModal } from '../../components/broadcast/AthleteIntroModal';
import { ShowcaseCommentSection } from '../../components/showcase/ShowcaseCommentSection';
import { useScrollToTop } from '../../hooks/useScrollToTop';

// 순위 및 입상 뱃지 헬퍼
function getRankBadgeInfo(rank?: number | string, award?: string) {
  const r = String(rank || '').trim();
  const a = String(award || '').trim();

  // 1. 오버롤 그랑프리
  if (a.includes('그랑프리') || a.includes('OVERALL') || a.includes('대상') || a.includes('Grand Prix')) {
    return {
      title: 'OVERALL GRAND PRIX',
      subtitle: '그랑프리 우승 (오버롤)',
      badgeClass: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black border-yellow-200 shadow-lg shadow-yellow-400/30 font-black',
      icon: '👑',
      isChampion: true,
      cardBorder: 'border-yellow-400/60 bg-gradient-to-br from-yellow-950/40 via-[#141209] to-[#0c0d0a]',
    };
  }

  // 2. 1위 우승
  if (r === '1' || a === '1위' || a.startsWith('1위') || a === '우승') {
    return {
      title: '1ST PLACE',
      subtitle: '1위 우승 (CHAMPION)',
      badgeClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-md shadow-amber-500/30 font-black',
      icon: '🥇',
      isChampion: true,
      cardBorder: 'border-amber-500/50 bg-gradient-to-br from-amber-950/30 via-[#13120b] to-[#0b0d0b]',
    };
  }

  // 3. 2위 준우승
  if (r === '2' || a === '2위' || a.startsWith('2위') || a.includes('준우승')) {
    return {
      title: '2ND PLACE',
      subtitle: '2위 준우승',
      badgeClass: 'bg-gradient-to-r from-slate-200 to-gray-300 text-black border-slate-200 shadow-md shadow-slate-300/20 font-black',
      icon: '🥈',
      isChampion: false,
      cardBorder: 'border-slate-400/40 bg-gradient-to-br from-slate-900/30 via-[#101412] to-[#0a0d0b]',
    };
  }

  // 4. 3위 입상
  if (r === '3' || a === '3위' || a.startsWith('3위')) {
    return {
      title: '3RD PLACE',
      subtitle: '3위 입상',
      badgeClass: 'bg-gradient-to-r from-amber-700 to-yellow-700 text-white border-amber-600 shadow-md font-black',
      icon: '🥉',
      isChampion: false,
      cardBorder: 'border-amber-700/40 bg-gradient-to-br from-amber-950/20 via-[#12100d] to-[#0a0d0b]',
    };
  }

  // 5. 4~6위
  if (r === '4' || r === '5' || r === '6' || a.includes('TOP') || a.includes('입상') || a.includes('장려상')) {
    return {
      title: `TOP ${r || '5'} FINALIST`,
      subtitle: `${r || '5'}위 공식 입상`,
      badgeClass: 'bg-emerald-500/20 text-[#34d399] border border-emerald-500/40 font-bold',
      icon: '🎖️',
      isChampion: false,
      cardBorder: 'border-emerald-500/30 bg-[#0e1511]',
    };
  }

  return {
    title: 'OFFICIAL ATHLETE',
    subtitle: '본선 무대 출전 완료',
    badgeClass: 'bg-white/10 text-white/80 border border-white/15 font-bold',
    icon: '⚡',
    isChampion: false,
    cardBorder: 'border-white/10 bg-[#0d120e]',
  };
}

export default function PlayerShowcasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<RegistrationPayload | null>(null);

  useScrollToTop([loading]);
  const [error, setError] = useState<string | null>(null);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState<boolean>(false);

  // 응원 카운터 상태
  const [cheerCount, setCheerCount] = useState<number>(0);
  const [hasCheered, setHasCheered] = useState<boolean>(false);
  const [cheerAnimation, setCheerAnimation] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError('선수 식별 정보가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    const loadPlayer = async () => {
      setLoading(true);
      try {
        const data = await getInvoiceByIdOrPlayerUid(id);
        if (data) {
          setPlayer(data);
          setCheerCount((data as any).cheerCount || (data as any).reactions?.heart || 0);
        } else {
          setError('선수의 공식 출전 쇼케이스 정보를 찾을 수 없습니다.');
        }
      } catch (err: any) {
        console.error('쇼케이스 로드 오류:', err);
        setError('선수 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [id]);

  // 선수 정보 로드 시 브라우저 타이틀 및 SNS OpenGraph 메타 태그 맞춤형 동적 업데이트
  useEffect(() => {
    if (player) {
      const playerName = (player.playerName || '선수').trim();
      const gym = player.playerGym ? `${player.playerGym} 소속 · ` : '';
      const title = `[YBBF] ${playerName} 선수 공식 무대 쇼케이스 | 용인시보디빌딩협회`;
      const desc = `${playerName} 선수(${gym}2026 제9회 용인특례시 협회장배)의 공식 무대 화보 및 출전 기록을 확인하고 응원해 보세요! 🏆✨`;
      const photo = player.publicStagePhoto1 || player.stagePhoto1 || (player.playerPhotoUrls && player.playerPhotoUrls[0]) || player.playerPhotoUrl || 'https://ybbf.org/hero_section.png';

      document.title = title;

      const setMeta = (nameOrProp: string, content: string, isProp = false) => {
        let el = document.querySelector(isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`);
        if (!el) {
          el = document.createElement('meta');
          if (isProp) el.setAttribute('property', nameOrProp);
          else el.setAttribute('name', nameOrProp);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      setMeta('description', desc);
      setMeta('og:title', `[YBBF] ${playerName} 선수 공식 무대 쇼케이스`, true);
      setMeta('og:description', desc, true);
      setMeta('og:image', photo, true);
      setMeta('og:url', window.location.href, true);
      setMeta('twitter:title', `[YBBF] ${playerName} 선수 공식 무대 쇼케이스`);
      setMeta('twitter:description', desc);
      setMeta('twitter:image', photo);
    }
  }, [player]);

  // 응원하기 버튼 핸들러
  const handleCheer = async () => {
    if (!player?.id) return;
    setCheerAnimation(true);
    setTimeout(() => setCheerAnimation(false), 800);

    const next = await cheerShowcase(player.id);
    setCheerCount(next);
    setHasCheered(true);
  };

  // URL 링크 복사 핸들러
  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // 모바일 공유 시트 (Web Share API)
  const handleNativeShare = async () => {
    if (navigator.share && player) {
      try {
        await navigator.share({
          title: `[YBBF] ${player.playerName} 선수 공식 무대 쇼케이스`,
          text: `2026 제9회 용인특례시 협회장배 보디빌딩대회 ${player.playerName} 선수의 공식 무대 사진과 성적을 확인해 보세요!`,
          url: window.location.href,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070907] pt-32 pb-20 flex flex-col items-center justify-center text-white font-sans">
        <Loader />
        <p className="text-xs text-[#d2ff00] font-mono mt-4 animate-pulse">
          공식 선수 무대 쇼케이스를 불러오는 중...
        </p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#070907] pt-32 pb-20 px-4 flex items-center justify-center text-white font-sans">
        <div className="max-w-md w-full bg-[#111612] border border-white/10 p-8 rounded-2xl text-center shadow-2xl">
          <Award className="w-12 h-12 text-yellow-500/60 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 break-keep">쇼케이스를 찾을 수 없습니다</h2>
          <p className="text-xs text-white/60 mb-6 leading-relaxed break-keep">
            {error || '해당 선수의 출전 쇼케이스 페이지가 존재하지 않거나 비공개 상태입니다.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#d2ff00] hover:bg-white text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            YBBF 메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 1번 메인 포즈 및 2번 액션 포즈 사진 해석 (브랜딩된 공식 공개용 사진 최우선)
  const slot1 = player.publicStagePhoto1 || player.stagePhoto1 || player.playerPhotoUrl || '';
  const slot2 = player.publicStagePhoto2 || player.stagePhoto2 || '';
  const avatarUrl = slot1 || player.publicStagePhoto1 || player.stagePhoto1 || player.playerPhotoUrl || '';

  // 출전 종목 목록
  const joins: JoinItem[] = player.joins && Array.isArray(player.joins) ? player.joins : [];

  // 배부번호 계산
  let rawNum = player.playerNumber || (player as any).playerNo || (player as any).entryNo;
  if (!rawNum && joins.length > 0) {
    rawNum = (joins[0] as any).playerNumber || (joins[0] as any).entryNo || (joins[0] as any).playerNo;
  }
  if (!rawNum) {
    const digitsOnly = (player.id || player.playerUid || '').replace(/[^0-9]/g, '');
    rawNum = digitsOnly.length >= 2 ? digitsOnly.slice(-2) : '100';
  }
  const displayNo = String(rawNum).toUpperCase().startsWith('NO.') ? String(rawNum) : `NO.${rawNum}`;

  return (
    <div className="min-h-screen bg-[#070907] text-white font-sans pt-20 sm:pt-24 pb-28 px-3 sm:px-6 relative overflow-hidden selection:bg-[#d2ff00] selection:text-black">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#d2ff00]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] bg-[#10b981]/5 blur-[130px] rounded-full pointer-events-none" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* SHOWCASE CONTAINER (Max 680px Width for Mobile / Desktop) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-[680px] mx-auto relative space-y-4 sm:space-y-5">

        {/* 1. 🏆 인스타그램 감성 프로필 헤더 카드 (모바일 최적화) */}
        <div className="bg-[#101411] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          
          {/* Top Row: Avatar + Name + Share */}
          <div className="flex items-start justify-between gap-3">
            {/* Left: Avatar with Story Gradient Ring */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative shrink-0 p-0.5 rounded-full bg-gradient-to-tr from-[#d2ff00] via-[#10b981] to-emerald-400 shadow-md">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-black p-0.5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={player.playerName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-[#182019] flex items-center justify-center text-lg font-black text-[#d2ff00]">
                      {player.playerName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 bg-[#d2ff00] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                  {displayNo}
                </span>
              </div>

              {/* Player Name & Verified Badge */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight break-keep">
                    {player.playerName}
                  </h1>
                  <CheckCircle2 className="w-4 h-4 text-[#34d399] fill-[#34d399]/20 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-black bg-[#d2ff00] px-2 py-0.5 rounded-md whitespace-nowrap">
                    ATHLETE
                  </span>
                </div>

                <div className="text-xs text-[#34d399] font-bold flex items-center gap-1.5 break-keep">
                  <Building className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
                  <span className="truncate">{player.playerGym || '용인시보디빌딩협회'}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action (Share) */}
            <div className="shrink-0 pt-0.5">
              <button
                type="button"
                onClick={handleNativeShare}
                className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded-2xl border border-white/10 transition-colors cursor-pointer flex items-center justify-center"
                title="쇼케이스 공유하기"
              >
                <Send className="w-4 h-4 text-[#d2ff00]" />
              </button>
            </div>
          </div>

          {/* Info Badges (Date & Venue) */}
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
            <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
              <Calendar className="w-3 h-3 text-white/40" />
              <span>{player.contestDate || '2026-08-29'}</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full break-keep">
              <MapPin className="w-3 h-3 text-[#34d399]" />
              <span>{player.contestLocation || '용인시청 에이스홀'}</span>
            </span>
          </div>

          {/* 🎬 무대 LED 송출 인트로 영상 보기 버튼 (인스타 릴스 감성) */}
          <div className="mt-3 pt-2">
            <button
              type="button"
              onClick={() => setIsIntroModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#d2ff00] via-[#a3e635] to-[#10b981] text-black shadow-lg shadow-[#d2ff00]/20 hover:brightness-110 transition-all cursor-pointer break-keep"
            >
              <Video className="w-4 h-4 text-black shrink-0" />
              <span>실제 무대 LED 송출 영상 보기 (풀스크린)</span>
            </button>
          </div>

        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 2. 🏆 공식 대회 성적 및 순위 (모바일 줄바꿈 완벽 최적화) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-mono font-bold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#d2ff00]" />
              OFFICIAL RESULTS • 대회 성적
            </h3>
            <span className="text-[10px] font-mono text-[#d2ff00]">
              YBBF VERIFIED
            </span>
          </div>

          {/* Joins Categories Results Cards */}
          <div className="grid grid-cols-1 gap-2.5">
            {joins.length > 0 ? (
              joins.map((join, idx) => {
                const badge = getRankBadgeInfo(
                  (join as any).rank, 
                  (join as any).award
                );

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3.5 sm:p-4 border transition-all shadow-lg space-y-2.5 ${badge.cardBorder}`}
                  >
                    {/* Category Title & Grade */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-black text-white break-keep">
                            {join.contestCategoryTitle}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#d2ff00] bg-[#d2ff00]/10 border border-[#d2ff00]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {join.contestGradeTitle}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-white/50 font-mono break-keep">
                          {player.contestTitle || '제9회 용인특례시 협회장배 보디빌딩대회'}
                        </p>
                      </div>
                    </div>

                    {/* Prominent Full-Width Award Badge (모바일에서도 줄바꿈 왜곡 없음) */}
                    <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-black shadow-sm ${badge.badgeClass}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{badge.icon}</span>
                        <span className="tracking-wide break-keep">{badge.title}</span>
                      </div>
                      <span className="text-[11px] opacity-90 whitespace-nowrap font-bold">
                        {badge.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl p-4 border border-white/10 bg-[#0e130f] flex items-center justify-between">
                <span className="text-xs font-bold text-white">보디빌딩 공식 출전</span>
                <span className="text-xs font-bold text-[#d2ff00] bg-[#d2ff00]/10 px-3 py-1 rounded-xl">
                  ⚡ 본선 무대 출전 완료
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 3. 인스타그램 피드 뷰어 (포즈 비율 자동 맞춤 & 전신 완벽 노출) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="space-y-4 sm:space-y-5">

          {/* 📷 [FEED 1] 1번 메인 포즈 컷 */}
          {slot1 && (
            <div className="bg-[#101411] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl space-y-3">
              {/* Feed Header */}
              <div className="p-3 sm:p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black p-0.5 border border-[#d2ff00]/40 shrink-0">
                    <img src={avatarUrl} alt={player.playerName} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">{player.playerName}</span>
                    <span className="text-[10px] text-white/40 font-mono">🏆 1번 메인 포즈 컷</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#d2ff00] bg-[#d2ff00]/10 border border-[#d2ff00]/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  MAIN CUT
                </span>
              </div>

              {/* Adaptive Image Container (전신 사진 잘림 없는 반응형 뷰어) */}
              <div 
                onClick={() => setActiveLightboxMedia({ type: 'image', url: slot1 })}
                className="relative w-full bg-[#030503] cursor-pointer group overflow-hidden flex items-center justify-center min-h-[340px] sm:min-h-[420px] max-h-[580px]"
              >
                {/* Background Ambient Blur */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${slot1})` }}
                />
                
                <img
                  src={slot1}
                  alt={`${player.playerName} 메인 포즈`}
                  className="relative z-10 max-w-full max-h-[580px] w-auto h-auto object-contain group-hover:scale-102 transition-transform duration-300"
                  loading="eager"
                />
                
                <div className="absolute inset-0 z-20 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-xl">
                    <Maximize2 size={13} />
                    <span>탭하여 원본 고화질 확대</span>
                  </span>
                </div>
              </div>

              {/* Instagram Interaction Action Bar */}
              <div className="px-3.5 sm:px-4 pb-4 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleCheer}
                      className={`p-1.5 -m-1.5 transition-transform cursor-pointer flex items-center justify-center ${cheerAnimation ? 'scale-125' : 'hover:scale-110 active:scale-95'}`}
                      title="좋아요 / 응원하기"
                    >
                      <Heart className={`w-6 h-6 ${hasCheered ? 'text-rose-500 fill-rose-500' : 'text-white/80 hover:text-rose-400'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('comment-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-1.5 -m-1.5 text-white/80 hover:text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                      title="응원 댓글 남기기"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="p-1.5 -m-1.5 text-white/80 hover:text-[#d2ff00] transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                      title="공유하기"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="p-1.5 -m-1.5 text-white/80 hover:text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                    title="저장하기"
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'text-[#d2ff00] fill-[#d2ff00]' : ''}`} />
                  </button>
                </div>

                <div className="text-xs text-white/80 font-bold">
                  좋아요 <span className="text-[#d2ff00] font-mono font-black">{cheerCount}개</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed break-keep">
                  <span className="font-black text-white mr-1.5">{player.playerName}</span>
                  {player.contestTitle || '제9회 용인특례시 협회장배 보디빌딩대회'} 공식 무대 메인 포즈 인증 컷 🏆
                </p>
              </div>
            </div>
          )}

          {/* 📷 [FEED 2] 2번 액션 포즈 컷 (있는 경우) */}
          {slot2 && (
            <div className="bg-[#101411] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl space-y-3">
              {/* Feed Header */}
              <div className="p-3 sm:p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black p-0.5 border border-emerald-500/40 shrink-0">
                    <img src={avatarUrl} alt={player.playerName} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">{player.playerName}</span>
                    <span className="text-[10px] text-white/40 font-mono">🥈 2번 액션 포즈 컷</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  ACTION CUT
                </span>
              </div>

              {/* Adaptive Image Container */}
              <div 
                onClick={() => setActiveLightboxMedia({ type: 'image', url: slot2 })}
                className="relative w-full bg-[#030503] cursor-pointer group overflow-hidden flex items-center justify-center min-h-[340px] sm:min-h-[420px] max-h-[580px]"
              >
                {/* Background Ambient Blur */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${slot2})` }}
                />
                
                <img
                  src={slot2}
                  alt={`${player.playerName} 액션 포즈`}
                  className="relative z-10 max-w-full max-h-[580px] w-auto h-auto object-contain group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 z-20 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-xl">
                    <Maximize2 size={13} />
                    <span>탭하여 원본 고화질 확대</span>
                  </span>
                </div>
              </div>

              {/* Instagram Interaction Action Bar */}
              <div className="px-3.5 sm:px-4 pb-4 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleCheer}
                      className={`p-1.5 -m-1.5 transition-transform cursor-pointer flex items-center justify-center ${cheerAnimation ? 'scale-125' : 'hover:scale-110 active:scale-95'}`}
                      title="좋아요 / 응원하기"
                    >
                      <Heart className={`w-6 h-6 ${hasCheered ? 'text-rose-500 fill-rose-500' : 'text-white/80 hover:text-rose-400'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('comment-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-1.5 -m-1.5 text-white/80 hover:text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                      title="응원 댓글 남기기"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="p-1.5 -m-1.5 text-white/80 hover:text-[#d2ff00] transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                      title="공유하기"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="p-1.5 -m-1.5 text-white/80 hover:text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                    title="저장하기"
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'text-[#d2ff00] fill-[#d2ff00]' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-white/70 leading-relaxed break-keep">
                  <span className="font-black text-white mr-1.5">{player.playerName}</span>
                  무대 위 역동적인 액션 포징과 컨디셔닝 디테일 컷 💪🔥
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 4. SNS 실시간 리액션 및 소셜 응원 피드 댓글 섹션 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div id="comment-section">
          <ShowcaseCommentSection 
            invoiceId={player.id || player.playerUid || id || ''} 
            playerName={player.playerName} 
          />
        </div>

      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        activeLightboxMedia={activeLightboxMedia}
        onClose={() => setActiveLightboxMedia(null)}
      />

      {/* Live Stage Intro Fullscreen Modal */}
      <AthleteIntroModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        player={player}
      />

    </div>
  );
}
