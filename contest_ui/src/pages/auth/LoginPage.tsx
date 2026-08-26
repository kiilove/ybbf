import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle, CheckCircle, Camera, Trash2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, checkUsername, error, isLoading, signupSuccess, isAuthenticated, clearError, resetSignupSuccess } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('스태프'); // Default select option
  const [customPosition, setCustomPosition] = useState(''); // Text for custom position
  const [isReferee, setIsReferee] = useState(0); // 0: 미보유, 1: 보유
  const [refereeGrade, setRefereeGrade] = useState(''); // Text for referee grade
  const [validationError, setValidationError] = useState<string | null>(null);

  // Username duplicate check states
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Multi-step signup onboarding wizard states
  const [signupStage, setSignupStage] = useState<'form' | 'additional_prompt' | 'additional_form' | 'success'>('form');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [businessIntro, setBusinessIntro] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isSavingAdditional, setIsSavingAdditional] = useState(false);

  // Phone number automatic masking formatter (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length < 4) return clean;
    if (clean.length < 8) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
  };

  // Clear errors and form fields when switching modes
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearError();
    resetSignupSuccess();
    setValidationError(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setEmail('');
    setPosition('스태프');
    setCustomPosition('');
    setIsReferee(0);
    setRefereeGrade('');
    setIsUsernameChecked(false);
    setIsUsernameAvailable(null);

    // Reset wizard states
    setSignupStage('form');
    setProfilePhotoUrl('');
    setBusinessIntro('');
    setInstagramUrl('');
    setYoutubeUrl('');
    setIsSavingAdditional(false);
  };

  const handleCheckUsername = async () => {
    setValidationError(null);
    clearError();

    const target = username.trim();
    if (!target) {
      setValidationError('아이디를 입력해주세요.');
      return;
    }

    setIsCheckingUsername(true);
    try {
      const available = await checkUsername(target);
      setIsUsernameChecked(true);
      setIsUsernameAvailable(available);
    } catch (err) {
      setIsUsernameChecked(false);
      setIsUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert('프로필 사진은 1MB 이하의 이미지만 업로드 가능합니다.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkipAdditional = () => {
    // Clear username and proceed to final success
    setValidationError(null);
    clearError();
    setUsername('');
    setSignupStage('success');
  };

  const handleSaveAdditional = async () => {
    setIsSavingAdditional(true);
    setValidationError(null);
    clearError();
    try {
      const snsLinks = {
        instagram: instagramUrl.trim() || undefined,
        youtube: youtubeUrl.trim() || undefined
      };
      await authService.saveAdditionalInfo(
        username,
        profilePhotoUrl || undefined,
        businessIntro.trim() || undefined,
        snsLinks
      );

      // Only advance stage and clear state on success
      setSignupStage('success');
      setUsername('');
      setProfilePhotoUrl('');
      setBusinessIntro('');
      setInstagramUrl('');
      setYoutubeUrl('');
    } catch (err: unknown) {
      console.error('추가 정보 저장 오류:', err);
      const errMsg = err instanceof Error ? err.message : '추가 소개 정보 저장 중 오류가 발생했습니다.';
      setValidationError(errMsg);
    } finally {
      setIsSavingAdditional(false);
    }
  };

  const handleCompleteFlow = () => {
    setSignupStage('form');
    setIsLoginMode(true);
    resetSignupSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Validation
    if (!username.trim()) {
      setValidationError('아이디를 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setValidationError('비밀번호를 입력해주세요.');
      return;
    }

    if (isLoginMode) {
      await login(username.trim(), password);
    } else {
      // Signup Mode Validation
      if (!isUsernameChecked) {
        setValidationError('아이디 중복 확인이 필요합니다.');
        return;
      }
      if (!isUsernameAvailable) {
        setValidationError('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
        return;
      }
      if (password.length < 8) {
        setValidationError('비밀번호는 최소 8글자 이상 입력해주세요.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
      if (!name.trim()) {
        setValidationError('이름을 입력해주세요.');
        return;
      }
      if (!phone.trim()) {
        setValidationError('전화번호를 입력해주세요.');
        return;
      }
      if (!email.trim()) {
        setValidationError('이메일을 입력해주세요.');
        return;
      }
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setValidationError('올바른 이메일 형식을 입력해주세요.');
        return;
      }

      // Custom Position Validation
      if (position === '직접입력' && !customPosition.trim()) {
        setValidationError('직위를 직접 입력해주세요.');
        return;
      }

      // Referee Grade Validation
      if (isReferee === 1 && !refereeGrade.trim()) {
        setValidationError('심판 자격증의 급수/명칭을 입력해주세요.');
        return;
      }

      const finalPosition = position === '직접입력' ? customPosition.trim() : position;
      const finalRefereeGrade = isReferee === 1 ? refereeGrade.trim() : undefined;

      const success = await signup(
        username.trim(),
        password,
        name.trim(),
        phone.trim(),
        email.trim(),
        finalPosition,
        isReferee,
        finalRefereeGrade
      );
      if (success) {
        // Clear other fields but keep username for next steps!
        setPassword('');
        setConfirmPassword('');
        setName('');
        setPhone('');
        setEmail('');
        setPosition('스태프');
        setCustomPosition('');
        setIsReferee(0);
        setRefereeGrade('');
        setIsUsernameChecked(false);
        setIsUsernameAvailable(null);

        // Transition to additional info prompt
        setSignupStage('additional_prompt');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: isLoginMode ? '440px' : (signupStage === 'form' || signupStage === 'additional_form' ? '760px' : '520px'), transition: 'max-width 0.3s ease-in-out' }}>
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            padding: '8px 16px', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 242, 254, 0.15)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="/logo.png"
              alt="용인특례시보디빌딩협회 로고"
              style={{
                height: '70px',
                objectFit: 'contain'
              }}
            />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginTop: '4px' }}>
            <span>용인특례시보디빌딩협회</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            임원시스템
          </div>
        </div>

        {/* Global errors / validations */}
        {(isLoginMode || signupStage === 'form' || signupStage === 'additional_form') && (validationError || error) && (
          <div className="alert-message error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{validationError || error}</div>
          </div>
        )}

        {/* Signup Success Alert (Only in Login Mode) */}
        {signupSuccess && isLoginMode && (
          <div className="alert-message success">
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>가입 신청 완료!</strong><br />
              관리자가 회원 정보를 검토하고 승인한 후에 로그인이 가능합니다.
            </div>
          </div>
        )}

        {isLoginMode ? (
          /* ============================================================
             1. 로그인 화면 (Login Mode)
             ============================================================ */
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">아이디</label>
              <input
                type="text"
                className="form-input"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                type="password"
                className="form-input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? (
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
              ) : (
                <>
                  <LogIn size={18} />
                  로그인
                </>
              )}
            </button>
          </form>
        ) : (
          /* ============================================================
             2. 회원가입 단계별 화면 (Signup Mode Wizard)
             ============================================================ */
          <>
            {signupStage === 'form' && (
              /* [A] 기본 인적사항 입력 폼 */
              <form onSubmit={handleSubmit}>
                <div className="signup-form-grid">
                  {/* Row 1: ID & Name */}
                  <div className="form-group">
                    <label className="form-label">아이디</label>
                    <div className="input-row">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="사용할 아이디"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setIsUsernameChecked(false);
                          setIsUsernameAvailable(null);
                        }}
                        disabled={isLoading || isCheckingUsername}
                        autoComplete="username"
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCheckUsername}
                        disabled={isLoading || isCheckingUsername || !username.trim()}
                      >
                        {isCheckingUsername ? '확인 중...' : '중복 확인'}
                      </button>
                    </div>
                    {isUsernameChecked && isUsernameAvailable === true && (
                      <span className="validation-msg success">사용 가능한 아이디입니다.</span>
                    )}
                    {isUsernameChecked && isUsernameAvailable === false && (
                      <span className="validation-msg error">이미 사용 중인 아이디입니다.</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">이름</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="본명을 입력하세요"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>

                  {/* Row 2: Password & Confirm Password */}
                  <div className="form-group">
                    <label className="form-label">비밀번호</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="비밀번호 (8자 이상)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">비밀번호 확인</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="비밀번호 확인"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Row 3: Phone & Email */}
                  <div className="form-group">
                    <label className="form-label">전화번호</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: 010-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      disabled={isLoading}
                      maxLength={13}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">이메일</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="예: officer@ybbf.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>

                  {/* Row 4: Position & Referee Status */}
                  <div className="form-group">
                    <label className="form-label">협회 임원 직위</label>
                    <select
                      className="form-select"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="회장">회장</option>
                      <option value="부회장">부회장</option>
                      <option value="사무국장">사무국장</option>
                      <option value="사무차장">사무차장</option>
                      <option value="고문">고문</option>
                      <option value="이사">이사</option>
                      <option value="스태프">스태프</option>
                      <option value="직접입력">직접입력</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">심판 자격 보유 여부</label>
                    <select
                      className="form-select"
                      value={isReferee}
                      onChange={(e) => setIsReferee(Number(e.target.value))}
                      disabled={isLoading}
                    >
                      <option value={0}>자격 미보유</option>
                      <option value={1}>심판 자격증 보유</option>
                    </select>
                  </div>

                  {/* Row 5: Conditional Inputs */}
                  {position === '직접입력' ? (
                    <div className="form-group" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <label className="form-label">직위 직접 입력</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="예: 감사, 홍보위원장 등"
                        value={customPosition}
                        onChange={(e) => setCustomPosition(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="pc-placeholder"></div>
                  )}

                  {isReferee === 1 && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <label className="form-label">심판 자격 등급</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="예: 1급, 2급, 국제심판 등"
                        value={refereeGrade}
                        onChange={(e) => setRefereeGrade(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="auth-button" disabled={isLoading} style={{ marginTop: '20px' }}>
                  {isLoading ? (
                    <svg className="spinner" viewBox="0 0 50 50">
                      <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      임원 등록 신청
                    </>
                  )}
                </button>
              </form>
            )}

            {signupStage === 'additional_prompt' && (
              /* [B] 추가 프로필 정보 입력 여부 질의 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.4s ease-out' }}>
                <CheckCircle size={56} className="text-accent" style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 2px 8px rgba(0, 242, 254, 0.2))' }} />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                    가입 신청 접수 완료
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    협회 임원 기본 정보 등록이 완료되었습니다.
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--color-divider)',
                  borderRadius: '12px',
                  padding: '20px',
                  width: '100%',
                  textAlign: 'left',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    💡 선택 입력 안내
                  </div>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                    공식 홈페이지(ybbf.org) 임원 소개란에 노출하여 체육관 및 비즈니스를 홍보할 수 있는 <strong>프로필 사진, 소개글, 소셜 미디어 링크</strong>를 지금 추가로 등록하시겠습니까?
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '12px', lineHeight: '1.4' }}>
                    * 이 정보는 가입 승인 후 마이페이지에서 언제든지 등록 및 수정이 가능하며, 지금 입력을 건너뛰실 수도 있습니다.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="auth-button"
                    style={{ flex: 1, backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                    onClick={handleSkipAdditional}
                  >
                    건너뛰기
                  </button>
                  <button
                    type="button"
                    className="auth-button"
                    style={{ flex: 1 }}
                    onClick={() => setSignupStage('additional_form')}
                  >
                    입력하기
                  </button>
                </div>
              </div>
            )}

            {signupStage === 'additional_form' && (
              /* [C] 추가 프로필 정보 입력 폼 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease-out' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>임원 추가 소개 정보 입력</div>
                
                <div className="signup-form-grid">
                  {/* Profile Photo Selector (spans 2 columns on PC) */}
                  <div className="form-group span-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(11, 15, 25, 0.8)',
                      border: '2px dashed var(--color-divider)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Camera size={32} style={{ color: 'var(--color-text-light)' }} />
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'inline-block' }}>
                        사진 업로드 (1MB 이하)
                        <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} disabled={isSavingAdditional} />
                      </label>
                      {profilePhotoUrl && (
                        <button 
                          type="button" 
                          onClick={() => setProfilePhotoUrl('')} 
                          className="btn-secondary"
                          style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}
                          disabled={isSavingAdditional}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Business Intro (spans 2 columns on PC) */}
                  <div className="form-group span-2">
                    <label className="form-label">운영중인 사업체 / 주요 이력 소개</label>
                    <textarea
                      className="form-input"
                      style={{ height: '80px', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
                      placeholder="예: 용인 특례시 소재 피트니스 클럽 운영 중, 피트니스 트레이너 양성 등 약력을 간략히 적어주세요."
                      value={businessIntro}
                      onChange={(e) => setBusinessIntro(e.target.value)}
                      disabled={isSavingAdditional}
                    />
                  </div>

                  {/* Instagram URL */}
                  <div className="form-group">
                    <label className="form-label">인스타그램 주소</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: https://instagram.com/account"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      disabled={isSavingAdditional}
                    />
                  </div>

                  {/* YouTube URL */}
                  <div className="form-group">
                    <label className="form-label">유튜브 주소</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: https://youtube.com/@channel"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={isSavingAdditional}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="auth-button"
                    style={{ flex: 1, backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                    onClick={handleSkipAdditional}
                    disabled={isSavingAdditional}
                  >
                    건너뛰기
                  </button>
                  <button
                    type="button"
                    className="auth-button"
                    style={{ flex: 1 }}
                    onClick={handleSaveAdditional}
                    disabled={isSavingAdditional}
                  >
                    {isSavingAdditional ? '저장 중...' : '저장 및 완료'}
                  </button>
                </div>
              </div>
            )}

            {signupStage === 'success' && (
              /* [D] 최종 가입 신청 접수 완료 안내 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center', padding: '30px 0', animation: 'fadeIn 0.4s ease-out' }}>
                <CheckCircle size={64} className="text-accent" style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 2px 8px rgba(0, 242, 254, 0.2))' }} />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                    가입 신청 최종 완료
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    협회 임원 가입 신청 접수가 최종 완료되었습니다.
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--color-divider)',
                  borderRadius: '12px',
                  padding: '20px',
                  width: '100%',
                  textAlign: 'left',
                  boxSizing: 'border-box'
                }}>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                    협회 최고 관리자가 임원 임명 및 제출하신 가입 사항을 면밀히 검토한 후 계정을 최종 승인하게 됩니다.
                  </p>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '13.5px', lineHeight: '1.6', marginTop: '10px', marginBottom: 0 }}>
                    계정 승인이 완료되면 가입하신 아이디와 비밀번호로 로그인하여 시스템을 정상적으로 이용하실 수 있습니다.
                  </p>
                </div>

                <button
                  type="button"
                  className="auth-button"
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={handleCompleteFlow}
                >
                  로그인 화면으로 이동
                </button>
              </div>
            )}
          </>
        )}

        {(isLoginMode || signupStage === 'form') && (
          <div className="auth-footer">
            {isLoginMode ? (
              <>
                아직 관계자 계정이 없으신가요?
                <span className="auth-link" onClick={toggleMode}>
                  가입 신청하기
                </span>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?
                <span className="auth-link" onClick={toggleMode}>
                  로그인하기
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
