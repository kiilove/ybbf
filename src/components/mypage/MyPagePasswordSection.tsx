import React, { useState } from 'react';
import { KeyRound, Lock, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';

interface MyPagePasswordSectionProps {
  user: any;
}

export function MyPagePasswordSection({ user }: MyPagePasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setErrorMsg('현재 비밀번호를 입력해 주세요.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await authService.changePassword(user.uid, currentPassword, newPassword);
      setSuccessMsg('비밀번호가 성공적으로 변경되었습니다! 다음 로그인부터 새 비밀번호를 사용하세요.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || '비밀번호 변경 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="max-w-[550px] mx-auto bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
      <div className="border-b border-white/5 pb-4 mb-6">
        <h2 className="text-base sm:text-lg font-bold text-accent tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent" /> 계정 비밀번호 변경
        </h2>
        <p className="text-xs text-white/50 mt-1 leading-relaxed">
          주기적인 비밀번호 변경으로 회원님의 계정을 안전하게 보호하세요.
        </p>
      </div>

      {successMsg && (
        <div className="bg-accent/10 border border-accent/30 text-accent px-4 py-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span className="leading-relaxed font-sans">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0" />
          <span className="leading-relaxed font-sans">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 가입 이메일 계정 표시 */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-xs font-mono">
          <span className="text-white/40 block text-[9px] font-bold mb-1 uppercase tracking-wider">대상 계정 이메일</span>
          <span className="text-white font-bold">{user?.email}</span>
        </div>

        {/* 현재 비밀번호 */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">현재 비밀번호 <span className="text-accent">*</span></label>
          <div className="relative">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={isLoading}
              placeholder="현재 사용 중인 비밀번호"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
            />
            <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
        </div>

        {/* 새 비밀번호 */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">새 비밀번호 <span className="text-accent">*</span></label>
          <div className="relative">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={isLoading}
              placeholder="새로 사용할 비밀번호 (6자 이상)"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-mono tracking-wide transition-colors"
            />
            <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          {newPassword.length > 0 && !isMinLength && (
            <p className="text-red-400 text-[10px] mt-1.5 font-mono">비밀번호는 최소 6자 이상 입력해야 합니다.</p>
          )}
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">새 비밀번호 확인 <span className="text-accent">*</span></label>
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={isLoading}
              placeholder="새 비밀번호 다시 입력"
              className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                confirmPassword.length > 0 && !isMatch
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-accent/40'
              }`}
            />
            <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          {confirmPassword.length > 0 && !isMatch && (
            <p className="text-red-400 text-[10px] mt-1.5 font-mono">새 비밀번호 확인이 일치하지 않습니다.</p>
          )}
          {isMatch && isMinLength && (
            <p className="text-accent text-[10px] mt-1.5 font-mono font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 새 비밀번호가 일치합니다.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !currentPassword || !isMinLength || !isMatch}
          className="w-full bg-accent disabled:bg-white/10 disabled:text-white/20 hover:bg-white text-black font-black py-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>비밀번호 변경 처리 중...</span>
            </>
          ) : (
            <span>비밀번호 변경 완료</span>
          )}
        </button>
      </form>
    </div>
  );
}
