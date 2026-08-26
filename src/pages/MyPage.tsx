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

import { formatDisplayDate, PHOTO_SERVICE_PRICE } from '../components/mypage/NoticeComponents';
import { LightboxModal } from '../components/mypage/LightboxModal';
import { LedDemoModal } from '../components/mypage/DemoModals';
import { MyPageProfileSection } from '../components/mypage/MyPageProfileSection';
import { MyPageRegistrationCard } from '../components/mypage/MyPageRegistrationCard';
import { MyPageEditWizard } from '../components/mypage/MyPageEditWizard';
import { MyPagePasswordSection } from '../components/mypage/MyPagePasswordSection';

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, completeAdditionalInfo, logout, isLoading: isAuthLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'password'>('history');
  const [invoices, setInvoices] = useState<RegistrationPayload[]>([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const [profileData, setProfileData] = useState<UserProfile>({
    name: '',
    nickname: '',
    birth: '',
    tel: '',
    gym: '',
    gender: 'm',
    profilePhotoUrl: '',
  });
  
  const [validation, setValidation] = useState({
    name: false,
    birth: false,
    tel: false,
    gym: false
  });

  const [isValid, setIsValid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<RegistrationPayload | null>(null);
  const [editStep, setEditStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [mandatoryNotices, setMandatoryNotices] = useState<MandatoryNotice[]>([]);
  
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [agreedNoticeIds, setAgreedNoticeIds] = useState<string[]>([]);
  const [scrollReadComplete, setScrollReadComplete] = useState(false);
  const [videoWatchedComplete, setVideoWatchedComplete] = useState(false);
  const [imagesViewedComplete, setImagesViewedComplete] = useState(false);

  const [chkAllItem, setChkAllItem] = useState(false);
  const { uploadPlayerPhotoToR2, isUploadingToR2: isPhotoUploading } = useUploadToR2();
  const [isDragActive, setIsDragActive] = useState(false);
  const [photosList, setPhotosList] = useState<{ id: string; file: File | null; url: string }[]>([]);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoDetailOpen, setIsPhotoDetailOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  
  const [preMeasurementStatuses, setPreMeasurementStatuses] = useState<Record<string, { submitted: boolean; data?: any }>>({});
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const showAlert = (message: string, title: string = '안내', onConfirm?: () => void) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const editingValidate = {
    playerName: !editingInvoice?.playerName || editingInvoice.playerName.trim().length < 2,
    playerBirth: !editingInvoice?.playerBirth || !/^\d{4}-\d{2}-\d{2}$/.test(editingInvoice.playerBirth),
    playerTel: !editingInvoice?.playerTel || !/^01[0-9]-\d{3,4}-\d{4}$/.test(editingInvoice.playerTel),
    playerGym: !editingInvoice?.playerGym || editingInvoice.playerGym.trim().length < 1,
  };

  // Load user profile and fetch invoices
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.profile?.name || '',
        nickname: user.profile?.nickname || '',
        birth: user.profile?.birth || '',
        tel: user.profile?.tel || '',
        gym: user.profile?.gym || '',
        gender: user.profile?.gender || '',
        profilePhotoUrl: user.profile?.profilePhotoUrl || '',
      });

      const loadInvoices = async () => {
        setIsInvoicesLoading(true);
        try {
          const data = await getUserInvoices(user.uid);
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

  // Form Validation for profile
  useEffect(() => {
    const isNameInvalid = !profileData.name || profileData.name.trim().length < 2;
    const isBirthInvalid = !profileData.birth || !/^\d{4}-\d{2}-\d{2}$/.test(profileData.birth);
    const isTelInvalid = !profileData.tel || !/^01[0-9]-\d{3,4}-\d{4}$/.test(profileData.tel);
    const isGymInvalid = !profileData.gym || profileData.gym.trim().length < 1;

    setValidation({
      name: isNameInvalid && profileData.name !== '',
      birth: isBirthInvalid && profileData.birth !== '',
      tel: isTelInvalid && profileData.tel !== '',
      gym: isGymInvalid && profileData.gym !== ''
    });

    setIsValid(!isNameInvalid && !isBirthInvalid && !isTelInvalid && !isGymInvalid);
  }, [profileData]);

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
              `${backendUrl}/api/pre-measurement/status?contestId=${encodeURIComponent(inv.contestId)}&playerUid=${encodeURIComponent(user.uid)}`,
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

  // Scroll lock helper
  const requestLockScroll = async () => {
    try {
      document.body.style.overflow = 'hidden';
      if (window.parent && window.parent !== window) {
        window.parent.document.body.style.overflow = 'hidden';
      }
    } catch (e) {}
  };

  const requestUnlockScroll = async () => {
    try {
      document.body.style.overflow = '';
      if (window.parent && window.parent !== window) {
        window.parent.document.body.style.overflow = '';
      }
    } catch (e) {}
  };

  // Demo scroll lock
  useEffect(() => {
    if (isDemoOpen) {
      requestLockScroll();
    } else {
      requestUnlockScroll();
    }
  }, [isDemoOpen]);

  const handleBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 4 && raw.length <= 6) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    setProfileData({ ...profileData, birth: formatted });
  };

  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setProfileData({ ...profileData, tel: formatted });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await completeAdditionalInfo(profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || '프로필 수정 중 오류가 발생했습니다.');
    }
  };

  const handleEditClick = async (inv: RegistrationPayload) => {
    setIsInvoicesLoading(true);
    try {
      let contestData: any = null;
      try {
        contestData = await getContest(inv.contestId);
      } catch (e) {
        console.warn('대회 메타데이터 조회 경고:', e);
      }

      const catListId = contestData?.contestCategorysListId || inv.contestId;
      const gradeListId = contestData?.contestGradesListId || inv.contestId;

      let [categoryData, gradeData, notices] = await Promise.all([
        getCategoryList(catListId),
        getGradeList(gradeListId),
        getMandatoryNotices()
      ]);

      // Fallback: If empty, try fetching using inv.contestId directly
      if ((!categoryData || categoryData.length === 0) && inv.contestId) {
        categoryData = await getCategoryList(inv.contestId);
      }
      if ((!gradeData || gradeData.length === 0) && inv.contestId) {
        gradeData = await getGradeList(inv.contestId);
      }

      setCategories(categoryData || []);
      setGrades(gradeData || []);
      setMandatoryNotices(notices || []);
      
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
        setVideoWatchedComplete(true);
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
      if (window.confirm('이미 입금 확인 완료된 신청입니다. 정보 수정 시 입금확인(입금대기) 상태로 전환되어 재확인이 필요합니다. 계속하시겠습니까?')) {
        handleEditClick(inv);
      }
    } else {
      handleEditClick(inv);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingInvoice(null);
    setPhotosList([]);
  };

  // Filter categories by gender and search keyword
  // 성별/생년월일/chkAllItem 변경 시 종목 필터링 for editing
  useEffect(() => {
    if (!categories.length || !editingInvoice) return;

    const g = (editingInvoice.playerGender || '').toLowerCase();
    const isFemale = g === 'f' || g === '여' || g === '여성' || g === 'female';
    const genderLabel = isFemale ? '여' : '남';

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

    const targetCategories = nonGrandPrixCategories.length > 0 ? nonGrandPrixCategories : categories;

    if (!chkAllItem) {
      const filtered = targetCategories.filter(
        (cat: Category) => cat.contestCategoryGender === genderLabel || cat.contestCategoryGender === '무관' || cat.contestCategoryGender === '공통'
      );
      setFilteredCategories(filtered.length > 0 ? filtered : targetCategories);
    } else {
      setFilteredCategories(targetCategories);
    }
  }, [categories, editingInvoice?.playerGender, chkAllItem]);

  const handleEditBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingInvoice) return;
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 4 && raw.length <= 6) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    setEditingInvoice({ ...editingInvoice, playerBirth: formatted });
  };

  const handleEditTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingInvoice) return;
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setEditingInvoice({ ...editingInvoice, playerTel: formatted });
  };

  const getPlayerAgeForEdit = (): number | null => {
    if (!editingInvoice?.playerBirth || editingInvoice.playerBirth.length !== 10) return null;
    const birthDate = new Date(editingInvoice.playerBirth);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleEditCategorySelect = (
    catId: string, 
    catTitle: string, 
    catPriceType: string, 
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (!editingInvoice) return;
    const val = e.target.value;
    const currentJoins = [...(editingInvoice.joins || [])];
    const existingIndex = currentJoins.findIndex((j) => j.contestCategoryId === catId);

    if (!val) {
      if (existingIndex !== -1) {
        currentJoins.splice(existingIndex, 1);
      }
    } else {
      const [gradeId, gradeTitle] = val.split('|');
      const newJoin: JoinItem = {
        contestCategoryId: catId,
        contestCategoryTitle: catTitle,
        contestCategoryPriceType: catPriceType,
        contestGradeId: gradeId,
        contestGradeTitle: gradeTitle,
      };

      if (existingIndex !== -1) {
        currentJoins[existingIndex] = newJoin;
      } else {
        currentJoins.push(newJoin);
      }
    }

    setEditingInvoice({
      ...editingInvoice,
      joins: currentJoins,
    });
  };

  const handleResetEditSelections = () => {
    if (!editingInvoice) return;
    setEditingInvoice({
      ...editingInvoice,
      joins: [],
    });
  };

  const totalEditPrice = (() => {
    if (!editingInvoice) return 0;
    const joins = editingInvoice.joins || [];
    if (joins.length === 0) return 0;

    const hasType1 = joins.some((j) => j.contestCategoryPriceType === '타입1');
    const hasType2 = joins.some((j) => j.contestCategoryPriceType === '타입2');

    let basePrice = Number(editingInvoice.contestPriceBasic) || 0;
    if (hasType1) {
      basePrice = Number(editingInvoice.contestPriceType1) || 0;
    } else if (hasType2) {
      basePrice = Number(editingInvoice.contestPriceType2) || 0;
    }

    const extraPrice = (joins.length - 1) * (Number(editingInvoice.contestPriceExtra) || 0);
    const photoPrice = editingInvoice.playerService ? PHOTO_SERVICE_PRICE : 0;

    return basePrice + extraPrice + photoPrice;
  })();

  const handleEditFilesSelect = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    const validImageFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
      if (!isImage) {
        showAlert(`${file.name} 파일은 이미지 형식이 아닙니다. (PNG, JPG, JPEG, WEBP, HEIC 등 지원)`, '형식 오류');
        return false;
      }
      if (file.size > 30 * 1024 * 1024) {
        showAlert(`${file.name} 파일 용량이 30MB를 초과합니다.`, '용량 초과');
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) return;

    const newPhotoItems = validImageFiles.map(file => ({
      id: `new_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      file,
      url: URL.createObjectURL(file)
    }));

    setPhotosList(prev => [...prev, ...newPhotoItems]);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleEditFilesSelect(e.target.files);
    }
  };

  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleEditFilesSelect(e.dataTransfer.files);
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

  // Steps handling in Wizard
  const hasNotice = mandatoryNotices && mandatoryNotices.length > 0;
  const activeSteps = hasNotice 
    ? ['notice', 'info', 'joins', 'pledge', 'confirm'] 
    : ['info', 'joins', 'pledge', 'confirm'];
  
  const currentStepId = activeSteps[editStep - 1] || activeSteps[0];

  const goToStep = (stepId: string) => {
    const targetIdx = activeSteps.indexOf(stepId);
    if (targetIdx !== -1) {
      setEditStep(targetIdx + 1);
    }
  };

  const goToNextStep = () => {
    if (editStep < activeSteps.length) {
      setEditStep(prev => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (editStep > 1) {
      setEditStep(prev => prev - 1);
    }
  };

  const handleCloseDemo = async () => {
    await requestUnlockScroll();
    setIsDemoOpen(false);
  };

  const handleCopyAccount = () => {
    if (!editingInvoice?.contestAccountNumber) return;
    navigator.clipboard.writeText(editingInvoice.contestAccountNumber);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleFinalEditSubmit = async () => {
    if (!editingInvoice) return;
    setIsSubmitting(true);
    setError(null);

    const uploadedUrls: string[] = [];
    try {
      for (const item of photosList) {
        if (item.file) {
          try {
            const url = await uploadPlayerPhotoToR2(item.file, 'invoices', true);
            uploadedUrls.push(url);
          } catch (uploadErr: any) {
            throw new Error(`선수 사진 R2 업로드에 실패했습니다: ${uploadErr.message}`);
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
        isPriceCheck: false, // 정보 수정 시 입금 확인 재확인 상태로 전환
        invoiceEdited: true,
        invoiceEditAt: new Date().toISOString(),
      };

      await updateHybridRegistration(editingInvoice.id, payload);
      
      showAlert('대회 참가 신청 정보가 성공적으로 수정되었습니다!', '수정 완료', () => {
        setIsEditing(false);
        setEditingInvoice(null);
        setPhotosList([]);
        if (user) {
          getUserInvoices(user.uid).then(setInvoices);
        }
      });
    } catch (err: any) {
      console.error('수정 제출 오류:', err);
      setError(err.message || '정보 수정 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (!editingValidate.playerName && !editingValidate.playerBirth && !editingValidate.playerTel && !editingValidate.playerGym) {
        goToStep('joins');
      } else {
        showAlert('인적 정보 필수 항목을 먼저 모두 올바르게 입력해 주세요.', '필수 입력 누락');
      }
    },
    isActive: currentStepId === 'joins',
    isCompleted: activeSteps.indexOf(currentStepId) > activeSteps.indexOf('joins'),
    canClick: (!editingValidate.playerName && !editingValidate.playerBirth && !editingValidate.playerTel && !editingValidate.playerGym) && (hasNotice ? agreedNoticeIds.length >= mandatoryNotices.length : true),
  });
  stepperCols.push({
    id: 'pledge',
    stepNumStr: hasNotice ? 'Step 04' : 'Step 03',
    title: '서약 & 최종 제출',
    onClick: () => {
      if ((!editingValidate.playerName && !editingValidate.playerBirth && !editingValidate.playerTel && !editingValidate.playerGym) && (editingInvoice?.joins || []).length > 0) {
        goToStep('pledge');
      } else if (editingValidate.playerName || editingValidate.playerBirth || editingValidate.playerTel || editingValidate.playerGym) {
        showAlert('인적 정보 필수 항목을 먼저 채워주세요.', '필수 입력 누락');
      } else {
        showAlert('최소 한 개 이상의 참가 종목과 세부 체급을 선택해야 합니다.', '신청 종목 미선택');
      }
    },
    isActive: currentStepId === 'pledge' || currentStepId === 'confirm',
    isCompleted: false,
    canClick: (!editingValidate.playerName && !editingValidate.playerBirth && !editingValidate.playerTel && !editingValidate.playerGym) && (editingInvoice?.joins || []).length > 0 && (hasNotice ? agreedNoticeIds.length >= mandatoryNotices.length : true),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24 px-4 flex items-center justify-center">
        <div className="text-center max-w-md bg-[#161a16] border border-white/10 p-8 rounded-2xl">
          <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
          <p className="text-xs text-white/60 mb-6">마이페이지 조회를 위해 먼저 로그인해 주세요.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-accent text-black font-bold py-3 rounded-xl text-xs uppercase"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  // Editing Wizard View
  if (isEditing && editingInvoice) {
    return (
      <>
        <MyPageEditWizard
          editingInvoice={editingInvoice}
          setEditingInvoice={setEditingInvoice}
          hasNotice={hasNotice}
          currentStepId={currentStepId}
          activeSteps={activeSteps}
          stepperCols={stepperCols}
          mandatoryNotices={mandatoryNotices}
          currentNoticeIndex={currentNoticeIndex}
          setCurrentNoticeIndex={setCurrentNoticeIndex}
          agreedNoticeIds={agreedNoticeIds}
          setAgreedNoticeIds={setAgreedNoticeIds}
          scrollReadComplete={scrollReadComplete}
          setScrollReadComplete={setScrollReadComplete}
          videoWatchedComplete={videoWatchedComplete}
          setVideoWatchedComplete={setVideoWatchedComplete}
          imagesViewedComplete={imagesViewedComplete}
          setImagesViewedComplete={setImagesViewedComplete}
          editingValidate={editingValidate}
          handleEditBirthChange={handleEditBirthChange}
          handleEditTelChange={handleEditTelChange}
          getPlayerAgeForEdit={getPlayerAgeForEdit}
          setIsDemoOpen={setIsDemoOpen}
          handleEditDrag={handleEditDrag}
          handleEditDrop={handleEditDrop}
          isDragActive={isDragActive}
          handleEditFileChange={handleEditFileChange}
          photosList={photosList}
          handleRemovePhoto={handleRemovePhoto}
          handleSetRepresentative={handleSetRepresentative}
          setIsPhotoDetailOpen={setIsPhotoDetailOpen}
          goToPrevStep={goToPrevStep}
          goToNextStep={goToNextStep}
          showAlert={showAlert}
          chkAllItem={chkAllItem}
          setChkAllItem={setChkAllItem}
          handleResetEditSelections={handleResetEditSelections}
          filteredCategories={filteredCategories}
          grades={grades}
          handleEditCategorySelect={handleEditCategorySelect}
          totalEditPrice={totalEditPrice}
          policyAccepted={policyAccepted}
          setPolicyAccepted={setPolicyAccepted}
          handleFinalEditSubmit={handleFinalEditSubmit}
          isSubmitting={isSubmitting}
          isPhotoUploading={isPhotoUploading}
          handleCopyAccount={handleCopyAccount}
          copySuccess={copySuccess}
          handleCancelEdit={handleCancelEdit}
          error={error}
        />

        <LedDemoModal
          isOpen={isDemoOpen}
          onClose={handleCloseDemo}
        />

        <LightboxModal
          activeLightboxMedia={activeLightboxMedia}
          onClose={() => setActiveLightboxMedia(null)}
        />
      </>
    );
  }

  // Main MyPage Dashboard View
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-24 px-4 sm:px-6 md:px-12 text-white font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1000px] mx-auto relative">
        
        {/* PROFILE HEADER CARD */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <div 
                onClick={() => setActiveTab('profile')}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent/10 border border-accent/30 overflow-hidden flex items-center justify-center text-accent shrink-0 shadow-inner cursor-pointer relative group"
                title="프로필 사진 수정"
              >
                {user.profile?.profilePhotoUrl || profileData.profilePhotoUrl ? (
                  <img 
                    src={profileData.profilePhotoUrl || user.profile?.profilePhotoUrl} 
                    alt="선수 아바타" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-accent/60" />
                )}
              </div>
              
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {user.profile?.name || '선수님'}
                  </h1>
                  
                  {(user.profile?.nickname || profileData.nickname) && (
                    <span className="text-xs text-accent font-bold font-mono bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
                      @{user.profile?.nickname || profileData.nickname}
                    </span>
                  )}

                  <span className="text-[10px] bg-white/10 border border-white/20 text-white/80 font-bold px-2 py-0.5 rounded font-mono">
                    {user.profile?.gender === 'f' ? '여성' : '남성'}
                  </span>
                </div>

                <p className="text-xs text-white/50 font-mono mb-2">{user.email}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-accent/80" /> {user.profile?.tel || '연락처 미등록'}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-accent/80" /> {user.profile?.gym || '소속 미등록'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/30 text-white/70 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
          </div>
        </div>

        {/* TABS HEADER (3 DEDICATED TABS) */}
        <div className="flex border-b border-white/10 mb-8 font-sans overflow-x-auto">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'history'
                ? 'border-accent text-accent bg-accent/5'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" /> 대회 참가 신청 내역 ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'border-accent text-accent bg-accent/5'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Edit2 className="w-4 h-4" /> 선수 개인 신원 정보 수정
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'password'
                ? 'border-accent text-accent bg-accent/5'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" /> 🔑 비밀번호 변경
          </button>
        </div>

        {/* 1. REGISTRATION HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {isInvoicesLoading ? (
              <div className="py-20 text-center">
                <Loader />
                <p className="text-xs text-white/40 mt-4">참가 신청 내역을 불러오는 중입니다...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-12 text-center">
                <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-base font-bold text-white mb-2">접수된 대회 신청 내역이 없습니다</h3>
                <p className="text-xs text-white/50 mb-6">원하시는 대회를 선택하여 온라인 참가 신청을 진행해 보세요.</p>
                <button
                  onClick={() => navigate('/competition')}
                  className="bg-accent hover:bg-white text-black font-black px-6 py-3 rounded-xl text-xs uppercase transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] inline-flex items-center gap-2 cursor-pointer"
                >
                  대회 신청 목록 보기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {invoices.map((inv) => (
                  <MyPageRegistrationCard
                    key={inv.id}
                    inv={inv}
                    preMeasurementStatuses={preMeasurementStatuses}
                    setActiveLightboxMedia={setActiveLightboxMedia}
                    handleEditClickWithWarning={handleEditClickWithWarning}
                    navigate={navigate}
                    formatDisplayDate={formatDisplayDate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. PROFILE EDIT TAB */}
        {activeTab === 'profile' && (
          <MyPageProfileSection
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            validation={validation}
            isValid={isValid}
            saveSuccess={saveSuccess}
            errorMsg={errorMsg}
            isAuthLoading={isAuthLoading}
            handleBirthChange={handleBirthChange}
            handleTelChange={handleTelChange}
            handleSaveProfile={handleSaveProfile}
          />
        )}

        {/* 3. DEDICATED PASSWORD CHANGE TAB */}
        {activeTab === 'password' && (
          <MyPagePasswordSection user={user} />
        )}

        {/* MODALS */}
        <LedDemoModal
          isOpen={isDemoOpen}
          onClose={handleCloseDemo}
        />

        <LightboxModal
          activeLightboxMedia={activeLightboxMedia}
          onClose={() => setActiveLightboxMedia(null)}
        />

        {/* CUSTOM ALERT MODAL */}
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
                  className="w-full bg-accent hover:bg-white text-black font-black py-3 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-accent/10"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
