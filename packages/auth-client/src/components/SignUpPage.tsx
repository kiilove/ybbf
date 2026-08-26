import React, { useState, useEffect } from 'react';
import { Mail, Lock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCheckEmail } from '../hooks/useCheckEmail';

export interface SignUpPageProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
  customBrandName?: string;
}

export function SignUpPage({ onSuccess, onNavigateLogin, customBrandName }: SignUpPageProps) {
  const { signUpWithEmail, isLoading, config } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { isDuplicate, isChecking, checkError } = useCheckEmail(email);

  const [validation, setValidation] = useState({
    email: false,
    password: false,
    confirm: false,
  });

  const [isValid, setIsValid] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const brandName = customBrandName || config.brandName || '회원가입';

  const validateEmail = (val: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  useEffect(() => {
    const isEmailFormatValid = validateEmail(email);
    const isEmailValid = isEmailFormatValid && !isDuplicate && !isChecking;
    const isPasswordValid = password.length >= 6;
    const isConfirmValid = password === confirmPassword && confirmPassword.length > 0;

    setValidation({
      email: (!isEmailFormatValid || isDuplicate) && email.length > 0,
      password: !isPasswordValid && password.length > 0,
      confirm: !isConfirmValid && confirmPassword.length > 0,
    });

    setIsValid(isEmailValid && isPasswordValid && isConfirmValid);
  }, [email, password, confirmPassword, isDuplicate, isChecking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setFormError('회원가입 양식을 충족하지 못했습니다.');
      return;
    }
    setFormError(null);

    const success = await signUpWithEmail(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 md:px-12 max-w-[480px] mx-auto min-h-screen bg-[#0a0a0a] flex flex-col justify-center text-white">
      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-[#d2ff00]/20 mb-4">
          <span className="text-[10px] text-[#d2ff00] font-bold tracking-wider font-sans">{brandName}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mb-2">
          이메일 회원가입
        </h2>
        <p className="text-white/60 text-xs md:text-sm font-sans break-keep leading-relaxed px-4">
          서비스 이용을 위해 신규 계정을 생성하세요.
        </p>
      </div>

      {/* SIGNUP CARD CONTAINER */}
      <div className="bg-[#161a16] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {formError && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이메일 주소 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">이메일 주소</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="user@example.com"
                className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                  validation.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d2ff00]/40'
                }`}
              />
              <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {validation.email && !isDuplicate && !isChecking && (
              <p className="text-red-400 text-[10px] mt-1.5">유효한 이메일 형식을 입력해 주세요.</p>
            )}
            {isDuplicate && (
              <p className="text-red-400 text-[10px] mt-1.5">이미 존재하는 이메일 계정입니다.</p>
            )}
            {isChecking && (
              <p className="text-[#d2ff00] text-[10px] mt-1.5">이메일 중복 확인 중...</p>
            )}
            {checkError && (
              <p className="text-red-400 text-[10px] mt-1.5">{checkError}</p>
            )}
            {!validation.email && email.length > 0 && !isDuplicate && !isChecking && !checkError && (
              <p className="text-[#d2ff00] text-[10px] mt-1.5">사용 가능한 이메일입니다.</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••"
                className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                  validation.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d2ff00]/40'
                }`}
              />
              <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {validation.password ? (
              <p className="text-red-400 text-[10px] mt-1.5">비밀번호는 최소 6자 이상이어야 합니다.</p>
            ) : (
              <p className="text-white/30 text-[9px] mt-1.5">최소 6자 이상을 입력하세요.</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">비밀번호 확인</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••"
                className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                  validation.confirm ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d2ff00]/40'
                }`}
              />
              {confirmPassword.length > 0 && password === confirmPassword ? (
                <CheckCircle2 className="absolute right-3.5 top-3.5 w-4 h-4 text-[#d2ff00]" />
              ) : (
                <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
              )}
            </div>
            {validation.confirm && <p className="text-red-400 text-[10px] mt-1.5">비밀번호가 서로 일치하지 않습니다.</p>}
          </div>

          {/* 회원가입 제출 */}
          <button
            type="submit"
            disabled={!isValid || isLoading || isChecking}
            className="w-full bg-[#d2ff00] disabled:bg-white/10 disabled:text-white/20 hover:bg-white text-black font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>계정 생성 중...</span>
              </>
            ) : (
              '회원가입'
            )}
          </button>
        </form>

        {onNavigateLogin && (
          <div className="mt-6 border-t border-white/5 pt-4 text-center">
            <p className="text-white/40 text-[11px]">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={onNavigateLogin}
                className="text-[#d2ff00] hover:underline font-bold transition-all ml-1 cursor-pointer"
              >
                로그인하기
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
