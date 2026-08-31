import { useEffect, useState, useRef } from 'react';
import { 
  sponsorAdminService, 
  type SponsorItem, 
  type ContestSponsorDoc
} from '../services/sponsorService';
import { adminService } from '../services/adminService';
import { Link } from 'react-router-dom';
import { 
  Building2, Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  Video as VideoIcon, Search, AlertCircle, RefreshCw, Save, X, 
  Upload, Loader2, Play, Globe, Camera, Video,
  MapPin, UserCheck, Award
} from 'lucide-react';

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DIAMOND: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  PLATINUM: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
  GOLD: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  OFFICIAL: { bg: '#ecfdf5', text: '#047857', border: '#6ee7b7' },
  PARTNER: { bg: '#fdf4ff', text: '#86198f', border: '#f0abfc' },
};

export default function SponsorManagerPage() {
  const [docList, setDocList] = useState<ContestSponsorDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('4MjEfgsT3RLem16FUHW8');
  const [currentDoc, setCurrentDoc] = useState<ContestSponsorDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 모달 상태 & 탭
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'media' | 'contact' | 'socials'>('basic');
  const [editingSponsor, setEditingSponsor] = useState<SponsorItem | null>(null);
  const [formData, setFormData] = useState<Partial<SponsorItem>>({
    name: '',
    tag: 'OFFICIAL',
    slogan: '',
    desc: '',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    mediaType: 'IMAGE',
    status: 'active',
    durationSeconds: 5,
    weight: 1,
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    businessNumber: '',
    socials: {
      homepage: '',
      instagram: '',
      youtube: '',
      tiktok: '',
      x: '',
      facebook: '',
      blog: ''
    }
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllDocs();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      loadDocSponsors(selectedDocId);
    }
  }, [selectedDocId]);

  async function loadAllDocs() {
    setLoading(true);
    try {
      const list = await sponsorAdminService.getAllSponsorDocs();
      setDocList(list);
      
      const defaultDoc = list.find(d => d.contestId === 'vEsEClzzEHCnZ1d8azo1') || list[0];
      if (defaultDoc) {
        setSelectedDocId(defaultDoc.docId);
        setCurrentDoc(defaultDoc);
      }
    } catch (err) {
      alert('스폰서 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDocSponsors(docId: string) {
    setLoading(true);
    try {
      const docData = await sponsorAdminService.getSponsorDoc(docId);
      setCurrentDoc(docData);
    } catch (err) {
      console.error('문서 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }

  // 로고 파일 직접 업로드 처리
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, SVG, WEBP 등)만 업로드 가능합니다.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const uploadedUrl = await adminService.uploadImage(file, `sponsor-logo-${Date.now()}`);
      setFormData(prev => ({
        ...prev,
        imageUrl: uploadedUrl
      }));
    } catch (err: any) {
      console.error('로고 업로드 실패:', err);
      alert('로고 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // 모달 열기 (신규/수정)
  const handleOpenModal = (sponsor?: SponsorItem) => {
    setActiveModalTab('basic');
    if (sponsor) {
      setEditingSponsor(sponsor);
      setFormData({
        ...sponsor,
        socials: {
          homepage: sponsor.socials?.homepage || sponsor.linkUrl || '',
          instagram: sponsor.socials?.instagram || '',
          youtube: sponsor.socials?.youtube || '',
          tiktok: sponsor.socials?.tiktok || '',
          x: sponsor.socials?.x || '',
          facebook: sponsor.socials?.facebook || '',
          blog: sponsor.socials?.blog || ''
        }
      });
    } else {
      setEditingSponsor(null);
      setFormData({
        name: '',
        tag: 'OFFICIAL',
        slogan: '',
        desc: '',
        imageUrl: '',
        videoUrl: '',
        linkUrl: '',
        mediaType: 'IMAGE',
        status: 'active',
        durationSeconds: 5,
        weight: 1,
        address: '',
        contactPerson: '',
        phone: '',
        email: '',
        businessNumber: '',
        socials: {
          homepage: '',
          instagram: '',
          youtube: '',
          tiktok: '',
          x: '',
          facebook: '',
          blog: ''
        }
      });
    }
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSponsor(null);
  };

  // 스폰서 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('스폰서명을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<SponsorItem> = {
        ...formData,
        linkUrl: formData.socials?.homepage || formData.linkUrl || ''
      };

      if (editingSponsor) {
        await sponsorAdminService.updateSponsor(selectedDocId, editingSponsor.id, payload);
      } else {
        await sponsorAdminService.addSponsor(selectedDocId, payload as Omit<SponsorItem, 'id'>);
      }
      await loadDocSponsors(selectedDocId);
      handleCloseModal();
    } catch (err) {
      alert('스폰서 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 상태 토글
  const handleToggleStatus = async (sponsor: SponsorItem) => {
    const nextStatus = sponsor.status === 'active' ? 'expired' : 'active';
    const msg = nextStatus === 'active' 
      ? `[${sponsor.name}] 스폰서를 메인 웹에 '노출 활성' 상태로 변경하시겠습니까?`
      : `[${sponsor.name}] 스폰서를 '기한 종료(비노출)' 상태로 변경하시겠습니까?`;
    
    if (window.confirm(msg)) {
      try {
        await sponsorAdminService.toggleSponsorStatus(selectedDocId, sponsor.id, nextStatus);
        if (currentDoc) {
          setCurrentDoc({
            ...currentDoc,
            sponsors: currentDoc.sponsors.map(s => s.id === sponsor.id ? { ...s, status: nextStatus } : s)
          });
        }
      } catch (err) {
        alert('상태 변경 실패');
      }
    }
  };

  // 스폰서 삭제
  const handleDelete = async (sponsor: SponsorItem) => {
    if (window.confirm(`[${sponsor.name}] 스폰서를 정말 삭제하시겠습니까?`)) {
      try {
        await sponsorAdminService.deleteSponsor(selectedDocId, sponsor.id);
        if (currentDoc) {
          setCurrentDoc({
            ...currentDoc,
            sponsors: currentDoc.sponsors.filter(s => s.id !== sponsor.id)
          });
        }
      } catch (err) {
        alert('스폰서 삭제 실패');
      }
    }
  };

  const sponsors = currentDoc?.sponsors || [];

  // 필터링
  const filteredSponsors = sponsors.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.slogan && s.slogan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchTag = selectedTag === 'ALL' || s.tag === selectedTag;
    const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchSearch && matchTag && matchStatus;
  });

  const activeCount = sponsors.filter(s => s.status === 'active').length;
  const expiredCount = sponsors.filter(s => s.status === 'expired' || s.status === 'inactive').length;
  const videoSponsorCount = sponsors.filter(s => s.videoUrl).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* ═══ 상단 헤더 ═══ */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Building2 size={24} color="#0f172a" />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              스폰서 & 공식 파트너 통합 관리
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            로고, 주소, 담당자 연락처, 그리고 <strong>홈페이지·인스타그램·유튜브·틱톡·X·페이스북·블로그</strong> 등 다채널 소셜 링크를 통합 관리합니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => loadDocSponsors(selectedDocId)} 
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          
          <Link
            to="/sponsor-reports"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <Award size={16} /> 광고노출 성과 리포트 발급 센터
          </Link>

          <button 
            onClick={() => handleOpenModal()} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)'
            }}
          >
            <Plus size={16} /> 신규 스폰서 추가
          </button>
        </div>
      </div>

      {/* ═══ 대회 선택 바 ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        backgroundColor: '#f8fafc',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
          관리 대상 대회:
        </span>
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0f172a',
            outline: 'none',
            minWidth: '320px'
          }}
        >
          {docList.map(d => (
            <option key={d.docId} value={d.docId}>
              {d.contestId === 'vEsEClzzEHCnZ1d8azo1' 
                ? `🏆 제9회 용인특례시 대회 (${d.sponsors.length}개 협찬사)`
                : `대회: ${d.contestId} (${d.sponsors.length}개 협찬사)`}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          총 {sponsors.length}개 스폰서 등록됨 (동영상 광고주: {videoSponsorCount}개)
        </span>
      </div>

      {/* ═══ 통계 요약 바 ═══ */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>총 등록 스폰서</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{sponsors.length}개</h3>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>현재 노출 활성</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#065f46' }}>{activeCount}개</h3>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>기한 만료 / 비활성</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#991b1b' }}>{expiredCount}개</h3>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>동영상 광고 보유</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#1e40af' }}>
            {videoSponsorCount}개
          </h3>
        </div>
      </div>

      {/* ═══ 필터 & 검색 바 ═══ */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '16px',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'DIAMOND', 'PLATINUM', 'GOLD', 'OFFICIAL', 'PARTNER'].map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: selectedTag === tag ? '1px solid #0f172a' : '1px solid #e2e8f0',
                backgroundColor: selectedTag === tag ? '#0f172a' : '#f8fafc',
                color: selectedTag === tag ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {tag === 'ALL' ? '전체 등급' : tag}
            </button>
          ))}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1', margin: '0 4px' }} />

          {['ALL', 'active', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: selectedStatus === status ? '1px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: selectedStatus === status ? '#2563eb' : '#ffffff',
                color: selectedStatus === status ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {status === 'ALL' ? '전체 상태' : status === 'active' ? '🟢 노출 활성' : '🔴 기한 종료'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="스폰서명, 슬로건, 주소, 담당자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ═══ 스폰서 카드 목록 그리드 ═══ */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #cbd5e1', 
            borderTopColor: '#0f172a', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px' 
          }} />
          스폰서 명단을 불러오는 중입니다...
        </div>
      ) : filteredSponsors.length === 0 ? (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          backgroundColor: '#f8fafc', 
          borderRadius: '12px', 
          border: '1px dashed #cbd5e1',
          color: '#64748b' 
        }}>
          <AlertCircle size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>검색 조건에 일치하는 스폰서가 없습니다.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
          gap: '18px' 
        }}>
          {filteredSponsors.map((sponsor) => {
            const tagStyle = TAG_COLORS[sponsor.tag] || TAG_COLORS.OFFICIAL;
            const isActive = sponsor.status === 'active';
            const hasVideo = !!sponsor.videoUrl;
            const hasLogo = !!sponsor.imageUrl;
            const socials = sponsor.socials || {};

            return (
              <div 
                key={sponsor.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: isActive ? '1px solid #e2e8f0' : '1px solid #fecaca',
                  opacity: isActive ? 1 : 0.75,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* 상단 뱃지 & 상태 토글 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: tagStyle.bg,
                        color: tagStyle.text,
                        border: `1px solid ${tagStyle.border}`
                      }}>
                        {sponsor.tag}
                      </span>

                      {hasVideo && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 6px',
                          borderRadius: '6px',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <VideoIcon size={11} /> 동영상
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleStatus(sponsor)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: 'none',
                        backgroundColor: isActive ? '#ecfdf5' : '#fef2f2',
                        color: isActive ? '#059669' : '#dc2626',
                        cursor: 'pointer'
                      }}
                      title="클릭하여 노출 상태 변경"
                    >
                      {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {isActive ? '노출 활성' : '기한 종료'}
                    </button>
                  </div>

                  {/* 로고 미리보기 */}
                  <div style={{ 
                    height: '84px', 
                    borderRadius: '10px', 
                    backgroundColor: '#0a0a0f', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '14px',
                    padding: '8px',
                    position: 'relative'
                  }}>
                    {hasLogo ? (
                      <img 
                        src={sponsor.imageUrl} 
                        alt={sponsor.name} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : hasVideo ? (
                      <button
                        onClick={() => handleOpenModal(sponsor)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(180, 255, 0, 0.15)',
                          border: '1px dashed #b4ff00',
                          color: '#b4ff00',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Upload size={13} /> 웹 노출용 로고 등록하기
                      </button>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '12px' }}>로고 이미지 미등록</div>
                    )}
                  </div>

                  {/* 스폰서명 & 슬로건 */}
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    {sponsor.name}
                  </h3>
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    lineHeight: '1.4',
                    minHeight: '28px'
                  }}>
                    {sponsor.slogan || sponsor.desc || '슬로건 미등록'}
                  </p>

                  {/* 담당자 & 연락처 & 주소 칩 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '5px', 
                    padding: '10px 12px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#475569',
                    marginBottom: '12px'
                  }}>
                    {(sponsor.contactPerson || sponsor.phone) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={13} color="#2563eb" />
                        <span><strong>담당:</strong> {sponsor.contactPerson || '미기재'}</span>
                        {sponsor.phone && (
                          <span style={{ color: '#047857', fontWeight: 700, marginLeft: '4px' }}>
                            📞 {sponsor.phone}
                          </span>
                        )}
                      </div>
                    )}

                    {sponsor.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="#dc2626" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sponsor.address}
                        </span>
                      </div>
                    )}

                    {!sponsor.contactPerson && !sponsor.phone && !sponsor.address && (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        담당자 및 주소 정보 미입력 (수정 버튼을 눌러 입력하세요)
                      </span>
                    )}
                  </div>

                  {/* SNS 채널 뱃지 바 */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {socials.homepage && (
                      <a href={socials.homepage} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        🌐 홈피
                      </a>
                    )}
                    {socials.instagram && (
                      <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#fdf2f8', color: '#db2777', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        📸 인스타
                      </a>
                    )}
                    {socials.youtube && (
                      <a href={socials.youtube} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        📺 유튜브
                      </a>
                    )}
                    {socials.tiktok && (
                      <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        🎵 틱톡
                      </a>
                    )}
                    {socials.x && (
                      <a href={socials.x} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        𝕏 X
                      </a>
                    )}
                    {socials.facebook && (
                      <a href={socials.facebook} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        📘 페북
                      </a>
                    )}
                    {socials.blog && (
                      <a href={socials.blog} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 7px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        📝 블로그
                      </a>
                    )}
                  </div>
                </div>

                {/* 하단 제어 바 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '14px',
                  marginTop: '6px'
                }}>
                  <div>
                    {hasVideo && (
                      <a
                        href={sponsor.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 700 }}
                      >
                        <Play size={11} /> 전광판 영상
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link
                      to={`/sponsor-reports?id=${sponsor.id}`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="이 협찬사의 광고노출 성과 리포트 발급"
                    >
                      <Award size={13} /> 성과 리포트
                    </Link>

                    <button
                      onClick={() => handleOpenModal(sponsor)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={12} /> 수정
                    </button>

                    <button
                      onClick={() => handleDelete(sponsor)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ 스폰서 등록 / 수정 고도화 모달 ═══ */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {editingSponsor ? `스폰서 상세 정보 수정 (${formData.name})` : '신규 스폰서 & 파트너 등록'}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  로고, 담당자 연락처, 주소 및 멀티 소셜 SNS 링크를 모두 입력할 수 있습니다.
                </span>
              </div>
              <button onClick={handleCloseModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* 모달 탭 바 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '0 16px' }}>
              <button
                type="button"
                onClick={() => setActiveModalTab('basic')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: activeModalTab === 'basic' ? '2px solid #0f172a' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  fontWeight: activeModalTab === 'basic' ? 800 : 600,
                  color: activeModalTab === 'basic' ? '#0f172a' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                1. 기본 정보 & 등급
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('media')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: activeModalTab === 'media' ? '2px solid #0f172a' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  fontWeight: activeModalTab === 'media' ? 800 : 600,
                  color: activeModalTab === 'media' ? '#0f172a' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                2. 로고 & 동영상 소재
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('contact')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: activeModalTab === 'contact' ? '2px solid #0f172a' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  fontWeight: activeModalTab === 'contact' ? 800 : 600,
                  color: activeModalTab === 'contact' ? '#0f172a' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                3. 주소 & 담당자 연락처
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('socials')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: activeModalTab === 'socials' ? '2px solid #0f172a' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  fontWeight: activeModalTab === 'socials' ? 800 : 600,
                  color: activeModalTab === 'socials' ? '#0f172a' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                4. 다채널 SNS 링크
              </button>
            </div>

            {/* 모달 폼 본문 (스크롤) */}
            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* ═══ 탭 1: 기본 정보 & 등급 ═══ */}
              {activeModalTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      스폰서 / 협찬사명 <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="예) 웰손병원, 삼성치과, 용인스타짐 등"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        스폰서 등급
                      </label>
                      <select
                        value={formData.tag || 'OFFICIAL'}
                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="DIAMOND">DIAMOND 💎 (최고 메인 스폰서)</option>
                        <option value="PLATINUM">PLATINUM 🌟 (플래티넘)</option>
                        <option value="GOLD">GOLD 🥇 (골드)</option>
                        <option value="OFFICIAL">OFFICIAL 🛡️ (공식 협찬사)</option>
                        <option value="PARTNER">PARTNER 🤝 (공식 제휴사)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        노출 상태
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="active">🟢 노출 활성 (메인 웹 노출)</option>
                        <option value="expired">🔴 기한 종료 (노출 차단)</option>
                        <option value="inactive">⚪ 비활성</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      슬로건 / 한 줄 소개
                    </label>
                    <input
                      type="text"
                      value={formData.slogan || ''}
                      onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                      placeholder="예) 용인특례시 공식 파트너 병원"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      상세 소개 및 협찬 내용 / 혜택 안내
                    </label>
                    <textarea
                      rows={3}
                      value={formData.desc || ''}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      placeholder="선수단 전용 혜택, 협찬 제품 또는 기업 상세 소개..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ═══ 탭 2: 로고 & 동영상 소재 ═══ */}
              {activeModalTab === 'media' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* 로고 파일 업로드 */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        🖼️ 웹 노출용 로고 이미지 파일
                      </label>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {isUploadingLogo ? '로고 업로드 중...' : '내 PC에서 로고 파일 업로드'}
                      </button>

                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          로고 제거
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="또는 로고 이미지 링크(URL) 직접 입력..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    />

                    {formData.imageUrl && (
                      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#0a0a0f', borderRadius: '8px', textAlign: 'center' }}>
                        <img src={formData.imageUrl} alt="로고 미리보기" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>

                  {/* 동영상 소재 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      🎬 무대 전광판용 동영상 소재 URL (선택)
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://... 무대 전광판 동영상 mp4 링크"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ═══ 탭 3: 주소 & 담당자 연락처 ═══ */}
              {activeModalTab === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        협찬 / 제휴 담당자 성명 & 직책
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson || ''}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="예) 홍길동 부장 / 김대표 실장"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        대표 전화번호 / 문의처
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="예) 031-1234-5678, 010-0000-0000"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        공식 문의 이메일
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@sponsor.com"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        사업자등록번호 (선택)
                      </label>
                      <input
                        type="text"
                        value={formData.businessNumber || ''}
                        onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                        placeholder="123-45-67890"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      사업장 / 본사 / 센터 도로명 주소
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="예) 경기도 용인시 처인구 중부대로 1199"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ═══ 탭 4: 다채널 SNS & 공식 미디어 링크 ═══ */}
              {activeModalTab === 'socials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* 홈페이지 */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                      <Globe size={15} /> 공식 홈페이지 URL
                    </label>
                    <input
                      type="url"
                      value={formData.socials?.homepage || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socials: { ...formData.socials, homepage: e.target.value }
                      })}
                      placeholder="https://www.sponsor.com"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* 인스타그램 */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#db2777', marginBottom: '4px' }}>
                      <Camera size={15} /> 인스타그램 (URL 또는 @계정)
                    </label>
                    <input
                      type="text"
                      value={formData.socials?.instagram || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socials: { ...formData.socials, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/sponsor_official 또는 @sponsor_official"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* 유튜브 */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
                      <Video size={15} /> 유튜브 공식 채널 URL
                    </label>
                    <input
                      type="url"
                      value={formData.socials?.youtube || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socials: { ...formData.socials, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/@channel"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* 틱톡 & X */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        🎵 틱톡 채널 URL
                      </label>
                      <input
                        type="url"
                        value={formData.socials?.tiktok || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socials: { ...formData.socials, tiktok: e.target.value }
                        })}
                        placeholder="https://tiktok.com/@sponsor"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        𝕏 X (트위터) URL
                      </label>
                      <input
                        type="url"
                        value={formData.socials?.x || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socials: { ...formData.socials, x: e.target.value }
                        })}
                        placeholder="https://x.com/sponsor"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* 페이스북 & 네이버 블로그 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
                        📘 페이스북 페이지 URL
                      </label>
                      <input
                        type="url"
                        value={formData.socials?.facebook || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socials: { ...formData.socials, facebook: e.target.value }
                        })}
                        placeholder="https://facebook.com/sponsor"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                        📝 네이버 블로그 / 카카오 채널
                      </label>
                      <input
                        type="url"
                        value={formData.socials?.blog || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socials: { ...formData.socials, blog: e.target.value }
                        })}
                        placeholder="https://blog.naver.com/sponsor"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* 모달 하단 액션 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {activeModalTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'media' | 'contact' | 'socials'> = ['basic', 'media', 'contact', 'socials'];
                        const curIdx = tabs.indexOf(activeModalTab);
                        if (curIdx > 0) setActiveModalTab(tabs[curIdx - 1]);
                      }}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ← 이전 탭
                    </button>
                  )}
                  {activeModalTab !== 'socials' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'media' | 'contact' | 'socials'> = ['basic', 'media', 'contact', 'socials'];
                        const curIdx = tabs.indexOf(activeModalTab);
                        if (curIdx < tabs.length - 1) setActiveModalTab(tabs[curIdx + 1]);
                      }}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #0f172a', backgroundColor: '#0f172a', color: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      다음 탭 →
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploadingLogo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(4, 120, 87, 0.2)'
                    }}
                  >
                    <Save size={15} /> {isSaving ? '저장 중...' : '스폰서 저장하기'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
