import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  MapPin, 
  Calendar, 
  Building, 
  Copy, 
  FileText, 
  User, 
  Phone, 
  Dribbble, 
  FileCheck, 
  Check, 
  X, 
  Loader2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  ArrowUp
} from 'lucide-react';
import { 
  getContestNotice, 
  getContest, 
  getCategoryList, 
  getGradeList, 
  submitHybridRegistration,
  getMandatoryNotices,
  getUserInvoices
} from '../../services/registrationService';
import { useAuthStore } from '../../store/useAuthStore';
import { useUploadToR2 } from '../../hooks/useUploadToR2';
import PlayerIntroPage from '../overlay/PlayerIntroPage';
import { 
  ContestNotice, 
  Contest, 
  Category, 
  Grade, 
  JoinItem, 
  RegistrationPayload, 
  MandatoryNotice, 
  RegistrationSuccessInfo 
} from '../../types/registration';
import Loader from '../../components/shared/Loader';

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
      onWheel={(e) => e.stopPropagation()} // 💡 이중 스크롤 체이닝 방지 (마우스 휠 스크롤이 상위 스크롤 영역에 삼켜지지 않도록 방지)
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="max-h-[300px] overflow-y-auto overscroll-contain border border-white/10 p-5 rounded-lg bg-black/40 leading-relaxed text-white/80 text-xs md:text-sm font-sans relative"
      style={{ whiteSpace: 'pre-wrap' }} // 💡 HTML이 아닌 플레인 텍스트 줄바꿈(\n)도 화면에 정상 개행 렌더링되도록 조치
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <div ref={sentinelRef} className="h-1 w-full pointer-events-none" />
    </div>
  );
}

// 💡 무대 전문 사진 촬영 서비스 비용 단일 상수 설정
const PHOTO_SERVICE_PRICE = 60000;

// 💡 필수공지용 유튜브 플레이어 (시청 완료 검출 포함)
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

interface RegistrationPhaseProps {
  activeNoticeId?: string;
  activeContestId?: string;
}

export default function RegistrationPhase({ activeNoticeId, activeContestId }: RegistrationPhaseProps = {}) {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuthStore();

  // 데이터 로딩 & 에러 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // 💡 비로그인 시 로그인 페이지로 강제 리다이렉트 (로그인 필수 접수)
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  // DB 연동 데이터
  const [noticeInfo, setNoticeInfo] = useState<ContestNotice | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // 💡 신규 UI/UX 상태 (Multi-step & R2 업로드용)
  const stepperRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [photosList, setPhotosList] = useState<{ id: string; file: File | null; url: string }[]>([]);
  const { uploadPlayerPhotoToR2, isUploadingToR2: isPhotoUploading } = useUploadToR2();
  const [isDragActive, setIsDragActive] = useState(false);

  // 커스텀 전용 메시지 박스 (Alert) 상태
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    isConfirm?: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
  });

  const showAlert = (
    message: string, 
    title: string = '안내', 
    isConfirm: boolean = false, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setAlertState({ 
      isOpen: true, 
      title, 
      message, 
      isConfirm, 
      onConfirm, 
      onCancel,
      confirmText,
      cancelText
    });
  };

  // 폼 입력 상태
  const [invoiceInfo, setInvoiceInfo] = useState<RegistrationPayload>(() => {
    const generatedUid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    
    return {
      id: '',
      playerUid: user?.uid || generatedUid, // 💡 로그인된 유저의 UID를 우선적으로 바인딩
      playerName: '',
      playerGender: 'm',
      playerBirth: '',
      playerTel: '',
      playerEmail: '',
      playerGym: '',
      playerText: '',
      playerPhotoUrl: '', // 📷 R2 업로드 이미지 경로 저장 필드
      playerService: false,
      joins: [],
      contestPriceSum: 0,
      contestPriceTotal: 0,
      playerAge: null,
      isPriceCheck: false,
      isCanceled: false,
      invoiceEdited: false,
      createBy: '',
      invoiceCreateAt: '',
      submittedAt: '',
      contestId: '',
      contestTitle: '',
      contestDate: '',
      contestLocation: '',
      contestPromoter: '',
      contestCollectionFileLink: '',
      contestPriceBasic: 0,
      contestPriceExtra: 0,
      contestBankName: '',
      contestAccountNumber: '',
      contestAccountOwner: '',
    };
  });

  // 요금 정보
  const [totalPrice, setTotalPrice] = useState(0);

  // 모달 제어
  const [isPhotoDetailOpen, setIsPhotoDetailOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<RegistrationSuccessInfo | null>(null);

  // 💡 필수공지 및 정독/시청 검증 상태
  const [mandatoryNotices, setMandatoryNotices] = useState<MandatoryNotice[]>([]);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [scrollReadComplete, setScrollReadComplete] = useState(false);
  const [videoWatchedComplete, setVideoWatchedComplete] = useState(false);
  const [imagesViewedComplete, setImagesViewedComplete] = useState(false); // 💡 이미지 캐러셀 완독 검증 상태 추가
  const [agreedNoticeIds, setAgreedNoticeIds] = useState<string[]>([]);

  // 💡 가변형 스텝 정보 정의 및 도우미 함수
  const hasNotice = mandatoryNotices && mandatoryNotices.length > 0;
  const activeSteps = hasNotice
    ? ['notice', 'info', 'joins', 'pledge', 'confirm']
    : ['info', 'joins', 'pledge', 'confirm'];

  const currentStepId = activeSteps[currentStep - 1] || 'info';

  const goToStep = (stepId: string) => {
    const idx = activeSteps.indexOf(stepId);
    if (idx !== -1) {
      setCurrentStep(idx + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStep < activeSteps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // 필터링 옵션 (true = 성별 최적종목표시, false = 전체종목표시)
  const [chkAllItem, setChkAllItem] = useState(false);

  // 실시간 유효성 검사 상태
  const [playerValidate, setPlayerValidate] = useState({
    playerName: false,
    playerTel: false,
    playerBirth: false,
    playerGym: false,
  });
  const [isValidate, setIsValidate] = useState(false);

  // 복사 알림 토스트 상태
  const [copySuccess, setCopySuccess] = useState(false);

  // 로그인 상태인 경우 사용자 정보 자동 주입
  useEffect(() => {
    if (isAuthenticated && user) {
      setInvoiceInfo((prev: RegistrationPayload) => ({
        ...prev,
        playerUid: user.uid, // 💡 user.uid를 명확히 고정
        playerName: user.profile?.name || prev.playerName,
        playerGender: user.profile?.gender || prev.playerGender,
        playerBirth: user.profile?.birth || prev.playerBirth,
        playerTel: user.profile?.tel || prev.playerTel,
        playerEmail: user.email || prev.playerEmail,
        playerGym: user.profile?.gym || prev.playerGym,
      }));
    }
  }, [isAuthenticated, user]);

  // DB 데이터 불러오기
  useEffect(() => {
    async function loadContestData() {
      setIsLoading(true);
      setError(null);
      try {
        const targetNoticeId = contestId || activeNoticeId || 'L4fdAsJJWZv614zZCrH1';
        
        // 1. 공고 정보와 필수 공지사항을 병렬로 조회 시작
        const [noticeData, notices] = await Promise.all([
          getContestNotice(targetNoticeId),
          getMandatoryNotices()
        ]);
        
        setNoticeInfo(noticeData);
        setMandatoryNotices(notices);

        // 2. 공고 정보를 기반으로 대회 메타데이터 조회
        const contestData = await getContest(noticeData.refContestId || activeContestId || 'contest-2026');
        setContest(contestData);

        // 3. 카테고리와 체급 리스트를 병렬로 조회
        const [categoryData, gradeData] = await Promise.all([
          getCategoryList(contestData.contestCategorysListId),
          getGradeList(contestData.contestGradesListId)
        ]);
        
        setCategories(categoryData);
        setGrades(gradeData);
      } catch (err: any) {
        console.error(err);
        setError('대회 정보를 불러오는 도중 오류가 발생했습니다: ' + (err.message || ''));
      } finally {
        setIsLoading(false);
      }
    }
    loadContestData();
  }, [contestId, activeNoticeId, activeContestId]);

  // 💡 이미 접수한 내역이 있는지 체크
  useEffect(() => {
    // 로딩 중이거나 필요한 정보가 없으면 패스
    if (isLoading || isAuthLoading || !isAuthenticated || !user || !contest?.id) {
      return;
    }

    async function checkDuplicateRegistration() {
      try {
        const invoices = await getUserInvoices(user.uid);
        
        // 이 대회(contest.id)에 접수한 건 중 취소되지 않은 건이 있는지 확인
        const duplicateInvoice = invoices.find(
          (inv: any) => inv.contestId === contest.id && inv.isCanceled !== true
        );

        if (duplicateInvoice) {
          showAlert(
            '이미 본 대회에 접수한 내역이 존재합니다. 마이페이지에서 신청 정보를 수정하시겠습니까?',
            '이미 접수됨',
            true, // isConfirm
            () => {
              // "예" -> 마이페이지로 이동하며 해당 invoice ID를 state로 전달
              navigate('/mypage', { state: { editInvoiceId: duplicateInvoice.id } });
            },
            () => {
              // "아니오" -> 홈 화면으로 이동
              navigate('/');
            },
            '예 (수정하기)',
            '아니오 (홈으로)'
          );
        }
      } catch (err) {
        console.error('중복 접수 확인 오류:', err);
      }
    }

    checkDuplicateRegistration();
  }, [isLoading, isAuthLoading, isAuthenticated, user, contest?.id, navigate]);

  // 💡 유튜브 IFrame API 로드 스크립트 삽입 및 배경스크롤 락
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

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
      console.warn('부모 창의 body overflow 조절 권한 없음 (크로스 도메인 iframe), postMessage 전송 시도:', e);
      try {
        if (isDemoOpen) {
          window.parent.postMessage({ type: 'lock_scroll' }, '*');
          window.parent.postMessage('lock_scroll', '*');
        } else {
          window.parent.postMessage({ type: 'unlock_scroll' }, '*');
          window.parent.postMessage('unlock_scroll', '*');
        }
      } catch (postErr) {
        console.error('부모 창 postMessage 전송 실패:', postErr);
      }
    }

    return () => {
      try {
        document.body.style.overflow = 'unset';
        if (window.parent && window.parent !== window) {
          window.parent.document.body.style.overflow = 'unset';
        }
      } catch (e) {
        try {
          window.parent.postMessage({ type: 'unlock_scroll' }, '*');
          window.parent.postMessage('unlock_scroll', '*');
        } catch (postErr) {
          // ignore
        }
      }
    };
  }, [isDemoOpen]);

  // 💡 필수공지 다음 인덱스로 전환 시 검증 락 초기화
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

  // 공고/대회 정보 주입
  useEffect(() => {
    if (noticeInfo && contest) {
      setInvoiceInfo((prev: RegistrationPayload) => ({
        ...prev,
        contestId: contest.id || '',
        contestTitle: noticeInfo.contestTitle || '',
        contestDate: noticeInfo.contestDate || '',
        contestLocation: noticeInfo.contestLocation || '',
        contestPromoter: noticeInfo.contestPromoter || '',
        conntestPromoter: noticeInfo.contestPromoter || '', // 오타 대응
        contestCollectionFileLink: noticeInfo.contestCollectionFileLink || '',
        contestPriceBasic: noticeInfo.contestPriceBasic || 0,
        contestPriceExtra: noticeInfo.contestPriceExtra || 0,
        contestPriceExtraType: noticeInfo.contestPriceExtraType || '',
        contestPriceType1: noticeInfo.contestPriceType1 || '',
        contestPriceType2: noticeInfo.contestPriceType2 || '',
        contestBankName: noticeInfo.contestBankName || '',
        contestAccountNumber: noticeInfo.contestAccountNumber || '',
        contestAccountOwner: noticeInfo.contestAccountOwner || '',
        contestPoster: noticeInfo.contestPoster || '',
        contestPosterTheme: noticeInfo.contestPosterTheme || [],
        contestTitleShort: noticeInfo.contestTitleShort || '',
        contestAssociate: noticeInfo.contestAssociate || '',
        contestStatus: noticeInfo.contestStatus || '',
        contestCollectionName: noticeInfo.contestCollectionName || '',
      }));
    }
  }, [noticeInfo, contest]);

  // 성별/생년월일 변경 및 최적종목표시 토글 시 종목 필터링
  useEffect(() => {
    if (!categories.length) return;

    const genderLabel = invoiceInfo.playerGender === 'm' ? '남' : '여';

    // 🏆 그랑프리 종목 제외 필터링 (예선 1위 대상이므로 접수 신청 대상에서 제외)
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
      // 최적종목표시 (성별 일치 또는 성별무관)
      const filtered = nonGrandPrixCategories.filter(
        (cat: Category) => cat.contestCategoryGender === genderLabel || cat.contestCategoryGender === '무관'
      );
      setFilteredCategories(filtered);
    } else {
      // 전체종목표시
      setFilteredCategories(nonGrandPrixCategories);
    }
  }, [categories, invoiceInfo.playerGender, chkAllItem]);

  // 실시간 폼 유효성 검사 실행
  useEffect(() => {
    const isBirthValid = /^\d{4}-\d{2}-\d{2}$/.test(invoiceInfo.playerBirth);
    const isTelValid = /^\d{2,3}-\d{3,4}-\d{3,4}$/.test(invoiceInfo.playerTel);
    const isNameValid = invoiceInfo.playerName.trim().length >= 2;
    const isGymValid = invoiceInfo.playerGym.trim().length >= 1;

    setPlayerValidate({
      playerName: !isNameValid && invoiceInfo.playerName.length > 0,
      playerTel: !isTelValid && invoiceInfo.playerTel.length > 0,
      playerBirth: !isBirthValid && invoiceInfo.playerBirth.length > 0,
      playerGym: !isGymValid && invoiceInfo.playerGym.length > 0,
    });

    setIsValidate(isNameValid && isBirthValid && isTelValid && isGymValid);
  }, [invoiceInfo.playerName, invoiceInfo.playerBirth, invoiceInfo.playerTel, invoiceInfo.playerGym]);

  // 실시간 요금 계산
  useEffect(() => {
    if (!noticeInfo) return;
    
    const joins = invoiceInfo.joins || [];
    const joinsCount = joins.length;
    
    if (joinsCount === 0) {
      setTotalPrice(invoiceInfo.playerService ? PHOTO_SERVICE_PRICE : 0);
      return;
    }

    // 1. 학생부(타입1) 혹은 타입2 종목이 포함되어 있는지 여부에 따라 대표 기본 참가비 결정
    const hasType1 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입1');
    const hasType2 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입2');
    
    let basePrice = Number(noticeInfo.contestPriceBasic) || 0;
    if (hasType1) {
      basePrice = Number(noticeInfo.contestPriceType1) || 0; // 학생부 가격으로 시작
    } else if (hasType2) {
      basePrice = Number(noticeInfo.contestPriceType2) || 0;
    }

    const extra = Number(noticeInfo.contestPriceExtra) || 0;
    
    // 2. 총 요금 = 대표 기본 참가비 + (신청 종목 수 - 1) * 중복출전비
    let price = basePrice + (joinsCount - 1) * extra;
    
    if (invoiceInfo.playerService) {
      price += PHOTO_SERVICE_PRICE;
    }
    
    setTotalPrice(price);
  }, [invoiceInfo.joins, invoiceInfo.playerService, noticeInfo]);

  // 💡 아이프레임(iframe) 및 모바일/크로스 브라우징을 모두 지원하는 최상단 스크롤 헬퍼 함수
  const scrollToTop = () => {
    try {
      // 0. Lenis 스무스 스크롤 인스턴스가 전역 노출되어 있고 scrollTo 함수가 있는 경우 즉시 이동 처리
      if ((window as any).lenis && typeof (window as any).lenis.scrollTo === 'function') {
        (window as any).lenis.scrollTo(0, { immediate: true });
      }

      // 1. 현재 창의 window 객체 스크롤
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      
      // 2. document element 및 body 스크롤 강제 초기화
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // 3. 부모 창(iframe인 경우) 스크롤 시도 (동일 도메인/Origin 제한 대응)
      if (window.parent && window.parent !== window) {
        window.parent.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    } catch (e) {
      console.warn('부모 창 스크롤 제어 권한 없음 (크로스 도메인 iframe), postMessage 전송 시도:', e);
      try {
        // 크로스 도메인 iframe인 경우 부모 창에 postMessage를 발송하여 부모 단에서 상단으로 스크롤하도록 요청
        window.parent.postMessage({ type: 'scroll_to_top' }, '*');
        window.parent.postMessage('scroll_to_top', '*');
      } catch (postErr) {
        console.error('부모 창 postMessage 전송 실패:', postErr);
      }
    }
  };

  // 💡 부모 스크롤 락 해제 완료 대기 함수 (정상적으로 해제되면 Promise 해결)
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

      // 1. Local document 및 부모 창 스크롤 락 해제 시도
      try {
        document.body.style.overflow = 'unset';
        if (window.parent && window.parent !== window) {
          window.parent.document.body.style.overflow = 'unset';
          // 동일 도메인인 경우 즉시 동기식으로 해제 완료되므로 바로 완료 처리
          done();
          return;
        } else {
          done();
          return;
        }
      } catch (e) {
        console.warn('부모 창의 body overflow 조절 권한 없음 (크로스 도메인 iframe), postMessage 전송 시도:', e);
      }

      // 2. 크로스 도메인 iframe인 경우: 부모 창으로부터 스크롤 해제 완료 응답을 수신하는 리스너 등록
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
          console.log('부모 창으로부터 스크롤 해제 완료 확인 수신:', data);
          done();
        }
      };
      window.addEventListener('message', handleMessage);

      // 3. 부모 창으로 스크롤 해제 요청 전송
      try {
        window.parent.postMessage({ type: 'unlock_scroll' }, '*');
        window.parent.postMessage('unlock_scroll', '*');
      } catch (postErr) {
        console.error('부모 창 postMessage 전송 실패:', postErr);
      }

      // 4. Fallback 타임아웃 설정 (부모 창에서 응답을 보내지 않는 경우에도 150ms 대기 후 진행하여 먹통 방지)
      timeoutId = setTimeout(() => {
        console.log('부모 창 스크롤 해제 완료 대기 시간 초과 (150ms), 기본 진행');
        done();
      }, 150);
    });
  };

  // 💡 부모 스크롤 락 해제 및 상태 해제 순차 래퍼 함수 (닫히기 전 부모 스크롤을 먼저 완전히 복원)
  const handleCloseDemo = async () => {
    await requestUnlockScroll();
    setIsDemoOpen(false);
  };

  // 스텝(단계) 변경 시 무조건 화면 최상단(top: 0)으로 즉시 스크롤 이동하여 시인성 확보
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToTop();
  }, [currentStep]);

  // 스텝 4 (접수 완료 성공 화면) 진입 시 무조건 뷰포트 최상단으로 올라오게 처리
  useEffect(() => {
    if (isSuccess) {
      scrollToTop();
    }
  }, [isSuccess]);

  // 만 나이 계산 도우미
  const getPlayerAge = () => {
    if (!invoiceInfo.playerBirth || !/^\d{4}-\d{2}-\d{2}$/.test(invoiceInfo.playerBirth)) return null;
    const birth = new Date(invoiceInfo.playerBirth);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 계좌번호 클립보드 복사
  const handleCopyAccount = () => {
    if (!noticeInfo) return;
    navigator.clipboard.writeText(`${noticeInfo.contestBankName} ${noticeInfo.contestAccountNumber} ${noticeInfo.contestAccountOwner}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 공고문 파일 다운로드 모킹
  const handleDownloadFile = (url: string) => {
    window.open(url, '_blank');
  };

  // 폰트 포맷팅 (생년월일 하이픈)
  const handleBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 4 && val.length <= 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
    } else if (val.length > 6) {
      formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
    }
    setInvoiceInfo({ ...invoiceInfo, playerBirth: formatted });
  };

  // 폰트 포맷팅 (연락처 하이픈)
  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
    }
    setInvoiceInfo({ ...invoiceInfo, playerTel: formatted });
  };

  // 💡 드래그 앤 드롭 및 이미지 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // 종목 선택 핸들러
  const handleCategorySelect = (categoryId: string, categoryTitle: string, priceType: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const joins: JoinItem[] = [...invoiceInfo.joins];
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

    setInvoiceInfo({ ...invoiceInfo, joins });
  };

  // 선택 초기화
  const handleResetSelections = () => {
    setInvoiceInfo({ ...invoiceInfo, joins: [] });
    const selects = document.querySelectorAll('.category-dropdown');
    selects.forEach((select) => {
      (select as HTMLSelectElement).value = '';
    });
  };

  // YYYY-MM-DD HH:mm:ss 포맷 변환 함수
  const formatDateString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  // 최종 어댑터 전송 제출
  const handleFinalSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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

      const invoiceId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? 'inv_' + crypto.randomUUID()
        : 'inv_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const payload: RegistrationPayload = {
        ...invoiceInfo,
        id: invoiceId,
        playerPhotoUrl: uploadedUrls[0] || '',
        playerPhotoUrls: uploadedUrls,
        contestPriceSum: totalPrice,
        contestPriceTotal: totalPrice,
        playerAge: getPlayerAge(),
        isPriceCheck: false,
        isCanceled: false,
        invoiceEdited: false,
        createBy: 'online',
        invoiceCreateAt: formatDateString(new Date()),
        submittedAt: new Date().toISOString(),
      };
      
      try {
        const result = await submitHybridRegistration(payload);
        
        setSuccessInfo({
          invoiceId: result.invoiceId,
          d1Saved: result.d1Saved,
          d1Error: result.d1Error,
          ...payload,
        });
        setIsSuccess(true);
      } catch (firestoreErr: any) {
        // 💡 Firestore 저장 실패 시 R2 고아 파일 삭제 보상 트랜잭션 호출
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
      setError(err.message || '참가 신청 제출 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  // 접수 완료 성공 화면
  if (isSuccess && successInfo) {
    return (
      <div className="pt-32 pb-20 px-6 md:px-12 max-w-[700px] mx-auto min-h-screen bg-[#0a0a0a]">
        <div className="bg-[#161a16] border border-accent/30 rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent"></div>
          
          {!successInfo.d1Saved && (
            <div className="bg-yellow-950/40 border border-yellow-500/30 text-yellow-200 px-5 py-4 rounded-xl mb-6 text-left space-y-2 font-sans">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>데이터 동기화 지연 안내</span>
              </div>
              <p className="text-xs leading-relaxed text-yellow-100/80 break-keep">
                참가 신청서 접수는 정상적으로 완료되어 데이터베이스에 보관되었습니다. 다만, 현재 실시간 순위 집계 및 전광판 분석 시스템(D1)으로의 데이터 동기화가 지연되고 있습니다. 대회 사무국에서 수동으로 연동을 완료할 예정이오니 안심하셔도 됩니다. (오류 코드: {successInfo.d1Error || '동기화 응답 없음'})
              </p>
            </div>
          )}

          <div className="w-16 h-16 bg-accent/10 border border-accent rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
            <Check className="w-8 h-8" />
          </div>

          <h2 className="text-3xl md:text-4xl font-display font-black italic mb-2 tracking-tight text-white">접수 완료</h2>
          <p className="text-accent text-sm md:text-base font-bold mb-8">본 대회 접수가 무사히 완료되었습니다. 감사합니다.</p>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4 font-sans">
            <div>
              <span className="text-[10px] text-white/40 uppercase font-mono block">접수 번호 (Invoice ID)</span>
              <span className="text-white font-mono text-sm break-all font-bold select-all">{successInfo.invoiceId}</span>
            </div>
            
            <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-white/40 uppercase block">선수 성명</span>
                <span className="text-white font-bold text-sm">{successInfo.playerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase block">생년월일 (만 나이)</span>
                <span className="text-white font-bold text-sm">{successInfo.playerBirth} ({successInfo.playerAge ? `만 ${successInfo.playerAge}세` : '-'})</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <span className="text-[10px] text-white/40 uppercase block">신청 종목 ({successInfo.joins?.length}개)</span>
              <div className="space-y-1.5 mt-1">
                {successInfo.joins.map((join: JoinItem, i: number) => (
                  <div key={i} className="text-xs text-white/80 flex justify-between bg-[#161a16] px-3 py-1.5 rounded border border-white/5">
                    <span>• {join.contestCategoryTitle}</span>
                    <span className="text-accent font-bold font-mono">{join.contestGradeTitle}</span>
                  </div>
                ))}
              </div>
            </div>

            {successInfo.playerPhotoUrl && (
              <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs">
                <span className="text-white/40">업로드 프로필 사진</span>
                <a 
                  href={successInfo.playerPhotoUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-accent hover:underline font-sans text-xs"
                >
                  등록 사진 확인 ↗
                </a>
              </div>
            )}

            {successInfo.playerService && (
              <div className="border-t border-white/5 pt-2 flex justify-between text-xs text-accent">
                <span>• 무대 전문 사진 촬영 서비스</span>
                <span className="font-bold">신청 완료</span>
              </div>
            )}

            <div className="border-t border-white/10 pt-3.5 flex justify-between items-end">
              <span className="text-xs text-white/60 font-bold">최종 납부 금액</span>
              <span className="text-2xl font-display font-black italic text-accent">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>

          <div className="bg-[#1d1f1d] border border-white/10 rounded-xl p-5 text-left mb-8">
            <h4 className="text-xs font-bold text-accent mb-2.5 flex items-center gap-2 uppercase tracking-wider font-mono">
              <CreditCard className="w-4 h-4" /> 입금 계좌 정보 (무통장)
            </h4>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3.5 text-xs font-mono text-white/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/40">은행명</span>
                <span className="font-bold text-white">{noticeInfo.contestBankName}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-white/40 shrink-0">계좌번호</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-white select-all truncate">{noticeInfo.contestAccountNumber}</span>
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
                <span className="font-bold text-accent">{noticeInfo.contestAccountOwner}</span>
              </div>
            </div>
            {copySuccess && (
              <p className="text-center text-[10px] text-accent mt-2 font-mono">계좌 정보가 클립보드에 복사되었습니다!</p>
            )}
            <p className="text-[10px] text-white/40 mt-2 text-center leading-relaxed">
              * 입금자명은 반드시 선수 본인 이름으로 입금해주시기 바랍니다.<br />
              * 접수 완료 후 48시간 이내에 미입금 시 신청이 자동 보류될 수 있습니다.
            </p>
          </div>

          <div className="text-center text-[10px] text-white/30 mb-8 font-sans">
            프로필 이미지 업로드: {successInfo.playerPhotoUrl ? '✔️ 완료' : 'N/A'}<br />
            접수 내역 보관 저장: {successInfo.d1Saved ? '✔️ 완료' : '❌ 보류'}
            {!successInfo.d1Saved && <span className="block text-red-400 font-bold mt-1">({successInfo.d1Error})</span>}
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-accent hover:bg-white text-black font-black italic tracking-wider py-4 rounded-lg transition-colors uppercase text-sm"
          >
            대회 정보 메인으로 이동
          </button>
        </div>
      </div>
    );
  }

  // 💡 상단 스텝 바 컬럼 구조 동적 생성
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
      if (isValidate) {
        goToStep('joins');
      } else {
        showAlert('인적 정보 필수 항목을 먼저 모두 올바르게 입력해 주세요.', '필수 입력 누락');
      }
    },
    isActive: currentStepId === 'joins',
    isCompleted: activeSteps.indexOf(currentStepId) > activeSteps.indexOf('joins'),
    canClick: isValidate && (hasNotice ? agreedNoticeIds.length >= mandatoryNotices.length : true),
  });
  stepperCols.push({
    id: 'pledge',
    stepNumStr: hasNotice ? 'Step 04' : 'Step 03',
    title: '서약 & 최종 제출',
    onClick: () => {
      if (isValidate && invoiceInfo.joins?.length > 0) {
        goToStep('pledge');
      } else if (!isValidate) {
        showAlert('인적 정보 필수 항목을 먼저 채워주세요.', '필수 입력 누락');
      } else {
        showAlert('최소 한 개 이상의 참가 종목과 세부 체급을 선택해야 합니다.', '신청 종목 미선택');
      }
    },
    isActive: currentStepId === 'pledge' || currentStepId === 'confirm',
    isCompleted: false,
    canClick: isValidate && invoiceInfo.joins?.length > 0 && (hasNotice ? agreedNoticeIds.length >= mandatoryNotices.length : true),
  });

  return (
    <div className="pt-28 pb-24 px-4 md:px-12 max-w-[900px] mx-auto min-h-screen bg-[#0a0a0a]">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <span className="text-[9px] md:text-[10px] text-accent font-bold tracking-wider font-sans">용인특례시보디빌딩협회 공식 접수처</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black mb-3 tracking-tight text-white uppercase">
          공식 대회 <span className="text-accent">참가 신청</span>
        </h1>
        <p className="text-white/60 text-xs md:text-sm font-sans">
          용인특례시보디빌딩협회 공식 대회 및 유소년 선수 등록 플랫폼
        </p>
      </div>

      {/* PREMIUM STEPPER BAR (Flat & Solid Design - Dynamic Columns Layout) */}
      <div 
        ref={stepperRef} 
        className={`grid ${hasNotice ? 'grid-cols-4' : 'grid-cols-3'} mb-12 w-full bg-[#161a16] border border-white/10 rounded-xl overflow-hidden shadow-lg divide-x divide-white/10 scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32`}
      >
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

      {/* CONTEST SPEC CARD (Solid Dark Card Layout) */}
      {noticeInfo && (
        <div className="bg-[#161a16] border border-white/10 rounded-xl p-5 sm:p-6 md:p-8 mb-8 shadow-xl transition-all duration-300 hover:border-accent/30">
          
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
            <div className="flex-1">
              <span className="text-[10px] md:text-xs text-accent font-bold block mb-1">
                {noticeInfo.contestPromoter} • 공식 대회 안내
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-sans tracking-tight text-white leading-tight">
                {noticeInfo.contestTitle}
              </h2>
            </div>
            <button
              onClick={() => handleDownloadFile(noticeInfo.contestCollectionFileLink)}
              className="flex items-center justify-center gap-2 bg-[#1d1f1d] hover:bg-accent hover:text-black text-white w-full md:w-auto px-5 py-3 md:py-2.5 rounded border border-white/10 text-xs md:text-sm font-bold transition-all shrink-0"
            >
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> 공고문 다운로드 (.hwp)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
              <div>
                <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">대회 개최 일시</span>
                <span className="text-xs sm:text-sm font-bold text-white">{noticeInfo.contestDate}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
              <div>
                <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">대회 개최 장소</span>
                <span className="text-xs sm:text-sm font-bold text-white">{noticeInfo.contestLocation}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
              <div>
                <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">접수 참가비</span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  기본 {noticeInfo.contestPriceBasic?.toLocaleString()}원 
                  <span className="text-accent/80 font-normal text-[10px] md:text-xs block mt-0.5">
                    중복출전 +{noticeInfo.contestPriceExtra?.toLocaleString()}원
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {/* 공지 제목 */}
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
                      // 모든 필수 공지 완료 -> 다음 단계인 인적 정보 등록으로 이동
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
                  <User className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
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
                    value={invoiceInfo.playerName}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, playerName: e.target.value })}
                    placeholder="실명 입력"
                    className={`w-full bg-[#0a0a0a] border ${playerValidate.playerName ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all`} 
                  />
                  {playerValidate.playerName && <p className="text-red-400 text-[10px] md:text-xs mt-1">2자 이상의 성명을 입력해주세요.</p>}
                </div>

                {/* 성별 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    선수 성별 <span className="text-accent">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInvoiceInfo({ ...invoiceInfo, playerGender: 'm' })}
                      className={`py-3 md:py-3.5 rounded text-xs md:text-sm font-bold border transition-all ${
                        invoiceInfo.playerGender === 'm'
                          ? 'bg-accent text-black border-accent font-black'
                          : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      남자 (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceInfo({ ...invoiceInfo, playerGender: 'f' })}
                      className={`py-3 md:py-3.5 rounded text-xs md:text-sm font-bold border transition-all ${
                        invoiceInfo.playerGender === 'f'
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
                      value={invoiceInfo.playerBirth}
                      onChange={handleBirthChange}
                      maxLength={10}
                      placeholder="YYYY-MM-DD"
                      className={`w-full bg-[#0a0a0a] border ${playerValidate.playerBirth ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm font-mono transition-all`} 
                    />
                    {getPlayerAge() !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs bg-accent/20 text-accent font-bold px-2 py-0.5 rounded">
                        만 {getPlayerAge()}세
                      </span>
                    )}
                  </div>
                  {playerValidate.playerBirth && <p className="text-red-400 text-[10px] md:text-xs mt-1">생년월일 8자리를 입력해주세요. (예: 1999-12-31)</p>}
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    휴대전화 번호 <span className="text-accent">*</span>
                  </label>
                  <input 
                    type="tel" 
                    value={invoiceInfo.playerTel}
                    onChange={handleTelChange}
                    maxLength={13}
                    placeholder="010-0000-0000"
                    className={`w-full bg-[#0a0a0a] border ${playerValidate.playerTel ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm font-mono transition-all`} 
                  />
                  {playerValidate.playerTel && <p className="text-red-400 text-[10px] md:text-xs mt-1">'010' 포함 올바른 연락처 번호를 입력해주세요.</p>}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    이메일 주소
                  </label>
                  <input 
                    type="email" 
                    value={invoiceInfo.playerEmail}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, playerEmail: e.target.value })}
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
                    value={invoiceInfo.playerGym}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, playerGym: e.target.value })}
                    placeholder="소속 단체명 (없을 시 '무소속' 기재)"
                    className={`w-full bg-[#0a0a0a] border ${playerValidate.playerGym ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all`} 
                  />
                  {playerValidate.playerGym && <p className="text-red-400 text-[10px] md:text-xs mt-1">소속이 없으시다면 '무소속'이라고 작성해주세요.</p>}
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
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
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
                      상반신 정면이 선명한 JPG, PNG, HEIC 파일 (각 최대 30MB)
                    </span>
                    <span className="inline-block bg-[#1d1f1d] hover:bg-accent hover:text-black text-white border border-white/10 px-5 py-2.5 rounded text-[10px] md:text-xs font-bold transition-all text-center">
                      이미지 파일 선택
                    </span>
                    <input 
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

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
                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full border border-white/10 transition-colors"
                            title="삭제"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="w-full mt-2 flex flex-col gap-1 text-center">
                          <p className="text-[10px] text-white/70 truncate w-full px-1" title={photo.file?.name || '기존 사진'}>
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
                              className="mt-1 bg-white/5 hover:bg-accent hover:text-black text-white text-[9px] py-1 px-2 rounded font-bold transition-all border border-white/10"
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
                  value={invoiceInfo.playerText}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, playerText: e.target.value })}
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
                    id="playerService"
                    checked={invoiceInfo.playerService}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, playerService: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-accent bg-black border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="playerService" className="text-xs font-bold text-white block cursor-pointer">
                      무대 전문 사진 촬영 서비스 신청 (선택)
                    </label>
                    <span className="text-[11px] text-white/40 block">공식 미디어 제휴를 통한 고화질 무대 정밀 보정 컷 5장 제공 (+{PHOTO_SERVICE_PRICE.toLocaleString()}원)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoDetailOpen(true)}
                  className="bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-3 py-1.5 rounded text-[10px] font-bold transition-all shrink-0"
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
                    className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center"
                  >
                    이전 단계 (공지사항)
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isValidate) {
                      goToNextStep();
                    } else {
                      showAlert('필수 인적 사항(* 표시)을 올바르게 채워주셔야 다음 단계로 진입하실 수 있습니다.', '필수 입력 누락');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                    isValidate 
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
                    className="flex-1 sm:flex-none text-center bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white text-[10px] px-3.5 py-2.5 rounded font-bold transition-colors"
                  >
                    {chkAllItem ? '성별 맞춤 종목만 보기' : '전체 종목 리스트 보기'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSelections}
                    className="flex-1 sm:flex-none text-center bg-red-950/20 border border-red-900/30 text-red-200 text-[10px] px-3.5 py-2.5 rounded font-bold hover:bg-red-950/40 transition-colors"
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
                  const selectedJoinObj = invoiceInfo.joins.find((j: JoinItem) => j.contestCategoryId === cat.contestCategoryId);
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
                              onChange={(e) => handleCategorySelect(cat.contestCategoryId, cat.contestCategoryTitle, cat.contestCategoryPriceType, e)}
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
                  className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all"
                >
                  이전 단계 (인적 정보)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (invoiceInfo.joins?.length > 0) {
                      goToNextStep();
                    } else {
                      showAlert('최소 1개 이상의 참가 부문 및 체급을 선택하셔야 다음 단계로 가실 수 있습니다.', '신청 종목 미선택');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                    invoiceInfo.joins?.length > 0
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

              {/* REALTIME PRICE SUMMARY (Flat Receipt Design without nested cards) */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-lg relative">
                <div className="bg-white/[0.02] p-4 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] md:text-xs text-white/60 font-bold">참가 신청 영수증</span>
                  <span className="text-[9px] md:text-[10px] text-accent font-mono font-bold">YBBF 접수 시스템</span>
                </div>
                
                <div className="p-6 md:p-8 space-y-4 font-mono text-xs md:text-sm">
                  <div className="flex justify-between items-center text-white/60">
                    <span>기본 출전 참가비</span>
                    <span className="text-white font-bold">
                      {(() => {
                        const joins = invoiceInfo.joins || [];
                        const hasType1 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입1');
                        const hasType2 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입2');
                        
                        let basePrice = Number(noticeInfo?.contestPriceBasic) || 0;
                        if (joins.length > 0) {
                          if (hasType1) {
                            basePrice = Number(noticeInfo?.contestPriceType1) || 0;
                          } else if (hasType2) {
                            basePrice = Number(noticeInfo?.contestPriceType2) || 0;
                          }
                        }
                        return basePrice.toLocaleString();
                      })()} 원
                    </span>
                  </div>

                  {invoiceInfo.joins.length > 1 && (
                    <div className="flex justify-between items-center text-white/60">
                      <span>중복 출전비 ({invoiceInfo.joins.length - 1}개 추가)</span>
                      <span className="text-white font-bold">+{((invoiceInfo.joins.length - 1) * (noticeInfo?.contestPriceExtra || 0)).toLocaleString()} 원</span>
                    </div>
                  )}

                  {invoiceInfo.playerService && (
                    <div className="flex justify-between items-center text-accent/95">
                      <span>📸 프리미엄 무대 고해상도 사진 서비스</span>
                      <span className="font-bold">+{PHOTO_SERVICE_PRICE.toLocaleString()} 원</span>
                    </div>
                  )}

                  {/* 구분선 (영수증 펀칭 라인 모사) */}
                  <div className="border-t border-dashed border-white/10 my-4 pt-4"></div>

                  <div className="flex justify-between items-end">
                    <span className="text-white/60 text-xs md:text-sm font-bold">최종 납부 총액</span>
                    <div className="text-right">
                      <span className="text-2xl md:text-4xl font-display font-black italic text-accent">
                        {totalPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRIVACY POLICY CONSENT (Flat scrollable box without nested card structure) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                  <FileCheck className="w-4 h-4 text-accent" /> 개인정보 수집·이용 및 초상권 사용 동의
                </h3>

                {/* 법적 리스크 방어용 정밀 동의 조항 스크롤러 */}
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
                  className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center"
                >
                  이전 단계 (종목선택)
                </button>

                {isValidate && invoiceInfo.joins?.length > 0 && policyAccepted ? (
                  <button 
                    type="button"
                    onClick={goToNextStep}
                    className="w-full sm:w-auto text-center bg-accent text-black font-black italic text-xs sm:text-sm tracking-widest uppercase px-8 py-3.5 rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(196,255,0,0.2)]"
                  >
                    최종 신청 정보 확인하기
                  </button>
                ) : (
                  <button 
                    type="button"
                    disabled
                    className="w-full sm:w-auto bg-white/5 text-white/30 font-bold text-[11px] sm:text-xs py-3.5 px-6 rounded cursor-not-allowed border border-white/5 text-center flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" /> 개인정보 동의 조항에 동의하셔야 제출 가능합니다.
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: FINAL CHECK (deprecates popup modal) */}
          {currentStepId === 'confirm' && (
            <div className="space-y-8 transition-all duration-300">
              <div className="border-b border-white/10 pb-4 mb-6">
                <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                  <ShieldCheck className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                  <span>{hasNotice ? '5' : '4'}. 참가 신청 정보 최종 확인</span>
                </h3>
                <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">
                  작성하신 신청 정보가 정확한지 다시 한번 최종 검토해 주시기 바랍니다. 제출 후 이름 및 연락처 수정은 관리자 채널을 통해서만 가능합니다.
                </p>
              </div>

              {/* 메인 정보 요약 보드 (이중 카드/패딩 걷어내고 완벽히 플랫하게 정렬) */}
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
                  
                  {/* 인적 사항 그리드 (좌측 3칸) */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:col-span-3 text-xs">
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">선수명</span>
                      <span className="font-bold text-white text-sm md:text-base">{invoiceInfo.playerName}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">성별</span>
                      <span className="font-bold text-white text-sm md:text-base">{invoiceInfo.playerGender === 'm' ? '남자' : '여자'}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">생년월일</span>
                      <span className="font-bold text-white text-sm md:text-base">{invoiceInfo.playerBirth}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">연락처</span>
                      <span className="font-bold text-white text-sm md:text-base">{invoiceInfo.playerTel}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">소속 체육관</span>
                      <span className="font-bold text-white text-sm md:text-base">{invoiceInfo.playerGym || '무소속'}</span>
                    </div>
                  </div>

                  {/* 프로필 이미지 미리보기 (우측 1칸 - PC에서만 border-l 구분선 표시) */}
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
                  </div>
                </div>

                {/* 참가 신청 종목 리스트 */}
                <div className="border-t border-white/5 pt-4">
                  <span className="text-white/50 block text-[11px] md:text-xs font-semibold mb-2">선택 참가 종목 ({invoiceInfo.joins?.length}개 부문)</span>
                  <div className="space-y-1.5 font-sans">
                    {invoiceInfo.joins?.map((join: JoinItem, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-white/80 font-bold text-xs md:text-sm bg-[#0a0a0a] px-3.5 py-2.5 rounded-lg border border-white/5">
                        <span className="break-keep">• {join.contestCategoryTitle}</span>
                        <span className="text-accent text-[11px] md:text-xs whitespace-nowrap bg-accent/5 px-2 py-0.5 rounded border border-accent/20">{join.contestGradeTitle}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 추가 서비스 정보 */}
                {invoiceInfo.playerService && (
                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-accent text-xs font-bold bg-accent/5 -mx-6 md:-mx-10 px-6 md:px-10 py-2.5">
                    <span>📸 프리미엄 고해상도 무대 촬영 서비스 신청</span>
                    <span className="text-white">+{PHOTO_SERVICE_PRICE.toLocaleString()}원</span>
                  </div>
                )}

                {/* 최종 합계 청구액 */}
                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-white/80 text-xs sm:text-sm font-bold">최종 결제 금액</span>
                  <span className="text-xl sm:text-2xl font-black text-accent">{totalPrice.toLocaleString()}원</span>
                </div>
              </div>

              {/* 입금 계좌 정보 (최종 제출 전 사전 고지) */}
              {noticeInfo && (
                <div className="bg-[#1d1f1d] border border-white/10 rounded-xl p-5 text-left mt-6">
                  <h4 className="text-xs font-bold text-accent mb-2.5 flex items-center gap-2 uppercase tracking-wider font-mono">
                    <CreditCard className="w-4 h-4" /> 입금 계좌 정보 (무통장 입금)
                  </h4>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3.5 text-xs font-mono text-white/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">은행명</span>
                      <span className="font-bold text-white">{noticeInfo.contestBankName}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-white/40 shrink-0">계좌번호</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-white select-all truncate">{noticeInfo.contestAccountNumber}</span>
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
                      <span className="font-bold text-accent">{noticeInfo.contestAccountOwner}</span>
                    </div>
                  </div>
                  {copySuccess && (
                    <p className="text-center text-[10px] text-accent mt-2 font-mono">계좌 정보가 클립보드에 복사되었습니다!</p>
                  )}
                  <p className="text-[10px] text-white/40 mt-2 text-center leading-relaxed">
                    * 입금자명은 반드시 신청 선수의 본인 성명으로 입금해 주시기 바랍니다.
                  </p>
                </div>
              )}

              {/* 하단 버튼 2개 */}
              <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center"
                >
                  이전 단계 (서약 및 약관)
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || isPhotoUploading}
                  className="w-full sm:w-auto text-center bg-accent hover:bg-white text-black font-black italic text-xs sm:text-sm tracking-widest uppercase px-8 py-3.5 rounded transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      {isPhotoUploading ? '사진 업로드 중...' : '제출하는 중...'}
                    </>
                  ) : (
                    '최종 참가 신청서 제출'
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
                <div>• 사진 규격: 종목무관 전문 보정본 5컷</div>
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
              className="w-full bg-accent text-black font-bold py-3 rounded text-xs mt-6 uppercase"
            >
              확인
            </button>
          </div>
        </div>
      )}
      */}



      {/* 💡 전광판 연출 데모 모달 (R2 동영상 직접 재생 팝업) */}
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

      {/* 필수 공지사항 모달 오버레이 제거됨 (스텝화 전환 완료) */}

      {/* CUSTOM ALERT DIALOG (MessageBox UI to deprecate system alert) */}
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
              
              <p className="text-xs md:text-sm text-white/85 leading-relaxed break-keep mb-5.5">
                {alertState.message}
              </p>
              
              {alertState.isConfirm ? (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAlertState(prev => ({ ...prev, isOpen: false }));
                      if (alertState.onCancel) alertState.onCancel();
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black py-3 rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {alertState.cancelText || '아니오'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertState(prev => ({ ...prev, isOpen: false }));
                      if (alertState.onConfirm) alertState.onConfirm();
                    }}
                    className="flex-1 bg-accent hover:bg-white text-black font-black py-3 rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {alertState.confirmText || '예'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAlertState(prev => ({ ...prev, isOpen: false }));
                    if (alertState.onConfirm) alertState.onConfirm();
                  }}
                  className="w-full bg-accent hover:bg-white text-black font-black py-3 rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Floating TOP button to scroll to top */}
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-24 right-6 z-[9999] bg-[#1a1c1a]/95 text-accent border border-accent/30 p-3.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-110 flex items-center justify-center group cursor-pointer active:scale-95"
        title="맨 위로 이동"
      >
        <ArrowUp className="w-5.5 h-5.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>

    </div>
  );
}
