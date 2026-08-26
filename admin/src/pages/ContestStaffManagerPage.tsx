import React, { useEffect, useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { ContestStaff, StaffStatus } from '../types/auth';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  KeyRound, 
  Edit3, 
  Trash2, 
  Check, 
  Copy, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  RefreshCw,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function ContestStaffManagerPage() {
  const [staffs, setStaffs] = useState<ContestStaff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // 모달 상태
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ContestStaff | null>(null);

  // 폼 입력 데이터 상태
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    phone: '',
    email: '',
    position: '',
    role: 'staff' as 'staff' | 'admin',
    status: 'active' as StaffStatus,
    isReferee: false,
    refereeGrade: '',
    businessIntro: '',
  });

  // 비밀번호 초기화 모달 상태
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState<ContestStaff | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [generatedTempPass, setGeneratedTempPass] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // 삭제 확인 모달
  const [deleteTargetStaff, setDeleteTargetStaff] = useState<ContestStaff | null>(null);

  // 목록 불러오기
  const loadStaffs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminService.fetchContestStaffs({
        keyword: keyword.trim() || undefined,
        status: statusFilter,
        role: roleFilter,
      });
      if (res.staffs) {
        setStaffs(res.staffs);
      } else {
        setStaffs([]);
      }
    } catch (err: any) {
      console.error('스태프 목록 조회 오류:', err);
      setErrorMsg(err.message || '스태프 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [keyword, statusFilter, roleFilter]);

  useEffect(() => {
    loadStaffs();
  }, [loadStaffs]);

  // 검색 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStaffs();
  };

  // 전화번호 자동 포맷터 (010-XXXX-XXXX)
  const formatPhoneNumber = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
  };

  // 무작위 임시 비밀번호 생성기
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // 상태 변경 토글 스위치
  const handleToggleStatus = async (staff: ContestStaff) => {
    const nextStatus: StaffStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await adminService.updateContestStaffStatus(staff.uid, nextStatus);
      setSuccessMsg(`${staff.name} 계정이 ${nextStatus === 'active' ? '활성화' : '비활성화'}되었습니다.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStaffs();
    } catch (err: any) {
      setErrorMsg(err.message || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 등록/수정 모달 열기
  const openFormModal = (staff?: ContestStaff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        username: staff.username,
        name: staff.name,
        password: '',
        phone: staff.phone || '',
        email: staff.email || '',
        position: staff.position || '',
        role: staff.role || 'staff',
        status: staff.status || 'active',
        isReferee: !!staff.isReferee,
        refereeGrade: staff.refereeGrade || '',
        businessIntro: staff.businessIntro || '',
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        name: '',
        password: '',
        phone: '',
        email: '',
        position: '',
        role: 'staff',
        status: 'active',
        isReferee: false,
        refereeGrade: '',
        businessIntro: '',
      });
    }
    setIsFormModalOpen(true);
  };

  // 등록/수정 제출
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      alert('성명을 입력해 주세요.');
      return;
    }

    if (!editingStaff && !formData.username.trim()) {
      alert('아이디를 입력해 주세요.');
      return;
    }

    if (!editingStaff && !formData.password.trim()) {
      alert('비밀번호를 입력해 주세요.');
      return;
    }

    try {
      if (editingStaff) {
        // 수정
        const payload: any = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          position: formData.position || null,
          role: formData.role,
          status: formData.status,
          isReferee: formData.isReferee,
          refereeGrade: formData.isReferee ? formData.refereeGrade : null,
          businessIntro: formData.businessIntro || null,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        await adminService.updateContestStaff(editingStaff.uid, payload);
        setSuccessMsg(`${formData.name} 스태프 정보가 성공적으로 수정되었습니다.`);
      } else {
        // 신규 등록
        await adminService.createContestStaff({
          username: formData.username.trim(),
          name: formData.name.trim(),
          password: formData.password.trim(),
          phone: formData.phone,
          email: formData.email || null,
          position: formData.position || null,
          role: formData.role,
          status: formData.status,
          isReferee: formData.isReferee,
          refereeGrade: formData.isReferee ? formData.refereeGrade : null,
          businessIntro: formData.businessIntro || null,
        });
        setSuccessMsg(`신규 스태프 ${formData.name} 계정이 생성되었습니다.`);
      }

      setIsFormModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStaffs();
    } catch (err: any) {
      setErrorMsg(err.message || '저장 중 오류가 발생했습니다.');
    }
  };

  // 비밀번호 초기화 모달 열기
  const openResetModal = (staff: ContestStaff) => {
    setResetTargetStaff(staff);
    const newPass = generateRandomPassword();
    setCustomPassword(newPass);
    setGeneratedTempPass(null);
    setIsCopied(false);
    setIsResetModalOpen(true);
  };

  // 비밀번호 초기화 실행
  const handleResetPassword = async () => {
    if (!resetTargetStaff) return;
    try {
      const passToUse = customPassword.trim() || generateRandomPassword();
      const res = await adminService.resetContestStaffPassword(resetTargetStaff.uid, passToUse);
      setGeneratedTempPass(res.tempPassword || passToUse);
    } catch (err: any) {
      alert(err.message || '비밀번호 초기화 실패');
    }
  };

  // 비밀번호 복사
  const handleCopyPassword = () => {
    if (generatedTempPass) {
      navigator.clipboard.writeText(generatedTempPass);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // 삭제 실행
  const handleDeleteStaff = async () => {
    if (!deleteTargetStaff) return;
    try {
      await adminService.deleteContestStaff(deleteTargetStaff.uid);
      setSuccessMsg(`${deleteTargetStaff.name} 계정이 삭제되었습니다.`);
      setDeleteTargetStaff(null);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStaffs();
    } catch (err: any) {
      setErrorMsg(err.message || '계정 삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* 헤더 안내 영역 */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-title-group">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} style={{ color: 'var(--color-accent-dark)' }} />
            <span>대회 관계자 계정 관리</span>
          </h1>
          <p className="page-subtitle">
            `contest_ui`에 접근하는 협회 임원, 심판 및 스태프 계정을 관리하고 권한과 승인 상태를 제어합니다.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => openFormModal()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: '600' }}
        >
          <UserPlus size={18} />
          <span>+ 신규 관계자 등록</span>
        </button>
      </div>

      {/* 성공 / 알림 메시지 */}
      {successMsg && (
        <div className="alert-message alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-message alert-error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 검색 및 필터 컨트롤 바 */}
      <div className="panel" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
            {/* 키워드 검색 */}
            <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="이름, 아이디, 연락처 검색..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* 상태 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <select
                className="form-control"
                style={{ width: '130px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">상태: 전체</option>
                <option value="active">활성 (승인)</option>
                <option value="inactive">비활성 (차단)</option>
                <option value="pending">승인 대기</option>
              </select>
            </div>

            {/* 권한 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                className="form-control"
                style={{ width: '130px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">권한: 전체</option>
                <option value="staff">일반 스태프</option>
                <option value="admin">관리자</option>
              </select>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>조회</span>
            </button>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            총 <strong style={{ color: 'var(--color-accent-dark)' }}>{staffs.length}</strong> 명의 관계자
          </div>
        </form>
      </div>

      {/* 스태프 목록 테이블 */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
            <span>관계자 목록을 불러오는 중입니다...</span>
          </div>
        ) : staffs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
            <span>등록된 대회 관계자 계정이 없거나 검색 결과가 없습니다.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
                  <th style={{ padding: '14px 16px' }}>계정 / 성명</th>
                  <th style={{ padding: '14px 16px' }}>직책 / 권한</th>
                  <th style={{ padding: '14px 16px' }}>연락처 / 이메일</th>
                  <th style={{ padding: '14px 16px' }}>심판 자격</th>
                  <th style={{ padding: '14px 16px' }}>계정 상태</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>관리 기능</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((staff) => {
                  const isActive = staff.status === 'active';
                  const isPending = staff.status === 'pending';
                  return (
                    <tr key={staff.uid} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      {/* 계정 / 성명 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#475569',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {staff.profilePhotoUrl ? (
                              <img src={staff.profilePhotoUrl} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              staff.name.slice(0, 1) || 'S'
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{staff.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>@{staff.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* 직책 / 권한 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{staff.position || '스태프'}</div>
                        <div style={{ fontSize: '12px', color: staff.role === 'admin' ? '#2563eb' : '#64748b' }}>
                          {staff.role === 'admin' ? '🛡️ 최고관리자' : '일반 스태프'}
                        </div>
                      </td>

                      {/* 연락처 / 이메일 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#1e293b' }}>{staff.phone || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{staff.email || '-'}</div>
                      </td>

                      {/* 심판 자격 */}
                      <td style={{ padding: '14px 16px' }}>
                        {staff.isReferee ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: '#eff6ff', 
                            color: '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <Award size={13} />
                            공인 {staff.refereeGrade || '심판'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>미보유</span>
                        )}
                      </td>

                      {/* 계정 상태 & 토글 스위치 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* 상태 배지 */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: isActive ? '#ecfdf5' : isPending ? '#fffbeb' : '#fef2f2',
                            color: isActive ? '#059669' : isPending ? '#d97706' : '#dc2626',
                            border: `1px solid ${isActive ? '#a7f3d0' : isPending ? '#fde68a' : '#fecaca'}`
                          }}>
                            {isActive ? '● 활성 (승인)' : isPending ? '▲ 승인 대기' : '✕ 비활성 (차단)'}
                          </span>

                          {/* 토글 스위치 */}
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            title={isActive ? '계정 차단하기' : '계정 승인/활성화하기'}
                            style={{
                              width: '44px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: isActive ? '#10b981' : '#cbd5e1',
                              position: 'relative',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              padding: '2px'
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              transform: isActive ? 'translateX(20px)' : 'translateX(0px)',
                              transition: 'transform 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isActive ? <Unlock size={10} style={{ color: '#10b981' }} /> : <Lock size={10} style={{ color: '#64748b' }} />}
                            </div>
                          </button>
                        </div>
                      </td>

                      {/* 관리 기능 */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => openFormModal(staff)}
                            style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit3 size={13} />
                            <span>수정</span>
                          </button>

                          <button
                            className="btn"
                            onClick={() => openResetModal(staff)}
                            style={{ 
                              padding: '5px 10px', 
                              fontSize: '12px', 
                              backgroundColor: '#f1f5f9', 
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px' 
                            }}
                          >
                            <KeyRound size={13} style={{ color: '#d97706' }} />
                            <span>비번초기화</span>
                          </button>

                          <button
                            className="btn"
                            onClick={() => setDeleteTargetStaff(staff)}
                            style={{ 
                              padding: '5px 10px', 
                              fontSize: '12px', 
                              backgroundColor: '#fef2f2', 
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px' 
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. 신규 등록 / 수정 모달 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isFormModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-accent-dark)' }} />
                <span>{editingStaff ? '대회 관계자 정보 수정' : '신규 대회 관계자 등록'}</span>
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* 아이디 */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>아이디 (Username) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="로그인 아이디 입력"
                    disabled={!!editingStaff}
                    required
                  />
                </div>

                {/* 성명 */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>성명 (Name) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="홍길동"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '600' }}>
                  비밀번호 (Password) {editingStaff ? '(변경 시에만 입력)' : '*'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingStaff ? '기존 비밀번호 유지' : '비밀번호 입력'}
                  required={!editingStaff}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* 연락처 */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>연락처 (Phone) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="010-0000-0000"
                    required
                  />
                </div>

                {/* 이메일 */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>이메일 (Email)</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@example.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* 직책 */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>직책 / 소속 (Position)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="예: 경기이사, 심판위원장, 계측스태프"
                  />
                </div>

                {/* 권한 */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>시스템 권한 (Role)</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'staff' | 'admin' })}
                  >
                    <option value="staff">일반 스태프 (Contest UI 접근)</option>
                    <option value="admin">최고 관리자 (Admin UI + Contest UI)</option>
                  </select>
                </div>
              </div>

              {/* 계정 상태 */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '600' }}>계정 상태 (Status)</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                    />
                    <span>활성 (정상 승인)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    />
                    <span>비활성 (로그인 차단)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      value="pending"
                      checked={formData.status === 'pending'}
                      onChange={() => setFormData({ ...formData, status: 'pending' })}
                    />
                    <span>승인 대기</span>
                  </label>
                </div>
              </div>

              {/* 심판 자격 여부 */}
              <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={formData.isReferee}
                    onChange={(e) => setFormData({ ...formData, isReferee: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>공인 심판 자격증 보유자</span>
                </label>

                {formData.isReferee && (
                  <div style={{ marginTop: '12px' }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>심판 급수 (Grade)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.refereeGrade}
                      onChange={(e) => setFormData({ ...formData, refereeGrade: e.target.value })}
                      placeholder="예: 공인 1급, 2급, 국제 3급"
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? '수정사항 저장' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. 비밀번호 초기화 모달 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isResetModalOpen && resetTargetStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: '#d97706' }} />
                <span>비밀번호 임시 초기화</span>
              </h3>
              <button onClick={() => setIsResetModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.5' }}>
              <strong>{resetTargetStaff.name}</strong> (아이디: <code>{resetTargetStaff.username}</code>) 계정의 비밀번호를 임시 비밀번호로 초기화합니다.
            </p>

            {!generatedTempPass ? (
              <div>
                <label className="form-label" style={{ fontWeight: '600' }}>임시 비밀번호 설정</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="임시 비밀번호 입력"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCustomPassword(generateRandomPassword())}
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    🎲 무작위 생성
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsResetModalOpen(false)}>
                    취소
                  </button>
                  <button className="btn btn-primary" onClick={handleResetPassword} style={{ backgroundColor: '#d97706', borderColor: '#d97706' }}>
                    비밀번호 초기화 실행
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  border: '1px dashed #f59e0b',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>
                    초기화된 임시 비밀번호
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#78350f', letterSpacing: '2px', fontFamily: 'monospace' }}>
                    {generatedTempPass}
                  </div>
                </div>

                <button
                  className="btn"
                  onClick={handleCopyPassword}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: isCopied ? '#10b981' : '#2563eb',
                    color: '#ffffff',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{isCopied ? '클립보드에 복사되었습니다!' : '📋 비밀번호 복사하기'}</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setIsResetModalOpen(false)}
                  style={{ width: '100%' }}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. 삭제 확인 모달 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {deleteTargetStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626', marginBottom: '14px' }}>
              <AlertTriangle size={28} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>스태프 계정 삭제 확인</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
              정말로 <strong>{deleteTargetStaff.name}</strong> (<code>@{deleteTargetStaff.username}</code>) 계정을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTargetStaff(null)}>
                취소
              </button>
              <button className="btn" onClick={handleDeleteStaff} style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
