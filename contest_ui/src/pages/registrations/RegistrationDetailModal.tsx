import { X, FileText, Calendar, Phone, Mail, Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Registration } from '../../services/contestService';

interface DetailModalProps {
  registration: Registration | null;
  onClose: () => void;
}

export default function RegistrationDetailModal({ registration, onClose }: DetailModalProps) {
  if (!registration) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} className="text-accent" style={{ color: 'var(--color-accent)' }} />
            <span>신청서 상세 내역</span>
            <span className="hide-on-mobile" style={{ fontSize: '12px', color: 'var(--color-text-light)', fontWeight: 'normal' }}>
              (ID: {registration.id})
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {registration.isCanceled ? (
              <span className="badge danger" style={{ fontSize: '13px', padding: '6px 12px' }}>
                <ShieldAlert size={14} />
                접수 취소됨
              </span>
            ) : registration.isPriceCheck ? (
              <span className="badge success" style={{ fontSize: '13px', padding: '6px 12px' }}>
                <CheckCircle2 size={14} />
                입금 확인 완료
              </span>
            ) : (
              <span className="badge warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
                <Calendar size={14} />
                입금 대기중
              </span>
            )}

            {registration.invoiceEdited && (
              <span className="badge warning" style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: 'rgba(245,158,11,0.05)', color: '#fbbf24' }}>
                관리자 수정됨
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">이름</span>
              <span className="detail-val" style={{ fontWeight: 'bold' }}>{registration.playerName}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">성별 / 나이</span>
              <span className="detail-val">
                {registration.playerGender === 'm' ? '남성' : '여성'} 
                {registration.playerAge ? ` (만 ${registration.playerAge}세)` : ''}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">생년월일</span>
              <span className="detail-val">{registration.playerBirth}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">연락처</span>
              <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: 'var(--color-text-light)' }} />
                {registration.playerTel}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">이메일</span>
              <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: 'var(--color-text-light)' }} />
                {registration.playerEmail || '미기입'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">소속 (Gym)</span>
              <span className="detail-val">{registration.playerGym}</span>
            </div>

            <div className="detail-row full-width">
              <span className="detail-label">참가 종목 및 체급</span>
              <div className="joins-chips" style={{ marginTop: '4px' }}>
                {registration.joins && registration.joins.length > 0 ? (
                  registration.joins.map((j, idx) => (
                    <div key={idx} className="join-chip">
                      <span className="category-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={13} style={{ color: 'var(--color-accent)' }} />
                        {j.contestCategoryTitle}
                      </span>
                      <span className="grade-title">{j.contestGradeTitle}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'var(--color-text-light)', fontSize: '13px' }}>선택된 종목이 없습니다.</span>
                )}
              </div>
            </div>

            <div className="detail-row full-width" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', borderTop: '1px solid var(--color-divider)', paddingTop: '16px' }}>
              <div>
                <span className="detail-label">기본 참가비</span>
                <span className="detail-val" style={{ marginTop: '4px', backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                  {formatPrice(registration.contestPriceSum)}
                </span>
              </div>
              <div>
                <span className="detail-label">최종 결제 금액</span>
                <span className="detail-val" style={{ marginTop: '4px', backgroundColor: 'transparent', border: 'none', padding: 0, fontSize: '18px', fontWeight: '800', color: 'var(--color-accent)' }}>
                  {formatPrice(registration.contestPriceTotal)}
                </span>
              </div>
            </div>

            {registration.playerText && (
              <div className="detail-row full-width">
                <span className="detail-label">전달 사항 (메모)</span>
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-divider)', borderRadius: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                  {registration.playerText}
                </div>
              </div>
            )}

            {/* Photos */}
            {(() => {
              const allPhotos: string[] = [];
              if (registration.playerPhotoUrls && registration.playerPhotoUrls.length > 0) {
                registration.playerPhotoUrls.forEach(url => {
                  if (url && !allPhotos.includes(url)) allPhotos.push(url);
                });
              }
              if (registration.playerPhotoUrl && !allPhotos.includes(registration.playerPhotoUrl)) {
                allPhotos.unshift(registration.playerPhotoUrl);
              }

              if (allPhotos.length === 0) return null;

              return (
                <div className="detail-row full-width">
                  <span className="detail-label">제출된 사진 (Photo - {allPhotos.length}장)</span>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {allPhotos.map((url, idx) => (
                      <div key={idx} style={{ width: '120px', height: '150px', border: '1px solid var(--color-divider)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
                        <img 
                          src={url} 
                          alt={`참가자 사진 ${idx + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" style={{ padding: '10px 20px' }} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
