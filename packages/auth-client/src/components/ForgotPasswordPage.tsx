import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

export interface ForgotPasswordPageProps {
  onNavigateLogin?: () => void;
  customBrandName?: string;
}

export function ForgotPasswordPage({ onNavigateLogin, customBrandName }: ForgotPasswordPageProps) {
  const { config } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandName = customBrandName || config.brandName || '비밀번호 관리';

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
      setError(err.message || '요청 처리 도중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 md:px-12 max-w-[480px] mx-auto min-h-screen bg-[#0a0a0a] flex flex-col justify-center text-white">
      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-[#d2ff00]/20 mb-4">
          <span className="text-[10px] text-[#d2ff00] font-bold tracking-wider font-sans">{brandName}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mb-2">
          비밀번호 재설정
        </h2>
        <p className="text-white/60 text-xs md:text-sm font-sans break-keep leading-relaxed px-4">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 전송해 드립니다.
        </p>
      </div>

      {/* CORE CONTAINER */}
      <div className="bg-[#161a16] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {isSuccess ? (
          <div className="text-center py-4 space-y-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#d2ff00]/10 border border-[#d2ff00]/30 text-[#d2ff00] mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">메일 전송이 완료되었습니다</h3>
            <p className="text-white/60 text-xs sm:text-sm font-sans break-keep leading-relaxed px-2">
              입력하신 <strong className="text-white">{email}</strong> 메일함으로 재설정 토큰이 전송되었습니다.
            </p>
            {onNavigateLogin && (
              <button
                onClick={onNavigateLogin}
                className="w-full bg-[#d2ff00] hover:bg-white text-black font-black py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>로그인 화면으로 이동</span>
              </button>
            )}
          </div>
        ) : (
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
                  placeholder="user@example.com"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#d2ff00]/40 font-mono tracking-wide transition-colors"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
              </div>
            </div>

            <div className="bg-[#2d4a1f]/20 border border-[#d2ff00]/20 rounded-xl p-3.5 text-[10px] text-white/60 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-[#d2ff00] font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>공식 이메일 안내</span>
              </div>
              <p>메일이 수신되지 않을 경우 스팸 메일함 또는 메일 주소를 다시 확인해 주세요.</p>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              {onNavigateLogin && (
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>로그인으로 돌아가기</span>
                </button>
              )}
              
              <button
                type="submit"
                disabled={isLoading || !email}
                className="bg-[#d2ff00] hover:bg-white text-black font-black px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200 cursor-pointer ml-auto"
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
    </div>
  );
}
