import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { 
  Megaphone, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Loader, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Paperclip,
  PlayCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface Attachment {
  name: string;
  url: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  youtubeUrl: string;
  audioUrl: string;
  images: string[];
  attachments: Attachment[];
  isMandatory: boolean;
  views: number;
  sortOrder: number;
  createdAt: string;
}

const emptyNotice = (): Partial<Notice> => ({
  title: '',
  content: '',
  videoUrl: '',
  youtubeUrl: '',
  audioUrl: '',
  images: [],
  attachments: [],
  isMandatory: false,
  sortOrder: 0
});

export default function NoticeManagerPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 모달 및 폼 제어 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Partial<Notice>>(emptyNotice());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 업로드 진행 상태
  const [uploadProgress, setUploadProgress] = useState<{
    type: 'video' | 'audio' | 'images' | 'attachments' | null;
    index?: number;
  }>({ type: null });

  // 세로형 비디오 토글 상태 (저장 시 주소에 #vertical 붙이기 위함)
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);

  // 다중 이미지 업로드 및 첨부파일 수동 추가를 위한 임시 상태
  const [manualImageInput, setManualImageInput] = useState('');
  const [manualAttachmentName, setManualAttachmentName] = useState('');
  const [manualAttachmentUrl, setManualAttachmentUrl] = useState('');

  const loadNotices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchNotices();
      setNotices(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '공지사항 목록을 불러오지 못했습니다.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openCreateModal = () => {
    setCurrentNotice(emptyNotice());
    setIsVerticalVideo(false);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    const isVertical = notice.videoUrl?.endsWith('#vertical') || false;
    
    // images와 attachments가 string으로 들어와 있는 경우 예외 방어파싱
    let parsedImages: string[] = [];
    if (Array.isArray(notice.images)) {
      parsedImages = notice.images;
    } else if (typeof notice.images === 'string') {
      try {
        parsedImages = JSON.parse(notice.images);
      } catch {
        parsedImages = [];
      }
    }

    let parsedAttachments: Attachment[] = [];
    if (Array.isArray(notice.attachments)) {
      parsedAttachments = notice.attachments;
    } else if (typeof notice.attachments === 'string') {
      try {
        parsedAttachments = JSON.parse(notice.attachments);
      } catch {
        parsedAttachments = [];
      }
    }

    setCurrentNotice({
      ...notice,
      images: parsedImages,
      attachments: parsedAttachments,
      // #vertical 접미사가 있으면 제거해서 폼에 노출
      videoUrl: isVertical ? notice.videoUrl.replace('#vertical', '') : notice.videoUrl
    });
    setIsVerticalVideo(isVertical);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;
    try {
      await adminService.deleteNotice(id);
      triggerSuccess('공지사항이 성공적으로 삭제되었습니다.');
      loadNotices();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      alert(errMsg);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentNotice(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentNotice(prev => ({ ...prev, [name]: checked }));
  };

  // R2 파일 업로드 통합 핸들러
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'video' | 'audio' | 'images' | 'attachments'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress({ type });
    try {
      const uploadedUrl = await adminService.uploadNoticeFile(file);
      
      setCurrentNotice(prev => {
        if (!prev) return prev;
        
        if (type === 'video') {
          return { ...prev, videoUrl: uploadedUrl };
        } else if (type === 'audio') {
          return { ...prev, audioUrl: uploadedUrl };
        } else if (type === 'images') {
          return { ...prev, images: [...(prev.images || []), uploadedUrl] };
        } else if (type === 'attachments') {
          const newAttachment: Attachment = { name: file.name, url: uploadedUrl };
          return { ...prev, attachments: [...(prev.attachments || []), newAttachment] };
        }
        return prev;
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '파일 업로드에 실패했습니다.';
      alert(errMsg);
    } finally {
      setUploadProgress({ type: null });
    }
  };

  // 다중 이미지 순서 변경 헬퍼
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const images = [...(currentNotice.images || [])];
    if (direction === 'up' && index > 0) {
      const temp = images[index];
      images[index] = images[index - 1];
      images[index - 1] = temp;
    } else if (direction === 'down' && index < images.length - 1) {
      const temp = images[index];
      images[index] = images[index + 1];
      images[index + 1] = temp;
    }
    setCurrentNotice(prev => ({ ...prev, images }));
  };

  const removeImage = (index: number) => {
    const images = (currentNotice.images || []).filter((_, idx) => idx !== index);
    setCurrentNotice(prev => ({ ...prev, images }));
  };

  const addManualImage = () => {
    if (!manualImageInput.trim()) return;
    setCurrentNotice(prev => ({ ...prev, images: [...(prev.images || []), manualImageInput.trim()] }));
    setManualImageInput('');
  };

  // 첨부파일 관리 헬퍼
  const addManualAttachment = () => {
    if (!manualAttachmentName.trim() || !manualAttachmentUrl.trim()) {
      alert('파일명과 다운로드 URL을 모두 기입해 주십시오.');
      return;
    }
    const newAttachment: Attachment = {
      name: manualAttachmentName.trim(),
      url: manualAttachmentUrl.trim()
    };
    setCurrentNotice(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAttachment] }));
    setManualAttachmentName('');
    setManualAttachmentUrl('');
  };

  const removeAttachment = (index: number) => {
    const attachments = (currentNotice.attachments || []).filter((_, idx) => idx !== index);
    setCurrentNotice(prev => ({ ...prev, attachments }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNotice.title?.trim() || !currentNotice.content?.trim()) {
      alert('공지 제목과 상세 본문은 필수 입력사항입니다.');
      return;
    }

    setIsSaving(true);
    try {
      // 세로형 비디오 체크 시 URL 끝에 #vertical 추가
      let finalVideoUrl = currentNotice.videoUrl || '';
      if (finalVideoUrl && isVerticalVideo && !finalVideoUrl.endsWith('#vertical')) {
        finalVideoUrl = `${finalVideoUrl}#vertical`;
      }

      // 신규 등록 시 D1 스키마 필수 검증 만족을 위한 고유 ID 생성 주입
      const noticeId = currentNotice.id || (
        typeof crypto !== 'undefined' && crypto.randomUUID 
          ? 'not_' + crypto.randomUUID()
          : 'not_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
      );

      const payload = {
        ...currentNotice,
        id: noticeId,
        videoUrl: finalVideoUrl,
        sortOrder: Number(currentNotice.sortOrder) || 0
      };

      if (isEditing && currentNotice.id) {
        await adminService.updateNotice(currentNotice.id, payload);
        triggerSuccess('공지사항이 성공적으로 수정되었습니다.');
      } else {
        await adminService.createNotice(payload);
        triggerSuccess('신규 공지사항이 성공적으로 개시되었습니다.');
      }
      setIsModalOpen(false);
      loadNotices();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '공지 저장 중 오류가 발생했습니다.';
      alert(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">필수 공지사항 관리</h1>
          <p className="page-subtitle">대회 접수 개시 전 선수들이 필수 동의 및 정독/시청해야 할 규정 공지사항을 배포하고 편집합니다.</p>
        </div>
        
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          <span>신규 공지 배포</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert-message alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-message alert-error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 공지사항 목록 테이블 */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            <Loader className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
            <span>공지 리스트 로드 중...</span>
          </div>
        ) : notices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            배포된 공지사항이 없습니다. 상단 우측 버튼을 눌러 첫 필수 공지를 생성하십시오.
          </div>
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-divider)' }}>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold', width: '80px' }}>우선순위</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold', width: '100px' }}>구분</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold' }}>공지 제목</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold', width: '150px' }}>첨부 리소스</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold', width: '100px', textAlign: 'right' }}>조회수</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold', width: '150px' }}>배포일시</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 'bold', width: '120px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {notices.map(notice => {
                // 파싱 처리 안전가드
                let imagesCount = 0;
                try {
                  const imgs = typeof notice.images === 'string' ? JSON.parse(notice.images) : notice.images;
                  imagesCount = Array.isArray(imgs) ? imgs.length : 0;
                } catch {
                  imagesCount = 0;
                }

                let attachmentsCount = 0;
                try {
                  const atts = typeof notice.attachments === 'string' ? JSON.parse(notice.attachments) : notice.attachments;
                  attachmentsCount = Array.isArray(atts) ? atts.length : 0;
                } catch {
                  attachmentsCount = 0;
                }

                return (
                  <tr key={notice.id} style={{ borderBottom: '1px solid var(--color-divider)' }} className="table-row">
                    <td style={{ padding: '16px 20px', fontSize: '14px', fontFamily: 'monospace' }}>{notice.sortOrder}</td>
                    <td style={{ padding: '16px 20px' }}>
                      {notice.isMandatory ? (
                        <span style={{
                          backgroundColor: 'var(--color-error-light)',
                          color: 'var(--color-error)',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: '1px solid #fee2e2'
                        }}>
                          필수 공지
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#f1f5f9',
                          color: 'var(--color-text-muted)',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          일반 공지
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '600', fontSize: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{notice.title}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal', marginTop: '2px', display: 'block', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {notice.content.replace(/<[^>]*>/g, '')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-light)' }}>
                        {notice.videoUrl && <span title="동영상 보유"><Video size={16} style={{ color: 'var(--color-accent-dark)' }} /></span>}
                        {notice.youtubeUrl && <span title="유튜브 비디오 보유"><PlayCircle size={16} style={{ color: '#ef4444' }} /></span>}
                        {notice.audioUrl && <span title="음성 파일 보유"><Music size={16} style={{ color: '#06b6d4' }} /></span>}
                        {imagesCount > 0 && <span title={`이미지 ${imagesCount}장`}><ImageIcon size={16} style={{ color: '#ec4899' }} /></span>}
                        {attachmentsCount > 0 && <span title={`첨부파일 ${attachmentsCount}개`}><Paperclip size={16} style={{ color: '#64748b' }} /></span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: 'var(--color-text-muted)' }}>
                        <Eye size={12} />
                        <span>{notice.views}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {new Date(notice.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => openEditModal(notice)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                          title="수정"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="btn btn-secondary hover-danger" 
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                          title="삭제"
                        >
                          <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록 및 수정 모달 다이얼로그 */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--color-divider)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-divider)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} style={{ color: 'var(--color-accent-dark)' }} />
                <span>{isEditing ? '필수 공지사항 편집' : '신규 필수 공지사항 작성 배포'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 모달 본문 (스크롤 지원) */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 제목 및 공지 성격 설정 */}
                <div className="form-grid" style={{ gap: '16px' }}>
                  <div className="form-group col-8">
                    <label className="form-label">공지사항 제목</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={currentNotice.title || ''}
                      onChange={handleInputChange}
                      placeholder="예: [필수] 2026 YBBF 계체 및 복장 관련 규정 동의서"
                      required
                    />
                  </div>

                  <div className="form-group col-4" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        name="isMandatory"
                        checked={currentNotice.isMandatory || false}
                        onChange={handleCheckboxChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ color: currentNotice.isMandatory ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                        접수 시 필수 동의 대상 지정
                      </span>
                    </label>
                  </div>
                </div>

                {/* 상세 본문 */}
                <div className="form-group">
                  <label className="form-label">공지 상세 설명 본문 (HTML 지원)</label>
                  <textarea
                    name="content"
                    className="form-control"
                    value={currentNotice.content || ''}
                    onChange={handleInputChange}
                    placeholder="선수들에게 고지할 상세한 약관이나 규정을 작성해 주십시오. HTML 코드를 지원합니다."
                    style={{ minHeight: '160px', lineHeight: '1.5' }}
                    required
                  />
                </div>

                {/* 우선순위 및 유튜브 주소 */}
                <div className="form-grid" style={{ gap: '16px' }}>
                  <div className="form-group col-4">
                    <label className="form-label">노출 우선순위 (sortOrder)</label>
                    <input
                      type="number"
                      name="sortOrder"
                      className="form-control"
                      value={currentNotice.sortOrder || 0}
                      onChange={handleInputChange}
                      placeholder="낮을수록 먼저 노출"
                    />
                  </div>

                  <div className="form-group col-8">
                    <label className="form-label">유튜브 동영상 주소 (선택)</label>
                    <input
                      type="text"
                      name="youtubeUrl"
                      className="form-control"
                      value={currentNotice.youtubeUrl || ''}
                      onChange={handleInputChange}
                      placeholder="예: https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                {/* 비디오 및 오디오 파일 업로드 (R2 연동) */}
                <div className="form-grid" style={{ gap: '20px', borderTop: '1px solid var(--color-divider)', paddingTop: '20px' }}>
                  {/* 동영상 업로드 */}
                  <div className="form-group col-6">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>설명용 비디오 파일 (.mp4 등)</span>
                      
                      {/* 세로형 마커 체크박스 제공 */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'normal', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isVerticalVideo}
                          onChange={(e) => setIsVerticalVideo(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>세로형 비율 (9:16 #vertical)</span>
                      </label>
                    </label>

                    <div className="upload-wrapper" style={{ margin: '8px 0' }}>
                      <label className="upload-btn-label">
                        <Upload size={12} style={{ marginRight: '6px' }} />
                        비디오 파일 선택 업로드
                        <input
                          type="file"
                          className="upload-file-input"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'video')}
                          disabled={uploadProgress.type !== null}
                        />
                      </label>
                      {uploadProgress.type === 'video' && <Loader className="animate-spin" size={14} style={{ marginLeft: '8px' }} />}
                    </div>

                    <input
                      type="text"
                      name="videoUrl"
                      className="form-control"
                      value={currentNotice.videoUrl || ''}
                      onChange={handleInputChange}
                      placeholder="업로드된 비디오 URL 주소"
                      style={{ fontSize: '12px' }}
                    />
                  </div>

                  {/* 음성 설명 파일 업로드 */}
                  <div className="form-group col-6">
                    <label className="form-label">안내용 오디오 파일 (.mp3 등)</label>
                    
                    <div className="upload-wrapper" style={{ margin: '8px 0' }}>
                      <label className="upload-btn-label">
                        <Upload size={12} style={{ marginRight: '6px' }} />
                        오디오 파일 선택 업로드
                        <input
                          type="file"
                          className="upload-file-input"
                          accept="audio/*"
                          onChange={(e) => handleFileUpload(e, 'audio')}
                          disabled={uploadProgress.type !== null}
                        />
                      </label>
                      {uploadProgress.type === 'audio' && <Loader className="animate-spin" size={14} style={{ marginLeft: '8px' }} />}
                    </div>

                    <input
                      type="text"
                      name="audioUrl"
                      className="form-control"
                      value={currentNotice.audioUrl || ''}
                      onChange={handleInputChange}
                      placeholder="업로드된 오디오 URL 주소"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* 다중 설명 이미지(images) 업로드 */}
                <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '20px' }}>
                  <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    규정/설명용 다중 이미지 등록 (설명 카드뉴스 등)
                  </label>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <label className="upload-btn-label" style={{ display: 'flex', alignItems: 'center' }}>
                      <Upload size={12} style={{ marginRight: '6px' }} />
                      R2 사진 추가 업로드
                      <input
                        type="file"
                        className="upload-file-input"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'images')}
                        disabled={uploadProgress.type !== null}
                      />
                    </label>
                    {uploadProgress.type === 'images' && <Loader className="animate-spin" size={14} />}

                    <div style={{ flex: 1, display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="외부 주소 수동 등록"
                        className="form-control"
                        value={manualImageInput}
                        onChange={(e) => setManualImageInput(e.target.value)}
                        style={{ height: '36px' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={addManualImage}
                        style={{ height: '36px', padding: '0 12px' }}
                      >
                        추가
                      </button>
                    </div>
                  </div>

                  {/* 등록된 사진 리스트 및 순서 제어 UI */}
                  {currentNotice.images && currentNotice.images.length > 0 && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                      gap: '12px',
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-divider)'
                    }}>
                      {currentNotice.images.map((img, idx) => (
                        <div key={idx} style={{ 
                          position: 'relative', 
                          border: '1px solid var(--color-divider)', 
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          padding: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <img 
                            src={img} 
                            alt={`설명 ${idx + 1}`} 
                            style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{idx + 1}번</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button type="button" onClick={() => moveImage(idx, 'up')} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }} title="이전으로"><ArrowUp size={11} /></button>
                              <button type="button" onClick={() => moveImage(idx, 'down')} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }} title="다음으로"><ArrowDown size={11} /></button>
                              <button type="button" onClick={() => removeImage(idx)} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} title="삭제"><X size={11} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 첨부파일 리스트 추가 삭제 컨트롤 */}
                <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '20px', marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    공식 첨부 파일 연동 (대회 요강 서류, 출전 가이드 등)
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label className="upload-btn-label" style={{ display: 'flex', alignItems: 'center', height: '36px' }}>
                        <Upload size={12} style={{ marginRight: '6px' }} />
                        R2 파일 업로드 추가
                        <input
                          type="file"
                          className="upload-file-input"
                          onChange={(e) => handleFileUpload(e, 'attachments')}
                          disabled={uploadProgress.type !== null}
                        />
                      </label>
                      {uploadProgress.type === 'attachments' && <Loader className="animate-spin" size={14} />}

                      <div style={{ flex: 1, display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="수동 파일명 (예: 대회규칙.pdf)"
                          className="form-control"
                          value={manualAttachmentName}
                          onChange={(e) => setManualAttachmentName(e.target.value)}
                          style={{ height: '36px', flex: 1 }}
                        />
                        <input
                          type="text"
                          placeholder="수동 파일 다운로드 URL"
                          className="form-control"
                          value={manualAttachmentUrl}
                          onChange={(e) => setManualAttachmentUrl(e.target.value)}
                          style={{ height: '36px', flex: 2 }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={addManualAttachment}
                          style={{ height: '36px', padding: '0 12px' }}
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 첨부파일 테이블 리스트 */}
                  {currentNotice.attachments && currentNotice.attachments.length > 0 && (
                    <div style={{ 
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-divider)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {currentNotice.attachments.map((att, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--color-divider)',
                          padding: '8px 12px',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <strong style={{ color: 'var(--color-text-primary)' }}>{att.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-light)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>({att.url})</span>
                          </div>

                          <button 
                            type="button" 
                            onClick={() => removeAttachment(idx)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: 'var(--color-error)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </form>
            </div>

            {/* 모달 하단 버튼 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--color-divider)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                취소
              </button>
              
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={isSaving || uploadProgress.type !== null}
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin" size={14} style={{ marginRight: '6px' }} />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} style={{ marginRight: '6px' }} />
                    <span>{isEditing ? '공지 수정 완료' : '공지 즉시 배포'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
