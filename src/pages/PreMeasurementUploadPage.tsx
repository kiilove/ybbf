import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  AlertTriangle, 
  ChevronLeft, 
  ExternalLink,
  Loader2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUploadToR2 } from '../hooks/useUploadToR2';
import { getUserInvoices } from '../services/registrationService';
import Loader from '../components/shared/Loader';

interface InvoiceContest {
  contestId: string;
  contestTitle: string;
}

interface PreMeasurementData {
  id: string;
  contestId: string;
  playerUid: string;
  playerName: string;
  playerTel: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  createdAt: string;
}

export default function PreMeasurementUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuthStore();
  const { uploadPlayerPhotoToR2, isUploadingToR2 } = useUploadToR2();

  // 상태 관리
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 사용자가 참가한 대회 목록
  const [userContests, setUserContests] = useState<InvoiceContest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>('');

  // 사전계측 자격 및 제출 정보
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<PreMeasurementData | null>(null);

  // 업로드용 파일 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // 성공 알림 모달 상태
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // 커스텀 메시지 박스 상태
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showAlert = (message: string, title: string = '안내') => {
    setAlertState({ isOpen: true, title, message });
  };

  // 1. 비로그인 유저 리다이렉트
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  // 2. 사용자가 신청한 대회 목록 조회
  useEffect(() => {
    if (!user) return;

    async function loadUserInvoices() {
      setInvoicesLoading(true);
      setError(null);
      try {
        const data = await getUserInvoices(user.uid);
        // 취소되지 않은 접수서 중 대회 ID/명칭 중복 제거 추출
        const activeInvoices = data.filter(inv => inv.isCanceled !== true);
        
        const contestsMap = new Map<string, string>();
        activeInvoices.forEach(inv => {
          if (inv.contestId && inv.contestTitle) {
            contestsMap.set(inv.contestId, inv.contestTitle);
          }
        });

        const list: InvoiceContest[] = [];
        contestsMap.forEach((contestTitle, contestId) => {
          list.push({ contestId, contestTitle });
        });

        setUserContests(list);

        // URL 쿼리 파라미터에 contestId가 있고, 자격 목록에 존재할 경우 자동 바인딩
        const queryContestId = searchParams.get('contestId');
        if (queryContestId && contestsMap.has(queryContestId)) {
          setSelectedContestId(queryContestId);
        } else if (list.length > 0) {
          // 쿼리 파라미터가 없으면 가장 첫 번째 대회를 기본 선택
          setSelectedContestId(list[0].contestId);
        }
      } catch (err: any) {
        console.error('사용자 접수 내역 로드 실패:', err);
        setError('참가 신청 내역을 조회하는 중 오류가 발생했습니다.');
      } finally {
        setInvoicesLoading(false);
      }
    }
    loadUserInvoices();
  }, [user, searchParams]);

  // 3. 선택된 대회별 사전계측 상태 조회
  useEffect(() => {
    if (!user || !selectedContestId) {
      setIsRegistered(false);
      setIsSubmitted(false);
      setSubmittedData(null);
      return;
    }

    async function fetchMeasurementStatus() {
      setStatusLoading(true);
      setError(null);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '';
        const res = await fetch(
          `${backendUrl}/api/pre-measurement/status?contestId=${selectedContestId}&playerUid=${user.uid}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error('사전계측 자격 상태 조회가 실패했습니다.');
        }

        const data = await res.json();
        setIsRegistered(!!data.registered);
        setIsSubmitted(!!data.submitted);
        setSubmittedData(data.data || null);
        
        // 기존 선택한 파일/프리뷰 초기화
        setSelectedFile(null);
        if (filePreview && filePreview.startsWith('blob:')) {
          URL.revokeObjectURL(filePreview);
        }
        setFilePreview(null);
      } catch (err: any) {
        console.error('사전계측 상태 조회 오류:', err);
        setError('사전계측 접수 여부 확인 중 문제가 발생했습니다.');
      } finally {
        setStatusLoading(false);
      }
    }

    fetchMeasurementStatus();
  }, [user, selectedContestId]);

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i.test(file.name);

    if (!isVideo && !isImage) {
      showAlert('사전계측 자료는 동영상(MP4, MOV 등) 또는 이미지(PNG, JPG, HEIC 등) 파일만 업로드 가능합니다.', '파일 형식 오류');
      return;
    }

    // 용량 제한: 비디오는 50MB, 이미지는 30MB
    const maxSize = isVideo ? 50 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > maxSize) {
      showAlert(
        `파일 크기가 너무 큽니다. (${isVideo ? '동영상 최대 50MB' : '이미지 최대 30MB'})`,
        '용량 제한 초과'
      );
      return;
    }

    setSelectedFile(file);
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
  };

  // 사전계측 최종 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContestId || !selectedFile) return;

    setIsSubmitting(true);
    setError(null);

    let mediaUrl = '';
    const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';

    try {
      // 1. R2 미디어 스토리지에 업로드
      mediaUrl = await uploadPlayerPhotoToR2(selectedFile, 'pre_measurements', true);

      // 2. 백엔드 D1 API에 사전계측 최종 적재 요청
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '';
      const payload = {
        contestId: selectedContestId,
        playerUid: user.uid,
        playerName: user.profile?.name || '선수',
        playerTel: user.profile?.tel || '',
        mediaUrl,
        mediaType
      };

      const res = await fetch(`${backendUrl}/api/pre-measurement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '계측 데이터 저장 중 서버 에러가 발생했습니다.');
      }

      // 성공 처리 및 상태 동기화 리로드
      setIsSuccessModalOpen(true);
      setIsSubmitted(true);
      setSubmittedData({
        id: `${selectedContestId}_${user.uid}`,
        contestId: selectedContestId,
        playerUid: user.uid,
        playerName: payload.playerName,
        playerTel: payload.playerTel,
        mediaUrl,
        mediaType,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      setSelectedFile(null);
      setFilePreview(null);
    } catch (err: any) {
      console.error('사전계측 제출 오류:', err);
      setError(err.message || '사전계측 자료 제출 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPageLoading = isAuthLoading || invoicesLoading;

  if (isPageLoading) {
    return <Loader isLoading={isPageLoading} />;
  }

  return (
    <div className="pt-28 pb-24 px-4 md:px-12 max-w-[800px] mx-auto min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden font-sans">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span className="text-[10px] text-accent font-bold tracking-wider uppercase font-mono">사전계측 미디어 제출</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black mb-3 tracking-tight text-white uppercase">
          사전계측 <span className="text-accent">자료 제출처</span>
        </h1>
        <p className="text-white/60 text-xs md:text-sm font-sans max-w-lg mx-auto break-keep leading-relaxed">
          대회 참가 선수는 본인의 실계측 증빙을 위한 영상 또는 고해상도 사진 자료를 아래 접수처에 기한 내에 업로드해 주시기 바랍니다.
        </p>
      </div>

      {userContests.length === 0 ? (
        // 신청 완료 내역이 아예 없는 비적격 선수 화면
        <div className="bg-[#161a16] border border-white/10 rounded-2xl p-8 md:p-12 text-center shadow-xl">
          <ShieldAlert className="w-16 h-16 text-red-500/80 mx-auto mb-6 animate-pulse" />
          <h3 className="text-lg md:text-xl font-bold text-white mb-2.5">참가 신청 내역이 확인되지 않습니다.</h3>
          <p className="text-xs md:text-sm text-white/50 leading-relaxed mb-8 max-w-md mx-auto break-keep">
            사전계측 자료를 제출하기 위해서는 먼저 용인시 보디빌딩협회 대회 참가 신청을 완료하고 입금 대기/확인 상태에 있어야 합니다.
          </p>
          <button
            onClick={() => navigate('/competition')}
            className="bg-accent hover:bg-white text-black font-black text-xs px-6 py-3.5 rounded-lg transition-colors cursor-pointer shadow-md shadow-accent/25"
          >
            공식 대회 접수처 바로가기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 대회 선택 셀렉터 카드 */}
          <div className="bg-[#161a16] border border-white/10 rounded-xl p-5 md:p-6 shadow-lg">
            <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
              대상 출전 대회 선택 <span className="text-accent">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedContestId}
                onChange={(e) => setSelectedContestId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 focus:border-accent rounded-lg px-4 py-3 text-white focus:outline-none text-xs md:text-sm font-bold appearance-none cursor-pointer transition-all"
              >
                {userContests.map((c) => (
                  <option key={c.contestId} value={c.contestId}>
                    {c.contestTitle}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                ▼
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-6 py-4 rounded-xl text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusLoading ? (
            <div className="text-center py-20 bg-[#161a16] border border-white/5 rounded-xl">
              <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
              <p className="text-xs text-white/40 font-mono">자격 여부 확인 중...</p>
            </div>
          ) : (
            <>
              {/* 기제출된 자료 표시 영역 */}
              {isSubmitted && submittedData && (
                <div className="bg-[#161a16]/40 border border-accent/20 rounded-xl p-5 md:p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">사전계측 자료 제출 완료</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {/* 미디어 미리보기 */}
                    <div className="relative aspect-video bg-black rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                      {submittedData.mediaType === 'video' ? (
                        <video
                          src={submittedData.mediaUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={submittedData.mediaUrl}
                          alt="제출된 사전계측 사진"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* 제출 메타데이터 정보 */}
                    <div className="flex flex-col justify-between space-y-4 text-xs">
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4 space-y-3 font-sans text-white/80">
                        <div className="flex justify-between">
                          <span className="text-white/40">선수 성명</span>
                          <span className="font-bold text-white">{submittedData.playerName}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2">
                          <span className="text-white/40">연락처</span>
                          <span className="font-mono text-white">{submittedData.playerTel || '-'}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2">
                          <span className="text-white/40">미디어 포맷</span>
                          <span className="font-bold text-accent uppercase font-mono">{submittedData.mediaType}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2">
                          <span className="text-white/40">제출 시각</span>
                          <span className="font-mono text-white/60">{submittedData.createdAt}</span>
                        </div>
                      </div>

                      <div className="text-[10px] md:text-xs text-white/40 leading-relaxed break-keep">
                        💡 **이미 한 차례 계측 자료를 제출하셨습니다.**<br />
                        자료의 보정이나 교체가 필요할 경우, 아래 업로드 폼을 통해 다시 파일을 등록하고 제출하시면 **기존 제출 자료가 자동으로 덮어써집니다.**
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 자격 검증 실패 시 화면 */}
              {!isRegistered && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 text-center space-y-3">
                  <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                  <h4 className="text-sm md:text-base font-bold text-white">이 대회에 참가 접수된 내역을 찾을 수 없습니다.</h4>
                  <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto break-keep">
                    선수님의 UID 정보와 해당 대회의 접수 테이블 매칭에 실패했습니다. 타 대회를 선택하시거나 마이페이지의 접수 내역을 다시 한 번 확인해 주십시오.
                  </p>
                </div>
              )}

              {/* 업로드 및 제출 폼 (자격이 있을 때만 활성화) */}
              {isRegistered && (
                <form onSubmit={handleSubmit} className="bg-[#161a16] border border-white/10 rounded-xl p-5 md:p-8 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-2">
                      <Upload className="w-4 h-4 text-accent" />
                      <span>새로운 사전계측 증빙 파일 선택</span>
                    </h3>
                    <p className="text-[11px] md:text-xs text-white/50 leading-relaxed break-keep font-sans">
                      체중/골격근량 등 계측 화면이 선명하게 보이도록 촬영된 영상(최대 50MB) 또는 계측 사진 이미지(최대 10MB) 파일을 드래그하여 올려주세요.
                    </p>
                  </div>

                  {/* 드래그 앤 드롭 영역 */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 transition-all flex flex-col items-center justify-center bg-[#0a0a0a]/50 ${
                      isDragActive 
                        ? 'border-accent bg-accent/5' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <label className="cursor-pointer flex flex-col items-center text-center p-4 w-full">
                      <div className="w-12 h-12 bg-[#1d1f1d] border border-white/10 rounded-full flex items-center justify-center mb-3 text-white/45 hover:text-accent transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white block mb-1">드래그 앤 드롭하거나 클릭하여 파일 선택</span>
                      <span className="text-[10px] md:text-xs text-white/40 block leading-relaxed mb-3">
                        동영상 파일(MP4 등, 최대 50MB) 또는 이미지 파일(PNG, JPG, 최대 10MB)
                      </span>
                      <span className="inline-block bg-[#1d1f1d] hover:bg-accent hover:text-black text-white border border-white/10 px-5 py-2.5 rounded text-[10px] md:text-xs font-bold transition-all text-center">
                        파일 찾기
                      </span>
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 프리뷰 영역 */}
                  {filePreview && selectedFile && (
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 relative font-sans">
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 p-1.5 rounded-full border border-white/10 transition cursor-pointer"
                        title="파일 제거"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[9px] font-mono text-accent/80 font-bold uppercase tracking-widest block mb-2">선택된 파일 프리뷰</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/5">
                          {selectedFile.type.startsWith('video/') ? (
                            <video src={filePreview} controls className="w-full h-full object-contain" />
                          ) : (
                            <img src={filePreview} alt="로컬 프리뷰" className="w-full h-full object-contain" />
                          )}
                        </div>

                        <div className="text-xs space-y-2 text-white/70">
                          <p className="text-white font-bold truncate">파일명: {selectedFile.name}</p>
                          <p>크기: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <p className="uppercase">포맷: {selectedFile.type.split('/')[1]}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 서브밋 버튼 */}
                  <div className="pt-4 border-t border-white/10 flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => navigate('/mypage')}
                      className="px-5 py-3.5 rounded-lg text-xs font-bold bg-[#0a0a0a] hover:bg-[#1d1f1d] border border-white/10 text-white transition-all cursor-pointer"
                    >
                      마이페이지로 돌아가기
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploadingToR2 || !selectedFile}
                      className={`px-8 py-3.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        selectedFile && !isSubmitting && !isUploadingToR2
                          ? 'bg-accent text-black hover:bg-white hover:scale-[1.03] active:scale-95 shadow-md shadow-accent/25 cursor-pointer'
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {isSubmitting || isUploadingToR2 ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          <span>제출 중...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4.5 h-4.5" />
                          <span>사전계측자료 제출하기</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* 성공 안내 모달 */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#161a16] border border-white/10 rounded-xl max-w-[380px] w-full p-6 relative shadow-2xl">
            <div className="text-center">
              <div className="w-11 h-11 bg-accent/10 border border-accent rounded-full flex items-center justify-center mx-auto mb-3.5 text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              
              <h4 className="text-sm md:text-base font-bold text-white mb-2.5 tracking-tight">
                제출 완료
              </h4>
              
              <p className="text-xs md:text-sm text-white/85 leading-relaxed break-keep mb-5.5">
                사전계측자료가 성공적으로 백엔드 서버에 최종 적재되었습니다.<br />
                제출된 내용은 협회 운영국에서 안전하게 검토할 예정입니다.
              </p>
              
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full bg-accent hover:bg-white text-black font-black py-3 rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT DIALOG */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[1001] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-[#161a16] border border-white/10 rounded-xl max-w-[350px] w-full p-6 relative shadow-2xl">
            <div className="text-center font-sans">
              <div className="w-11 h-11 bg-red-950/30 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3.5 text-red-400">
                <AlertTriangle className="w-5.5 h-5.5" />
              </div>
              <h4 className="text-sm md:text-base font-bold text-white mb-2.5">{alertState.title}</h4>
              <p className="text-xs text-white/70 leading-relaxed mb-6 break-keep">{alertState.message}</p>
              <button
                type="button"
                onClick={() => setAlertState({ isOpen: false, title: '', message: '' })}
                className="w-full bg-[#1d1f1d] hover:bg-white hover:text-black border border-white/10 text-white font-bold py-3 rounded-lg text-xs transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
