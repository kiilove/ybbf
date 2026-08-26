import React, { useState, useEffect } from 'react';
import { initialCompetitionState } from '../../data/competition';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, CheckCircle, ArrowRight, X } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export default function UpcomingPhase() {
  const { isAuthenticated, user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 상태 체크 및 이메일 바인딩
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    } else {
      setEmail('');
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('이메일 주소를 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);
    try {
      await notificationService.subscribe(email.trim(), 'ybbf_championship_2026');
      setIsSubscribed(true);
    } catch (err: any) {
      setErrorMsg(err.message || '알림 신청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setIsSubscribed(false);
    setErrorMsg('');
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    } else {
      setEmail('');
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 md:px-12 max-w-[1200px] mx-auto min-h-[80vh] flex flex-col justify-center items-center text-center">
      
      {/* COMING SOON BADGE */}
      <div className="mb-6 inline-block bg-accent text-black font-black italic px-4 py-1.5 text-xs sm:text-sm tracking-widest uppercase rounded shadow-[0_0_15px_rgba(210,255,0,0.15)] animate-pulse">
        COMING SOON
      </div>
      
      {/* HERO TITLE (Responsive font sizes preventing viewport overflow/cut-off) */}
      <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-tight md:leading-none font-display font-black italic uppercase drop-shadow-2xl mb-8 tracking-tight text-white max-w-[95vw] md:max-w-none break-keep">
        {initialCompetitionState.title}
      </h1>
      
      {/* EVENT METRICS BOARD (High contrast, readable info architecture) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-white/80 font-sans tracking-wide text-sm sm:text-base md:text-lg border-y border-white/10 py-5 w-full max-w-xl mx-auto mb-12">
        <div className="flex items-center gap-2.5">
          <span className="text-white/40 text-[10px] sm:text-xs uppercase font-mono tracking-wider font-semibold">Date</span>
          <span className="text-white font-extrabold">{initialCompetitionState.date}</span>
        </div>
        <div className="hidden sm:block w-1.5 h-1.5 bg-accent rounded-full animate-ping"></div>
        <div className="flex items-center gap-2.5">
          <span className="text-white/40 text-[10px] sm:text-xs uppercase font-mono tracking-wider font-semibold">Venue</span>
          <span className="text-white font-extrabold">{initialCompetitionState.venue}</span>
        </div>
      </div>

      {/* CALL TO ACTION SECTION */}
      <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
        <p className="text-white/70 text-xs sm:text-sm md:text-base font-sans tracking-wide mb-1 break-keep">
          대회 접수 시작 시 가장 먼저 신속하게 알림을 전해드립니다.
        </p>
        
        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-white hover:bg-accent text-black font-black uppercase tracking-widest px-7 py-3.5 sm:px-9 sm:py-4 rounded-full transition-all text-xs sm:text-sm md:text-base shadow-xl hover:scale-105 active:scale-95 duration-200"
          >
            접수 시작 알림 받기
          </button>
        ) : (
          <div className="w-full bg-[#121612]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl relative text-left transition-all duration-300">
            <button 
              onClick={handleReset}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              aria-label="알림 신청 취소"
            >
              <X className="w-5 h-5" />
            </button>

            {isSubscribed ? (
              <div className="text-center py-4 flex flex-col items-center gap-3">
                <CheckCircle className="w-12 h-12 text-accent animate-bounce" />
                <h3 className="text-white text-lg sm:text-xl font-bold font-sans">알림 신청 완료!</h3>
                <p className="text-white/60 text-xs sm:text-sm font-sans break-keep max-w-[320px] leading-relaxed">
                  대회 접수가 개시되는 즉시 기재하신 이메일(<span className="text-accent font-bold font-mono">{email}</span>)로 가장 빠르게 알림 소식을 발송해 드리겠습니다.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-4 border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="text-white text-base sm:text-lg font-bold font-sans flex items-center gap-2 mb-1">
                  <Mail className="w-5 h-5 text-accent" />
                  접수 알림 신청
                </h3>
                
                <p className="text-white/60 text-xs font-sans break-keep leading-relaxed">
                  대회 모집이 오픈되면 이메일로 알림을 받아보실 수 있습니다.
                </p>

                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일을 입력하세요 (example@domain.com)"
                    className="w-full bg-black/40 border border-white/20 focus:border-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-colors font-sans"
                  />
                  {errorMsg && <p className="text-red-500 text-xs font-sans font-semibold pl-1">{errorMsg}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/95 disabled:bg-white/10 disabled:text-white/20 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 rounded-lg transition-all active:scale-[0.98] duration-150 flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isLoading ? '신청 중...' : '알림 신청하기'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>

                {!isAuthenticated && (
                  <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-2.5">
                    <p className="text-white/40 text-[11px] font-sans break-keep leading-normal text-center">
                      YBBF 회원으로 가입하시면 내 프로필 이메일로 훨씬 간편하게 알림을 예약 및 관리하실 수 있습니다.
                    </p>
                    <a
                      href="/login"
                      className="w-full border border-accent/40 hover:border-accent hover:bg-accent/5 text-accent text-center font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-all"
                    >
                      로그인 및 회원가입 하러 가기
                    </a>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
