import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { HeroPlayer } from '../../types/auth';
import { ArrowLeft, Save, Upload, Loader } from 'lucide-react';

interface HeroPlayerFormProps {
  initialData?: HeroPlayer | null;
  onSubmit: (data: HeroPlayer) => Promise<boolean>;
  isSubmitting: boolean;
  submitButtonText: string;
}

export default function HeroPlayerForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText
}: HeroPlayerFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<HeroPlayer>(() => {
    if (initialData) {
      return { ...initialData };
    }
    return {
      id: `player-${crypto.randomUUID()}`,
      heroName: '',
      heroClass: '',
      heroHeight: '',
      heroWeight: '',
      heroGym: '용인시 보디빌딩협회',
      heroTitles: '',
      heroImageUrl: '',
      heroInstagram: '',
      heroYoutube: '',
      heroFacebook: ''
    };
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 간단 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 선수의 고유 ID 또는 임시 ID를 전달
      const imageUrl = await adminService.uploadImage(file, formData.id || 'temp-hero-id');
      setFormData(prev => ({ ...prev, heroImageUrl: imageUrl }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.heroName.trim()) {
      alert('선수 이름을 입력해 주세요.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="panel">
        {/* 인적 스펙 구성 (그룹분할선 사용, 카드 중첩 없음) */}
        <h3 className="form-section-title">선수 기본 인적 스펙</h3>
        <div className="form-grid">
          <div className="form-group col-6">
            <label className="form-label">선수 성명 (영문)</label>
            <input
              type="text"
              name="heroName"
              className="form-control"
              placeholder="예: KIM CHAMPION"
              value={formData.heroName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group col-6">
            <label className="form-label">출전 체급 (Class)</label>
            <input
              type="text"
              name="heroClass"
              className="form-control"
              placeholder="예: CLASSIC PHYSIQUE"
              value={formData.heroClass}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">신장 (cm)</label>
            <input
              type="number"
              name="heroHeight"
              className="form-control"
              placeholder="예: 182"
              value={formData.heroHeight}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">체중 (kg)</label>
            <input
              type="number"
              name="heroWeight"
              className="form-control"
              placeholder="예: 95"
              value={formData.heroWeight}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">소속 체육관 / 협회</label>
            <input
              type="text"
              name="heroGym"
              className="form-control"
              placeholder="예: 용인시 보디빌딩협회"
              value={formData.heroGym}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* 프로필 이미지 업로드 영역 */}
        <h3 className="form-section-title" style={{ marginTop: '32px' }}>선수 프로필 이미지</h3>
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">메인 컷 이미지 (R2 저장소 업로드)</label>
          <div className="upload-wrapper">
            {formData.heroImageUrl ? (
              <img src={formData.heroImageUrl} alt="선수 프리뷰" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">선택된 이미지 없음</div>
            )}
            
            <div className="upload-actions">
              <label className="upload-btn-label">
                <Upload size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                파일 선택
                <input 
                  type="file" 
                  className="upload-file-input" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={isUploading || isSubmitting}
                />
              </label>
              <span className="form-helper">배경이 투명하게 제거된 고화질 PNG 이미지 권장</span>
            </div>
            
            {isUploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-accent-dark)' }}>
                <Loader className="animate-spin" size={16} />
                <span>업로드 중...</span>
              </div>
            )}
          </div>
          {uploadError && <span className="form-helper" style={{ color: 'var(--color-error)' }}>{uploadError}</span>}
          
          <div style={{ marginTop: '12px' }}>
            <label className="form-label">이미지 경로 직접 입력</label>
            <input
              type="text"
              name="heroImageUrl"
              className="form-control"
              placeholder="/hero_section.png"
              value={formData.heroImageUrl}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 수상 경력 */}
        <h3 className="form-section-title" style={{ marginTop: '32px' }}>주요 약력 및 수상 정보</h3>
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">수상 이력 (Titles)</label>
          <textarea
            name="heroTitles"
            className="form-control"
            placeholder="예: 2026 Overall Winner · 2025 Grand Prix 1st · Mr. Yongin 3× Champion (가운데 점(·)이나 쉼표로 구분하여 작성)"
            value={formData.heroTitles}
            onChange={handleChange}
            required
          />
        </div>

        {/* 소셜 링크 */}
        <h3 className="form-section-title" style={{ marginTop: '32px' }}>소셜 미디어 (SNS) 링크</h3>
        <div className="form-grid">
          <div className="form-group col-4">
            <label className="form-label">Instagram 링크</label>
            <input
              type="text"
              name="heroInstagram"
              className="form-control"
              placeholder="예: https://instagram.com/account"
              value={formData.heroInstagram}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group col-4">
            <label className="form-label">Youtube 링크</label>
            <input
              type="text"
              name="heroYoutube"
              className="form-control"
              placeholder="예: https://youtube.com/@channel"
              value={formData.heroYoutube}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Facebook 링크</label>
            <input
              type="text"
              name="heroFacebook"
              className="form-control"
              placeholder="예: https://facebook.com/profile"
              value={formData.heroFacebook}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button
          type="button"
          onClick={() => navigate('/hero')}
          className="btn btn-secondary"
          disabled={isSubmitting || isUploading}
        >
          <ArrowLeft size={16} />
          <span>취소 및 목록으로</span>
        </button>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || isUploading}
        >
          <Save size={16} />
          <span>{isSubmitting ? '저장 중...' : submitButtonText}</span>
        </button>
      </div>
    </form>
  );
}
