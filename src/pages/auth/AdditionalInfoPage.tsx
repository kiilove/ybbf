import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Building, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserProfile } from '../../types/auth';

export default function AdditionalInfoPage() {
  const navigate = useNavigate();
  const { user, completeAdditionalInfo, isLoading } = useAuthStore();

  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    birth: '',
    tel: '',
    gym: '',
    gender: '',
  });

  const [validation, setValidation] = useState({
    name: false,
    birth: false,
    tel: false,
    gym: false,
    gender: false,
  });

  const [isValid, setIsValid] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 생년월일 하이픈 실시간 포맷팅
  const handleBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 4 && val.length <= 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
    } else if (val.length > 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
    }
    setFormData({ ...formData, birth: formatted });
  };

  // 연락처 하이픈 실시간 포맷팅
  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
    }
    setFormData({ ...formData, tel: formatted });
  };

  // 실시간 입력 데이터 유효성 체크
  useEffect(() => {
    const isNameValid = formData.name.trim().length >= 2;
    const isBirthValid = /^\d{4}-\d{2}-\d{2}$/.test(formData.birth);
    const isTelValid = /^\d{2,3}-\d{3,4}-\d{3,4}$/.test(formData.tel);
    const isGymValid = formData.gym.trim().length >= 1;
    const isGenderValid = formData.gender === 'm' || formData.gender === 'f';

    setValidation({
      name: !isNameValid && formData.name.length > 0,
      birth: !isBirthValid && formData.birth.length > 0,
      tel: !isTelValid && formData.tel.length > 0,
      gym: !isGymValid && formData.gym.length > 0,
      gender: !isGenderValid && formData.gender !== '',
    });

    setIsValid(isNameValid && isBirthValid && isTelValid && isGymValid && isGenderValid);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setFormError('모든 추가정보 양식을 올바르게 기입해 주십시오.');
      return;
    }
    setFormError(null);

    const success = await completeAdditionalInfo(formData);
    if (success) {
      // 가입 추가정보 등록 완료 시 대회 참가 신청 페이지(/competition)로 바로 보냅니다
      navigate('/competition');
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-12 max-w-[540px] mx-auto min-h-screen bg-[#0a0a0a] flex flex-col justify-center">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <span className="text-[10px] text-accent font-bold tracking-wider font-sans">회원 필수 정보 기재</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mb-2">
          추가정보 등록
        </h2>
        <p className="text-white/60 text-xs md:text-sm font-sans break-keep leading-relaxed px-4">
          대회 참가 신청 정보 연계를 위한 필수 인적사항(성명, 성별, 생년월일, 연락처, 소속)을 마지막으로 정확히 기입하여 가입을 마쳐주십시오.
        </p>
      </div>

      {/* ADDITIONAL INFO FORM CARD */}
      <div className="bg-[#161a16] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {formError && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 가입 연동 이메일 주소 정보 */}
          {user && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-xs font-mono">
              <span className="text-white/40 block text-[9px] font-bold mb-1 uppercase tracking-wider">가입 계정 정보</span>
              <span className="text-white font-bold">{user.email}</span>
              <span className="text-accent ml-2 text-[9px] bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded uppercase font-semibold">{user.provider}</span>
            </div>
          )}

          {/* 성명 & 성별 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 성명 */}
            <div>
              <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">이름 (실명)</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                  placeholder="홍길동"
                  className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                    validation.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                  }`}
                />
                <User className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
              </div>
              {validation.name && <p className="text-red-400 text-[10px] mt-1.5">이름은 2자 이상 입력해야 합니다.</p>}
            </div>

            {/* 성별 */}
            <div>
              <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">성별</label>
              <div className="grid grid-cols-2 gap-2.5 h-[46px]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'm' })}
                  disabled={isLoading}
                  className={`border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
                    formData.gender === 'm'
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  남자
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'f' })}
                  disabled={isLoading}
                  className={`border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
                    formData.gender === 'f'
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  여자
                </button>
              </div>
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">생년월일 (8자리)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.birth}
                onChange={handleBirthChange}
                disabled={isLoading}
                maxLength={10}
                placeholder="1995-05-15"
                className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                  validation.birth ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                }`}
              />
              <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {validation.birth && <p className="text-red-400 text-[10px] mt-1.5">YYYY-MM-DD 형식으로 입력하세요.</p>}
          </div>

          {/* 휴대전화번호 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">휴대전화번호</label>
            <div className="relative">
              <input
                type="tel"
                value={formData.tel}
                onChange={handleTelChange}
                disabled={isLoading}
                maxLength={13}
                placeholder="010-1234-5678"
                className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                  validation.tel ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                }`}
              />
              <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {validation.tel && <p className="text-red-400 text-[10px] mt-1.5">연락처 형식이 맞지 않습니다.</p>}
          </div>

          {/* 소속 */}
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">소속 체육관 (무소속 시 '무소속' 기재)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.gym}
                onChange={(e) => setFormData({ ...formData, gym: e.target.value })}
                disabled={isLoading}
                placeholder="용인 보디빌딩 짐"
                className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                  validation.gym ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                }`}
              />
              <Building className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
            </div>
            {validation.gym && <p className="text-red-400 text-[10px] mt-1.5">체육관명 또는 소속 단체를 남겨주세요.</p>}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full bg-accent disabled:bg-white/10 disabled:text-white/20 hover:bg-white text-black font-black py-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>추가정보 제출 중...</span>
              </>
            ) : (
              '추가정보 등록 완료'
            )}
          </button>

        </form>

      </div>

      <p className="text-center text-[10px] text-white/30 mt-6 font-mono">
        Official Athlete Profile Setup • YBBF Team
      </p>

    </div>
  );
}
