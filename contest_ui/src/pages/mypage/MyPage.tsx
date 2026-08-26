import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, Lock, ShieldCheck, Camera, Save, KeyRound, 
  CheckCircle2, AlertCircle, Trash2, Award
} from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function MyPage() {
  const { staff, updateProfile, verifyPassword, changePassword, logout, isLoading } = useAuth();

  // 모바일 화면 감지 상태
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. 프로필 정보 폼 상태
  const [name, setName] = useState(staff?.name || '');
  const [position, setPosition] = useState(staff?.position || '');
  const [isReferee, setIsReferee] = useState(Boolean(staff?.isReferee));
  const [refereeGrade, setRefereeGrade] = useState(staff?.refereeGrade || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(staff?.profilePhotoUrl || '');
  const [businessIntro, setBusinessIntro] = useState(staff?.businessIntro || '');
  const [instagramUrl, setInstagramUrl] = useState(staff?.snsLinks?.instagram || '');
  const [youtubeUrl, setYoutubeUrl] = useState(staff?.snsLinks?.youtube || '');

  // 2. 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // 메세지 상태
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 컨펌 모달 상태
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 스태프 세션 정보 변경 시 폼 필드 동기화
  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setPosition(staff.position || '');
      setIsReferee(Boolean(staff.isReferee));
      setRefereeGrade(staff.refereeGrade || '');
      setProfilePhotoUrl(staff.profilePhotoUrl || '');
      setBusinessIntro(staff.businessIntro || '');
      setInstagramUrl(staff.snsLinks?.instagram || '');
      setYoutubeUrl(staff.snsLinks?.youtube || '');
    }
  }, [staff]);

  // 이미지 업로드 처리 (1MB 제한)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setConfirmConfig({
          isOpen: true,
          title: '용량 초과',
          message: '프로필 사진은 1MB 이하의 이미지만 업로드할 수 있습니다.',
          confirmText: '확인',
          type: 'danger',
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 정보 저장
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: '이름을 입력해주세요.' });
      return;
    }

    const snsLinks = {
      instagram: instagramUrl.trim() || undefined,
      youtube: youtubeUrl.trim() || undefined
    };

    setConfirmConfig({
      isOpen: true,
      title: '프로필 정보 수정',
      message: '입력하신 프로필 정보를 저장하시겠습니까?',
      confirmText: '저장',
      cancelText: '취소',
      type: 'success',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));

        const success = await updateProfile(
          profilePhotoUrl || undefined,
          businessIntro.trim() || undefined,
          snsLinks,
          name.trim(),
          position.trim() || undefined,
          isReferee,
          refereeGrade.trim() || undefined
        );

        if (success) {
          setConfirmConfig({
            isOpen: true,
            title: '저장 완료',
            message: '프로필 정보가 성공적으로 수정되었습니다.',
            confirmText: '확인',
            type: 'success',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        } else {
          setProfileMsg({ type: 'error', text: '프로필 정보 수정 중 오류가 발생했습니다.' });
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // 1단계: 현재 비밀번호 검증
  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: '현재 비밀번호를 입력해주세요.' });
      return;
    }

    const verified = await verifyPassword(currentPassword);
    if (verified) {
      setIsPasswordVerified(true);
      setPasswordMsg({ type: 'success', text: '현재 비밀번호가 확인되었습니다. 새 비밀번호를 입력해주세요.' });
    } else {
      setIsPasswordVerified(false);
      setPasswordMsg({ type: 'error', text: '현재 비밀번호가 일치하지 않습니다.' });
    }
  };

  // 2단계: 새 비밀번호 변경
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: '새 비밀번호는 최소 8자 이상이어야 합니다.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: '비밀번호 변경',
      message: '비밀번호를 변경하시겠습니까?\n변경 후 새로운 비밀번호로 다시 로그인해야 합니다.',
      confirmText: '변경',
      cancelText: '취소',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));

        const success = await changePassword(newPassword);
        if (success) {
          setConfirmConfig({
            isOpen: true,
            title: '변경 완료',
            message: '비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해 주세요.',
            confirmText: '확인',
            type: 'success',
            onConfirm: async () => {
              setConfirmConfig(prev => ({ ...prev, isOpen: false }));
              await logout();
            }
          });
        } else {
          setPasswordMsg({ type: 'error', text: '비밀번호 변경 처리 중 오류가 발생했습니다.' });
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. 상단 프로필 헤더 카드 */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-divider)',
        borderRadius: '16px',
        padding: isMobile ? '20px 16px' : '28px 32px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* 프로필 이미지 미리보기 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '2px solid var(--color-accent)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)'
          }}>
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} />
            )}
          </div>
          <label style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-inverted)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
          }} title="프로필 사진 변경">
            <Camera size={16} />
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* 기본 인적사항 명함 */}
        <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>
              {staff?.name || '임원'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              (<Lock size={12} /> {staff?.username})
            </span>
            <span className="badge success" style={{ fontSize: '12px', padding: '4px 10px' }}>
              <ShieldCheck size={12} />
              {staff?.role === 'admin' ? '최고 관리자' : '협회 관계자'}
            </span>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--color-accent)', fontWeight: '600', marginTop: '2px' }}>
            {staff?.position || '직책 미설정'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            {isReferee ? (
              <span className="badge warning" style={{ fontSize: '12px', padding: '4px 10px' }}>
                <Award size={12} />
                공인 심판 ({refereeGrade || '급수 미기입'})
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                심판 자격 미보유
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. 상세 수정 폼 및 비밀번호 변경 파트 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '24px'
      }}>

        {/* 좌측: 프로필 기본 정보 및 추가 소개 수정 */}
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-divider)',
          borderRadius: '16px',
          padding: isMobile ? '20px 16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-divider)', paddingBottom: '14px' }}>
            <User size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              프로필 정보 편집
            </h3>
          </div>

          {profileMsg && (
            <div className={`alert-message ${profileMsg.type}`} style={{ margin: 0 }}>
              {profileMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <div>{profileMsg.text}</div>
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 아이디 (읽기 전용) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">아이디 (username)</label>
              <input
                type="text"
                className="form-input"
                value={staff?.username || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'rgba(0,0,0,0.2)' }}
              />
            </div>

            {/* 성명 */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">성명 (이름)</label>
              <input
                type="text"
                className="form-input"
                placeholder="성명을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* 직책 */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">직책 / 직위</label>
              <input
                type="text"
                className="form-input"
                placeholder="예: 이사, 심판위원장, 스태프"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>

            {/* 심판 자격 보유 여부 및 급수 */}
            <div style={{ border: '1px solid var(--color-divider)', borderRadius: '8px', padding: '12px 14px', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={isReferee}
                  onChange={(e) => setIsReferee(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                />
                공인 심판 자격 보유
              </label>

              {isReferee && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>심판 자격 급수</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 1급, 2급, 국제심판"
                    value={refereeGrade}
                    onChange={(e) => setRefereeGrade(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 프로필 이미지 삭제 버튼 */}
            {profilePhotoUrl && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-logout"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '12px', gap: '4px' }}
                  onClick={() => setProfilePhotoUrl('')}
                >
                  <Trash2 size={12} />
                  사진 삭제
                </button>
              </div>
            )}

            {/* 사업장 / 약력 소개 */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">약력 및 사업체 소개</label>
              <textarea
                className="form-input"
                style={{ height: '80px', resize: 'none', fontFamily: 'inherit' }}
                placeholder="소속 헬스장 또는 협회 이력 소개글 작성"
                value={businessIntro}
                onChange={(e) => setBusinessIntro(e.target.value)}
              />
            </div>

            {/* SNS 링크 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="form-label">소셜 미디어 (SNS)</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                <input
                  type="url"
                  className="form-input"
                  placeholder="인스타그램 URL (https://instagram.com/your_id)"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><polygon points="10 15 15 12 10 9 10 15"/></svg>
                <input
                  type="url"
                  className="form-input"
                  placeholder="유튜브 채널 URL (https://youtube.com/@channel)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: '8px', justifyContent: 'center' }}
              disabled={isLoading}
            >
              <Save size={16} />
              프로필 저장하기
            </button>
          </form>
        </div>

        {/* 우측: 비밀번호 확인 및 변경 마법사 */}
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-divider)',
          borderRadius: '16px',
          padding: isMobile ? '20px 16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-divider)', paddingBottom: '14px' }}>
            <KeyRound size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              비밀번호 설정 및 변경
            </h3>
          </div>

          {passwordMsg && (
            <div className={`alert-message ${passwordMsg.type}`} style={{ margin: 0 }}>
              {passwordMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <div>{passwordMsg.text}</div>
            </div>
          )}

          {/* 1단계: 현재 비밀번호 검증 */}
          {!isPasswordVerified ? (
            <form onSubmit={handleVerifyCurrentPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                비밀번호를 변경하려면 먼저 보안을 위해 현재 비밀번호를 입력하여 본인임을 인증해 주세요.
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">현재 비밀번호</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="현재 사용 중인 비밀번호 입력"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-secondary"
                style={{ justifyContent: 'center', height: '42px', marginTop: '8px' }}
                disabled={isLoading || !currentPassword}
              >
                <Lock size={16} />
                현재 비밀번호 확인
              </button>
            </form>
          ) : (
            /* 2단계: 새 비밀번호 변경 폼 */
            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={14} />
                본인 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">새 비밀번호 (최소 8자)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="새로운 비밀번호 입력"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">새 비밀번호 확인</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="새로운 비밀번호 다시 입력"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setIsPasswordVerified(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordMsg(null);
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={isLoading || !newPassword || !confirmNewPassword}
                >
                  <KeyRound size={16} />
                  비밀번호 변경
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 커스텀 알림/확인 모달 */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
      />
    </div>
  );
}
