import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';

export interface ResetPasswordPageProps {
  token?: string;
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export function ResetPasswordPage({
  token: tokenProp,
  onSuccess,
  onNavigateLogin,
}: ResetPasswordPageProps) {
  const token = tokenProp || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('유효한 비밀번호 재설정 토큰이 존재하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await authService.confirmPasswordReset(token, newPassword);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '비밀번호 변경 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 px-4 flex items-center justify-center font-sans relative overflow-hidden text-white">
      <div className="max-w-[440px] w-full bg-[#161a16] border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#d2ff00]/10 border border-[#d2ff00]/20 text-[#d2ff00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-display mb-1">
            새 비밀번호 <span className="text-[#d2ff00]">설정</span>
          </h1>
          <p className="text-xs text-white/60">
            새로 사용하실 안전한 비밀번호를 입력해 주세요.
          </p>
        </div>

        {!token ? (
          <div className="text-center py-6 space-y-4">
            <div className="bg-red-950/40 border border-red-500/30 text-red-200 p-4 rounded-xl text-xs leading-relaxed">
              ⚠️ 유효하지 않은 재설정 링크입니다. 이메일로 받으신 링크를 다시 확인해 주세요.
            </div>
            {onNavigateLogin && (
              <button
                onClick={onNavigateLogin}
                className="w-full bg-[#0a0a0a] hover:bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> 로그인 페이지로 돌아가기
              </button>
            )}
          </div>
        ) : isSuccess ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-14 h-14 bg-[#d2ff00]/10 border border-[#d2ff00]/30 text-[#d2ff00] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-2">비밀번호 변경 완료!</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                비밀번호가 성공적으로 변경되었습니다.<br />
                새로 설정하신 비밀번호로 로그인해 주시기 바랍니다.
              </p>
            </div>
            {onNavigateLogin && (
              <button
                onClick={onNavigateLogin}
                className="w-full bg-[#d2ff00] hover:bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#d2ff00]/15"
              >
                로그인하러 가기
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] md:text-xs text-white/60 mb-2 font-mono tracking-widest uppercase font-semibold">
                새 비밀번호 <span className="text-[#d2ff00]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  disabled={isSubmitting}
                  className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#d2ff00] rounded-xl pl-10 pr-10 py-3.5 text-white text-xs md:text-sm focus:outline-none transition-all placeholder:text-white/20"
                />
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs text-white/60 mb-2 font-mono tracking-widest uppercase font-semibold">
                새 비밀번호 확인 <span className="text-[#d2ff00]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 재입력"
                  disabled={isSubmitting}
                  className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#d2ff00] rounded-xl pl-10 pr-4 py-3.5 text-white text-xs md:text-sm focus:outline-none transition-all placeholder:text-white/20"
                />
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#d2ff00] hover:bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#d2ff00]/15 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>비밀번호 변경 중...</span>
                </>
              ) : (
                <span>비밀번호 변경 저장</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
