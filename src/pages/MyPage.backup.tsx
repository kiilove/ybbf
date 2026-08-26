import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Building, 
  Phone, 
  LogOut, 
  Trophy, 
  ClipboardList, 
  CheckCircle, 
  Edit2, 
  Loader2, 
  ShieldAlert,
  ChevronRight,
  UserCheck,
  ChevronLeft,
  X,
  Check,
  Lock,
  ArrowRight,
  Sparkles,
  Upload,
  Dribbble,
  ShieldCheck,
  FileCheck,
  CreditCard,
  Copy,
  FileText,
  MapPin,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Video
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  getUserInvoices, 
  parseSafeDate,
  getContest,
  getCategoryList,
  getGradeList,
  getMandatoryNotices,
  updateHybridRegistration 
} from '../services/registrationService';
import { useUploadToR2 } from '../hooks/useUploadToR2';
import { UserProfile } from '../types/auth';
import Loader from '../components/shared/Loader';
import { 
  RegistrationPayload, 
  JoinItem,
  Category,
  Grade,
  MandatoryNotice
} from '../types/registration';

// 💡 날짜 표시용 로컬라이징 포맷터 (UTC -> KST 24시간제 변환)
const formatDisplayDate = (isoStr?: string, localStr?: string): string => {
  if (localStr) return localStr; // 기존 로컬 생성 시각 유지
  if (isoStr) {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }
  return '-';
};

// 💡 필수공지용 본문 스크롤 완독 검출기
interface NoticeScrollReaderProps {
  content: string;
  onReadComplete: () => void;
}

function NoticeScrollReader({ content, onReadComplete }: NoticeScrollReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isReadComplete, setIsReadComplete] = useState(false);

  useEffect(() => {
    setIsReadComplete(false);
  }, [content]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsReadComplete(true);
            onReadComplete();
          }
        });
      },
      {
        root: container,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [content, onReadComplete]);

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="max-h-[300px] overflow-y-auto overscroll-contain border border-white/10 p-5 rounded-lg bg-black/40 leading-relaxed text-white/80 text-xs md:text-sm font-sans relative"
      style={{ whiteSpace: 'pre-wrap' }}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <div ref={sentinelRef} className="h-1 w-full pointer-events-none" />
    </div>
  );
}

const PHOTO_SERVICE_PRICE = 60000;

// 💡 필수공지용 유튜브 플레이어
interface YouTubePlayerProps {
  url: string;
  onEnded: () => void;
}

function YouTubePlayer({ url, onEnded }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substring(2, 11)}`);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let player: any;
    
    const initPlayer = () => {
      let videoId = '';
      const cleanUrl = url.split('#')[0];
      if (cleanUrl.includes('youtu.be/')) {
        videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (cleanUrl.includes('youtube.com/watch')) {
        videoId = new URL(cleanUrl).searchParams.get('v') || '';
      } else if (cleanUrl.includes('youtube.com/shorts/')) {
        videoId = cleanUrl.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
      } else if (cleanUrl.includes('youtube.com/embed/')) {
        videoId = cleanUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }

      if (!videoId) return;

      // @ts-ignore
      player = new window.YT.Player(containerId.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        events: {
          // @ts-ignore
          onStateChange: (event: any) => {
            // @ts-ignore
            if (event.data === window.YT.PlayerState.PLAYING) {
              setHasStarted(true);
              onEnded(); // 유연한 진행을 위해 재생 시작 즉시 확인 완료로 처리
            }
            // @ts-ignore
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          }
        }
      });
      playerRef.current = player;
    };

    // @ts-ignore
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // @ts-ignore
      const prevCallback = window.onYouTubeIframeAPIReady;
      // @ts-ignore
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [url]);

  const isVertical = url.includes('#vertical') || url.includes('youtube.com/shorts/');

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 ${
      isVertical ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-[16/9] w-full'
    }`}>
      <div id={containerId.current} className="w-full h-full" />
    </div>
  );
}

// 💡 필수공지용 다중 이미지 캐러셀
interface ImageCarouselProps {
  images: string[];
  onAllViewed: () => void;
}

function ImageCarousel({ images, onAllViewed }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewedIndicesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    viewedIndicesRef.current.clear();
    if (images && images.length > 0) {
      viewedIndicesRef.current.add(0);
      if (viewedIndicesRef.current.size === images.length) {
        onAllViewed();
      }
    }
  }, [images, onAllViewed]);

  if (!images || images.length === 0) return null;

  const markAsViewed = (index: number) => {
    if (!viewedIndicesRef.current.has(index)) {
      viewedIndicesRef.current.add(index);
      if (viewedIndicesRef.current.size === images.length) {
        onAllViewed();
      }
    }
  };

  const handlePrev = () => {
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(nextIdx);
    markAsViewed(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    markAsViewed(nextIdx);
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
      <img
        src={images[currentIndex]}
        alt={`공지 이미지 ${currentIndex + 1}`}
        className="w-full h-full object-contain"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-accent w-3' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, completeAdditionalInfo, logout, isLoading: isAuthLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('history');
  const [invoices, setInvoices] = useState<RegistrationPayload[]>([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Profile edit form state
  const [profileData, setProfileData] = useState<UserProfile>({
    name: '',
    birth: '',
    tel: '',
    gym: '',
    gender: '',
  });

  const [validation, setValidation] = useState({
    name: false,
    birth: false,
    tel: false,
    gym: false,
    gender: false,
  });

  const [isValid, setIsValid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- 참가신청 수정(Editing) 관련 상태 변수 선언 ---
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<RegistrationPayload | null>(null);
  const [editStep, setEditStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [mandatoryNotices, setMandatoryNotices] = useState<MandatoryNotice[]>([]);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [scrollReadComplete, setScrollReadComplete] = useState(false);
  const [videoWatchedComplete, setVideoWatchedComplete] = useState(false);
  const [imagesViewedComplete, setImagesViewedComplete] = useState(false);
  const [agreedNoticeIds, setAgreedNoticeIds] = useState<string[]>([]);
  const [chkAllItem, setChkAllItem] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [photosList, setPhotosList] = useState<{ id: string; file: File | null; url: string }[]>([]);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoDetailOpen, setIsPhotoDetailOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [preMeasurementStatuses, setPreMeasurementStatuses] = useState<Record<string, any>>({});
  
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const { uploadPlayerPhotoToR2, isUploadingToR2: isPhotoUploading } = useUploadToR2();

  const showAlert = (message: string, title: string = '안내', onConfirm?: () => void) => {
    setAlertState({ isOpen: true, title, message, onConfirm });
  };

  // 실시간 요금 계산 및 유효성 검사 상태
  const [totalEditPrice, setTotalEditPrice] = useState(0);
  const [editingValidate, setEditingValidate] = useState({
    playerName: false,
    playerTel: false,
    playerBirth: false,
    playerGym: false,
  });
  const [isEditingValidate, setIsEditingValidate] = useState(false);

  // 실시간 요금 계산 for editing
  useEffect(() => {
    if (!editingInvoice) return;
    
    const joins = editingInvoice.joins || [];
    const joinsCount = joins.length;
    
    if (joinsCount === 0) {
      setTotalEditPrice(editingInvoice.playerService ? PHOTO_SERVICE_PRICE : 0);
      return;
    }

    const hasType1 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입1');
    const hasType2 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입2');
    
    let basePrice = Number(editingInvoice.contestPriceBasic) || 0;
    if (hasType1) {
      basePrice = Number(editingInvoice.contestPriceType1) || 0;
    } else if (hasType2) {
      basePrice = Number(editingInvoice.contestPriceType2) || 0;
    }

    const extra = Number(editingInvoice.contestPriceExtra) || 0;
    
    let price = basePrice + (joinsCount - 1) * extra;
    
    if (editingInvoice.playerService) {
      price += PHOTO_SERVICE_PRICE;
    }
    
    setTotalEditPrice(price);
  }, [editingInvoice?.joins, editingInvoice?.playerService, editingInvoice?.contestPriceBasic, editingInvoice?.contestPriceExtra, editingInvoice?.contestPriceType1, editingInvoice?.contestPriceType2]);

  // 실시간 유효성 검사 for editing
  useEffect(() => {
    if (!editingInvoice) return;
    const isBirthValid = /^\d{4}-\d{2}-\d{2}$/.test(editingInvoice.playerBirth || '');
    const isTelValid = /^\d{2,3}-\d{3,4}-\d{3,4}$/.test(editingInvoice.playerTel || '');
    const isNameValid = (editingInvoice.playerName || '').trim().length >= 2;
    const isGymValid = (editingInvoice.playerGym || '').trim().length >= 1;

    setEditingValidate({
      playerName: !isNameValid && (editingInvoice.playerName || '').length > 0,
      playerTel: !isTelValid && (editingInvoice.playerTel || '').length > 0,
      playerBirth: !isBirthValid && (editingInvoice.playerBirth || '').length > 0,
      playerGym: !isGymValid && (editingInvoice.playerGym || '').length > 0,
    });

    setIsEditingValidate(isNameValid && isBirthValid && isTelValid && isGymValid);
  }, [editingInvoice?.playerName, editingInvoice?.playerBirth, editingInvoice?.playerTel, editingInvoice?.playerGym]);

  // 성별/생년월일/chkAllItem 변경 시 종목 필터링 for editing
  useEffect(() => {
    if (!categories.length || !editingInvoice) return;

    const genderLabel = editingInvoice.playerGender === 'm' ? '남' : '여';

    const nonGrandPrixCategories = categories.filter((cat: Category) => {
      const isGrandPrix = 
        cat.contestCategoryType === '그랑프리' || 
        cat.contestCategoryType === 'grandprix' || 
        cat.contestCategorySection === '그랑프리' || 
        cat.contestCategorySection === 'grandprix' || 
        cat.contestCategoryTitle?.includes('그랑프리') || 
        cat.contestCategoryTitle?.toLowerCase().includes('grandprix') || 
        cat.contestCategoryTitle?.toLowerCase().includes('grand prix');
      
      return !isGrandPrix;
    });

    if (!chkAllItem) {
      const filtered = nonGrandPrixCategories.filter(
        (cat: Category) => cat.contestCategoryGender === genderLabel || cat.contestCategoryGender === '무관'
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(nonGrandPrixCategories);
    }
  }, [categories, editingInvoice?.playerGender, chkAllItem]);

  // 필수공지 다음 인덱스로 전환 시 검증 락 초기화
  useEffect(() => {
    if (mandatoryNotices.length > 0 && currentNoticeIndex < mandatoryNotices.length) {
      const activeNotice = mandatoryNotices[currentNoticeIndex];
      const hasImages = !!(activeNotice.images && activeNotice.images.length > 0);
      const hasContent = !!(activeNotice.content && activeNotice.content.trim());
      setVideoWatchedComplete(true); // 동영상 시청 필수 락 비활성화 (항상 완료 처리)
      setImagesViewedComplete(!hasImages);
      setScrollReadComplete(!hasContent);
    }
  }, [currentNoticeIndex, mandatoryNotices]);

  // YouTube API load verify
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Demo scroll lock
  useEffect(() => {
    try {
      if (isDemoOpen) {
        document.body.style.overflow = 'hidden';
        if (window.parent && window.parent !== window) {
          window.parent.document.body.style.overflow = 'hidden';
        }
      } else {
        document.body.style.overflow = 'unset';
        if (window.parent && window.parent !== window) {
          window.parent.document.body.style.overflow = 'unset';
        }
      }
    } catch (e) {
      console.warn(e);
      try {
        if (isDemoOpen) {
          window.parent.postMessage({ type: 'lock_scroll' }, '*');
        } else {
          window.parent.postMessage({ type: 'unlock_scroll' }, '*');
        }
      } catch (postErr) {
        // ignore
      }
    }
    return () => {
      try {
        document.body.style.overflow = 'unset';
      } catch (e) {}
    };
  }, [isDemoOpen]);

  // 스크롤 탑
  const scrollToTop = () => {
    try {
      if ((window as any).lenis && typeof (window as any).lenis.scrollTo === 'function') {
        (window as any).lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (window.parent && window.parent !== window) {
        window.parent.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    } catch (e) {
      console.warn(e);
      try {
        window.parent.postMessage({ type: 'scroll_to_top' }, '*');
      } catch (postErr) {}
    }
  };

  useEffect(() => {
    if (isEditing) {
      scrollToTop();
    }
  }, [editStep, isEditing]);

  const hasNotice = mandatoryNotices && mandatoryNotices.length > 0;
  const activeSteps = hasNotice
    ? ['notice', 'info', 'joins', 'pledge', 'confirm']
    : ['info', 'joins', 'pledge', 'confirm'];

  const currentStepId = activeSteps[editStep - 1] || 'info';

  const goToStep = (stepId: string) => {
    const idx = activeSteps.indexOf(stepId);
    if (idx !== -1) {
      setEditStep(idx + 1);
    }
  };

  const goToPrevStep = () => {
    if (editStep > 1) {
      setEditStep((prev) => prev - 1);
    }
  };

  const goToNextStep = () => {
    if (editStep < activeSteps.length) {
      setEditStep((prev) => prev + 1);
    }
  };

  const getPlayerAgeForEdit = () => {
    if (!editingInvoice?.playerBirth || !/^\d{4}-\d{2}-\d{2}$/.test(editingInvoice.playerBirth)) return null;
    const birth = new Date(editingInvoice.playerBirth);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleEditClick = async (inv: RegistrationPayload) => {
    setIsInvoicesLoading(true);
    setError(null);
    try {
      const contestData = await getContest(inv.contestId);
      const [categoryData, gradeData, notices] = await Promise.all([
        getCategoryList(contestData.contestCategorysListId),
        getGradeList(contestData.contestGradesListId),
        getMandatoryNotices(),
      ]);
      
      setCategories(categoryData);
      setGrades(gradeData);
      setMandatoryNotices(notices);
      
      setEditingInvoice({
        ...inv,
        joins: inv.joins || [],
      });
      let initialPhotos: { id: string; file: File | null; url: string }[] = [];
      if (inv.playerPhotoUrls && inv.playerPhotoUrls.length > 0) {
        initialPhotos = inv.playerPhotoUrls.map((url, i) => ({
          id: `existing_${i}_${Math.random().toString(36).substring(2, 9)}`,
          file: null,
          url
        }));
      } else if (inv.playerPhotoUrl) {
        initialPhotos = [{
          id: `existing_0_${Math.random().toString(36).substring(2, 9)}`,
          file: null,
          url: inv.playerPhotoUrl
        }];
      }
      setPhotosList(initialPhotos);
      
      const hasNoticeData = notices && notices.length > 0;
      setEditStep(1);
      setCurrentNoticeIndex(0);
      setAgreedNoticeIds([]);
      setPolicyAccepted(false);
      
      if (hasNoticeData) {
        const firstNotice = notices[0];
        const hasImages = !!(firstNotice.images && firstNotice.images.length > 0);
        const hasContent = !!(firstNotice.content && firstNotice.content.trim());
        setVideoWatchedComplete(true); // 동영상 시청 필수 락 비활성화 (항상 완료 처리)
        setImagesViewedComplete(!hasImages);
        setScrollReadComplete(!hasContent);
      } else {
        setVideoWatchedComplete(true);
        setImagesViewedComplete(true);
        setScrollReadComplete(true);
      }
      
      setIsEditing(true);
    } catch (err: any) {
      console.error('수정 준비 에러:', err);
      showAlert('대회 정보 및 필수 공지사항을 불러오는 중 오류가 발생했습니다: ' + (err.message || ''), '오류');
    } finally {
      setIsInvoicesLoading(false);
    }
  };

  const handleEditClickWithWarning = (inv: RegistrationPayload) => {
    if (inv.isPriceCheck) {
      if (window.confirm('이미 입금 확인이 완료된 신청서입니다. 수정 시 입금확정대기(미입금) 상태로 전환되어 관리자 재확인이 필요합니다. 수정하시겠습니까?')) {
        handleEditClick(inv);
      }
    } else {
      handleEditClick(inv);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingInvoice(null);
    photosList.forEach(p => {
      if (p.url.startsWith('blob:')) {
        URL.revokeObjectURL(p.url);
      }
    });
    setPhotosList([]);
    setCategories([]);
    setGrades([]);
    setMandatoryNotices([]);
  };

  const handleEditBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 4 && val.length <= 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
    } else if (val.length > 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
    }
    setEditingInvoice({ ...editingInvoice!, playerBirth: formatted });
  };

  const handleEditTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
    }
    setEditingInvoice({ ...editingInvoice!, playerTel: formatted });
  };

  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      const imageFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
        if (!isImage) {
          showAlert(`이미지 파일(PNG, JPG, JPEG, WEBP, HEIC 등)만 등록할 수 있습니다: ${file.name}`, '파일 형식 오류');
          return false;
        }
        if (file.size > 30 * 1024 * 1024) {
          showAlert(`파일 크기는 최대 30MB를 초과할 수 없습니다: ${file.name}`, '파일 용량 제한');
          return false;
        }
        return true;
      });

      if (imageFiles.length === 0) return;

      const newPhotos = imageFiles.map(file => ({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        url: URL.createObjectURL(file)
      }));

      setPhotosList(prev => [...prev, ...newPhotos]);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const imageFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
        if (!isImage) {
          showAlert(`이미지 파일(PNG, JPG, JPEG, WEBP, HEIC 등)만 등록할 수 있습니다: ${file.name}`, '파일 형식 오류');
          return false;
        }
        if (file.size > 30 * 1024 * 1024) {
          showAlert(`파일 크기는 최대 30MB를 초과할 수 없습니다: ${file.name}`, '파일 용량 제한');
          return false;
        }
        return true;
      });

      if (imageFiles.length === 0) return;

      const newPhotos = imageFiles.map(file => ({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        url: URL.createObjectURL(file)
      }));

      setPhotosList(prev => [...prev, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (idToRemove: string) => {
    setPhotosList(prev => {
      const target = prev.find(p => p.id === idToRemove);
      if (target && target.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter(p => p.id !== idToRemove);
    });
  };

  const handleSetRepresentative = (index: number) => {
    setPhotosList(prev => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleEditCategorySelect = (categoryId: string, categoryTitle: string, priceType: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editingInvoice) return;
    const val = e.target.value;
    const joins: JoinItem[] = [...(editingInvoice.joins || [])];
    const index = joins.findIndex((item: JoinItem) => item.contestCategoryId === categoryId);

    if (val === '' || val === '체급선택') {
      if (index !== -1) {
        joins.splice(index, 1);
      }
    } else {
      const [gradeId, gradeTitle] = val.split('|');
      const newJoin: JoinItem = {
        contestCategoryId: categoryId,
        contestCategoryTitle: categoryTitle,
        contestCategoryPriceType: priceType,
        contestGradeId: gradeId,
        contestGradeTitle: gradeTitle,
      };

      if (index === -1) {
        joins.push(newJoin);
      } else {
        joins[index] = newJoin;
      }
    }

    setEditingInvoice({ ...editingInvoice, joins });
  };

  const handleResetEditSelections = () => {
    if (!editingInvoice) return;
    setEditingInvoice({ ...editingInvoice, joins: [] });
    const selects = document.querySelectorAll('.category-dropdown');
    selects.forEach((select) => {
      (select as HTMLSelectElement).value = '';
    });
  };

  const handleDownloadFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleCopyAccount = () => {
    if (!editingInvoice) return;
    navigator.clipboard.writeText(`${editingInvoice.contestBankName} ${editingInvoice.contestAccountNumber} ${editingInvoice.contestAccountOwner}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const requestUnlockScroll = (): Promise<void> => {
    return new Promise((resolve) => {
      let resolved = false;
      let handleMessage: (event: MessageEvent) => void;
      let timeoutId: any;

      const done = () => {
        if (!resolved) {
          resolved = true;
          if (handleMessage) {
            window.removeEventListener('message', handleMessage);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          resolve();
        }
      };

      try {
        document.body.style.overflow = 'unset';
        if (window.parent && window.parent !== window) {
          window.parent.document.body.style.overflow = 'unset';
          done();
          return;
        } else {
          done();
          return;
        }
      } catch (e) {
        console.warn('부모 창의 body overflow 조절 권한 없음:', e);
      }

      handleMessage = (event: MessageEvent) => {
        const data = event.data;
        if (
          data === 'scroll_unlocked' ||
          data === 'unlock_scroll_success' ||
          data === 'unlocked' ||
          (data && (
            data.type === 'scroll_unlocked' ||
            data.type === 'unlock_scroll_success' ||
            data.type === 'unlocked'
          ))
        ) {
          done();
        }
      };
      window.addEventListener('message', handleMessage);

      try {
        window.parent.postMessage({ type: 'unlock_scroll' }, '*');
        window.parent.postMessage('unlock_scroll', '*');
      } catch (postErr) {
        console.error('부모 창 postMessage 전송 실패:', postErr);
      }

      timeoutId = setTimeout(() => {
        done();
      }, 150);
    });
  };

  const handleCloseDemo = async () => {
    await requestUnlockScroll();
    setIsDemoOpen(false);
  };

  const handleFinalEditSubmit = async () => {
    if (!editingInvoice) return;
    setIsSubmitting(true);
    setError(null);

    const uploadedUrls: string[] = [];
    const uploadedFilesInfo: { url: string; key: string }[] = [];

    try {
      for (const item of photosList) {
        if (item.file) {
          try {
            const url = await uploadPlayerPhotoToR2(item.file, 'invoices', true);
            uploadedUrls.push(url);
            uploadedFilesInfo.push({
              url,
              key: `invoices/${item.file.name}`
            });
          } catch (uploadErr: any) {
            throw new Error(`선수 사진 R2 업로드 중 실패했습니다: ${uploadErr.message}`);
          }
        } else if (item.url) {
          uploadedUrls.push(item.url);
        }
      }

      const payload: RegistrationPayload = {
        ...editingInvoice,
        playerPhotoUrl: uploadedUrls[0] || '',
        playerPhotoUrls: uploadedUrls,
        contestPriceSum: totalEditPrice,
        contestPriceTotal: totalEditPrice,
        playerAge: getPlayerAgeForEdit(),
      };

      try {
        const result = await updateHybridRegistration(editingInvoice.id, payload);
        if (result.success) {
          showAlert('참가 신청 내역 수정이 완료되었습니다.', '수정 완료', () => {
            setIsEditing(false);
            setEditingInvoice(null);
            if (user) {
              getUserInvoices(user.uid).then(setInvoices);
            }
          });
        }
      } catch (firestoreErr: any) {
        const mediaUrl = import.meta.env.VITE_MEDIA_API_URL || '';
        if (mediaUrl && uploadedFilesInfo.length > 0) {
          await Promise.all(uploadedFilesInfo.map(async (fileInfo) => {
            try {
              await fetch(`${mediaUrl}/api/photos/${fileInfo.key}`, {
                method: 'DELETE',
              });
              console.log('R2 고아 파일 삭제 완료:', fileInfo.key);
            } catch (deleteErr) {
              console.error('R2 고아 파일 삭제 실패:', deleteErr);
            }
          }));
        }
        throw firestoreErr;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '수정본 제출 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      // If store is initialized but not authenticated, kick to login
      if (!isAuthLoading && !user) {
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [user, isAuthLoading, navigate]);

  // Load user profile and fetch invoices
  useEffect(() => {
    if (user) {
      // Set profile form data
      setProfileData({
        name: user.profile?.name || '',
        birth: user.profile?.birth || '',
        tel: user.profile?.tel || '',
        gym: user.profile?.gym || '',
        gender: user.profile?.gender || '',
      });

      // Fetch Firestore / local backup invoices
      const loadInvoices = async () => {
        setIsInvoicesLoading(true);
        try {
          const playerUid = user.uid;
          const data = await getUserInvoices(playerUid);
          setInvoices(data);
        } catch (err) {
          console.error('인보이스 조회 오류:', err);
        } finally {
          setIsInvoicesLoading(false);
          setIsFirstLoad(false);
        }
      };
      loadInvoices();
    }
  }, [user]);

  // Load pre-measurement statuses for invoices
  useEffect(() => {
    if (invoices.length === 0 || !user) return;

    async function loadPreMeasurementStatuses() {
      const statuses: Record<string, any> = {};
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '';

      await Promise.all(
        invoices.map(async (inv) => {
          if (!inv.contestId) return;
          try {
            const res = await fetch(
              `${backendUrl}/api/pre-measurement/status?contestId=${inv.contestId}&playerUid=${user.uid}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              }
            );
            if (res.ok) {
              const data = await res.json();
              statuses[inv.contestId] = data;
            }
          } catch (e) {
            console.error('사전계측 상태 로드 오류:', e);
          }
        })
      );
      setPreMeasurementStatuses(statuses);
    }
    loadPreMeasurementStatuses();
  }, [invoices, user]);

  // 💡 RegistrationPhase에서 넘어온 수정 요청 처리
  useEffect(() => {
    if (invoices.length > 0 && location.state?.editInvoiceId) {
      const editInvoiceId = location.state.editInvoiceId;
      // state를 소모했으므로 비워주어 새로고침이나 재진입 시 다시 켜지지 않도록 처리
      navigate(location.pathname, { replace: true, state: {} });

      const targetInvoice = invoices.find(inv => inv.id === editInvoiceId);
      if (targetInvoice) {
        handleEditClick(targetInvoice);
      }
    }
  }, [invoices, location.state, navigate, location.pathname]);

  // Real-time input validation (same as AdditionalInfoPage)
  useEffect(() => {
    const isNameValid = profileData.name.trim().length >= 2;
    const isBirthValid = /^\d{4}-\d{2}-\d{2}$/.test(profileData.birth);
    const isTelValid = /^\d{2,3}-\d{3,4}-\d{3,4}$/.test(profileData.tel);
    const isGymValid = profileData.gym.trim().length >= 1;
    const isGenderValid = profileData.gender === 'm' || profileData.gender === 'f';

    setValidation({
      name: !isNameValid && profileData.name.length > 0,
      birth: !isBirthValid && profileData.birth.length > 0,
      tel: !isTelValid && profileData.tel.length > 0,
      gym: !isGymValid && profileData.gym.length > 0,
      gender: !isGenderValid && profileData.gender !== '',
    });

    setIsValid(isNameValid && isBirthValid && isTelValid && isGymValid && isGenderValid);
  }, [profileData]);

  // Real-time hyphens formatting
  const handleBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 4 && val.length <= 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
    } else if (val.length > 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
    }
    setProfileData({ ...profileData, birth: formatted });
  };

  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
    }
    setProfileData({ ...profileData, tel: formatted });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setErrorMsg('모든 프로필 필드를 올바르게 기입해 주십시오.');
      return;
    }
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const success = await completeAdditionalInfo(profileData);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg('프로필 수정 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '프로필 업데이트 실패');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isPageLoading = isAuthLoading || !user || (isFirstLoad && isInvoicesLoading);

  if (isPageLoading) {
    return <Loader isLoading={isPageLoading} />;
  }

  // Get display photo url
  const photoUrl = invoices[0]?.playerPhotoUrl || '';

  if (isEditing && editingInvoice) {
    const stepperCols = [];
    if (hasNotice) {
      stepperCols.push({
        id: 'notice',
        stepNumStr: 'Step 01',
        title: '필수 공지 확인',
        onClick: () => goToStep('notice'),
        isActive: currentStepId === 'notice',
        isCompleted: activeSteps.indexOf(currentStepId) > activeSteps.indexOf('notice'),
        canClick: activeSteps.indexOf(currentStepId) > activeSteps.indexOf('notice'),
      });
    }
    stepperCols.push({
      id: 'info',
      stepNumStr: hasNotice ? 'Step 02' : 'Step 01',
      title: '정보 & 사진 등록',
      onClick: () => goToStep('info'),
      isActive: currentStepId === 'info',
      isCompleted: activeSteps.indexOf(currentStepId) > activeSteps.indexOf('info'),
      canClick: hasNotice 
        ? (agreedNoticeIds.length >= mandatoryNotices.length && activeSteps.indexOf(currentStepId) > activeSteps.indexOf('info'))
        : activeSteps.indexOf(currentStepId) > activeSteps.indexOf('info'),
    });
    stepperCols.push({
      id: 'joins',
      stepNumStr: hasNotice ? 'Step 03' : 'Step 02',
      title: '종목 & 체급 선택',
      onClick: () => {
        if (isEditingValidate) {
          goToStep('joins');
        } else {
          showAlert('인적 정보 필수 항목을 먼저 모두 올바르게 입력해 주세요.', '필수 입력 누락');
        }
      },
      isActive: currentStepId === 'joins',
      isCompleted: activeSteps.indexOf(currentStepId) > activeSteps.indexOf('joins'),
      canClick: isEditingValidate && (hasNotice ? agreedNoticeIds.length >= mandatoryNotices.length : true),
    });
    stepperCols.push({
      id: 'pledge',
      stepNumStr: hasNotice ? 'Step 04' : 'Step 03',
      title: '서약 & 최종 제출',
      onClick: () => {
        if (isEditingValidate && (editingInvoice.joins || []).length > 0) {
          goToStep('pledge');
        } else if (!isEditingValidate) {
          showAlert('인적 정보 필수 항목을 먼저 채워주세요.', '필수 입력 누락');
        } else {
          showAlert('최소 한 개 이상의 참가 종목과 세부 체급을 선택해야 합니다.', '신청 종목 미선택');
        }
      },
      isActive: currentStepId === 'pledge' || currentStepId === 'confirm',
      isCompleted: false,
      canClick: isEditingValidate && (editingInvoice.joins || []).length > 0 && (hasNotice ? agreedNoticeIds.length >= mandatoryNotices.length : true),
    });

    return (
      <div className="pt-28 pb-24 px-4 md:px-12 max-w-[900px] mx-auto min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden font-sans">
        {/* Background neon glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* HEADER SECTION */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
            <span className="text-[9px] md:text-[10px] text-accent font-bold tracking-wider font-sans">참가 신청 정보 수정</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black mb-3 tracking-tight text-white uppercase">
            대회 참가 <span className="text-accent">신청서 수정</span>
          </h1>
          <p className="text-white/60 text-xs md:text-sm font-sans">
            등록된 참가 신청 정보를 수정합니다. 수정 후 확인이 지연될 수 있습니다.
          </p>
        </div>

        {/* PREMIUM STEPPER BAR */}
        <div className={`grid ${hasNotice ? 'grid-cols-4' : 'grid-cols-3'} mb-12 w-full bg-[#161a16] border border-white/10 rounded-xl overflow-hidden shadow-lg divide-x divide-white/10`}>
          {stepperCols.map((col, index) => (
            <div 
              key={col.id}
              onClick={() => col.canClick && col.onClick()}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2.5 py-4 sm:py-5 px-3 transition-all ${
                col.isActive ? 'bg-accent/[0.03]' : 'hover:bg-white/[0.01]'
              } ${col.canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0 ${
                col.isActive 
                  ? 'bg-accent text-black font-black shadow-[0_0_12px_rgba(210,255,0,0.15)]' 
                  : col.isCompleted 
                    ? 'bg-accent/20 text-accent border border-accent/40' 
                    : 'bg-[#1d1f1d] text-white/40 border border-white/5'
              }`}>
                {col.isCompleted ? <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : (index + 1)}
              </div>
              <div className="text-center sm:text-left shrink-0">
                <span className="block text-[8px] sm:text-[9px] uppercase font-mono text-white/30 tracking-wider">{col.stepNumStr}</span>
                <span className={`text-[10px] sm:text-xs md:text-sm font-bold transition-colors block ${col.isActive ? 'text-white font-black' : 'text-white/40'}`}>{col.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CONTEST SPEC CARD */}
        <div className="bg-[#161a16] border border-white/10 rounded-xl p-5 sm:p-6 md:p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
            <div className="flex-1">
              <span className="text-[10px] md:text-xs text-accent font-bold block mb-1">
                {editingInvoice.contestPromoter} • 공식 대회 안내
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-sans tracking-tight text-white leading-tight">
                {editingInvoice.contestTitle}
              </h2>
            </div>
            <button
              onClick={() => handleCancelEdit()}
              className="flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-950/40 text-red-200 w-full md:w-auto px-5 py-3 md:py-2.5 rounded border border-red-500/20 text-xs md:text-sm font-bold transition-all shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" /> 수정 취소 (돌아가기)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
              <div>
                <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">대회 개최 일시</span>
                <span className="text-xs sm:text-sm font-bold text-white">{editingInvoice.contestDate}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
              <div>
                <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">대회 개최 장소</span>
                <span className="text-xs sm:text-sm font-bold text-white">{editingInvoice.contestLocation}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
              <div>
                <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">접수 참가비</span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  기본 {editingInvoice.contestPriceBasic?.toLocaleString()}원 
                  <span className="text-accent/80 font-normal text-[10px] md:text-xs block mt-0.5">
                    중복출전 +{editingInvoice.contestPriceExtra?.toLocaleString()}원
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-6 py-4 rounded-xl mb-6 text-xs">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-[#161a16] border border-white/10 rounded-xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            
            {/* DYNAMIC STEP: MANDATORY NOTICE */}
            {currentStepId === 'notice' && mandatoryNotices.length > 0 && (
              <div className="space-y-8 transition-all duration-300">
                <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                      <Sparkles className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5 animate-pulse" />
                      <span>대회 참가 접수 필수 공지사항 동의</span>
                    </h3>
                    <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed font-sans">
                      대회 출전을 위해 아래 공지사항을 반드시 확인하시고 동의해 주시기 바랍니다.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded font-bold shrink-0">
                    {currentNoticeIndex + 1} / {mandatoryNotices.length}
                  </div>
                </div>

                {/* 공지 내용 영역 */}
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] text-accent/80 font-bold uppercase tracking-widest font-mono block mb-1">
                      MANDATORY NOTICE
                    </span>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug">
                      {mandatoryNotices[currentNoticeIndex].title}
                    </h2>
                  </div>

                  {/* 다중 사진 캐러셀 */}
                  {mandatoryNotices[currentNoticeIndex].images && mandatoryNotices[currentNoticeIndex].images.length > 0 && (
                    <ImageCarousel 
                      images={mandatoryNotices[currentNoticeIndex].images} 
                      onAllViewed={() => setImagesViewedComplete(true)}
                    />
                  )}

                  {/* 본영상/유튜브 영상 시청 영역 */}
                  {mandatoryNotices[currentNoticeIndex].videoUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">필수 시청 동영상 (직접 업로드)</p>
                      <video
                        src={mandatoryNotices[currentNoticeIndex].videoUrl.split('#')[0]}
                        controls
                        onEnded={() => setVideoWatchedComplete(true)}
                        className={`rounded-lg shadow-sm border border-white/10 ${
                          mandatoryNotices[currentNoticeIndex].videoUrl.includes('#vertical')
                            ? 'aspect-[9/16] max-w-[320px] mx-auto'
                            : 'aspect-[16/9] w-full'
                        }`}
                      />
                    </div>
                  )}

                  {mandatoryNotices[currentNoticeIndex].youtubeUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">필수 시청 동영상 (YouTube)</p>
                      <YouTubePlayer
                        url={mandatoryNotices[currentNoticeIndex].youtubeUrl}
                        onEnded={() => setVideoWatchedComplete(true)}
                      />
                    </div>
                  )}

                  {mandatoryNotices[currentNoticeIndex].content && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">공지사항 본문 정독 (스크롤을 끝까지 내려주세요)</p>
                      <NoticeScrollReader
                        content={mandatoryNotices[currentNoticeIndex].content}
                        onReadComplete={() => setScrollReadComplete(true)}
                      />
                    </div>
                  )}

                  {/* 첨부파일 영역 */}
                  {mandatoryNotices[currentNoticeIndex].attachments && mandatoryNotices[currentNoticeIndex].attachments.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">첨부 문서 다운로드</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mandatoryNotices[currentNoticeIndex].attachments.map((file: { name: string; url: string }, idx: number) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-[#1d1f1d] hover:bg-white/5 border border-white/10 rounded-lg text-white text-xs font-bold transition-all"
                          >
                            <span className="truncate pr-4 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-accent shrink-0" />
                              {file.name}
                            </span>
                            <span className="text-accent hover:underline shrink-0 text-[10px] sm:text-xs flex items-center gap-1 font-sans">
                              다운로드
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 하단 제어 영역 */}
                <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-white/50 text-center sm:text-left space-y-1">
                    {!scrollReadComplete && (
                      <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <AlertCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
                        공지사항 본문을 읽어주십시오.
                      </p>
                    )}
                    {!videoWatchedComplete && (
                      <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <AlertCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
                        필수 시청 동영상을 끝까지 시청해주십시오.
                      </p>
                    )}
                    {!imagesViewedComplete && (
                      <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <AlertCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
                        모든 설명 이미지 카드를 끝까지 확인해주십시오.
                      </p>
                    )}
                    {scrollReadComplete && videoWatchedComplete && imagesViewedComplete && (
                      <p className="text-accent font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
                        모든 필수 조건 확인 검증을 완료했습니다.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!(scrollReadComplete && videoWatchedComplete && imagesViewedComplete)}
                    onClick={() => {
                      const noticeId = mandatoryNotices[currentNoticeIndex].id;
                      const newAgreed = [...agreedNoticeIds, noticeId];
                      setAgreedNoticeIds(newAgreed);

                      if (currentNoticeIndex < mandatoryNotices.length - 1) {
                        setCurrentNoticeIndex((prev) => prev + 1);
                      } else {
                        goToNextStep();
                      }
                    }}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      scrollReadComplete && videoWatchedComplete && imagesViewedComplete
                        ? 'bg-accent text-black hover:bg-white hover:scale-[1.03] active:scale-95 shadow-md shadow-accent/25'
                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {currentNoticeIndex < mandatoryNotices.length - 1 ? (
                      <>
                        동의 완료 및 다음 공지 <ArrowRight className="w-4.5 h-4.5" />
                      </>
                    ) : (
                      <>
                        모든 필수 공지 확인 완료 <ArrowRight className="w-4.5 h-4.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1: PERSONAL INFO & PHOTO UPLOAD */}
            {currentStepId === 'info' && (
              <div className="space-y-8 transition-all duration-300">
                <div className="border-b border-white/10 pb-4 mb-6">
                  <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                    <UserIcon className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                    <span>1. 참가자 인적 정보 & 프로필 등록</span>
                  </h3>
                  <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">대회 참가를 위한 인적 인포메이션과 전광판 송출용 사진을 수집합니다.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 성명 */}
                  <div>
                    <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                      선수 성명 <span className="text-accent">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editingInvoice.playerName}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, playerName: e.target.value })}
                      placeholder="실명 입력"
                      className={`w-full bg-[#0a0a0a] border ${editingValidate.playerName ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all`} 
                    />
                    {editingValidate.playerName && <p className="text-red-400 text-[10px] md:text-xs mt-1">2자 이상의 성명을 입력해주세요.</p>}
                  </div>

                  {/* 성별 */}
                  <div>
                    <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                      선수 성별 <span className="text-accent">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingInvoice({ ...editingInvoice, playerGender: 'm' })}
                        className={`py-3 md:py-3.5 rounded text-xs md:text-sm font-bold border transition-all ${
                          editingInvoice.playerGender === 'm'
                            ? 'bg-accent text-black border-accent font-black'
                            : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        남자 (Male)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingInvoice({ ...editingInvoice, playerGender: 'f' })}
                        className={`py-3 md:py-3.5 rounded text-xs md:text-sm font-bold border transition-all ${
                          editingInvoice.playerGender === 'f'
                            ? 'bg-accent text-black border-accent font-black'
                            : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        여자 (Female)
                      </button>
                    </div>
                  </div>

                  {/* 생년월일 */}
                  <div>
                    <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                      생년월일 <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editingInvoice.playerBirth}
                        onChange={handleEditBirthChange}
                        maxLength={10}
                        placeholder="YYYY-MM-DD"
                        className={`w-full bg-[#0a0a0a] border ${editingValidate.playerBirth ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm font-mono transition-all`} 
                      />
                      {getPlayerAgeForEdit() !== null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs bg-accent/20 text-accent font-bold px-2 py-0.5 rounded">
                          만 {getPlayerAgeForEdit()}세
                        </span>
                      )}
                    </div>
                    {editingValidate.playerBirth && <p className="text-red-400 text-[10px] md:text-xs mt-1">생년월일 8자리를 입력해주세요. (예: 1999-12-31)</p>}
                  </div>

                  {/* 연락처 */}
                  <div>
                    <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                      휴대전화 번호 <span className="text-accent">*</span>
                    </label>
                    <input 
                      type="tel" 
                      value={editingInvoice.playerTel}
                      onChange={handleEditTelChange}
                      maxLength={13}
                      placeholder="010-0000-0000"
                      className={`w-full bg-[#0a0a0a] border ${editingValidate.playerTel ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm font-mono transition-all`} 
                    />
                    {editingValidate.playerTel && <p className="text-red-400 text-[10px] md:text-xs mt-1">'010' 포함 올바른 연락처 번호를 입력해주세요.</p>}
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                      이메일 주소
                    </label>
                    <input 
                      type="email" 
                      value={editingInvoice.playerEmail}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, playerEmail: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-[#0a0a0a] border border-white/10 focus:border-accent rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all" 
                    />
                  </div>

                  {/* 소속 */}
                  <div>
                    <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                      소속 (클럽/체육관) <span className="text-accent">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editingInvoice.playerGym}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, playerGym: e.target.value })}
                      placeholder="소속 단체명 (없을 시 '무소속' 기재)"
                      className={`w-full bg-[#0a0a0a] border ${editingValidate.playerGym ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all`} 
                    />
                    {editingValidate.playerGym && <p className="text-red-400 text-[10px] md:text-xs mt-1">소속이 없으시다면 '무소속'이라고 작성해주세요.</p>}
                  </div>
                </div>

                {/* 선수 사진 R2 업로드 영역 */}
                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-white flex flex-wrap items-center gap-2 uppercase tracking-wider">
                      <span className="break-keep">무대 전광판(LED) 선수 프로필 사진 등록</span>
                      <span className="text-accent text-[9px] md:text-[10px] font-bold whitespace-nowrap bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">추천</span>
                    </h4>
                    <div className="text-xs md:text-[13px] text-white/60 mt-1.5 leading-relaxed font-sans break-keep flex flex-col md:flex-row md:items-center gap-3">
                      <span className="flex-1">
                        선수님이 무대에 입장할 때, 본부석 대형 전광판 스크린에 해당 프로필 사진이 이름/소속과 함께 실시간 송출되어 압도적인 오프닝을 연출합니다. 본인의 개성이 담긴 선명한 정면 상반신 사진 등록을 추천드립니다.
                      </span>
                      <button 
                        type="button"
                        onClick={() => setIsDemoOpen(true)}
                        className="text-accent hover:text-white font-bold text-xs flex items-center gap-1.5 shrink-0 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-black transition-all cursor-pointer shadow-sm shadow-accent/5"
                      >
                        <Sparkles className="w-3.5 h-3.5 font-bold" />
                        접수 사진을 등록하는 이유 (전광판 연출 데모)
                      </button>
                    </div>
                  </div>

                  <div 
                    onDragEnter={handleEditDrag}
                    onDragLeave={handleEditDrag}
                    onDragOver={handleEditDrag}
                    onDrop={handleEditDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 transition-all flex flex-col items-center justify-center bg-[#161a16]/50 ${
                      isDragActive 
                        ? 'border-accent bg-accent/5' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <label className="cursor-pointer flex flex-col items-center text-center p-4 w-full">
                      <div className="w-12 h-12 bg-[#1d1f1d] border border-white/10 rounded-full flex items-center justify-center mb-3 text-white/45 hover:text-accent transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white block mb-1 md:hidden">이곳을 터치하여 프로필 사진 등록 (여러 장 가능)</span>
                      <span className="text-xs font-bold text-white block mb-1 hidden md:block">드래그하여 사진들을 여기에 놓거나 클릭하세요 (여러 장 업로드 지원)</span>
                      <span className="text-xs text-white/60 block leading-relaxed mb-3">
                        상반신 정면이 선명한 JPG, PNG 파일 (각 최대 10MB)
                      </span>
                      <span className="inline-block bg-[#1d1f1d] hover:bg-accent hover:text-black text-white border border-white/10 px-5 py-2.5 rounded text-[10px] md:text-xs font-bold transition-all text-center">
                        이미지 파일 선택
                      </span>
                      <input 
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEditFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 다중 사진 썸네일 그리드 */}
                  {photosList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                      {photosList.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className="relative group border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a] p-2 flex flex-col items-center"
                        >
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/5 bg-[#161a16]">
                            <img src={photo.url} alt={`선수 사진 ${index + 1}`} className="w-full h-full object-cover" />
                            
                            {index === 0 && (
                              <span className="absolute top-1.5 left-1.5 bg-accent text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                대표 사진
                              </span>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                              title="삭제"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="w-full mt-2 flex flex-col gap-1 text-center">
                            <p className="text-[10px] text-white/70 truncate w-full px-1" title={photo.file?.name || '기존 등록 사진'}>
                              {photo.file?.name || '등록된 프로필 사진'}
                            </p>
                            {photo.file && (
                              <p className="text-[9px] text-white/40 font-mono">
                                {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetRepresentative(index)}
                                className="mt-1 bg-white/5 hover:bg-accent hover:text-black text-white text-[9px] py-1 px-2 rounded font-bold transition-all border border-white/10 cursor-pointer"
                              >
                                대표로 설정
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 참여동기 */}
                <div>
                  <label className="block text-[10px] text-white/50 mb-2 font-mono tracking-widest uppercase">
                    선수 소개 및 참여 동기 (장내 아나운서 낭독용)
                  </label>
                  <textarea 
                    value={editingInvoice.playerText}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, playerText: e.target.value })}
                    placeholder="무대 입장 시 장내 아나운서가 낭독하여 선수를 홍보할 수 있는 사회자 코멘트 프로필로 사용됩니다."
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-white/10 focus:border-accent rounded p-4 text-white focus:outline-none text-xs resize-none transition-all"
                  />
                </div>

                {/* 무대 사진 유료 옵션 (임시 주석 처리)
                <div className="bg-[#1d1f1d] border border-white/5 rounded-lg p-4 flex justify-between items-center gap-4">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id="editPlayerService"
                      checked={editingInvoice.playerService}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, playerService: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-accent bg-black border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="editPlayerService" className="text-xs font-bold text-white block cursor-pointer">
                        무대 전문 사진 촬영 서비스 신청 (선택)
                      </label>
                      <span className="text-[11px] text-white/40 block">공식 미디어 제휴를 통한 고화질 무대 정밀 보정 컷 5장 제공 (+{PHOTO_SERVICE_PRICE.toLocaleString()}원)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoDetailOpen(true)}
                    className="bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-3 py-1.5 rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                  >
                    상세 정보
                  </button>
                </div>
                */}

                {/* 스텝 이동 및 다음 단계 버튼 */}
                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-4">
                  {hasNotice ? (
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      이전 단계 (공지사항)
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingValidate) {
                        goToNextStep();
                      } else {
                        showAlert('필수 인적 사항(* 표시)을 올바르게 채워주셔야 다음 단계로 진입하실 수 있습니다.', '필수 입력 누락');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      isEditingValidate 
                        ? 'bg-accent text-black font-black hover:bg-white'
                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {hasNotice ? '3단계 종목 선택으로 이동' : '2단계 종목 선택으로 이동'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY & GRADE SELECTION */}
            {currentStepId === 'joins' && (
              <div className="space-y-6 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                      <Dribbble className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                      <span>2. 참가 종목 및 체급 선택</span>
                    </h3>
                    <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">출전하고자 하는 부문의 세부 체급을 선택하세요.</p>
                  </div>
                  
                  <div className="flex flex-row sm:flex-row w-full sm:w-auto gap-2">
                    <button
                      type="button"
                      onClick={() => setChkAllItem(!chkAllItem)}
                      className="flex-1 sm:flex-none text-center bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white text-[10px] px-3.5 py-2.5 rounded font-bold transition-colors cursor-pointer"
                    >
                      {chkAllItem ? '성별 맞춤 종목만 보기' : '전체 종목 리스트 보기'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetEditSelections}
                      className="flex-1 sm:flex-none text-center bg-red-950/20 border border-red-900/30 text-red-200 text-[10px] px-3.5 py-2.5 rounded font-bold hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      선택 초기화
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-white/40 leading-relaxed font-sans">
                  * 대회 규정에 의거하여 나이/성별에 따른 제한 조건을 확인해 주시기 바랍니다. (상향 지원은 가능하나 하향 지원 불가)<br />
                  * 종목 카드 내부의 체급 선택 박스를 누르고 원하는 세부 체급을 지정하면 신청 목록에 추가됩니다.
                </p>

                <div className="divide-y divide-white/5 border-t border-b border-white/10 py-1">
                  {filteredCategories.map((cat: Category) => {
                    const matchGrades = grades.filter((g: Grade) => g.refCategoryId === cat.contestCategoryId);
                    const selectedJoinObj = editingInvoice.joins.find((j: JoinItem) => j.contestCategoryId === cat.contestCategoryId);
                    const isSelected = !!selectedJoinObj;

                    return (
                      <div 
                        key={cat.contestCategoryId}
                        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 transition-all duration-200 ${
                          isSelected 
                            ? 'bg-accent/[0.02] px-3 md:px-5 -mx-3 md:-mx-5 rounded-lg' 
                            : ''
                        }`}
                      >
                        <div className="mb-2 sm:mb-0">
                          <span className={`text-[9px] md:text-[10px] uppercase font-mono px-2 py-0.5 rounded mr-2.5 font-bold ${
                            cat.contestCategoryGender === '남' 
                              ? 'bg-blue-950/60 text-blue-300' 
                              : cat.contestCategoryGender === '여'
                                ? 'bg-pink-950/60 text-pink-300'
                                : 'bg-zinc-800/80 text-zinc-300'
                          }`}>
                            {cat.contestCategoryGender}성 부문
                          </span>
                          <span className="text-xs md:text-sm font-bold text-white tracking-tight">{cat.contestCategoryTitle}</span>
                          {isSelected && (
                            <span className="ml-2.5 text-xs md:text-sm text-accent font-bold font-mono">
                              ✓ {selectedJoinObj.contestGradeTitle}
                            </span>
                          )}
                        </div>

                        <div className="w-full sm:w-auto shrink-0 relative">
                          {matchGrades.length > 0 ? (
                            <div className="relative">
                              <select
                                onChange={(e) => handleEditCategorySelect(cat.contestCategoryId, cat.contestCategoryTitle, cat.contestCategoryPriceType, e)}
                                className="category-dropdown w-full sm:w-[220px] bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded pl-3 pr-8 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-accent appearance-none font-bold cursor-pointer transition-all"
                                value={selectedJoinObj ? `${selectedJoinObj.contestGradeId}|${selectedJoinObj.contestGradeTitle}` : ""}
                              >
                                <option value="">체급 선택 (신청 안 함)</option>
                                {matchGrades.map((grade) => (
                                  <option 
                                    key={grade.contestGradeId} 
                                    value={`${grade.contestGradeId}|${grade.contestGradeTitle}`}
                                  >
                                    {grade.contestGradeTitle}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px] md:text-[10px]">▼</div>
                            </div>
                          ) : (
                            <span className="text-xs md:text-sm text-white/40 font-mono">N/A</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 스텝 네비게이션 */}
                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between gap-4">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all cursor-pointer"
                  >
                    이전 단계 (인적 정보)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingInvoice.joins?.length > 0) {
                        goToNextStep();
                      } else {
                        showAlert('최소 1개 이상의 참가 부문 및 체급을 선택하셔야 다음 단계로 가실 수 있습니다.', '신청 종목 미선택');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      editingInvoice.joins?.length > 0
                        ? 'bg-accent text-black font-black hover:bg-white'
                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {hasNotice ? '4단계 최종 확인으로 이동' : '3단계 최종 확인으로 이동'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PRIVACY POLICY & FINAL SUBMIT */}
            {currentStepId === 'pledge' && (
              <div className="space-y-8 transition-all duration-300">
                <div className="border-b border-white/10 pb-4 mb-6">
                  <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                    <ShieldCheck className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                    <span>3. 서약 및 최종 확인서 제출</span>
                  </h3>
                  <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">제출 전 최종 계약 약관 동의 및 수수료 내역을 검토합니다.</p>
                </div>

                {/* REALTIME PRICE SUMMARY */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-lg relative">
                  <div className="bg-white/[0.02] p-4 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] md:text-xs text-white/60 font-bold">참가 신청 영수증 (수정본)</span>
                    <span className="text-[9px] md:text-[10px] text-accent font-mono font-bold">YBBF 접수 시스템</span>
                  </div>
                  
                  <div className="p-6 md:p-8 space-y-4 font-mono text-xs md:text-sm">
                    <div className="flex justify-between items-center text-white/60">
                      <span>기본 출전 참가비</span>
                      <span className="text-white font-bold">
                        {(() => {
                          const joins = editingInvoice.joins || [];
                          const hasType1 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입1');
                          const hasType2 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입2');
                          
                          let basePrice = Number(editingInvoice.contestPriceBasic) || 0;
                          if (joins.length > 0) {
                            if (hasType1) {
                              basePrice = Number(editingInvoice.contestPriceType1) || 0;
                            } else if (hasType2) {
                              basePrice = Number(editingInvoice.contestPriceType2) || 0;
                            }
                          }
                          return basePrice.toLocaleString();
                        })()} 원
                      </span>
                    </div>

                    {editingInvoice.joins.length > 1 && (
                      <div className="flex justify-between items-center text-white/60">
                        <span>중복 출전비 ({editingInvoice.joins.length - 1}개 추가)</span>
                        <span className="text-white font-bold">+{((editingInvoice.joins.length - 1) * (editingInvoice.contestPriceExtra || 0)).toLocaleString()} 원</span>
                      </div>
                    )}

                    {editingInvoice.playerService && (
                      <div className="flex justify-between items-center text-accent/95">
                        <span>📸 프리미엄 무대 고해상도 사진 서비스</span>
                        <span className="font-bold">+{PHOTO_SERVICE_PRICE.toLocaleString()} 원</span>
                      </div>
                    )}

                    <div className="border-t border-dashed border-white/10 my-4 pt-4"></div>

                    <div className="flex justify-between items-end">
                      <span className="text-white/60 text-xs md:text-sm font-bold">최종 납부 총액</span>
                      <div className="text-right">
                        <span className="text-2xl md:text-4xl font-display font-black italic text-accent">
                          {totalEditPrice.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRIVACY POLICY CONSENT */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                    <FileCheck className="w-4 h-4 text-accent" /> 개인정보 수집·이용 및 초상권 사용 동의
                  </h3>

                  <div 
                    data-lenis-prevent
                    onWheel={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3.5 h-[130px] overflow-y-auto text-[10px] md:text-[11px] text-white/40 space-y-3 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/10"
                  >
                    <div>
                      <h5 className="font-bold text-white/70 mb-0.5">제1조 (개인정보의 수집 및 이용 목적)</h5>
                      <p>용인특례시보디빌딩협회(YBBF)는 대회 참가 등록 및 접수 확인, 본인 식별, 대회 당일 본부석 대형 전광판(LED) 내 프로필 사진 표출, 대회 참가 규정 및 기록 관리, 공식 중계 방송(유튜브 라이브 스트리밍 등) 송출, 보도자료 배포 목적으로 신청자의 개인정보를 수집 및 이용합니다.</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-white/70 mb-0.5">제2조 (수집하는 개인정보 항목)</h5>
                      <p>필수 수집 항목: 성명, 생년월일, 성별, 휴대전화번호, 이메일, 소속 체육관/클럽 명칭, 참가 대회 카테고리/체급 및 <strong>업로드한 선수 프로필 사진 데이터</strong></p>
                    </div>
                    <div>
                      <h5 className="font-bold text-white/70 mb-0.5">제3조 (초상권 및 대회 미디어 송출 동의)</h5>
                      <p>대회 접수 시 제출한 프로필 사진과 대회 당일 무대 퍼포먼스 과정에서 촬영되는 일체의 사진, 동영상 저작물은 본부석 LED 대형 전광판 상영, 실시간 생중계 송출, 언론 배포 및 협회 공식 홈페이지 아카이빙 목적으로 활용되며 이에 대한 초상권과 영상 사용을 협회에 전적으로 허가합니다.</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-white/70 mb-0.5">제4조 (개인정보의 보유 및 이용 기간)</h5>
                      <p>수집한 선수의 개인정보는 대회 종료 및 정산 민원 처리가 끝나는 시점으로부터 <strong>1년 간 보관 후 즉시 영구 파기</strong>합니다. 다만, 공식 시상 내역 및 참가 기록 관리를 위한 대회 대장(성명, 소속, 종목, 순위) 정보는 협회 보존 기준에 의거하여 준영구 보관됩니다.</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-white/70 mb-0.5">제5조 (동의 거부 권리 및 불이익 고지)</h5>
                      <p>신청 선수는 개인정보의 수집·이용 및 초상권 허가에 대한 동의를 거부할 권리가 있습니다. 단, 본 조항들은 원활한 대회 참가 접수와 무대 심사 운영을 위한 필수 요건이므로 동의를 거부하시는 경우 대회 접수 및 출전이 불가능합니다.</p>
                    </div>
                  </div>

                  <div className="flex items-center py-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={policyAccepted}
                        onChange={(e) => setPolicyAccepted(e.target.checked)}
                        className="w-4 h-4 rounded text-accent bg-black border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs md:text-sm text-white/80 font-bold">
                        <span className="text-accent mr-1">[필수]</span> 위 개인정보 및 방송/전광판 초상권 이용에 관한 동의서 내용을 확인했으며 이에 전적으로 동의합니다.
                      </span>
                    </label>
                  </div>
                </div>

                {/* 스텝 이동 및 제출 */}
                <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between gap-4">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    이전 단계 (종목선택)
                  </button>

                  {isEditingValidate && editingInvoice.joins?.length > 0 && policyAccepted ? (
                    <button 
                      type="button"
                      onClick={goToNextStep}
                      className="w-full sm:w-auto text-center bg-accent text-black font-black italic text-xs sm:text-sm tracking-widest uppercase px-8 py-3.5 rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(196,255,0,0.2)] cursor-pointer"
                    >
                      수정 정보 최종 확인
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled
                      className="w-full sm:w-auto bg-white/5 text-white/30 font-bold text-[11px] sm:text-xs py-3.5 px-6 rounded cursor-not-allowed border border-white/5 text-center flex items-center justify-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" /> 개인정보 동의 조항에 동의하셔야 수정 제출 가능합니다.
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: FINAL CHECK */}
            {currentStepId === 'confirm' && (
              <div className="space-y-8 transition-all duration-300">
                <div className="border-b border-white/10 pb-4 mb-6">
                  <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                    <ShieldCheck className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                    <span>{hasNotice ? '5' : '4'}. 참가 신청 수정 정보 최종 확인</span>
                  </h3>
                  <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">
                    작성하신 신청 정보가 정확한지 다시 한번 최종 검토해 주시기 바랍니다. 제출 시 기존 등록된 무대 채점 테이블 및 엔트리는 초기화되며, 재검토가 완료될 때까지 입금 여부가 미확인으로 유지됩니다.
                  </p>
                </div>

                {/* 메인 정보 요약 보드 */}
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
                    
                    {/* 인적 사항 그리드 */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:col-span-3 text-xs">
                      <div>
                        <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">선수명</span>
                        <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerName}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">성별</span>
                        <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerGender === 'm' ? '남자' : '여자'}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">생년월일</span>
                        <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerBirth}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">연락처</span>
                        <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerTel}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">소속 체육관</span>
                        <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerGym || '무소속'}</span>
                      </div>
                    </div>

                    {/* 프로필 이미지 미리보기 */}
                    <div className="flex flex-col items-center justify-center sm:border-l sm:border-white/10 sm:pl-6 gap-2 w-full sm:col-span-1 shrink-0">
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold sm:hidden">프로필 사진</span>
                      {photosList.length > 0 ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-accent/30 shadow relative bg-[#161a16] shrink-0">
                            <img src={photosList[0].url} alt="대표 선수프로필" className="w-full h-full object-cover" />
                          </div>
                          {photosList.length > 1 ? (
                            <span className="text-[10px] text-accent font-mono tracking-tighter whitespace-nowrap">
                              대표 사진 외 {photosList.length - 1}장
                            </span>
                          ) : (
                            <span className="text-[10px] text-accent/70 font-mono tracking-tighter whitespace-nowrap">
                              대표 사진 1장
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/20 text-[10px] md:text-xs text-center shrink-0 leading-tight">
                          <span>사진 미등록</span>
                        </div>
                      )}
                      <span className="text-[10px] text-accent/70 font-mono tracking-tighter whitespace-nowrap">전광판 송출용</span>
                    </div>
                  </div>

                  {/* 참가 신청 종목 리스트 */}
                  <div className="border-t border-white/5 pt-4">
                    <span className="text-white/50 block text-[11px] md:text-xs font-semibold mb-2">선택 참가 종목 ({editingInvoice.joins?.length}개 부문)</span>
                    <div className="space-y-1.5 font-sans">
                      {editingInvoice.joins?.map((join: JoinItem, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-white/80 font-bold text-xs md:text-sm bg-[#0a0a0a] px-3.5 py-2.5 rounded-lg border border-white/5">
                          <span className="break-keep">• {join.contestCategoryTitle}</span>
                          <span className="text-accent text-[11px] md:text-xs whitespace-nowrap bg-accent/5 px-2 py-0.5 rounded border border-accent/20">{join.contestGradeTitle}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 추가 서비스 정보 */}
                  {editingInvoice.playerService && (
                    <div className="border-t border-white/5 pt-4 flex justify-between items-center text-accent text-xs font-bold bg-accent/5 -mx-6 md:-mx-10 px-6 md:px-10 py-2.5">
                      <span>📸 프리미엄 고해상도 무대 촬영 서비스 신청</span>
                      <span className="text-white">+{PHOTO_SERVICE_PRICE.toLocaleString()}원</span>
                    </div>
                  )}

                  {/* 최종 합계 청구액 */}
                  <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                    <span className="text-white/80 text-xs sm:text-sm font-bold">최종 변경 청구 금액</span>
                    <span className="text-xl sm:text-2xl font-black text-accent">{totalEditPrice.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 입금 계좌 정보 */}
                <div className="bg-[#1d1f1d] border border-white/10 rounded-xl p-5 text-left mt-6">
                  <h4 className="text-xs font-bold text-accent mb-2.5 flex items-center gap-2 uppercase tracking-wider font-mono">
                    <CreditCard className="w-4 h-4" /> 입금 계좌 정보 (무통장 입금)
                  </h4>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3.5 text-xs font-mono text-white/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">은행명</span>
                      <span className="font-bold text-white">{editingInvoice.contestBankName}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-white/40 shrink-0">계좌번호</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-white select-all truncate">{editingInvoice.contestAccountNumber}</span>
                        <button 
                          type="button"
                          onClick={handleCopyAccount}
                          className="bg-white/5 hover:bg-white/10 hover:text-accent hover:border-accent/40 px-2 py-1 rounded text-white text-[10px] md:text-xs transition-all border border-white/10 flex items-center gap-1 font-sans cursor-pointer active:scale-95 shrink-0"
                          title="계좌번호 복사"
                        >
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">예금주</span>
                      <span className="font-bold text-accent">{editingInvoice.contestAccountOwner}</span>
                    </div>
                  </div>
                  {copySuccess && (
                    <p className="text-center text-[10px] text-accent mt-2 font-mono">계좌 정보가 클립보드에 복사되었습니다!</p>
                  )}
                </div>

                {/* 하단 버튼 2개 */}
                <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between gap-4">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    이전 단계 (서약 및 약관)
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalEditSubmit}
                    disabled={isSubmitting || isPhotoUploading}
                    className="w-full sm:w-auto text-center bg-accent hover:bg-white text-black font-black italic text-xs sm:text-sm tracking-widest uppercase px-8 py-3.5 rounded transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        {isPhotoUploading ? '사진 업로드 중...' : '변경 내용 저장 중...'}
                      </>
                    ) : (
                      '참가 신청 정보 변경 완료'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* MODAL 1: PHOTO SERVICE DETAILS (임시 주석 처리)
        {isPhotoDetailOpen && (
          <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#161a16] border border-white/15 rounded-xl max-w-[450px] w-full p-6 relative shadow-2xl">
              <button 
                onClick={() => setIsPhotoDetailOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-sm font-bold text-accent mb-4 font-mono uppercase tracking-wider">📸 무대 고해상도 사진 촬영 서비스</h4>
              <div className="text-xs text-white/70 space-y-4 leading-relaxed font-sans">
                <p>
                  대회 공식 촬영 미디어사와 협약하여 운영되는 프리미엄 선수 미디어 팩입니다.
                </p>
                <div className="bg-[#0a0a0a] p-4 rounded border border-white/5 space-y-1.5 font-mono text-[11px]">
                  <div>• 사진 규격: 사진관 고해상도 보정 5장</div>
                  <div>• 서비스 가격: {PHOTO_SERVICE_PRICE.toLocaleString()}원</div>
                  <div>• 안내/문의: 정태천 대표 (010-4886-0047)</div>
                  <div className="border-t border-white/10 pt-2 mt-2 text-accent">
                    * 우리은행 1002-250-33892 정태천 계좌로 참가비와 별도로 직접 추가 송금해주셔도 신청 가능합니다.
                  </div>
                </div>
                <p>
                  제출된 무대 보정본 사진은 선수 개인 소장용 외에도 YBBF 공식 홈페이지 레전드/유스관 아카이빙 및 홍보 자료로 등재될 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setIsPhotoDetailOpen(false)}
                className="w-full bg-accent text-black font-bold py-3 rounded text-xs mt-6 uppercase cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        )}
        */}



        {/* MODAL 2: INTRO VIDEO DEMO */}
        {isDemoOpen && (
          <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#161a16] border border-white/10 rounded-2xl max-w-3xl w-full p-6 relative shadow-2xl">
              <button 
                onClick={handleCloseDemo}
                className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 p-2 rounded-full border border-white/10 transition cursor-pointer"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-sm font-bold text-accent mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" /> 전광판 선수 등장 연출 예시
              </h4>
              
              <div className="space-y-4">
                <video
                  src="https://ybbf-media-worker.jbkim.workers.dev/api/photos/player_photos/intro_video_선수소개.mp4"
                  controls
                  autoPlay
                  className="w-full aspect-video rounded-xl border border-white/10 bg-black shadow-lg"
                />
                <p className="text-[11px] md:text-xs text-white/50 leading-relaxed font-sans text-center break-keep">
                  * 대회 본선 진입 시, 대형 LED 스크린 전광판에 선수가 등록한 사진과 프로필이 웅장한 연출 효과와 함께 자동 표출됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CUSTOM ALERT */}
        {alertState.isOpen && (
          <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#161a16] border border-white/10 rounded-xl max-w-[380px] w-full p-6 relative shadow-2xl">
              <div className="text-center">
                <div className="w-11 h-11 bg-red-950/30 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3.5 text-red-400">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
                
                <h4 className="text-sm md:text-base font-bold text-white mb-2.5 tracking-tight">
                  {alertState.title || '안내'}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed mb-6 font-sans break-keep">
                  {alertState.message}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const callback = alertState.onConfirm;
                    setAlertState({ isOpen: false, title: '', message: '' });
                    if (callback) {
                      callback();
                    }
                  }}
                  className="w-full bg-[#1d1f1d] hover:bg-white hover:text-black border border-white/10 text-white font-bold py-3.5 rounded-lg text-xs transition-colors cursor-pointer"
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

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-28 pb-24 px-4 sm:px-6 md:px-12 max-w-[1200px] mx-auto font-sans relative overflow-hidden">
      
      {/* Background neon glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* HEADER: USER CARD */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
        
        {/* User Photo */}
        <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shrink-0 bg-[#020202] flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt="선수 사진" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-12 h-12 text-white/30" />
          )}
        </div>

        {/* User Summary info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
            <h1 className="text-2xl font-bold font-sans tracking-tight">
              {user.profile?.name || user.email.split('@')[0]}
            </h1>
            <span className="text-[10px] bg-accent/25 border border-accent/40 text-accent font-black px-2 py-0.5 rounded tracking-wide font-mono uppercase">
              {user.roles.includes('admin') ? 'ADMIN' : 'ATHLETE'}
            </span>
          </div>
          <p className="text-white/50 text-xs sm:text-sm font-mono mb-1">{user.email}</p>
          <p className="text-white/40 text-[11px] break-keep">
            소속: <span className="text-white/80 font-bold">{user.profile?.gym || '무소속'}</span> | 성별: <span className="text-white/80 font-bold">{user.profile?.gender === 'm' ? '남성' : '여성'}</span>
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 px-5 py-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-white/10 mb-8 gap-4">
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3.5 text-sm sm:text-base font-bold tracking-wider relative transition-colors ${
            activeTab === 'history' ? 'text-accent' : 'text-white/40 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5" /> 활동 및 신청 내역 ({invoices.length})
          </span>
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-accent rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3.5 text-sm sm:text-base font-bold tracking-wider relative transition-colors ${
            activeTab === 'profile' ? 'text-accent' : 'text-white/40 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <UserCheck className="w-4.5 h-4.5" /> 개인정보 수정
          </span>
          {activeTab === 'profile' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-accent rounded-full"></div>
          )}
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="transition-all duration-300">
        
        {/* 1. HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-2">
              <h2 className="text-base sm:text-lg font-bold text-accent tracking-tight flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-accent" />
                대회 참가 신청 내역 아카이브
              </h2>
              <p className="text-xs text-white/50 mt-1">용인시보디빌딩협회 공식 대회 접수 목록입니다.</p>
            </div>

            {isInvoicesLoading ? (
              <div className="text-center py-20">
                <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
                <p className="text-xs text-white/40 font-mono">신청 목록 호출 중...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#0c0c0c]/30">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white/60 mb-1">대회 참가 신청 내역이 없습니다.</p>
                <p className="text-xs text-white/40 mb-5">YBBF 공식 대회에 참가하여 활동 기록을 남겨보세요.</p>
                <button
                  onClick={() => navigate('/competition')}
                  className="bg-accent hover:bg-white text-black font-black text-xs px-5 py-3 rounded-lg transition-colors"
                >
                  공식 대회 접수처 바로가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {invoices.map((inv) => (
                  <div 
                    key={inv.id}
                    className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-accent/30 group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-white/5">
                      <div>
                        <span className="text-xs md:text-sm text-accent font-bold block mb-1">
                          {inv.contestDate} • {inv.contestLocation}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                          {inv.contestTitle}
                        </h3>
                      </div>
                      <div className="text-right sm:text-right shrink-0">
                        <span className="text-[10px] md:text-xs text-white/40 font-mono block">결제 금액</span>
                        <span className="text-xl sm:text-2xl font-display font-black italic text-accent">
                          {(inv.contestPriceTotal || 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div>
                        <span className="text-xs text-white/40 block mb-1.5">신청 상세 종목</span>
                        <div className="space-y-1">
                          {inv.joins && Array.isArray(inv.joins) && inv.joins.map((join: JoinItem, idx: number) => (
                            <div key={idx} className="bg-[#0a0a0a] border border-white/5 px-3.5 py-2.5 rounded flex justify-between items-center text-xs sm:text-sm">
                              <span className="font-bold">• {join.contestCategoryTitle}</span>
                              <span className="text-accent font-mono text-[11px] border border-accent/20 bg-accent/5 px-2.5 py-0.5 rounded font-bold">
                                {join.contestGradeTitle}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 등록 사진 및 사전계측 자료 통합 컬럼 */}
                      <div className="border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col space-y-4">
                        <div>
                          <span className="text-xs text-white/40 block mb-2">등록 프로필 사진 ({((inv.playerPhotoUrls && inv.playerPhotoUrls.length) || (inv.playerPhotoUrl ? 1 : 0))}장)</span>
                          <div className="flex flex-wrap gap-2.5">
                            {inv.playerPhotoUrls && inv.playerPhotoUrls.length > 0 ? (
                              inv.playerPhotoUrls.map((url: string, i: number) => (
                                <button 
                                  key={i}
                                  type="button"
                                  onClick={() => setActiveLightboxMedia({ type: 'image', url })}
                                  className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent transition-all duration-200 block bg-[#161a16] shrink-0 group/photo hover:scale-[1.05] text-left"
                                  title="크게 보기"
                                >
                                  <img src={url} alt={`선수 사진 ${i + 1}`} className="w-full h-full object-cover" />
                                  {i === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 bg-accent text-black text-[8px] font-black text-center py-0.5 leading-none">
                                      대표
                                    </span>
                                  )}
                                </button>
                              ))
                            ) : inv.playerPhotoUrl ? (
                              <button 
                                type="button"
                                onClick={() => setActiveLightboxMedia({ type: 'image', url: inv.playerPhotoUrl! })}
                                className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent transition-all duration-200 block bg-[#161a16] shrink-0 hover:scale-[1.05] text-left"
                                title="크게 보기"
                              >
                                <img src={inv.playerPhotoUrl} alt="선수 사진" className="w-full h-full object-cover" />
                                <span className="absolute bottom-0 left-0 right-0 bg-accent text-black text-[8px] font-black text-center py-0.5 leading-none">
                                  대표
                                </span>
                              </button>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => handleEditClickWithWarning(inv)}
                                className="w-14 h-14 rounded-lg border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/20 hover:border-accent flex flex-col items-center justify-center text-[10px] text-accent font-bold text-center leading-tight transition-all duration-200 cursor-pointer group/nophoto shrink-0 shadow-sm shadow-accent/5 hover:scale-[1.05]"
                                title="클릭하여 프로필 사진 바로 등록하기"
                              >
                                <Upload className="w-3.5 h-3.5 mb-0.5 text-accent group-hover/nophoto:scale-110 transition-transform" />
                                <span>사진 등록</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 flex flex-col">
                          <span className="text-xs text-white/40 block mb-2">사전계측 증빙 자료</span>
                          {preMeasurementStatuses[inv.contestId]?.submitted ? (
                            <div className="flex flex-wrap items-center gap-2.5">
                              {preMeasurementStatuses[inv.contestId].data?.mediaType === 'video' ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveLightboxMedia({
                                    type: 'video',
                                    url: preMeasurementStatuses[inv.contestId].data.mediaUrl
                                  })}
                                  className="w-14 h-14 rounded-lg border border-accent/20 bg-[#2d4a1f]/10 hover:border-accent hover:scale-[1.05] transition-all duration-200 flex flex-col items-center justify-center text-[10px] text-accent font-bold shrink-0 cursor-pointer"
                                  title="동영상 보기"
                                >
                                  <Video className="w-5 h-5 mb-0.5 text-accent" />
                                  <span>비디오</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveLightboxMedia({
                                    type: 'image',
                                    url: preMeasurementStatuses[inv.contestId].data.mediaUrl
                                  })}
                                  className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent hover:scale-[1.05] transition-all duration-200 block bg-[#161a16] shrink-0 cursor-pointer"
                                  title="사진 크게 보기"
                                >
                                  <img
                                    src={preMeasurementStatuses[inv.contestId].data.mediaUrl}
                                    alt="사전계측 사진"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )}
                              <span className="text-[9px] text-accent font-mono font-bold bg-[#2d4a1f]/20 border border-accent/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                제출완료
                              </span>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-[10px] text-white/25 text-center leading-tight">
                              미제출
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-white/40 block mb-0.5">접수 번호</span>
                            <span className="font-mono text-white/80 font-bold select-all break-all">{inv.id}</span>
                          </div>
                          <div>
                            <span className="text-white/40 block mb-0.5">제출일자</span>
                            <span className="text-white/80 font-bold">{formatDisplayDate(inv.submittedAt, inv.invoiceCreateAt)}</span>
                          </div>
                        </div>

                        {/* Status Check badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs font-mono font-bold w-full">
                          <span className={`px-3 py-1.5 rounded border flex items-center gap-1.5 ${
                            inv.isPriceCheck 
                              ? 'bg-accent/10 border-accent/30 text-accent' 
                              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          }`}>
                            <CheckCircle className="w-4 h-4" />
                            입금여부: {inv.isPriceCheck ? '확인완료' : '확정대기'}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/pre-measurement?contestId=${inv.contestId}`)}
                              className="flex items-center gap-1.5 border border-white/20 bg-white/5 hover:bg-accent hover:text-black hover:border-accent text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              사전계측 자료 제출
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClickWithWarning(inv)}
                              className="flex items-center gap-1.5 border border-accent/30 bg-accent/5 hover:bg-accent hover:text-black hover:border-accent text-accent px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              참가신청 변경
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deposit bank details for pending payment */}
                    {!inv.isPriceCheck && inv.contestBankName && inv.contestAccountNumber && (
                      <div className="mt-5 p-5 bg-[#020202] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                        <div className="space-y-2">
                          <span className="text-white/40 block text-xs font-bold uppercase tracking-wider">무통장 입금 계좌 정보</span>
                          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                            <span className="text-accent font-black text-base sm:text-lg">{inv.contestBankName}</span>
                            <span className="text-white font-mono text-base sm:text-lg font-bold select-all">{inv.contestAccountNumber}</span>
                            <span className="text-white/60 text-xs sm:text-sm font-semibold">(예금주: 용인시보디빌딩협회)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(inv.contestAccountNumber || '');
                            alert('계좌번호가 복사되었습니다!');
                          }}
                          className="px-4 py-2.5 bg-accent/10 hover:bg-accent hover:text-black border border-accent/20 hover:border-accent text-accent text-xs sm:text-sm font-black rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          계좌번호 복사
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. PROFILE EDIT TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-[600px] mx-auto bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <h2 className="text-base sm:text-lg font-bold text-accent tracking-tight flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
              <Edit2 className="w-5 h-5" /> 개인 신원 정보 수정
            </h2>

            {saveSuccess && (
              <div className="bg-accent/10 border border-accent/30 text-accent px-4 py-3 rounded-xl mb-6 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>선수 개인정보가 성공적으로 업데이트되었습니다!</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Account ID / Email View (Read-Only) */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-xs font-mono">
                <span className="text-white/40 block text-[9px] font-bold mb-1 uppercase tracking-wider">가입 계정 이메일</span>
                <span className="text-white font-bold">{user.email}</span>
                <span className="text-accent ml-2 text-[9px] bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded uppercase font-semibold">{user.provider}</span>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">선수명 (실명)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={isAuthLoading}
                    placeholder="실명 입력"
                    className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                      validation.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                    }`}
                  />
                  <UserIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                </div>
                {validation.name && <p className="text-red-400 text-[10px] mt-1.5">이름은 2자 이상 입력해야 합니다.</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">성별</label>
                <div className="grid grid-cols-2 gap-2.5 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setProfileData({ ...profileData, gender: 'm' })}
                    disabled={isAuthLoading}
                    className={`border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
                      profileData.gender === 'm'
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'border-white/10 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    남자
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileData({ ...profileData, gender: 'f' })}
                    disabled={isAuthLoading}
                    className={`border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
                      profileData.gender === 'f'
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'border-white/10 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    여자
                  </button>
                </div>
              </div>

              {/* Birth */}
              <div>
                <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">생년월일 (8자리)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.birth}
                    onChange={handleBirthChange}
                    disabled={isAuthLoading}
                    maxLength={10}
                    placeholder="YYYY-MM-DD"
                    className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                      validation.birth ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                    }`}
                  />
                  <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                </div>
                {validation.birth && <p className="text-red-400 text-[10px] mt-1.5">YYYY-MM-DD 형식으로 기입하세요.</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">휴대전화번호</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={profileData.tel}
                    onChange={handleTelChange}
                    disabled={isAuthLoading}
                    maxLength={13}
                    placeholder="010-0000-0000"
                    className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none font-mono tracking-wide transition-colors ${
                      validation.tel ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                    }`}
                  />
                  <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                </div>
                {validation.tel && <p className="text-red-400 text-[10px] mt-1.5">연락처 번호 구조가 올바르지 않습니다.</p>}
              </div>

              {/* Gym */}
              <div>
                <label className="text-[10px] sm:text-xs text-white/50 block font-semibold mb-1.5">소속 체육관</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.gym}
                    onChange={(e) => setProfileData({ ...profileData, gym: e.target.value })}
                    disabled={isAuthLoading}
                    placeholder="소속 체육관명"
                    className={`w-full bg-[#0a0a0a] border rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                      validation.gym ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/40'
                    }`}
                  />
                  <Building className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                </div>
                {validation.gym && <p className="text-red-400 text-[10px] mt-1.5">체육관 혹은 무소속이라 기재해주세요.</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || isAuthLoading}
                className="w-full bg-accent disabled:bg-white/10 disabled:text-white/20 hover:bg-white text-black font-black py-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 duration-200 mt-2"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  '개인정보 수정 완료'
                )}
              </button>

            </form>
          </div>
        )}

        {/* MODAL 1.5: LIGHTBOX FOR MEDIA URL HIDING */}
        {activeLightboxMedia && (
          <div 
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveLightboxMedia(null)}
          >
            <div 
              className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveLightboxMedia(null)}
                className="absolute top-[-45px] right-0 md:right-[-40px] text-white/60 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer z-50"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full h-full bg-black/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                {activeLightboxMedia.type === 'video' ? (
                  <video 
                    src={activeLightboxMedia.url} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                ) : (
                  <img 
                    src={activeLightboxMedia.url} 
                    alt="크게 보기" 
                    className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
