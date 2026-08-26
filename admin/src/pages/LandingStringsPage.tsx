import React, { useEffect, useState } from 'react';
import { useLandingSections } from '../hooks/useLandingSections';
import { useMediaManager } from '../hooks/useMediaManager';
import { adminService } from '../services/adminService';
import { Info, Save, Upload, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import type { SectionItem } from '../types/auth';

interface SectionFormProps {
  section: SectionItem;
  onSave: (sectionId: string, payload: Partial<SectionItem>) => Promise<boolean>;
  isUpdating: boolean;
}

function SectionForm({ section, onSave, isUpdating }: SectionFormProps) {
  const [formData, setFormData] = useState<SectionItem>({ ...section });
  const [extraDataStr, setExtraDataStr] = useState(
    section.extraData ? JSON.stringify(section.extraData, null, 2) : ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 미디어 노출 선택을 위해 전체 미디어 목록 조회용 훅 탑재
  const { mediaList, loadMediaList } = useMediaManager();

  // home_media_intro일 때만 미디어 목록 조회
  useEffect(() => {
    if (section.sectionId === 'home_media_intro') {
      loadMediaList();
    }
  }, [section.sectionId, loadMediaList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExtraDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtraDataStr(e.target.value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const url = await adminService.uploadImage(file, section.sectionId);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // 체크박스 클릭 시 JSON extraData를 파싱하여 selectedMediaIds 배열을 업데이트
  const handleToggleMediaSelect = (mediaId: string) => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let currentExtra: Record<string, any> = {};
    if (extraDataStr.trim()) {
      try {
        currentExtra = JSON.parse(extraDataStr);
      } catch {
        currentExtra = {};
      }
    }

    const selectedIds: string[] = currentExtra.selectedMediaIds || [];
    let nextIds: string[];
    
    if (selectedIds.includes(mediaId)) {
      nextIds = selectedIds.filter(id => id !== mediaId);
    } else {
      nextIds = [...selectedIds, mediaId];
    }

    const nextExtra = {
      ...currentExtra,
      selectedMediaIds: nextIds
    };

    setExtraDataStr(JSON.stringify(nextExtra, null, 2));
  };

  // JSON에서 현재 선택된 미디어 ID 파싱
  let selectedIds: string[] = [];
  if (extraDataStr.trim()) {
    try {
      const parsed = JSON.parse(extraDataStr);
      selectedIds = parsed.selectedMediaIds || [];
    } catch {
      // 무시
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSuccess(false);
    setLocalError(null);

    let parsedExtraData = null;
    if (extraDataStr.trim()) {
      try {
        parsedExtraData = JSON.parse(extraDataStr);
      } catch {
        setLocalError('JSON 데이터 형식이 올바르지 않습니다. 중괄호나 따옴표를 확인해 주세요.');
        return;
      }
    }

    const payload: Partial<SectionItem> = {
      title: formData.title,
      subtitle: formData.subtitle,
      description: formData.description,
      imageUrl: formData.imageUrl,
      buttonText: formData.buttonText,
      buttonLink: formData.buttonLink,
      extraData: parsedExtraData,
      page: formData.page
    };

    const success = await onSave(section.sectionId, payload);
    if (success) {
      setLocalSuccess(true);
      setTimeout(() => setLocalSuccess(false), 3000);
    } else {
      setLocalError('설정을 백엔드에 업데이트하지 못했습니다.');
    }
  };

  const isManifesto = section.sectionId.includes('manifesto');
  const isMediaIntro = section.sectionId === 'home_media_intro';

  return (
    <div className="panel" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-divider)', paddingBottom: '12px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
          구역명: <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 'normal' }}>
            {section.sectionId === 'home_manifesto' && '선언문 (Manifesto) 텍스트 관리'}
            {section.sectionId === 'home_legend_highlight' && '레전드 하이라이트 인트로 텍스트'}
            {section.sectionId === 'home_youth_preview' && '유스 시스템 프리뷰 인트로 텍스트'}
            {section.sectionId === 'home_media_intro' && '미디어 갤러리 인트로 텍스트 및 전시 영상 설정'}
            {section.sectionId === 'home_store' && '스토어 섹션 인트로 텍스트'}
          </span>
          <code style={{ marginLeft: '8px', color: 'var(--color-accent-dark)', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{section.sectionId}</code>
        </h4>
        <span className="status-badge status-badge-primary">페이지: {section.page.toUpperCase()}</span>
      </div>

      {localSuccess && (
        <div className="alert-message alert-success" style={{ padding: '10px 14px', marginBottom: '16px' }}>
          <CheckCircle size={16} />
          <span>성공적으로 저장되었습니다!</span>
        </div>
      )}

      {localError && (
        <div className="alert-message alert-error" style={{ padding: '10px 14px', marginBottom: '16px' }}>
          <AlertTriangle size={16} />
          <span>{localError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group col-6">
            <label className="form-label">섹션 타이틀 (Title)</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title || ''}
              onChange={handleChange}
              placeholder="타이틀 입력"
            />
          </div>

          <div className="form-group col-6">
            <label className="form-label">섹션 서브타이틀 (Subtitle)</label>
            <input
              type="text"
              name="subtitle"
              className="form-control"
              value={formData.subtitle || ''}
              onChange={handleChange}
              placeholder="서브타이틀 입력 (없을 경우 비워둠)"
            />
          </div>

          <div className="form-group col-12">
            <label className="form-label">상세 내용 및 문구 (Description)</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="상세 텍스트 입력"
            />
            <span className="form-helper" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Info size={12} />
              <span>줄바꿈(&lt;br /&gt;) 또는 특수 효과 스타일용 HTML 코드를 자유롭게 섞어 쓸 수 있습니다.</span>
            </span>
          </div>

          <div className="form-group col-12" style={{ marginTop: '12px' }}>
            <label className="form-label">배경 / 대표 이미지</label>
            <div className="upload-wrapper" style={{ margin: '6px 0' }}>
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="섹션 프리뷰" className="upload-preview" />
              ) : (
                <div className="upload-placeholder">이미지 없음</div>
              )}
              
              <div className="upload-actions">
                <label className="upload-btn-label">
                  <Upload size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  새 이미지 업로드
                  <input 
                    type="file" 
                    className="upload-file-input" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={isUploading || isUpdating}
                  />
                </label>
                <span className="form-helper">Cloudflare R2 버킷에 미디어가 저장됩니다.</span>
              </div>
              
              {isUploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-accent-dark)' }}>
                  <Loader className="animate-spin" size={16} />
                  <span>R2 업로드 중...</span>
                </div>
              )}
            </div>
            {uploadError && <span className="form-helper" style={{ color: 'var(--color-error)' }}>{uploadError}</span>}
            
            <input
              type="text"
              name="imageUrl"
              className="form-control"
              value={formData.imageUrl || ''}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              style={{ marginTop: '8px' }}
            />
          </div>

          <div className="form-group col-6" style={{ marginTop: '12px' }}>
            <label className="form-label">버튼 텍스트</label>
            <input
              type="text"
              name="buttonText"
              className="form-control"
              value={formData.buttonText || ''}
              onChange={handleChange}
              placeholder="버튼 라벨 (없을 경우 비워둠)"
            />
          </div>

          <div className="form-group col-6" style={{ marginTop: '12px' }}>
            <label className="form-label">버튼 링크 대상</label>
            <input
              type="text"
              name="buttonLink"
              className="form-control"
              value={formData.buttonLink || ''}
              onChange={handleChange}
              placeholder="예: /legends, /media 등 (없을 경우 비워둠)"
            />
          </div>

          {/* 미디어 전용: 전시 비디오 선택기 */}
          {isMediaIntro && mediaList.length > 0 && (
            <div className="form-group col-12" style={{ marginTop: '16px', borderTop: '1px solid var(--color-divider)', paddingTop: '16px' }}>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                홈페이지 가로 롤링 갤러리 전시 동영상 선택 (최대 6개 권장)
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: '12px', 
                maxHeight: '260px', 
                overflowY: 'auto', 
                padding: '12px', 
                border: '1px solid var(--color-divider)', 
                borderRadius: 'var(--border-radius-sm)', 
                backgroundColor: '#f8fafc' 
              }}>
                {mediaList.map(media => {
                  const isSelected = selectedIds.includes(media.id);
                  return (
                    <div 
                      key={media.id} 
                      onClick={() => handleToggleMediaSelect(media.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--color-accent-dark)' : '1px solid var(--color-divider)',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        padding: '6px',
                        position: 'relative',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 2px 4px rgba(132,204,22,0.15)' : 'none'
                      }}
                    >
                      <img 
                        src={media.thumbnail} 
                        alt={media.title} 
                        style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                      <span style={{ fontSize: '11px', fontWeight: '600', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {media.title}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                        {media.category === 'highlight' ? '하이라이트' : media.category === 'interview' ? '인터뷰' : '공지/훈련'}
                      </span>
                      
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {}} // parent onClick handles toggle
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group col-12" style={{ marginTop: '12px' }}>
            <label className="form-label">추가 구성 요소 (JSON Extra Data)</label>
            <textarea
              className="form-control"
              value={extraDataStr}
              onChange={handleExtraDataChange}
              placeholder='{\n  "customKey": "customValue"\n}'
              style={{ fontFamily: 'monospace', fontSize: '12px', minHeight: '90px' }}
            />
            <span className="form-helper">
              {isManifesto && '서명(Signature)의 드로잉 경로를 정의하는 signaturePath 키 등을 포함하는 JSON 데이터 공간입니다.'}
              {isMediaIntro && '위의 선택기 클릭에 따라 selectedMediaIds 배열 목록이 실시간 반영됩니다.'}
              {!isManifesto && !isMediaIntro && '스토어 뱃지명, 리스트 레이블 등의 추가 옵션을 JSON 형식으로 편집합니다.'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isUpdating || isUploading}
          >
            <Save size={14} />
            <span>{isUpdating ? '저장 중...' : '해당 섹션 변경사항 저장'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================================
   랜딩 페이지 및 서브페이지 세션 문자열 통합 어드민 페이지
   ========================================================================= */
export default function LandingStringsPage() {
  const { sections, isLoading, isUpdating, error, fetchSections, updateSection } = useLandingSections();
  const [activeTab, setActiveTab] = useState<'manifesto' | 'previews' | 'store' | 'subpages'>('manifesto');

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const tabs = [
    { id: 'manifesto' as const, label: '메인 선언문 (Manifesto)' },
    { id: 'previews' as const, label: '미리보기 (Legends/Youth/Media)' },
    { id: 'store' as const, label: '스토어 섹션 (Store)' },
    { id: 'subpages' as const, label: '서브페이지 소개글 (Subpages)' }
  ];

  const getFilteredSections = () => {
    switch (activeTab) {
      case 'manifesto':
        return sections.filter(sec => sec.sectionId === 'home_manifesto');
      case 'previews': {
        const previewOrder = ['home_media_intro', 'home_legend_highlight', 'home_youth_preview'];
        return sections
          .filter(sec => previewOrder.includes(sec.sectionId))
          .sort((a, b) => previewOrder.indexOf(a.sectionId) - previewOrder.indexOf(b.sectionId));
      }
      case 'store':
        return sections.filter(sec => sec.sectionId === 'home_store');
      case 'subpages': {
        const subpageOrder = [
          'about_hero',
          'about_manifesto',
          'about_youth',
          'about_cta',
          'legends_hero',
          'media_hero',
          'youth_hero',
          'youth_system'
        ];
        return sections
          .filter(sec => subpageOrder.includes(sec.sectionId))
          .sort((a, b) => subpageOrder.indexOf(a.sectionId) - subpageOrder.indexOf(b.sectionId));
      }
      default:
        return [];
    }
  };

  const filteredSections = getFilteredSections();

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">랜딩페이지 섹션 편집</h1>
          <p className="page-subtitle">메인 화면 및 각 서브페이지에 배치된 하드코딩 텍스트와 레이아웃을 탭별로 관리합니다.</p>
        </div>
      </div>

      {error && (
        <div className="alert-message alert-error">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="tab-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          섹션 데이터를 조회하는 중입니다...
        </div>
      ) : filteredSections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
          해당 탭에 표시할 섹션 정보가 없습니다.
        </div>
      ) : (
        <div>
          {filteredSections.map(sec => (
            <SectionForm
              key={`${sec.sectionId}-${sec.updatedAt || ''}`}
              section={sec}
              onSave={updateSection}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
