import React, { useState, useRef } from 'react';
import { 
  User as UserIcon, 
  Calendar, 
  Building, 
  Phone, 
  CheckCircle, 
  Edit2, 
  Loader2, 
  ShieldAlert,
  Camera,
  AtSign,
  Upload
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { authService } from '../../services/authService';
import { useUploadToR2 } from '../../hooks/useUploadToR2';

interface MyPageProfileSectionProps {
  user: any;
  profileData: UserProfile;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfile>>;
  validation: { name: boolean; birth: boolean; tel: boolean; gym: boolean };
  isValid: boolean;
  saveSuccess: boolean;
  errorMsg: string | null;
  isAuthLoading: boolean;
  handleBirthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  onProfileUpdated?: () => void;
}

export function MyPageProfileSection({
  user,
  profileData,
  setProfileData,
  validation,
  isValid,
  saveSuccess: parentSaveSuccess,
  errorMsg: parentErrorMsg,
  isAuthLoading: parentAuthLoading,
  handleBirthChange,
  handleTelChange,
  handleSaveProfile,
  onProfileUpdated,
}: MyPageProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPlayerPhotoToR2, isUploadingToR2 } = useUploadToR2();
  
  const [isSaving, setIsSaving] = useState(false);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // 📜 닉네임 변경 이력 (WHEN, WHO, HOW) State & Fetcher
  const [showNickHistory, setShowNickHistory] = useState(false);
  const [nickHistory, setNickHistory] = useState<{ id: number; nickname: string; createdAt: string; changeReason: string; changedBy: string }[]>([]);
  const [isLoadingNickHistory, setIsLoadingNickHistory] = useState(false);

  const fetchNickHistory = async () => {
    if (!user?.uid) return;
    setIsLoadingNickHistory(true);
    try {
      const data = await authService.getNicknameHistory(user.uid);
      setNickHistory(data);
    } catch (e) {
      console.error('닉네임 이력 로드 실패:', e);
    } finally {
      setIsLoadingNickHistory(false);
    }
  };

  // 프로필 아바타 이미지 업로드 처리
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
    if (!isImage) {
      setLocalError('이미지 파일(PNG, JPG, JPEG, WEBP, HEIC 등)만 선택해 주세요.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setLocalError('프로필 사진 파일 크기는 최대 30MB를 초과할 수 없습니다.');
      return;
    }

    try {
      setLocalError(null);
      const uploadedUrl = await uploadPlayerPhotoToR2(file, 'profile_avatars', true);
      setProfileData((prev) => ({
        ...prev,
        profilePhotoUrl: uploadedUrl,
      }));
      setLocalSuccess('프로필 사진이 업로드되었습니다. [개인정보 수정 완료] 버튼을 눌러 저장하세요.');
    } catch (err: any) {
      setLocalError(err.message || '사진 업로드 중 오류가 발생했습니다.');
    }
  };

  // 프로필 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setLocalSuccess(null);
    setLocalError(null);

    try {
      // 1. 부모 submit 래퍼 호출
      await handleSaveProfile(e);
      // 2. D1 백엔드 API 프로필 저장
      if (user?.uid) {
        await authService.updateProfile(user.uid, profileData);
      }
      setLocalSuccess('선수 신원 정보 및 프로필 설정이 성공적으로 저장되었습니다!');
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err: any) {
      setLocalError(err.message || '프로필 정보 저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPhoto = profileData.profilePhotoUrl || user?.profile?.profilePhotoUrl;

  return (
    <div className="max-w-[600px] mx-auto bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative font-sans">
      
      {/* HEADER TITLE */}
      <h2 className="text-base sm:text-lg font-bold text-accent tracking-tight flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
        <Edit2 className="w-5 h-5" /> 개인 신원 정보 및 프로필 설정
      </h2>

      {(localSuccess || parentSaveSuccess) && (
        <div className="bg-accent/10 border border-accent/30 text-accent px-4 py-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{localSuccess || '선수 개인정보가 성공적으로 업데이트되었습니다!'}</span>
        </div>
      )}

      {(localError || parentErrorMsg) && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0" />
          <span>{localError || parentErrorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 📸 AVATAR PROFILE PHOTO SECTION */}
        <div className="flex flex-col items-center justify-center pb-4 border-b border-white/5">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-accent/40 bg-[#0a0a0a] shadow-xl flex items-center justify-center transition-all group-hover:border-accent">
              {currentPhoto ? (
                <img src={currentPhoto} alt="프로필 아바타" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-white/30" />
              )}
            </div>
            
            {/* Camera Overlay Icon */}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-accent">
              {isUploadingToR2 ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>
            
            <div className="absolute bottom-0 right-0 bg-accent text-black p-1.5 rounded-full border border-black shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingToR2}
            className="mt-3 text-[11px] font-mono text-accent hover:text-white flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>{isUploadingToR2 ? '사진 업로드 중...' : '프로필 사진 직접 변경'}</span>
          </button>
        </div>

        {/* ACCOUNT EMAIL (Read-Only) */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-xs font-mono">
          <span className="text-white/40 block text-[9px] font-bold mb-1 uppercase tracking-wider">가입 계정 이메일</span>
          <div className="flex items-center justify-between">
            <span className="text-white font-bold">{user?.email}</span>
            <span className="text-accent text-[9px] bg-accent/10 border border-accent/30 px-2 py-0.5 rounded uppercase font-semibold">
              {user?.provider}
            </span>
          </div>
        </div>

        {/* 🏷️ NICKNAME (선수 닉네임 + 별도 이력 관리) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] sm:text-xs text-white/50 font-semibold block">
              선수 닉네임 / 활동명
            </label>
            <button
              type="button"
              onClick={() => {
                const next = !showNickHistory;
                setShowNickHistory(next);
                if (next) fetchNickHistory();
              }}
              className="text-[10px] text-accent hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
            >
              📜 변경 이력 {showNickHistory ? '닫기' : '보기'}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={profileData.nickname || ''}
              onChange={(e) => setProfileData({ ...profileData, nickname: e.target.value })}
              disabled={parentAuthLoading || isSaving}
              placeholder="예: 아이언맨, 용인헬창"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/40 font-sans transition-colors"
            />
            <AtSign className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          <p className="text-[10px] text-white/40 mt-1">
            닉네임 변경 시 언제, 누가, 어떻게 변경하였는지 별도 이력 테이블(`user_nickname_history`)에 자동 기록됩니다.
          </p>

          {/* NICKNAME HISTORY AUDIT DRAWER */}
          {showNickHistory && (
            <div className="mt-3 bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 space-y-2 font-mono text-xs">
              <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-2 border-b border-white/5 pb-1">
                📜 닉네임 변경 이력 (Audit Logs)
              </div>
              {isLoadingNickHistory ? (
                <div className="py-4 text-center text-white/40 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>이력 로드 중...</span>
                </div>
              ) : nickHistory.length === 0 ? (
                <div className="py-2 text-center text-white/30 text-[11px]">
                  기록된 닉네임 변경 이력이 없습니다.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nickHistory.map((h) => (
                    <div key={h.id} className="bg-[#161a16] border border-white/5 p-2 rounded text-[11px] flex justify-between items-center">
                      <div>
                        <span className="text-accent font-bold text-xs">@{h.nickname}</span>
                        <span className="text-white/40 text-[9px] block">
                          구분: {h.changeReason} | 주체: {h.changedBy === user?.uid ? '본인' : h.changedBy}
                        </span>
                      </div>
                      <span className="text-white/40 text-[10px]">
                        {h.createdAt ? h.createdAt.replace('T', ' ').substring(0, 16) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAME (실명) */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">
            선수명 (실명) <span className="text-accent">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              disabled={parentAuthLoading || isSaving}
              placeholder="실명 입력"
              className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                validation.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
              }`}
            />
            <UserIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          {validation.name && <p className="text-red-400 text-[10px] mt-1.5">이름은 2자 이상 입력해야 합니다.</p>}
        </div>

        {/* GENDER (성별) */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">성별 <span className="text-accent">*</span></label>
          <div className="grid grid-cols-2 gap-2.5 h-[46px]">
            <button
              type="button"
              onClick={() => setProfileData({ ...profileData, gender: 'm' })}
              disabled={parentAuthLoading || isSaving}
              className={`border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                profileData.gender === 'm'
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              남자
            </button>
            <button
              type="button"
              onClick={() => setProfileData({ ...profileData, gender: 'f' })}
              disabled={parentAuthLoading || isSaving}
              className={`border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                profileData.gender === 'f'
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              여자
            </button>
          </div>
        </div>

        {/* BIRTH (생년월일) */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">생년월일 (8자리) <span className="text-accent">*</span></label>
          <div className="relative">
            <input
              type="text"
              value={profileData.birth}
              onChange={handleBirthChange}
              disabled={parentAuthLoading || isSaving}
              maxLength={10}
              placeholder="YYYY-MM-DD"
              className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                validation.birth ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
              }`}
            />
            <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          {validation.birth && <p className="text-red-400 text-[10px] mt-1.5">YYYY-MM-DD 형식으로 기입하세요.</p>}
        </div>

        {/* PHONE (휴대전화) */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">휴대전화번호 <span className="text-accent">*</span></label>
          <div className="relative">
            <input
              type="tel"
              value={profileData.tel}
              onChange={handleTelChange}
              disabled={parentAuthLoading || isSaving}
              maxLength={13}
              placeholder="010-0000-0000"
              className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                validation.tel ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
              }`}
            />
            <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          {validation.tel && <p className="text-red-400 text-[10px] mt-1.5">연락처 번호 구조가 올바르지 않습니다.</p>}
        </div>

        {/* GYM (소속 체육관) */}
        <div>
          <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">소속 체육관 / 클럽 <span className="text-accent">*</span></label>
          <div className="relative">
            <input
              type="text"
              value={profileData.gym}
              onChange={(e) => setProfileData({ ...profileData, gym: e.target.value })}
              disabled={parentAuthLoading || isSaving}
              placeholder="소속 체육관명 (미소속 시 '무소속' 입력)"
              className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                validation.gym ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
              }`}
            />
            <Building className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
          </div>
          {validation.gym && <p className="text-red-400 text-[10px] mt-1.5">체육관 혹은 무소속이라 기재해주세요.</p>}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={!isValid || parentAuthLoading || isSaving}
          className="w-full bg-accent disabled:bg-white/10 disabled:text-white/20 hover:bg-white text-black font-black py-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200 mt-4 cursor-pointer"
        >
          {parentAuthLoading || isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>프로필 저장 중...</span>
            </>
          ) : (
            '개인정보 및 프로필 수정 완료'
          )}
        </button>

      </form>
    </div>
  );
}
