import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { authService } from '../../services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('이메일 주소를 입력해 주십시오.');
      return;
    }
    if (!validateEmail(email)) {
      setError('유효하지 않은 이메일 형식입니다.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const success = await authService.sendForgotPasswordEmail(email);
      if (success) {
        setIsSuccess(true);
      } else {
        setError('비밀번호 재설정 메일 전송에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '요청 처리 도중 네트워크에 이상이 생겼습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-12 max-w-[480px] mx-auto min-h-screen bg-[#0a0a0a] flex flex-col justify-center">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <span className="text-[10px] text-accent font-bold tracking-wider font-sans">비밀번호 관리</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mb-2">
          비밀번호 재설정
        </h2>
        <p className="text-white/60 text-xs md:text-sm font-sans break-keep leading-relaxed px-4">
          가입하신 이메일 주소를 입력하시면, 본인 식별용 임시 비밀번호 재설정 토큰을 안전하게 전송해 드립니다.
        </p>
      </div>

      {/* CORE CONTAINER */}
      <div className="bg-[#161a16] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {isSuccess ? (
          /* SUCCESS STATE VIEW */
          <div className="text-center py-4 space-y-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 border border-accent/30 text-accent mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">메일 전송이 신청되었습니다</h3>
            <p className="text-white/60 text-xs sm:text-sm font-sans break-keep leading-relaxed px-2">
              입력하신 <strong className="text-white">{email}</strong> 메일함으로 재설정 토큰이 전송되었습니다. 메일함의 토큰 코드를 확인한 뒤 가이드에 따라 비밀번호를 재등록해 주십시오.
            </p>
            <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-lg text-[10px] text-white/40 leading-relaxed text-left font-mono">
              주의: 메일이 수신되지 않을 경우 스팸 메일함 또는 메일 주소의 대소문자를 다시 한번 점검해 주시기 바랍니다.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-accent hover:bg-white text-black font-black py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>로그인 화면으로 이동</span>
            </button>
          </div>
        ) : (
          /* EMAIL INPUT FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">이메일 주소</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  placeholder="athlete@ybbf.com"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
              </div>
            </div>

            {/* Cloudflare Native Email Notice Box */}
            <div className="bg-[#2d4a1f]/20 border border-accent/20 rounded-xl p-3.5 text-[10px] text-white/60 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>공식 이메일 인증 안내 (noreply@ybbf.org)</span>
              </div>
              <p>용인특례시보디빌딩협회(YBBF) 공식 이메일 발송 엔진을 통해 비밀번호 재설정 링크가 안전하게 전달됩니다.</p>
              <p>메일이 오지 않을 경우 스팸함 혹은 입력하신 메일 주소를 다시 확인해 주세요.</p>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>로그인으로 돌아가기</span>
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !email}
                className="bg-accent hover:bg-white text-black font-black px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>전송 중...</span>
                  </>
                ) : (
                  '재설정 이메일 전송'
                )}
              </button>
            </div>
          </form>
        )}

      </div>

      <p className="text-center text-[10px] text-white/30 mt-6 font-mono">
        Official Athlete Profile Setup • YBBF Team
      </p>

    </div>
  );
}
