import React, { useState } from 'react';
import { Mail, X, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await authService.sendForgotPasswordEmail(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || '비밀번호 재설정 메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 font-sans backdrop-blur-sm">
      <div className="bg-[#161a16] border border-white/15 rounded-2xl max-w-[440px] w-full p-6 md:p-8 relative shadow-2xl overflow-hidden">
        {/* Neon Glow */}
        <div className="absolute top-[-30%] right-[-30%] w-[200px] h-[200px] bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">비밀번호 찾기</h3>
            <p className="text-xs text-white/60">가입하신 이메일로 재설정 인증 링크를 보내드립니다.</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/30 text-accent rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1.5">인증 메일 발송 완료</h4>
              <p className="text-xs text-white/70 leading-relaxed break-keep">
                <span className="text-accent font-mono font-bold">{email}</span> 주소로 비밀번호 재설정 이메일을 발송했습니다.<br />
                메일함을 확인하시고 1시간 이내에 안내된 링크를 눌러 새 비밀번호를 설정해 주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full mt-4 bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-accent/10"
            >
              확인 및 창 닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] md:text-xs text-white/60 mb-2 font-mono tracking-widest uppercase font-semibold">
                가입한 이메일 주소 <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-[#0a0a0a] border border-white/10 focus:border-accent rounded-xl pl-10 pr-4 py-3.5 text-white text-xs md:text-sm focus:outline-none transition-all placeholder:text-white/20"
                />
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-[#0a0a0a] hover:bg-white/5 border border-white/10 text-white/70 font-bold py-3.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-white text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-accent/10 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>메일 발송 중...</span>
                  </>
                ) : (
                  <span>재설정 메일 발송</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
