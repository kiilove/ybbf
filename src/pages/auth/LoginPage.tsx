import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertTriangle, ShieldCheck, Chrome, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithSocial, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  useEffect(() => {
    // 마운트 시 에러 상태 초기화 및 최근 로그인 정보 로드
    clearError();
    setLastProvider(localStorage.getItem('ybbf_last_login_provider'));
  }, [clearError]);

  const validateEmail = (val: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!email.trim()) {
      setEmailError('이메일 주소를 입력해 주세요.');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('유효한 이메일 형식이 아닙니다.');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해 주세요.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상입니다.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;
    
    const success = await loginWithEmail(email, password);
    if (success) {
      // 로그인 성공 시 추가정보 미기재 회원은 추가정보 입력창으로, 완료자는 대회 페이지로 안내합니다
      const state = useAuthStore.getState();
      if (!state.isProfileComplete) {
        navigate('/additional-info');
      } else {
        navigate('/');
      }
    }
  };

  const handleSocialClick = async (provider: 'kakao' | 'naver' | 'google') => {
    const success = await loginWithSocial(provider);
    if (success) {
      // 소셜 로그인 성공 시에도 추가정보 미기재 회원은 추가정보 입력창으로 분기합니다
      const state = useAuthStore.getState();
      if (!state.isProfileComplete) {
        navigate('/additional-info');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-12 max-w-[480px] mx-auto min-h-screen bg-[#0a0a0a] flex flex-col justify-center">
      
      {/* BRAND HEADER */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <span className="text-[10px] text-accent font-bold tracking-wider font-sans">YBBF 선수 인증</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mb-2">
          선수 로그인
        </h2>
        <p className="text-white/60 text-xs md:text-sm font-sans break-keep leading-relaxed px-4">
          대회 참가 신청, 조회 및 유소년 등록 서비스 이용을 위한 인증을 진행해 주십시오.
        </p>
      </div>

      {/* CORE LOGIN FORM CARD (Premium Flat Glassmorphism) */}
      <div className="bg-[#161a16] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* 서버 에러 알림 */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-5 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 최근 로그인 힌트 전역 안내 배너 */}
        {lastProvider && (
          <div className="bg-[#2d4a1f]/20 border border-accent/20 rounded-xl p-3.5 mb-5 text-xs text-white/90 font-sans flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <span>
              최근에{' '}
              <strong className="text-accent font-extrabold">
                {lastProvider === 'email' && '이메일 계정'}
                {lastProvider === 'google' && 'Google 계정'}
                {lastProvider === 'naver' && '네이버 아이디'}
                {lastProvider === 'kakao' && '카카오톡'}
              </strong>
              으로 로그인하셨습니다.
            </span>
          </div>
        )}

        {/* 이메일 주소 & 비밀번호 로그인 폼 */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">이메일 주소</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                disabled={isLoading}
                placeholder="athlete@ybbf.com"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
              />
              <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {emailError && (
              <p className="text-red-400 text-[10px] mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                disabled={isLoading}
                placeholder="••••••"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
              />
              <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {passwordError && (
              <p className="text-red-400 text-[10px] mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          {/* 로그인 진행 및 이메일 / 비밀번호 찾기 단추 */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => navigate('/find-account')}
              className="text-[10px] sm:text-xs text-white/50 hover:text-accent flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>이메일(아이디) / 비밀번호 찾기</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200"
          >
            {isLoading ? '인증 진행 중...' : '이메일로 로그인'}
          </button>
        </form>
        {/* SOCIAL INTERACTION BUTTONS & SIGNUP LINK */}
        <div className="space-y-3 mt-6">
          {/* OR DIVIDER - TEMPORARILY DISABLED */}
          {false && (
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="text-[10px] text-white/30 px-3 uppercase font-mono tracking-widest">or social login</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>
          )}

          {/* SOCIAL LOGIN BUTTONS - TEMPORARILY DISABLED */}
          {false && (
            <>
              {/* KAKAO (Yellow theme) */}
              <button
                type="button"
                onClick={() => handleSocialClick('kakao')}
                disabled={isLoading}
                className={`w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-bold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow relative ${
                  lastProvider === 'kakao' ? 'ring-2 ring-accent' : ''
                }`}
              >
                <div className="w-4 h-4 bg-[#191919] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-black text-[#FEE500] font-sans">K</span>
                </div>
                <span>카카오톡으로 로그인</span>
                {lastProvider === 'kakao' && (
                  <span className="absolute right-3 top-2.5 text-[8px] bg-[#191919] text-[#FEE500] px-1.5 py-0.5 rounded font-black">최근</span>
                )}
              </button>

              {/* NAVER (Green theme) */}
              <button
                type="button"
                onClick={() => handleSocialClick('naver')}
                disabled={isLoading}
                className={`w-full bg-[#03C75A] hover:bg-[#03C75A]/90 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow relative ${
                  lastProvider === 'naver' ? 'ring-2 ring-accent' : ''
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-[#03C75A] font-sans leading-none">N</span>
                </div>
                <span>네이버로 로그인</span>
                {lastProvider === 'naver' && (
                  <span className="absolute right-3 top-2.5 text-[8px] bg-white text-[#03C75A] px-1.5 py-0.5 rounded font-black">최근</span>
                )}
              </button>

              {/* GOOGLE (White theme) */}
              <button
                type="button"
                onClick={() => handleSocialClick('google')}
                disabled={isLoading}
                className={`w-full bg-white hover:bg-white/90 text-black font-bold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow relative ${
                  lastProvider === 'google' ? 'ring-2 ring-accent' : ''
                }`}
              >
                <Chrome className="w-4 h-4 text-black shrink-0" />
                <span>Google 계정으로 로그인</span>
                {lastProvider === 'google' && (
                  <span className="absolute right-3 top-2.5 text-[8px] bg-black text-[#d2ff00] px-1.5 py-0.5 rounded font-black">최근</span>
                )}
              </button>
            </>
          )}

          {/* 회원가입 유도 링크 */}
          <div className="mt-6 text-center text-xs text-white/40">
            신규 선수 등록이 필요하신가요?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-accent hover:underline font-extrabold transition-all ml-1"
            >
              이메일 회원가입
            </button>
          </div>
        </div>


      </div>

      <p className="text-center text-[10px] text-white/30 mt-6 font-mono">
        Secured by YBBF Athletes Authentication Portal
      </p>

    </div>
  );
}
