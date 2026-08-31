import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Flame, 
  Trophy, 
  MessageCircle, 
  Send, 
  Award, 
  ThumbsUp, 
  Building,
  Clock,
  User
} from 'lucide-react';
import { 
  ShowcaseComment, 
  ShowcaseReactions, 
  ShowcaseReactionType, 
  getShowcaseReactions, 
  reactShowcase, 
  getShowcaseComments, 
  addShowcaseComment 
} from '../../services/registrationService';

interface ShowcaseCommentSectionProps {
  invoiceId: string;
  playerName: string;
}

const BADGE_OPTIONS = [
  { label: '🔥 불꽃응원', value: '🔥 불꽃응원' },
  { label: '🥇 1위가자!', value: '🥇 1위가자!' },
  { label: '💪 괴물컨디셔닝', value: '💪 괴물컨디셔닝' },
  { label: '👏 최고였어요', value: '👏 최고였어요' },
  { label: '❤️ 찐팬응원', value: '❤️ 찐팬응원' },
];

const QUICK_PHRASES = [
  '무대 위에서 가장 빛났습니다! 🥇',
  '다이어트와 컨디셔닝 완벽합니다! 🔥',
  '그동안의 노력이 무대에서 증명되었네요 👏',
  '항상 응원합니다 화이팅! 💪',
];

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  } catch {
    return '최근';
  }
}

export function ShowcaseCommentSection({ invoiceId, playerName }: ShowcaseCommentSectionProps) {
  const [reactions, setReactions] = useState<ShowcaseReactions>({ heart: 18, fire: 12, clap: 24, trophy: 7 });
  const [activeReactionAnim, setActiveReactionAnim] = useState<ShowcaseReactionType | null>(null);

  const [comments, setComments] = useState<ShowcaseComment[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(true);

  // Form State
  const [authorName, setAuthorName] = useState<string>('');
  const [authorGym, setAuthorGym] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>(BADGE_OPTIONS[0].value);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [commentSuccessAnim, setCommentSuccessAnim] = useState<boolean>(false);

  // Load Reactions and Comments on Mount
  useEffect(() => {
    if (!invoiceId) return;

    getShowcaseReactions(invoiceId).then(setReactions);

    setLoadingComments(true);
    getShowcaseComments(invoiceId)
      .then((data) => {
        if (data.length === 0) {
          // 초기 디폴트 응원글 샘플 제공
          const initialSamples: ShowcaseComment[] = [
            {
              id: 'init_1',
              invoiceId,
              authorName: '강철짐 관장님',
              authorGym: '강철 피트니스',
              content: `${playerName} 선수님! 무대 위에서 흘린 땀방울이 그대로 드러났습니다. 진심으로 고생 많으셨습니다! 🏆`,
              badge: '🥇 1위가자!',
              createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
              likeCount: 4,
            },
            {
              id: 'init_2',
              invoiceId,
              authorName: '박근육 코치',
              authorGym: '용인시체육관',
              content: '하체 세퍼레이션이랑 어깨 볼륨감 대박이네요! 다음 무대도 응원하겠습니다! 🔥🔥',
              badge: '🔥 불꽃응원',
              createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
              likeCount: 6,
            }
          ];
          setComments(initialSamples);
        } else {
          setComments(data);
        }
      })
      .finally(() => setLoadingComments(false));
  }, [invoiceId, playerName]);

  // Handle Reaction Click
  const handleReactionClick = async (type: ShowcaseReactionType) => {
    setActiveReactionAnim(type);
    setTimeout(() => setActiveReactionAnim(null), 600);

    const updated = await reactShowcase(invoiceId, type);
    setReactions(updated);
  };

  // Handle Comment Submit
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newCmt = await addShowcaseComment(invoiceId, {
        invoiceId,
        authorName: authorName.trim() || '익명 서포터',
        authorGym: authorGym.trim() || undefined,
        badge: selectedBadge,
        content: commentText.trim(),
      });

      setComments((prev) => [newCmt, ...prev]);
      setCommentText('');
      setCommentSuccessAnim(true);
      setTimeout(() => setCommentSuccessAnim(false), 2000);
    } catch (err) {
      console.error('댓글 작성 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. SNS 4대 이모지 실시간 리액션 퀵 바 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-[#121813] border border-[#d2ff00]/30 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              {playerName} 선수에게 실시간 리액션 보내기
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              원하는 응원 이모지를 눌러 실시간 반응 점수를 올려주세요!
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#d2ff00] bg-[#d2ff00]/10 border border-[#d2ff00]/25 px-2.5 py-1 rounded-full self-start sm:self-auto">
            LIVE REACTIONS
          </span>
        </div>

        {/* 4대 리액션 버튼 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          
          {/* ❤️ 하트 (좋아요) */}
          <button
            type="button"
            onClick={() => handleReactionClick('heart')}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#182019] border border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer shadow-lg group ${
              activeReactionAnim === 'heart' ? 'scale-110 border-rose-500 bg-rose-500/20' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl group-hover:scale-125 transition-transform">❤️</span>
              <div className="text-left">
                <span className="text-[11px] text-rose-300 font-bold block">좋아요</span>
                <span className="text-[9px] text-white/40">HEART</span>
              </div>
            </div>
            <span className="font-mono font-black text-base sm:text-lg text-white group-hover:text-rose-400 transition-colors">
              {reactions.heart}
            </span>
          </button>

          {/* 🔥 불꽃 (미쳤다) */}
          <button
            type="button"
            onClick={() => handleReactionClick('fire')}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#182019] border border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 transition-all cursor-pointer shadow-lg group ${
              activeReactionAnim === 'fire' ? 'scale-110 border-orange-500 bg-orange-500/20' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl group-hover:scale-125 transition-transform">🔥</span>
              <div className="text-left">
                <span className="text-[11px] text-orange-300 font-bold block">불꽃투혼</span>
                <span className="text-[9px] text-white/40">FIRE</span>
              </div>
            </div>
            <span className="font-mono font-black text-base sm:text-lg text-white group-hover:text-orange-400 transition-colors">
              {reactions.fire}
            </span>
          </button>

          {/* 👏 박수 (리스펙트) */}
          <button
            type="button"
            onClick={() => handleReactionClick('clap')}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#182019] border border-[#d2ff00]/30 hover:border-[#d2ff00] hover:bg-[#d2ff00]/10 transition-all cursor-pointer shadow-lg group ${
              activeReactionAnim === 'clap' ? 'scale-110 border-[#d2ff00] bg-[#d2ff00]/20' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl group-hover:scale-125 transition-transform">👏</span>
              <div className="text-left">
                <span className="text-[11px] text-[#d2ff00] font-bold block">박수갈채</span>
                <span className="text-[9px] text-white/40">RESPECT</span>
              </div>
            </div>
            <span className="font-mono font-black text-base sm:text-lg text-white group-hover:text-[#d2ff00] transition-colors">
              {reactions.clap}
            </span>
          </button>

          {/* 🏆 트로피 (챔피언) */}
          <button
            type="button"
            onClick={() => handleReactionClick('trophy')}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#182019] border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer shadow-lg group ${
              activeReactionAnim === 'trophy' ? 'scale-110 border-amber-500 bg-amber-500/20' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl group-hover:scale-125 transition-transform">🏆</span>
              <div className="text-left">
                <span className="text-[11px] text-amber-300 font-bold block">챔피언</span>
                <span className="text-[9px] text-white/40">CHAMPION</span>
              </div>
            </div>
            <span className="font-mono font-black text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors">
              {reactions.trophy}
            </span>
          </button>

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. 실시간 응원 댓글 작성 폼 (SNS Feed Input) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-[#0e130f] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#34d399]" />
              응원의 한마디 남기기
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              {playerName} 선수에게 힘이 되는 응원과 축하 메시지를 남겨주세요.
            </p>
          </div>
          <span className="text-xs text-white/60 font-mono">
            {comments.length}개의 응원글
          </span>
        </div>

        <form onSubmit={handleSubmitComment} className="space-y-4">
          {/* Author Name & Gym Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-white/60 font-bold block">작성자 닉네임</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="예: 헬스장 관장님 / 동료선수 / 찐팬"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-[#161d17] border border-white/15 focus:border-[#d2ff00] focus:ring-1 focus:ring-[#d2ff00] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder:text-white/30 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60 font-bold block">소속 / 헬스장 (선택)</label>
              <div className="relative">
                <Building className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="예: 용인 바디짐 / 개인 팬"
                  value={authorGym}
                  onChange={(e) => setAuthorGym(e.target.value)}
                  maxLength={30}
                  className="w-full bg-[#161d17] border border-white/15 focus:border-[#d2ff00] focus:ring-1 focus:ring-[#d2ff00] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder:text-white/30 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Badge Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-white/60 font-bold block">응원 뱃지 태그</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setSelectedBadge(b.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedBadge === b.value
                      ? 'bg-[#d2ff00] text-black shadow-md shadow-[#d2ff00]/20 font-black scale-105'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Phrases */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-white/40 font-mono">빠른 입력:</span>
            {QUICK_PHRASES.map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCommentText(phrase)}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-white/70 hover:text-[#d2ff00] transition-colors cursor-pointer"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Textarea & Submit */}
          <div className="relative">
            <textarea
              rows={3}
              placeholder={`${playerName} 선수에게 전할 응원 메시지를 작성해 주세요...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={300}
              className="w-full bg-[#161d17] border border-white/15 focus:border-[#d2ff00] focus:ring-1 focus:ring-[#d2ff00] rounded-2xl p-4 text-xs text-white placeholder:text-white/30 outline-none transition-colors resize-none"
            />
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-white/40 font-mono">
                {commentText.length}/300자
              </span>
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="px-5 py-2.5 bg-[#d2ff00] hover:bg-white text-black font-black rounded-xl text-xs transition-all shadow-md shadow-[#d2ff00]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '등록 중...' : '응원글 남기기'}</span>
              </button>
            </div>
          </div>

          {commentSuccessAnim && (
            <div className="p-3 bg-[#10b981]/20 border border-[#10b981] rounded-xl text-xs text-[#34d399] font-bold text-center animate-in fade-in duration-200">
              {playerName} 선수에게 응원글이 성공적으로 등록되었습니다!
            </div>
          )}
        </form>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. 실시간 응원 댓글 피드 목록 (Social Feed List) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-white flex items-center gap-2 px-1">
          <MessageCircle className="w-4 h-4 text-[#d2ff00]" />
          선수 응원 피드 ({comments.length})
        </h4>

        {loadingComments ? (
          <div className="p-8 text-center text-xs text-white/40 animate-pulse font-mono bg-[#0c100d] rounded-2xl border border-white/5">
            응원 피드를 불러오는 중...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-10 text-center space-y-2 bg-[#0c100d] rounded-2xl border border-white/5">
            <span className="text-3xl block">💌</span>
            <p className="text-xs font-bold text-white/80">아직 등록된 응원글이 없습니다.</p>
            <p className="text-[11px] text-white/40">선수에게 첫 번째 축하와 격려의 메시지를 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((cmt) => (
              <div 
                key={cmt.id}
                className="bg-[#0e130f] border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 transition-all shadow-lg space-y-2.5"
              >
                {/* Comment Author Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#d2ff00]/15 border border-[#d2ff00]/30 flex items-center justify-center text-[#d2ff00] font-black text-xs">
                      {cmt.authorName.slice(0, 1) || '팬'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">{cmt.authorName}</span>
                        {cmt.badge && (
                          <span className="text-[10px] font-bold text-[#d2ff00] bg-[#d2ff00]/10 border border-[#d2ff00]/25 px-2 py-0.5 rounded-full">
                            {cmt.badge}
                          </span>
                        )}
                      </div>
                      {cmt.authorGym && (
                        <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                          <Building className="w-2.5 h-2.5 text-[#34d399]" />
                          {cmt.authorGym}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time Ago */}
                  <span className="text-[10px] font-mono text-white/40 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(cmt.createdAt)}
                  </span>
                </div>

                {/* Comment Content */}
                <p className="text-xs sm:text-sm text-white/85 leading-relaxed pl-10 pr-2 whitespace-pre-wrap">
                  {cmt.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
