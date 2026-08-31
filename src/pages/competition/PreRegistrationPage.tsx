import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { 
  Trophy, Sparkles, CheckCircle2, Shield, Bell, Music, 
  ArrowLeft, Send, Award, Dumbbell, User, Phone, Mail, Building 
} from 'lucide-react';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const CATEGORIES_OPTIONS = [
  '남자 일반부 보디빌딩',
  '클래식 보디빌딩',
  '남자 피지크',
  '남자 스포츠 모델',
  '여자 비키니',
  '여자 핏모델 / 모노키니',
  '남자 학생부 보디빌딩 (고등부)',
  '마스터즈 보디빌딩 (장년부)',
  '남자 대학부 보디빌딩/피지크'
];

export default function PreRegistrationPage() {
  useScrollToTop();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '남성',
    birthDate: '',
    gym: '',
    desiredCategories: [] as string[],
    message: '',
    agreeTerms: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => {
      const exists = prev.desiredCategories.includes(cat);
      if (exists) {
        return { ...prev, desiredCategories: prev.desiredCategories.filter(c => c !== cat) };
      } else {
        return { ...prev, desiredCategories: [...prev.desiredCategories, cat] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('선수 성명을 입력해주세요.');
      return;
    }
    if (!formData.phone.trim()) {
      alert('휴대폰 연락처를 입력해주세요.');
      return;
    }
    if (formData.desiredCategories.length === 0) {
      alert('출전 희망 종목을 최소 1개 이상 선택해주세요.');
      return;
    }
    if (!formData.agreeTerms) {
      alert('사전 안내 및 개인정보 수집에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'pre_registrations_2027'), {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        birthDate: formData.birthDate,
        gym: formData.gym.trim(),
        desiredCategories: formData.desiredCategories,
        message: formData.message.trim(),
        createdAt: new Date().toISOString()
      });

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('사전 접수 제출 에러:', err);
      alert('사전 접수 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#030305] min-h-screen text-white pt-24 pb-32">
      
      {/* ═══ 1. 헤더 섹션 ═══ */}
      <section className="relative py-16 md:py-24 px-6 md:px-16 max-w-[1440px] mx-auto border-b border-white/10">
        
        {/* 뒤로가기 버튼 */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 text-xs font-mono font-bold uppercase text-white/70 hover:text-white hover:border-white/40 transition-all"
          >
            <ArrowLeft size={14} /> 메인 홈으로 돌아가기
          </Link>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#b4ff00]/40 w-max mb-6 backdrop-blur-md">
          <Sparkles size={14} className="text-[#b4ff00] animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-[#b4ff00] uppercase">
            2027 YBBF 10TH ANNIVERSARY PRE-REGISTRATION
          </span>
        </div>

        <h1 className="text-display text-[clamp(36px,6.5vw,90px)] leading-[0.9] font-black italic uppercase tracking-tighter text-white mb-6">
          2027 제10회 용인특례시 대회 <br />
          <span className="text-[#b4ff00]">사전 얼리버드 접수</span>
        </h1>

        <p className="text-sm md:text-lg text-white/70 font-sans max-w-2xl leading-relaxed">
          차기 2027년 제10회 대회를 준비하시는 선수분들을 위한 공식 사전 등록 시스템입니다. <br className="hidden md:inline" />
          미리 등록하신 선수분들께는 공식 개최 공고 알림 및 얼리버드 참가 특전이 최우선 제공됩니다.
        </p>

      </section>

      {/* ═══ 2. 사전 접수 특전 배너 ═══ */}
      <section className="py-12 px-6 md:px-16 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#b4ff00]/10 border border-[#b4ff00]/30 text-[#b4ff00] shrink-0">
              <Award size={22} />
            </div>
            <div>
              <h3 className="text-lg font-display font-black italic uppercase text-white mb-1">얼리버드 참가비 할인</h3>
              <p className="text-xs text-white/60 leading-relaxed">정식 접수 오픈 시 사전 접수자 전용 특별 할인 혜택이 적용됩니다.</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 shrink-0">
              <Music size={22} />
            </div>
            <div>
              <h3 className="text-lg font-display font-black italic uppercase text-white mb-1">공식 음원 우선 선점권</h3>
              <p className="text-xs text-white/60 leading-relaxed">VIBEFLOWS 공식 무대 테마 음원을 가장 먼저 지정할 수 있는 우선권을 드립니다.</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-sky-400/10 border border-sky-400/30 text-sky-400 shrink-0">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-lg font-display font-black italic uppercase text-white mb-1">개최 요강 SMS 최우선 알림</h3>
              <p className="text-xs text-white/60 leading-relaxed">대회 일자 확정 및 공식 계측 요강 발표 즉시 알림 문자를 발송해 드립니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. 사전 접수 신청 폼 ═══ */}
      <section className="py-8 px-6 md:px-16 max-w-[900px] mx-auto">
        {isSubmitted ? (
          <div className="p-12 md:p-16 rounded-3xl bg-gradient-to-br from-[#0a150c] to-[#050505] border border-[#b4ff00]/40 text-center space-y-6 shadow-[0_0_50px_rgba(180,255,0,0.15)]">
            <div className="w-20 h-20 rounded-full bg-[#b4ff00]/20 border border-[#b4ff00]/50 flex items-center justify-center text-[#b4ff00] mx-auto animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono text-[#b4ff00] uppercase font-bold tracking-widest">
                PRE-REGISTRATION COMPLETED
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-black italic uppercase text-white">
                사전 접수가 완료되었습니다!
              </h2>
              <p className="text-sm md:text-base text-white/70 font-sans max-w-md mx-auto leading-relaxed pt-2">
                <strong>{formData.name}</strong> 선수님, 2027 제10회 용인특례시 대회 사전 등록이 정상 접수되었습니다. 대회 일정이 확정되는 대로 등록하신 연락처(<strong>{formData.phone}</strong>)로 가장 먼저 안내드리겠습니다.
              </p>
            </div>

            <div className="pt-6 flex justify-center gap-4">
              <Link 
                to="/" 
                className="px-8 py-3.5 rounded-full bg-[#b4ff00] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform"
              >
                메인 홈으로 이동 →
              </Link>
              <Link 
                to="/champions" 
                className="px-8 py-3.5 rounded-full bg-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition-all border border-white/15"
              >
                역대 우승자 기록실 보기
              </Link>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            className="p-8 md:p-12 rounded-3xl bg-[#08080c] border border-white/15 shadow-2xl space-y-8"
          >
            <div className="border-b border-white/10 pb-6">
              <h2 className="text-2xl font-display font-black italic uppercase text-white mb-2">
                선수 참가 정보 입력
              </h2>
              <p className="text-xs text-white/50 font-sans">
                정확한 연락처를 기재해주셔야 공식 알림 및 얼리버드 혜택을 수신하실 수 있습니다.
              </p>
            </div>

            {/* 인적 사항 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80 mb-2">
                  선수 성명 <span className="text-[#b4ff00]">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    required
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#b4ff00] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80 mb-2">
                  휴대폰 번호 <span className="text-[#b4ff00]">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="tel" 
                    required
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#b4ff00] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80 mb-2">
                  이메일 주소 (선택)
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="email" 
                    placeholder="athlete@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#b4ff00] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80 mb-2">
                  소속 체육관 / 학교명 (선택)
                </label>
                <div className="relative">
                  <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="예) 용인스타짐 / 청덕고등학교 등"
                    value={formData.gym}
                    onChange={(e) => setFormData({ ...formData, gym: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#b4ff00] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 출전 희망 종목 (다중 선택) */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80">
                2027 제10회 출전 희망 종목 (중복 선택 가능) <span className="text-[#b4ff00]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES_OPTIONS.map((cat) => {
                  const isSelected = formData.desiredCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`p-3.5 rounded-2xl text-left font-sans text-xs font-bold transition-all border flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[#b4ff00]/15 border-[#b4ff00] text-[#b4ff00] shadow-[0_0_15px_rgba(180,255,0,0.2)]' 
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 협회에 바라는 점 / 메시지 */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80">
                요청 사항 및 바라는 점 (선택)
              </label>
              <textarea
                rows={3}
                placeholder="대회 운영 또는 출전과 관련하여 협회에 전달하고 싶은 메시지가 있다면 자유롭게 적어주세요."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#b4ff00] transition-colors resize-none"
              />
            </div>

            {/* 개인정보 수집 동의 */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#b4ff00]"
                />
                <span className="text-xs text-white/70 font-sans">
                  [필수] 2027 제10회 대회 개최 알림 및 얼리버드 특전 안내를 위한 개인정보 수집에 동의합니다.
                </span>
              </label>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#b4ff00] hover:bg-white text-black font-mono font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(180,255,0,0.3)] hover:scale-[1.01]"
            >
              <Send size={16} />
              {isSubmitting ? '사전 접수 등록 중...' : '2027 제10회 사전 얼리버드 신청하기'}
            </button>

          </form>
        )}
      </section>

    </div>
  );
}
