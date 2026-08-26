import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, KeyRound, Search, ShieldAlert } from 'lucide-react';
import { authService } from '../../services/authService';

export default function FindAccountPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'password' ? 'password' : 'email';
  
  const [activeTab, setActiveTab] = useState<'email' | 'password'>(initialTab);

  // 이메일 찾기 Form State
  const [findName, setFindName] = useState('');
  const [findTel, setFindTel] = useState('');
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const [foundEmailResult, setFoundEmailResult] = useState<{ email: string; createdAt?: string } | null>(null);
  const [findEmailError, setFindEmailError] = useState<string | null>(null);

  // 비밀번호 찾기 Form State
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // 전화번호 포맷팅 (010-0000-0000)
  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setFindTel(formatted);
    if (findEmailError) setFindEmailError(null);
  };

  const handleTabChange = (tab: 'email' | 'password') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setFindEmailError(null);
    setResetError(null);
  };

  // 1. 이메일(아이디) 찾기 제출
  const handleFindEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findName.trim() || findName.trim().length < 2) {
      setFindEmailError('2자 이상의 이름을 입력해 주세요.');
      return;
    }
    if (!findTel || findTel.replace(/[^0-9]/g, '').length < 9) {
      setFindEmailError('올바른 휴대전화 번호를 입력해 주세요.');
      return;
    }

    setIsFindingEmail(true);
    setFindEmailError(null);
    setFoundEmailResult(null);

    try {
      const result = await authService.findEmail(findName.trim(), findTel);
      setFoundEmailResult(result);
    } catch (err: any) {
      setFindEmailError(err.message || '이메일 찾기 중 오류가 발생했습니다.');
    } finally {
      setIsFindingEmail(false);
    }
  };

  // 2. 비밀번호 찾기 (재설정 메일 발송) 제출
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    setIsSendingReset(true);
    setResetError(null);

    try {
      await authService.sendForgotPasswordEmail(resetEmail);
      setIsResetSent(true);
    } catch (err: any) {
      setResetError(err.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-12 max-w-[500px] mx-auto min-h-screen bg-[#0a0a0a] flex flex-col justify-center font-sans text-white relative">
      
      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <span className="text-[10px] text-accent font-bold tracking-wider font-sans">YBBF 선수 계정 세이프티 Portal</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mb-2">
          계정 <span className="text-accent">정보 찾기</span>
        </h2>
        <p className="text-white/60 text-xs md:text-sm font-sans break-keep leading-relaxed px-4">
          가입 시 등록하신 정보를 통해 이메일(아이디)을 조회하거나 비밀번호를 재설정하실 수 있습니다.
        </p>
      </div>

      {/* TABS CONTAINER */}
      <div className="bg-[#161a16] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* TAB NAVIGATION */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0a0a0a] border border-white/5 rounded-xl mb-6 font-mono text-xs">
          <button
            type="button"
            onClick={() => handleTabChange('email')}
            className={`py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-accent text-black font-black shadow-md shadow-accent/10'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>이메일(아이디) 찾기</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('password')}
            className={`py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'password'
                ? 'bg-accent text-black font-black shadow-md shadow-accent/10'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>비밀번호 찾기</span>
          </button>
        </div>

        {/* TAB 1: 이메일(아이디) 찾기 */}
        {activeTab === 'email' && (
          <div>
            {foundEmailResult ? (
              <div className="text-center py-4 space-y-5">
                <div className="w-14 h-14 bg-accent/10 border border-accent/30 text-accent rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">회원님의 이메일(아이디) 정보입니다</h3>
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 my-3 text-center">
                    <span className="text-accent text-base md:text-lg font-mono font-black select-all">
                      {foundEmailResult.email}
                    </span>
                    {foundEmailResult.createdAt && (
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        가입일: {foundEmailResult.createdAt}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    개인정보 보호를 위해 일부 글자는 마스킹(*) 처리되어 표시됩니다.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-accent/10"
                  >
                    이메일로 로그인하기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(foundEmailResult.email.replace(/\*/g, ''));
                      handleTabChange('password');
                    }}
                    className="w-full bg-[#0a0a0a] hover:bg-white/5 border border-white/10 text-white/80 font-bold py-3.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    이 계정의 비밀번호 찾기 (재설정)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFindEmailSubmit} className="space-y-4">
                {findEmailError && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="break-keep">{findEmailError}</span>
                  </div>
                )}

                {/* 이름 입력 */}
                <div>
                  <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">선수 성명 <span className="text-accent">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={findName}
                      onChange={(e) => {
                        setFindName(e.target.value);
                        if (findEmailError) setFindEmailError(null);
                      }}
                      disabled={isFindingEmail}
                      placeholder="가입 시 입력한 실명"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                    <User className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                  </div>
                </div>

                {/* 전화번호 입력 */}
                <div>
                  <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">휴대전화 번호 <span className="text-accent">*</span></label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={findTel}
                      onChange={handleTelChange}
                      maxLength={13}
                      disabled={isFindingEmail}
                      placeholder="010-0000-0000"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
                    />
                    <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                  </div>
                </div>

                {/* 보안 안내 팁 */}
                <div className="bg-[#2d4a1f]/20 border border-accent/20 rounded-xl p-3 text-[10px] text-white/60 leading-relaxed flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>보안 정책상 동일 IP에서 <strong>1분당 최대 3회</strong>까지 조회가 허용됩니다.</span>
                </div>

                <button
                  type="submit"
                  disabled={isFindingEmail || !findName.trim() || !findTel}
                  className="w-full bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {isFindingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>회원 정보 조회 중...</span>
                    </>
                  ) : (
                    <span>이메일(아이디) 조회</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: 비밀번호 찾기 */}
        {activeTab === 'password' && (
          <div>
            {isResetSent ? (
              <div className="text-center py-4 space-y-5">
                <div className="w-14 h-14 bg-accent/10 border border-accent/30 text-accent rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">재설정 이메일 전송 완료</h3>
                  <p className="text-xs text-white/70 leading-relaxed break-keep">
                    입력하신 <strong className="text-accent font-mono">{resetEmail}</strong> 주소로 비밀번호 재설정 이메일을 발송했습니다.<br />
                    메일함의 안내 링크를 클릭하여 1시간 내에 새 비밀번호를 설정해 주시기 바랍니다.
                  </p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-lg text-[10px] text-white/40 leading-relaxed text-left font-mono">
                  발신자 주소: noreply@ybbf.org (메일이 수신되지 않는 경우 스팸 메일함을 점검하세요)
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-accent/10"
                >
                  로그인 화면으로 돌아가기
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {resetError && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="break-keep">{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">가입 이메일 주소 <span className="text-accent">*</span></label>
                  <div className="relative">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (resetError) setResetError(null);
                      }}
                      disabled={isSendingReset}
                      placeholder="athlete@ybbf.com"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
                    />
                    <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                  </div>
                </div>

                <div className="bg-[#2d4a1f]/20 border border-accent/20 rounded-xl p-3 text-[10px] text-white/60 leading-relaxed flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>보안 정책상 동일 IP에서 <strong>1분당 최대 3회</strong>까지 발송이 허용됩니다.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSendingReset || !resetEmail}
                  className="w-full bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>재설정 메일 발송 중...</span>
                    </>
                  ) : (
                    <span>비밀번호 재설정 메일 발송</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* BOTTOM BACK TO LOGIN LINK */}
        <div className="pt-6 mt-6 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-accent font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>로그인 화면으로 돌아가기</span>
          </button>
        </div>

      </div>
    </div>
  );
}
