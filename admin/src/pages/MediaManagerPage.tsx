import React, { useEffect, useState } from 'react';
import { useMediaManager } from '../hooks/useMediaManager';
import { adminService } from '../services/adminService';
import { 
  Save, Upload, Loader, AlertTriangle, CheckCircle, 
  Plus, Edit2, Trash2, Film, Video, Calendar, Play, FileVideo, ArrowLeft 
} from 'lucide-react';
import type { MediaItem } from '../types/auth';

/* =========================================================================
   동영상 콘텐츠 등록 및 수정 폼 컴포넌트
   ========================================================================= */
interface MediaItemFormProps {
  initialMedia?: MediaItem | null;
  onSave: (payload: Omit<MediaItem, 'createdAt'>) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
}

function MediaItemForm({ initialMedia, onSave, onCancel, isSaving }: MediaItemFormProps) {
  const [formData, setFormData] = useState(() => ({
    id: initialMedia?.id || `video-${crypto.randomUUID()}`,
    title: initialMedia?.title || '',
    category: initialMedia?.category || 'highlight',
    thumbnail: initialMedia?.thumbnail || '',
    videoUrl: initialMedia?.videoUrl || '',
    youtubeUrl: initialMedia?.youtubeUrl || '',
    date: initialMedia?.date || new Date().toISOString().split('T')[0],
    description: initialMedia?.description || '',
    featured: initialMedia?.featured || false,
    sortOrder: initialMedia?.sortOrder || 0
  }));

  const [videoSource, setVideoSource] = useState<'youtube' | 'mp4'>(
    initialMedia?.videoUrl ? 'mp4' : 'youtube'
  );
  
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 초기 비율 판단 함수
  const getInitialAspect = () => {
    const url = initialMedia?.videoUrl || initialMedia?.youtubeUrl || '';
    if (url.includes('#vertical')) return 'vertical';
    if (url.includes('#horizontal')) return 'horizontal';
    
    // 만약 youtubeUrl에 shorts가 포함되어 있으면 세로형
    if (initialMedia?.youtubeUrl && initialMedia.youtubeUrl.includes('youtube.com/shorts/')) {
      return 'vertical';
    }
    
    return 'horizontal';
  };

  const [aspect, setAspect] = useState<'horizontal' | 'vertical'>(getInitialAspect);

  // 유튜브 비디오 ID 추출 헬퍼
  const getYoutubeVideoId = (url: string): string => {
    if (!url) return '';
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }
    } catch {
      const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
      videoId = match ? match[1] : '';
    }
    return videoId;
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      const nextData = { ...prev, youtubeUrl: value };
      const videoId = getYoutubeVideoId(value);
      if (videoId) {
        const autoThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        // 기존 썸네일이 비어있거나, 이미 유튜브 썸네일 경로인 경우에만 덮어씌움
        if (!prev.thumbnail || prev.thumbnail.includes('youtube.com/vi/') || prev.thumbnail.includes('img.youtube.com/')) {
          nextData.thumbnail = autoThumb;
        }
      }
      return nextData;
    });

    if (value.includes('youtube.com/shorts/')) {
      setAspect('vertical');
    }
  };

  const applyYoutubeThumbnail = () => {
    const videoId = getYoutubeVideoId(formData.youtubeUrl);
    if (!videoId) {
      alert('유효한 유튜브 영상 URL을 먼저 입력해 주세요.');
      return;
    }
    const autoThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    setFormData(prev => ({ ...prev, thumbnail: autoThumb }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // 썸네일 이미지 업로드 (R2 전송)
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    setIsUploadingThumb(true);
    setUploadError(null);

    try {
      const url = await adminService.uploadImage(file, formData.id || 'temp-video-id');
      setFormData(prev => ({ ...prev, thumbnail: url }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '썸네일 업로드에 실패했습니다.';
      setUploadError(errMsg);
    } finally {
      setIsUploadingThumb(false);
    }
  };

  // MP4 비디오 직접 업로드 (R2 전송)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'video/mp4') {
      alert('MP4 (.mp4) 형식의 비디오 파일만 선택해 주세요.');
      return;
    }

    setIsUploadingVideo(true);
    setUploadError(null);

    try {
      const url = await adminService.uploadImage(file, formData.id || 'temp-video-id');
      setFormData(prev => ({ ...prev, videoUrl: url, youtubeUrl: '' }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '비디오 파일 업로드에 실패했습니다.';
      setUploadError(errMsg);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('동영상 제목을 입력해 주세요.');
      return;
    }

    if (!formData.thumbnail.trim()) {
      alert('썸네일 이미지 파일이 등록되어야 합니다.');
      return;
    }

    let finalVideoUrl = videoSource === 'mp4' ? formData.videoUrl : '';
    let finalYoutubeUrl = videoSource === 'youtube' ? formData.youtubeUrl : '';

    if (finalVideoUrl) {
      finalVideoUrl = finalVideoUrl.split('#')[0] + `#${aspect}`;
    }
    if (finalYoutubeUrl) {
      finalYoutubeUrl = finalYoutubeUrl.split('#')[0] + `#${aspect}`;
    }

    const payload = {
      ...formData,
      videoUrl: finalVideoUrl,
      youtubeUrl: finalYoutubeUrl,
      sortOrder: Number(formData.sortOrder)
    };

    onSave(payload);
  };

  const isBusy = isUploadingThumb || isUploadingVideo || isSaving;

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid var(--color-divider)', padding: '24px', borderRadius: 'var(--border-radius)', backgroundColor: '#ffffff', marginBottom: '24px' }}>
      <h3 className="form-section-title">
        {initialMedia ? '동영상 미디어 콘텐츠 수정' : '신규 동영상 콘텐츠 추가'}
      </h3>

      {uploadError && (
        <div className="alert-message alert-error" style={{ padding: '8px 12px', marginBottom: '16px' }}>
          <AlertTriangle size={14} />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="form-grid">
        <div className="form-group col-3">
          <label className="form-label">분류 (Category)</label>
          <select 
            name="category" 
            className="form-control" 
            value={formData.category} 
            onChange={handleChange}
            required
          >
            <option value="highlight">대회 하이라이트 (Highlight)</option>
            <option value="interview">선수 인터뷰 (Interview)</option>
            <option value="training">훈련 영상 (Training)</option>
            <option value="notice">대회 공지 (Notice)</option>
          </select>
        </div>

        <div className="form-group col-6">
          <label className="form-label">제목 (Title)</label>
          <input
            type="text"
            name="title"
            className="form-control"
            value={formData.title}
            onChange={handleChange}
            placeholder="영상 제목을 입력해 주세요"
            required
          />
        </div>

        <div className="form-group col-3">
          <label className="form-label">발행 일자 (Date)</label>
          <input
            type="date"
            name="date"
            className="form-control"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group col-12">
          <label className="form-label">비디오 요약 설명 (Description)</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            placeholder="동영상 목록 및 상세 모달에서 출력될 간략한 설명을 작성해 주세요"
            style={{ minHeight: '80px' }}
            required
          />
        </div>

        {/* 썸네일 이미지 관리 */}
        <div className="form-group col-12" style={{ marginTop: '12px' }}>
          <label className="form-label">영상 썸네일 이미지</label>
          <div className="upload-wrapper" style={{ margin: '6px 0' }}>
            {formData.thumbnail ? (
              <img src={formData.thumbnail} alt="썸네일 프리뷰" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">선택된 썸네일 없음</div>
            )}
            
            <div className="upload-actions">
              <label className="upload-btn-label">
                <Upload size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                썸네일 업로드
                <input 
                  type="file" 
                  className="upload-file-input" 
                  accept="image/*" 
                  onChange={handleThumbnailUpload}
                  disabled={isBusy}
                />
              </label>
              <span className="form-helper">가로형 이미지(16:9 권장)</span>
            </div>
            
            {isUploadingThumb && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-accent-dark)' }}>
                <Loader className="animate-spin" size={16} />
                <span>업로드 중...</span>
              </div>
            )}
          </div>
          <input
            type="text"
            name="thumbnail"
            className="form-control"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="썸네일 이미지 주소를 직접 입력할 수도 있습니다."
            style={{ marginTop: '6px' }}
          />
        </div>

        {/* 비디오 제공 형태 선택 */}
        <div className="form-group col-12" style={{ marginTop: '16px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>비디오 공급 형태</label>
          <div style={{ display: 'flex', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <input 
                type="radio" 
                name="videoSource" 
                checked={videoSource === 'youtube'} 
                onChange={() => setVideoSource('youtube')} 
                disabled={isBusy}
              />
              <Video size={16} style={{ color: '#ef4444' }} />
              유튜브 링크 입력 (공식 계정 연계)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <input 
                type="radio" 
                name="videoSource" 
                checked={videoSource === 'mp4'} 
                onChange={() => setVideoSource('mp4')} 
                disabled={isBusy}
              />
              <FileVideo size={16} style={{ color: 'var(--color-accent-dark)' }} />
              MP4 비디오 직접 업로드 (R2 스트리밍)
            </label>
          </div>
        </div>

        {/* 비디오 화면 비율 선택 (가로형 16:9 vs 세로형 9:16) */}
        <div className="form-group col-12" style={{ marginTop: '12px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>영상 화면 비율 (Aspect Ratio)</label>
          <div style={{ display: 'flex', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <input 
                type="radio" 
                name="videoAspect" 
                checked={aspect === 'horizontal'} 
                onChange={() => setAspect('horizontal')} 
                disabled={isBusy}
              />
              <span>가로형 (16:9)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <input 
                type="radio" 
                name="videoAspect" 
                checked={aspect === 'vertical'} 
                onChange={() => setAspect('vertical')} 
                disabled={isBusy}
              />
              <span>세로형 (9:16 / 쇼츠 권장)</span>
            </label>
          </div>
        </div>

        {videoSource === 'youtube' ? (
          <div className="form-group col-12" style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>YouTube 영상 URL</label>
              <button
                type="button"
                onClick={applyYoutubeThumbnail}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Video size={12} style={{ color: '#ef4444' }} />
                <span>유튜브 썸네일 자동 적용</span>
              </button>
            </div>
            <input
              type="text"
              name="youtubeUrl"
              className="form-control"
              value={formData.youtubeUrl}
              onChange={handleYoutubeUrlChange}
              placeholder="예: https://www.youtube.com/watch?v=XXXXXX 또는 https://youtu.be/XXXXXX"
              required={videoSource === 'youtube'}
            />
          </div>
        ) : (
          <div className="form-group col-12" style={{ marginTop: '4px' }}>
            <label className="form-label">MP4 비디오 직접 업로드 (.mp4)</label>
            <div className="upload-wrapper" style={{ margin: '6px 0', borderStyle: 'solid', borderWidth: '1px', borderColor: 'var(--color-divider)' }}>
              <div className="upload-placeholder" style={{ backgroundColor: '#f8fafc' }}>
                <Film size={20} />
              </div>
              <div className="upload-actions">
                <label className="upload-btn-label" style={{ backgroundColor: 'var(--color-accent-light)', borderColor: 'var(--color-accent-dark)', color: 'var(--color-accent-dark)' }}>
                  <Film size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  비디오 파일 선택 (.mp4)
                  <input 
                    type="file" 
                    className="upload-file-input" 
                    accept="video/mp4" 
                    onChange={handleVideoUpload}
                    disabled={isBusy}
                  />
                </label>
                <span className="form-helper">모바일 재생 및 최적화를 위해 H.264 인코딩 mp4 권장</span>
              </div>
              
              {isUploadingVideo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-accent-dark)' }}>
                  <Loader className="animate-spin" size={16} />
                  <span>R2로 동영상 전송 중 (대용량 파일은 다소 시간이 걸릴 수 있습니다)...</span>
                </div>
              )}
            </div>
            
            <input
              type="text"
              name="videoUrl"
              className="form-control"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="직접 업로드된 비디오 URL 주소"
              readOnly
              required={videoSource === 'mp4'}
            />
          </div>
        )}

        <div className="form-group col-6" style={{ marginTop: '12px' }}>
          <label className="form-label">출력 정렬 순서 (Sort Order)</label>
          <input
            type="number"
            name="sortOrder"
            className="form-control"
            value={formData.sortOrder}
            onChange={handleChange}
            placeholder="숫자가 작을수록 우선 노출"
          />
        </div>

        <div className="form-group col-6" style={{ marginTop: '12px', justifyContent: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleCheckboxChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            메인 추천 영상 지정 (Featured)
          </label>
        </div>
      </div>

      <div className="btn-group" style={{ marginTop: '24px' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isBusy}
        >
          <ArrowLeft size={14} />
          <span>취소</span>
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isBusy}
        >
          <Save size={14} />
          <span>{isBusy ? '동작 처리 중...' : initialMedia ? '수정 내용 저장' : '새로운 동영상 추가 완료'}</span>
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
   미디어 아카이브 관리 메인 컴포넌트
   ========================================================================= */
export default function MediaManagerPage() {
  const { 
    mediaList, isLoading, isUpdating, error, successMsg, 
    loadMediaList, addMediaItem, editMediaItem, removeMediaItem 
  } = useMediaManager();

  const [activeFormMode, setActiveFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadMediaList();
  }, [loadMediaList]);

  const handleCreateSubmit = async (payload: Omit<MediaItem, 'createdAt'>) => {
    const success = await addMediaItem(payload);
    if (success) {
      loadMediaList();
      setActiveFormMode('list');
    }
    return success;
  };

  const handleEditSubmit = async (payload: Omit<MediaItem, 'id' | 'createdAt'>) => {
    if (!selectedMedia) return false;
    const success = await editMediaItem(selectedMedia.id, payload);
    if (success) {
      loadMediaList();
      setActiveFormMode('list');
      setSelectedMedia(null);
    }
    return success;
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`정말 "${title}" 영상을 아카이브에서 삭제하시겠습니까?`)) {
      const success = await removeMediaItem(id);
      if (success) {
        alert('동영상이 정상적으로 삭제되었습니다.');
      }
    }
  };

  const handleStartEdit = (media: MediaItem) => {
    setSelectedMedia(media);
    setActiveFormMode('edit');
  };

  const handleCancel = () => {
    setActiveFormMode('list');
    setSelectedMedia(null);
  };

  // 카테고리 표시 한글 매핑 헬퍼
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'highlight': return '대회 하이라이트';
      case 'interview': return '선수 인터뷰';
      case 'training': return '훈련 영상';
      case 'notice': return '대회 공지';
      default: return cat;
    }
  };

  // 목록 필터링
  const filteredList = categoryFilter === 'all' 
    ? mediaList 
    : mediaList.filter(item => item.category === categoryFilter);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <h1 className="page-title">미디어 아카이브 관리</h1>
          <p className="page-subtitle">플랫폼 내의 비디오 아카이브 콘텐츠를 복수 등록하고 MP4 또는 유튜브 영상 파일을 직접 업로드 관리합니다.</p>
        </div>

        {activeFormMode === 'list' && (
          <button 
            onClick={() => setActiveFormMode('create')}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>새 동영상 추가</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="alert-message alert-success" style={{ marginBottom: '16px' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-message alert-error" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {activeFormMode === 'create' && (
        <MediaItemForm 
          key="create"
          onSave={handleCreateSubmit}
          onCancel={handleCancel}
          isSaving={isUpdating}
        />
      )}

      {activeFormMode === 'edit' && selectedMedia && (
        <MediaItemForm 
          key={`edit-${selectedMedia.id}`}
          initialMedia={selectedMedia}
          onSave={handleEditSubmit}
          onCancel={handleCancel}
          isSaving={isUpdating}
        />
      )}

      {activeFormMode === 'list' && (
        <>
          {/* 목록 필터 바 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginBottom: '16px' }}>
            {['all', 'highlight', 'interview', 'training', 'notice'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`btn btn-secondary btn-sm`}
                style={{
                  backgroundColor: categoryFilter === cat ? 'var(--color-accent-light)' : '#ffffff',
                  borderColor: categoryFilter === cat ? 'var(--color-accent-dark)' : 'var(--color-divider)',
                  color: categoryFilter === cat ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
                  fontWeight: categoryFilter === cat ? '700' : '500'
                }}
              >
                {cat === 'all' ? '전체 보기' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              미디어 목록을 백엔드에서 읽어오는 중입니다...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p className="empty-title">등록된 동영상이 없습니다</p>
              <p className="empty-desc" style={{ fontSize: '13px' }}>선택하신 카테고리에 할당된 동영상 정보가 비어있습니다. 새로 추가해 보세요.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>썸네일 / 제목</th>
                    <th>분류</th>
                    <th>소스 타입</th>
                    <th>발행일</th>
                    <th>노출 순서</th>
                    <th style={{ textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="player-row-info">
                          <div style={{ position: 'relative', width: '70px', height: '42px', flexShrink: 0 }}>
                            <img 
                              src={item.thumbnail} 
                              alt={item.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-divider)' }} 
                            />
                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '2px', padding: '1px 3px', display: 'flex', alignItems: 'center' }}>
                              <Play size={8} style={{ color: '#ffffff' }} />
                            </div>
                          </div>
                          <div className="player-details">
                            <span className="player-name" style={{ fontSize: '14px', lineClamp: 1, overflow: 'hidden' }}>{item.title}</span>
                            <span className="player-class" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {item.featured && <span style={{ color: 'var(--color-accent-dark)', fontWeight: 'bold' }}>★ 추천지정</span>}
                              <span style={{ color: 'var(--color-text-light)' }}>ID: {item.id}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge status-badge-primary" style={{ fontSize: '10px' }}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.youtubeUrl ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>
                              <Video size={14} /> Youtube 링크
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-accent-dark)', fontWeight: '600' }}>
                              <FileVideo size={14} /> R2 MP4 직접 업로드
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                            {(item.videoUrl || item.youtubeUrl || '').includes('#vertical') ? '세로형 (9:16)' : '가로형 (16:9)'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          <Calendar size={12} /> {item.date}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', paddingLeft: '32px' }}>
                        {item.sortOrder || 0}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="btn btn-secondary btn-sm"
                            title="수정"
                          >
                            <Edit2 size={11} />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}
                            title="삭제"
                          >
                            <Trash2 size={11} />
                            <span>삭제</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
